// src/modules/procurement/procurement.controller.js
const prisma = require('../../config/database');

// ── 1. PURCHASE REQUESTS & QUOTES ─────────────────────────────────────────────

// Create Purchase Request (PR)
exports.createPurchaseRequest = async (req, res, next) => {
  try {
    const { items, requestedBy, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required for a Purchase Request.' });
    }

    const prNumber = `PR-2026-${Date.now().toString().slice(-5)}`;

    const pr = await prisma.purchaseRequest.create({
      data: {
        prNumber,
        items: items.map(item => ({
          itemName: item.itemName,
          category: item.category || 'Raw Materials',
          requiredQuantity: Number(item.requiredQuantity),
          unit: item.unit || 'kg',
          targetDeliveryDate: item.targetDeliveryDate ? new Date(item.targetDeliveryDate) : null
        })),
        requestedBy: requestedBy || 'Procurement System',
        status: 'OPEN',
        quotes: [],
        notes: notes || ''
      }
    });

    // Ensure all requested items are registered in CompanyInventory master catalog
    for (const item of items) {
      if (item.itemName && item.itemName.trim()) {
        const trimmedName = item.itemName.trim();
        const { data: existing } = await prisma.companyInventory.findMany({
          where: { itemName: trimmedName }
        });

        if (!existing || existing.length === 0) {
          await prisma.companyInventory.create({
            data: {
              itemName: trimmedName,
              category: item.category || 'Raw Materials',
              unit: item.unit || 'kg',
              availableQuantity: 0,
              totalQuantity: 0,
              reservedQuantity: 0,
              minThreshold: 100,
              unitPrice: 0
            }
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Purchase Request created successfully',
      data: pr
    });
  } catch (error) {
    next(error);
  }
};

// Get all Purchase Requests
exports.getPurchaseRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const { data: prs, total } = await prisma.purchaseRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: prs,
      total: total || prs.length
    });
  } catch (error) {
    next(error);
  }
};

// Add Vendor Proforma Invoices / Quotes to PR ID (Single or Multiple Invoices)
exports.addVendorQuote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { invoices } = req.body;

    const pr = await prisma.purchaseRequest.findUnique({ where: { id } });
    if (!pr) {
      return res.status(404).json({ success: false, message: 'Purchase Request not found.' });
    }

    const inputInvoices = Array.isArray(invoices) && invoices.length > 0
      ? invoices
      : [req.body];

    const newQuotes = [];

    for (const inv of inputInvoices) {
      if (!inv.vendorId) continue;
      const vendor = await prisma.vendor.findUnique({ where: { id: inv.vendorId } });
      if (!vendor) continue;

      let calculatedTotal = 0;
      let formattedItemizedPrices = [];

      if (inv.itemizedPrices && Array.isArray(inv.itemizedPrices) && inv.itemizedPrices.length > 0) {
        formattedItemizedPrices = pr.items.map(prItem => {
          const matchingItemPrice = inv.itemizedPrices.find(i => i.itemName === prItem.itemName) || {};
          const price = Number(matchingItemPrice.unitPrice) || Number(inv.quotedUnitPrice) || 0;
          const total = (Number(prItem.requiredQuantity) || 0) * price;
          calculatedTotal += total;

          return {
            itemName: prItem.itemName,
            unitPrice: price,
            totalPrice: total
          };
        });
      } else {
        const price = Number(inv.quotedUnitPrice) || 0;
        const totalQty = pr.items.reduce((sum, i) => sum + (Number(i.requiredQuantity) || 0), 0);
        calculatedTotal = totalQty * price;

        formattedItemizedPrices = pr.items.map(prItem => ({
          itemName: prItem.itemName,
          unitPrice: price,
          totalPrice: (Number(prItem.requiredQuantity) || 0) * price
        }));
      }

      newQuotes.push({
        vendorId: vendor.id,
        vendorName: vendor.legalName,
        vendorInvoiceNumber: inv.vendorInvoiceNumber || `PINV-${vendor.id.slice(-4)}-${Date.now().toString().slice(-4)}`,
        quotedUnitPrice: Number(inv.quotedUnitPrice) || (calculatedTotal / (pr.items.reduce((s, i) => s + (Number(i.requiredQuantity) || 0), 0) || 1)),
        totalQuoteAmount: calculatedTotal,
        paymentTerms: inv.paymentTerms || 'Net 30 Days',
        leadTimeDays: Number(inv.leadTimeDays) || 3,
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        itemizedPrices: formattedItemizedPrices,
        notes: inv.notes || '',
        status: 'PENDING'
      });
    }

    if (newQuotes.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one valid vendor invoice entry is required.' });
    }

    const updatedQuotes = [...(pr.quotes || []), ...newQuotes];

    const updatedPR = await prisma.purchaseRequest.update({
      where: { id },
      data: {
        quotes: updatedQuotes,
        status: 'QUOTES_RECEIVED'
      }
    });

    res.json({
      success: true,
      message: `${newQuotes.length} Vendor Proforma Invoice(s) recorded for PR #${pr.prNumber}`,
      data: updatedPR
    });
  } catch (error) {
    next(error);
  }
};

// Select Winning Vendor Invoice & Generate PO
exports.generatePOFromPR = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { selectedVendorId, vendorInvoiceNumber, quoteIndex, paymentTerms, expectedDeliveryDate } = req.body;

    const pr = await prisma.purchaseRequest.findUnique({ where: { id } });
    if (!pr) {
      return res.status(404).json({ success: false, message: 'Purchase Request not found.' });
    }

    // Match quote by quoteIndex, or vendorInvoiceNumber, or vendorId
    let selectedQuote = null;
    if (typeof quoteIndex === 'number' && pr.quotes && pr.quotes[quoteIndex]) {
      selectedQuote = pr.quotes[quoteIndex];
    } else if (vendorInvoiceNumber) {
      selectedQuote = (pr.quotes || []).find(q => q.vendorInvoiceNumber === vendorInvoiceNumber);
    } else if (selectedVendorId) {
      selectedQuote = (pr.quotes || []).find(q => q.vendorId?.toString() === selectedVendorId?.toString());
    }

    if (!selectedQuote) {
      return res.status(400).json({ success: false, message: 'Selected vendor invoice/quote not found in PR.' });
    }

    const vendor = await prisma.vendor.findUnique({ where: { id: selectedQuote.vendorId } });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    const poNumber = `PO-2026-${Date.now().toString().slice(-5)}`;

    const poItems = pr.items.map(item => {
      const itemizedMatch = (selectedQuote.itemizedPrices || []).find(ip => ip.itemName === item.itemName);
      const unitPrice = itemizedMatch ? Number(itemizedMatch.unitPrice) : Number(selectedQuote.quotedUnitPrice) || 0;
      const totalPrice = itemizedMatch ? Number(itemizedMatch.totalPrice) : Number(item.requiredQuantity) * unitPrice;

      return {
        itemName: item.itemName,
        category: item.category || 'Raw Materials',
        orderedQuantity: Number(item.requiredQuantity),
        unitPrice,
        totalPrice,
        unit: item.unit || 'kg'
      };
    });

    const totalAmount = poItems.reduce((sum, i) => sum + i.totalPrice, 0);

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        prId: pr.id,
        prNumber: pr.prNumber,
        vendorId: vendor.id,
        vendorName: vendor.legalName,
        vendorInvoiceNumber: selectedQuote.vendorInvoiceNumber || '',
        vendorEmail: vendor.email,
        vendorPhone: vendor.phone,
        vendorAddress: vendor.officeAddress,
        vendorGstin: vendor.gstin,
        items: poItems,
        totalAmount,
        paymentTerms: paymentTerms || selectedQuote.paymentTerms || 'Net 30 Days',
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: 'SENT_TO_VENDOR',
        notes: `Generated from PR #${pr.prNumber} based on Vendor Invoice #${selectedQuote.vendorInvoiceNumber || 'N/A'}`
      }
    });

    // Update quotes status in PR (chosen quote becomes ACCEPTED, rest REJECTED)
    const updatedQuotes = (pr.quotes || []).map(q => ({
      ...q,
      status: (q.vendorInvoiceNumber === selectedQuote.vendorInvoiceNumber || q.vendorId?.toString() === vendor.id.toString()) ? 'ACCEPTED' : 'REJECTED'
    }));

    await prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: 'PO_CREATED',
        selectedVendorId: vendor.id,
        selectedVendorName: vendor.legalName,
        selectedInvoiceNumber: selectedQuote.vendorInvoiceNumber || '',
        quotes: updatedQuotes
      }
    });

    res.status(201).json({
      success: true,
      message: `Purchase Order ${poNumber} generated from Vendor Invoice #${selectedQuote.vendorInvoiceNumber || 'N/A'}!`,
      data: po
    });
  } catch (error) {
    next(error);
  }
};

// ── 2. PURCHASE ORDERS (PO) ───────────────────────────────────────────────────

// Get all Purchase Orders
exports.getPurchaseOrders = async (req, res, next) => {
  try {
    const { status, vendorId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;

    const { data: pos, total } = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: pos,
      total: total || pos.length
    });
  } catch (error) {
    next(error);
  }
};

// Get single Purchase Order by ID
exports.getPurchaseOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found.' });
    }
    res.json({ success: true, data: po });
  } catch (error) {
    next(error);
  }
};

// ── 3. GOODS RECEIPT NOTE (GRN, BATCH ID & INVENTORY STOCK UPDATE) ─────────────

// Create Goods Receipt Note (GRN) & Auto Update Stock + Batch ID
exports.createGRN = async (req, res, next) => {
  try {
    const { id } = req.params; // poId
    const { invoiceNumber, challanNumber, items, inspectedBy, notes, paymentStatus, paidAmount, paymentReference, paymentMode } = req.body;

    const po = await prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) {
      return res.status(404).json({ success: false, message: 'Purchase Order not found.' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one line item is required for GRN.' });
    }

    const grnNumber = `GRN-2026-${Date.now().toString().slice(-5)}`;

    const grnItems = items.map((item, idx) => {
      const recQty = Number(item.receivedQuantity) || 0;
      const accQty = Number(item.acceptedQuantity) || 0;
      const rejQty = Number(item.rejectedQuantity) || (recQty - accQty);
      const price = Number(item.unitPrice) || Number(po.items[idx]?.unitPrice) || 0;
      const batchId = item.batchId || `BATCH-RM-${Date.now().toString().slice(-4)}-${idx + 1}`;

      return {
        itemName: item.itemName || po.items[idx]?.itemName || 'Raw Material',
        category: item.category || po.items[idx]?.category || 'Raw Materials',
        orderedQuantity: Number(item.orderedQuantity) || Number(po.items[idx]?.orderedQuantity) || 0,
        receivedQuantity: recQty,
        acceptedQuantity: accQty,
        rejectedQuantity: rejQty,
        unitPrice: price,
        acceptedAmount: accQty * price,
        unit: item.unit || po.items[idx]?.unit || 'kg',
        batchId,
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months default
        qualityStatus: item.qualityStatus || 'PASS',
        qualityNotes: item.qualityNotes || 'Inspected & Passed QA Standards'
      };
    });

    const totalAcceptedAmount = grnItems.reduce((sum, i) => sum + i.acceptedAmount, 0);
    const isPaid = paymentStatus === 'PAID';

    const grn = await prisma.goodsReceiptNote.create({
      data: {
        grnNumber,
        poId: po.id,
        poNumber: po.poNumber,
        vendorId: po.vendorId,
        vendorName: po.vendorName,
        invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-4)}`,
        challanNumber: challanNumber || `CH-${Date.now().toString().slice(-4)}`,
        items: grnItems,
        totalAcceptedAmount,
        inspectedBy: inspectedBy || 'Quality Inspector',
        receivedDate: new Date(),
        inventoryUpdated: true,
        paymentStatus: isPaid ? 'PAID' : 'PENDING_PAYMENT',
        paymentDetails: isPaid ? {
          paidAmount: Number(paidAmount) || totalAcceptedAmount,
          paymentReference: paymentReference || `NEFT-${Date.now().toString().slice(-6)}`,
          paymentMode: paymentMode || 'NEFT / Bank Transfer',
          paidAt: new Date()
        } : { paidAmount: 0 },
        notes: notes || ''
      }
    });

    // Update PO Status
    const totalOrdered = po.items.reduce((sum, i) => sum + i.orderedQuantity, 0);
    const totalAccepted = grnItems.reduce((sum, i) => sum + i.acceptedQuantity, 0);

    const poStatus = totalAccepted >= totalOrdered ? 'DELIVERED' : 'PARTIALLY_DELIVERED';
    await prisma.purchaseOrder.update({
      where: { id },
      data: { status: poStatus }
    });

    // ── AUTOMATIC INVENTORY & BATCH UPDATE ─────────────────────────────────────
    for (const item of grnItems) {
      if (item.acceptedQuantity > 0) {
        // Find existing Company Inventory item or create new
        const { data: existingInventories } = await prisma.companyInventory.findMany({
          where: { itemName: item.itemName }
        });

        if (existingInventories && existingInventories.length > 0) {
          const currentInv = existingInventories[0];
          await prisma.companyInventory.update({
            where: { id: currentInv.id },
            data: {
              availableQuantity: (Number(currentInv.availableQuantity) || 0) + item.acceptedQuantity,
              totalQuantity: (Number(currentInv.totalQuantity) || 0) + item.acceptedQuantity
            }
          });
        } else {
          await prisma.companyInventory.create({
            data: {
              itemName: item.itemName,
              category: item.category,
              unit: item.unit,
              availableQuantity: item.acceptedQuantity,
              totalQuantity: item.acceptedQuantity,
              reservedQuantity: 0,
              minThreshold: 100,
              unitPrice: item.unitPrice
            }
          });
        }

        // Log Stock Movement with Batch ID
        try {
          await prisma.stockMovement.create({
            data: {
              type: 'INBOUND',
              movementType: 'PURCHASE_RECEIPT',
              itemName: item.itemName,
              quantity: item.acceptedQuantity,
              batchId: item.batchId,
              referenceNumber: grnNumber,
              vendorName: po.vendorName,
              notes: `GRN Material Entry: ${item.acceptedQuantity} ${item.unit} under Batch ${item.batchId}`
            }
          });
        } catch (e) {
          console.log('Logged stock movement fallback:', e.message);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `GRN ${grnNumber} created! Material accepted, Batch IDs assigned, and inventory updated.`,
      data: grn
    });
  } catch (error) {
    next(error);
  }
};

// Get all Goods Receipt Notes (GRN)
exports.getGoodsReceiptNotes = async (req, res, next) => {
  try {
    const { paymentStatus } = req.query;
    const where = {};
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const { data: grns, total } = await prisma.goodsReceiptNote.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: grns,
      total: total || grns.length
    });
  } catch (error) {
    next(error);
  }
};

// Update GRN Payment Status (Accounts Clearance)
exports.updateGRNPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paidAmount, paymentReference, paymentMode } = req.body;

    const grn = await prisma.goodsReceiptNote.findUnique({ where: { id } });
    if (!grn) {
      return res.status(404).json({ success: false, message: 'Goods Receipt Note not found.' });
    }

    const updatedGRN = await prisma.goodsReceiptNote.update({
      where: { id },
      data: {
        paymentStatus: paymentStatus || 'PAID',
        paymentDetails: {
          paidAmount: Number(paidAmount) || grn.totalAcceptedAmount,
          paidAt: new Date(),
          paymentReference: paymentReference || `PAY-TXN-${Date.now().toString().slice(-6)}`,
          paymentMode: paymentMode || 'NEFT / Bank Transfer'
        }
      }
    });

    res.json({
      success: true,
      message: `Payment status for GRN #${grn.grnNumber} updated to ${paymentStatus || 'PAID'}.`,
      data: updatedGRN
    });
  } catch (error) {
    next(error);
  }
};

// ── 4. DOCUMENT ARCHIVE & COMPLIANCE ──────────────────────────────────────────

// Get Document Archive (MOUs, POs, GRNs, Invoices)
exports.getDocumentArchive = async (req, res, next) => {
  try {
    const { data: vendors } = await prisma.vendor.findMany({ where: {} });
    const { data: pos } = await prisma.purchaseOrder.findMany({ where: {} });
    const { data: grns } = await prisma.goodsReceiptNote.findMany({ where: {} });

    // Map archived documents
    const agreements = vendors
      .filter(v => v.agreementStatus && v.agreementStatus !== 'NOT_GENERATED')
      .map(v => ({
        id: v.id,
        type: 'AGREEMENT_MOU',
        title: `Vendor Agreement / MOU — ${v.legalName}`,
        referenceNumber: v.agreementDetails?.agreementNumber || `MOU-${v.id.slice(-4)}`,
        vendorName: v.legalName,
        date: v.agreementDetails?.signedAt || v.agreementDetails?.generatedAt || v.createdAt,
        status: v.agreementStatus,
        details: v.agreementDetails
      }));

    const poDocs = pos.map(p => ({
      id: p.id,
      type: 'PURCHASE_ORDER',
      title: `Purchase Order ${p.poNumber}`,
      referenceNumber: p.poNumber,
      vendorName: p.vendorName,
      date: p.createdAt,
      amount: p.totalAmount,
      status: p.status,
      details: p
    }));

    const grnDocs = grns.map(g => ({
      id: g.id,
      type: 'GOODS_RECEIPT_NOTE',
      title: `GRN Note ${g.grnNumber} (Inv #${g.invoiceNumber || 'N/A'})`,
      referenceNumber: g.grnNumber,
      vendorName: g.vendorName,
      date: g.receivedDate || g.createdAt,
      amount: g.totalAcceptedAmount,
      status: g.paymentStatus,
      details: g
    }));

    const allArchiveDocs = [...agreements, ...poDocs, ...grnDocs].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: allArchiveDocs,
      summary: {
        totalAgreements: agreements.length,
        totalPOs: poDocs.length,
        totalGRNs: grnDocs.length
      }
    });
  } catch (error) {
    next(error);
  }
};
