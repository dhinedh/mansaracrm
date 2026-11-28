/**
 * Safely imports missing historical B2B Dealer invoices from local dev DB into Production Atlas.
 * - NEVER overwrites or deletes existing production invoices (e.g., 00008, 00012, 00014).
 * - Syncs missing dealers (e.g. EKAYARS, MIYA INTERNATIONAL) into production dealers collection.
 * - Maps productId by SKU/name in production products collection.
 */
const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/mansara_crm';
const PROD_URI = process.env.PROD_DB_URI;

if (!PROD_URI) {
  console.error('ERROR: PROD_DB_URI environment variable is required.');
  process.exit(1);
}

(async () => {
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  const prodConn = await mongoose.createConnection(PROD_URI).asPromise();

  const localDb = localConn.db;
  const prodDb = prodConn.db;

  console.log('Connected to Local DB and Production Atlas DB.');

  const localB2B = await localDb.collection('invoices').find({ channel: 'B2B' }).sort({ invoiceNo: 1 }).toArray();
  const prodProducts = await prodDb.collection('products').find({}).toArray();
  const localProducts = await localDb.collection('products').find({}).toArray();

  const localProdMap = {};
  localProducts.forEach(p => { localProdMap[String(p._id)] = p; });

  const prodProdBySku = {};
  const prodProdByName = {};
  prodProducts.forEach(p => {
    if (p.sku) prodProdBySku[p.sku.toUpperCase()] = p;
    if (p.name) prodProdByName[p.name.toLowerCase().trim()] = p;
  });

  let inserted = 0;
  let skipped = 0;
  let itemsInserted = 0;

  for (const inv of localB2B) {
    const existsInProd = await prodDb.collection('invoices').findOne({ invoiceNo: inv.invoiceNo });
    if (existsInProd) {
      console.log(`SKIP (already in prod): ${inv.invoiceNo} | ${inv.customerName} | Status: ${existsInProd.status}`);
      skipped++;
      continue;
    }

    // Resolve dealer in prod
    let prodDealerId = null;
    if (inv.dealerId) {
      const localDealer = await localDb.collection('dealers').findOne({ _id: inv.dealerId });
      if (localDealer) {
        let prodDealer = await prodDb.collection('dealers').findOne({
          companyName: new RegExp('^' + localDealer.companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i')
        });
        if (!prodDealer) {
          const newDealerDoc = { ...localDealer };
          delete newDealerDoc._id;
          // Ensure no duplicate userId conflict if unique index exists
          if (newDealerDoc.userId) {
            const existingUserDealer = await prodDb.collection('dealers').findOne({ userId: newDealerDoc.userId });
            if (existingUserDealer) delete newDealerDoc.userId;
          }
          const dRes = await prodDb.collection('dealers').insertOne({
            ...newDealerDoc,
            createdAt: localDealer.createdAt || new Date(),
            updatedAt: new Date()
          });
          prodDealerId = dRes.insertedId;
          console.log(`  Created missing dealer in prod: ${localDealer.companyName}`);
        } else {
          prodDealerId = prodDealer._id;
        }
      }
    }

    const newInvDoc = { ...inv };
    delete newInvDoc._id;
    newInvDoc.dealerId = prodDealerId;
    newInvDoc.storeId = null; // B2B dealer invoices shouldn't show a retail store

    const invRes = await prodDb.collection('invoices').insertOne(newInvDoc);
    const newInvId = invRes.insertedId;
    inserted++;

    // Copy invoice_items
    const localItems = await localDb.collection('invoice_items').find({ invoiceId: inv._id }).toArray();
    for (const it of localItems) {
      const newIt = { ...it };
      delete newIt._id;
      newIt.invoiceId = newInvId;

      // Map productId to prod product
      let matchedProd = null;
      if (it.productId && localProdMap[String(it.productId)]) {
        const lp = localProdMap[String(it.productId)];
        matchedProd = (lp.sku && prodProdBySku[lp.sku.toUpperCase()]) || prodProdByName[(lp.name || '').toLowerCase().trim()];
      }
      if (!matchedProd && (it.productName || it.name)) {
        matchedProd = prodProdByName[(it.productName || it.name).toLowerCase().trim()];
      }
      newIt.productId = matchedProd ? matchedProd._id : null;

      await prodDb.collection('invoice_items').insertOne(newIt);
      itemsInserted++;
    }

    console.log(`✓ Imported ${inv.invoiceNo} | ${inv.customerName} | ₹${inv.totalAmount} (${localItems.length} items)`);
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Inserted: ${inserted} dealer invoices (${itemsInserted} items)`);
  console.log(`Skipped (preserved existing): ${skipped}`);

  const totalProd = await prodDb.collection('invoices').countDocuments();
  const b2bProd = await prodDb.collection('invoices').countDocuments({ channel: 'B2B' });
  const retailProd = await prodDb.collection('invoices').countDocuments({ channel: 'RETAIL' });

  console.log('\n=== PRODUCTION ATLAS COUNTS ===');
  console.log('Total Invoices:', totalProd);
  console.log('Dealer (B2B):', b2bProd);
  console.log('Retailer (RETAIL):', retailProd);

  await localConn.close();
  await prodConn.close();
  process.exit(0);
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
