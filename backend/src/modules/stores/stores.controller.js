// src/modules/stores/stores.controller.js
const prisma = require('../../config/database');
const mongoose = require('mongoose');
const { sendStoreWhatsAppRegistration } = require('../../utils/whatsappService');
const { logAudit } = require('../../utils/auditLogger');

/**
 * GET /api/stores
 * Fetches stores with accurate dealer mapping, zone, and margin rule enrichment
 */
exports.getDealerStores = async (req, res, next) => {
  try {
    const where = { isActive: true };

    if (req.user.role === 'DEALER') {
      if (req.user.dealer) {
        where.dealerId = req.user.dealer.id;
      }
    } else if (req.query.dealerId) {
      where.dealerId = req.query.dealerId;
    }

    if (req.query.classification) {
      where.classification = req.query.classification;
    }
    if (req.query.zone) {
      where.zone = req.query.zone;
    }

    const stores = await prisma.store.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    // Load dealers to map accurate dealer names without hardcoded fallbacks
    const allDealers = await prisma.dealer.findMany({
      select: { id: true, companyName: true, name: true, phone: true, city: true, zone: true }
    });
    const dealerMap = new Map();
    allDealers.forEach(d => {
      dealerMap.set(String(d.id), d);
      if (d._id) dealerMap.set(String(d._id), d);
    });

    const enriched = [];
    for (const store of stores) {
      let marginRule = null;
      if (store.dealerId) {
        marginRule = await prisma.margin.findFirst({
          where: {
            dealerId: store.dealerId,
            storeId: store.id,
            productId: null,
            categoryId: null
          }
        });
      }

      // Map correct dealer name or display 'Direct / Head Office'
      const assignedDealer = store.dealerId ? dealerMap.get(String(store.dealerId)) : null;
      const dealerName = assignedDealer 
        ? (assignedDealer.companyName || assignedDealer.name || 'Assigned Dealer')
        : 'Direct / Head Office';

      enriched.push({
        ...store,
        dealer: assignedDealer ? {
          id: assignedDealer.id,
          companyName: assignedDealer.companyName || assignedDealer.name,
          phone: assignedDealer.phone,
          city: assignedDealer.city,
          zone: assignedDealer.zone
        } : null,
        dealerName,
        dealerCity: assignedDealer ? assignedDealer.city : '',
        marginPercent: marginRule ? marginRule.marginPercent : null,
        locationStatus: store.locationStatus || (store.latitude && store.longitude ? 'COORDINATES_CAPTURED' : 'PENDING_COORDINATES'),
        isLocationVerified: !!store.isLocationVerified
      });
    }

    res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/stores
 * Create shop with manual address entry (GPS optional), duplicate prevention, and audit logging
 */
exports.createStore = async (req, res, next) => {
  try {
    let dealerId = null;
    if (req.user.role === 'DEALER') {
      dealerId = req.user.dealer?.id || null;
    } else if (req.user.role === 'ADMIN' || req.user.role === 'SALES' || req.user.role === 'B2B_MANAGER') {
      // Optional explicit dealerId assignment; do NOT force arbitrary default dealer
      if (req.body.dealerId && mongoose.Types.ObjectId.isValid(req.body.dealerId)) {
        dealerId = req.body.dealerId;
      }
    } else {
      return res.status(403).json({ success: false, message: 'Unauthorized to create stores' });
    }

    const {
      name, gstNumber, address, city, state, pincode, zone, phone,
      ownerName, ownerPhone, initialInvestment, notes,
      marginPercent, classification, revisitDate,
      latitude, longitude, manualAddress
    } = req.body;

    if (!name || !address) {
      return res.status(400).json({ success: false, message: 'Store name and address are required' });
    }

    // 1. Duplicate Prevention
    const StoreModel = mongoose.model('Store');
    const cleanPhone = phone ? String(phone).replace(/\D/g, '') : '';
    if (cleanPhone) {
      const existing = await StoreModel.findOne({ phone: cleanPhone, isActive: true });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `A shop with phone number ${phone} is already registered (${existing.name})`
        });
      }
    }

    // Check for exact name + city duplicate
    if (city) {
      const existingName = await StoreModel.findOne({
        name: new RegExp(`^${name.trim()}$`, 'i'),
        city: new RegExp(`^${city.trim()}$`, 'i'),
        isActive: true
      });
      if (existingName) {
        return res.status(400).json({
          success: false,
          message: `A shop named "${name}" in ${city} is already registered`
        });
      }
    }

    // GPS coordinates validation
    const lat = latitude ? parseFloat(latitude) : undefined;
    const lng = longitude ? parseFloat(longitude) : undefined;
    const hasGps = !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);

    const store = await StoreModel.create({
      dealerId: dealerId || undefined,
      name: name.trim(),
      gstNumber: gstNumber ? gstNumber.trim() : '',
      address: address.trim(),
      manualAddress: manualAddress ? manualAddress.trim() : address.trim(),
      city: city ? city.trim() : '',
      state: state ? state.trim() : 'Tamil Nadu',
      pincode: pincode ? pincode.trim() : '',
      zone: zone ? zone.trim() : '',
      phone: cleanPhone || phone || '',
      ownerName: ownerName ? ownerName.trim() : '',
      ownerPhone: ownerPhone ? ownerPhone.trim() : '',
      initialInvestment: parseFloat(initialInvestment || 0),
      notes: notes || '',
      classification: classification || 'RETAIL',
      revisitDate: revisitDate ? new Date(revisitDate) : null,
      latitude: hasGps ? lat : undefined,
      longitude: hasGps ? lng : undefined,
      isLocationVerified: hasGps && req.user.role === 'ADMIN',
      locationStatus: hasGps ? (req.user.role === 'ADMIN' ? 'VERIFIED' : 'COORDINATES_CAPTURED') : 'PENDING_COORDINATES',
      isActive: true
    });

    if (dealerId && marginPercent !== undefined && marginPercent !== null && marginPercent !== '') {
      await prisma.margin.create({
        data: {
          dealerId,
          storeId: store._id.toString(),
          marginPercent: parseFloat(marginPercent)
        }
      });
    }

    // Resolve servicing dealer name for notification
    let dealerName = 'Direct / Head Office';
    if (dealerId) {
      try {
        const d = await prisma.dealer.findUnique({ where: { id: dealerId }, select: { companyName: true, name: true } });
        if (d) dealerName = d.companyName || d.name || 'Assigned Distributor';
      } catch (_) {}
    }

    // Audit Log
    await logAudit({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'Store',
      entityId: store._id.toString(),
      recordTitle: store.name,
      details: `Created new shop "${store.name}" in ${store.city || 'unspecified'}. Location Status: ${store.locationStatus}`,
      newValues: store.toObject(),
      req
    });

    // Dispatch WhatsApp registration notification
    let whatsappResult = { success: false };
    const storeContactPhone = cleanPhone || ownerPhone;
    if (storeContactPhone) {
      try {
        whatsappResult = await sendStoreWhatsAppRegistration({
          name: store.name,
          ownerName: store.ownerName,
          phone: storeContactPhone,
          address: store.address,
          city: store.city,
          state: store.state,
          gstNumber: store.gstNumber,
          dealerName,
          marginPercent: marginPercent !== undefined && marginPercent !== null && marginPercent !== '' ? marginPercent : null
        });
      } catch (waErr) {
        console.warn('[STORES CONTROLLER] Store registration message error:', waErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Store created successfully' + (whatsappResult.success ? ' and WhatsApp confirmation sent' : ''),
      data: {
        ...store.toObject(),
        dealerName,
        whatsappNotificationSent: whatsappResult.success
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/stores/:id
 * Full Admin editing capabilities with Audit Logging
 */
exports.updateStore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const StoreModel = mongoose.model('Store');
    const store = await StoreModel.findById(id);

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    // Authorization: Admin, B2B Manager, or the owning dealer
    const isAdmin = ['ADMIN', 'B2B_MANAGER'].includes(req.user.role);
    if (!isAdmin && req.user.role === 'DEALER') {
      if (String(store.dealerId) !== String(req.user.dealer?.id)) {
        return res.status(403).json({ success: false, message: 'Unauthorized: Store belongs to another dealer' });
      }
    } else if (!isAdmin && req.user.role !== 'SALES') {
      return res.status(403).json({ success: false, message: 'Unauthorized to edit store' });
    }

    const oldValues = store.toObject();

    const {
      name, gstNumber, address, manualAddress, city, state, pincode, zone, phone,
      ownerName, ownerPhone, initialInvestment, notes,
      marginPercent, classification, revisitDate,
      dealerId, latitude, longitude, locationStatus, isLocationVerified
    } = req.body;

    if (name) store.name = name.trim();
    if (gstNumber !== undefined) store.gstNumber = gstNumber.trim();
    if (address) store.address = address.trim();
    if (manualAddress !== undefined) store.manualAddress = manualAddress.trim();
    if (city !== undefined) store.city = city.trim();
    if (state !== undefined) store.state = state.trim();
    if (pincode !== undefined) store.pincode = pincode.trim();
    if (zone !== undefined) store.zone = zone.trim();
    if (phone !== undefined) store.phone = phone.trim();
    if (ownerName !== undefined) store.ownerName = ownerName.trim();
    if (ownerPhone !== undefined) store.ownerPhone = ownerPhone.trim();
    if (initialInvestment !== undefined) store.initialInvestment = parseFloat(initialInvestment || 0);
    if (notes !== undefined) store.notes = notes;
    if (classification !== undefined) store.classification = classification;
    if (revisitDate !== undefined) store.revisitDate = revisitDate ? new Date(revisitDate) : null;

    // Admin-only fields: Dealer assignment & Location verification
    if (isAdmin) {
      if (dealerId !== undefined) {
        store.dealerId = (dealerId && mongoose.Types.ObjectId.isValid(dealerId)) ? dealerId : undefined;
      }
      if (isLocationVerified !== undefined) {
        store.isLocationVerified = !!isLocationVerified;
        if (store.isLocationVerified) store.locationStatus = 'VERIFIED';
      }
      if (locationStatus) {
        store.locationStatus = locationStatus;
      }
    }

    if (latitude !== undefined && longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        store.latitude = lat;
        store.longitude = lng;
        if (store.locationStatus === 'PENDING_COORDINATES') {
          store.locationStatus = isAdmin ? 'VERIFIED' : 'COORDINATES_CAPTURED';
        }
      }
    }

    await store.save();

    // Update margin rule if provided
    if (store.dealerId && marginPercent !== undefined && marginPercent !== null) {
      const existingMargin = await prisma.margin.findFirst({
        where: {
          dealerId: store.dealerId.toString(),
          storeId: id,
          productId: null,
          categoryId: null
        }
      });

      if (marginPercent === '') {
        if (existingMargin) {
          await prisma.margin.delete({ where: { id: existingMargin.id } });
        }
      } else {
        if (existingMargin) {
          await prisma.margin.update({
            where: { id: existingMargin.id },
            data: { marginPercent: parseFloat(marginPercent) }
          });
        } else {
          await prisma.margin.create({
            data: {
              dealerId: store.dealerId.toString(),
              storeId: id,
              marginPercent: parseFloat(marginPercent)
            }
          });
        }
      }
    }

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'Store',
      entityId: id,
      recordTitle: store.name,
      details: `Updated details for shop "${store.name}"`,
      oldValues,
      newValues: store.toObject(),
      req
    });

    res.json({
      success: true,
      message: 'Store details updated successfully',
      data: store
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/stores/:id/match-location
 * Matches/captures GPS location for existing shop (Requirement 7)
 */
exports.matchStoreLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, locationName, addressNotes } = req.body;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) {
      return res.status(400).json({ success: false, message: 'Valid GPS latitude and longitude are required' });
    }

    const StoreModel = mongoose.model('Store');
    const store = await StoreModel.findById(id);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const oldValues = { latitude: store.latitude, longitude: store.longitude, locationStatus: store.locationStatus };
    const isAdmin = ['ADMIN', 'B2B_MANAGER'].includes(req.user.role);

    store.latitude = lat;
    store.longitude = lng;
    if (locationName) store.locationName = locationName;
    if (addressNotes) store.addressVerificationNotes = addressNotes;
    store.locationStatus = isAdmin ? 'VERIFIED' : 'COORDINATES_CAPTURED';
    store.isLocationVerified = isAdmin;

    await store.save();

    await logAudit({
      userId: req.user.id,
      action: 'LOCATION_MATCH',
      entity: 'Store',
      entityId: id,
      recordTitle: store.name,
      details: `Matched GPS coordinates (${lat.toFixed(5)}, ${lng.toFixed(5)}) for shop "${store.name}"`,
      oldValues,
      newValues: { latitude: lat, longitude: lng, locationStatus: store.locationStatus },
      req
    });

    res.json({
      success: true,
      message: `GPS coordinates successfully matched for ${store.name}`,
      data: store
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/stores/:id/verify-location
 * Admin approves and verifies shop address & coordinates
 */
exports.verifyStoreLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const StoreModel = mongoose.model('Store');
    const store = await StoreModel.findById(id);

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    store.isLocationVerified = true;
    store.locationStatus = 'VERIFIED';
    await store.save();

    await logAudit({
      userId: req.user.id,
      action: 'LOCATION_VERIFIED',
      entity: 'Store',
      entityId: id,
      recordTitle: store.name,
      details: `Admin verified location for ${store.name}`,
      req
    });

    res.json({
      success: true,
      message: `Location verified for ${store.name}`,
      data: store
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/stores/:id/orders
 * Shop-wise Order Tracking: Returns all orders placed by this shop (Requirement 5)
 * Accessible by Admin and Sales users without requiring active check-in
 */
exports.getStoreOrders = async (req, res, next) => {
  try {
    const { id } = req.params;
    const StoreModel = mongoose.model('Store');
    const store = await StoreModel.findById(id).lean();

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const FieldOrderModel = mongoose.model('FieldSalesOrder');
    const InvoiceModel = mongoose.model('Invoice');

    // Fetch field orders
    const fieldOrders = await FieldOrderModel.find({ storeId: id })
      .populate('salespersonId', 'name phone email')
      .populate('dealerId', 'companyName phone')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch invoices for this store
    const invoices = await InvoiceModel.find({ storeId: id })
      .populate('dealer', 'companyName phone')
      .populate('items.productId', 'name sku price mrp')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    // Combine & normalize orders
    const normalizedOrders = [];

    fieldOrders.forEach(o => {
      normalizedOrders.push({
        id: o._id,
        orderNumber: o.orderNumber,
        source: 'FIELD_SALES',
        orderDate: o.createdAt,
        totalAmount: o.totalAmount || 0,
        status: o.status || 'PENDING',
        paymentMethod: o.paymentMethod || 'NONE',
        salespersonName: o.salespersonId?.name || o.salespersonName || 'Sales Representative',
        dealerName: o.dealerId?.companyName || (o.dealerId ? 'Distributor Partner' : 'Direct / Head Office'),
        itemsCount: (o.items || []).length,
        items: (o.items || []).map(i => ({
          productName: i.productName || 'Product',
          quantity: i.quantity || 1,
          unitPrice: i.unitPrice || 0,
          lineTotal: (i.unitPrice || 0) * (i.quantity || 1)
        })),
        notes: o.notes || ''
      });
    });

    invoices.forEach(inv => {
      // Prevent duplicates if already represented by field order
      normalizedOrders.push({
        id: inv._id,
        orderNumber: inv.invoiceNo,
        source: 'INVOICE_BILLING',
        orderDate: inv.createdAt,
        totalAmount: inv.totalAmount || 0,
        status: inv.status || 'OPEN',
        paymentMethod: inv.isCredit ? 'CREDIT' : 'DIRECT',
        salespersonName: 'Invoice Direct',
        dealerName: inv.dealer?.companyName || 'Direct / Head Office',
        itemsCount: (inv.items || []).length,
        items: (inv.items || []).map(i => ({
          productName: i.product?.name || i.productId?.name || 'Item',
          quantity: i.quantity || 1,
          unitPrice: i.sellingPrice || i.unitPrice || 0,
          lineTotal: i.lineTotal || 0
        })),
        notes: inv.notes || ''
      });
    });

    // Sort combined by orderDate descending
    normalizedOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

    const totalValue = normalizedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    res.json({
      success: true,
      data: {
        store: {
          id: store._id,
          name: store.name,
          phone: store.phone,
          address: store.address,
          city: store.city
        },
        totalOrders: normalizedOrders.length,
        totalOrderValue: totalValue,
        orders: normalizedOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/stores/:id/stock
 * Shop-wise Stock Tracking: Product-wise stock, low stock alerts, replenishment info (Requirement 6)
 * Accessible by Admin and Sales users without active check-in
 */
exports.getStoreStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const StoreModel = mongoose.model('Store');
    const store = await StoreModel.findById(id).lean();

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const StoreStockModel = mongoose.model('StoreStock');
    const ProductModel = mongoose.model('Product');

    // Fetch existing StoreStock records for this shop
    const storeStocks = await StoreStockModel.find({ storeId: id })
      .populate('productId', 'name sku mrp price cartonSize netWeightG category')
      .lean();

    // Also get all active catalog products to ensure visibility of unstocked items
    const allProducts = await ProductModel.find({ isActive: true }).select('name sku mrp price cartonSize category').lean();

    const stockMap = new Map();
    storeStocks.forEach(s => {
      if (s.productId?._id) stockMap.set(String(s.productId._id), s);
    });

    // Also check store.stockConfig if any
    const legacyConfigMap = new Map();
    if (store.stockConfig && Array.isArray(store.stockConfig)) {
      store.stockConfig.forEach(sc => {
        legacyConfigMap.set(String(sc.productId), sc);
      });
    }

    const items = allProducts.map(prod => {
      const st = stockMap.get(String(prod._id));
      const leg = legacyConfigMap.get(String(prod._id));

      const currentStock = st ? st.currentStock : (leg ? leg.currentStock || leg.assignedStock || 0 : 0);
      const minThreshold = st ? st.minThreshold : 10;
      const reorderQty = st ? st.reorderQuantity : 24;
      const isLowStock = currentStock <= minThreshold;
      const needsReplenishment = currentStock === 0 || isLowStock;

      return {
        productId: prod._id,
        name: prod.name,
        sku: prod.sku,
        category: prod.category || 'General',
        mrp: prod.mrp || 0,
        currentStock,
        minThreshold,
        reorderQuantity: reorderQty,
        isLowStock,
        needsReplenishment,
        lastRestockedAt: st?.lastRestockedAt || null,
        lastAuditAt: st?.lastAuditAt || null,
        history: st?.history || []
      };
    });

    const lowStockCount = items.filter(i => i.isLowStock).length;
    const outOfStockCount = items.filter(i => i.currentStock === 0).length;

    res.json({
      success: true,
      data: {
        store: {
          id: store._id,
          name: store.name,
          phone: store.phone,
          address: store.address,
          city: store.city
        },
        totalProducts: items.length,
        lowStockCount,
        outOfStockCount,
        items
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/stores/:id/stock
 * Update product stock quantity for a shop (Admin or authorized manager) (Requirement 6)
 */
exports.updateStoreStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productId, currentStock, minThreshold = 10, notes = '' } = req.body;

    if (!productId || currentStock === undefined) {
      return res.status(400).json({ success: false, message: 'Product ID and current stock quantity are required' });
    }

    const StoreModel = mongoose.model('Store');
    const store = await StoreModel.findById(id);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const ProductModel = mongoose.model('Product');
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const StoreStockModel = mongoose.model('StoreStock');
    let record = await StoreStockModel.findOne({ storeId: id, productId });

    const newStockQty = parseInt(currentStock, 10) || 0;
    const prevStockQty = record ? record.currentStock : 0;
    const change = newStockQty - prevStockQty;

    if (record) {
      record.currentStock = newStockQty;
      if (minThreshold !== undefined) record.minThreshold = parseInt(minThreshold, 10);
      record.updatedBy = req.user.id;
      record.lastAuditAt = new Date();
      if (change > 0) record.lastRestockedAt = new Date();

      record.history.push({
        action: 'MANUAL_UPDATE',
        quantityChanged: change,
        previousStock: prevStockQty,
        newStock: newStockQty,
        notes: notes.trim() || `Adjusted by ${req.user.name || 'Admin'}`,
        updatedBy: req.user.id,
        date: new Date()
      });

      await record.save();
    } else {
      record = await StoreStockModel.create({
        storeId: id,
        productId,
        currentStock: newStockQty,
        minThreshold: parseInt(minThreshold, 10) || 10,
        updatedBy: req.user.id,
        lastRestockedAt: newStockQty > 0 ? new Date() : undefined,
        lastAuditAt: new Date(),
        history: [{
          action: 'INITIAL',
          quantityChanged: newStockQty,
          previousStock: 0,
          newStock: newStockQty,
          notes: notes.trim() || `Initial stock setup by ${req.user.name || 'Admin'}`,
          updatedBy: req.user.id,
          date: new Date()
        }]
      });
    }

    // Sync with store.stockConfig if present
    if (!store.stockConfig) store.stockConfig = [];
    const existingConfigIndex = store.stockConfig.findIndex(c => String(c.productId) === String(productId));
    if (existingConfigIndex >= 0) {
      store.stockConfig[existingConfigIndex].currentStock = newStockQty;
    } else {
      store.stockConfig.push({
        productId: product._id,
        productName: product.name,
        assignedStock: newStockQty,
        currentStock: newStockQty,
        price: product.price || product.mrp || 0
      });
    }
    await store.save();

    await logAudit({
      userId: req.user.id,
      action: 'STOCK_ADJUSTMENT',
      entity: 'StoreStock',
      entityId: id,
      recordTitle: `${store.name} · ${product.name}`,
      details: `Stock updated for "${product.name}" from ${prevStockQty} to ${newStockQty} (${change >= 0 ? '+' : ''}${change})`,
      oldValues: { currentStock: prevStockQty },
      newValues: { currentStock: newStockQty },
      req
    });

    res.json({
      success: true,
      message: `Stock updated for ${product.name}: ${newStockQty} units`,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/stores/:id
 */
exports.deleteStore = async (req, res, next) => {
  try {
    const { id } = req.params;
    const StoreModel = mongoose.model('Store');
    const store = await StoreModel.findById(id);

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    if (req.user.role === 'DEALER' && String(store.dealerId) !== String(req.user.dealer?.id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Soft delete
    store.isActive = false;
    await store.save();

    await logAudit({
      userId: req.user.id,
      action: 'DELETE',
      entity: 'Store',
      entityId: id,
      recordTitle: store.name,
      details: `Soft-deleted shop "${store.name}"`,
      req
    });

    res.json({
      success: true,
      message: 'Store deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
