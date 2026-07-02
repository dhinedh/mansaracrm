// src/modules/requests/requests.controller.js
const prisma = require('../../config/database');

exports.createRequest = async (req, res, next) => {
  try {
    const { items, notes } = req.body;
    
    if (req.user.role !== 'DEALER') {
      return res.status(403).json({ success: false, message: 'Only dealers can submit order requests' });
    }

    const dealerId = req.user.dealer.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Request must contain at least one product' });
    }

    const requestNo = `REQ-${Date.now()}`;

    const request = await prisma.stockRequest.create({
      data: {
        requestNo,
        dealerId,
        items,
        status: 'PENDING',
        notes
      }
    });

    // Notify admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: 'SYSTEM',
          title: 'New Purchase Order Request',
          message: `Dealer ${req.user.dealer.companyName} submitted a purchase order request ${requestNo}.`,
          metadata: { requestId: request.id }
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order request submitted successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

exports.getRequests = async (req, res, next) => {
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

    const requests = await prisma.stockRequest.findMany({
      where,
      include: {
        dealer: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Enrich items with product details
    const enriched = [];
    for (const r of requests) {
      const itemsList = [];
      for (const item of r.items || []) {
        const prod = await prisma.product.findUnique({ where: { id: item.productId } });
        itemsList.push({
          ...item,
          product: prod
        });
      }
      enriched.push({
        ...r,
        items: itemsList
      });
    }

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

exports.cancelRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const request = await prisma.stockRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (req.user.role === 'DEALER' && request.dealerId !== req.user.dealer.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Cannot cancel request that is not pending' });
    }

    const updated = await prisma.stockRequest.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    res.json({ success: true, message: 'Request cancelled successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

// Convert request to actual dispatch transfer (Admin only)
exports.dispatchRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes, items } = req.body;

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only administrators can dispatch orders' });
    }

    const request = await prisma.stockRequest.findUnique({
      where: { id },
      include: { dealer: true }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
    }

    // 1. Generate stock transfer inside Transaction
    const transferNo = `TX-${Date.now()}`;
    const transfer = await prisma.$transaction(async (tx) => {
      // A. Calculate invoice details for the transfer (applying dealer custom categories or default 10% margin first)
      let calculatedSubtotal = 0;
      let calculatedGstTotal = 0;
      const invoiceItemsDetails = [];

      for (const item of request.items || []) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        
        let marginPct = 10; // default fallback
        
        const overrideItem = items?.find(oi => String(oi.productId) === String(item.productId));
        if (overrideItem && overrideItem.marginPct !== undefined && overrideItem.marginPct !== null) {
          marginPct = parseFloat(overrideItem.marginPct);
        } else {
          // Retrieve custom margins for this dealer (including default rules)
          const marginRules = await tx.margin.findMany({
            where: {
              OR: [
                { dealerId: request.dealerId },
                { isDefault: true }
              ]
            }
          });
          
          const catId = product.categoryId?.toString() || product.category?.toString();
          const productRule = marginRules.find(r => !r.storeId && r.productId?.toString() === item.productId?.toString() && !r.isDefault);
          const categoryRule = marginRules.find(r => !r.storeId && r.categoryId?.toString() === catId && !r.isDefault);
          const defaultRule = marginRules.find(r => r.isDefault);
          
          if (productRule) {
            marginPct = parseFloat(productRule.marginPercent);
          } else if (categoryRule) {
            marginPct = parseFloat(categoryRule.marginPercent);
          } else if (defaultRule) {
            marginPct = parseFloat(defaultRule.marginPercent);
          }
        }
        const mrp = parseFloat(product.mrp || product.price || 0);
        const unitPrice = mrp * (1 - marginPct / 100);
        const lineSubtotal = unitPrice * item.quantity;
        const lineGst = lineSubtotal * (parseFloat(product.gstPercent) / 100);
        const lineTotal = lineSubtotal + lineGst;

        calculatedSubtotal += lineSubtotal;
        calculatedGstTotal += lineGst;

        invoiceItemsDetails.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: mrp,
          marginPct,
          sellingPrice: unitPrice,
          gstPercent: parseFloat(product.gstPercent),
          gstAmount: lineGst,
          lineTotal
        });
      }

      const calculatedGrandTotal = calculatedSubtotal + calculatedGstTotal;

      // B. Create B2B Invoice
      const seq = await tx.invoiceSequence.upsert({
        where: { id: 'singleton' },
        update: { lastNumber: { increment: 1 } },
        create: { id: 'singleton', lastNumber: 1, prefix: 'MF-INV' }
      });
      const invoiceNo = `${seq.prefix}-${String(seq.lastNumber).padStart(5, '0')}`;

      const inv = await tx.invoice.create({
        data: {
          invoiceNo,
          dealerId: request.dealerId,
          subtotal: calculatedSubtotal,
          totalGst: calculatedGstTotal,
          cgst: calculatedGstTotal / 2,
          sgst: calculatedGstTotal / 2,
          isGstEnabled: true,
          totalAmount: calculatedGrandTotal,
          status: 'GENERATED',
          notes: `B2B Invoice generated automatically from Dealer Request ${request.requestNo}.`,
          channel: 'B2B',
          items: {
            create: invoiceItemsDetails
          }
        }
      });

      // C. Create StockTransfer linked to B2B Invoice (Starts as PENDING)
      const stockTx = await tx.stockTransfer.create({
        data: {
          transferNo,
          dealerId: request.dealerId,
          invoiceId: inv.id,
          status: 'PENDING',
          notes: notes || `Dispatched from Dealer Request: ${request.requestNo}`,
          createdBy: req.user.id
        }
      });

      // D. Create transfer items (without altering stocks until delivery confirmation)
      for (const item of invoiceItemsDetails) {
        await tx.stockTransferItem.create({
          data: {
            transferId: stockTx.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.sellingPrice,
            marginPct: item.marginPct
          }
        });
      }

      // E. Update request status to DISPATCHED
      await tx.stockRequest.update({
        where: { id },
        data: { status: 'DISPATCHED' }
      });

      // F. Notify Dealer
      await tx.notification.create({
        data: {
          userId: request.dealer.userId,
          type: 'STOCK_TRANSFER',
          title: '✅ Stock Request Approved',
          message: `Your purchase request ${request.requestNo} has been approved. Stock transfer ${transferNo} and B2B Invoice ${invoiceNo} have been initiated. Your inventory will update upon delivery confirmation.`,
          metadata: { transferId: stockTx.id, invoiceId: inv.id }
        }
      });

      return stockTx;
    });

    res.json({
      success: true,
      message: 'Request converted to stock dispatch successfully',
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};
