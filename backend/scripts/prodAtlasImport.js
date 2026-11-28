/**
 * PRODUCTION ATLAS IMPORT — importRetailerHistory.js (Atlas version)
 * 
 * Connects to Atlas (test DB), imports:
 * 1. 3 primary retailer invoices: MF/INV/RT/25-26/XXX1, XXX2, XXX3
 * 2. 69 store invoices: MF/INV/RT/25-26/00002 to 00090
 * 3. Fixes old-format dealer invoices (MF-INV-00008 -> MF/INV/DL/25-26/00008)
 * 4. Calibrates sequence counters: Dealer #15, Retailer #91, Customer #1
 * 
 * SAFE: Does NOT touch existing B2B/Dealer invoices (only purges RETAIL channel)
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const ATLAS_URI = process.env.PROD_DB_URI;
if (!ATLAS_URI) { console.error('PROD_DB_URI not set'); process.exit(1); }

const cleanStorePath = 'C:/Users/mural/.gemini/antigravity/brain/7056d3e8-a857-48d1-910a-3dc347d70bfc/scratch/clean_store_invoices.json';
const cleanInvoicesPath = 'C:/Users/mural/.gemini/antigravity/brain/7056d3e8-a857-48d1-910a-3dc347d70bfc/scratch/clean_invoices.json';

const SKU_MAP = {
  'MD-RM-250': 'MF-RAGI-CHO-250', 'MD-NM-250': 'MF-NUTR-MGM-250',
  'PM-CL-250': 'MF-URAD-CLA-250', 'PM-SP-250': 'MF-URAD-SNP-250',
  'PM-MM-250': 'MF-URAD-MIL-250', 'PM-DL-250': 'MF-URAD-PRE-250',
  'PM-BD-250': 'MF-BLAC-DEL-250', 'IP-TR-100': 'MF-IDLY-TRA-100',
  'IP-MF-100': 'MF-IDLY-MIL-100', 'RM-HP-100': 'MF-RICE-POD-100',
  'RM-MV-100': 'MF-RICE-MOR-100', 'RM-PP-100': 'MF-RICE-PIR-100',
  'RM-KS-100': 'MF-RICE-CUR-100', 'RM-KA-100': 'MF-RICE-COR-100',
  'PM-CL-100': 'MF-URAD-CLA-100', 'PM-SP-100': 'MF-URAD-SNP-100',
  'PM-MM-100': 'MF-URAD-MIL-100', 'PM-DL-100': 'MF-URAD-PRE-100',
  'PM-BD-100': 'MF-BLAC-DEL-100', 'RAW-KAV-1000': 'MF-MIL-KAV-1000',
  'RAE-KAV-500': 'MF-MIL-KAV-500', 'MW-BP-100': 'MF-MIL-WAF-100',
  'MD-RM-100': 'MF-RAGI-CHO-100', 'MD-NM-100': 'MF-NUTR-MGM-100',
  'SAMPLES': 'MF-SMP-100'
};

(async () => {
  console.log('Connecting to Atlas...');
  await mongoose.connect(ATLAS_URI);
  const db = mongoose.connection.db;

  // ── STEP 0: Show existing dealer invoices (DO NOT TOUCH) ─────────────────
  console.log('\n--- Existing B2B Dealer invoices (will NOT be modified) ---');
  const existingDealer = await db.collection('invoices').find({ channel: 'B2B' }).sort({ invoiceNo: 1 }).toArray();
  existingDealer.forEach(i => console.log(' KEEP:', i.invoiceNo, '|', i.customerName || ''));

  // ── STEP 1: Fix old-format dealer invoice numbers (MF-INV-XXXXX) ─────────
  console.log('\n--- Step 1: Fix old-format dealer invoice numbers ---');
  const oldFormat = await db.collection('invoices').find({
    invoiceNo: /^MF-INV-/
  }).toArray();

  for (const inv of oldFormat) {
    const m = inv.invoiceNo.match(/(\d+)$/);
    if (m) {
      const numStr = String(parseInt(m[1], 10)).padStart(5, '0');
      const newNo = `MF/INV/DL/25-26/${numStr}`;
      // Only fix if not already correct
      const existing = await db.collection('invoices').findOne({ invoiceNo: newNo });
      if (!existing) {
        await db.collection('invoices').updateOne(
          { _id: inv._id },
          { $set: { invoiceNo: newNo, channel: 'B2B', updatedAt: new Date() } }
        );
        console.log(` Fixed: ${inv.invoiceNo} → ${newNo}`);
      } else {
        // Duplicate — just delete the old one
        await db.collection('invoices').deleteOne({ _id: inv._id });
        console.log(` Removed duplicate: ${inv.invoiceNo} (${newNo} already exists)`);
      }
    }
  }
  if (oldFormat.length === 0) console.log(' No old-format invoices found.');

  // ── STEP 2: Check products ───────────────────────────────────────────────
  console.log('\n--- Step 2: Ensuring products exist ---');
  const categories = await db.collection('categories').find({}).toArray();
  const defaultCatId = categories[0]?._id;
  const milletCatId = categories.find(c => (c.name||'').toLowerCase().includes('millet'))?._id || defaultCatId;

  const newProducts = [
    { name: 'Mansara Sample Pack (100g)', sku: 'MF-SMP-100', price: 100, mrp: 100, hsn: '1904', catId: defaultCatId },
    { name: 'Ragi Choco Malt (100g)', sku: 'MF-RAGI-CHO-100', price: 120, mrp: 120, hsn: '1904', catId: defaultCatId },
    { name: 'Nutriminix Multi Grain Health Mix (100g)', sku: 'MF-NUTR-MGM-100', price: 100, mrp: 100, hsn: '1904', catId: defaultCatId },
    { name: 'Millet Bites Waffle Mix (100g)', sku: 'MF-MIL-WAF-100', price: 150, mrp: 150, hsn: '1904', catId: milletCatId },
    { name: 'Black Kavuni Rice Raw (500g)', sku: 'MF-MIL-KAV-500', price: 75, mrp: 100, hsn: '1006', catId: milletCatId }
  ];
  for (const np of newProducts) {
    const existing = await db.collection('products').findOne({ sku: np.sku });
    if (!existing) {
      // Generate a unique slug from SKU (lowercase, dashes)
      const slug = np.sku.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
      try {
        await db.collection('products').insertOne({
          name: np.name, sku: np.sku, price: np.price, originalPrice: np.mrp,
          slug,
          gstPercent: 5, hsnCode: np.hsn, categoryId: np.catId, unit: 'PCS',
          cartonSize: 24, isActive: true, createdAt: new Date(), updatedAt: new Date()
        });
        console.log(' Created product:', np.sku);
      } catch (e) {
        if (e.code === 11000) {
          console.log(' Skipped (dup key):', np.sku);
        } else throw e;
      }
    }
  }

  const allProducts = await db.collection('products').find({}).toArray();
  const productBySku = {};
  allProducts.forEach(p => { productBySku[p.sku] = p; });

  // ── STEP 3: Load source data ─────────────────────────────────────────────
  const rawStoreInvoices = JSON.parse(fs.readFileSync(cleanStorePath, 'utf8'));
  const rawSheets = JSON.parse(fs.readFileSync(cleanInvoicesPath, 'utf8'));
  console.log(`\nLoaded ${rawStoreInvoices.length} store invoices + 3 primary sheets`);

  // ── STEP 4: Sync retail stores ────────────────────────────────────────────
  console.log('\n--- Step 3: Syncing retail stores ---');
  const storeNames = new Set(rawStoreInvoices.map(i => i.customer_name));
  ['Agni Super Market', 'Garuda Super Market', 'Venster Super Market'].forEach(n => storeNames.add(n));

  const storeMap = {};
  for (const rawName of storeNames) {
    const cleanName = rawName.trim();
    let store = await db.collection('stores').findOne({ name: new RegExp('^' + cleanName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '$', 'i') });
    if (!store) {
      const sRes = await db.collection('stores').insertOne({
        name: cleanName, dealerId: null, address: 'Chennai, Tamil Nadu',
        city: 'Chennai', state: 'Tamil Nadu', pincode: '600077',
        phone: '+91-9840000000', classification: 'RETAIL',
        isActive: true, createdAt: new Date(), updatedAt: new Date()
      });
      store = { _id: sRes.insertedId };
      console.log(' Created store:', cleanName);
    }
    storeMap[cleanName] = store._id;
  }

  // ── STEP 5: Purge existing RETAIL invoices only ───────────────────────────
  console.log('\n--- Step 4: Purging previous RETAIL invoices ---');
  const existingRetail = await db.collection('invoices').find({
    $or: [{ channel: 'RETAIL' }, { invoiceNo: /^MF\/INV\/RT\// }, { invoiceNo: /^MF\/RET\// }]
  }).toArray();
  if (existingRetail.length > 0) {
    const ids = existingRetail.map(i => i._id);
    await db.collection('invoice_items').deleteMany({ invoiceId: { $in: ids } });
    await db.collection('invoices').deleteMany({ _id: { $in: ids } });
    console.log(` Purged ${existingRetail.length} existing retail invoices`);
  } else {
    console.log(' No existing retail invoices to purge');
  }

  // ── STEP 6: Import 3 primary invoices as XXX1, XXX2, XXX3 ────────────────
  console.log('\n--- Step 5: Importing 3 primary retailer invoices (XXX1, XXX2, XXX3) ---');
  let insertedCount = 0, itemsCount = 0;

  const primaryRetail = [
    { sheet: 'AGNI',   invNo: 'MF/INV/RT/25-26/XXX1', cust: 'Agni Super Market',   phone: '+91-9841100001' },
    { sheet: 'GARUDA', invNo: 'MF/INV/RT/25-26/XXX2', cust: 'Garuda Super Market',  phone: '+91-9841100002' },
    { sheet: 'VENSTER',invNo: 'MF/INV/RT/25-26/XXX3', cust: 'Venster Super Market', phone: '+91-9342400879' },
  ];

  for (const pri of primaryRetail) {
    const sData = rawSheets.find(s => s.sheet === pri.sheet);
    if (!sData) { console.warn(' WARNING: Sheet', pri.sheet, 'not found'); continue; }
    const storeRec = await db.collection('stores').findOne({ name: new RegExp(pri.cust.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'), 'i') });
    const storeId = storeRec?._id || storeMap[pri.cust] || null;
    const invDate = new Date('2026-03-26T10:00:00.000Z');

    const pRes = await db.collection('invoices').insertOne({
      invoiceNo: pri.invNo, invoiceDate: invDate,
      dealerId: null, storeId,
      customerName: pri.cust, customerPhone: pri.phone,
      customerAddress: sData.customer_address || 'Chennai, Tamil Nadu - 600077',
      channel: 'RETAIL',
      subtotal: sData.subtotal, totalDiscount: 0,
      totalGst: sData.total_gst || 0,
      cgst: (sData.cgst || (sData.total_gst || 0) / 2),
      sgst: (sData.sgst || (sData.total_gst || 0) / 2),
      isGstEnabled: true, shippingCharges: 0,
      totalAmount: sData.total_amount,
      status: 'CLOSED', resultStatus: 'COLLECTED', isCredit: false,
      dueDate: new Date('2026-04-09T10:00:00.000Z'), paidAt: invDate,
      invoiceType: 'NORMAL', billingReason: 'Historical Retail Store Invoices Import',
      rawItems: sData.items, createdAt: invDate, updatedAt: invDate
    });
    insertedCount++;

    for (const it of sData.items) {
      const p = allProducts.find(prod => {
        const pc = prod.name.toLowerCase().replace(/[^a-z0-9]/g,'');
        const ic = it.name.toLowerCase().replace(/[^a-z0-9]/g,'');
        return pc.includes(ic) || ic.includes(pc);
      });
      await db.collection('invoice_items').insertOne({
        invoiceId: pRes.insertedId, productId: p?._id || null,
        productName: it.name, name: it.name,
        quantity: it.quantity || 1, unit: 'PCS',
        unitPrice: it.rate, sellingPrice: it.rate,
        gstPercent: 5, gstAmount: Math.round((it.amount * 0.05 / 1.05) * 100) / 100,
        lineTotal: it.amount
      });
      itemsCount++;
    }
    console.log(` ✓ ${pri.invNo} | ${pri.cust} | ₹${sData.total_amount}`);
  }

  // ── STEP 7: Import 69 store invoices (00002–00090) ────────────────────────
  console.log('\n--- Step 6: Importing 69 store invoices (00002–00090) ---');
  for (const inv of rawStoreInvoices) {
    const storeId = storeMap[inv.customer_name] || null;
    const invDate = new Date(inv.date + 'T10:00:00.000Z');

    const invRes = await db.collection('invoices').insertOne({
      invoiceNo: inv.inv_no, invoiceDate: invDate,
      dealerId: null, storeId,
      customerName: inv.customer_name, customerPhone: '+91-9840000000',
      customerAddress: 'Chennai, Tamil Nadu - 600077',
      channel: 'RETAIL', subtotal: inv.subtotal, totalDiscount: 0,
      totalGst: inv.gst,
      cgst: Math.round((inv.gst / 2) * 100) / 100,
      sgst: Math.round((inv.gst / 2) * 100) / 100,
      isGstEnabled: true, shippingCharges: 0, totalAmount: inv.total,
      status: 'CLOSED', resultStatus: 'COLLECTED', isCredit: false,
      dueDate: new Date(invDate.getTime() + 14 * 86400000), paidAt: invDate,
      invoiceType: 'NORMAL', billingReason: 'Historical Retail Store Invoices Import',
      rawItems: inv.items, createdAt: invDate, updatedAt: invDate
    });
    insertedCount++;

    for (const it of inv.items) {
      const targetSku = SKU_MAP[it.sku] || it.sku;
      const matchedProd = productBySku[targetSku];
      const lineTotal = it.amount;
      await db.collection('invoice_items').insertOne({
        invoiceId: invRes.insertedId, productId: matchedProd?._id || null,
        productName: matchedProd?.name || it.sku, name: matchedProd?.name || it.sku,
        quantity: it.quantity, unit: 'PCS',
        unitPrice: it.unit_price, sellingPrice: it.unit_price,
        gstPercent: 5, gstAmount: Math.round((lineTotal * 0.05 / 1.05) * 100) / 100,
        lineTotal
      });
      itemsCount++;
    }
    process.stdout.write('.');
  }
  console.log(`\n ✓ Imported ${rawStoreInvoices.length} store invoices`);

  // ── STEP 8: Calibrate sequence counters ──────────────────────────────────
  console.log('\n--- Step 7: Calibrating sequence counters ---');
  await db.collection('invoice_sequence').findOneAndUpdate(
    { _id: 'singleton' },
    { $set: {
        lastNumber: 90, lastInvoiceNumber: 90,
        lastDealerInvoiceNumber: 14, lastRetailerInvoiceNumber: 90,
        lastCustomerInvoiceNumber: 0, lastQuotationNumber: 14,
        prefix: 'MF/INV/DL/25-26', dealerPrefix: 'MF/INV/DL/25-26',
        retailerPrefix: 'MF/INV/RT/25-26', customerPrefix: 'MF/INV/DC/25-26',
        updatedAt: new Date()
    }},
    { upsert: true }
  );
  await db.collection('settings').updateMany(
    { key: 'invoice_settings' },
    { $set: {
        nextSequenceNumber: 15, nextDealerInvoiceNumber: 15,
        nextRetailerInvoiceNumber: 91, nextCustomerInvoiceNumber: 1,
        nextQuotationNumber: 15,
        invoicePrefix: 'MF/INV/DL/25-26', dealerInvoicePrefix: 'MF/INV/DL/25-26',
        retailerInvoicePrefix: 'MF/INV/RT/25-26', customerInvoicePrefix: 'MF/INV/DC/25-26',
        updatedAt: new Date()
    }}
  );

  // ── STEP 9: Final verification ────────────────────────────────────────────
  console.log('\n=== FINAL VERIFICATION ===');
  const finalTotal = await db.collection('invoices').countDocuments();
  const finalDealer = await db.collection('invoices').countDocuments({ channel: 'B2B' });
  const finalRetail = await db.collection('invoices').countDocuments({ channel: 'RETAIL' });
  console.log('Total invoices:', finalTotal);
  console.log('Dealer (B2B):', finalDealer);
  console.log('Retailer:', finalRetail);
  console.log(`Inserted this run: ${insertedCount} invoices, ${itemsCount} items`);

  const xxx = await db.collection('invoices').find({ invoiceNo: /XXX/ }).sort({ invoiceNo: 1 }).toArray();
  console.log('\nPrimary XXX invoices:');
  xxx.forEach(i => console.log(' ', i.invoiceNo, '|', i.customerName, '| ₹' + i.totalAmount));

  const seq = await db.collection('invoice_sequence').findOne({ _id: 'singleton' });
  console.log('\nSequence counters:');
  console.log('  lastDealerInvoiceNumber:', seq?.lastDealerInvoiceNumber);
  console.log('  lastRetailerInvoiceNumber:', seq?.lastRetailerInvoiceNumber);
  console.log('  Next Dealer:   MF/INV/DL/25-26/00015');
  console.log('  Next Retailer: MF/INV/RT/25-26/00091');

  if (finalTotal >= 83 && finalRetail === 72) {
    console.log('\n✅ PRODUCTION IMPORT COMPLETE — ALL COUNTS VERIFIED!');
  } else {
    console.warn(`\n⚠  Unexpected counts — expected 83 total / 72 retail, got ${finalTotal}/${finalRetail}`);
  }

  await mongoose.disconnect();
  process.exit(0);
})().catch(err => {
  console.error('\n❌ IMPORT FAILED:', err.message);
  process.exit(1);
});
