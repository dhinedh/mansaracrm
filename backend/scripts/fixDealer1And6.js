/**
 * Fixes Dealer #1 and #6 in both Local DB and Production Atlas:
 * 1. Inserts MF/INV/DL/25-26/00001 (from Sheet2: Venster Super Market, 22 Jan 2026, ₹747) if missing.
 * 2. Renames MF/INV/DL/25-26/00009 -> MF/INV/DL/25-26/00006 (from tab 0006: Tamizh Enterprises, ₹7,939).
 */
const mongoose = require('mongoose');
const fs = require('fs');

const cleanInvoicesPath = 'C:/Users/mural/.gemini/antigravity/brain/7056d3e8-a857-48d1-910a-3dc347d70bfc/scratch/clean_invoices.json';
const LOCAL_URI = 'mongodb://127.0.0.1:27017/mansara_crm';
const PROD_URI = process.env.PROD_DB_URI;

async function fixDb(uri, label) {
  console.log(`\n=== Processing ${label} ===`);
  const conn = await mongoose.createConnection(uri).asPromise();
  const db = conn.db;

  const rawSheets = JSON.parse(fs.readFileSync(cleanInvoicesPath, 'utf8'));
  const sheet2 = rawSheets.find(s => s.sheet === 'Sheet2');

  // 1. Insert MF/INV/DL/25-26/00001 if missing
  const exists1 = await db.collection('invoices').findOne({ invoiceNo: 'MF/INV/DL/25-26/00001' });
  if (!exists1 && sheet2) {
    let vensterDealer = await db.collection('dealers').findOne({ companyName: /VENSTER/i });
    if (!vensterDealer) {
      const dRes = await db.collection('dealers').insertOne({
        companyName: 'VENSTER SUPER MARKET',
        contactPerson: 'Venster Manager',
        phone: '+91-9342400879',
        email: 'venster@mansaracrm.local',
        gstNumber: '33AKAPA7278E3ZH',
        address: 'Plot No. 12, Front Side, Krishnaveniammal Nagar, Ayyappanthangal',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600056',
        status: 'ACTIVE',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      vensterDealer = { _id: dRes.insertedId, companyName: 'VENSTER SUPER MARKET' };
      console.log(` Created dealer: VENSTER SUPER MARKET`);
    }

    const invDate = new Date('2026-01-22T10:00:00.000Z');
    const dueDate = new Date('2026-02-05T10:00:00.000Z');

    const invRes = await db.collection('invoices').insertOne({
      invoiceNo: 'MF/INV/DL/25-26/00001',
      invoiceDate: invDate,
      dealerId: vensterDealer._id,
      storeId: null,
      customerName: 'Venster Super Market',
      customerPhone: '+91-9342400879',
      customerAddress: 'Plot No. 12, Front Side, Krishnaveniammal Nagar, Ayyappanthangal, Chennai - 600056',
      channel: 'B2B',
      subtotal: sheet2.subtotal,
      totalDiscount: 0,
      totalGst: sheet2.total_gst,
      cgst: sheet2.cgst,
      sgst: sheet2.sgst,
      isGstEnabled: true,
      shippingCharges: 0,
      totalAmount: sheet2.total_amount,
      status: 'CLOSED',
      resultStatus: 'COLLECTED',
      isCredit: false,
      dueDate,
      paidAt: invDate,
      invoiceType: 'NORMAL',
      billingReason: 'Historical GST Invoices Import',
      rawItems: sheet2.items,
      createdAt: invDate,
      updatedAt: invDate
    });

    const allProducts = await db.collection('products').find({}).toArray();
    for (const it of sheet2.items) {
      const itClean = it.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchedProd = allProducts.find(p => {
        const pn = (p.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (itClean.includes('classic') && pn.includes('classic') && !pn.includes('250')) return true;
        if (itClean.includes('salt') && pn.includes('salt') && !pn.includes('250')) return true;
        if (itClean.includes('milletmagic') && pn.includes('milletmagic') && !pn.includes('250')) return true;
        if (itClean.includes('premium') && pn.includes('premium') && !pn.includes('250')) return true;
        if (itClean.includes('blackrice') && pn.includes('blackrice') && !pn.includes('250')) return true;
        return false;
      });

      await db.collection('invoice_items').insertOne({
        invoiceId: invRes.insertedId,
        productId: matchedProd?._id || null,
        productName: it.name,
        name: it.name,
        quantity: it.quantity,
        unit: 'PCS',
        unitPrice: it.rate,
        sellingPrice: it.rate,
        gstPercent: 5,
        gstAmount: Math.round((it.amount * 0.05 / 1.05) * 100) / 100,
        lineTotal: it.amount
      });
    }
    console.log(` ✓ Inserted MF/INV/DL/25-26/00001 | Venster Super Market | ₹747 (${sheet2.items.length} items)`);
  } else {
    console.log(` - MF/INV/DL/25-26/00001 already exists`);
  }

  // 2. Rename MF/INV/DL/25-26/00009 -> MF/INV/DL/25-26/00006
  const inv9 = await db.collection('invoices').findOne({ invoiceNo: 'MF/INV/DL/25-26/00009' });
  const inv6 = await db.collection('invoices').findOne({ invoiceNo: 'MF/INV/DL/25-26/00006' });
  if (inv9 && !inv6) {
    await db.collection('invoices').updateOne(
      { _id: inv9._id },
      { $set: { invoiceNo: 'MF/INV/DL/25-26/00006', updatedAt: new Date() } }
    );
    console.log(` ✓ Renamed MF/INV/DL/25-26/00009 → MF/INV/DL/25-26/00006 | ${inv9.customerName} | ₹${inv9.totalAmount}`);
  } else if (inv6) {
    console.log(` - MF/INV/DL/25-26/00006 already exists`);
  } else {
    console.log(` ⚠ MF/INV/DL/25-26/00009 not found`);
  }

  // Verify B2B list
  const b2bList = await db.collection('invoices').find({ channel: 'B2B' }).sort({ invoiceNo: 1 }).toArray();
  const retailCount = await db.collection('invoices').countDocuments({ channel: 'RETAIL' });
  console.log(`\n ${label} Summary: ${b2bList.length} Dealer (B2B) + ${retailCount} Retailer = ${b2bList.length + retailCount} Total`);
  b2bList.forEach(i => console.log(`  ${i.invoiceNo} | ${i.status.padEnd(6)} | ${(i.customerName || '').padEnd(25)} | ₹${i.totalAmount}`));

  await conn.close();
}

(async () => {
  await fixDb(LOCAL_URI, 'LOCAL DEV DB');
  if (PROD_URI) {
    await fixDb(PROD_URI, 'PRODUCTION ATLAS DB');
  }
  process.exit(0);
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
