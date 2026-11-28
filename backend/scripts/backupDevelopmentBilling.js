const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function backup() {
  const mongoUri = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/mansara_crm';
  console.log(`Connecting to: ${mongoUri}`);
  await mongoose.connect(mongoUri);

  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const collectionsToBackup = [
    'invoices',
    'quotations',
    'invoice_items',
    'invoice_sequence',
    'settings'
  ];

  const backupSummary = {};

  for (const colName of collectionsToBackup) {
    const data = await mongoose.connection.db.collection(colName).find({}).toArray();
    const filePath = path.join(backupDir, `${colName}_${timestamp}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    backupSummary[colName] = { count: data.length, file: filePath };
    console.log(`Backed up ${data.length} records from ${colName} -> ${filePath}`);
  }

  console.log('\nBackup complete successfully!');
  console.log(JSON.stringify(backupSummary, null, 2));

  await mongoose.disconnect();
  process.exit(0);
}

backup().catch(err => {
  console.error('Backup failed:', err);
  process.exit(1);
});
