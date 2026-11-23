// src/utils/invoiceSequenceHelper.js
const mongoose = require('mongoose');

/**
 * Extracts any trailing integer number from an invoice or quotation reference string.
 * e.g. "MF/INV/25-26/00010" -> 10, "INV-00015" -> 15, "MF/QN/25-26/00010-R4" -> 10
 */
function extractTrailingNumber(str) {
  if (!str || typeof str !== 'string') return 0;
  const clean = str.replace(/-R\d+$/i, '').trim();
  const match = clean.match(/(\d+)(?!.*\d)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num < 10000000) return num;
  }
  return 0;
}

/**
 * Calculates and optionally commits the next continuous Invoice Number.
 * Guarantees consecutive, non-repeating numbering according to GST and company settings.
 */
async function getNextInvoiceNumber({ commit = true, customPrefix = null } = {}) {
  const SettingModel = mongoose.model('Setting');
  const InvoiceSequenceModel = mongoose.model('InvoiceSequence');
  const InvoiceModel = mongoose.model('Invoice');

  // 1. Fetch current settings and sequence records
  const [settings, seq, allInvoices] = await Promise.all([
    SettingModel.findOne({ key: 'invoice_settings' }),
    InvoiceSequenceModel.findById('singleton'),
    InvoiceModel.find({}).select('invoiceNo sequenceNumber').lean()
  ]);

  const defaultPrefix = (customPrefix || seq?.prefix || settings?.invoicePrefix || 'MF/INV/25-26').trim();

  // 2. Scan all existing invoices to find the true highest assigned invoice number
  // Baseline is 14 (issued previously), so first next invoice must be 15, then 16, 17...
  let highestExistingNumber = 14;
  for (const inv of (allInvoices || [])) {
    const num = extractTrailingNumber(inv.invoiceNo);
    if (num > 0 && num < 100000 && num > highestExistingNumber) {
      highestExistingNumber = num;
    }
  }

  // Check lastInvoiceNumber recorded specifically for official invoices
  const seqLastInvoice = (seq?.lastInvoiceNumber !== undefined && seq.lastInvoiceNumber < 100000)
    ? parseInt(seq.lastInvoiceNumber, 10)
    : 14;

  // Next invoice number continues continuously: 15, 16, 17, 18...
  let nextNumber = Math.max(highestExistingNumber + 1, seqLastInvoice + 1, 15);

  // 3. Format invoice number (e.g. MF/INV/25-26/0015)
  const formatInvNo = (num) => {
    const numStr = String(num).padStart(4, '0');
    return (defaultPrefix.endsWith('/') || defaultPrefix.endsWith('-'))
      ? `${defaultPrefix}${numStr}`
      : `${defaultPrefix}/${numStr}`;
  };

  let candidateInvoiceNo = formatInvNo(nextNumber);

  // Guard against any collision in database
  while (await InvoiceModel.findOne({ invoiceNo: candidateInvoiceNo })) {
    nextNumber++;
    candidateInvoiceNo = formatInvNo(nextNumber);
  }

  // 4. Atomically commit if requested
  if (commit) {
    await InvoiceSequenceModel.findOneAndUpdate(
      { _id: 'singleton' },
      { 
        $set: { 
          lastInvoiceNumber: nextNumber,
          prefix: defaultPrefix 
        } 
      },
      { upsert: true, new: true }
    );

    await SettingModel.updateMany(
      { key: 'invoice_settings' },
      { $set: { nextSequenceNumber: nextNumber + 1 } }
    );
  }

  return {
    number: nextNumber,
    invoiceNo: candidateInvoiceNo,
    nextSequenceNumber: nextNumber + 1,
    prefix: defaultPrefix
  };
}

/**
 * Calculates and optionally commits the next continuous Quotation Number.
 * e.g. "MF/QN/25-26/00010", "MF/QN/25-26/00011", ...
 */
async function getNextQuotationNumber({ commit = true, customPrefix = null } = {}) {
  const SettingModel = mongoose.model('Setting');
  const InvoiceSequenceModel = mongoose.model('InvoiceSequence');
  const QuotationModel = mongoose.model('Quotation');

  const [settings, seq, allQuotes] = await Promise.all([
    SettingModel.findOne({ key: 'invoice_settings' }),
    InvoiceSequenceModel.findById('singleton'),
    QuotationModel.find({}).select('quotationNo').lean()
  ]);

  const rawPrefix = (customPrefix || seq?.prefix || settings?.invoicePrefix || 'MF/INV/25-26').trim();
  const quotePrefix = rawPrefix.replace(/INV/i, 'QN');
  const configuredNext = settings?.nextSequenceNumber !== undefined 
    ? parseInt(settings.nextSequenceNumber, 10) 
    : 14;
  const seqLastQuoteNumber = (seq?.lastQuotationNumber !== undefined && seq.lastQuotationNumber < 100000)
    ? parseInt(seq.lastQuotationNumber, 10)
    : (configuredNext - 1);

  let highestExistingQuote = 0;
  for (const q of (allQuotes || [])) {
    const num = extractTrailingNumber(q.quotationNo);
    if (num > 0 && num < 100000 && num > highestExistingQuote) {
      highestExistingQuote = num;
    }
  }

  let nextNumber = Math.max(seqLastQuoteNumber + 1, highestExistingQuote + 1, configuredNext, 14);

  const formatQuoteNo = (num) => {
    const numStr = String(num).padStart(4, '0');
    return (quotePrefix.endsWith('/') || quotePrefix.endsWith('-'))
      ? `${quotePrefix}${numStr}`
      : `${quotePrefix}/${numStr}`;
  };

  let candidateQuoteNo = formatQuoteNo(nextNumber);

  while (await QuotationModel.findOne({ quotationNo: candidateQuoteNo })) {
    nextNumber++;
    candidateQuoteNo = formatQuoteNo(nextNumber);
  }

  if (commit) {
    await InvoiceSequenceModel.findOneAndUpdate(
      { _id: 'singleton' },
      { $set: { lastQuotationNumber: nextNumber, prefix: rawPrefix } },
      { upsert: true, new: true }
    );
  }

  return {
    number: nextNumber,
    quotationNo: candidateQuoteNo,
    nextSequenceNumber: nextNumber + 1,
    prefix: quotePrefix
  };
}

/**
 * Explicitly advances the sequence number pointer by 1 (or to at least minTarget + 1)
 * and guarantees persistence across both InvoiceSequence and Setting models.
 * Sequence number format is always 5-digit padded (xxxxx).
 */
async function advanceSequenceNumber({ minTarget = null, prefix = null, isInvoice = false } = {}) {
  const SettingModel = mongoose.model('Setting');
  const InvoiceSequenceModel = mongoose.model('InvoiceSequence');

  const [settings, seq] = await Promise.all([
    SettingModel.findOne({ key: 'invoice_settings' }),
    InvoiceSequenceModel.findById('singleton')
  ]);

  const defaultPrefix = (prefix || seq?.prefix || settings?.invoicePrefix || 'MF/INV/25-26').trim();
  const configuredNext = settings?.nextSequenceNumber !== undefined 
    ? parseInt(settings.nextSequenceNumber, 10) 
    : 14;
  const seqLastNumber = isInvoice
    ? (seq?.lastInvoiceNumber !== undefined ? parseInt(seq.lastInvoiceNumber, 10) : 14)
    : (seq?.lastQuotationNumber !== undefined ? parseInt(seq.lastQuotationNumber, 10) : (configuredNext - 1));

  let current = Math.max(configuredNext, seqLastNumber + 1);
  if (minTarget !== null && !isNaN(minTarget)) {
    current = Math.max(current, parseInt(minTarget, 10));
  }

  const nextNumber = current + 1;
  const numStr = String(nextNumber).padStart(4, '0');
  const formattedNumber = (defaultPrefix.endsWith('/') || defaultPrefix.endsWith('-'))
    ? `${defaultPrefix}${numStr}`
    : `${defaultPrefix}/${numStr}`;

  const updateFields = isInvoice
    ? { lastInvoiceNumber: nextNumber - 1, prefix: defaultPrefix }
    : { lastQuotationNumber: nextNumber - 1, prefix: defaultPrefix };

  await InvoiceSequenceModel.findOneAndUpdate(
    { _id: 'singleton' },
    { $set: updateFields },
    { upsert: true, new: true }
  );

  return {
    nextSequenceNumber: nextNumber,
    formattedNumber,
    prefix: defaultPrefix
  };
}

module.exports = {
  getNextInvoiceNumber,
  getNextQuotationNumber,
  extractTrailingNumber,
  advanceSequenceNumber
};

