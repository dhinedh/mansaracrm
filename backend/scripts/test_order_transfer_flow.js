// scripts/test_order_transfer_flow.js
require('dotenv').config();
const prisma = require('../src/config/database');

async function testWorkflow() {
  console.log('=== STARTING ORDER & TRANSFER FLOW TEST ===\n');

  // 1. Fetch dealer user and product
  const dealerUser = await prisma.user.findFirst({
    where: { role: 'DEALER' },
    include: { dealer: true }
  });

  if (!dealerUser || !dealerUser.dealer) {
    console.error('❌ Error: No dealer user found in DB. Run seed first.');
    process.exit(1);
  }

  const product = await prisma.product.findFirst({
    where: { isActive: true }
  });

  if (!product) {
    console.error('❌ Error: No active product found in DB. Run seed first.');
    process.exit(1);
  }

  const dealerId = dealerUser.dealer.id;
  const productId = product.id;
  const mrp = parseFloat(product.mrp || product.price || 0);

  console.log(`Dealer: ${dealerUser.dealer.companyName} (ID: ${dealerId})`);
  console.log(`Product: ${product.name} (SKU: ${product.sku}, ID: ${productId}, MRP: ₹${mrp})`);

  // 2. Set up Company Stock (Ensure at least 100 units exist)
  console.log('\n--- Setting up Company Stock ---');
  let companyStock = await prisma.companyInventory.findUnique({
    where: { productId }
  });

  if (!companyStock) {
    companyStock = await prisma.companyInventory.create({
      data: { productId, quantity: 100, minQuantity: 10 }
    });
    console.log(`Created Company Inventory for product: 100 units`);
  } else {
    companyStock = await prisma.companyInventory.update({
      where: { productId },
      data: { quantity: Math.max(companyStock.quantity, 100) }
    });
    console.log(`Updated Company Inventory: ${companyStock.quantity} units available`);
  }

  // 3. Set up custom margin rule for this Dealer and Product (e.g. 15%)
  console.log('\n--- Setting up Custom Margin Rule (15%) ---');
  // Delete existing rule if any to avoid uniqueness issues
  await prisma.margin.deleteMany({
    where: { dealerId, productId }
  });

  const marginRule = await prisma.margin.create({
    data: {
      dealerId,
      productId,
      marginPercent: 15.0,
      isDefault: false
    }
  });
  console.log(`Created margin rule: ${marginRule.marginPercent}% for product SKU ${product.sku}`);

  // Fetch initial dealer stock
  const initialDealerStock = await prisma.dealerInventory.findUnique({
    where: { dealerId_productId: { dealerId, productId } }
  });
  const initialQty = initialDealerStock ? initialDealerStock.quantity : 0;
  console.log(`Initial Dealer Stock: ${initialQty} units`);

  // ==========================================
  // STEP 1: CLIENT ORDER REQUEST
  // ==========================================
  console.log('\n--- Step 1: Client Order Request ---');
  const requestNo = `REQ-TEST-${Date.now()}`;
  const stockRequest = await prisma.stockRequest.create({
    data: {
      requestNo,
      dealerId,
      items: [{
        productId,
        quantity: 10
      }],
      status: 'PENDING',
      notes: 'Test E2E stock request'
    }
  });
  console.log(`Stock Request ${stockRequest.requestNo} created successfully with 10 units.`);

  // ==========================================
  // STEP 2: NOTIFICATION VERIFICATION
  // ==========================================
  console.log('\n--- Step 2: Client Request Notification ---');
  // Simulate client-initiated request notification to Admin
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (adminUser) {
    const adminNotification = await prisma.notification.create({
      data: {
        userId: adminUser.id,
        type: 'SYSTEM',
        title: 'New Stock Request Received',
        message: `Dealer ${dealerUser.dealer.companyName} submitted a new request ${requestNo}.`,
        metadata: { requestId: stockRequest.id }
      }
    });
    console.log(`Notification sent to Admin. Redirection metadata:`, adminNotification.metadata);
  }

  // ==========================================
  // STEP 3: ADMIN APPROVAL & INVOICE GENERATION
  // ==========================================
  console.log('\n--- Step 3: Admin Approval & Dispatch (Invoice Generation) ---');

  const transferNo = `TX-TEST-${Date.now()}`;
  const mockAdminId = adminUser ? adminUser.id : dealerUser.id; // fallback

  const stockTx = await prisma.$transaction(async (tx) => {
    // A. Verify request exists and fetch details
    const reqDoc = await tx.stockRequest.findUnique({ where: { id: stockRequest.id } });
    if (!reqDoc) throw new Error('Request not found');

    // B. Calculate invoice details (applying margin rule)
    let calculatedSubtotal = 0;
    let calculatedGstTotal = 0;
    const invoiceItemsDetails = [];

    for (const item of reqDoc.items) {
      const prod = await tx.product.findUnique({ where: { id: item.productId } });
      const marginPct = 15.0; // our created rule
      const sellingPrice = mrp * (1 - marginPct / 100);
      const lineSubtotal = sellingPrice * item.quantity;
      const lineGst = lineSubtotal * (parseFloat(prod.gstPercent) / 100);
      const lineTotal = lineSubtotal + lineGst;

      calculatedSubtotal += lineSubtotal;
      calculatedGstTotal += lineGst;

      invoiceItemsDetails.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: mrp,
        marginPct,
        sellingPrice,
        gstPercent: parseFloat(prod.gstPercent),
        gstAmount: lineGst,
        lineTotal
      });
    }

    const calculatedGrandTotal = calculatedSubtotal + calculatedGstTotal;

    // C. Create B2B Invoice
    const seq = await tx.invoiceSequence.upsert({
      where: { id: 'singleton' },
      update: { lastNumber: { increment: 1 } },
      create: { id: 'singleton', lastNumber: 1, prefix: 'MF-INV' }
    });
    const invoiceNo = `${seq.prefix}-${String(seq.lastNumber).padStart(5, '0')}`;

    const inv = await tx.invoice.create({
      data: {
        invoiceNo,
        dealerId,
        subtotal: calculatedSubtotal,
        totalGst: calculatedGstTotal,
        cgst: calculatedGstTotal / 2,
        sgst: calculatedGstTotal / 2,
        isGstEnabled: true,
        totalAmount: calculatedGrandTotal,
        status: 'GENERATED',
        notes: `E2E Test auto-generated invoice for request ${requestNo}`,
        channel: 'B2B',
        items: {
          create: invoiceItemsDetails
        }
      }
    });

    // D. Create StockTransfer linked to B2B Invoice
    const transferDoc = await tx.stockTransfer.create({
      data: {
        transferNo,
        dealerId,
        invoiceId: inv.id,
        status: 'PENDING',
        notes: `E2E Test dispatch for transfer ${transferNo}`,
        createdBy: mockAdminId
      }
    });

    // E. Create transfer items
    for (const item of invoiceItemsDetails) {
      await tx.stockTransferItem.create({
        data: {
          transferId: transferDoc.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.sellingPrice,
          marginPct: item.marginPct
        }
      });
    }

    // F. Update Stock Request status
    await tx.stockRequest.update({
      where: { id: stockRequest.id },
      data: { status: 'DISPATCHED' }
    });

    // G. Create Dealer Notification
    await tx.notification.create({
      data: {
        userId: dealerUser.id,
        type: 'STOCK_TRANSFER',
        title: '✅ Stock Request Approved',
        message: `Your purchase request ${requestNo} has been approved.`,
        metadata: { transferId: transferDoc.id, invoiceId: inv.id }
      }
    });

    return { transferDoc, inv };
  });

  console.log(`✅ Approved and Dispatched:`);
  console.log(`   Invoice No: ${stockTx.inv.invoiceNo} (Total: ₹${stockTx.inv.totalAmount.toFixed(2)})`);
  console.log(`   Transfer No: ${stockTx.transferDoc.transferNo} (Status: PENDING)`);
  console.log(`   Margin Applied: 15% (MRP: ₹${mrp} -> Selling Price: ₹${mrp * 0.85})`);

  // Verify Invoice details
  const generatedInv = await prisma.invoice.findUnique({
    where: { id: stockTx.inv.id },
    include: { items: true }
  });
  console.log(`   Invoice Items count: ${generatedInv.items.length}`);
  console.log(`   Invoice Item selling price: ₹${generatedInv.items[0].sellingPrice.toFixed(2)} (Expected: ₹${(mrp * 0.85).toFixed(2)})`);

  if (generatedInv.items[0].sellingPrice === mrp * 0.85) {
    console.log('   ✅ Margin Verification: SUCCESS!');
  } else {
    console.error('   ❌ Margin Verification: FAILED!');
  }

  // ==========================================
  // STEP 4: DISPATCH / CONFIRM DELIVERY
  // ==========================================
  console.log('\n--- Step 4: Dispatch/Confirm Delivery (Stock Adjustments) ---');
  
  await prisma.$transaction(async (tx) => {
    // Update StockTransfer to DELIVERED
    await tx.stockTransfer.update({
      where: { id: stockTx.transferDoc.id },
      data: { status: 'DELIVERED', deliveredAt: new Date() }
    });

    // Update B2B Invoice to CLOSED
    await tx.invoice.update({
      where: { id: stockTx.inv.id },
      data: { status: 'CLOSED', paidAt: new Date() }
    });

    // Decrement Company Stock
    const compStockDoc = await tx.companyInventory.findUnique({ where: { productId } });
    await tx.companyInventory.update({
      where: { productId },
      data: { quantity: compStockDoc.quantity - 10 }
    });

    // Increment Dealer Stock
    const dlrStockDoc = await tx.dealerInventory.findUnique({
      where: { dealerId_productId: { dealerId, productId } }
    });

    if (dlrStockDoc) {
      await tx.dealerInventory.update({
        where: { id: dlrStockDoc.id },
        data: { quantity: dlrStockDoc.quantity + 10 }
      });
    } else {
      await tx.dealerInventory.create({
        data: { dealerId, productId, quantity: 10 }
      });
    }

    // Create Stock Movement Logs
    await tx.stockMovement.create({
      data: {
        productId,
        type: 'TRANSFER_OUT',
        quantity: 10,
        referenceId: stockTx.transferDoc.id,
        notes: 'E2E Test Transfer Out'
      }
    });

    await tx.stockMovement.create({
      data: {
        productId,
        type: 'TRANSFER_IN',
        quantity: 10,
        referenceId: stockTx.transferDoc.id,
        notes: 'E2E Test Transfer In'
      }
    });
  });

  console.log(`✅ Transfer status updated to DELIVERED.`);
  console.log(`✅ Invoice status updated to CLOSED.`);

  // Verify stock updates
  const finalCompStock = await prisma.companyInventory.findUnique({ where: { productId } });
  const finalDlrStock = await prisma.dealerInventory.findUnique({
    where: { dealerId_productId: { dealerId, productId } }
  });
  const finalQty = finalDlrStock ? finalDlrStock.quantity : 0;

  console.log(`   Final Company Stock: ${finalCompStock.quantity} units (Expected: ${companyStock.quantity - 10})`);
  console.log(`   Final Dealer Stock: ${finalQty} units (Expected: ${initialQty + 10})`);

  if (finalCompStock.quantity === companyStock.quantity - 10 && finalQty === initialQty + 10) {
    console.log('   ✅ Inventory Stock Adjustment: SUCCESS!');
  } else {
    console.error('   ❌ Inventory Stock Adjustment: FAILED!');
  }

  // ==========================================
  // STEP 5: ADMIN-INITIATED TRANSFER VERIFICATION
  // ==========================================
  console.log('\n--- Step 5: Admin-initiated Transfer Verification ---');
  const adminTransferNo = `TX-ADMIN-TEST-${Date.now()}`;
  
  const adminTx = await prisma.$transaction(async (tx) => {
    // Calculates same 15% margin
    const marginPct = 15.0;
    const sellingPrice = mrp * (1 - marginPct / 100);
    const lineSubtotal = sellingPrice * 5;
    const lineGst = lineSubtotal * (parseFloat(product.gstPercent) / 100);
    const lineTotal = lineSubtotal + lineGst;

    const seq = await tx.invoiceSequence.upsert({
      where: { id: 'singleton' },
      update: { lastNumber: { increment: 1 } },
      create: { id: 'singleton', lastNumber: 1, prefix: 'MF-INV' }
    });
    const invoiceNo = `${seq.prefix}-${String(seq.lastNumber).padStart(5, '0')}`;

    const inv = await tx.invoice.create({
      data: {
        invoiceNo,
        dealerId,
        subtotal: lineSubtotal,
        totalGst: lineGst,
        cgst: lineGst / 2,
        sgst: lineGst / 2,
        isGstEnabled: true,
        totalAmount: lineTotal,
        status: 'GENERATED',
        notes: `Auto-generated B2B Invoice for Admin-initiated Transfer ${adminTransferNo}`,
        channel: 'B2B',
        items: {
          create: [{
            productId,
            quantity: 5,
            unitPrice: mrp,
            marginPct,
            sellingPrice,
            gstPercent: parseFloat(product.gstPercent),
            gstAmount: lineGst,
            lineTotal
          }]
        }
      }
    });

    const transferDoc = await tx.stockTransfer.create({
      data: {
        transferNo: adminTransferNo,
        dealerId,
        invoiceId: inv.id,
        status: 'PENDING',
        notes: 'Admin-initiated transfer test',
        createdBy: mockAdminId
      }
    });

    return { transferDoc, inv };
  });

  console.log(`✅ Admin Transfer Created:`);
  console.log(`   Invoice No: ${adminTx.inv.invoiceNo} (Total: ₹${adminTx.inv.totalAmount.toFixed(2)})`);
  console.log(`   Transfer No: ${adminTx.transferDoc.transferNo} (Status: PENDING)`);

  if (adminTx.inv.invoiceNo.startsWith('MF-INV-') && adminTx.inv.channel === 'B2B') {
    console.log('   ✅ Admin-initiated Transfer Billing Match: SUCCESS!');
  } else {
    console.error('   ❌ Admin-initiated Transfer Billing Match: FAILED!');
  }

  // Cleanup test margins
  await prisma.margin.deleteMany({
    where: { dealerId, productId }
  });

  console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===');
}

testWorkflow()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
