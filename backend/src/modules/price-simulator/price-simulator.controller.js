// src/modules/price-simulator/price-simulator.controller.js
// Price Simulator & Margin Control for Mansara Foods B2B CRM

const prisma = require('../../config/database');

// Standard container and volume sizing constants
const CONTAINER_PRESETS = {
  STANDARD: { label: 'Standard Retail (Pack)', capacityUnits: 50, scaleDiscountPct: 0, freightEstimatePerUnit: 8.5 },
  CARTON: { label: 'Wholesale Master Carton (50-200 pcs)', capacityUnits: 200, scaleDiscountPct: 2.5, freightEstimatePerUnit: 6.0 },
  PALLET: { label: 'Commercial Pallet (1,000-2,500 pcs)', capacityUnits: 1200, scaleDiscountPct: 5.0, freightEstimatePerUnit: 4.2 },
  TRUCKLOAD: { label: 'Full Truckload / FTL (~6,000 pcs / 6 MT)', capacityUnits: 6000, scaleDiscountPct: 8.5, freightEstimatePerUnit: 3.0 },
  CONTAINER_20FT: { label: 'Full Shipping Container (20ft / 20 MT)', capacityUnits: 20000, scaleDiscountPct: 12.0, freightEstimatePerUnit: 1.8 },
  CONTAINER_40FT: { label: 'High Cube Container (40ft / 28 MT)', capacityUnits: 28000, scaleDiscountPct: 15.0, freightEstimatePerUnit: 1.5 },
  CUSTOM: { label: 'Custom Special Order Size', capacityUnits: 1000, scaleDiscountPct: 4.0, freightEstimatePerUnit: 5.0 }
};

/**
 * Real-time calculation helper
 */
function calculatePricing({
  mrp,
  requestedMarginPct,
  quantity = 1,
  quantityUnit = 'PCS',
  cartonSize = 24,
  orderType = 'STANDARD',
  customScaleDiscount = null,
  gstPercent = 5,
  unitWeightKg = 0.5
}) {
  const baseMrp = Math.max(0, parseFloat(mrp) || 0);
  const marginPct = Math.max(0, Math.min(99, parseFloat(requestedMarginPct) || 0));
  const qty = Math.max(1, parseFloat(quantity) || 1);
  const gst = Math.max(0, parseFloat(gstPercent) || 5);
  const pacSize = Math.max(1, parseInt(cartonSize, 10) || 24);

  // Normalize total pieces / units
  let totalUnits = qty;
  if (quantityUnit === 'CTN') {
    totalUnits = qty * pacSize;
  } else if (quantityUnit === 'CONTAINER_20FT') {
    totalUnits = qty * (CONTAINER_PRESETS.CONTAINER_20FT.capacityUnits);
  } else if (quantityUnit === 'CONTAINER_40FT') {
    totalUnits = qty * (CONTAINER_PRESETS.CONTAINER_40FT.capacityUnits);
  } else if (quantityUnit === 'PALLET') {
    totalUnits = qty * (CONTAINER_PRESETS.PALLET.capacityUnits);
  } else if (quantityUnit === 'TRUCKLOAD') {
    totalUnits = qty * (CONTAINER_PRESETS.TRUCKLOAD.capacityUnits);
  } else if (quantityUnit === 'TONS' || quantityUnit === 'MT') {
    // e.g. 20 MT of lentils / flour = 20,000 kg / unitWeightKg
    totalUnits = Math.round((qty * 1000) / (unitWeightKg || 0.5));
  } else if (quantityUnit === 'KG') {
    totalUnits = Math.round(qty / (unitWeightKg || 0.5));
  }

  // Determine volume scale discount
  let preset = CONTAINER_PRESETS[orderType] || CONTAINER_PRESETS.STANDARD;
  let scaleDiscountPct = preset.scaleDiscountPct;

  // Auto-detect volume scale tier if user input raw quantity
  if (orderType === 'STANDARD' || orderType === 'CUSTOM') {
    if (totalUnits >= 20000) {
      scaleDiscountPct = 12.0;
      preset = CONTAINER_PRESETS.CONTAINER_20FT;
    } else if (totalUnits >= 6000) {
      scaleDiscountPct = 8.5;
      preset = CONTAINER_PRESETS.TRUCKLOAD;
    } else if (totalUnits >= 1200) {
      scaleDiscountPct = 5.0;
      preset = CONTAINER_PRESETS.PALLET;
    } else if (totalUnits >= 200) {
      scaleDiscountPct = 2.5;
      preset = CONTAINER_PRESETS.CARTON;
    }
  }

  if (customScaleDiscount !== null && customScaleDiscount !== undefined && !isNaN(customScaleDiscount)) {
    scaleDiscountPct = parseFloat(customScaleDiscount);
  }

  // Base purchase price from MRP: P_base = MRP * (1 - Margin/100)
  const basePurchasePrice = baseMrp * (1 - marginPct / 100);

  // Scale adjusted suggested price:
  // For special bulk container orders, management can pass down economies of scale or lock the store margin
  const suggestedPricePerUnit = Math.round(basePurchasePrice * (1 - scaleDiscountPct / 100) * 100) / 100;

  const gstPerUnit = Math.round((suggestedPricePerUnit * (gst / 100)) * 100) / 100;
  const suggestedPriceIncGst = Math.round((suggestedPricePerUnit + gstPerUnit) * 100) / 100;

  // Store's profit per unit when sold at MRP
  const unitStoreMargin = Math.round((baseMrp - suggestedPricePerUnit) * 100) / 100;
  const effectiveStoreMarginPct = baseMrp > 0 ? Math.round(((baseMrp - suggestedPricePerUnit) / baseMrp) * 10000) / 100 : marginPct;

  // Total order values
  const totalMrpValue = Math.round((baseMrp * totalUnits) * 100) / 100;
  const totalOrderValue = Math.round((suggestedPricePerUnit * totalUnits) * 100) / 100;
  const totalGstAmount = Math.round((gstPerUnit * totalUnits) * 100) / 100;
  const totalOrderValueIncGst = Math.round((totalOrderValue + totalGstAmount) * 100) / 100;
  const totalStoreGrossProfit = Math.round((unitStoreMargin * totalUnits) * 100) / 100;

  // Freight efficiency calculation
  const standardFreight = CONTAINER_PRESETS.STANDARD.freightEstimatePerUnit;
  const containerFreight = preset.freightEstimatePerUnit || standardFreight;
  const estimatedFreightSavings = Math.max(0, Math.round((standardFreight - containerFreight) * totalUnits * 100) / 100);

  // Management approval requirement tier
  let approvalTier = 'STANDARD_DEALER';
  let requiredApprover = 'Sales Officer';
  if (marginPct >= 40 || totalUnits >= 10000 || orderType.includes('CONTAINER')) {
    approvalTier = 'EXECUTIVE_DIRECTOR';
    requiredApprover = 'Arun Sir / Deepika Mam';
  } else if (marginPct >= 25 || totalUnits >= 2000) {
    approvalTier = 'SENIOR_MANAGEMENT';
    requiredApprover = 'Arun Sir / Deepika Mam / B2B Head';
  }

  // Sensitivity Matrix (benchmark comparison)
  const benchmarkTiers = [10, 15, 20, 25, 30, 35, 40, 50];
  const sensitivityMatrix = benchmarkTiers.map(tierPct => {
    const tierBasePrice = baseMrp * (1 - tierPct / 100);
    const tierPrice = Math.round(tierBasePrice * (1 - scaleDiscountPct / 100) * 100) / 100;
    const tierGst = Math.round((tierPrice * (gst / 100)) * 100) / 100;
    const tierPriceIncGst = Math.round((tierPrice + tierGst) * 100) / 100;
    const tierUnitMargin = Math.round((baseMrp - tierPrice) * 100) / 100;
    const tierTotalOrder = Math.round((tierPrice * totalUnits) * 100) / 100;
    const tierTotalProfit = Math.round((tierUnitMargin * totalUnits) * 100) / 100;

    let tierApproval = 'Standard Sales';
    if (tierPct >= 40) tierApproval = 'Arun Sir / Deepika Mam Approval Required';
    else if (tierPct >= 25) tierApproval = 'Management Approval Required';

    return {
      marginPct: tierPct,
      suggestedPricePerUnit: tierPrice,
      suggestedPriceIncGst: tierPriceIncGst,
      unitMargin: tierUnitMargin,
      totalOrderValue: tierTotalOrder,
      totalStoreProfit: tierTotalProfit,
      approvalNote: tierApproval,
      isCurrentTier: Math.abs(tierPct - marginPct) < 0.1
    };
  });

  return {
    mrp: baseMrp,
    requestedMarginPct: marginPct,
    effectiveStoreMarginPct,
    quantity: qty,
    quantityUnit,
    cartonSize: pacSize,
    totalUnits,
    orderType,
    orderTypeLabel: preset.label,
    scaleDiscountPct,
    gstPercent: gst,
    suggestedPricePerUnit,
    gstPerUnit,
    suggestedPriceIncGst,
    unitStoreMargin,
    totalMrpValue,
    totalOrderValue,
    totalGstAmount,
    totalOrderValueIncGst,
    totalStoreGrossProfit,
    freightEstimatePerUnit: containerFreight,
    estimatedFreightSavings,
    approvalTier,
    requiredApprover,
    sensitivityMatrix
  };
}

/**
 * 1. Live Simulation Calculation API
 * POST /api/price-simulator/simulate
 */
exports.simulatePrice = async (req, res, next) => {
  try {
    const {
      mrp,
      requestedMarginPct,
      quantity,
      quantityUnit,
      cartonSize,
      orderType,
      customScaleDiscount,
      gstPercent,
      unitWeightKg,
      productId,
      storeId
    } = req.body;

    let computedMrp = mrp;
    let computedGst = gstPercent;
    let computedCartonSize = cartonSize;
    let productDetails = null;

    // If productId provided, fetch from catalog to auto-populate product baseline
    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });
      if (product) {
        productDetails = product;
        if (!computedMrp) computedMrp = product.originalPrice || product.mrp || product.price;
        if (computedGst === undefined) computedGst = product.gstPercent || 5;
        if (!computedCartonSize) computedCartonSize = product.cartonSize || 24;
      }
    }

    // If storeId provided, fetch store's current active margin for comparison
    let storeCurrentMargin = null;
    let storeDetails = null;
    if (storeId) {
      const store = await prisma.store.findUnique({ where: { id: storeId } });
      if (store) {
        storeDetails = store;
        const activeRule = await prisma.margin.findFirst({
          where: {
            storeId,
            productId: productId || null,
            status: 'APPROVED'
          }
        });
        storeCurrentMargin = activeRule ? activeRule.marginPercent : (store.marginPercent || 10);
      }
    }

    const simulation = calculatePricing({
      mrp: computedMrp,
      requestedMarginPct,
      quantity,
      quantityUnit,
      cartonSize: computedCartonSize,
      orderType,
      customScaleDiscount,
      gstPercent: computedGst,
      unitWeightKg
    });

    res.json({
      success: true,
      data: {
        ...simulation,
        product: productDetails,
        store: storeDetails,
        storeCurrentMargin
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Save Simulation Record
 * POST /api/price-simulator/simulations
 */
exports.saveSimulation = async (req, res, next) => {
  try {
    const {
      title,
      productId,
      productName,
      sku,
      dealerId,
      storeId,
      storeName,
      mrp,
      requestedMarginPct,
      orderType,
      quantity,
      quantityUnit,
      cartonSize,
      notes
    } = req.body;

    if (!productName && !productId) {
      return res.status(400).json({ success: false, message: 'Product name or ID is required' });
    }
    if (!mrp) {
      return res.status(400).json({ success: false, message: 'MRP is required' });
    }

    const simCount = await prisma.priceSimulation.count();
    const simNo = `SIM-${new Date().getFullYear()}-${String(simCount + 1).padStart(4, '0')}`;

    const calculation = calculatePricing({
      mrp,
      requestedMarginPct: requestedMarginPct || 20,
      quantity: quantity || 1,
      quantityUnit: quantityUnit || 'PCS',
      cartonSize: cartonSize || 24,
      orderType: orderType || 'STANDARD'
    });

    const record = await prisma.priceSimulation.create({
      data: {
        simulationNo: simNo,
        title: title || `${productName || 'Product'} Margin Simulation`,
        productId: productId || null,
        productName: productName || 'Custom Product',
        sku: sku || '',
        dealerId: dealerId || null,
        storeId: storeId || null,
        storeName: storeName || '',
        mrp: parseFloat(mrp),
        requestedMarginPct: parseFloat(requestedMarginPct || 20),
        orderType: orderType || 'STANDARD',
        quantity: parseFloat(quantity || 1),
        quantityUnit: quantityUnit || 'PCS',
        cartonSize: parseInt(cartonSize, 10) || 24,
        totalUnits: calculation.totalUnits,
        suggestedPricePerUnit: calculation.suggestedPricePerUnit,
        suggestedPriceIncGst: calculation.suggestedPriceIncGst,
        gstPercent: calculation.gstPercent,
        unitMarginAmount: calculation.unitStoreMargin,
        totalOrderValue: calculation.totalOrderValue,
        totalStoreGrossProfit: calculation.totalStoreGrossProfit,
        freightPerUnit: calculation.freightEstimatePerUnit,
        scaleDiscountPct: calculation.scaleDiscountPct,
        status: 'DRAFT',
        approvalNotes: notes || '',
        createdBy: req.user ? `${req.user.name} (${req.user.role})` : 'System'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Simulation saved successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Commit and Approve Margin Workflow
 * POST /api/price-simulator/approve-margin
 * This fulfills: "Once a margin is committed and approved, the store's margin gets approved accordingly. Arun Sir Deepika Mam..."
 */
exports.commitAndApproveMargin = async (req, res, next) => {
  try {
    const {
      storeId,
      dealerId,
      productId,
      marginPercent,
      approvedBy,
      approvalNotes,
      minOrderQty,
      specialOrderSize,
      baseMrp,
      suggestedPrice,
      simulationId,
      scope = 'STORE_WIDE' // 'STORE_WIDE' or 'PRODUCT_SPECIFIC'
    } = req.body;

    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store ID is required to approve store margin' });
    }
    if (marginPercent === undefined || marginPercent === null || marginPercent === '') {
      return res.status(400).json({ success: false, message: 'Margin percent is required' });
    }

    const marginPct = parseFloat(marginPercent);
    if (isNaN(marginPct) || marginPct < 0 || marginPct > 100) {
      return res.status(400).json({ success: false, message: 'Margin must be a valid percentage between 0 and 100' });
    }

    // 1. Verify Store Existence
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    // Resolve effective dealerId
    const effectiveDealerId = dealerId || store.dealerId || null;

    // Default approver name if not explicitly provided
    const officialApprover = approvedBy && approvedBy.trim() ? approvedBy.trim() : (req.user?.name || 'Arun Sir / Deepika Mam');
    const officialNotes = approvalNotes || `Approved ${marginPct}% margin committed for store ${store.name}`;

    // 2. Prepare target product if product-specific
    const targetProductId = (scope === 'PRODUCT_SPECIFIC' && productId) ? productId : null;

    // 3. Upsert Margin Rule in database
    const existingMargin = await prisma.margin.findFirst({
      where: {
        storeId: store.id,
        productId: targetProductId,
        categoryId: null
      }
    });

    let marginRule;
    if (existingMargin) {
      marginRule = await prisma.margin.update({
        where: { id: existingMargin.id },
        data: {
          marginPercent: marginPct,
          status: 'APPROVED',
          approvedBy: officialApprover,
          approvedAt: new Date(),
          approvalNotes: officialNotes,
          minOrderQty: parseFloat(minOrderQty || 1),
          specialOrderSize: specialOrderSize || 'Standard Commitment',
          baseMrp: baseMrp ? parseFloat(baseMrp) : undefined,
          suggestedPrice: suggestedPrice ? parseFloat(suggestedPrice) : undefined,
          simulationId: simulationId || undefined
        }
      });
    } else {
      marginRule = await prisma.margin.create({
        data: {
          dealerId: effectiveDealerId,
          storeId: store.id,
          productId: targetProductId,
          categoryId: null,
          marginPercent: marginPct,
          isDefault: false,
          status: 'APPROVED',
          approvedBy: officialApprover,
          approvedAt: new Date(),
          approvalNotes: officialNotes,
          minOrderQty: parseFloat(minOrderQty || 1),
          specialOrderSize: specialOrderSize || 'Standard Commitment',
          baseMrp: baseMrp ? parseFloat(baseMrp) : undefined,
          suggestedPrice: suggestedPrice ? parseFloat(suggestedPrice) : undefined,
          simulationId: simulationId || undefined
        }
      });
    }

    // 4. If store-wide margin, update direct store.marginPercent property
    if (!targetProductId) {
      await prisma.store.update({
        where: { id: store.id },
        data: {
          notes: store.notes ? `${store.notes} | Approved Margin: ${marginPct}% by ${officialApprover}` : `Approved Margin: ${marginPct}% by ${officialApprover}`
        }
      });
    }

    // 5. Update Simulation record if linked
    if (simulationId) {
      try {
        await prisma.priceSimulation.update({
          where: { id: simulationId },
          data: {
            status: 'APPROVED',
            approvedBy: officialApprover,
            approvedAt: new Date(),
            approvalNotes: officialNotes,
            marginRuleId: marginRule.id
          }
        });
      } catch (err) {
        console.warn('Could not link simulation record:', err.message);
      }
    }

    // 6. Audit Log
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user?.id || null,
          action: 'APPROVE_STORE_MARGIN',
          entity: 'Margin',
          entityId: marginRule.id.toString(),
          newValues: {
            storeId: store.id,
            storeName: store.name,
            marginPercent: marginPct,
            approvedBy: officialApprover,
            specialOrderSize,
            scope: targetProductId ? 'PRODUCT_SPECIFIC' : 'STORE_WIDE'
          }
        }
      });
    } catch (auditErr) {
      console.warn('Audit log creation skipped:', auditErr.message);
    }

    // 7. Management & Sales Notification
    try {
      await prisma.notification.create({
        data: {
          userId: req.user?.id || null,
          type: 'ACCOUNT_UPDATE',
          title: `Store Margin Approved: ${store.name}`,
          message: `${officialApprover} approved ${marginPct}% margin for ${store.name} (${specialOrderSize || 'Standard Order'}).`,
          metadata: { storeId: store.id, marginPercent: marginPct, approvedBy: officialApprover }
        }
      });
    } catch (notifErr) {
      console.warn('Notification skipped:', notifErr.message);
    }

    res.json({
      success: true,
      message: `Store margin of ${marginPct}% committed and approved successfully by ${officialApprover}`,
      data: {
        store: {
          id: store.id,
          name: store.name,
          marginPercent: marginPct
        },
        marginRule,
        approvedBy: officialApprover,
        approvedAt: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Get All Approved Store Margins & Registry
 * GET /api/price-simulator/approved-margins
 */
exports.getApprovedStoreMargins = async (req, res, next) => {
  try {
    const { storeId, dealerId, search } = req.query;

    const where = {};
    if (storeId) where.storeId = storeId;
    if (dealerId) where.dealerId = dealerId;

    const marginRules = await prisma.margin.findMany({
      where,
      include: {
        store: true,
        product: true,
        dealer: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Enrich with store classification & details
    const enriched = marginRules.map(rule => ({
      id: rule.id,
      storeId: rule.storeId,
      storeName: rule.store ? rule.store.name : 'Unknown Store',
      storeCity: rule.store ? rule.store.city : '',
      storeClassification: rule.store ? rule.store.classification : 'RETAIL',
      dealerId: rule.dealerId,
      dealerName: rule.dealer ? rule.dealer.companyName : (rule.store?.dealer ? rule.store.dealer.companyName : 'Direct Company Store'),
      productId: rule.productId,
      productName: rule.product ? rule.product.name : 'All Products (Store-Wide)',
      productSku: rule.product ? rule.product.sku : '',
      productMrp: rule.baseMrp || (rule.product ? (rule.product.originalPrice || rule.product.mrp || rule.product.price) : null),
      marginPercent: rule.marginPercent,
      suggestedPrice: rule.suggestedPrice,
      minOrderQty: rule.minOrderQty || 1,
      specialOrderSize: rule.specialOrderSize || 'Standard Retail',
      status: rule.status || 'APPROVED',
      approvedBy: rule.approvedBy || 'Arun Sir / Deepika Mam',
      approvedAt: rule.approvedAt || rule.updatedAt,
      approvalNotes: rule.approvalNotes || '',
      updatedAt: rule.updatedAt
    }));

    res.json({
      success: true,
      data: enriched
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Revoke or Update Approved Margin
 * DELETE /api/price-simulator/margin-rules/:id
 */
exports.revokeMarginRule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const margin = await prisma.margin.findUnique({ where: { id } });
    if (!margin) {
      return res.status(404).json({ success: false, message: 'Margin rule not found' });
    }

    await prisma.margin.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Store margin rule revoked successfully. Store defaults to standard dealer margin.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Get Saved Simulations History
 * GET /api/price-simulator/simulations
 */
exports.getSimulations = async (req, res, next) => {
  try {
    const simulations = await prisma.priceSimulation.findMany({
      include: {
        product: true,
        store: true,
        dealer: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({
      success: true,
      data: simulations
    });
  } catch (error) {
    next(error);
  }
};
