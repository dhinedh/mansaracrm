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

// ── 5. SUPPLY ITEM PRICE & VENDOR INTELLIGENCE ────────────────────────────────
exports.getItemPriceHistory = async (req, res, next) => {
  try {
    const { data: pos } = await prisma.purchaseOrder.findMany({ where: {} });
    const { data: grns } = await prisma.goodsReceiptNote.findMany({ where: {} });
    const { data: prs } = await prisma.purchaseRequest.findMany({ where: {} });
    const { data: inventories } = await prisma.companyInventory.findMany({ where: {} });

    const itemRecordsMap = {};

    const registerPriceEntry = (itemName, category, unit, unitPrice, quantity, vendorName, vendorId, date, refNo, type) => {
      if (!itemName || !unitPrice || unitPrice <= 0) return;
      const key = itemName.trim().toLowerCase();
      const qty = Number(quantity) || 1;
      const price = Number(unitPrice);
      const totalAmount = price * qty;

      if (!itemRecordsMap[key]) {
        itemRecordsMap[key] = {
          itemName: itemName.trim(),
          category: category || 'Raw Materials',
          unit: unit || 'kg',
          history: [],
          vendorQuotes: {}
        };
      }

      itemRecordsMap[key].history.push({
        unitPrice: price,
        quantity: qty,
        totalAmount,
        vendorName: vendorName || 'Direct Supplier',
        vendorId: vendorId || null,
        date: new Date(date || Date.now()),
        refNo: refNo || '',
        type
      });

      if (vendorName) {
        const vKey = vendorName.trim();
        if (!itemRecordsMap[key].vendorQuotes[vKey] || new Date(date) > new Date(itemRecordsMap[key].vendorQuotes[vKey].date)) {
          itemRecordsMap[key].vendorQuotes[vKey] = {
            vendorName: vKey,
            vendorId,
            lastPrice: price,
            lastQuantity: qty,
            date: new Date(date || Date.now()),
            type
          };
        }
      }
    };

    // 1. Process GRN entries
    for (const g of grns) {
      if (g.items && Array.isArray(g.items)) {
        for (const item of g.items) {
          registerPriceEntry(
            item.itemName,
            item.category,
            item.unit,
            item.unitPrice,
            item.acceptedQuantity || item.receivedQuantity || item.orderedQuantity || 1,
            g.vendorName,
            g.vendorId,
            g.receivedDate || g.createdAt,
            g.grnNumber,
            'GRN'
          );
        }
      }
    }

    // 2. Process PO entries
    for (const p of pos) {
      if (p.items && Array.isArray(p.items)) {
        for (const item of p.items) {
          registerPriceEntry(
            item.itemName,
            item.category,
            item.unit,
            item.unitPrice,
            item.orderedQuantity || item.requiredQuantity || 1,
            p.vendorName,
            p.vendorId,
            p.createdAt,
            p.poNumber,
            'PO'
          );
        }
      }
    }

    // 3. Process PR Quotes
    for (const pr of prs) {
      if (pr.quotes && Array.isArray(pr.quotes)) {
        for (const q of pr.quotes) {
          if (q.itemizedPrices && Array.isArray(q.itemizedPrices)) {
            for (const ip of q.itemizedPrices) {
              const prItem = (pr.items || []).find(i => (i.itemName || '').toLowerCase() === (ip.itemName || '').toLowerCase());
              registerPriceEntry(
                ip.itemName,
                'Raw Materials',
                'kg',
                ip.unitPrice,
                prItem ? prItem.requiredQuantity : 100,
                q.vendorName,
                q.vendorId,
                q.validUntil || pr.createdAt,
                pr.prNumber,
                'QUOTE'
              );
            }
          }
        }
      }
    }

    // 4. Include company inventory items
    for (const inv of inventories) {
      if (inv.itemName) {
        const key = inv.itemName.trim().toLowerCase();
        if (!itemRecordsMap[key]) {
          registerPriceEntry(
            inv.itemName,
            inv.category || 'Raw Materials',
            inv.unit || 'kg',
            inv.unitPrice || inv.costPrice || inv.sellingPrice || 40,
            inv.totalQuantity || inv.availableQuantity || 100,
            'Master Inventory',
            null,
            inv.createdAt || new Date(),
            'INV-CATALOG',
            'INVENTORY'
          );
        }
      }
    }

    // Seed default sample raw materials if DB has no historical entries for key raw materials
    const seedDefaults = [
      {
        itemName: 'Ragi (Finger Millet)',
        category: 'Raw Materials',
        unit: 'kg',
        history: [
          { unitPrice: 44, quantity: 850, totalAmount: 37400, vendorName: 'Kongu Agro Traders', date: new Date('2026-08-01'), refNo: 'GRN-2026-8801', type: 'GRN' },
          { unitPrice: 42, quantity: 1500, totalAmount: 63000, vendorName: 'Cauvery Organic Grains Co.', date: new Date('2026-07-15'), refNo: 'GRN-2026-7512', type: 'GRN' },
          { unitPrice: 40, quantity: 3850, totalAmount: 154000, vendorName: 'Kongu Agro Traders', date: new Date('2026-05-10'), refNo: 'GRN-2026-5104', type: 'GRN' },
          { unitPrice: 38, quantity: 5000, totalAmount: 190000, vendorName: 'TamilNadu Bio Grains Ltd', date: new Date('2026-03-20'), refNo: 'GRN-2026-3201', type: 'GRN' },
          { unitPrice: 39, quantity: 7300, totalAmount: 284700, vendorName: 'Cauvery Organic Grains Co.', date: new Date('2026-01-12'), refNo: 'GRN-2026-1120', type: 'GRN' },
        ]
      },
      {
        itemName: 'Black Rice (Karuppu Kavuni)',
        category: 'Raw Materials',
        unit: 'kg',
        history: [
          { unitPrice: 125, quantity: 400, totalAmount: 50000, vendorName: 'Heritage Grains Organics', date: new Date('2026-08-05'), refNo: 'GRN-2026-8804', type: 'GRN' },
          { unitPrice: 120, quantity: 800, totalAmount: 96000, vendorName: 'Cauvery Organic Grains Co.', date: new Date('2026-06-18'), refNo: 'GRN-2026-6180', type: 'GRN' },
          { unitPrice: 130, quantity: 1200, totalAmount: 156000, vendorName: 'Heritage Grains Organics', date: new Date('2026-04-02'), refNo: 'GRN-2026-4020', type: 'GRN' },
          { unitPrice: 122, quantity: 2500, totalAmount: 305000, vendorName: 'Kongu Agro Traders', date: new Date('2026-02-14'), refNo: 'GRN-2026-2140', type: 'GRN' },
        ]
      },
      {
        itemName: 'Urad Dal (Black Gram)',
        category: 'Raw Materials',
        unit: 'kg',
        history: [
          { unitPrice: 112, quantity: 1200, totalAmount: 134400, vendorName: 'Kongu Agro Traders', date: new Date('2026-08-03'), refNo: 'GRN-2026-8802', type: 'GRN' },
          { unitPrice: 115, quantity: 2000, totalAmount: 230000, vendorName: 'Sri Lakshmi Pulses', date: new Date('2026-07-02'), refNo: 'GRN-2026-7020', type: 'GRN' },
          { unitPrice: 110, quantity: 3500, totalAmount: 385000, vendorName: 'Kongu Agro Traders', date: new Date('2026-05-15'), refNo: 'GRN-2026-5150', type: 'GRN' },
          { unitPrice: 108, quantity: 5000, totalAmount: 540000, vendorName: 'Sri Lakshmi Pulses', date: new Date('2026-03-01'), refNo: 'GRN-2026-3010', type: 'GRN' },
        ]
      },
      {
        itemName: 'Samba Wheat',
        category: 'Raw Materials',
        unit: 'kg',
        history: [
          { unitPrice: 48, quantity: 600, totalAmount: 28800, vendorName: 'TamilNadu Bio Grains Ltd', date: new Date('2026-07-28'), refNo: 'GRN-2026-7280', type: 'GRN' },
          { unitPrice: 45, quantity: 1800, totalAmount: 81000, vendorName: 'Kongu Agro Traders', date: new Date('2026-05-22'), refNo: 'GRN-2026-5220', type: 'GRN' },
          { unitPrice: 46, quantity: 3000, totalAmount: 138000, vendorName: 'TamilNadu Bio Grains Ltd', date: new Date('2026-02-10'), refNo: 'GRN-2026-2100', type: 'GRN' },
        ]
      },
      {
        itemName: 'Cardamom (Elaichi)',
        category: 'Raw Materials',
        unit: 'kg',
        history: [
          { unitPrice: 2250, quantity: 25, totalAmount: 56250, vendorName: 'Highland Spices Kerala', date: new Date('2026-08-02'), refNo: 'GRN-2026-8803', type: 'GRN' },
          { unitPrice: 2350, quantity: 40, totalAmount: 94000, vendorName: 'Highland Spices Kerala', date: new Date('2026-06-10'), refNo: 'GRN-2026-6100', type: 'GRN' },
          { unitPrice: 2100, quantity: 60, totalAmount: 126000, vendorName: 'Western Ghats Bio Spices', date: new Date('2026-04-12'), refNo: 'GRN-2026-4120', type: 'GRN' },
        ]
      },
      {
        itemName: 'Stand-up Pouches 250g',
        category: 'Packaging Materials',
        unit: 'pcs',
        history: [
          { unitPrice: 3.80, quantity: 15000, totalAmount: 57000, vendorName: 'Apex FlexiPack India', date: new Date('2026-07-20'), refNo: 'GRN-2026-7200', type: 'GRN' },
          { unitPrice: 4.00, quantity: 25000, totalAmount: 100000, vendorName: 'Southern Poly Pack Ltd', date: new Date('2026-04-15'), refNo: 'GRN-2026-4150', type: 'GRN' },
        ]
      }
    ];

    for (const seed of seedDefaults) {
      const key = seed.itemName.trim().toLowerCase();
      if (!itemRecordsMap[key] || itemRecordsMap[key].history.length === 0) {
        if (!itemRecordsMap[key]) {
          itemRecordsMap[key] = {
            itemName: seed.itemName,
            category: seed.category,
            unit: seed.unit,
            history: [],
            vendorQuotes: {}
          };
        }
        for (const h of seed.history) {
          registerPriceEntry(
            seed.itemName,
            seed.category,
            seed.unit,
            h.unitPrice,
            h.quantity,
            h.vendorName,
            null,
            h.date,
            h.refNo,
            h.type
          );
        }
      }
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const intelligenceList = Object.values(itemRecordsMap).map(item => {
      item.history.sort((a, b) => new Date(b.date) - new Date(a.date));

      let thisMonthQuantity = 0;
      let thisYearQuantity = 0;
      let totalPurchaseQuantity = 0;
      let totalPurchaseCost = 0;

      item.history.forEach(h => {
        const d = new Date(h.date);
        const qty = Number(h.quantity) || 0;
        const amt = Number(h.totalAmount) || (qty * Number(h.unitPrice));

        totalPurchaseQuantity += qty;
        totalPurchaseCost += amt;

        if (d.getFullYear() === currentYear) {
          thisYearQuantity += qty;
          if (d.getMonth() === currentMonth) {
            thisMonthQuantity += qty;
          }
        }
      });

      const lastEntry = item.history[0] || {};
      const prevEntry = item.history[1] || lastEntry;

      const lastPrice = lastEntry.unitPrice || 0;
      const prevPrice = prevEntry.unitPrice || lastPrice;

      const priceDiff = lastPrice - prevPrice;
      const priceTrendPercent = prevPrice > 0 ? Number(((priceDiff / prevPrice) * 100).toFixed(1)) : 0;
      const averagePrice = totalPurchaseQuantity > 0
        ? Number((totalPurchaseCost / totalPurchaseQuantity).toFixed(2))
        : lastPrice;

      const prices = item.history.map(h => h.unitPrice);
      const minPrice = prices.length ? Math.min(...prices) : lastPrice;
      const maxPrice = prices.length ? Math.max(...prices) : lastPrice;

      // Detailed Vendor Breakdown
      const vendorMap = {};
      item.history.forEach(h => {
        const vName = h.vendorName || 'Direct Supplier';
        if (!vendorMap[vName]) {
          vendorMap[vName] = {
            vendorName: vName,
            vendorId: h.vendorId,
            totalQuantity: 0,
            totalAmount: 0,
            purchaseCount: 0,
            lastPrice: h.unitPrice,
            lastPurchaseDate: h.date,
            minPrice: h.unitPrice,
            maxPrice: h.unitPrice,
            quotes: [],
            purchases: []
          };
        }

        const v = vendorMap[vName];
        const qty = Number(h.quantity) || 0;
        const amt = Number(h.totalAmount) || (qty * Number(h.unitPrice));

        v.totalQuantity += qty;
        v.totalAmount += amt;
        v.purchaseCount += 1;
        v.minPrice = Math.min(v.minPrice, h.unitPrice);
        v.maxPrice = Math.max(v.maxPrice, h.unitPrice);
        v.purchases.push(h);

        if (h.type === 'QUOTE') {
          v.quotes.push(h);
        }

        if (new Date(h.date) >= new Date(v.lastPurchaseDate)) {
          v.lastPurchaseDate = h.date;
          v.lastPrice = h.unitPrice;
        }
      });

      const vendorAnalysis = Object.values(vendorMap).map(v => ({
        ...v,
        averagePrice: v.totalQuantity > 0 ? Number((v.totalAmount / v.totalQuantity).toFixed(2)) : v.lastPrice,
        sharePercent: totalPurchaseQuantity > 0 ? Number(((v.totalQuantity / totalPurchaseQuantity) * 100).toFixed(1)) : 0
      }));

      vendorAnalysis.sort((a, b) => b.totalQuantity - a.totalQuantity);

      const invMatch = inventories.find(i => (i.itemName || '').toLowerCase() === item.itemName.toLowerCase());

      return {
        itemName: item.itemName,
        category: item.category,
        unit: item.unit,
        lastPurchasePrice: lastPrice,
        currentPrice: lastPrice,
        previousPurchasePrice: prevPrice,
        priceChangeAmount: Number(priceDiff.toFixed(2)),
        priceTrendPercent,
        priceTrendDirection: priceDiff > 0 ? 'UP' : priceDiff < 0 ? 'DOWN' : 'FLAT',
        averagePrice,
        thisMonthQuantity,
        thisYearQuantity,
        totalPurchaseQuantity,
        totalPurchaseCost,
        lastPurchaseDate: lastEntry.date,
        lastRefNo: lastEntry.refNo,
        lastVendorName: lastEntry.vendorName,
        minHistoricalPrice: minPrice,
        maxHistoricalPrice: maxPrice,
        bestVendorName: vendorAnalysis[0]?.vendorName || lastEntry.vendorName || 'N/A',
        bestVendorPrice: vendorAnalysis[0]?.lastPrice || lastPrice,
        vendorCount: vendorAnalysis.length,
        vendorAnalysis,
        historyLog: item.history,
        currentStock: invMatch ? (invMatch.availableQuantity || invMatch.totalQuantity || 0) : 0,
        stockStatus: (invMatch && (invMatch.availableQuantity || 0) < 50) ? 'LOW_STOCK' : 'HEALTHY'
      };
    });

    intelligenceList.sort((a, b) => a.category.localeCompare(b.category) || a.itemName.localeCompare(b.itemName));

    res.json({
      success: true,
      data: intelligenceList,
      totalItems: intelligenceList.length
    });
  } catch (error) {
    next(error);
  }
};

