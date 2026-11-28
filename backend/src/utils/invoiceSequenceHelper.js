// src/utils/invoiceSequenceHelper.js
const mongoose = require('mongoose');

/**
 * Extracts any trailing integer number from an invoice or quotation reference string.
 * e.g. "MF/INV/DL/25-26/00010" -> 10, "MF/INV/RT/25-26/00001" -> 1, "MF/INV/DC/25-26/00001" -> 1
 */
function extractTrailingNumber(str) {
  if (!str || typeof str !== 'string') return 0;
  let clean = str.replace(/-R\d+$/i, '').trim();
  // Strip trailing financial year segments like /25-26, /26-27, /2025-2026, /2026 so they are not mistaken for sequential numbers
  clean = clean.replace(/\/(2[4-9]-\d{2}|20\d{2}-20\d{2}|20\d{2})$/i, '').trim();
  const match = clean.match(/(\d+)(?!.*\d)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num < 10000000) return num;
  }
  return 0;
}

/**
 * Normalizes input category or channel into one of: 'DL' (Dealer), 'RT' (Retailer), 'DC' (Customer).
 */
function normalizeCategory(val) {
  const s = String(val || '').toUpperCase().trim();
  if (s.includes('RT') || s.includes('RETAIL') || s.includes('STORE')) return 'RT';
  if (s.includes('DC') || s.includes('CUST') || s.includes('B2C') || s.includes('DIRECT') || s.includes('WEBSITE') || s.includes('ECOM')) return 'DC';
  return 'DL'; // Default is Dealer
}

/**
 * Calculates and optionally commits the next continuous Invoice Number for:
 * - Dealer:   MF/INV/DL/25-26/XXXXX
 * - Retailer: MF/INV/RT/25-26/XXXXX
 * - Customer: MF/INV/DC/25-26/XXXXX
 */
async function getNextInvoiceNumber({ commit = true, customPrefix = null, category = 'DL', type = null, channel = null } = {}) {
  const SettingModel = mongoose.model('Setting');
  const InvoiceSequenceModel = mongoose.model('InvoiceSequence');
  const InvoiceModel = mongoose.model('Invoice');

  const cat = normalizeCategory(category || type || channel);

  // 1. Fetch current settings and sequence records
  const [settings, seq, allInvoices] = await Promise.all([
    SettingModel.findOne({ key: 'invoice_settings' }),
    InvoiceSequenceModel.findById('singleton'),
    InvoiceModel.find({}).select('invoiceNo sequenceNumber channel').lean()
  ]);

  let defaultPrefix = '';
  if (customPrefix && customPrefix.trim()) {
    defaultPrefix = customPrefix.trim();
  } else if (cat === 'RT') {
    defaultPrefix = seq?.retailerPrefix || settings?.retailerInvoicePrefix || 'MF/INV/RT/25-26';
  } else if (cat === 'DC') {
    defaultPrefix = seq?.customerPrefix || settings?.customerInvoicePrefix || 'MF/INV/DC/25-26';
  } else {
    defaultPrefix = seq?.dealerPrefix || seq?.prefix || settings?.dealerInvoicePrefix || settings?.invoicePrefix || 'MF/INV/DL/25-26';
  }

  // Sanitize prefix to avoid /ON/ or missing parts
  defaultPrefix = defaultPrefix.replace(/\/ON\//gi, '/INV/');

  // 2. Scan existing invoices to find the highest number in this category
  let highestExistingNumber = 0;
  const token = `/${cat}/`;

  for (const inv of (allInvoices || [])) {
    const invNo = inv.invoiceNo || '';
    if (invNo.includes(token) || (cat === 'DL' && !invNo.includes('/RT/') && !invNo.includes('/DC/') && !invNo.includes('/RET/'))) {
      const num = extractTrailingNumber(invNo);
      if (num > highestExistingNumber && num < 100000) {
        highestExistingNumber = num;
      }
    }
  }

  let seqLast = 0;
  if (cat === 'DL') {
    seqLast = (seq?.lastDealerInvoiceNumber !== undefined && seq.lastDealerInvoiceNumber < 100000)
      ? parseInt(seq.lastDealerInvoiceNumber, 10)
      : ((seq?.lastInvoiceNumber !== undefined && seq.lastInvoiceNumber < 100000) ? parseInt(seq.lastInvoiceNumber, 10) : 14);
  } else if (cat === 'RT') {
    seqLast = (seq?.lastRetailerInvoiceNumber !== undefined && seq.lastRetailerInvoiceNumber < 100000)
      ? parseInt(seq.lastRetailerInvoiceNumber, 10)
      : 3;
  } else if (cat === 'DC') {
    seqLast = (seq?.lastCustomerInvoiceNumber !== undefined && seq.lastCustomerInvoiceNumber < 100000)
      ? parseInt(seq.lastCustomerInvoiceNumber, 10)
      : 0;
  }

  const baseline = (cat === 'DL') ? 15 : ((cat === 'RT') ? 4 : 1);
  let nextNumber = Math.max(highestExistingNumber + 1, seqLast + 1, baseline);

  // 3. Format invoice number with 5-digit padding (e.g. MF/INV/DL/25-26/00015)
  const formatInvNo = (num) => {
    const numStr = String(num).padStart(5, '0');
    return (defaultPrefix.endsWith('/') || defaultPrefix.endsWith('-'))
      ? `${defaultPrefix}${numStr}`
      : `${defaultPrefix}/${numStr}`;
  };

  let candidateInvoiceNo = formatInvNo(nextNumber);

  // Guard against any duplicate collision in database
  while (await InvoiceModel.findOne({ invoiceNo: candidateInvoiceNo })) {
    nextNumber++;
    candidateInvoiceNo = formatInvNo(nextNumber);
  }

  // 4. Atomically commit if requested
  if (commit) {
    const updateSeq = {
      updatedAt: new Date()
    };
    const updateSettings = {
      updatedAt: new Date()
    };

    if (cat === 'DL') {
      updateSeq.lastDealerInvoiceNumber = nextNumber;
      updateSeq.lastInvoiceNumber = nextNumber;
      updateSeq.dealerPrefix = defaultPrefix;
      updateSeq.prefix = defaultPrefix;
      updateSettings.nextDealerInvoiceNumber = nextNumber + 1;
      updateSettings.nextSequenceNumber = nextNumber + 1;
      updateSettings.dealerInvoicePrefix = defaultPrefix;
      updateSettings.invoicePrefix = defaultPrefix;
    } else if (cat === 'RT') {
      updateSeq.lastRetailerInvoiceNumber = nextNumber;
      updateSeq.retailerPrefix = defaultPrefix;
      updateSettings.nextRetailerInvoiceNumber = nextNumber + 1;
      updateSettings.retailerInvoicePrefix = defaultPrefix;
    } else if (cat === 'DC') {
      updateSeq.lastCustomerInvoiceNumber = nextNumber;
      updateSeq.customerPrefix = defaultPrefix;
      updateSettings.nextCustomerInvoiceNumber = nextNumber + 1;
      updateSettings.customerInvoicePrefix = defaultPrefix;
    }

    await InvoiceSequenceModel.findOneAndUpdate(
      { _id: 'singleton' },
      { $set: updateSeq },
      { upsert: true, new: true }
    );

    await SettingModel.updateMany(
      { key: 'invoice_settings' },
      { $set: updateSettings }
    );
  }

  return {
    category: cat,
    number: nextNumber,
    invoiceNo: candidateInvoiceNo,
    nextSequenceNumber: nextNumber + 1,
    prefix: defaultPrefix
  };
}

/**
 * Calculates and optionally commits the next continuous Quotation Number.
 * e.g. "MF/QN/25-26/00015", "MF/QN/25-26/00016", ...
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

  const formattedQuotePrefix = (customPrefix && customPrefix.trim()) ? customPrefix.trim() : 'MF/QN/25-26';

  const configuredNext = settings?.nextQuotationNumber !== undefined 
    ? parseInt(settings.nextQuotationNumber, 10) 
    : 14;
  const seqLastQuoteNumber = (seq?.lastQuotationNumber !== undefined && seq.lastQuotationNumber < 100000)
    ? parseInt(seq.lastQuotationNumber, 10)
    : (configuredNext - 1);

  let highestExistingNumber = 13;
  for (const q of (allQuotes || [])) {
    const num = extractTrailingNumber(q.quotationNo);
    if (num > highestExistingNumber && num < 100000) {
      highestExistingNumber = num;
    }
  }

  let nextNumber = Math.max(highestExistingNumber + 1, seqLastQuoteNumber + 1, configuredNext, 14);

  const formatQuoteNo = (num) => {
    const numStr = String(num).padStart(5, '0');
    return (formattedQuotePrefix.endsWith('/') || formattedQuotePrefix.endsWith('-'))
      ? `${formattedQuotePrefix}${numStr}`
      : `${formattedQuotePrefix}/${numStr}`;
  };

  let candidateQuoteNo = formatQuoteNo(nextNumber);

  while (await QuotationModel.findOne({ quotationNo: candidateQuoteNo, status: 'APPROVED' })) {
    nextNumber++;
    candidateQuoteNo = formatQuoteNo(nextNumber);
  }

  if (commit) {
    await InvoiceSequenceModel.findOneAndUpdate(
      { _id: 'singleton' },
      { $set: { lastQuotationNumber: nextNumber } },
      { upsert: true, new: true }
    );
    await SettingModel.updateMany(
      { key: 'invoice_settings' },
      { $set: { nextQuotationNumber: nextNumber + 1 } }
    );
  }

  return {
    number: nextNumber,
    quotationNo: candidateQuoteNo,
    nextQuotationNumber: nextNumber + 1,
    prefix: formattedQuotePrefix
  };
}

/**
 * Explicitly advances the sequence number pointer by 1.
 */
async function advanceSequenceNumber({ minTarget = null, prefix = null, category = 'DL', isInvoice = false } = {}) {
  const SettingModel = mongoose.model('Setting');
  const InvoiceSequenceModel = mongoose.model('InvoiceSequence');
  const cat = normalizeCategory(category);

  if (isInvoice) {
    const nextInv = await getNextInvoiceNumber({ commit: true, customPrefix: prefix, category: cat });
    return {
      category: cat,
      nextSequenceNumber: nextInv.nextSequenceNumber,
      formattedNumber: nextInv.invoiceNo,
      invoiceNo: nextInv.invoiceNo,
      prefix: nextInv.prefix
    };
  } else {
    const nextQuote = await getNextQuotationNumber({ commit: true, customPrefix: prefix });
    return {
      nextSequenceNumber: nextQuote.nextQuotationNumber,
      nextQuotationNumber: nextQuote.nextQuotationNumber,
      formattedNumber: nextQuote.quotationNo,
      quotationNo: nextQuote.quotationNo,
      prefix: nextQuote.prefix
    };
  }
}

module.exports = {
  getNextInvoiceNumber,
  getNextQuotationNumber,
  extractTrailingNumber,
  advanceSequenceNumber,
  normalizeCategory
};
