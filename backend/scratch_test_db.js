const prisma = require('./src/config/database');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

(async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 1. Get an approved dealer
    const dealer = await mongoose.model('Dealer').findOne();
    if (!dealer) {
      console.log('No dealer found in DB! Seed the DB first.');
      return;
    }
    console.log('Using dealer:', dealer.companyName, 'ID:', dealer._id.toString());

    // 2. Get a product
    const product = await mongoose.model('Product').findOne();
    if (!product) {
      console.log('No product found in DB! Seed the DB first.');
      return;
    }
    console.log('Using product:', product.name, 'ID:', product._id.toString());

    // 3. Create a stock transfer (which will run createStockTransfer controller logic)
    const transferNo = `TX-TEST-${Date.now()}`;
    const calculatedSubtotal = 100;
    const calculatedGstTotal = 5;
    const calculatedGrandTotal = 105;

    const invoiceItemsDetails = [{
      productId: product._id.toString(),
      quantity: 10,
      unitPrice: 10,
      marginPct: 0,
      sellingPrice: 10,
      gstPercent: 5,
      gstAmount: 0.5,
      lineTotal: 10.5
    }];

    console.log('Creating test B2B invoice and stock transfer...');
    
    // Auto-generate invoice
    const seq = await prisma.invoiceSequence.upsert({
      where: { id: 'singleton' },
      update: { lastNumber: { increment: 1 } },
      create: { id: 'singleton', lastNumber: 1, prefix: 'MF-INV' }
    });
    const invoiceNo = `${seq.prefix}-${String(seq.lastNumber).padStart(5, '0')}`;

    const inv = await prisma.invoice.create({
      data: {
        invoiceNo,
        dealerId: dealer._id.toString(),
        subtotal: calculatedSubtotal,
        totalGst: calculatedGstTotal,
        cgst: calculatedGstTotal / 2,
        sgst: calculatedGstTotal / 2,
        isGstEnabled: true,
        totalAmount: calculatedGrandTotal,
        status: 'GENERATED',
        notes: `Test Auto-generated B2B Invoice for Transfer ${transferNo}`,
        channel: 'B2B',
        items: {
          create: invoiceItemsDetails
        }
      }
    });

    console.log('Created invoice:', inv.invoiceNo, 'ID:', inv.id);
    
    // Now fetch the created invoice using findUnique with includes
    console.log('Fetching invoice with includes...');
    const fetchedInv = await prisma.invoice.findUnique({
      where: { id: inv.id },
      include: {
        store: true,
        dealer: {
          include: { user: true }
        },
        items: {
          include: { product: true }
        }
      }
    });

    console.log('Fetched Invoice Items:', JSON.stringify(fetchedInv.items, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
})();
