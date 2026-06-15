// src/modules/analytics/analytics.controller.js
const prisma = require('../../config/database');

exports.getAdminAnalytics = async (req, res, next) => {
  try {
    // 1. Core time boundaries
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 2. Daily metrics
    // Today's sales (all invoices generated today)
    const todayInvoices = await prisma.invoice.findMany({
      where: {
        createdAt: { gte: startOfToday, lte: endOfToday },
        status: { in: ['GENERATED', 'PAID', 'OPEN', 'CLOSED'] }
      }
    });
    const todaySales = todayInvoices.reduce((acc, inv) => acc + parseFloat(inv.totalAmount || 0), 0);

    // Today's collections received (invoices marked PAID today)
    const todayPaidInvoices = await prisma.invoice.findMany({
      where: {
        paidAt: { gte: startOfToday, lte: endOfToday },
        status: 'PAID'
      }
    });
    const collectionsReceived = todayPaidInvoices.reduce((acc, inv) => acc + parseFloat(inv.totalAmount || 0), 0);

    // Today's orders received (count of dealer stock requests today + invoices today)
    const todayRequestsCount = await prisma.stockRequest.count({
      where: {
        createdAt: { gte: startOfToday, lte: endOfToday }
      }
    });
    const ordersReceived = todayInvoices.length + todayRequestsCount;

    // Dispatch pending count
    const dispatchPending = await prisma.stockTransfer.count({
      where: { status: 'PENDING' }
    });

    // 3. Financial metrics
    // Outstanding amount (unpaid invoices)
    const outstandingInvoices = await prisma.invoice.findMany({
      where: { status: { in: ['GENERATED', 'OPEN'] } }
    });
    const outstandingAmount = outstandingInvoices.reduce((acc, inv) => acc + parseFloat(inv.totalAmount || 0), 0);

    // Total sales stats
    const totalSales = await prisma.invoice.aggregate({
      _sum: {
        totalAmount: true,
        subtotal: true,
        totalGst: true
      },
      where: {
        status: { in: ['GENERATED', 'PAID', 'CLOSED', 'OPEN'] }
      }
    });
    const revenue = parseFloat(totalSales._sum.totalAmount || 0);
    const profitEstimate = revenue * 0.15; // 15% estimated profit margin

    // 4. Zone-wise/Area-wise sales distribution
    const invoices = await prisma.invoice.findMany({
      where: { status: { in: ['GENERATED', 'PAID', 'CLOSED', 'OPEN'] } },
      include: { dealer: true }
    });

    const zoneSales = {};
    const zonePlayers = {}; 
    const areaSales = {};
    const channelSales = { B2B: 0, RETAIL: 0, WEBSITE: 0, E_COMMERCE: 0 };

    invoices.forEach(inv => {
      const dealerZones = (inv.dealer.zones && inv.dealer.zones.length > 0)
        ? inv.dealer.zones
        : (inv.dealer.zone ? [inv.dealer.zone] : ['Unknown']);
      const area = inv.dealer.area || 'Unknown';
      const amt = parseFloat(inv.totalAmount);
      // Determine effective channel:
      // B2B = warehouse-to-dealer transfer invoice
      // RETAIL = dealer-to-store billing (no B2B channel but has storeId or channel=null)
      let chan = inv.channel || 'B2B';
      if (chan === 'B2B' && inv.storeId) chan = 'RETAIL'; // dealer billing to a store is retail

      dealerZones.forEach(zone => {
        zoneSales[zone] = (zoneSales[zone] || 0) + amt;
        if (!zonePlayers[zone]) zonePlayers[zone] = {};
        const co = inv.dealer.companyName || 'Unknown';
        zonePlayers[zone][co] = (zonePlayers[zone][co] || 0) + amt;
      });

      areaSales[area] = (areaSales[area] || 0) + amt;
      channelSales[chan] = (channelSales[chan] || 0) + amt;
    });

    const zoneData = Object.keys(zoneSales).map(name => ({
      name,
      value: zoneSales[name],
      dealerCount: Object.keys(zonePlayers[name] || {}).length,
      players: Object.entries(zonePlayers[name] || {}).map(([co, rev]) => ({ companyName: co, revenue: rev }))
    }));
    const areaData = Object.keys(areaSales).map(name => ({ name, value: areaSales[name] }));
    const channelData = Object.keys(channelSales).map(name => ({ name, value: channelSales[name] }));

    // 5. Performance Rankings (Distributor vs Retailer)
    const dealerPerformanceRaw = await prisma.invoice.groupBy({
      by: ['dealerId'],
      _sum: { totalAmount: true },
      where: { status: { in: ['GENERATED', 'PAID', 'CLOSED', 'OPEN'] } },
      orderBy: { _sum: { totalAmount: 'desc' } }
    });

    const dealerPerformance = [];
    const distributorPerformance = [];

    for (const item of dealerPerformanceRaw) {
      const dealer = await prisma.dealer.findUnique({ where: { id: item.dealerId } });
      if (dealer) {
        const perfData = {
          dealerId: item.dealerId,
          companyName: dealer.companyName,
          dealerType: dealer.dealerType,
          totalAmount: parseFloat(item._sum.totalAmount)
        };
        if (['DISTRIBUTOR', 'SUPER_DISTRIBUTOR'].includes(dealer.dealerType)) {
          distributorPerformance.push(perfData);
        } else {
          dealerPerformance.push(perfData);
        }
      }
    }

    // 6. Fast & Slow Movers (Warehouse Transfers log)
    const productTransfers = await prisma.stockTransferItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } }
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

    // If no transfers yet, fallback to all active products with 0
    if (productMovement.length === 0) {
      const allProds = await prisma.product.findMany({ where: { isActive: true }, take: 10 });
      allProds.forEach(p => {
        productMovement.push({
          productId: p.id,
          name: p.name,
          sku: p.sku,
          quantityTransferred: 0
        });
      });
    }

    const fastMovers = productMovement.slice(0, 5);
    const slowMovers = [...productMovement].reverse().slice(0, 5);

    // 7. Core Counts
    const totalDealers = await prisma.dealer.count();
    const activeDealers = await prisma.user.count({ where: { role: 'DEALER', isActive: true } });
    const totalProducts = await prisma.product.count({ where: { isActive: true } });
    const totalInvoices = await prisma.invoice.count();

    // 8. Lead and Visit metrics (for CRM Reports conversion)
    const totalLeads = await prisma.lead.count();
    const convertedLeads = await prisma.lead.count({ where: { status: 'CONVERTED' } });
    const leadConversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
    const totalVisits = await prisma.visit.count();
    const totalSamples = await prisma.sample.count();

    res.json({
      success: true,
      data: {
        kpis: {
          totalRevenue: revenue,
          totalSubtotal: parseFloat(totalSales._sum.subtotal || 0),
          totalGst: parseFloat(totalSales._sum.totalGst || 0),
          totalDealers,
          activeDealers,
          totalProducts,
          totalInvoices,
          // Daily Stats
          todaySales,
          ordersReceived,
          dispatchPending,
          collectionsReceived,
          // Financial Stats
          outstandingAmount,
          revenue,
          profitEstimate
        },
        zoneSales: zoneData,
        areaSales: areaData,
        channelSales: channelData,
        dealerPerformance: dealerPerformance.slice(0, 10),
        distributorPerformance: distributorPerformance.slice(0, 10),
        fastMovers,
        slowMovers,
        crmStats: {
          totalLeads,
          convertedLeads,
          leadConversionRate,
          totalVisits,
          totalSamples
        }
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
        status: { in: ['GENERATED', 'PAID', 'CLOSED', 'OPEN'] }
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
          status: { in: ['GENERATED', 'PAID', 'CLOSED', 'OPEN'] }
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
        status: { in: ['GENERATED', 'PAID', 'CLOSED', 'OPEN'] }
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
