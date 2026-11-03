const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function removeRawInventory() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/mansara_crm');
    const col = mongoose.connection.db.collection('company_inventory');

    const all = await col.find({}).toArray();
    const raw = all.filter(i => {
      const cat = (i.category || '').toLowerCase().trim();
      return cat !== 'finished goods' && cat !== 'end product' && cat !== 'finished goods (prepared)';
    });

    console.log(`Found ${raw.length} raw material inventory records.`);

    // 1. Save safety backup
    const backupPath = path.join(__dirname, 'raw_inventory_backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(raw, null, 2), 'utf-8');
    console.log(`Safety backup written to: ${backupPath}`);

    // 2. Delete raw material inventory records
    const rawIds = raw.map(r => r._id);
    const delRes = await col.deleteMany({ _id: { $in: rawIds } });
    console.log(`Successfully deleted ${delRes.deletedCount} items.`);

    // 3. Confirm remaining
    const remaining = await col.countDocuments({});
    console.log(`Remaining company_inventory records: ${remaining}`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error removing raw inventory:', err);
    process.exit(1);
  }
}

removeRawInventory();
