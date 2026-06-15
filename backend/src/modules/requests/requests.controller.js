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
    const { notes } = req.body;

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

    // 1. Verify warehouse stock availability
    for (const item of request.items || []) {
      const companyStock = await prisma.companyInventory.findUnique({ where: { productId: item.productId } });
      if (!companyStock || companyStock.quantity < item.quantity) {
        const prod = await prisma.product.findUnique({ where: { id: item.productId } });
        return res.status(400).json({
          success: false,
          message: `Insufficient warehouse stock to dispatch: ${prod ? prod.name : 'Unknown Product'}. Available: ${companyStock ? companyStock.quantity : 0}`
        });
      }
    }

    // 2. Generate stock transfer inside Transaction
    const transferNo = `TX-${Date.now()}`;
    const transfer = await prisma.$transaction(async (tx) => {
      // A. Calculate invoice details for the transfer (applying dealer custom categories or default 0% margin first)
      let calculatedSubtotal = 0;
      let calculatedGstTotal = 0;
      const invoiceItemsDetails = [];

      for (const item of request.items || []) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        // Retrieve dealer configured margin for this category or default to 0
        const configuredMargin = await tx.margin.findFirst({
          where: {
            dealerId: request.dealerId,
            OR: [
              { productId: item.productId },
              { categoryId: product.categoryId }
            ]
          }
        });
        const marginPct = configuredMargin ? parseFloat(configuredMargin.marginPercent) : 0;
        const unitPrice = parseFloat(product.price) * (1 - marginPct / 100);
        const lineSubtotal = unitPrice * item.quantity;
        const lineGst = lineSubtotal * (parseFloat(product.gstPercent) / 100);
        const lineTotal = lineSubtotal + lineGst;

        calculatedSubtotal += lineSubtotal;
        calculatedGstTotal += lineGst;

        invoiceItemsDetails.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: parseFloat(product.price),
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

      // C. Create StockTransfer linked to B2B Invoice
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

      // D. Create transfer items
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
          title: 'Stock Request Dispatched',
          message: `Your purchase request ${request.requestNo} has been dispatched. Stock transfer ${transferNo} and B2B Invoice ${invoiceNo} have been generated.`,
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
