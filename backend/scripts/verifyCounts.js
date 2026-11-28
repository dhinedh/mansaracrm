const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

(async () => {
  await mongoose.connect(process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/mansara_crm');
  const db = mongoose.connection.db;

  const total = await db.collection('invoices').countDocuments();
  const dealerCount = await db.collection('invoices').countDocuments({ channel: 'B2B' });
  const retailCount = await db.collection('invoices').countDocuments({ channel: 'RETAIL' });

  console.log('=== INVOICE COUNTS ===');
  console.log('Total Invoices:', total);
  console.log('Dealer (B2B):', dealerCount);
  console.log('Retailer (RETAIL):', retailCount);

  console.log('\n=== PRIMARY 3 RETAILER INVOICES ===');
  const pri = await db.collection('invoices').find({ invoiceNo: /^MF\/RET\// }).sort({ invoiceNo: 1 }).toArray();
  pri.forEach(i => console.log(i.invoiceNo, '|', i.customerName.padEnd(25), '| ₹' + i.totalAmount, '| channel:', i.channel));

  console.log('\n=== FIRST 5 STORE RETAILER INVOICES ===');
  const storeFirst = await db.collection('invoices').find({ invoiceNo: /^MF\/INV\/RT\// }).sort({ invoiceNo: 1 }).limit(5).toArray();
  storeFirst.forEach(i => console.log(i.invoiceNo, '|', i.customerName.padEnd(25), '| ₹' + i.totalAmount, '| channel:', i.channel));

  console.log('\n=== LAST 5 STORE RETAILER INVOICES ===');
  const storeLast = await db.collection('invoices').find({ invoiceNo: /^MF\/INV\/RT\// }).sort({ invoiceNo: -1 }).limit(5).toArray();
  storeLast.reverse().forEach(i => console.log(i.invoiceNo, '|', i.customerName.padEnd(25), '| ₹' + i.totalAmount, '| channel:', i.channel));

  console.log('\n=== SEQUENCE COUNTER ===');
  const seq = await db.collection('invoice_sequence').findOne({ _id: 'singleton' });
  console.log('lastDealerInvoiceNumber:', seq.lastDealerInvoiceNumber);
  console.log('lastRetailerInvoiceNumber:', seq.lastRetailerInvoiceNumber);
  console.log('lastCustomerInvoiceNumber:', seq.lastCustomerInvoiceNumber);

  await mongoose.disconnect();
})();
