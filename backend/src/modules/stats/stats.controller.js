// src/modules/stats/stats.controller.js
const mongoose = require('mongoose');

// Mongoose Models
const getModel = (name) => {
  try {
    return mongoose.model(name);
  } catch {
    return null;
  }
};

// 1. Overview KPIs (/api/stats)
exports.getOverviewStats = async (req, res, next) => {
  try {
    const Order = getModel('Order');
    const User = getModel('User');
    const Product = getModel('Product');

    let totalRevenue = 0;
    let totalOrders = 0;
    let totalCustomers = 0;

    if (Order) {
      const revAgg = await Order.aggregate([
        { $match: { orderStatus: { $ne: 'Cancelled' } } },
        { $group: { _id: null, totalRev: { $sum: '$total' }, count: { $sum: 1 } } }
      ]);
      if (revAgg.length > 0) {
        totalRevenue = revAgg[0].totalRev || 0;
        totalOrders = revAgg[0].count || 0;
      }

      const distinctUsers = await Order.distinct('user', { orderStatus: { $ne: 'Cancelled' } });
      totalCustomers = distinctUsers ? distinctUsers.length : 0;
    }

    if (totalCustomers === 0 && User) {
      totalCustomers = await User.countDocuments({ role: { $in: ['CUSTOMER', 'DEALER', 'USER'] } });
    }

    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    res.json({
      success: true,
      totalRevenue,
      totalOrders,
      avgOrderValue,
      totalCustomers
    });
  } catch (error) {
    next(error);
  }
};

// 2. Sales Trend (/api/stats/sales)
exports.getSalesStats = async (req, res, next) => {
  try {
    const Order = getModel('Order');
    const periodStr = req.query.period || '30days';
    const daysMatch = periodStr.match(/\d+/);
    const days = daysMatch ? parseInt(daysMatch[0], 10) : 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let sales = [];
    if (Order) {
      sales = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            orderStatus: { $ne: 'Cancelled' }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            totalSales: { $sum: '$total' },
            total: { $sum: '$total' },
            ordersCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
    }

    // If no sales exist in DB, provide standard date points so frontend line/bar charts render cleanly
    if (!sales || sales.length === 0) {
      const step = days <= 14 ? 1 : Math.ceil(days / 14);
      sales = [];
      for (let i = days; i >= 0; i -= step) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().slice(0, 10);
        sales.push({
          _id: dateKey,
          date: dateKey,
          totalSales: 0,
          total: 0,
          ordersCount: 0
        });
      }
    }

    res.json(sales);
  } catch (error) {
    next(error);
  }
};

// 3. Top Products (/api/stats/products)
exports.getTopProducts = async (req, res, next) => {
  try {
    const Order = getModel('Order');
    const Product = getModel('Product');
    const limit = parseInt(req.query.limit, 10) || 10;

    let topProducts = [];

    if (Order) {
      topProducts = await Order.aggregate([
        { $match: { orderStatus: { $ne: 'Cancelled' } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            name: { $first: '$items.name' },
            totalSold: { $sum: '$items.quantity' },
            sold: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: limit }
      ]);
    }

    // Fallback to active catalog products if no orders yet
    if (!topProducts || topProducts.length === 0) {
      if (Product) {
        const catalogProds = await Product.find({ isActive: true }).limit(limit).lean();
        topProducts = catalogProds.map(p => ({
          _id: p._id,
          name: p.name,
          totalSold: 0,
          sold: 0,
          revenue: 0,
          price: p.price || 0
        }));
      }
    }

    res.json(topProducts || []);
  } catch (error) {
    next(error);
  }
};

// 4. Top Customers (/api/stats/customers)
exports.getTopCustomers = async (req, res, next) => {
  try {
    const Order = getModel('Order');
    const User = getModel('User');
    const limit = parseInt(req.query.limit, 10) || 10;

    let topCustomers = [];

    if (Order) {
      topCustomers = await Order.aggregate([
        { $match: { orderStatus: { $ne: 'Cancelled' } } },
        {
          $group: {
            _id: '$user',
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$total' },
            fallbackName: {
              $first: {
                $concat: [
                  { $ifNull: ['$deliveryAddress.firstName', ''] },
                  ' ',
                  { $ifNull: ['$deliveryAddress.lastName', ''] }
                ]
              }
            }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: limit }
      ]);

      for (const item of topCustomers) {
        if (item._id && User) {
          const userDoc = await User.findById(item._id).select('name email phone').lean();
          if (userDoc && userDoc.name) {
            item.name = userDoc.name;
          }
        }
        if (!item.name) {
          item.name = item.fallbackName?.trim() || 'Online Customer';
        }
      }
    }

    res.json(topCustomers || []);
  } catch (error) {
    next(error);
  }
};

// 5. Category Breakdown (/api/stats/categories)
exports.getCategoriesStats = async (req, res, next) => {
  try {
    const Order = getModel('Order');
    const Product = getModel('Product');

    let categories = [];

    if (Order) {
      categories = await Order.aggregate([
        { $match: { orderStatus: { $ne: 'Cancelled' } } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.product',
            foreignField: '_id',
            as: 'productDoc'
          }
        },
        {
          $group: {
            _id: { $ifNull: [{ $arrayElemAt: ['$productDoc.category', 0] }, 'Rice Podi Mix'] },
            revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
            count: { $sum: '$items.quantity' }
          }
        },
        { $sort: { revenue: -1 } }
      ]);
    }

    if (!categories || categories.length === 0) {
      if (Product) {
        const prodCats = await Product.aggregate([
          { $match: { isActive: true } },
          { $group: { _id: { $ifNull: ['$category', 'Rice Podi Mix'] }, count: { $sum: 1 } } }
        ]);
        categories = prodCats.map(c => ({
          _id: c._id || 'Rice Podi Mix',
          name: c._id || 'Rice Podi Mix',
          revenue: 0,
          count: c.count || 0
        }));
      }
    }

    res.json(categories || []);
  } catch (error) {
    next(error);
  }
};

// 6. Payment Methods Breakdown (/api/stats/payment-methods)
exports.getPaymentMethodsStats = async (req, res, next) => {
  try {
    const Order = getModel('Order');

    let paymentData = [];
    if (Order) {
      paymentData = await Order.aggregate([
        { $match: { orderStatus: { $ne: 'Cancelled' } } },
        {
          $group: {
            _id: { $ifNull: ['$paymentMethod', 'Cash on Delivery'] },
            count: { $sum: 1 },
            revenue: { $sum: '$total' }
          }
        }
      ]);
    }

    if (!paymentData || paymentData.length === 0) {
      paymentData = [
        { _id: 'Cash on Delivery', count: 0, revenue: 0 },
        { _id: 'UPI / Online', count: 0, revenue: 0 }
      ];
    }

    res.json(paymentData);
  } catch (error) {
    next(error);
  }
};

// 7. Stock Health (/api/stats/stock-health)
exports.getStockHealth = async (req, res, next) => {
  try {
    const Product = getModel('Product');

    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    if (Product) {
      inStock = await Product.countDocuments({ isActive: true, stock: { $gt: 10 } });
      lowStock = await Product.countDocuments({ isActive: true, stock: { $gt: 0, $lte: 10 } });
      outOfStock = await Product.countDocuments({ isActive: true, stock: { $lte: 0 } });
    }

    res.json({ inStock, lowStock, outOfStock });
  } catch (error) {
    next(error);
  }
};

// 8. Clearance / Slow Moving Candidates (/api/stats/insights/slow-moving)
exports.getSlowMovingInsights = async (req, res, next) => {
  try {
    const Product = getModel('Product');

    let slowMoving = [];
    if (Product) {
      const candidates = await Product.find({ isActive: true, stock: { $gt: 0 } })
        .sort({ stock: -1 })
        .limit(5)
        .lean();

      slowMoving = candidates.map(p => ({
        _id: p._id,
        name: p.name,
        stock: p.stock || 0,
        soldLast30Days: 0
      }));
    }

    res.json(slowMoving || []);
  } catch (error) {
    next(error);
  }
};

// 9. At-Risk Inactive VIP Customers (/api/stats/insights/inactive-customers)
exports.getInactiveCustomersInsights = async (req, res, next) => {
  try {
    const Order = getModel('Order');
    const User = getModel('User');

    let inactiveCustomers = [];

    if (Order) {
      const fortyFiveDaysAgo = new Date();
      fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

      const grouped = await Order.aggregate([
        { $match: { orderStatus: { $ne: 'Cancelled' } } },
        {
          $group: {
            _id: '$user',
            lastOrderDate: { $max: '$createdAt' },
            totalSpent: { $sum: '$total' }
          }
        },
        { $match: { lastOrderDate: { $lte: fortyFiveDaysAgo } } },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 }
      ]);

      for (const item of grouped) {
        let name = 'Customer';
        if (item._id && User) {
          const userDoc = await User.findById(item._id).select('name email phone').lean();
          if (userDoc && userDoc.name) name = userDoc.name;
        }
        const daysSinceLastOrder = Math.floor((Date.now() - new Date(item.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24));
        inactiveCustomers.push({
          _id: item._id,
          name,
          daysSinceLastOrder,
          totalSpent: item.totalSpent || 0
        });
      }
    }

    res.json(inactiveCustomers || []);
  } catch (error) {
    next(error);
  }
};
