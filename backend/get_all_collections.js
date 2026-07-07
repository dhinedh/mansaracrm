const mongoose = require('mongoose');

const localUri = 'mongodb://localhost:27017/mansara';

(async () => {
  try {
    console.log('Connecting to database...');
    const conn = await mongoose.createConnection(localUri).asPromise();
    console.log('🔌 Connected!');

    const db = conn.db;
    const collections = await db.listCollections().toArray();
    console.log('Collections list:');
    collections.forEach(c => console.log(`  - ${c.name}`));

    // Search in users for phone suffix 3695
    console.log('\nSearching for users with phone ending in 3695...');
    const users = await db.collection('users').find({
      $or: [
        { phone: { $regex: '3695' } },
        { whatsapp: { $regex: '3695' } }
      ]
    }).toArray();
    console.log('Found users:', users.length);
    users.forEach(u => {
      console.log(`  - ID: ${u._id} | Name: ${u.name} | Phone: ${u.phone} | Email: ${u.email}`);
      console.log(`  - Cart:`, u.cart);
    });

    // Check tempusers collection if it exists
    const hasTempUsers = collections.some(c => c.name === 'tempusers');
    if (hasTempUsers) {
      console.log('\nSearching in tempusers collection...');
      const tempUsers = await db.collection('tempusers').find({}).toArray();
      console.log(`Found ${tempUsers.length} temp users.`);
      tempUsers.forEach(tu => {
        console.log(`  - ID: ${tu._id} | Name: ${tu.name} | Phone: ${tu.phone} | Email: ${tu.email}`);
      });
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
})();
