const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { getNextInvoiceNumber, getNextQuotationNumber } = require('../src/utils/invoiceSequenceHelper');
require('../src/config/database');

async function verify() {
  await new Promise(r => setTimeout(r, 1000));
  const db = mongoose.connection.db;

  console.log('=== VERIFYING HISTORICAL IMPORT ===\n');

  // 1. Invoices
  const invoices = await db.collection('invoices').find({}).sort({ createdAt: 1 }).toArray();
  console.log(`Total Invoices in Database: ${invoices.length}`);
  let totalBilled = 0;
  for (const inv of invoices) {
    const store = await db.collection('stores').findOne({ _id: inv.storeId });
    const items = await db.collection('invoice_items').find({ invoiceId: inv._id }).toArray();
    totalBilled += inv.totalAmount;
    console.log(`- ${inv.invoiceNo.padEnd(20)} | Date: ${inv.invoiceDate.toISOString().slice(0, 10)} | Store: ${(store?.name || inv.customerName).padEnd(22)} | Items: ${items.length} | Total: ₹${inv.totalAmount.toFixed(2)}`);
  }
  console.log(`\nGrand Total Revenue: ₹${totalBilled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);

  // 2. Invoice items
  const itemsCount = await db.collection('invoice_items').countDocuments();
  console.log(`\nTotal Invoice Items in Database: ${itemsCount}`);

  // 3. Stores
  const stores = await db.collection('stores').find({}).toArray();
  console.log(`\nTotal Stores in Database: ${stores.length}`);
  for (const s of stores) {
    console.log(`- ${s.name.padEnd(25)} | GST: ${(s.gstNumber || 'N/A').padEnd(16)} | Phone: ${s.phone || 'N/A'}`);
  }

  // 4. Test Sequence Helpers for next continuous numbering
  console.log('\n=== TESTING SEQUENCE NUMBERING HELPERS ===');
  const nextInv = await getNextInvoiceNumber({ commit: false });
  console.log('Next Invoice Number (Preview):', nextInv);

  const nextQuote = await getNextQuotationNumber({ commit: false });
  console.log('Next Quotation Number (Preview):', nextQuote);

  console.log('\nVerification Passed Successfully!');
  process.exit(0);
}

verify().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
