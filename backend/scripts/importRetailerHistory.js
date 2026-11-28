/**
 * backend/scripts/importRetailerHistory.js
 * 
 * Imports complete Retailer Store invoice history from InvoiceHistory.xlsx (InvoiceHistoryStore).
 * 1. Synchronizes all unique retail stores into the stores collection.
 * 2. Ensures all product SKUs exist in the product catalog.
 * 3. Imports invoice #00001 (Agni Super Market) + 69 retailer invoices (#00002 to #00090).
 * 4. Calibrates retailer sequence counter to #91.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const cleanStorePath = 'C:/Users/mural/.gemini/antigravity/brain/7056d3e8-a857-48d1-910a-3dc347d70bfc/scratch/clean_store_invoices.json';
const cleanInvoicesPath = 'C:/Users/mural/.gemini/antigravity/brain/7056d3e8-a857-48d1-910a-3dc347d70bfc/scratch/clean_invoices.json';

const SKU_MAP = {
  'MD-RM-250': 'MF-RAGI-CHO-250',
  'MD-NM-250': 'MF-NUTR-MGM-250',
  'PM-CL-250': 'MF-URAD-CLA-250',
  'PM-SP-250': 'MF-URAD-SNP-250',
  'PM-MM-250': 'MF-URAD-MIL-250',
  'PM-DL-250': 'MF-URAD-PRE-250',
  'PM-BD-250': 'MF-BLAC-DEL-250',
  'IP-TR-100': 'MF-IDLY-TRA-100',
  'IP-MF-100': 'MF-IDLY-MIL-100',
  'RM-HP-100': 'MF-RICE-POD-100',
  'RM-MV-100': 'MF-RICE-MOR-100',
  'RM-PP-100': 'MF-RICE-PIR-100',
  'RM-KS-100': 'MF-RICE-CUR-100',
  'RM-KA-100': 'MF-RICE-COR-100',
  'PM-CL-100': 'MF-URAD-CLA-100',
  'PM-SP-100': 'MF-URAD-SNP-100',
  'PM-MM-100': 'MF-URAD-MIL-100',
  'PM-DL-100': 'MF-URAD-PRE-100',
  'PM-BD-100': 'MF-BLAC-DEL-100',
  'RAW-KAV-1000': 'MF-MIL-KAV-1000',
  'RAE-KAV-500': 'MF-MIL-KAV-500',
  'MW-BP-100': 'MF-MIL-WAF-100',
  'MD-RM-100': 'MF-RAGI-CHO-100',
  'MD-NM-100': 'MF-NUTR-MGM-100',
  'SAMPLES': 'MF-SMP-100'
};

async function run() {
  const mongoUri = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/mansara_crm';
  console.log(`Connecting to: ${mongoUri}`);
  await mongoose.connect(mongoUri);

  const db = mongoose.connection.db;

  // 1. Ensure missing products
  console.log('\n--- Step 1: Checking and creating missing products ---');
  const categories = await db.collection('categories').find({}).toArray();
  const defaultCatId = categories[0]?._id;
  const milletCatId = categories.find(c => c.name.toLowerCase().includes('millet'))?._id || defaultCatId;

  const newProducts = [
    { name: 'Mansara Sample Pack (100g)', sku: 'MF-SMP-100', price: 100, mrp: 100, hsn: '1904', catId: defaultCatId },
    { name: 'Ragi Choco Malt (100g)', sku: 'MF-RAGI-CHO-100', price: 120, mrp: 120, hsn: '1904', catId: defaultCatId },
    { name: 'Nutriminix – Multi Grain Health Mix (100g)', sku: 'MF-NUTR-MGM-100', price: 100, mrp: 100, hsn: '1904', catId: defaultCatId },
    { name: 'Millet Bites / Waffle Mix (100g)', sku: 'MF-MIL-WAF-100', price: 150, mrp: 150, hsn: '1904', catId: milletCatId },
    { name: 'Black Kavuni Rice Raw (500g)', sku: 'MF-MIL-KAV-500', price: 75, mrp: 100, hsn: '1006', catId: milletCatId }
  ];

  for (const np of newProducts) {
    const existing = await db.collection('products').findOne({ sku: np.sku });
    if (!existing) {
      await db.collection('products').insertOne({
        name: np.name,
        sku: np.sku,
        price: np.price,
        originalPrice: np.mrp,
        gstPercent: 5,
        hsnCode: np.hsn,
        categoryId: np.catId,
        unit: 'PCS',
        cartonSize: 24,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Created product: ${np.name} (${np.sku})`);
    }
  }

  const allProducts = await db.collection('products').find({}).toArray();
  const productBySku = {};
  allProducts.forEach(p => {
    productBySku[p.sku] = p;
  });

  // 2. Parse retail store invoices JSON
  const rawStoreInvoices = JSON.parse(fs.readFileSync(cleanStorePath, 'utf8'));
  console.log(`\nLoaded ${rawStoreInvoices.length} invoices from clean_store_invoices.json`);

  // 3. Synchronize retail stores in stores collection
  console.log('\n--- Step 2: Synchronizing retail stores ---');
  const storeNames = new Set(rawStoreInvoices.map(i => i.customer_name));
  storeNames.add('Agni Super Market');
  storeNames.add('Venster Super Market');

  const storeMap = {}; // name -> store _id

  for (const rawName of storeNames) {
    const cleanName = rawName.trim();
    let store = await db.collection('stores').findOne({
      name: new RegExp('^' + cleanName + '$', 'i')
    });

    if (!store) {
      const sRes = await db.collection('stores').insertOne({
        name: cleanName,
        dealerId: null,
        address: 'Chennai, Tamil Nadu',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600077',
        phone: '+91-9840000000',
        classification: 'RETAIL',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      store = { _id: sRes.insertedId, name: cleanName };
      console.log(`Created new retail store: ${cleanName}`);
    }
    storeMap[cleanName] = store._id;
  }

  // 4. Purge existing retail invoices to avoid duplication
  console.log('\n--- Step 3: Clearing previous retail invoices ---');
  const existingRetailInvs = await db.collection('invoices').find({
    $or: [
      { channel: 'RETAIL' },
      { invoiceNo: /^MF\/INV\/RT\// }
    ]
  }).toArray();

  const retailInvIds = existingRetailInvs.map(i => i._id);
  if (retailInvIds.length > 0) {
    await db.collection('invoice_items').deleteMany({ invoiceId: { $in: retailInvIds } });
    await db.collection('invoices').deleteMany({ _id: { $in: retailInvIds } });
    console.log(`Purged ${retailInvIds.length} previous retail invoices and their items.`);
  }

  // 5. Import the 3 primary Retailer invoices: Agni, Garuda, Venster (MF/RET/25-26/00001 to 00003)
  console.log('\n--- Step 4: Importing 3 primary retailer invoices (XXX1, XXX2, XXX3) ---');
  let insertedCount = 0;
  let itemsCount = 0;

  const rawSheets = JSON.parse(fs.readFileSync(cleanInvoicesPath, 'utf8'));
  const primaryRetailSheets = [
    { sheet: 'AGNI', invNo: 'MF/RET/25-26/00001', cust: 'Agni Super Market', storeMatch: 'Agni Super Market', phone: '+91-9841100001' },
    { sheet: 'GARUDA', invNo: 'MF/RET/25-26/00002', cust: 'Garuda Super Market', storeMatch: 'Garuda Super Market', phone: '+91-9841100002' },
    { sheet: 'VENSTER', invNo: 'MF/RET/25-26/00003', cust: 'Venster Super Market', storeMatch: 'Venster Super Market', phone: '+91-9342400879' }
  ];

  for (const pri of primaryRetailSheets) {
    const sData = rawSheets.find(s => s.sheet === pri.sheet);
    if (!sData) {
      console.warn(`Warning: Sheet ${pri.sheet} not found!`);
      continue;
    }

    const storeRec = await db.collection('stores').findOne({ name: new RegExp(pri.storeMatch, 'i') });
    const storeId = storeRec?._id || storeMap[pri.cust] || null;
    const invDate = new Date('2026-03-26T10:00:00.000Z');
    const dueDate = new Date('2026-04-09T10:00:00.000Z');

    const priDoc = {
      invoiceNo: pri.invNo,
      invoiceDate: invDate,
      dealerId: null,
      storeId: storeId,
      customerName: pri.cust,
      customerPhone: pri.phone,
      customerAddress: sData.customer_address || 'Chennai, Tamil Nadu - 600077',
      channel: 'RETAIL',
      subtotal: sData.subtotal,
      totalDiscount: 0,
      totalGst: sData.total_gst || 0,
      cgst: (sData.cgst || (sData.total_gst || 0) / 2),
      sgst: (sData.sgst || (sData.total_gst || 0) / 2),
      isGstEnabled: true,
      shippingCharges: 0,
      totalAmount: sData.total_amount,
      status: 'CLOSED',
      resultStatus: 'COLLECTED',
      isCredit: false,
      dueDate: dueDate,
      paidAt: invDate,
      invoiceType: 'NORMAL',
      billingReason: 'Historical Retail Store Invoices Import',
      rawItems: sData.items,
      createdAt: invDate,
      updatedAt: invDate
    };

    const pRes = await db.collection('invoices').insertOne(priDoc);
    const pInvoiceId = pRes.insertedId;
    insertedCount++;

    for (const it of sData.items) {
      const p = allProducts.find(prod => {
        const prodClean = prod.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const itClean = it.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return prodClean.includes(itClean) || itClean.includes(prodClean);
      }) || allProducts.find(prod => prod.name.toLowerCase().includes('porridge mix'));

      await db.collection('invoice_items').insertOne({
        invoiceId: pInvoiceId,
        productId: p?._id || null,
        productName: it.name,
        name: it.name,
        quantity: it.quantity || 1,
        unit: 'PCS',
        unitPrice: it.rate,
        sellingPrice: it.rate,
        gstPercent: 5,
        gstAmount: Math.round((it.amount * 0.05 / 1.05) * 100) / 100,
        lineTotal: it.amount
      });
      itemsCount++;
    }
    console.log(`✓ Imported ${pri.invNo} | 2026-03-26 | ${pri.cust.padEnd(25)} | ₹${priDoc.totalAmount.toFixed(2).padStart(8)} (${sData.items.length} items)`);
  }

  // 6. Import all 69 invoices from clean_store_invoices.json
  for (const inv of rawStoreInvoices) {
    const storeId = storeMap[inv.customer_name] || null;
    const invDate = new Date(inv.date + 'T10:00:00.000Z');
    const dueDate = new Date(invDate.getTime() + 14 * 86400000);

    const invoiceDoc = {
      invoiceNo: inv.inv_no,
      invoiceDate: invDate,
      dealerId: null,
      storeId: storeId,
      customerName: inv.customer_name,
      customerPhone: '+91-9840000000',
      customerAddress: 'Chennai, Tamil Nadu - 600077',
      channel: 'RETAIL',
      subtotal: inv.subtotal,
      totalDiscount: 0,
      totalGst: inv.gst,
      cgst: Math.round((inv.gst / 2) * 100) / 100,
      sgst: Math.round((inv.gst / 2) * 100) / 100,
      isGstEnabled: true,
      shippingCharges: 0,
      totalAmount: inv.total,
      status: 'CLOSED',
      resultStatus: 'COLLECTED',
      isCredit: false,
      dueDate: dueDate,
      paidAt: invDate,
      invoiceType: 'NORMAL',
      billingReason: 'Historical Retail Store Invoices Import',
      rawItems: inv.items,
      createdAt: invDate,
      updatedAt: invDate
    };

    const invRes = await db.collection('invoices').insertOne(invoiceDoc);
    const invoiceId = invRes.insertedId;
    insertedCount++;

    for (const it of inv.items) {
      const targetSku = SKU_MAP[it.sku] || it.sku;
      const matchedProd = productBySku[targetSku] || allProducts.find(p => p.sku === targetSku);
      const lineTotal = it.amount;
      const gstAmt = Math.round((lineTotal * 0.05 / 1.05) * 100) / 100;

      await db.collection('invoice_items').insertOne({
        invoiceId: invoiceId,
        productId: matchedProd?._id || null,
        productName: matchedProd?.name || it.sku,
        name: matchedProd?.name || it.sku,
        quantity: it.quantity,
        unit: 'PCS',
        unitPrice: it.unit_price,
        sellingPrice: it.unit_price,
        gstPercent: 5,
        gstAmount: gstAmt,
        lineTotal: lineTotal
      });
      itemsCount++;
    }

    console.log(`✓ Imported ${inv.inv_no.padEnd(23)} | ${inv.date} | ${inv.customer_name.padEnd(26)} | ₹${inv.total.toFixed(2).padStart(9)} (${inv.items.length} items)`);
  }

  console.log(`\nSuccessfully imported ${insertedCount} retailer invoices and ${itemsCount} items.`);

  // 7. Calibrate sequence counters:
  // Dealer: last 14, next 15
  // Retailer: last 90, next 91
  // Customer: last 0, next 1
  // Quotation: last 14, next 15
  console.log('\n--- Step 5: Calibrating continuous sequence counters ---');
  await db.collection('invoice_sequence').findOneAndUpdate(
    { _id: 'singleton' },
    {
      $set: {
        lastNumber: 90,
        lastInvoiceNumber: 90,
        lastDealerInvoiceNumber: 14,
        lastRetailerInvoiceNumber: 90,
        lastCustomerInvoiceNumber: 0,
        lastQuotationNumber: 14,
        prefix: 'MF/INV/DL/25-26',
        dealerPrefix: 'MF/INV/DL/25-26',
        retailerPrefix: 'MF/INV/RT/25-26',
        customerPrefix: 'MF/INV/DC/25-26',
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );

  await db.collection('settings').updateMany(
    { key: 'invoice_settings' },
    {
      $set: {
        nextSequenceNumber: 91,
        nextDealerInvoiceNumber: 15,
        nextRetailerInvoiceNumber: 91,
        nextCustomerInvoiceNumber: 1,
        nextQuotationNumber: 15,
        invoicePrefix: 'MF/INV/DL/25-26',
        dealerInvoicePrefix: 'MF/INV/DL/25-26',
        retailerInvoicePrefix: 'MF/INV/RT/25-26',
        customerInvoicePrefix: 'MF/INV/DC/25-26',
        updatedAt: new Date()
      }
    }
  );

  console.log('Sequence calibration complete:');
  console.log('- Next Dealer Invoice:   MF/INV/DL/25-26/00015 (#15)');
  console.log('- Next Retailer Invoice: MF/INV/RT/25-26/00091 (#91)');
  console.log('- Next Customer Invoice: MF/INV/DC/25-26/00001 (#1)');
  console.log('- Next Quotation:        MF/QN/25-26/00015 (#15)');

  console.log('\n======================================================');
  console.log('🎉 RETAILER HISTORY IMPORT COMPLETED SUCCESSFULLY!   ');
  console.log('======================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
