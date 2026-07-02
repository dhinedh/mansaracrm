// src/modules/field-sales/field-sales.controller.js
const prisma = require('../../config/database');
const mongoose = require('mongoose');

// ======================================================
// STORE VISIT CHECK-IN / CHECK-OUT
// ======================================================

exports.checkInVisit = async (req, res, next) => {
  try {
    const { leadId, dealerId, storeId, visitorName, purpose, latitude, longitude } = req.body;

    if (!visitorName || !purpose) {
      return res.status(400).json({ success: false, message: 'Visitor name and purpose are required.' });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Mandatory Check-In: GPS coordinates (latitude & longitude) are required.' });
    }

    const visit = await prisma.visit.create({
      data: {
        leadId,
        dealerId,
        storeId,
        visitorName,
        purpose,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        checkInTime: new Date(),
        verified: true,
        date: new Date(),
        outcome: 'Checked In - Visit Pending checkout'
      }
    });

    res.status(201).json({ success: true, message: 'Checked in successfully', data: visit });
  } catch (error) {
    next(error);
  }
};

exports.checkOutVisit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { outcome } = req.body;

    if (!outcome) {
      return res.status(400).json({ success: false, message: 'Outcome is required to checkout.' });
    }

    const visit = await prisma.visit.findUnique({ where: { id } });
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit record not found' });
    }

    const updated = await prisma.visit.update({
      where: { id },
      data: {
        outcome,
        checkOutTime: new Date()
      }
    });

    res.json({ success: true, message: 'Checked out successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

exports.getVisits = async (req, res, next) => {
  try {
    const visits = await prisma.visit.findMany({
      orderBy: { date: 'desc' }
    });

    const enriched = [];
    for (const v of visits) {
      let lead = null;
      let dealer = null;
      let store = null;
      if (v.leadId) {
        lead = await prisma.lead.findUnique({ where: { id: v.leadId } });
      }
      if (v.dealerId) {
        dealer = await prisma.dealer.findUnique({ where: { id: v.dealerId } });
      }
      if (v.storeId) {
        store = await prisma.store.findUnique({ where: { id: v.storeId } });
      }
      enriched.push({
        ...v,
        lead,
        dealer,
        store
      });
    }

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// PENDING ORDER TRACKING & INVOICE ADJUSTMENTS
// ======================================================

exports.fulfillInvoiceItems = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // array of { productId, quantity }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Fulfillment list cannot be empty' });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        dealer: true,
        store: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status !== 'OPEN') {
      return res.status(400).json({ success: false, message: `Only OPEN invoices can be fulfilled. Current status is ${invoice.status}` });
    }

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      for (const fItem of items) {
        const invItem = invoice.items.find(i => i.productId.toString() === fItem.productId.toString());
        if (!invItem) {
          throw new Error(`Product ${fItem.productId} is not part of this invoice`);
        }

        const qtyToFulfill = parseInt(fItem.quantity || 0);
        if (qtyToFulfill <= 0) continue;

        const currentFulfilled = invItem.fulfilledQuantity || 0;
        const newFulfilled = currentFulfilled + qtyToFulfill;

        if (newFulfilled > invItem.quantity) {
          throw new Error(`Cannot fulfill ${qtyToFulfill} units for product ${fItem.productId}. Only ${invItem.quantity - currentFulfilled} units remain pending.`);
        }

        const dealerStock = await tx.dealerInventory.findUnique({
          where: {
            dealerId_productId: { dealerId: invoice.dealerId, productId: fItem.productId }
          }
        });

        if (!dealerStock || dealerStock.quantity < qtyToFulfill) {
          const prod = await tx.product.findUnique({ where: { id: fItem.productId } });
          throw new Error(`Insufficient stock for product ${prod ? prod.name : fItem.productId} in dealer warehouse. Available: ${dealerStock ? dealerStock.quantity : 0}`);
        }

        await tx.dealerInventory.update({
          where: { id: dealerStock.id },
          data: { quantity: dealerStock.quantity - qtyToFulfill }
        });

        await tx.stockMovement.create({
          data: {
            productId: fItem.productId,
            type: 'OUT',
            quantity: qtyToFulfill,
            referenceId: invoice.id,
            notes: `Fulfillment delivered to store: ${invoice.store ? invoice.store.name : 'Store'} in Invoice ${invoice.invoiceNo}`
          }
        });

        await tx.invoiceItem.update({
          where: { id: invItem.id },
          data: { fulfilledQuantity: newFulfilled }
        });
      }

      const reloadedItems = await tx.invoiceItem.findMany({
        where: { invoiceId: id }
      });

      const allFulfilled = reloadedItems.every(i => (i.fulfilledQuantity || 0) >= i.quantity);

      let finalStatus = 'OPEN';
      if (allFulfilled) {
        finalStatus = 'CLOSED';
      }

      const inv = await tx.invoice.update({
        where: { id },
        data: { status: finalStatus },
        include: {
          items: {
            include: { product: true }
          },
          dealer: true,
          store: true
        }
      });

      if (allFulfilled) {
        await tx.notification.create({
          data: {
            userId: req.user.id,
            type: 'INVOICE_GENERATED',
            title: 'Invoice Fully Fulfilled',
            message: `Invoice ${invoice.invoiceNo} has been fully fulfilled and closed.`,
            metadata: { invoiceId: invoice.id }
          }
        });
      }

      return inv;
    });

    res.json({
      success: true,
      message: updatedInvoice.status === 'CLOSED' ? 'Invoice fully fulfilled and closed' : 'Fulfillment updated successfully',
      data: updatedInvoice
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.adjustInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items, shippingCharges } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Adjusted invoice must contain at least one product' });
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        dealer: true,
        store: true
      }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status !== 'OPEN') {
      return res.status(400).json({ success: false, message: `Only OPEN invoices can be adjusted. Current status is ${invoice.status}` });
    }

    let calculatedSubtotal = 0;
    let calculatedGstTotal = 0;
    const invoiceItemsDetails = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });
      if (!product || !product.isActive) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      }

      let marginPct = parseFloat(item.marginPct);
      if (isNaN(marginPct)) {
        marginPct = 10;
      }

      const unit = item.unit || 'PCS';
      const cartonSize = product.cartonSize || 24;
      const qtyInPieces = unit === 'CTN' ? (item.quantity * cartonSize) : item.quantity;

      const mrp = parseFloat(product.mrp || product.price || 0);
      const sellingPrice = mrp * (1 - marginPct / 100);
      const gstPct = parseFloat(product.gstPercent || 0);
      
      const lineSubtotal = sellingPrice * qtyInPieces;
      const lineGst = invoice.isGstEnabled ? (lineSubtotal * (gstPct / 100)) : 0;
      const lineTotal = lineSubtotal + lineGst;

      calculatedSubtotal += lineSubtotal;
      calculatedGstTotal += lineGst;

      invoiceItemsDetails.push({
        productId: item.productId,
        quantity: qtyInPieces,
        unit: unit,
        unitPrice: mrp,
        marginPct,
        sellingPrice,
        gstPercent: invoice.isGstEnabled ? gstPct : 0,
        gstAmount: invoice.isGstEnabled ? lineGst : 0,
        lineTotal,
        fulfilledQuantity: 0
      });
    }

    const finalShipping = shippingCharges !== undefined ? parseFloat(shippingCharges) : invoice.shippingCharges;
    const calculatedGrandTotal = calculatedSubtotal + calculatedGstTotal + finalShipping;

    const adjustedInvoice = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id }
      });

      const updated = await tx.invoice.update({
        where: { id },
        data: {
          subtotal: calculatedSubtotal,
          totalGst: calculatedGstTotal,
          cgst: invoice.isGstEnabled ? (calculatedGstTotal / 2) : 0,
          sgst: invoice.isGstEnabled ? (calculatedGstTotal / 2) : 0,
          totalAmount: calculatedGrandTotal,
          shippingCharges: finalShipping,
          items: {
            create: invoiceItemsDetails
          }
        },
        include: {
          items: {
            include: { product: true }
          },
          dealer: true,
          store: true
        }
      });

      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'ADJUST_INVOICE',
          entity: 'Invoice',
          entityId: id,
          newValues: { invoiceNo: invoice.invoiceNo, totalAmount: calculatedGrandTotal }
        }
      });

      return updated;
    });

    res.json({
      success: true,
      message: 'Invoice adjusted successfully',
      data: adjustedInvoice
    });

  } catch (error) {
    next(error);
  }
};
