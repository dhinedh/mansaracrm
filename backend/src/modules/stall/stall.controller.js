// src/modules/stall/stall.controller.js
const prisma = require('../../config/database');

// Create a new B2C Stall Session (Stage 1)
exports.createSession = async (req, res, next) => {
  try {
    const { name, location, operatorName, investment, registrationAmount } = req.body;

    if (!name || !location || !operatorName) {
      return res.status(400).json({ success: false, message: 'Name, location, and operator name are required.' });
    }

    const regAmt = parseFloat(registrationAmount || investment || 0);

    const session = await prisma.stallSession.create({
      data: {
        name,
        location,
        operatorName,
        investment: regAmt,
        registrationAmount: regAmt,
        status: 'ACTIVE',
        stage: 2, // Advance to Configure Stock (Stage 2)
        stockStatus: 'DRAFT',
        products: [],
        expenses: {
          store: 0,
          travel: 0,
          food: 0,
          hotel: 0,
          offer: 0,
          billUrl: ''
        },
        startDate: new Date()
      }
    });

    res.status(201).json({ success: true, message: 'Stall session started successfully', data: session });
  } catch (error) {
    next(error);
  }
};

// Close an active Stall Session
exports.closeSession = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await prisma.stallSession.findUnique({ where: { id } });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Stall session not found.' });
    }

    if (session.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Stall session is already closed.' });
    }

    const updated = await prisma.stallSession.update({
      where: { id },
      data: {
        status: 'CLOSED',
        stage: 5,
        endDate: new Date()
      }
    });

    res.json({ success: true, message: 'Stall session closed successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

// Get all Stall Sessions
exports.getSessions = async (req, res, next) => {
  try {
    const sessions = await prisma.stallSession.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
};

// Get a specific Stall Session by ID
exports.getSessionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await prisma.stallSession.findUnique({ where: { id } });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Stall session not found.' });
    }
    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

// Configure Products and Stock (Stage 2 Draft)
exports.updateSessionStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { products } = req.body; // products: [{ productId, productName, initialStock, price }]

    const session = await prisma.stallSession.findUnique({ where: { id } });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Stall session not found.' });
    }
    if (session.stockStatus === 'FROZEN') {
      return res.status(400).json({ success: false, message: 'Cannot edit stock. Stock list is frozen.' });
    }

    const mappedProducts = (products || []).map(p => ({
      productId: p.productId,
      productName: p.productName,
      initialStock: parseInt(p.initialStock || 0),
      currentStock: parseInt(p.initialStock || 0),
      price: parseFloat(p.price || 0)
    }));

    const updated = await prisma.stallSession.update({
      where: { id },
      data: {
        products: mappedProducts,
        stage: 2
      }
    });

    res.json({ success: true, message: 'Stock configuration updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

// Freeze Stock List and proceed to Stage 3
exports.freezeSessionStock = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await prisma.stallSession.findUnique({ where: { id } });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Stall session not found.' });
    }

    const updated = await prisma.stallSession.update({
      where: { id },
      data: {
        stockStatus: 'FROZEN',
        stage: 3 // Advance to Sales/Billing
      }
    });

    res.json({ success: true, message: 'Stock list frozen. Ready for sales.', data: updated });
  } catch (error) {
    next(error);
  }
};

// Unfreeze Stock List to allow editing (reverts to Stage 2 DRAFT)
exports.unfreezeSessionStock = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await prisma.stallSession.findUnique({ where: { id } });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Stall session not found.' });
    }
    if (session.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Cannot edit stock of a closed session.' });
    }

    const updated = await prisma.stallSession.update({
      where: { id },
      data: {
        stockStatus: 'DRAFT',
        stage: 2 // Go back to Configure Stock
      }
    });

    res.json({ success: true, message: 'Stock list unfrozen. Editable now.', data: updated });
  } catch (error) {
    next(error);
  }
};

// Record a new high-speed direct-to-customer Stall Sale (Stage 3)
exports.createSale = async (req, res, next) => {
  try {
    const { id: stallSessionId } = req.params;
    const { items, paymentMethod, discountAmount } = req.body; // items: [{ productId, productName, quantity, price }]

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Sale must contain at least one item.' });
    }
    if (!paymentMethod || !['CASH', 'ONLINE'].includes(paymentMethod)) {
      return res.status(400).json({ success: false, message: 'Valid payment method (CASH/ONLINE) is required.' });
    }

    const session = await prisma.stallSession.findUnique({ where: { id: stallSessionId } });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Stall session not found.' });
    }
    if (session.status === 'CLOSED') {
      return res.status(400).json({ success: false, message: 'Cannot record sales on a closed stall session.' });
    }

    const discount = parseFloat(discountAmount || 0);

    // Calculate total amount & Validate stock
    let totalAmount = 0;
    const saleItems = [];
    const updatedProducts = [...(session.products || [])];

    for (const item of items) {
      const quantity = parseInt(item.quantity || 1);
      const price = parseFloat(item.price || 0);
      totalAmount += quantity * price;

      // Validate stock limit if stock list is frozen
      if (session.stockStatus === 'FROZEN') {
        const sessionProd = updatedProducts.find(p => p.productId.toString() === item.productId.toString());
        if (!sessionProd) {
          return res.status(400).json({ success: false, message: `Product "${item.productName}" is not configured for this stall.` });
        }
        if (sessionProd.currentStock < quantity) {
          return res.status(400).json({ 
            success: false, 
            message: `Insufficient stock for "${item.productName}". Available: ${sessionProd.currentStock}, Requested: ${quantity}` 
          });
        }
        // Deduct stock
        sessionProd.currentStock -= quantity;
      }

      saleItems.push({
        productId: item.productId,
        productName: item.productName || 'Product',
        quantity,
        price
      });
    }

    // Apply flat discount to totalAmount
    const finalAmount = Math.max(0, totalAmount - discount);

    // Update session's product stock in database
    if (session.stockStatus === 'FROZEN') {
      await prisma.stallSession.update({
        where: { id: stallSessionId },
        data: { products: updatedProducts }
      });
    }

    const sale = await prisma.stallSale.create({
      data: {
        stallSessionId,
        totalAmount: finalAmount,
        discountAmount: discount,
        paymentMethod,
        items: saleItems
      }
    });

    res.status(201).json({ success: true, message: 'Sale recorded successfully', data: sale });
  } catch (error) {
    next(error);
  }
};

// Save Expenses and proceed to Stage 5 Consolidated Report (Stage 4)
exports.updateExpenses = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { store, travel, food, hotel, offer, billUrl } = req.body;

    const session = await prisma.stallSession.findUnique({ where: { id } });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Stall session not found.' });
    }

    const updated = await prisma.stallSession.update({
      where: { id },
      data: {
        expenses: {
          store: parseFloat(store || 0),
          travel: parseFloat(travel || 0),
          food: parseFloat(food || 0),
          hotel: parseFloat(hotel || 0),
          offer: parseFloat(offer || 0),
          billUrl: billUrl || ''
        },
        stage: 5 // Proceed to Consolidated Report (Stage 5)
      }
    });

    res.json({ success: true, message: 'Expenses saved successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

// Upload bill file and return URL
exports.uploadBill = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const billUrl = `uploads/${req.file.filename}`;
    res.json({ success: true, message: 'Bill uploaded successfully', billUrl });
  } catch (error) {
    next(error);
  }
};

// Generate P&L report and analytics for a Stall Session (Stage 5)
exports.getSessionReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    const session = await prisma.stallSession.findUnique({ where: { id } });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Stall session not found.' });
    }

    const sales = await prisma.stallSale.findMany({
      where: { stallSessionId: id }
    });

    let totalRevenue = 0;
    let cashRevenue = 0;
    let onlineRevenue = 0;
    let totalDiscount = 0;
    const productDemands = {};

    sales.forEach(sale => {
      totalRevenue += sale.totalAmount;
      totalDiscount += sale.discountAmount || 0;
      if (sale.paymentMethod === 'CASH') {
        cashRevenue += sale.totalAmount;
      } else if (sale.paymentMethod === 'ONLINE') {
        onlineRevenue += sale.totalAmount;
      }

      sale.items.forEach(item => {
        const prodId = item.productId.toString();
        if (!productDemands[prodId]) {
          productDemands[prodId] = {
            productId: item.productId,
            productName: item.productName,
            quantitySold: 0,
            totalRevenue: 0
          };
        }
        productDemands[prodId].quantitySold += item.quantity;
        productDemands[prodId].totalRevenue += item.quantity * item.price;
      });
    });

    // Convert demand map to sorted array
    const sortedDemands = Object.values(productDemands).sort((a, b) => b.quantitySold - a.quantitySold);

    const regAmt = session.registrationAmount || session.investment || 0;
    const storeExp = session.expenses?.store || 0;
    const travelExp = session.expenses?.travel || 0;
    const foodExp = session.expenses?.food || 0;
    const hotelExp = session.expenses?.hotel || 0;
    const offerExp = session.expenses?.offer || 0;

    const totalIncome = totalRevenue; // totalRevenue is net amount after discounts
    const totalExpenses = regAmt + storeExp + travelExp + foodExp + hotelExp + offerExp;
    const netProfit = totalIncome - totalExpenses;

    // Calculate stock issued value
    let totalStockIssuedValue = 0;
    const stockIssued = (session.products || []).map(p => {
      const val = (p.initialStock || 0) * (p.price || 0);
      totalStockIssuedValue += val;
      return {
        productId: p.productId,
        productName: p.productName,
        initialStock: p.initialStock,
        currentStock: p.currentStock,
        price: p.price,
        value: val
      };
    });

    res.json({
      success: true,
      data: {
        session,
        metrics: {
          registrationAmount: regAmt,
          stockIssuedValue: totalStockIssuedValue,
          grossSales: totalRevenue + totalDiscount,
          discounts: totalDiscount,
          netSales: totalRevenue,
          offerExpenses: offerExp,
          totalIncome,
          totalExpenses,
          netProfit,
          isProfitable: netProfit >= 0,
          totalSalesCount: sales.length,
          cashRevenue,
          onlineRevenue
        },
        stockIssued,
        productDemands: sortedDemands
      }
    });
  } catch (error) {
    next(error);
  }
};
