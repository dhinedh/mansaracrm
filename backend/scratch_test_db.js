const mongoose = require('mongoose');
const prisma = require('./src/config/database');

(async () => {
  try {
    console.log('Connecting to DB...');
    // wait for connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Querying invoices...');
    const invoices = await prisma.invoice.findMany({
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
    
    console.log(`Found ${invoices.length} invoices.`);
    if (invoices.length > 0) {
      const firstInv = invoices[0];
      console.log('Invoice No:', firstInv.invoiceNo);
      console.log('Items Count:', firstInv.items?.length);
      if (firstInv.items && firstInv.items.length > 0) {
        firstInv.items.forEach((item, idx) => {
          console.log(`Item ${idx + 1}:`);
          console.log('  product:', item.product);
          console.log('  productId:', item.productId);
        });
      }
    }
    
    mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
    mongoose.connection.close();
  }
})();
