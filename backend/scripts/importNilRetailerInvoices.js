/**
 * Imports the 29 empty/₹0 placeholder rows from InvoiceHistoryStore
 * (0009, 0018–0024, 0038, 0040, 0041, 0049, 0050, 0053, 0056, 0062, 0073, 0074, 0076, 0091–0100)
 * with customerName: "Nil", ₹0 totals, and calibrates Retailer sequence to #101.
 */
const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/mansara_crm';
const PROD_URI = process.env.PROD_DB_URI;

const NIL_ENTRIES = [
  { num: 9,   date: '2026-04-03' },
  { num: 18,  date: '2026-04-22' },
  { num: 19,  date: '2026-04-22' },
  { num: 20,  date: '2026-04-22' },
  { num: 21,  date: '2026-04-22' },
  { num: 22,  date: '2026-04-22' },
  { num: 23,  date: '2026-04-22' },
  { num: 24,  date: '2026-04-22' },
  { num: 38,  date: '2026-04-01' },
  { num: 40,  date: '2026-06-16' },
  { num: 41,  date: '2026-06-16' },
  { num: 49,  date: '2026-08-04' },
  { num: 50,  date: '2026-08-04' },
  { num: 53,  date: '2026-08-18' },
  { num: 56,  date: '2026-08-28' },
  { num: 62,  date: '2026-09-16' },
  { num: 73,  date: '2026-10-13' },
  { num: 74,  date: '2026-10-13' },
  { num: 76,  date: '2026-10-15' },
  { num: 91,  date: '2026-11-21' },
  { num: 92,  date: '2026-11-21' },
  { num: 93,  date: '2026-11-21' },
  { num: 94,  date: '2026-11-21' },
  { num: 95,  date: '2026-11-21' },
  { num: 96,  date: '2026-11-21' },
  { num: 97,  date: '2026-11-21' },
  { num: 98,  date: '2026-11-21' },
  { num: 99,  date: '2026-11-21' },
  { num: 100, date: '2026-11-21' }
];

async function applyNilInvoices(uri, label) {
  console.log(`\n=== Processing ${label} ===`);
  const conn = await mongoose.createConnection(uri).asPromise();
  const db = conn.db;

  let inserted = 0;
  let skipped = 0;

  for (const entry of NIL_ENTRIES) {
    const invNo = `MF/INV/RT/25-26/${String(entry.num).padStart(5, '0')}`;
    const exists = await db.collection('invoices').findOne({ invoiceNo: invNo });
    if (exists) {
      skipped++;
      continue;
    }

    const invDate = new Date(entry.date + 'T10:00:00.000Z');
    await db.collection('invoices').insertOne({
      invoiceNo: invNo,
      invoiceDate: invDate,
      dealerId: null,
      storeId: null,
      customerName: 'Nil',
      customerPhone: '',
      customerAddress: '',
      channel: 'RETAIL',
      subtotal: 0,
      totalDiscount: 0,
      totalGst: 0,
      cgst: 0,
      sgst: 0,
      isGstEnabled: true,
      shippingCharges: 0,
      totalAmount: 0,
      status: 'CLOSED',
      resultStatus: 'COLLECTED',
      isCredit: false,
      dueDate: invDate,
      paidAt: invDate,
      invoiceType: 'NORMAL',
      billingReason: 'Historical Retail Store Invoices Import (Nil)',
      rawItems: [],
      createdAt: invDate,
      updatedAt: invDate
    });
    inserted++;
  }

  // Calibrate Retailer sequence to 100 -> next 101
  await db.collection('invoice_sequence').updateOne(
    { _id: 'singleton' },
    {
      $set: {
        lastRetailerInvoiceNumber: 100,
        lastNumber: 100,
        lastInvoiceNumber: 100,
        updatedAt: new Date()
      }
    }
  );
  await db.collection('settings').updateMany(
    { key: 'invoice_settings' },
    {
      $set: {
        nextRetailerInvoiceNumber: 101,
        updatedAt: new Date()
      }
    }
  );

  const total = await db.collection('invoices').countDocuments();
  const dealerCount = await db.collection('invoices').countDocuments({ channel: 'B2B' });
  const retailCount = await db.collection('invoices').countDocuments({ channel: 'RETAIL' });

  console.log(`Inserted: ${inserted} Nil invoices | Skipped: ${skipped}`);
  console.log(`${label} Counts -> Total: ${total} | Dealer (B2B): ${dealerCount} | Retailer: ${retailCount}`);
  console.log(`Next Retailer Invoice calibrated to: MF/INV/RT/25-26/00101 (#101)`);

  await conn.close();
}

(async () => {
  await applyNilInvoices(LOCAL_URI, 'LOCAL DEV DB');
  if (PROD_URI) {
    await applyNilInvoices(PROD_URI, 'PRODUCTION ATLAS DB');
  }
  process.exit(0);
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
