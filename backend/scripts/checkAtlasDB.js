/**
 * Check production Atlas DB — list databases, invoice counts, sample invoice numbers
 * READ-ONLY — makes NO changes
 */
const mongoose = require('mongoose');

const ATLAS_URI = process.env.PROD_DB_URI;

(async () => {
  if (!ATLAS_URI) {
    console.error('PROD_DB_URI env variable not set');
    process.exit(1);
  }

  console.log('Connecting to Atlas...');
  await mongoose.connect(ATLAS_URI);
  const db = mongoose.connection.db;

  // List all databases
  const admin = db.admin();
  const dbList = await admin.listDatabases();
  console.log('\n=== DATABASES ON ATLAS ===');
  dbList.databases.forEach(d => console.log(' -', d.name, `(${(d.sizeOnDisk/1024).toFixed(1)} KB)`));

  // Check current DB name
  console.log('\n=== CURRENT DB:', db.databaseName, '===');

  // List collections
  const collections = await db.listCollections().toArray();
  console.log('Collections:', collections.map(c => c.name).join(', '));

  // Invoice counts
  const hasInvoices = collections.find(c => c.name === 'invoices');
  if (hasInvoices) {
    const total = await db.collection('invoices').countDocuments();
    const b2b = await db.collection('invoices').countDocuments({ channel: 'B2B' });
    const retail = await db.collection('invoices').countDocuments({ channel: 'RETAIL' });
    console.log('\n=== INVOICE COUNTS ===');
    console.log('Total:', total);
    console.log('B2B:', b2b);
    console.log('RETAIL:', retail);

    // Sample invoice numbers
    console.log('\n=== SAMPLE INVOICE NUMBERS (most recent 10) ===');
    const samples = await db.collection('invoices').find({}).sort({ createdAt: -1 }).limit(10).toArray();
    samples.forEach(i => console.log(' -', i.invoiceNo, '|', i.channel || 'no-channel', '|', i.customerName || i.customer || ''));
  } else {
    console.log('\nNo invoices collection found in this database.');
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
