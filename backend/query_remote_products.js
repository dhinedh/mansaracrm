const mongoose = require('mongoose');

const remoteUri = 'mongodb+srv://joypackers60_db_user:EYp8MTlbyeyX7X35@cluster0.rhqubga.mongodb.net/test';

(async () => {
  try {
    console.log('Connecting to remote MongoDB Atlas...');
    const conn = await mongoose.createConnection(remoteUri).asPromise();
    console.log('✅ Connected!');

    const db = conn.db;
    const products = await db.collection('products').find({ isActive: true }).toArray();
    console.log(`Found ${products.length} active products on Atlas:`);
    products.forEach(p => {
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach(v => {
          console.log(`  - ${p.name} (${v.weight || v.size}): Price: ₹${v.price} | Stock: ${v.stock}`);
        });
      } else {
        console.log(`  - ${p.name}: Price: ₹${p.price} | Stock: ${p.stock}`);
      }
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
})();
