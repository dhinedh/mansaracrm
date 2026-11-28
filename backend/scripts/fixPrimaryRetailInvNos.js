/**
 * Fix the 3 primary retailer invoice numbers:
 * MF/RET/25-26/00001 → MF/INV/RT/25-26/XXX1  (Agni Super Market)
 * MF/RET/25-26/00002 → MF/INV/RT/25-26/XXX2  (Garuda Super Market)
 * MF/RET/25-26/00003 → MF/INV/RT/25-26/XXX3  (Venster Super Market)
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const RENAMES = [
  { from: 'MF/RET/25-26/00001', to: 'MF/INV/RT/25-26/XXX1', name: 'Agni Super Market' },
  { from: 'MF/RET/25-26/00002', to: 'MF/INV/RT/25-26/XXX2', name: 'Garuda Super Market' },
  { from: 'MF/RET/25-26/00003', to: 'MF/INV/RT/25-26/XXX3', name: 'Venster Super Market' },
];

(async () => {
  const mongoUri = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/mansara_crm';
  console.log(`Connecting to: ${mongoUri}`);
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;

  for (const r of RENAMES) {
    const result = await db.collection('invoices').updateOne(
      { invoiceNo: r.from },
      { $set: { invoiceNo: r.to, updatedAt: new Date() } }
    );
    if (result.matchedCount === 0) {
      console.warn(`⚠  NOT FOUND: ${r.from} (${r.name})`);
    } else {
      console.log(`✓  ${r.from}  →  ${r.to}  |  ${r.name}`);
    }
  }

  // Verify
  console.log('\n--- Verification ---');
  const check = await db.collection('invoices')
    .find({ invoiceNo: /^MF\/INV\/RT\/25-26\/XXX/ })
    .sort({ invoiceNo: 1 })
    .toArray();
  check.forEach(i =>
    console.log(`  ${i.invoiceNo}  |  ${i.customerName}  |  ₹${i.totalAmount}`)
  );

  if (check.length === 3) {
    console.log('\n✅ All 3 primary invoice numbers updated successfully!');
  } else {
    console.warn(`\n⚠  Expected 3 matches but found ${check.length}`);
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
