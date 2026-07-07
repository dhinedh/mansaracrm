const mongoose = require('mongoose');

const remoteUri = 'mongodb+srv://joypackers60_db_user:EYp8MTlbyeyX7X35@cluster0.rhqubga.mongodb.net/test';

(async () => {
  try {
    console.log('Connecting to remote MongoDB Atlas...');
    const conn = await mongoose.createConnection(remoteUri).asPromise();
    console.log('✅ Connected!');

    const db = conn.db;

    // Search in users for phone suffix 3695
    console.log('\nSearching for users with phone or name matching 3695 / deepika...');
    const users = await db.collection('users').find({
      $or: [
        { phone: { $regex: '3695' } },
        { whatsapp: { $regex: '3695' } },
        { email: { $regex: 'deepika', $options: 'i' } },
        { name: { $regex: 'deepika', $options: 'i' } }
      ]
    }).toArray();
    console.log('Found users:', users.length);
    users.forEach(u => {
      console.log(`  - ID: ${u._id}`);
      console.log(`  - Name: ${u.name}`);
      console.log(`  - Phone: ${u.phone}`);
      console.log(`  - Email: ${u.email}`);
      console.log(`  - Cart:`, u.cart);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
})();
