// src/modules/analytics/analytics.controller.js
const prisma = require('../../config/database');

exports.getAdminAnalytics = async (req, res, next) => {
  try {
    // 1. Total revenue stats
    const totalSales = await prisma.invoice.aggregate({
      _sum: {
        totalAmount: true,
        subtotal: true,
        totalGst: true
      },
      where: {
        status: 'GENERATED'
      }
    });

    // 2. Zone-wise/Area-wise sales distribution
    // Group invoices by dealer state/zone
    const invoices = await prisma.invoice.findMany({
      where: { status: 'GENERATED' },
      include: {
        dealer: true
      }
    });

    const zoneSales = {};
    const areaSales = {};
    invoices.forEach(inv => {
      const zone = inv.dealer.zone || 'Unknown';
      const area = inv.dealer.area || 'Unknown';
      const amt = parseFloat(inv.totalAmount);

      zoneSales[zone] = (zoneSales[zone] || 0) + amt;
      areaSales[area] = (areaSales[area] || 0) + amt;
    });

    const zoneData = Object.keys(zoneSales).map(name => ({ name, value: zoneSales[name] }));
    const areaData = Object.keys(areaSales).map(name => ({ name, value: areaSales[name] }));

    // 3. Dealer performance (Top dealers by revenue)
    const dealerPerformanceRaw = await prisma.invoice.groupBy({
      by: ['dealerId'],
      _sum: {
        totalAmount: true
      },
      where: { status: 'GENERATED' },
      orderBy: {
        _sum: {
          totalAmount: 'desc'
        }
      },
      take: 10
    });

    const dealerPerformance = [];
    for (const item of dealerPerformanceRaw) {
      const dealer = await prisma.dealer.findUnique({ where: { id: item.dealerId } });
      if (dealer) {
        dealerPerformance.push({
          dealerId: item.dealerId,
          companyName: dealer.companyName,
          totalAmount: parseFloat(item._sum.totalAmount)
        });
      }
    }

    // 4. Product movement (fast/slow movers based on quantity in stock transfer items)
    const productTransfers = await prisma.stockTransferItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      }
    });

    const productMovement = [];
    for (const item of productTransfers) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
        productMovement.push({
          productId: item.productId,
          name: product.name,
          sku: product.sku,
          quantityTransferred: item._sum.quantity
        });
      }
    }

    // 5. Total count KPIs
    const totalDealers = await prisma.dealer.count();
    const activeDealers = await prisma.user.count({ where: { role: 'DEALER', isActive: true } });
    const totalProducts = await prisma.product.count({ where: { isActive: true } });
    const totalInvoices = await prisma.invoice.count();

    res.json({
      success: true,
      data: {
        kpis: {
          totalRevenue: parseFloat(totalSales._sum.totalAmount || 0),
          totalSubtotal: parseFloat(totalSales._sum.subtotal || 0),
          totalGst: parseFloat(totalSales._sum.totalGst || 0),
          totalDealers,
          activeDealers,
          totalProducts,
          totalInvoices
        },
        zoneSales: zoneData,
        areaSales: areaData,
        dealerPerformance,
        productMovement
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getDealerAnalytics = async (req, res, next) => {
  try {
    const dealerId = req.user.dealer.id;

    // 1. Dealer Sales Stats (My Invoices generated)
    const mySales = await prisma.invoice.aggregate({
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      },
      where: {
        dealerId,
        status: 'GENERATED'
      }
    });

    // 2. Fast/Slow Moving products in Dealer Store bills
    // Aggregate by quantity in invoice items
    const invoiceItemsGrouped = await prisma.invoiceItem.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true
      },
      where: {
        invoice: {
          dealerId,
          status: 'GENERATED'
        }
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      }
    });

    const fastMovers = [];
    const slowMovers = [];

    // Let's split into fast (> 50 qty) or slow (< 10 qty) or simple top 5 vs bottom 5
    for (let i = 0; i < invoiceItemsGrouped.length; i++) {
      const item = invoiceItemsGrouped[i];
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
        const productStats = {
          productId: item.productId,
          name: product.name,
          sku: product.sku,
          quantitySold: item._sum.quantity
        };

        if (i < 5) {
          fastMovers.push(productStats);
        } else {
          slowMovers.push(productStats);
        }
      }
    }

    // 3. Store-wise performance
    const storeSalesRaw = await prisma.invoice.groupBy({
      by: ['storeId'],
      _sum: {
        totalAmount: true
      },
      where: {
        dealerId,
        status: 'GENERATED'
      },
      orderBy: {
        _sum: {
          totalAmount: 'desc'
        }
      }
    });

    const storeSales = [];
    for (const item of storeSalesRaw) {
      const store = await prisma.store.findUnique({ where: { id: item.storeId } });
      if (store) {
        storeSales.push({
          storeId: item.storeId,
          name: store.name,
          totalSales: parseFloat(item._sum.totalAmount)
        });
      }
    }

    // 4. Stock alert level (products running low in dealer's inventory)
    const lowStockAlerts = await prisma.dealerInventory.findMany({
      where: {
        dealerId,
        quantity: { lte: 10 } // Alert threshold
      },
      include: {
        product: true
      },
      orderBy: { quantity: 'asc' }
    });

    res.json({
      success: true,
      data: {
        kpis: {
          totalSales: parseFloat(mySales._sum.totalAmount || 0),
          totalBills: mySales._count.id
        },
        fastMovers,
        slowMovers: slowMovers.slice(-5), // bottom 5
        storeSales,
        lowStockAlerts: lowStockAlerts.map(inv => ({
          productId: inv.productId,
          name: inv.product.name,
          sku: inv.product.sku,
          quantity: inv.quantity
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};
