// src/modules/field-sales/field-sales.controller.js
const prisma = require('../../config/database');
const mongoose = require('mongoose');

// ======================================================
// STORE VISIT CHECK-IN / CHECK-OUT
// ======================================================

exports.checkInVisit = async (req, res, next) => {
  try {
    const { leadId, dealerId, storeId, visitorName, purpose, latitude, longitude, visitId } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Mandatory Check-In: GPS coordinates (latitude & longitude) are required.' });
    }

    let visit;
    if (visitId) {
      visit = await prisma.visit.update({
        where: { id: visitId },
        data: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          checkInTime: new Date(),
          status: 'IN_PROGRESS',
          verified: true,
          outcome: 'Checked In - Visit Pending checkout'
        }
      });
    } else {
      visit = await prisma.visit.create({
        data: {
          leadId,
          dealerId,
          storeId,
          salespersonId: req.user.id,
          visitorName: req.user.name || visitorName || 'Field Sales Executive',
          purpose: purpose || 'Store Visit & Order Booking',
          status: 'IN_PROGRESS',
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          checkInTime: new Date(),
          verified: true,
          date: new Date(),
          scheduledDate: new Date(),
          outcome: 'Checked In - Visit Pending checkout'
        }
      });
    }

    res.status(201).json({ success: true, message: 'Checked in successfully', data: visit });
  } catch (error) {
    next(error);
  }
};

exports.checkOutVisit = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { outcome, paymentsCollected = 0, paymentMethod = 'NONE', revisitDate, newInvoiceId, orderValue = 0 } = req.body;

    if (!outcome) {
      return res.status(400).json({ success: false, message: 'Outcome is required to checkout.' });
    }

    const visit = await prisma.visit.findUnique({ where: { id } });
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit record not found' });
    }

    const storeId = visit.storeId;

    const updated = await prisma.$transaction(async (tx) => {
      // A. Update visit record
      const v = await tx.visit.update({
        where: { id },
        data: {
          outcome,
          status: 'COMPLETED',
          orderValue: parseFloat(orderValue || 0),
          paymentsCollected: parseFloat(paymentsCollected || 0),
          paymentMethod: paymentMethod || 'NONE',
          newInvoiceId: newInvoiceId || null,
          revisitDate: revisitDate ? new Date(revisitDate) : null,
          checkOutTime: new Date()
        }
      });

      // B. Update store's revisitDate
      if (revisitDate && storeId) {
        await tx.store.update({
          where: { id: storeId },
          data: { revisitDate: new Date(revisitDate) }
        });
      }

      // C. FIFO Cascade collected payments to store's open invoices
      let remainingPayment = parseFloat(paymentsCollected || 0);
      if (remainingPayment > 0 && storeId) {
        const openInvoices = await tx.invoice.findMany({
          where: { storeId, status: 'OPEN' },
          orderBy: { createdAt: 'asc' }
        });
        
        for (const inv of openInvoices) {
          if (remainingPayment <= 0) break;
          
          if (remainingPayment >= inv.totalAmount) {
            remainingPayment -= inv.totalAmount;
            await tx.invoice.update({
              where: { id: inv.id },
              data: { 
                status: 'CLOSED', 
                paidAt: new Date(),
                totalAmount: 0 
              }
            });
          } else {
            await tx.invoice.update({
              where: { id: inv.id },
              data: { 
                totalAmount: inv.totalAmount - remainingPayment 
              }
            });
            remainingPayment = 0;
          }
        }
      }

      return v;
    });

    res.json({ success: true, message: 'Checked out successfully and payments processed', data: updated });
  } catch (error) {
    next(error);
  }
};

exports.getVisits = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const where = {};
    if (req.user.role === 'SALESPERSON') {
      where.salespersonId = req.user.id;
    } else if (req.query.salespersonId && req.query.salespersonId !== 'ALL') {
      where.salespersonId = req.query.salespersonId;
    }

    const { data: visits, total } = await prisma.visit.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: limit
    });

    const leadIds = [...new Set(visits.map(v => v.leadId).filter(Boolean))];
    const dealerIds = [...new Set(visits.map(v => v.dealerId).filter(Boolean))];
    const storeIds = [...new Set(visits.map(v => v.storeId).filter(Boolean))];
    const invoiceIds = [...new Set(visits.map(v => v.newInvoiceId).filter(Boolean))];

    const [leadsRes, dealersRes, storesRes, invoicesRes] = await Promise.all([
      leadIds.length > 0 ? prisma.lead.findMany({ where: { id: { in: leadIds } }, take: leadIds.length }) : { data: [] },
      dealerIds.length > 0 ? prisma.dealer.findMany({ where: { id: { in: dealerIds } }, take: dealerIds.length }) : { data: [] },
      storeIds.length > 0 ? prisma.store.findMany({ where: { id: { in: storeIds } }, take: storeIds.length }) : { data: [] },
      invoiceIds.length > 0 ? prisma.invoice.findMany({ where: { id: { in: invoiceIds } }, take: invoiceIds.length }) : { data: [] }
    ]);

    const leadMap = new Map((leadsRes.data || leadsRes).map(l => [l.id, l]));
    const dealerMap = new Map((dealersRes.data || dealersRes).map(d => [d.id, d]));
    const storeMap = new Map((storesRes.data || storesRes).map(s => [s.id, s]));
    const invoiceMap = new Map((invoicesRes.data || invoicesRes).map(i => [i.id, i]));

    const enriched = visits.map(v => ({
      ...v,
      lead: v.leadId ? leadMap.get(v.leadId) || null : null,
      dealer: v.dealerId ? dealerMap.get(v.dealerId) || null : null,
      store: v.storeId ? storeMap.get(v.storeId) || null : null,
      newInvoice: v.newInvoiceId ? invoiceMap.get(v.newInvoiceId) || null : null
    }));

    res.json({ success: true, data: enriched, total, page, limit });
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

// ======================================================
// 1. PROFILE & ACCOUNT MANAGEMENT (Module 1)
// ======================================================
exports.getSalespersonProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let profile = await prisma.salespersonProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      profile = await prisma.salespersonProfile.create({
        data: {
          userId,
          employeeCode: 'SALES-' + String(userId).slice(-4).toUpperCase(),
          designation: 'Field Sales Executive',
          assignedZones: ['Chennai North', 'Chennai South'],
          monthlyTarget: 100000,
          monthlyVisitsTarget: 120,
          dailyVisitsTarget: 6,
          activeBeatRoute: 'Main Market Beat'
        }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, role: true }
    });

    res.json({
      success: true,
      data: { ...profile, user }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSalespersonProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, phone, emergencyContact } = req.body;

    if (name || phone) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(phone && { phone })
        }
      });
    }

    let profile = await prisma.salespersonProfile.findUnique({ where: { userId } });
    if (profile) {
      profile = await prisma.salespersonProfile.update({
        where: { userId },
        data: {
          ...(phone && { phone }),
          ...(emergencyContact && { emergencyContact })
        }
      });
    }

    res.json({ success: true, message: 'Profile updated successfully', data: profile });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    const bcrypt = require('bcryptjs');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed }
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// 2. SALESPERSON DASHBOARD (Module 2)
// ======================================================
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    // Profile & targets
    const profile = await prisma.salespersonProfile.findUnique({ where: { userId } });
    const monthlyTarget = profile?.monthlyTarget || 100000;
    const dailyVisitsTarget = profile?.dailyVisitsTarget || 6;

    // Today's visits
    const { data: todayVisits } = await prisma.visit.findMany({
      where: {
        createdAt: { gte: todayStart, lte: todayEnd }
      }
    });

    const completedVisits = todayVisits.filter(v => v.checkOutTime != null);
    const todayOrdersVal = todayVisits.reduce((acc, v) => acc + (parseFloat(v.orderValue) || 0), 0);
    const todayCollections = todayVisits.reduce((acc, v) => acc + (parseFloat(v.paymentsCollected) || 0), 0);

    // Month to date visits & sales
    const { data: monthVisits } = await prisma.visit.findMany({
      where: {
        createdAt: { gte: monthStart }
      }
    });
    const monthlySalesAchieved = monthVisits.reduce((acc, v) => acc + (parseFloat(v.orderValue) || 0), 0);
    const monthlyCollectionsAchieved = monthVisits.reduce((acc, v) => acc + (parseFloat(v.paymentsCollected) || 0), 0);

    // Pending follow-ups
    const { data: pendingFollowUps } = await prisma.followUp.findMany({
      where: {
        salespersonId: userId,
        status: 'PENDING',
        dueDate: { lte: todayEnd }
      }
    });

    // Pending margin approvals
    const { data: pendingMargins } = await prisma.margin.findMany({
      where: { isDefault: false }
    });

    res.json({
      success: true,
      data: {
        today: {
          totalVisits: todayVisits.length,
          completedVisits: completedVisits.length,
          targetVisits: dailyVisitsTarget,
          ordersValue: todayOrdersVal,
          collections: todayCollections
        },
        monthly: {
          target: monthlyTarget,
          achieved: monthlySalesAchieved,
          achievementPercent: monthlyTarget > 0 ? Math.round((monthlySalesAchieved / monthlyTarget) * 100) : 0,
          collections: monthlyCollectionsAchieved,
          visitsTotal: monthVisits.length
        },
        pendingFollowUpsCount: pendingFollowUps.length,
        pendingMarginApprovalsCount: pendingMargins.length,
        activeBeatRoute: profile?.activeBeatRoute || 'Zone Market Beat'
      }
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// 3–10. SHOPS & CUSTOMER 360 & BEAT (Modules 3-10)
// ======================================================
exports.getShops = async (req, res, next) => {
  try {
    const { search, category, zone } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;

    const StoreModel = mongoose.model('Store');
    const stores = await StoreModel.find(query).populate('dealer', 'companyName phone').sort({ updatedAt: -1 }).limit(100);

    res.json({ success: true, data: stores });
  } catch (error) {
    next(error);
  }
};

exports.registerShopLead = async (req, res, next) => {
  try {
    const { name, ownerName, phone, address, gstNumber, dealerId, category = 'RETAIL', latitude, longitude } = req.body;

    if (!name || !phone || !address) {
      return res.status(400).json({ success: false, message: 'Shop name, phone, and address are required' });
    }

    // Default dealer if none provided
    let targetDealerId = dealerId;
    if (!targetDealerId) {
      const defaultDealer = await prisma.dealer.findFirst();
      targetDealerId = defaultDealer?.id;
    }

    const StoreModel = mongoose.model('Store');
    const newStore = await StoreModel.create({
      name,
      ownerName: ownerName || name,
      phone,
      address,
      gstNumber,
      dealerId: targetDealerId,
      category,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined
    });

    res.status(201).json({ success: true, message: 'Shop registered successfully', data: newStore });
  } catch (error) {
    next(error);
  }
};

exports.getCustomer360 = async (req, res, next) => {
  try {
    const { id } = req.params;
    const StoreModel = mongoose.model('Store');
    const store = await StoreModel.findById(id).populate('dealer');
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    // Previous visits
    const { data: previousVisits } = await prisma.visit.findMany({
      where: { storeId: id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Invoices and outstanding balance
    const InvoiceModel = mongoose.model('Invoice');
    const invoices = await InvoiceModel.find({ storeId: id }).sort({ createdAt: -1 }).limit(15);
    const outstandingInvoices = invoices.filter(inv => inv.status === 'OPEN');
    const totalOutstanding = outstandingInvoices.reduce((acc, inv) => acc + (parseFloat(inv.totalAmount) || 0), 0);

    // Pending follow-ups
    const { data: followUps } = await prisma.followUp.findMany({
      where: { storeId: id, status: 'PENDING' },
      orderBy: { dueDate: 'asc' }
    });

    // Customer-specific margins
    const { data: customMargins } = await prisma.margin.findMany({
      where: { storeId: id }
    });

    res.json({
      success: true,
      data: {
        store,
        totalOutstanding,
        outstandingInvoices,
        invoices,
        previousVisits,
        followUps,
        customMargins
      }
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// 10. COMPETITOR INTELLIGENCE (Module 10)
// ======================================================
exports.recordCompetitorIntel = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { storeId, storeName, competitorBrand, productName, packSize, mrp, retailerPrice, schemes, customerFeedback, photos } = req.body;

    if (!competitorBrand || !productName) {
      return res.status(400).json({ success: false, message: 'Competitor brand and product name are required' });
    }

    const intel = await prisma.competitorIntel.create({
      data: {
        salespersonId: userId,
        storeId: storeId || null,
        storeName: storeName || '',
        competitorBrand,
        productName,
        packSize,
        mrp: mrp ? parseFloat(mrp) : 0,
        retailerPrice: retailerPrice ? parseFloat(retailerPrice) : 0,
        schemes,
        customerFeedback,
        photos: photos || []
      }
    });

    res.status(201).json({ success: true, message: 'Competitor intel saved successfully', data: intel });
  } catch (error) {
    next(error);
  }
};

exports.getCompetitorIntel = async (req, res, next) => {
  try {
    const { data: intelList } = await prisma.competitorIntel.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json({ success: true, data: intelList });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// 11–17. PRODUCT CATALOGUE, PRICE SIMULATOR & SCHEMES
// ======================================================
exports.getCatalogue = async (req, res, next) => {
  try {
    const ProductModel = mongoose.model('Product');
    const CategoryModel = mongoose.model('Category');

    const products = await ProductModel.find({ isActive: true }).populate('category').sort({ name: 1 });
    const categories = await CategoryModel.find({}).sort({ name: 1 });

    res.json({
      success: true,
      data: { products, categories }
    });
  } catch (error) {
    next(error);
  }
};

exports.simulatePrice = async (req, res, next) => {
  try {
    const { productId, storeId, discountPercent = 0, marginPercent = 10, quantity = 1 } = req.body;

    const ProductModel = mongoose.model('Product');
    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const mrp = parseFloat(product.mrp || 0);
    const disc = parseFloat(discountPercent || 0);
    const marg = parseFloat(marginPercent || 10);
    const qty = parseInt(quantity || 1, 10);

    const retailerPrice = mrp * (1 - (marg / 100));
    const effectivePrice = retailerPrice * (1 - (disc / 100));
    const orderValue = effectivePrice * qty;
    const baseCost = parseFloat(product.costPrice || (mrp * 0.55));
    const estimatedProfit = (effectivePrice - baseCost) * qty;

    res.json({
      success: true,
      data: {
        product: { id: product._id, name: product.name, mrp },
        discountPercent: disc,
        marginPercent: marg,
        quantity: qty,
        unitSellingPrice: Math.round(effectivePrice * 100) / 100,
        orderValue: Math.round(orderValue * 100) / 100,
        estimatedProfit: Math.round(estimatedProfit * 100) / 100
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.requestMarginApproval = async (req, res, next) => {
  try {
    const { dealerId, storeId, productId, proposedMarginPercent, remarks } = req.body;

    if (!proposedMarginPercent) {
      return res.status(400).json({ success: false, message: 'Proposed margin percent is required' });
    }

    const MarginModel = mongoose.model('Margin');
    const marginRecord = await MarginModel.create({
      dealerId: dealerId || null,
      storeId: storeId || null,
      productId: productId || null,
      salespersonId: req.user.id,
      marginPercent: parseFloat(proposedMarginPercent),
      approvalNotes: remarks || '',
      isDefault: false,
      status: 'PROPOSED'
    });

    res.status(201).json({
      success: true,
      message: 'Margin approval request submitted to admin',
      data: marginRecord
    });
  } catch (error) {
    next(error);
  }
};

exports.getActiveSchemes = async (req, res, next) => {
  try {
    const schemes = [
      {
        id: 'SCHEME-01',
        title: 'Festival Sparkle 10+1 Free',
        description: 'Buy 10 cartons of any Premium Cookies / Snacks and get 1 carton absolutely free!',
        minCartons: 10,
        freeCartons: 1,
        validUntil: '2026-12-31',
        applicableCategory: 'ALL'
      },
      {
        id: 'SCHEME-02',
        title: 'Super Saver Bulk Discount',
        description: 'Extra 5% spot billing discount on all orders above ₹25,000.',
        minOrderValue: 25000,
        extraDiscountPercent: 5,
        validUntil: '2026-11-30',
        applicableCategory: 'ALL'
      },
      {
        id: 'SCHEME-03',
        title: 'New Retailer Placement Bonus',
        description: 'First order bonus: Free premium counter display stand with orders above ₹5,000.',
        minOrderValue: 5000,
        freebie: 'Acrylic Counter Showcase Stand',
        validUntil: '2026-12-31',
        applicableCategory: 'NEW_ACQUISITION'
      }
    ];

    res.json({ success: true, data: schemes });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// 18–23. ORDERS, QUOTATIONS, AMENDMENTS & RETURNS
// ======================================================
exports.createSalesOrder = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { storeId, dealerId, items, paymentMethod = 'NONE', notes } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item' });
    }

    const StoreModel = mongoose.model('Store');
    const store = storeId ? await StoreModel.findById(storeId) : null;
    let targetDealerId = dealerId || store?.dealerId;

    if (!targetDealerId) {
      const DealerModel = mongoose.model('Dealer');
      const firstDealer = await DealerModel.findOne({ status: 'ACTIVE' });
      targetDealerId = firstDealer?._id || null;
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const qty = parseInt(item.quantity) || 1;
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;
      orderItems.push({
        productId: (item.productId && mongoose.Types.ObjectId.isValid(item.productId)) ? item.productId : undefined,
        productName: item.productName || 'Product',
        quantity: qty,
        price: unitPrice,
        lineTotal
      });
    }

    const orderNo = 'FSO-' + Date.now().toString().slice(-6);
    const FieldOrderModel = mongoose.model('FieldSalesOrder');
    const order = await FieldOrderModel.create({
      orderNumber: orderNo,
      salespersonId: userId,
      storeId: store?._id || storeId,
      storeName: store?.name || 'Retail Outlet',
      dealerId: targetDealerId,
      items: orderItems,
      totalAmount: subtotal,
      paymentMethod,
      notes: notes || 'Booked via Field Sales Portal',
      status: 'PENDING'
    });

    // Also update active visit for this store today with this orderValue
    try {
      const VisitModel = mongoose.model('Visit');
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      await VisitModel.findOneAndUpdate(
        { 
          storeId: store?._id || storeId, 
          salespersonId: userId,
          checkInTime: { $gte: todayStart }
        },
        { 
          $inc: { orderValue: subtotal },
          $set: { outcome: `Order ${orderNo} booked (₹${subtotal})` }
        }
      );
    } catch (e) {
      console.warn('Could not update visit orderValue:', e.message);
    }

    res.status(201).json({
      success: true,
      message: 'Sales order booked successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

exports.getSalesOrders = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const FieldOrderModel = mongoose.model('FieldSalesOrder');
    const orders = await FieldOrderModel.find({ salespersonId: userId })
      .populate('storeId', 'name address phone')
      .populate('dealerId', 'companyName phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

exports.createQuotation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { customerId, customerName, customerPhone, dealerId, items, specialTerms, validUntil } = req.body;

    if (!customerName || !items || !items.length) {
      return res.status(400).json({ success: false, message: 'Customer name and items are required' });
    }

    let subtotal = 0;
    const quoteItems = [];
    for (const item of items) {
      const qty = parseInt(item.quantity) || 1;
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const lineTotal = qty * unitPrice;
      subtotal += lineTotal;
      quoteItems.push({
        productId: item.productId,
        productName: item.productName || 'Product',
        quantity: qty,
        mrp: parseFloat(item.mrp || unitPrice),
        unitPrice,
        discountPercent: parseFloat(item.discountPercent || 0),
        taxPercent: 5,
        totalPrice: lineTotal
      });
    }

    const taxTotal = subtotal * 0.05;
    const grandTotal = subtotal + taxTotal;
    const quotationNo = 'QT-' + Date.now().toString().slice(-6);

    const quote = await prisma.quotation.create({
      data: {
        quotationNo,
        salespersonId: userId,
        customerId: customerId || null,
        dealerId: dealerId || null,
        customerName,
        customerPhone,
        items: quoteItems,
        subtotal,
        discountTotal: 0,
        taxTotal,
        grandTotal,
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 15 * 86400000),
        specialTerms,
        status: 'PENDING_APPROVAL'
      }
    });

    res.status(201).json({ success: true, message: 'Quotation created and submitted for review', data: quote });
  } catch (error) {
    next(error);
  }
};

exports.getQuotations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { data: quotes } = await prisma.quotation.findMany({
      where: { salespersonId: userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: quotes });
  } catch (error) {
    next(error);
  }
};

exports.requestAmendmentOrReturn = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { referenceNo, requestType, reason, proposedChanges, storeId, orderId, invoiceId } = req.body;

    if (!referenceNo || !requestType || !reason) {
      return res.status(400).json({ success: false, message: 'Reference number, request type, and reason are required' });
    }

    const reqRecord = await prisma.orderAmendment.create({
      data: {
        referenceNo,
        salespersonId: userId,
        storeId: storeId || null,
        orderId: orderId || null,
        invoiceId: invoiceId || null,
        requestType,
        reason,
        proposedChanges: proposedChanges || {},
        status: 'PENDING'
      }
    });

    res.status(201).json({ success: true, message: `${requestType} request submitted successfully`, data: reqRecord });
  } catch (error) {
    next(error);
  }
};

exports.getAmendmentRequests = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { data: list } = await prisma.orderAmendment.findMany({
      where: { salespersonId: userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// 24–29. COLLECTIONS, FOLLOW-UPS, DAR (Modules 24-29)
// ======================================================
exports.recordPaymentCollection = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { storeId, invoiceId, amount, paymentMethod = 'CASH', paymentReference, paymentProofUrl, remarks } = req.body;

    if (!storeId || !amount) {
      return res.status(400).json({ success: false, message: 'Store ID and amount are required' });
    }

    const colAmount = parseFloat(amount);

    // Record visit log for collection
    const visit = await prisma.visit.create({
      data: {
        storeId,
        salespersonId: userId,
        visitorName: req.user.name || 'Sales Representative',
        purpose: 'Payment Collection',
        outcome: `Collected ₹${colAmount} via ${paymentMethod}`,
        paymentsCollected: colAmount,
        paymentMethod,
        paymentReference,
        paymentProofUrl,
        remarks: remarks || '',
        verified: true,
        checkInTime: new Date(),
        checkOutTime: new Date()
      }
    });

    // If linked to an invoice, deduct invoice total
    if (invoiceId) {
      const InvoiceModel = mongoose.model('Invoice');
      const inv = await InvoiceModel.findById(invoiceId);
      if (inv) {
        const remaining = Math.max(0, inv.totalAmount - colAmount);
        inv.totalAmount = remaining;
        if (remaining === 0) {
          inv.status = 'PAID';
          inv.paidAt = new Date();
        }
        await inv.save();
      }
    }

    res.status(201).json({ success: true, message: 'Payment collection logged successfully', data: visit });
  } catch (error) {
    next(error);
  }
};

exports.recordPaymentCommitment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { storeId, storeName, invoiceId, promisedAmount, expectedDate, customerRemarks } = req.body;

    if (!storeId || !promisedAmount || !expectedDate) {
      return res.status(400).json({ success: false, message: 'Store, promised amount, and expected date are required' });
    }

    const commitment = await prisma.paymentCommitment.create({
      data: {
        salespersonId: userId,
        storeId,
        storeName: storeName || 'Retail Customer',
        invoiceId: invoiceId || null,
        promisedAmount: parseFloat(promisedAmount),
        expectedDate: new Date(expectedDate),
        customerRemarks,
        status: 'PENDING'
      }
    });

    res.status(201).json({ success: true, message: 'Payment commitment logged successfully', data: commitment });
  } catch (error) {
    next(error);
  }
};

exports.getPaymentCommitments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { data: list } = await prisma.paymentCommitment.findMany({
      where: { salespersonId: userId },
      orderBy: { expectedDate: 'asc' }
    });
    res.json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

exports.createFollowUp = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { storeId, leadId, title, contactPerson, phone, dueDate, priority, reason, notes } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ success: false, message: 'Title and due date are required' });
    }

    const followUp = await prisma.followUp.create({
      data: {
        salespersonId: userId,
        storeId: storeId || null,
        leadId: leadId || null,
        title,
        contactPerson,
        phone,
        dueDate: new Date(dueDate),
        priority: priority || 'MEDIUM',
        reason: reason || 'GENERAL',
        notes,
        status: 'PENDING'
      }
    });

    res.status(201).json({ success: true, message: 'Follow-up task scheduled', data: followUp });
  } catch (error) {
    next(error);
  }
};

exports.getFollowUps = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    const where = { salespersonId: userId };
    if (status) where.status = status;

    const { data: followUps } = await prisma.followUp.findMany({
      where,
      orderBy: { dueDate: 'asc' }
    });

    res.json({ success: true, data: followUps });
  } catch (error) {
    next(error);
  }
};

exports.completeFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { outcomeRemarks } = req.body;

    const updated = await prisma.followUp.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        outcomeRemarks: outcomeRemarks || 'Completed'
      }
    });

    res.json({ success: true, message: 'Follow-up marked as completed', data: updated });
  } catch (error) {
    next(error);
  }
};

exports.getDailyActivityReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const dateQuery = req.query.date ? new Date(req.query.date) : new Date();
    const dayStart = new Date(dateQuery);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dateQuery);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: visits } = await prisma.visit.findMany({
      where: {
        createdAt: { gte: dayStart, lte: dayEnd }
      }
    });

    const completedVisits = visits.filter(v => v.checkOutTime != null);
    const totalOrdersValue = visits.reduce((acc, v) => acc + (parseFloat(v.orderValue) || 0), 0);
    const totalCollections = visits.reduce((acc, v) => acc + (parseFloat(v.paymentsCollected) || 0), 0);

    const { data: followUps } = await prisma.followUp.findMany({
      where: {
        salespersonId: userId,
        dueDate: { gte: dayStart, lte: dayEnd }
      }
    });

    res.json({
      success: true,
      data: {
        date: dayStart.toISOString().split('T')[0],
        visitsCompleted: completedVisits.length,
        totalVisits: visits.length,
        ordersBookedCount: visits.filter(v => (v.orderValue || 0) > 0).length,
        salesValue: totalOrdersValue,
        collections: totalCollections,
        followUpsScheduled: followUps.length,
        followUpsCompleted: followUps.filter(f => f.status === 'COMPLETED').length,
        visitDetails: visits
      }
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// 30–34. PERFORMANCE, OFFLINE SYNC & SETTINGS
// ======================================================
exports.getPerformanceHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await prisma.salespersonProfile.findUnique({ where: { userId } });

    const { data: recentVisits } = await prisma.visit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      data: {
        profile,
        targetSummary: {
          monthlyTarget: profile?.monthlyTarget || 100000,
          visitsTarget: profile?.monthlyVisitsTarget || 120,
          dailyVisitsTarget: profile?.dailyVisitsTarget || 6
        },
        recentVisits
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.syncOfflineData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { visits = [], collections = [], followUps = [] } = req.body;

    const syncedResults = {
      visitsSynced: 0,
      collectionsSynced: 0,
      followUpsSynced: 0
    };

    // Bulk sync visits
    for (const v of visits) {
      await prisma.visit.create({
        data: {
          ...v,
          salespersonId: userId,
          checkInTime: v.checkInTime ? new Date(v.checkInTime) : new Date(),
          checkOutTime: v.checkOutTime ? new Date(v.checkOutTime) : null,
          verified: true
        }
      });
      syncedResults.visitsSynced++;
    }

    // Bulk sync collections
    for (const c of collections) {
      await prisma.visit.create({
        data: {
          storeId: c.storeId,
          salespersonId: userId,
          visitorName: req.user.name || 'Sales Representative',
          purpose: 'Payment Collection (Offline Synced)',
          outcome: `Collected ₹${c.amount} via ${c.paymentMethod || 'CASH'}`,
          paymentsCollected: parseFloat(c.amount || 0),
          paymentMethod: c.paymentMethod || 'CASH',
          verified: true
        }
      });
      syncedResults.collectionsSynced++;
    }

    // Bulk sync follow-ups
    for (const f of followUps) {
      await prisma.followUp.create({
        data: {
          ...f,
          salespersonId: userId,
          dueDate: f.dueDate ? new Date(f.dueDate) : new Date()
        }
      });
      syncedResults.followUpsSynced++;
    }

    res.json({
      success: true,
      message: 'Offline records synchronized successfully',
      data: syncedResults
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// ADMIN FIELD SALES CONTROLLERS (Excluding Live GPS)
// ======================================================

// 1. Admin Sales Team Management
exports.getAdminSalesTeam = async (req, res, next) => {
  try {
    const UserModel = mongoose.model('User');
    const ProfileModel = mongoose.model('SalespersonProfile');

    const salesUsers = await UserModel.find({ role: 'SALESPERSON' }).select('-password').sort({ createdAt: -1 });
    const userIds = salesUsers.map(u => u._id);

    const profiles = await ProfileModel.find({ userId: { $in: userIds } });
    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.userId.toString()] = p;
    });

    const teamData = salesUsers.map(u => ({
      user: u,
      profile: profileMap[u._id.toString()] || null
    }));

    res.json({ success: true, data: teamData });
  } catch (error) {
    next(error);
  }
};

exports.createAdminSalesperson = async (req, res, next) => {
  try {
    const { name, email, phone, password, designation, employeeCode, assignedZones, monthlyTarget, dailyVisitsTarget, activeBeatRoute } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const UserModel = mongoose.model('User');
    const existing = await UserModel.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await UserModel.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: 'SALESPERSON',
      staffRole: 'VIEWER',
      isActive: true
    });

    const ProfileModel = mongoose.model('SalespersonProfile');
    const newProfile = await ProfileModel.create({
      userId: newUser._id,
      employeeCode: employeeCode || 'SALES-' + String(newUser._id).slice(-4).toUpperCase(),
      designation: designation || 'Field Sales Executive',
      assignedZones: assignedZones || ['Chennai North'],
      monthlyTarget: monthlyTarget ? parseFloat(monthlyTarget) : 100000,
      dailyVisitsTarget: dailyVisitsTarget ? parseInt(dailyVisitsTarget) : 6,
      activeBeatRoute: activeBeatRoute || 'Beat Route A'
    });

    res.status(201).json({
      success: true,
      message: 'Field Salesperson account created successfully',
      data: { user: newUser, profile: newProfile }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAdminSalesperson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, isActive, designation, employeeCode, assignedZones, monthlyTarget, dailyVisitsTarget, activeBeatRoute } = req.body;

    const UserModel = mongoose.model('User');
    const ProfileModel = mongoose.model('SalespersonProfile');

    await UserModel.findByIdAndUpdate(id, {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(isActive !== undefined && { isActive })
    });

    const updatedProfile = await ProfileModel.findOneAndUpdate(
      { userId: id },
      {
        ...(designation && { designation }),
        ...(employeeCode && { employeeCode }),
        ...(assignedZones && { assignedZones }),
        ...(monthlyTarget !== undefined && { monthlyTarget: parseFloat(monthlyTarget) }),
        ...(dailyVisitsTarget !== undefined && { dailyVisitsTarget: parseInt(dailyVisitsTarget) }),
        ...(activeBeatRoute && { activeBeatRoute })
      },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: 'Salesperson updated successfully', data: updatedProfile });
  } catch (error) {
    next(error);
  }
};

// 1.1 Detailed 360-degree dossier for a single salesperson
exports.getAdminSalespersonDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const UserModel = mongoose.model('User');
    const ProfileModel = mongoose.model('SalespersonProfile');
    const VisitModel = mongoose.model('Visit');
    const FieldOrderModel = mongoose.model('FieldSalesOrder');
    const QuotationModel = mongoose.model('Quotation');
    const MarginModel = mongoose.model('Margin');
    const AmendmentModel = mongoose.model('OrderAmendment');

    let user = null;
    let profile = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      user = await UserModel.findById(id).select('-password');
      if (user) {
        profile = await ProfileModel.findOne({ userId: user._id });
      } else {
        profile = await ProfileModel.findById(id);
        if (profile) {
          user = await UserModel.findById(profile.userId).select('-password');
        }
      }
    } else {
      profile = await ProfileModel.findOne({ employeeCode: id });
      if (profile) {
        user = await UserModel.findById(profile.userId).select('-password');
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Salesperson not found' });
    }

    const userId = user._id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Month orders & actual sales
    const allOrders = await FieldOrderModel.find({ salespersonId: userId })
      .populate('storeId', 'name address phone')
      .populate('dealerId', 'companyName phone')
      .sort({ createdAt: -1 });

    const monthOrders = allOrders.filter(o => new Date(o.createdAt) >= monthStart);
    const actualSales = monthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const allTimeSales = allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Visits & collections
    const allVisits = await VisitModel.find({ salespersonId: userId })
      .populate('storeId', 'name address phone category')
      .populate('dealerId', 'companyName phone')
      .sort({ checkInTime: -1 });

    const monthVisits = allVisits.filter(v => new Date(v.checkInTime) >= monthStart);
    const completedVisits = monthVisits.filter(v => v.checkOutTime != null).length;
    const totalCollected = allVisits.reduce((sum, v) => sum + (v.paymentsCollected || 0), 0);

    const target = profile?.monthlyTarget || 100000;
    const dailyVisitsTarget = profile?.dailyVisitsTarget || 6;
    const achievementPct = target > 0 ? Math.round((actualSales / target) * 100) : 0;

    // Commercial documents
    const quotations = await QuotationModel.find({ salespersonId: userId })
      .populate('customerId', 'name address phone')
      .sort({ createdAt: -1 })
      .limit(10);

    const margins = await MarginModel.find({ salespersonId: userId })
      .populate('store', 'name address phone')
      .populate('product', 'name mrp')
      .sort({ createdAt: -1 })
      .limit(10);

    const amendments = await AmendmentModel.find({ salespersonId: userId })
      .populate('storeId', 'name address phone')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        user,
        profile,
        metrics: {
          monthlyTarget: target,
          actualSales,
          allTimeSales,
          achievementPct,
          dailyVisitsTarget,
          monthVisitsCount: monthVisits.length,
          completedVisits,
          allTimeVisitsCount: allVisits.length,
          totalCollected,
          ordersBookedCount: allOrders.length,
          monthOrdersCount: monthOrders.length
        },
        recentVisits: allVisits.slice(0, 15),
        recentOrders: allOrders.slice(0, 15),
        recentCollections: allVisits.filter(v => (v.paymentsCollected || 0) > 0).slice(0, 15),
        quotations,
        margins,
        amendments
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Admin Beat Planning & Route Assignment
exports.getAdminBeats = async (req, res, next) => {
  try {
    const StoreModel = mongoose.model('Store');
    const ProfileModel = mongoose.model('SalespersonProfile');

    const stores = await StoreModel.find({}).select('name address phone category zones dealerId');
    const profiles = await ProfileModel.find({}).populate('userId', 'name email phone');

    // Group stores by zone/area
    const beatsSummary = profiles.map(p => ({
      salesperson: p.userId,
      profile: p,
      assignedBeat: p.activeBeatRoute,
      assignedZones: p.assignedZones
    }));

    res.json({
      success: true,
      data: {
        beats: beatsSummary,
        totalStores: stores.length,
        stores
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAdminBeatRoute = async (req, res, next) => {
  try {
    const { salespersonId, activeBeatRoute, assignedZones } = req.body;
    if (!salespersonId || !activeBeatRoute) {
      return res.status(400).json({ success: false, message: 'Salesperson ID and beat route are required' });
    }

    const ProfileModel = mongoose.model('SalespersonProfile');
    const updated = await ProfileModel.findOneAndUpdate(
      { userId: salespersonId },
      {
        activeBeatRoute,
        ...(assignedZones && { assignedZones })
      },
      { new: true }
    );

    res.json({ success: true, message: 'Beat route assigned successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

// 3. Consolidated Admin Approvals Queue (Margins, Quotes, Amendments)
exports.getAdminApprovals = async (req, res, next) => {
  try {
    const MarginModel = mongoose.model('Margin');
    const QuotationModel = mongoose.model('Quotation');
    const AmendmentModel = mongoose.model('OrderAmendment');

    // Pending margins
    const margins = await MarginModel.find({ isDefault: false, status: { $ne: 'REVOKED' } })
      .populate('store', 'name address phone')
      .populate('dealer', 'companyName phone')
      .populate('product', 'name mrp')
      .populate('salespersonId', 'name email phone')
      .sort({ createdAt: -1 });

    // Pending quotations
    const quotations = await QuotationModel.find({})
      .populate('salespersonId', 'name email phone')
      .populate('customerId', 'name address phone')
      .populate('dealerId', 'companyName phone')
      .sort({ createdAt: -1 });

    // Pending order amendments / cancellations / returns
    const amendments = await AmendmentModel.find({})
      .populate('salespersonId', 'name email phone')
      .populate('storeId', 'name address phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        margins,
        quotations,
        amendments
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.reviewMarginApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, marginPercent, adminRemarks } = req.body; // 'APPROVED' or 'REJECTED'

    const MarginModel = mongoose.model('Margin');
    const updated = await MarginModel.findByIdAndUpdate(
      id,
      {
        status,
        ...(marginPercent !== undefined && { marginPercent: parseFloat(marginPercent) }),
        approvedBy: req.user.id,
        approvedAt: new Date(),
        approvalNotes: adminRemarks || ''
      },
      { new: true }
    );

    res.json({ success: true, message: `Margin ${status.toLowerCase()} successfully`, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.reviewQuotationApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks } = req.body; // 'APPROVED', 'REJECTED'

    const QuotationModel = mongoose.model('Quotation');
    const updated = await QuotationModel.findByIdAndUpdate(
      id,
      {
        status,
        adminRemarks: adminRemarks || ''
      },
      { new: true }
    );

    res.json({ success: true, message: `Quotation ${status.toLowerCase()} successfully`, data: updated });
  } catch (error) {
    next(error);
  }
};

exports.reviewAmendmentApproval = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks } = req.body;

    const AmendmentModel = mongoose.model('OrderAmendment');
    const updated = await AmendmentModel.findByIdAndUpdate(
      id,
      {
        status,
        adminRemarks: adminRemarks || '',
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      },
      { new: true }
    );

    res.json({ success: true, message: `Amendment request ${status.toLowerCase()}`, data: updated });
  } catch (error) {
    next(error);
  }
};

// 4. Admin Competitor Intelligence Feed
exports.getAdminCompetitorFeed = async (req, res, next) => {
  try {
    const IntelModel = mongoose.model('CompetitorIntel');
    const intelList = await IntelModel.find({})
      .populate('salespersonId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, data: intelList });
  } catch (error) {
    next(error);
  }
};

// 5. Admin DAR Summary & Activity Audit
exports.getAdminDarAudit = async (req, res, next) => {
  try {
    const dateQuery = req.query.date ? new Date(req.query.date) : new Date();
    const dayStart = new Date(dateQuery);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dateQuery);
    dayEnd.setHours(23, 59, 59, 999);

    const VisitModel = mongoose.model('Visit');

    const visits = await VisitModel.find({
      $or: [
        { date: { $gte: dayStart, $lte: dayEnd } },
        { checkInTime: { $gte: dayStart, $lte: dayEnd } },
        { createdAt: { $gte: dayStart, $lte: dayEnd } }
      ]
    })
      .populate('salespersonId', 'name email phone')
      .populate('storeId', 'name address phone')
      .populate('dealerId', 'companyName phone')
      .sort({ checkInTime: -1 });

    const totalSalesValue = visits.reduce((acc, v) => acc + (parseFloat(v.orderValue) || 0), 0);
    const totalCollections = visits.reduce((acc, v) => acc + (parseFloat(v.paymentsCollected) || 0), 0);
    const completedVisits = visits.filter(v => v.checkOutTime != null);

    res.json({
      success: true,
      data: {
        date: dayStart.toISOString().split('T')[0],
        totalVisits: visits.length,
        completedVisits: completedVisits.length,
        totalSalesValue,
        totalCollections,
        visits
      }
    });
  } catch (error) {
    next(error);
  }
};

// 6. Admin Field Sales Orders Ledger & Status
exports.getAdminSalesOrders = async (req, res, next) => {
  try {
    const { status, salespersonId, storeId, search } = req.query;
    const FieldOrderModel = mongoose.model('FieldSalesOrder');

    const query = {};
    if (status && status !== 'ALL') query.status = status;
    if (salespersonId) query.salespersonId = salespersonId;
    if (storeId) query.storeId = storeId;
    if (search) {
      query.$or = [
        { orderNumber: new RegExp(search, 'i') },
        { storeName: new RegExp(search, 'i') }
      ];
    }

    const orders = await FieldOrderModel.find(query)
      .populate('salespersonId', 'name email phone')
      .populate('storeId', 'name address phone category zones')
      .populate('dealerId', 'companyName phone gstNumber')
      .sort({ createdAt: -1 });

    const totalOrderValue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingOrdersCount = orders.filter(o => o.status === 'PENDING').length;
    const approvedOrdersCount = orders.filter(o => o.status === 'APPROVED').length;

    res.json({
      success: true,
      data: {
        orders,
        totalOrders: orders.length,
        totalOrderValue,
        pendingOrdersCount,
        approvedOrdersCount
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAdminOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const FieldOrderModel = mongoose.model('FieldSalesOrder');
    const updated = await FieldOrderModel.findByIdAndUpdate(
      id,
      {
        status,
        ...(notes && { notes })
      },
      { new: true }
    ).populate('salespersonId', 'name email').populate('storeId', 'name').populate('dealerId', 'companyName');

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, message: `Order status updated to ${status}`, data: updated });
  } catch (error) {
    next(error);
  }
};

// 7. Admin Collections & Commitments Audit
exports.getAdminCollections = async (req, res, next) => {
  try {
    const { salespersonId, paymentMethod, startDate, endDate } = req.query;
    const VisitModel = mongoose.model('Visit');
    const CommitmentModel = mongoose.model('PaymentCommitment');

    const visitQuery = { paymentsCollected: { $gt: 0 } };
    if (salespersonId) visitQuery.salespersonId = salespersonId;
    if (paymentMethod && paymentMethod !== 'ALL') visitQuery.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      visitQuery.checkInTime = {};
      if (startDate) visitQuery.checkInTime.$gte = new Date(startDate);
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        visitQuery.checkInTime.$lte = e;
      }
    }

    const collections = await VisitModel.find(visitQuery)
      .populate('salespersonId', 'name email phone')
      .populate('storeId', 'name address phone')
      .populate('dealerId', 'companyName phone')
      .sort({ checkInTime: -1 });

    const commitments = await CommitmentModel.find({})
      .populate('salespersonId', 'name email phone')
      .populate('storeId', 'name address phone')
      .sort({ expectedDate: 1 });

    const totalCollected = collections.reduce((acc, c) => acc + (c.paymentsCollected || 0), 0);
    const totalCash = collections.filter(c => c.paymentMethod === 'CASH').reduce((acc, c) => acc + (c.paymentsCollected || 0), 0);
    const totalOnline = collections.filter(c => c.paymentMethod === 'ONLINE' || c.paymentMethod === 'UPI').reduce((acc, c) => acc + (c.paymentsCollected || 0), 0);
    const totalCommitments = commitments.reduce((acc, c) => acc + (c.promisedAmount || 0), 0);

    res.json({
      success: true,
      data: {
        collections,
        commitments,
        totalCollected,
        totalCash,
        totalOnline,
        totalCommitments
      }
    });
  } catch (error) {
    next(error);
  }
};

// 8. Admin Sales Target & Rep Performance Matrix
exports.getAdminPerformance = async (req, res, next) => {
  try {
    const UserModel = mongoose.model('User');
    const ProfileModel = mongoose.model('SalespersonProfile');
    const FieldOrderModel = mongoose.model('FieldSalesOrder');
    const VisitModel = mongoose.model('Visit');

    const salesUsers = await UserModel.find({ role: 'SALESPERSON' }).select('name email phone isActive');
    const userIds = salesUsers.map(u => u._id);
    const profiles = await ProfileModel.find({ userId: { $in: userIds } });
    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.userId.toString()] = p;
    });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const performanceList = await Promise.all(salesUsers.map(async (u) => {
      const prof = profileMap[u._id.toString()] || {};
      const target = prof.monthlyTarget || 100000;
      const dailyVisitsTarget = prof.dailyVisitsTarget || 6;

      // Month orders
      const orders = await FieldOrderModel.find({
        salespersonId: u._id,
        createdAt: { $gte: monthStart }
      });
      const actualSales = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

      // Month visits
      const visits = await VisitModel.find({
        salespersonId: u._id,
        checkInTime: { $gte: monthStart }
      });
      const completedVisits = visits.filter(v => v.checkOutTime != null).length;
      const collectionsTotal = visits.reduce((acc, v) => acc + (v.paymentsCollected || 0), 0);

      const achievementPct = target > 0 ? Math.round((actualSales / target) * 100) : 0;

      return {
        salesperson: u,
        profile: prof,
        monthlyTarget: target,
        actualSales,
        achievementPct,
        dailyVisitsTarget,
        monthVisitsCount: visits.length,
        completedVisits,
        collectionsTotal,
        ordersBookedCount: orders.length,
        status: prof.status || 'ACTIVE'
      };
    }));

    // Sort by actualSales desc for leaderboard ranking
    performanceList.sort((a, b) => b.actualSales - a.actualSales);

    res.json({
      success: true,
      data: performanceList
    });
  } catch (error) {
    next(error);
  }
};

// ======================================================
// ADMIN STORE VISITS & ALLOCATIONS
// ======================================================

// Allocate store visit to a salesperson
exports.allocateStoreVisit = async (req, res, next) => {
  try {
    const {
      salespersonId,
      storeId,
      dealerId,
      scheduledDate,
      purpose,
      priority = 'NORMAL',
      remarks
    } = req.body;

    if (!salespersonId) {
      return res.status(400).json({ success: false, message: 'Salesperson assignment is required.' });
    }
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store / Outlet selection is required.' });
    }

    const UserModel = mongoose.model('User');
    const StoreModel = mongoose.model('Store');
    const DealerModel = mongoose.model('Dealer');
    const VisitModel = mongoose.model('Visit');

    const salesUser = await UserModel.findById(salespersonId);
    if (!salesUser) {
      return res.status(404).json({ success: false, message: 'Selected salesperson not found.' });
    }

    const store = await StoreModel.findById(storeId);
    if (!store) {
      return res.status(404).json({ success: false, message: 'Selected store not found.' });
    }

    const effectiveDealerId = dealerId || store.dealerId || null;
    const targetDate = scheduledDate ? new Date(scheduledDate) : new Date();

    const newVisit = await VisitModel.create({
      salespersonId: salesUser._id,
      storeId: store._id,
      dealerId: effectiveDealerId,
      visitorName: salesUser.name || 'Field Sales Executive',
      purpose: purpose || 'Store Visit & Order Booking',
      priority: (priority || 'NORMAL').toUpperCase(),
      status: 'SCHEDULED',
      remarks: remarks || '',
      scheduledDate: targetDate,
      date: targetDate,
      verified: false,
      allocatedBy: req.user.id
    });

    const populatedVisit = await VisitModel.findById(newVisit._id)
      .populate('salespersonId', 'name email phone role')
      .populate('storeId', 'name address city phone')
      .populate('dealerId', 'companyName phone city')
      .populate('allocatedBy', 'name email');

    res.status(201).json({
      success: true,
      message: `Store visit successfully allocated to ${salesUser.name}.`,
      data: populatedVisit
    });
  } catch (error) {
    next(error);
  }
};

// Get Today's Visits (or date-filtered visits) with metrics and full details
exports.getAdminTodayVisits = async (req, res, next) => {
  try {
    const VisitModel = mongoose.model('Visit');
    const UserModel = mongoose.model('User');
    const SalespersonProfileModel = mongoose.model('SalespersonProfile');
    const FieldSalesOrderModel = mongoose.model('FieldSalesOrder');

    const { date, salespersonId, status, search } = req.query;

    // Date range calculation (default today)
    const baseDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(baseDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(baseDate);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      $or: [
        { scheduledDate: { $gte: startOfDay, $lte: endOfDay } },
        { date: { $gte: startOfDay, $lte: endOfDay } },
        { checkInTime: { $gte: startOfDay, $lte: endOfDay } }
      ]
    };

    if (salespersonId && salespersonId !== 'ALL') {
      query.salespersonId = salespersonId;
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    let visits = await VisitModel.find(query)
      .populate('salespersonId', 'name email phone role')
      .populate('storeId', 'name address city phone category outstandingBalance creditLimit')
      .populate('dealerId', 'companyName phone city')
      .populate('allocatedBy', 'name email')
      .sort({ scheduledDate: 1, createdAt: -1 });

    // Optional text search filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      visits = visits.filter(v => {
        const storeName = v.storeId?.name?.toLowerCase() || '';
        const repName = v.salespersonId?.name?.toLowerCase() || '';
        const dealerName = v.dealerId?.companyName?.toLowerCase() || '';
        const purpose = v.purpose?.toLowerCase() || '';
        const city = v.storeId?.city?.toLowerCase() || '';
        return storeName.includes(q) || repName.includes(q) || dealerName.includes(q) || purpose.includes(q) || city.includes(q);
      });
    }

    // Attach salesperson employeeCode if available
    const salesUserIds = [...new Set(visits.map(v => v.salespersonId?._id?.toString()).filter(Boolean))];
    const profiles = await SalespersonProfileModel.find({ userId: { $in: salesUserIds } });
    const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

    const enrichedVisits = visits.map(v => {
      const visitObj = v.toObject ? v.toObject() : v;
      if (visitObj.salespersonId?._id) {
        const prof = profileMap.get(visitObj.salespersonId._id.toString());
        if (prof) {
          visitObj.salespersonProfile = {
            employeeCode: prof.employeeCode,
            designation: prof.designation,
            phone: prof.phone
          };
        }
      }
      return visitObj;
    });

    // Compute live KPI metrics for today
    const totalScheduled = enrichedVisits.length;
    const completedCount = enrichedVisits.filter(v => v.status === 'COMPLETED' || (v.checkOutTime && v.outcome)).length;
    const inProgressCount = enrichedVisits.filter(v => v.status === 'IN_PROGRESS' || (v.checkInTime && !v.checkOutTime)).length;
    const pendingCount = enrichedVisits.filter(v => v.status === 'SCHEDULED' || (!v.checkInTime && v.status !== 'COMPLETED' && v.status !== 'CANCELLED')).length;
    const cancelledCount = enrichedVisits.filter(v => v.status === 'CANCELLED' || v.status === 'MISSED').length;

    const todayCollections = enrichedVisits.reduce((sum, v) => sum + (v.paymentsCollected || 0), 0);
    const visitOrderValue = enrichedVisits.reduce((sum, v) => sum + (v.orderValue || 0), 0);

    // Also fetch today's FieldSalesOrder total for accurate booked order value
    const todayOrders = await FieldSalesOrderModel.find({
      orderDate: { $gte: startOfDay, $lte: endOfDay }
    });
    const fieldOrderTotal = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const todayOrderValue = Math.max(visitOrderValue, fieldOrderTotal);

    res.json({
      success: true,
      data: {
        visits: enrichedVisits,
        stats: {
          totalScheduled,
          completedCount,
          inProgressCount,
          pendingCount,
          cancelledCount,
          todayOrderValue,
          todayCollections,
          date: baseDate.toISOString().split('T')[0]
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin update / reschedule / cancel visit
exports.updateAdminVisitStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, scheduledDate, salespersonId, remarks, priority } = req.body;

    const VisitModel = mongoose.model('Visit');
    const visit = await VisitModel.findById(id);
    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit record not found' });
    }

    if (status) visit.status = status;
    if (scheduledDate) {
      visit.scheduledDate = new Date(scheduledDate);
      visit.date = new Date(scheduledDate);
    }
    if (salespersonId) {
      const UserModel = mongoose.model('User');
      const rep = await UserModel.findById(salespersonId);
      if (rep) {
        visit.salespersonId = rep._id;
        visit.visitorName = rep.name;
      }
    }
    if (remarks !== undefined) visit.remarks = remarks;
    if (priority) visit.priority = priority.toUpperCase();

    await visit.save();

    const updated = await VisitModel.findById(id)
      .populate('salespersonId', 'name email phone role')
      .populate('storeId', 'name address city phone')
      .populate('dealerId', 'companyName phone city');

    res.json({ success: true, message: 'Visit record updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

