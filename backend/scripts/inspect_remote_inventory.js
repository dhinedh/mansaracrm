const mongoose = require('mongoose');
const remoteUri = 'mongodb+srv://joypackers60_db_user:EYp8MTlbyeyX7X35@cluster0.rhqubga.mongodb.net/test';

(async () => {
  try {
    const conn = await mongoose.createConnection(remoteUri, { serverSelectionTimeoutMS: 10000 }).asPromise();
    const db = conn.db;
    const inv = await db.collection('company_inventory').find().toArray();
    const prodIds = inv.map(i => i.productId).filter(Boolean);
    const products = await db.collection('products').find({ _id: { '$in': prodIds } }).toArray();
    const prodMap = new Map(products.map(p => [p._id.toString(), p]));

    console.log('Matching Atlas Products for Inventory (' + inv.length + ' items):');
    inv.forEach((item, idx) => {
      const prod = prodMap.get((item.productId || '').toString());
      console.log(`[${idx+1}] ID: ${item._id} | Product: ${prod ? prod.name : 'NO PRODUCT'} | Qty: ${item.quantity} | Unit: ${item.unit || 'Cartons'}`);
    });
    await conn.close();
  } catch(e) {
    console.error('Atlas err:', e.message);
  }
})();
