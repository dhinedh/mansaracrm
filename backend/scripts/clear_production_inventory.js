const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const remoteUri = 'mongodb+srv://joypackers60_db_user:EYp8MTlbyeyX7X35@cluster0.rhqubga.mongodb.net/test';

async function removeProductionInventory() {
  try {
    console.log('Connecting to production MongoDB Atlas...');
    await mongoose.connect(remoteUri, { serverSelectionTimeoutMS: 15000 });
    const col = mongoose.connection.db.collection('company_inventory');

    const items = await col.find({}).toArray();
    console.log(`Found ${items.length} records in production company_inventory.`);

    // 1. Safety backup
    const backupPath = path.join(__dirname, 'production_inventory_backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(items, null, 2), 'utf-8');
    console.log(`Safety backup written to: ${backupPath}`);

    // 2. Delete all records from company_inventory
    const delRes = await col.deleteMany({});
    console.log(`Successfully deleted ${delRes.deletedCount} items from production.`);

    // 3. Confirm remaining count
    const remaining = await col.countDocuments({});
    console.log(`Remaining production company_inventory count: ${remaining}`);

    await mongoose.disconnect();
    console.log('Done!');
  } catch (err) {
    console.error('Error clearing production inventory:', err);
    process.exit(1);
  }
}

removeProductionInventory();
