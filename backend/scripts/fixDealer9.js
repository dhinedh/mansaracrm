/**
 * Inserts Dealer #9 (MF/INV/DL/25-26/00009) from Sheet3 in clean_invoices.json
 * into both Local Dev DB and Production Atlas DB if missing.
 */
const mongoose = require('mongoose');
const fs = require('fs');

const cleanInvoicesPath = 'C:/Users/mural/.gemini/antigravity/brain/7056d3e8-a857-48d1-910a-3dc347d70bfc/scratch/clean_invoices.json';
const LOCAL_URI = 'mongodb://127.0.0.1:27017/mansara_crm';
const PROD_URI = process.env.PROD_DB_URI;

async function insertDealer9(uri, label) {
  console.log(`\n=== Processing ${label} ===`);
  const conn = await mongoose.createConnection(uri).asPromise();
  const db = conn.db;

  const rawSheets = JSON.parse(fs.readFileSync(cleanInvoicesPath, 'utf8'));
  const sheet3 = rawSheets.find(s => s.sheet === 'Sheet3');
  if (!sheet3) {
    throw new Error('Sheet3 not found in clean_invoices.json');
  }

  const exists9 = await db.collection('invoices').findOne({ invoiceNo: 'MF/INV/DL/25-26/00009' });
  if (!exists9) {
    const tamizhDealer = await db.collection('dealers').findOne({ companyName: /TAMIZH/i });
    const invDate = new Date((sheet3.date || '2026-10-23') + 'T10:00:00.000Z');
    const dueDate = new Date((sheet3.due_date || '2026-11-07') + 'T10:00:00.000Z');

    const invRes = await db.collection('invoices').insertOne({
      invoiceNo: 'MF/INV/DL/25-26/00009',
      invoiceDate: invDate,
      dealerId: tamizhDealer?._id || null,
      storeId: null,
      customerName: 'Tamizh Enterprises',
      customerPhone: '+91-9840012345',
      customerAddress: 'Plot No. 14, 1st Floor, 3rd Main Road, TIIC Industrial Estate, Mugappair West, Chennai - 600037',
      channel: 'B2B',
      subtotal: sheet3.subtotal,
      totalDiscount: 0,
      totalGst: sheet3.total_gst,
      cgst: sheet3.cgst,
      sgst: sheet3.sgst,
      isGstEnabled: true,
      shippingCharges: sheet3.shipping || 0,
      totalAmount: sheet3.total_amount,
      status: 'CLOSED',
      resultStatus: 'COLLECTED',
      isCredit: false,
      dueDate,
      paidAt: invDate,
      invoiceType: 'NORMAL',
      billingReason: 'Historical GST Invoices Import',
      rawItems: sheet3.items,
      createdAt: invDate,
      updatedAt: invDate
    });

    const allProducts = await db.collection('products').find({}).toArray();
    for (const it of sheet3.items) {
      const itClean = it.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchedProd = allProducts.find(p => {
        const pn = (p.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        if (itClean.includes('ragichoco') && pn.includes('ragichoco') && pn.includes('250')) return true;
        if (itClean.includes('milletmagic') && pn.includes('milletmagic') && pn.includes('250')) return true;
        if (itClean.includes('nutrimix') && pn.includes('nutriminix') && pn.includes('250')) return true;
        if (itClean.includes('pirandai') && pn.includes('pirandai')) return true;
        if (itClean.includes('murungai') && (pn.includes('murungai') || pn.includes('moringa'))) return true;
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
    console.log(` ✓ Inserted MF/INV/DL/25-26/00009 | Tamizh Enterprises | ₹${sheet3.total_amount} (${sheet3.items.length} items)`);
  } else {
    console.log(` - MF/INV/DL/25-26/00009 already exists`);
  }

  const b2bList = await db.collection('invoices').find({ channel: 'B2B' }).sort({ invoiceNo: 1 }).toArray();
  const retailCount = await db.collection('invoices').countDocuments({ channel: 'RETAIL' });
  console.log(`\n ${label} Summary: ${b2bList.length} Dealer (B2B) + ${retailCount} Retailer = ${b2bList.length + retailCount} Total`);
  b2bList.forEach(i => console.log(`  ${i.invoiceNo} | ${i.status.padEnd(6)} | ${(i.customerName || '').padEnd(25)} | ₹${i.totalAmount}`));

  await conn.close();
}

(async () => {
  await insertDealer9(LOCAL_URI, 'LOCAL DEV DB');
  if (PROD_URI) {
    await insertDealer9(PROD_URI, 'PRODUCTION ATLAS DB');
  }
  process.exit(0);
})().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
