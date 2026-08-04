// src/modules/inventory/inventory.controller.js
const prisma = require('../../config/database');

// Get company inventory (Admin only)
exports.getCompanyInventory = async (req, res, next) => {
  try {
    const { category, search, lowStock } = req.query;

    let inventory = await prisma.companyInventory.findMany({
      include: {
        product: {
          include: { category: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Populate default fields for items missing batchId / stockId
    inventory = inventory.map((item, idx) => ({
      ...item.toObject ? item.toObject() : item,
      stockId: item.stockId || `STK-2026-${String(idx + 1).padStart(3, '0')}`,
      batchId: item.batchId || `BATCH-RM-${Date.now().toString().slice(-4)}-${idx + 1}`,
      category: item.category || (item.product?.category?.name || 'Raw Material'),
      unit: item.unit || 'kg',
      storageLocation: item.storageLocation || 'Warehouse 1, Rack A',
      status: item.quantity <= (item.minQuantity || 10) ? 'Low Stock' : (item.status || 'Available'),
      mfgDate: item.mfgDate || item.createdAt || new Date(),
      expiryDate: item.expiryDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
    }));

    if (category && category !== 'All') {
      inventory = inventory.filter(i => i.category === category);
    }

    if (lowStock === 'true') {
      inventory = inventory.filter(i => i.quantity <= i.minQuantity);
    }

    res.json({ success: true, data: inventory, total: inventory.length });
  } catch (error) {
    next(error);
  }
};

// Manual Stock Entry & Multi-Batch Assignment
exports.createStockEntry = async (req, res, next) => {
  try {
    const {
      stockId: customStockId,
      batchId: customBatchId,
      itemName,
      category,
      quantity,
      unit,
      packagingBreakdown,
      mfgDate,
      expiryDate,
      storageLocation,
      status: customStatus,
      minQuantity,
      grnNumber,
      vendorName,
      notes,
      batches
    } = req.body;

    if (!itemName) {
      return res.status(400).json({ success: false, message: 'Item Name is required.' });
    }

    const stockId = customStockId || `STK-2026-${Math.floor(100 + Math.random() * 900)}`;

    const batchList = (batches && Array.isArray(batches) && batches.length > 0) ? batches : [
      {
        batchId: customBatchId || `BATCH-${category === 'Finished Goods' ? 'FG' : (category === 'WIP' ? 'WIP' : 'RM')}-${Date.now().toString().slice(-4)}`,
        quantity: Number(quantity) || 0,
        packagingBreakdown: packagingBreakdown || '',
        mfgDate: mfgDate ? new Date(mfgDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        storageLocation: storageLocation || 'Warehouse 1, Rack A',
        status: customStatus || ((Number(quantity) || 0) <= (Number(minQuantity) || 50) ? 'Low Stock' : 'Available')
      }
    ];

    const createdEntries = [];
    for (const b of batchList) {
      const entry = await prisma.companyInventory.create({
        data: {
          stockId,
          batchId: b.batchId || `BATCH-RM-${Date.now().toString().slice(-4)}`,
          itemName,
          category: category || 'Raw Material',
          quantity: Number(b.quantity) || 0,
          unit: unit || 'kg',
          packagingBreakdown: b.packagingBreakdown || '',
          mfgDate: b.mfgDate ? new Date(b.mfgDate) : new Date(),
          expiryDate: b.expiryDate ? new Date(b.expiryDate) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          storageLocation: b.storageLocation || 'Warehouse 1, Rack A',
          status: b.status || 'Available',
          minQuantity: Number(minQuantity) || 50,
          grnNumber: grnNumber || '',
          vendorName: vendorName || '',
          notes: notes || ''
        }
      });
      createdEntries.push(entry);
    }

    res.status(201).json({
      success: true,
      message: `Successfully saved ${createdEntries.length} batch(es) for Stock ${stockId} (${itemName})!`,
      data: createdEntries
    });
  } catch (error) {
    next(error);
  }
};

// Issue Stock to Production (Operations) & Yield/Scrap Entry
exports.issueToProduction = async (req, res, next) => {
  try {
    const { stockId, issueQuantity, targetProcess, yieldQuantity, scrapQuantity, notes } = req.body;

    const stockItem = await prisma.companyInventory.findFirst({
      where: { OR: [{ id: stockId }, { stockId }] }
    });

    if (!stockItem) {
      return res.status(404).json({ success: false, message: 'Stock entry not found.' });
    }

    const issueQty = Number(issueQuantity) || 0;
    if (stockItem.quantity < issueQty) {
      return res.status(400).json({ success: false, message: `Insufficient stock available (${stockItem.quantity} ${stockItem.unit} remaining).` });
    }

    const newQuantity = stockItem.quantity - issueQty;

    await prisma.companyInventory.update({
      where: { id: stockItem.id },
      data: {
        quantity: newQuantity,
        status: newQuantity <= stockItem.minQuantity ? 'Low Stock' : 'Available'
      }
    });

    // Create WIP Stock Entry for operations if yield or target process specified
    if (targetProcess || yieldQuantity) {
      const wipBatchId = `BATCH-WIP-${Date.now().toString().slice(-4)}`;
      const yieldQty = Number(yieldQuantity) || Math.round(issueQty * 0.95);

      await prisma.companyInventory.create({
        data: {
          stockId: `STK-WIP-${Math.floor(100 + Math.random() * 900)}`,
          batchId: wipBatchId,
          itemName: `${stockItem.itemName} (${targetProcess || 'In Production'})`,
          category: 'WIP',
          quantity: yieldQty,
          unit: stockItem.unit,
          storageLocation: 'Processing Floor, Unit 1',
          status: 'In Production',
          notes: `Issued from ${stockItem.batchId}. Scrap/Wastage: ${scrapQuantity || (issueQty - yieldQty)} ${stockItem.unit}. ${notes || ''}`
        }
      });
    }

    res.json({
      success: true,
      message: `${issueQty} ${stockItem.unit} issued to ${targetProcess || 'Production'}. Stock updated successfully!`,
      data: { remainingQuantity: newQuantity }
    });
  } catch (error) {
    next(error);
  }
};

// Create Finished Goods Batch ID & Packaging Breakdown
exports.createFinishedGoodsBatch = async (req, res, next) => {
  try {
    const { itemName, quantity, unit, cartonsCount, packetsPerCarton, storageLocation, expiryDate, notes } = req.body;

    const fgBatchId = `BATCH-FG-${Date.now().toString().slice(-4)}`;
    const stockId = `STK-FG-${Math.floor(100 + Math.random() * 900)}`;

    const totalPackets = (Number(cartonsCount) || 0) * (Number(packetsPerCarton) || 0);
    const breakdownStr = cartonsCount ? `1 Batch = ${cartonsCount} Cartons (${totalPackets} Packets)` : '';

    const fgStock = await prisma.companyInventory.create({
      data: {
        stockId,
        batchId: fgBatchId,
        itemName,
        category: 'Finished Goods',
        quantity: Number(quantity) || (totalPackets || 100),
        unit: unit || 'Cartons',
        packagingBreakdown: breakdownStr,
        mfgDate: new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        storageLocation: storageLocation || 'Finished Goods Warehouse, Rack B',
        status: 'Available',
        minQuantity: 20,
        notes: notes || ''
      }
    });

    res.status(201).json({
      success: true,
      message: `Finished Goods Batch ${fgBatchId} created and ready for sales!`,
      data: fgStock
    });
  } catch (error) {
    next(error);
  }
};

// Trigger Reorder Purchase Request Notification
exports.triggerPRNotification = async (req, res, next) => {
  try {
    const { stockId, itemName, currentQuantity, minQuantity } = req.body;

    const prNumber = `PR-2026-${Math.floor(10000 + Math.random() * 90000)}`;

    const pr = await prisma.purchaseRequest.create({
      data: {
        prNumber,
        requestedBy: 'Stock Threshold System Alert',
        department: 'Raw Material Inventory',
        items: [
          {
            itemName: itemName || 'Raw Material',
            category: 'Raw Materials',
            requiredQuantity: (Number(minQuantity) || 50) * 2,
            unit: 'kg'
          }
        ],
        status: 'PENDING_QUOTES',
        notes: `Automated PR triggered because stock of ${itemName} dropped to ${currentQuantity} (below threshold of ${minQuantity}).`
      }
    });

    res.json({
      success: true,
      message: `Low Stock Alert: Auto Purchase Request ${prNumber} raised for ${itemName}!`,
      data: pr
    });
  } catch (error) {
    next(error);
  }
};

// Update / Adjust company stock directly (Admin only)
exports.adjustCompanyInventory = async (req, res, next) => {
  try {
    const { productId, quantity, type } = req.body; // type: 'IN' (add) or 'OUT' (remove) or 'ADJUSTMENT' (absolute set)

    const companyStock = await prisma.companyInventory.findUnique({
      where: { productId }
    });

    if (!companyStock) {
      return res.status(404).json({ success: false, message: 'Product inventory record not found' });
    }

    let newQuantity = companyStock.quantity;
    if (type === 'IN') {
      newQuantity += parseInt(quantity);
    } else if (type === 'OUT') {
      newQuantity -= parseInt(quantity);
    } else {
      newQuantity = parseInt(quantity);
    }

    if (newQuantity < 0) {
      return res.status(400).json({ success: false, message: 'Stock quantity cannot be negative' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.companyInventory.update({
        where: { productId },
        data: { quantity: newQuantity }
      });

      await tx.stockMovement.create({
        data: {
          productId,
          type: type === 'IN' ? 'IN' : (type === 'OUT' ? 'OUT' : 'ADJUSTMENT'),
          quantity: parseInt(quantity),
          notes: 'Manual Admin adjustment'
        }
      });
    });

    res.json({ success: true, message: 'Company inventory adjusted successfully', quantity: newQuantity });
  } catch (error) {
    next(error);
  }
};

// Update company stock directly (Admin only)
exports.updateCompanyInventory = async (req, res, next) => {
  try {
    const { productId, quantity, minQuantity } = req.body;

    const companyStock = await prisma.companyInventory.findUnique({
      where: { productId }
    });

    if (!companyStock) {
      return res.status(404).json({ success: false, message: 'Product inventory record not found' });
    }

    const oldQuantity = companyStock.quantity;

    await prisma.$transaction(async (tx) => {
      await tx.companyInventory.update({
        where: { productId },
        data: { 
          quantity: parseInt(quantity),
          minQuantity: parseInt(minQuantity)
        }
      });

      // Create a stock movement record if quantity changed
      if (oldQuantity !== parseInt(quantity)) {
        await tx.stockMovement.create({
          data: {
            productId,
            type: 'ADJUSTMENT',
            quantity: Math.abs(parseInt(quantity) - oldQuantity),
            notes: `Manual Admin update (from ${oldQuantity} to ${quantity})`
          }
        });
      }
    });

    res.json({ 
      success: true, 
      message: 'Company inventory updated successfully', 
      quantity: parseInt(quantity),
      minQuantity: parseInt(minQuantity)
    });
  } catch (error) {
    next(error);
  }
};

// Get current dealer's inventory
exports.getDealerInventory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    // If Admin looks it up, require dealerId query param. If Dealer looks it up, use their own.
    let dealerId;
    if (req.user.role === 'ADMIN') {
      dealerId = req.query.dealerId;
      if (!dealerId) {
        return res.status(400).json({ success: false, message: 'dealerId is required for admin' });
      }
    } else {
      dealerId = req.user.dealer.id;
    }

    const { data: inventory, total } = await prisma.dealerInventory.findMany({
      where: { dealerId },
      include: {
        product: {
          include: { category: true }
        }
      },
      orderBy: { product: { name: 'asc' } },
      skip,
      take: limit
    });

    res.json({ success: true, data: inventory, total, page, limit });
  } catch (error) {
    next(error);
  }
};

// Create a stock transfer to dealer (Admin only)
exports.createStockTransfer = async (req, res, next) => {
  try {
    const { dealerId, items, notes, invoiceType } = req.body; // items: [{ productId, quantity, marginPct }]

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Transfer must contain at least one item' });
    }

    // Verify dealer exists
    const dealer = await prisma.dealer.findUnique({
      where: { id: dealerId },
      include: { user: true }
    });
    if (!dealer) {
      return res.status(404).json({ success: false, message: 'Dealer not found' });
    }

    // Verify company has enough stock for all items
    for (const item of items) {
      const companyStock = await prisma.companyInventory.findUnique({
        where: { productId: item.productId }
      });
      if (!companyStock || companyStock.quantity < item.quantity) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${product ? product.name : 'Unknown'}. Available: ${companyStock ? companyStock.quantity : 0}`
        });
      }
    }

    const transferNo = `TX-${Date.now()}`;

    // Calculate invoice totals
    let calculatedSubtotal = 0;
    let calculatedGstTotal = 0;
    const invoiceItemsDetails = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      const marginPct = parseFloat(item.marginPct) || 0;
      const mrp = parseFloat(product.mrp || product.price || 0);
      const sellingPrice = mrp * (1 - marginPct / 100);
      const lineSubtotal = sellingPrice * item.quantity;
      const lineGst = lineSubtotal * (parseFloat(product.gstPercent) / 100);
      const lineTotal = lineSubtotal + lineGst;

      calculatedSubtotal += lineSubtotal;
      calculatedGstTotal += lineGst;

      invoiceItemsDetails.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: mrp,
        marginPct,
        sellingPrice,
        gstPercent: parseFloat(product.gstPercent),
        gstAmount: lineGst,
        lineTotal
      });
    }

    const calculatedGrandTotal = calculatedSubtotal + calculatedGstTotal;

    const transfer = await prisma.$transaction(async (tx) => {
      // A. Create B2B Invoice first
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
          notes: `Auto-generated B2B Invoice for Transfer ${transferNo}. ${notes || ''}`,
          channel: 'B2B',
          invoiceType: invoiceType || 'NORMAL',
          items: {
            create: invoiceItemsDetails
          }
        }
      });

      // B. Create StockTransfer record linked to Invoice (Starts as PENDING)
      const stockTx = await tx.stockTransfer.create({
        data: {
          transferNo,
          dealerId,
          invoiceId: inv.id,
          status: 'PENDING',
          notes,
          createdBy: req.user.id
        }
      });

      // C. Create Transfer Items
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        const marginPct = parseFloat(item.marginPct) || 0;
        const mrp = parseFloat(product.mrp || product.price || 0);
        const unitPrice = mrp * (1 - marginPct / 100);
        await tx.stockTransferItem.create({
          data: {
            transferId: stockTx.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice,
            marginPct
          }
        });
      }

      // D. Create Notification for Dealer
      await tx.notification.create({
        data: {
          userId: dealer.userId,
          type: 'STOCK_TRANSFER',
          title: 'Stock Transfer & Invoice Initiated',
          message: `Stock transfer ${transferNo} and Invoice ${invoiceNo} have been prepared. Your inventory will update upon delivery confirmation. Current status: Pending Shipment.`,
          metadata: { transferId: stockTx.id, invoiceId: inv.id }
        }
      });

      return stockTx;
    });

    const populatedTransfer = await prisma.stockTransfer.findUnique({
      where: { id: transfer.id },
      include: {
        invoice: true,
        dealer: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Stock transfer initiated successfully (B2B invoice generated)',
      data: populatedTransfer
    });
  } catch (error) {
    next(error);
  }
};

// Update Stock Transfer Status (Admin: PENDING -> IN_TRANSIT, Dealer/Admin: IN_TRANSIT -> DELIVERED)
exports.updateTransferStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, items } = req.body; // status: IN_TRANSIT, DELIVERED, CANCELLED, DISCREPANCY

    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true }
        },
        dealer: {
          include: { user: true }
        }
      }
    });

    if (!transfer) {
      return res.status(404).json({ success: false, message: 'Stock transfer not found' });
    }

    // Role safety validation
    if (req.user.role === 'DEALER') {
      // Dealer can only confirm delivery or raise discrepancy
      if (transfer.dealerId !== req.user.dealer.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      if (status !== 'DELIVERED' && status !== 'DISCREPANCY') {
        return res.status(400).json({ success: false, message: 'Dealers can only mark transfers as DELIVERED or DISCREPANCY' });
      }
    }

    if (transfer.status === 'DELIVERED') {
      return res.status(400).json({ success: false, message: 'Transfer already delivered' });
    }
    if (transfer.status === 'DISCREPANCY') {
      return res.status(400).json({ success: false, message: 'Transfer already completed with discrepancy' });
    }
    if (transfer.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Transfer already cancelled' });
    }

    const updatedTransfer = await prisma.$transaction(async (tx) => {
      const updateData = { status };

      if (status === 'IN_TRANSIT') {
        updateData.shippedAt = new Date();
      } else if (status === 'CANCELLED' && transfer.invoiceId) {
        await tx.invoice.update({
          where: { id: transfer.invoiceId },
          data: { status: 'CANCELLED' }
        });
      } else if (status === 'DELIVERED' || status === 'DISCREPANCY') {
        updateData.deliveredAt = new Date();

        if (transfer.invoiceId) {
          await tx.invoice.update({
            where: { id: transfer.invoiceId },
            data: { status: 'CLOSED', paidAt: new Date() }
          });
        }

        // Perform stock movement logic
        for (const item of transfer.items) {
          let receivedQty = item.quantity;
          let hasDiscrepancy = false;
          let discrepancyComment = '';

          if (status === 'DISCREPANCY' && items && Array.isArray(items)) {
            const reqItem = items.find(it => it.productId === item.productId.toString());
            if (reqItem && reqItem.hasDiscrepancy) {
              receivedQty = parseInt(reqItem.receivedQuantity);
              if (isNaN(receivedQty) || receivedQty < 0) {
                receivedQty = 0;
              }
              hasDiscrepancy = true;
              discrepancyComment = reqItem.discrepancyComment || 'Unspecified issue';
            }
          }

          // Update StockTransferItem with received values
          await tx.stockTransferItem.update({
            where: { id: item.id },
            data: {
              receivedQuantity: receivedQty,
              hasDiscrepancy,
              discrepancyComment
            }
          });

          // Only perform stock updates if receivedQuantity > 0
          if (receivedQty > 0) {
            // A. Decrement Company Stock
            const compStock = await tx.companyInventory.findUnique({ where: { productId: item.productId } });
            if (!compStock || compStock.quantity < receivedQty) {
              throw new Error(`Insufficient company stock to complete delivery for product SKU: ${item.product.sku}. Requested: ${receivedQty}, Available: ${compStock ? compStock.quantity : 0}`);
            }
            await tx.companyInventory.update({
              where: { productId: item.productId },
              data: { quantity: compStock.quantity - receivedQty }
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: 'TRANSFER_OUT',
                quantity: receivedQty,
                referenceId: transfer.id,
                notes: `Stock Transfer Out to dealer: ${transfer.dealer.companyName}${hasDiscrepancy ? ` (Discrepancy: shipped ${item.quantity}, received ${receivedQty})` : ''}`
              }
            });

            // B. Increment Dealer Stock
            const dealerStock = await tx.dealerInventory.findUnique({
              where: {
                dealerId_productId: {
                  dealerId: transfer.dealerId,
                  productId: item.productId
                }
              }
            });

            if (dealerStock) {
              await tx.dealerInventory.update({
                where: { id: dealerStock.id },
                data: { quantity: dealerStock.quantity + receivedQty }
              });
            } else {
              await tx.dealerInventory.create({
                data: {
                  dealerId: transfer.dealerId,
                  productId: item.productId,
                  quantity: receivedQty
                }
              });
            }

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: 'TRANSFER_IN',
                quantity: receivedQty,
                referenceId: transfer.id,
                notes: `Stock Transfer In to dealer: ${transfer.dealer.companyName}${hasDiscrepancy ? ` (Discrepancy: shipped ${item.quantity}, received ${receivedQty})` : ''}`
              }
            });
          } else {
            // If receivedQty is 0, we still create a movement log with 0 to track the discrepancy
            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: 'TRANSFER_IN',
                quantity: 0,
                referenceId: transfer.id,
                notes: `Stock Transfer Shortage (0 received of ${item.quantity}): ${discrepancyComment}`
              }
            });
          }
        }
      }

      const updated = await tx.stockTransfer.update({
        where: { id },
        data: updateData
      });

      // Send status update notification to dealer
      await tx.notification.create({
        data: {
          userId: transfer.dealer.userId,
          type: 'STOCK_TRANSFER',
          title: status === 'DELIVERED'
            ? '✅ Stock Delivered & Inventory Updated'
            : status === 'DISCREPANCY'
              ? '⚠️ Stock Received with Discrepancy'
              : `Stock Transfer ${status.replace('_', ' ')}`,
          message: status === 'DELIVERED'
            ? `Your stock transfer ${transfer.transferNo} has been delivered. Your inventory has been updated with the new stock quantities.`
            : status === 'DISCREPANCY'
              ? `Your stock transfer ${transfer.transferNo} was received with reported discrepancies. Your inventory has been updated with the actually received quantities.`
              : `Your stock transfer ${transfer.transferNo} is now ${status.toLowerCase().replace('_', ' ')}.`,
          metadata: { transferId: transfer.id, status }
        }
      });

      // Notify admin when dealer delivers or raises discrepancy
      if (req.user.role === 'DEALER' && (status === 'DELIVERED' || status === 'DISCREPANCY')) {
        const admins = await tx.user.findMany({ where: { role: 'ADMIN' } });
        for (const admin of admins) {
          await tx.notification.create({
            data: {
              userId: admin.id,
              type: 'STOCK_TRANSFER',
              title: status === 'DELIVERED' ? 'Dealer Confirmed Stock Delivery' : '⚠️ Dealer Raised Stock Discrepancy',
              message: status === 'DELIVERED'
                ? `Dealer ${transfer.dealer.companyName} confirmed receipt of transfer ${transfer.transferNo}.`
                : `Dealer ${transfer.dealer.companyName} reported a discrepancy on transfer ${transfer.transferNo}.`,
              metadata: { transferId: transfer.id }
            }
          });
        }
      }

      return updated;
    });

    res.json({
      success: true,
      message: `Stock transfer marked as ${status.replace('_', ' ')} successfully`,
      data: updatedTransfer
    });
  } catch (error) {
    next(error);
  }
};

// List stock transfers
exports.getStockTransfers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const skip = (page - 1) * limit;

    const where = {};
    
    // If dealer, filter by dealerId
    if (req.user.role === 'DEALER') {
      where.dealerId = req.user.dealer.id;
    } else if (req.query.dealerId) {
      where.dealerId = req.query.dealerId;
    }

    if (req.query.status) {
      where.status = req.query.status;
    }

    const { data: transfers, total } = await prisma.stockTransfer.findMany({
      where,
      include: {
        dealer: true,
        invoice: {
          include: {
            dealer: true,
            items: {
              include: {
                product: true
              }
            }
          }
        },
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    res.json({ success: true, data: transfers, total, page, limit });
  } catch (error) {
    next(error);
  }
};
