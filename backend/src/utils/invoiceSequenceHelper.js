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
    InvoiceModel.find({}).select('invoiceNo').lean()
  ]);

  const defaultPrefix = (customPrefix || seq?.prefix || settings?.invoicePrefix || 'MF/INV/25-26').trim();
  const configuredNext = settings?.nextSequenceNumber !== undefined 
    ? parseInt(settings.nextSequenceNumber, 10) 
    : 10;
  const seqLastNumber = seq?.lastNumber !== undefined ? parseInt(seq.lastNumber, 10) : (configuredNext - 1);

  // 2. Scan all existing invoices to find the true highest assigned number
  let highestExistingNumber = 0;
  for (const inv of (allInvoices || [])) {
    const num = extractTrailingNumber(inv.invoiceNo);
    if (num > highestExistingNumber) {
      highestExistingNumber = num;
    }
  }

  // Next number must be greater than highest existing invoice and sequence pointer, starting at min 10
  let nextNumber = Math.max(seqLastNumber + 1, highestExistingNumber + 1, configuredNext, 10);

  // 3. Format invoice number (e.g. MF/INV/25-26/00010)
  const formatInvNo = (num) => {
    const numStr = String(num).padStart(5, '0');
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
          lastNumber: nextNumber, 
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
    : 10;
  const seqLastNumber = seq?.lastNumber !== undefined ? parseInt(seq.lastNumber, 10) : (configuredNext - 1);

  let highestExistingQuote = 0;
  for (const q of (allQuotes || [])) {
    const num = extractTrailingNumber(q.quotationNo);
    if (num > highestExistingQuote) {
      highestExistingQuote = num;
    }
  }

  let nextNumber = Math.max(seqLastNumber + 1, highestExistingQuote + 1, configuredNext, 10);

  const formatQuoteNo = (num) => {
    const numStr = String(num).padStart(5, '0');
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
    // Advance sequence pointers so quotation and invoice numbers move forward in lockstep
    await InvoiceSequenceModel.findOneAndUpdate(
      { _id: 'singleton' },
      { $set: { lastNumber: nextNumber, prefix: rawPrefix } },
      { upsert: true, new: true }
    );

    await SettingModel.updateMany(
      { key: 'invoice_settings' },
      { $set: { nextSequenceNumber: nextNumber + 1 } }
    );
  }

  return {
    number: nextNumber,
    quotationNo: candidateQuoteNo,
    nextSequenceNumber: nextNumber + 1,
    prefix: quotePrefix
  };
}

module.exports = {
  getNextInvoiceNumber,
  getNextQuotationNumber,
  extractTrailingNumber
};
