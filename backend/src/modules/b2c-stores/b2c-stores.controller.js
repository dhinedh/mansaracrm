// src/modules/b2c-stores/b2c-stores.controller.js
const prisma = require('../../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getNextInvoiceNo = async () => {
  const count = await prisma.invoice.findMany({ where: {} });
  return `B2C-INV-${String(count.length + 1).padStart(5, '0')}`;
};

// ─── Store CRUD ───────────────────────────────────────────────────────────────

// GET /b2c-stores
exports.getAllB2CStores = async (req, res, next) => {
  try {
    const { classification, zone, search, city } = req.query;

    const where = { isActive: true, dealerId: null };
    if (classification) where.classification = classification;
    if (zone) where.zone = zone;
    if (city) where.city = { $regex: city, $options: 'i' };

    let stores = await prisma.store.findMany({ where, orderBy: { createdAt: 'desc' } });

    if (search) {
      const q = search.toLowerCase();
      stores = stores.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.ownerName?.toLowerCase().includes(q) ||
        s.ownerPhone?.includes(q) ||
        s.phone?.includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.gstNumber?.toLowerCase().includes(q)
      );
    }

    // Enrich with last visit info
    const enriched = await Promise.all(stores.map(async (store) => {
      const visits = await prisma.visit.findMany({
        where: { storeId: store.id },
        orderBy: { date: 'desc' },
      });
      const lastVisit = visits[0] || null;
      const openInvoices = await prisma.invoice.findMany({
        where: { storeId: store.id, status: 'OPEN' }
      });
      const pendingAmount = openInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      return {
        ...store,
        visitCount: visits.length,
        lastVisitDate: lastVisit?.date || store.lastVisitDate || null,
        pendingAmount
      };
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

// POST /b2c-stores — Register new standalone B2C store
exports.createB2CStore = async (req, res, next) => {
  try {
    const {
      name, ownerName, ownerPhone, phone, gstNumber,
      address, city, state, pincode, zone,
      classification, initialInvestment, notes,
      tabletopStands, hangerStands, kitNotes
    } = req.body;

    if (!name || !address) {
      return res.status(400).json({ success: false, message: 'Store name and address are required.' });
    }

    const store = await prisma.store.create({
      data: {
        dealerId: null, // standalone B2C store — no dealer
        name,
        ownerName: ownerName || '',
        ownerPhone: ownerPhone || '',
        phone: phone || ownerPhone || '',
        gstNumber: gstNumber || '',
        address,
        city: city || '',
        state: state || '',
        pincode: pincode || '',
        zone: zone || '',
        classification: classification || 'RETAIL',
        initialInvestment: parseFloat(initialInvestment || 0),
        notes: notes || '',
        photos: [],
        stockStatus: 'DRAFT',
        stockConfig: [],
        isActive: true,
        tabletopStands: parseInt(tabletopStands || 0),
        hangerStands: parseInt(hangerStands || 0),
        kitNotes: kitNotes || '',
        initialKitAllocated: (parseInt(tabletopStands || 0) > 0 || parseInt(hangerStands || 0) > 0)
      }
    });

    res.status(201).json({ success: true, message: 'B2C Store registered successfully', data: store });
  } catch (error) {
    next(error);
  }
};

// GET /b2c-stores/:id — Full store profile
exports.getB2CStoreById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found.' });
    }

    // Fetch associated data
    const [visits, invoices, expenses, offerDist] = await Promise.all([
      prisma.visit.findMany({ where: { storeId: id }, orderBy: { date: 'desc' } }),
      prisma.invoice.findMany({ where: { storeId: id }, orderBy: { createdAt: 'desc' } }),
      prisma.expense.findMany({ where: { storeId: id }, orderBy: { date: 'desc' } }),
      prisma.offerDistribution.findMany({ where: { storeId: id }, orderBy: { date: 'desc' } })
    ]);

    const pendingAmount = invoices
      .filter(i => i.status === 'OPEN')
      .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    res.json({
      success: true,
      data: {
        ...store,
        visits,
        invoices,
        expenses,
        offerDistributions: offerDist,
        visitCount: visits.length,
        pendingAmount,
        lastVisitDate: visits[0]?.date || null
      }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /b2c-stores/:id — Update store info
exports.updateB2CStore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name, ownerName, ownerPhone, phone, gstNumber,
      address, city, state, pincode, zone,
      classification, initialInvestment, notes, revisitDate,
      tabletopStands, hangerStands, kitNotes, initialKitAllocated
    } = req.body;

    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });

    const updated = await prisma.store.update({
      where: { id },
      data: {
        name: name || store.name,
        ownerName: ownerName !== undefined ? ownerName : store.ownerName,
        ownerPhone: ownerPhone !== undefined ? ownerPhone : store.ownerPhone,
        phone: phone !== undefined ? phone : store.phone,
        gstNumber: gstNumber !== undefined ? gstNumber : store.gstNumber,
        address: address || store.address,
        city: city !== undefined ? city : store.city,
        state: state !== undefined ? state : store.state,
        pincode: pincode !== undefined ? pincode : store.pincode,
        zone: zone !== undefined ? zone : store.zone,
        classification: classification !== undefined ? classification : store.classification,
        initialInvestment: initialInvestment !== undefined ? parseFloat(initialInvestment) : store.initialInvestment,
        notes: notes !== undefined ? notes : store.notes,
        revisitDate: revisitDate !== undefined ? (revisitDate ? new Date(revisitDate) : null) : store.revisitDate,
        tabletopStands: tabletopStands !== undefined ? parseInt(tabletopStands || 0) : store.tabletopStands,
        hangerStands: hangerStands !== undefined ? parseInt(hangerStands || 0) : store.hangerStands,
        kitNotes: kitNotes !== undefined ? kitNotes : store.kitNotes,
        initialKitAllocated: initialKitAllocated !== undefined ? initialKitAllocated : (tabletopStands !== undefined || hangerStands !== undefined ? (parseInt(tabletopStands || 0) > 0 || parseInt(hangerStands || 0) > 0) : store.initialKitAllocated)
      }
    });

    res.json({ success: true, message: 'Store updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

// DELETE /b2c-stores/:id — Soft delete
exports.deleteB2CStore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });

    await prisma.store.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true, message: 'Store deactivated successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── Stock Configuration ───────────────────────────────────────────────────

// GET /b2c-stores/:id/stock
exports.getStoreStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });
    res.json({ success: true, data: { stockConfig: store.stockConfig || [], stockStatus: store.stockStatus } });
  } catch (error) {
    next(error);
  }
};

// PUT /b2c-stores/:id/stock — Save draft stock config
exports.updateStoreStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { products } = req.body; // [{productId, productName, assignedStock, price}]

    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });
    if (store.stockStatus === 'FROZEN') {
      return res.status(400).json({ success: false, message: 'Stock is frozen. Unfreeze to edit.' });
    }

    const stockConfig = (products || []).map(p => ({
      productId: p.productId,
      productName: p.productName,
      assignedStock: parseInt(p.assignedStock || 0),
      currentStock: parseInt(p.assignedStock || 0),
      price: parseFloat(p.price || 0),
      addedAt: new Date()
    }));

    const updated = await prisma.store.update({
      where: { id },
      data: { stockConfig }
    });

    res.json({ success: true, message: 'Stock configuration saved.', data: updated });
  } catch (error) {
    next(error);
  }
};

// POST /b2c-stores/:id/stock/freeze
exports.freezeStoreStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });

    const updated = await prisma.store.update({
      where: { id },
      data: { stockStatus: 'FROZEN' }
    });

    res.json({ success: true, message: 'Stock configuration frozen.', data: updated });
  } catch (error) {
    next(error);
  }
};

// POST /b2c-stores/:id/stock/unfreeze
exports.unfreezeStoreStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });

    const updated = await prisma.store.update({
      where: { id },
      data: { stockStatus: 'DRAFT' }
    });

    res.json({ success: true, message: 'Stock configuration unfrozen.', data: updated });
  } catch (error) {
    next(error);
  }
};

// POST /b2c-stores/:id/stock/add — Add stock for multiple products (including new ones)
exports.addStoreStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { products } = req.body; // products: [{ productId, productName, quantity, price }]

    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });

    const stockConfig = [...(store.stockConfig || [])];

    for (const item of (products || [])) {
      const addQty = parseInt(item.quantity || 0);
      if (addQty <= 0) continue;

      const existingIndex = stockConfig.findIndex(sc => sc.productId.toString() === item.productId.toString());
      if (existingIndex !== -1) {
        stockConfig[existingIndex] = {
          ...stockConfig[existingIndex],
          assignedStock: (stockConfig[existingIndex].assignedStock || 0) + addQty,
          currentStock: (stockConfig[existingIndex].currentStock || 0) + addQty,
          price: parseFloat(item.price || stockConfig[existingIndex].price || 0)
        };
      } else {
        stockConfig.push({
          productId: item.productId,
          productName: item.productName || 'Product',
          assignedStock: addQty,
          currentStock: addQty,
          price: parseFloat(item.price || 0),
          addedAt: new Date()
        });
      }
    }

    const updated = await prisma.store.update({ where: { id }, data: { stockConfig } });
    res.json({ success: true, message: 'Stock added successfully.', data: updated });
  } catch (error) {
    next(error);
  }
};

// PUT /b2c-stores/:id/stock/audit — Audit remaining stock levels during visit
exports.auditStoreStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { products } = req.body; // [{ productId, currentStock }]

    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });

    const stockConfig = (store.stockConfig || []).map(item => {
      const auditedItem = (products || []).find(p => p.productId.toString() === item.productId.toString());
      if (auditedItem) {
        return {
          ...item,
          currentStock: Math.max(0, parseInt(auditedItem.currentStock || 0))
        };
      }
      return item;
    });

    const updated = await prisma.store.update({ where: { id }, data: { stockConfig } });
    res.json({ success: true, message: 'Stock audited successfully.', data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── Visits ───────────────────────────────────────────────────────────────────

// GET /b2c-stores/:id/visits
exports.getStoreVisits = async (req, res, next) => {
  try {
    const { id } = req.params;
    const visits = await prisma.visit.findMany({
      where: { storeId: id },
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data: visits });
  } catch (error) {
    next(error);
  }
};

// POST /b2c-stores/:id/visits/checkin
exports.checkInStoreVisit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { visitorName, purpose, remarks, latitude, longitude } = req.body;

    if (!visitorName || !purpose) {
      return res.status(400).json({ success: false, message: 'Visitor name and purpose are required.' });
    }

    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });

    const visit = await prisma.visit.create({
      data: {
        storeId: id,
        visitorName,
        purpose,
        remarks: remarks || '',
        photos: [],
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        checkInTime: new Date(),
        verified: true,
        date: new Date(),
        outcome: 'Checked In — Visit Pending Checkout'
      }
    });

    // Update store lastVisitDate
    await prisma.store.update({
      where: { id },
      data: { lastVisitDate: new Date() }
    });

    res.status(201).json({ success: true, message: 'Checked in successfully.', data: visit });
  } catch (error) {
    next(error);
  }
};

// PUT /b2c-stores/visits/:visitId/checkout
exports.checkOutStoreVisit = async (req, res, next) => {
  try {
    const { visitId } = req.params;
    const {
      outcome, remarks, paymentsCollected, paymentMethod,
      revisitDate, newInvoiceId, returns
    } = req.body;

    if (!outcome) {
      return res.status(400).json({ success: false, message: 'Outcome is required for checkout.' });
    }

    const visit = await prisma.visit.findUnique({ where: { id: visitId } });
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found.' });

    const storeId = visit.storeId;

    // Update visit
    const updated = await prisma.visit.update({
      where: { id: visitId },
      data: {
        outcome,
        remarks: remarks || visit.remarks || '',
        paymentsCollected: parseFloat(paymentsCollected || 0),
        paymentMethod: paymentMethod || 'NONE',
        newInvoiceId: newInvoiceId || null,
        revisitDate: revisitDate ? new Date(revisitDate) : null,
        returns: returns || [],
        checkOutTime: new Date()
      }
    });

    // Update store revisitDate & apply FIFO payment cascade
    if (storeId) {
      const storeUpdates = {};
      if (revisitDate) storeUpdates.revisitDate = new Date(revisitDate);

      const collected = parseFloat(paymentsCollected || 0);
      if (collected > 0) {
        const openInvoices = await prisma.invoice.findMany({
          where: { storeId, status: 'OPEN' },
          orderBy: { createdAt: 'asc' }
        });

        let remaining = collected;
        for (const inv of openInvoices) {
          if (remaining <= 0) break;
          if (remaining >= inv.totalAmount) {
            remaining -= inv.totalAmount;
            await prisma.invoice.update({
              where: { id: inv.id },
              data: { status: 'CLOSED', paidAt: new Date(), totalAmount: 0 }
            });
          } else {
            await prisma.invoice.update({
              where: { id: inv.id },
              data: { totalAmount: inv.totalAmount - remaining }
            });
            remaining = 0;
          }
        }
      }

      if (Object.keys(storeUpdates).length > 0) {
        await prisma.store.update({ where: { id: storeId }, data: storeUpdates });
      }
    }

    res.json({ success: true, message: 'Checked out and payments processed.', data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── Billing ──────────────────────────────────────────────────────────────────

// GET /b2c-stores/:id/invoices
exports.getStoreInvoices = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const where = { storeId: id };
    if (status) where.status = status;

    const invoices = await prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    // Enrich with items
    const enriched = await Promise.all(invoices.map(async inv => {
      const items = await prisma.invoiceItem.findMany({ where: { invoiceId: inv.id } });
      return { ...inv, items };
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

// POST /b2c-stores/:id/invoices — Create B2C invoice for store
exports.createStoreInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items, discount, notes, isGstEnabled, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required.' });
    }

    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });

    const gstEnabled = isGstEnabled !== false;
    const totalDiscount = parseFloat(discount || 0);

    let subtotal = 0;
    let totalGst = 0;
    const invoiceItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;

      const qty = parseInt(item.quantity || 1);
      const unitPrice = parseFloat(item.price || product.price || 0);
      const gstPct = gstEnabled ? (product.gstPercent || 5) : 0;
      const gstAmt = (unitPrice * qty * gstPct) / 100;
      const lineTotal = unitPrice * qty + gstAmt;

      subtotal += unitPrice * qty;
      totalGst += gstAmt;

      invoiceItems.push({
        productId: item.productId,
        productName: product.name,
        quantity: qty,
        unitPrice,
        marginPct: 0,
        sellingPrice: unitPrice,
        gstPercent: gstPct,
        gstAmount: gstAmt,
        lineTotal
      });
    }

    const totalAmount = Math.max(0, subtotal + totalGst - totalDiscount);
    const invoiceNo = await getNextInvoiceNo();

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNo,
        storeId: id,
        dealerId: store.dealerId || null,
        channel: 'B2B',
        subtotal,
        totalDiscount,
        totalGst,
        cgst: totalGst / 2,
        sgst: totalGst / 2,
        isGstEnabled: gstEnabled,
        totalAmount,
        shippingCharges: 0,
        notes: notes || '',
        status: paymentMethod ? 'CLOSED' : 'OPEN',
        paidAt: paymentMethod ? new Date() : null
      }
    });

    // Create invoice items
    for (const item of invoiceItems) {
      await prisma.invoiceItem.create({
        data: { invoiceId: invoice.id, ...item }
      });
    }

    // Deduct from store stockConfig if frozen
    if (store.stockStatus === 'FROZEN') {
      const stockConfig = (store.stockConfig || []).map(sc => {
        const sold = invoiceItems.find(i => i.productId.toString() === sc.productId.toString());
        if (sold) {
          return { ...sc, currentStock: Math.max(0, (sc.currentStock || 0) - sold.quantity) };
        }
        return sc;
      });
      await prisma.store.update({ where: { id }, data: { stockConfig } });
    }

    res.status(201).json({ success: true, message: 'Invoice created successfully.', data: invoice });
  } catch (error) {
    next(error);
  }
};

// ─── Expenses ─────────────────────────────────────────────────────────────────

// GET /b2c-stores/:id/expenses
exports.getStoreExpenses = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expenses = await prisma.expense.findMany({
      where: { storeId: id },
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, data: expenses });
  } catch (error) {
    next(error);
  }
};

// POST /b2c-stores/:id/expenses — Log expense for store
exports.createStoreExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, amount, date, category, billUrl, notes } = req.body;

    if (!title || amount === undefined || !category) {
      return res.status(400).json({ success: false, message: 'Title, amount, and category are required.' });
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        category,
        storeId: id,
        billUrl: billUrl || '',
        notes: notes || ''
      }
    });

    res.status(201).json({ success: true, message: 'Expense logged successfully.', data: expense });
  } catch (error) {
    next(error);
  }
};

// ─── Offers ───────────────────────────────────────────────────────────────────

// GET /b2c-stores/:id/offers
exports.getStoreOffers = async (req, res, next) => {
  try {
    const { id } = req.params;
    const distributions = await prisma.offerDistribution.findMany({
      where: { storeId: id },
      orderBy: { date: 'desc' }
    });

    // Enrich with offer item info
    const enriched = await Promise.all(distributions.map(async d => {
      const item = d.offerItemId ? await prisma.offerItem.findUnique({ where: { id: d.offerItemId.toString() } }) : null;
      return { ...d, offerItem: item };
    }));

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

// ─── Photo Upload ─────────────────────────────────────────────────────────────

// POST /b2c-stores/upload-photo
exports.uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo uploaded.' });
    }
    const photoUrl = `uploads/${req.file.filename}`;
    res.json({ success: true, message: 'Photo uploaded successfully.', photoUrl });
  } catch (error) {
    next(error);
  }
};

// POST /b2c-stores/:id/photos — Add photo to store profile
exports.addStorePhoto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { photoUrl } = req.body;

    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });

    const photos = [...(store.photos || []), photoUrl];
    const updated = await prisma.store.update({ where: { id }, data: { photos } });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── P&L Report ───────────────────────────────────────────────────────────────

// GET /b2c-stores/:id/report
exports.getStoreReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const store = await prisma.store.findUnique({ where: { id } });
    if (!store) return res.status(404).json({ success: false, message: 'Store not found.' });

    const [invoices, expenses, offerDist, visits] = await Promise.all([
      prisma.invoice.findMany({ where: { storeId: id } }),
      prisma.expense.findMany({ where: { storeId: id } }),
      prisma.offerDistribution.findMany({ where: { storeId: id } }),
      prisma.visit.findMany({ where: { storeId: id }, orderBy: { date: 'desc' } })
    ]);

    // Invoice metrics
    const allInvoiceItems = await Promise.all(
      invoices.map(inv => prisma.invoiceItem.findMany({ where: { invoiceId: inv.id } }))
    );

    const totalBilled = invoices.reduce((s, i) => s + (i.subtotal + i.totalGst || 0), 0);
    const totalDiscount = invoices.reduce((s, i) => s + (i.totalDiscount || 0), 0);
    const totalGst = invoices.reduce((s, i) => s + (i.totalGst || 0), 0);
    const totalNetBilled = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);

    const closedInvoices = invoices.filter(i => i.status === 'CLOSED' || i.status === 'PAID');
    const openInvoices = invoices.filter(i => i.status === 'OPEN');
    const totalCollected = closedInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
    const pendingAmount = openInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0);

    // Expense metrics
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const expenseBreakdown = {
      TRAVEL: 0, FOOD: 0, HOTEL: 0, STORE: 0, OFFER: 0, MISC: 0
    };
    expenses.forEach(e => {
      const cat = e.category?.toUpperCase() || 'MISC';
      expenseBreakdown[cat] = (expenseBreakdown[cat] || 0) + (e.amount || 0);
    });

    // Offer metrics
    const totalOfferQty = offerDist.reduce((s, o) => s + (o.quantity || 0), 0);
    const offerItemIds = [...new Set(offerDist.map(o => o.offerItemId?.toString()).filter(Boolean))];
    let totalOfferCost = 0;
    for (const oid of offerItemIds) {
      const item = await prisma.offerItem.findUnique({ where: { id: oid } });
      if (item) {
        const distQty = offerDist
          .filter(o => o.offerItemId?.toString() === oid)
          .reduce((s, o) => s + (o.quantity || 0), 0);
        totalOfferCost += (item.purchaseCost || 0) * distQty;
      }
    }

    // Product demand analysis
    const productDemands = {};
    allInvoiceItems.flat().forEach(item => {
      const pid = item.productId?.toString();
      if (!pid) return;
      if (!productDemands[pid]) {
        productDemands[pid] = { productId: pid, productName: item.productName || '', quantitySold: 0, revenue: 0 };
      }
      productDemands[pid].quantitySold += item.quantity || 0;
      productDemands[pid].revenue += item.lineTotal || 0;
    });
    const sortedDemands = Object.values(productDemands).sort((a, b) => b.quantitySold - a.quantitySold);

    // Net P&L
    const totalInvestment = (store.initialInvestment || 0) + totalExpenses + totalOfferCost;
    const netProfit = totalCollected - totalInvestment;

    res.json({
      success: true,
      data: {
        store,
        metrics: {
          initialInvestment: store.initialInvestment || 0,
          totalBilled,
          totalDiscount,
          totalGst,
          totalNetBilled,
          totalCollected,
          pendingAmount,
          totalExpenses,
          totalOfferCost,
          totalOfferQty,
          totalInvestment,
          netProfit,
          isProfitable: netProfit >= 0,
          invoiceCount: invoices.length,
          closedInvoiceCount: closedInvoices.length,
          openInvoiceCount: openInvoices.length,
          visitCount: visits.length,
          lastVisitDate: visits[0]?.date || null
        },
        expenseBreakdown,
        productDemands: sortedDemands,
        recentVisits: visits.slice(0, 5),
        stockConfig: store.stockConfig || []
      }
    });
  } catch (error) {
    next(error);
  }
};
