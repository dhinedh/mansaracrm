// src/modules/returns/returns.controller.js
const prisma = require('../../config/database');

exports.createReturn = async (req, res, next) => {
  try {
    const { invoiceId, transferId, type, items, notes } = req.body;
    let dealerId;

    if (req.user.role === 'DEALER') {
      dealerId = req.user.dealer.id;
    } else {
      dealerId = req.body.dealerId;
    }

    if (!dealerId) {
      return res.status(400).json({ success: false, message: 'Dealer ID is required' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Return list must contain at least one product' });
    }

    const returnNo = `RET-${Date.now()}`;

    const returnRecord = await prisma.return.create({
      data: {
        returnNo,
        dealerId,
        invoiceId,
        transferId,
        type,
        items,
        status: 'PENDING',
        notes
      }
    });

    // Notify Admin or Dealer
    if (req.user.role === 'DEALER' && type === 'DEALER_TO_WAREHOUSE') {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'SYSTEM',
            title: 'New Return Request',
            message: `Dealer ${req.user.dealer.companyName} submitted a return request ${returnNo} for warehouse stock.`,
            metadata: { returnId: returnRecord.id }
          }
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Return log created successfully',
      data: returnRecord
    });
  } catch (error) {
    next(error);
  }
};

exports.getReturns = async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role === 'DEALER') {
      where.dealerId = req.user.dealer.id;
    } else if (req.query.dealerId) {
      where.dealerId = req.query.dealerId;
    }

    if (req.query.status) {
      where.status = req.query.status;
    }
    if (req.query.type) {
      where.type = req.query.type;
    }

    const returns = await prisma.return.findMany({
      where,
      include: {
        dealer: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Resolve products manually because items are embedded inside Returns
    const enrichedReturns = [];
    for (const ret of returns) {
      const enrichedItems = [];
      for (const item of ret.items || []) {
        const prod = await prisma.product.findUnique({ where: { id: item.productId } });
        enrichedItems.push({
          ...item,
          product: prod
        });
      }
      enrichedReturns.push({
        ...ret,
        items: enrichedItems
      });
    }

    res.json({ success: true, data: enrichedReturns });
  } catch (error) {
    next(error);
  }
};

exports.updateReturnStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // APPROVED or REJECTED

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const ret = await prisma.return.findUnique({
      where: { id },
      include: { dealer: true }
    });

    if (!ret) {
      return res.status(404).json({ success: false, message: 'Return record not found' });
    }

    if (ret.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Return is already processed' });
    }

    // Auth validation
    if (req.user.role === 'DEALER') {
      if (ret.type !== 'STORE_TO_DEALER') {
        return res.status(403).json({ success: false, message: 'Dealers can only approve returns from retail stores' });
      }
      if (ret.dealerId !== req.user.dealer.id) {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const up = await tx.return.update({
        where: { id },
        data: { status, notes }
      });

      if (status === 'APPROVED') {
        // Adjust stock inventory
        for (const item of ret.items || []) {
          if (ret.type === 'DEALER_TO_WAREHOUSE') {
            // A. Decrement Dealer Stock
            const dStock = await tx.dealerInventory.findUnique({
              where: { dealerId_productId: { dealerId: ret.dealerId, productId: item.productId } }
            });
            if (dStock) {
              const deductQty = Math.min(dStock.quantity, item.quantity);
              await tx.dealerInventory.update({
                where: { id: dStock.id },
                data: { quantity: dStock.quantity - deductQty }
              });

              await tx.stockMovement.create({
                data: {
                  productId: item.productId,
                  type: 'OUT',
                  quantity: deductQty,
                  referenceId: ret.id,
                  notes: `Stock Return ${ret.returnNo} to warehouse: ${deductQty} items deducted`
                }
              });
            }

            // B. Increment Company Warehouse Stock
            const cStock = await tx.companyInventory.findUnique({ where: { productId: item.productId } });
            if (cStock) {
              await tx.companyInventory.update({
                where: { productId: item.productId },
                data: { quantity: cStock.quantity + item.quantity }
              });

              await tx.stockMovement.create({
                data: {
                  productId: item.productId,
                  type: 'IN',
                  quantity: item.quantity,
                  referenceId: ret.id,
                  notes: `Stock Return ${ret.returnNo} from dealer: ${item.quantity} items returned`
                }
              });
            }
          } else if (ret.type === 'STORE_TO_DEALER') {
            // Retail outlet returns to Dealer -> Dealer inventory goes back up
            const dStock = await tx.dealerInventory.findUnique({
              where: { dealerId_productId: { dealerId: ret.dealerId, productId: item.productId } }
            });
            if (dStock) {
              await tx.dealerInventory.update({
                where: { id: dStock.id },
                data: { quantity: dStock.quantity + item.quantity }
              });
            } else {
              await tx.dealerInventory.create({
                data: {
                  dealerId: ret.dealerId,
                  productId: item.productId,
                  quantity: item.quantity
                }
              });
            }

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                type: 'IN',
                quantity: item.quantity,
                referenceId: ret.id,
                notes: `Store Return ${ret.returnNo} to dealer: ${item.quantity} items returned`
              }
            });
          }
        }
      }

      // Notify dealer if admin approved/rejected
      if (req.user.role === 'ADMIN') {
        await tx.notification.create({
          data: {
            userId: ret.dealer.userId,
            type: 'ACCOUNT_UPDATE',
            title: `Return Request ${status}`,
            message: `Your return request ${ret.returnNo} has been ${status.toLowerCase()}. Remarks: ${notes || 'N/A'}`,
            metadata: { returnId: ret.id, status }
          }
        });
      }

      return up;
    });

    res.json({ success: true, message: `Return request ${status.toLowerCase()} successfully`, data: updated });
  } catch (error) {
    next(error);
  }
};
