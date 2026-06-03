// src/modules/inventory/inventory.controller.js
const prisma = require('../../config/database');

// Get company inventory (Admin only)
exports.getCompanyInventory = async (req, res, next) => {
  try {
    const inventory = await prisma.companyInventory.findMany({
      include: {
        product: {
          include: { category: true }
        }
      },
      orderBy: { product: { name: 'asc' } }
    });

    res.json({ success: true, data: inventory });
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

    const inventory = await prisma.dealerInventory.findMany({
      where: { dealerId },
      include: {
        product: {
          include: { category: true }
        }
      },
      orderBy: { product: { name: 'asc' } }
    });

    res.json({ success: true, data: inventory });
  } catch (error) {
    next(error);
  }
};

// Create a stock transfer to dealer (Admin only)
exports.createStockTransfer = async (req, res, next) => {
  try {
    const { dealerId, items, notes } = req.body; // items: [{ productId, quantity }]

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

    const transfer = await prisma.$transaction(async (tx) => {
      // 1. Create StockTransfer record (Starts as PENDING)
      const stockTx = await tx.stockTransfer.create({
        data: {
          transferNo,
          dealerId,
          status: 'PENDING',
          notes,
          createdBy: req.user.id
        }
      });

      // 2. Create Transfer Items and fetch prices
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        await tx.stockTransferItem.create({
          data: {
            transferId: stockTx.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price
          }
        });
      }

      // 3. Create Notification for Dealer
      await tx.notification.create({
        data: {
          userId: dealer.userId,
          type: 'STOCK_TRANSFER',
          title: 'New Stock Transfer Created',
          message: `A new stock transfer ${transferNo} is prepared for you and is pending shipment.`,
          metadata: { transferId: stockTx.id }
        }
      });

      return stockTx;
    });

    res.status(201).json({
      success: true,
      message: 'Stock transfer initiated successfully (Pending status)',
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

// Update Stock Transfer Status (Admin: PENDING -> IN_TRANSIT, Dealer/Admin: IN_TRANSIT -> DELIVERED)
exports.updateTransferStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // status: IN_TRANSIT, DELIVERED, CANCELLED

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
      // Dealer can only confirm delivery
      if (transfer.dealerId !== req.user.dealer.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
      if (status !== 'DELIVERED') {
        return res.status(400).json({ success: false, message: 'Dealers can only mark transfers as DELIVERED' });
      }
    }

    if (transfer.status === 'DELIVERED') {
      return res.status(400).json({ success: false, message: 'Transfer already delivered' });
    }
    if (transfer.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Transfer already cancelled' });
    }

    const updatedTransfer = await prisma.$transaction(async (tx) => {
      const updateData = { status };

      if (status === 'IN_TRANSIT') {
        updateData.shippedAt = new Date();
      } else if (status === 'DELIVERED') {
        updateData.deliveredAt = new Date();

        // Perform stock movement logic
        for (const item of transfer.items) {
          // A. Decrement Company Stock
          const compStock = await tx.companyInventory.findUnique({ where: { productId: item.productId } });
          if (!compStock || compStock.quantity < item.quantity) {
            throw new Error(`Insufficient company stock to complete delivery for product SKU: ${item.product.sku}`);
          }
          await tx.companyInventory.update({
            where: { productId: item.productId },
            data: { quantity: compStock.quantity - item.quantity }
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'TRANSFER_OUT',
              quantity: item.quantity,
              referenceId: transfer.id,
              notes: `Stock Transfer Out to dealer: ${transfer.dealer.companyName}`
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
              data: { quantity: dealerStock.quantity + item.quantity }
            });
          } else {
            await tx.dealerInventory.create({
              data: {
                dealerId: transfer.dealerId,
                productId: item.productId,
                quantity: item.quantity
              }
            });
          }

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'TRANSFER_IN',
              quantity: item.quantity,
              referenceId: transfer.id,
              notes: `Stock Transfer In to dealer: ${transfer.dealer.companyName}`
            }
          });
        }
      }

      const updated = await tx.stockTransfer.update({
        where: { id },
        data: updateData
      });

      // Send status update notification
      await tx.notification.create({
        data: {
          userId: transfer.dealer.userId,
          type: 'STOCK_TRANSFER',
          title: `Stock Transfer ${status.replace('_', ' ')}`,
          message: `Your stock transfer ${transfer.transferNo} is now ${status.toLowerCase()}.`,
          metadata: { transferId: transfer.id, status }
        }
      });

      // Notify admin when dealer delivers
      if (req.user.role === 'DEALER' && status === 'DELIVERED') {
        const admins = await tx.user.findMany({ where: { role: 'ADMIN' } });
        for (const admin of admins) {
          await tx.notification.create({
            data: {
              userId: admin.id,
              type: 'STOCK_TRANSFER',
              title: 'Dealer Confirmed Stock Delivery',
              message: `Dealer ${transfer.dealer.companyName} confirmed receipt of transfer ${transfer.transferNo}.`,
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

    const transfers = await prisma.stockTransfer.findMany({
      where,
      include: {
        dealer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: transfers });
  } catch (error) {
    next(error);
  }
};
