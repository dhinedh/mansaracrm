// src/modules/stall/stall.controller.js
const prisma = require('../../config/database');

// Create a new B2C Stall Session
exports.createSession = async (req, res, next) => {
  try {
    const { name, location, operatorName, investment } = req.body;

    if (!name || !location || !operatorName) {
      return res.status(400).json({ success: false, message: 'Name, location, and operator name are required.' });
    }

    const session = await prisma.stallSession.create({
      data: {
        name,
        location,
        operatorName,
        investment: parseFloat(investment || 0),
        status: 'ACTIVE',
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

// Record a new high-speed direct-to-customer Stall Sale
exports.createSale = async (req, res, next) => {
  try {
    const { id: stallSessionId } = req.params;
    const { items, paymentMethod } = req.body; // items: [{ productId, productName, quantity, price }]

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

    // Calculate total amount
    let totalAmount = 0;
    const saleItems = items.map(item => {
      const quantity = parseInt(item.quantity || 1);
      const price = parseFloat(item.price || 0);
      totalAmount += quantity * price;

      return {
        productId: item.productId,
        productName: item.productName || 'Product',
        quantity,
        price
      };
    });

    const sale = await prisma.stallSale.create({
      data: {
        stallSessionId,
        totalAmount,
        paymentMethod,
        items: saleItems
      }
    });

    res.status(201).json({ success: true, message: 'Sale recorded successfully', data: sale });
  } catch (error) {
    next(error);
  }
};

// Generate P&L report and analytics for a Stall Session
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
    const productDemands = {};

    sales.forEach(sale => {
      totalRevenue += sale.totalAmount;
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

    const netProfit = totalRevenue - session.investment;

    res.json({
      success: true,
      data: {
        session,
        metrics: {
          totalRevenue,
          cashRevenue,
          onlineRevenue,
          totalSalesCount: sales.length,
          netProfit,
          isProfitable: netProfit >= 0
        },
        productDemands: sortedDemands
      }
    });
  } catch (error) {
    next(error);
  }
};
