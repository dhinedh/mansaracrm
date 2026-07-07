// src/modules/analytics/analytics.controller.js
const prisma = require('../../config/database');
const { generateInvoicePdf } = require('../../utils/pdfGenerator');

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

exports.getConsolidatedReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    let start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    let end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    let dealerId = null;
    if (req.user.role === 'DEALER') {
      dealerId = req.user.dealer.id;
    } else if (req.query.dealerId) {
      dealerId = req.query.dealerId;
    }

    const invoiceWhere = {
      createdAt: { gte: start, lte: end },
      status: { in: ['GENERATED', 'PAID', 'CLOSED', 'OPEN'] }
    };
    if (dealerId) {
      invoiceWhere.dealerId = dealerId;
    }

    const invoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      include: { dealer: true, store: true }
    });

    let grossSales = 0;
    let totalDiscount = 0;
    let netSales = 0;
    let totalGst = 0;
    let shipping = 0;
    
    let cashSales = 0;
    let onlineSales = 0;
    let creditSales = 0;

    invoices.forEach(inv => {
      const sub = parseFloat(inv.subtotal || 0);
      const gst = parseFloat(inv.totalGst || 0);
      const ship = parseFloat(inv.shippingCharges || 0);
      const disc = parseFloat(inv.totalDiscount || 0);
      const original = sub + gst + ship;
      const finalAmt = parseFloat(inv.totalAmount || 0);

      grossSales += original;
      totalDiscount += disc;
      netSales += finalAmt;
      totalGst += gst;
      shipping += ship;

      if (inv.status === 'OPEN') {
        creditSales += finalAmt;
      } else {
        const method = inv.paymentMethod || 'CASH';
        if (method === 'ONLINE') {
          onlineSales += finalAmt;
        } else {
          cashSales += finalAmt;
        }
      }
    });

    const expenseWhere = {
      date: { gte: start, lte: end }
    };
    if (dealerId) {
      expenseWhere.dealerId = dealerId;
    }

    const expenses = await prisma.expense.findMany({
      where: expenseWhere
    });

    let totalGeneralExpenses = 0;
    const categoryExpenses = {};
    expenses.forEach(exp => {
      const amt = parseFloat(exp.amount || 0);
      totalGeneralExpenses += amt;
      categoryExpenses[exp.category] = (categoryExpenses[exp.category] || 0) + amt;
    });

    const promoWhere = {
      createdAt: { gte: start, lte: end }
    };
    if (dealerId) {
      const dealerStores = await prisma.store.findMany({
        where: { dealerId, isActive: true }
      });
      const storeIds = dealerStores.map(s => s.id);
      promoWhere.OR = [
        { storeId: { in: storeIds } },
        { distributedTo: 'STORE', storeId: { in: storeIds } }
      ];
    }
    
    const promoDistributions = await prisma.offerDistribution.findMany({
      where: promoWhere,
      include: { offerItem: true }
    });

    let totalPromoExpenses = 0;
    promoDistributions.forEach(dist => {
      const qty = parseInt(dist.quantity || 0);
      const cost = parseFloat(dist.unitCost || (dist.offerItem ? dist.offerItem.unitCost : 0) || 0);
      totalPromoExpenses += qty * cost;
    });

    const totalExpenses = totalGeneralExpenses + totalPromoExpenses;
    const netProfit = netSales - totalExpenses;

    res.json({
      success: true,
      data: {
        dateRange: { startDate: start, endDate: end },
        sales: {
          grossSales,
          totalDiscount,
          netSales,
          totalGst,
          cgst: totalGst / 2,
          sgst: totalGst / 2,
          shipping,
          invoiceCount: invoices.length,
          breakdown: {
            cashSales,
            onlineSales,
            creditSales
          }
        },
        expenses: {
          totalExpenses,
          generalExpenses: totalGeneralExpenses,
          promotionalExpenses: totalPromoExpenses,
          categoryBreakdown: categoryExpenses
        },
        financials: {
          totalIncome: netSales,
          totalExpenses,
          netProfit,
          outcome: netProfit >= 0 ? 'PROFIT' : 'LOSS'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const buildReportHtml = (data, user, startDate, endDate) => {
  const { sales, expenses, financials } = data;
  const formattedStart = new Date(startDate).toLocaleDateString('en-IN');
  const formattedEnd = new Date(endDate).toLocaleDateString('en-IN');
  const generatedAt = new Date().toLocaleString('en-IN');

  const categoryRows = Object.entries(expenses.categoryBreakdown)
    .map(([cat, amt]) => `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px; font-weight: 550; color: #475569;">${cat}</td>
        <td style="padding: 10px; text-align: right; font-weight: bold; color: #1e293b;">₹${amt.toFixed(2)}</td>
      </tr>
    `).join('') || `<tr><td colspan="2" style="padding: 12px; text-align: center; color: #94a3b8;">No general expenses recorded</td></tr>`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Consolidated Financial Report</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');
        body {
          font-family: 'Outfit', sans-serif;
          margin: 0;
          padding: 0;
          color: #1e293b;
          font-size: 13px;
        }
        .header {
          background-color: #fff1f2;
          padding: 30px;
          border-bottom: 2px solid #fda4af;
          border-radius: 12px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          color: #e11d48;
          font-size: 24px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .header p {
          margin: 5px 0 0 0;
          color: #4f46e5;
          font-weight: 600;
        }
        .metadata {
          display: flex;
          justify-content: space-between;
          margin-top: 15px;
          font-size: 11px;
          color: #64748b;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }
        .card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .card h2 {
          margin: 0 0 15px 0;
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          border-bottom: 1.5px solid #f1f5f9;
          padding-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        table th {
          background-color: #f8fafc;
          padding: 8px;
          font-weight: 600;
          color: #64748b;
          text-align: left;
          font-size: 10px;
          text-transform: uppercase;
        }
        table td {
          padding: 10px 8px;
        }
        .val-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #f8fafc;
        }
        .val-label {
          color: #475569;
          font-weight: 500;
        }
        .val-value {
          font-weight: bold;
          color: #0f172a;
        }
        .pl-banner {
          background-color: ${financials.netProfit >= 0 ? '#ecfdf5' : '#fef2f2'};
          border: 1.5px solid ${financials.netProfit >= 0 ? '#10b981' : '#ef4444'};
          color: ${financials.netProfit >= 0 ? '#065f46' : '#991b1b'};
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 30px;
        }
        .pl-banner h3 {
          margin: 0;
          font-size: 13px;
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: 1px;
        }
        .pl-banner .amount {
          font-size: 28px;
          font-weight: 800;
          margin: 5px 0 0 0;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 10px;
          color: #94a3b8;
          border-top: 1px dashed #e2e8f0;
          padding-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Consolidated Financial Report</h1>
        <p>Mansara Foods Management Portal</p>
        <div class="metadata">
          <div><strong>Report Period:</strong> ${formattedStart} to ${formattedEnd}</div>
          <div><strong>Generated At:</strong> ${generatedAt}</div>
        </div>
      </div>

      <div class="pl-banner">
        <h3>Net Profit / Loss Outcome</h3>
        <div class="amount">₹${financials.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <p style="margin: 5px 0 0 0; font-size: 11px; font-weight: bold; text-transform: uppercase;">
          Status: ${financials.outcome}
        </p>
      </div>

      <div class="grid">
        <!-- Sales Card -->
        <div class="card">
          <h2>Sales Summary</h2>
          <div class="val-row">
            <span class="val-label">Total Gross Sales:</span>
            <span class="val-value">₹${sales.grossSales.toFixed(2)}</span>
          </div>
          <div class="val-row">
            <span class="val-label">Total Discounts Given:</span>
            <span class="val-value" style="color: #ef4444;">-₹${sales.totalDiscount.toFixed(2)}</span>
          </div>
          <div class="val-row" style="background-color: #f8fafc; border-radius: 8px; padding: 10px 6px;">
            <span class="val-label" style="font-weight: bold;">Net Revenue:</span>
            <span class="val-value" style="color: #4f46e5;">₹${sales.netSales.toFixed(2)}</span>
          </div>
          <div class="val-row">
            <span class="val-label">GST Tax Collected:</span>
            <span class="val-value">₹${sales.totalGst.toFixed(2)}</span>
          </div>
          <div style="font-size: 10px; color: #64748b; margin-top: 10px; padding-left: 10px;">
            CGST (50%): ₹${sales.cgst.toFixed(2)} | SGST (50%): ₹${sales.sgst.toFixed(2)}
          </div>
        </div>

        <!-- Collections Card -->
        <div class="card">
          <h2>Payment Collections Breakdown</h2>
          <div class="val-row">
            <span class="val-label">Cash Payments:</span>
            <span class="val-value">₹${sales.breakdown.cashSales.toFixed(2)}</span>
          </div>
          <div class="val-row">
            <span class="val-label">Online / UPI Payments:</span>
            <span class="val-value">₹${sales.breakdown.onlineSales.toFixed(2)}</span>
          </div>
          <div class="val-row" style="background-color: #f8fafc; border-radius: 8px; padding: 10px 6px;">
            <span class="val-label" style="font-weight: bold;">Credit / Open Sales:</span>
            <span class="val-value" style="color: #ea580c;">₹${sales.breakdown.creditSales.toFixed(2)}</span>
          </div>
          <div class="val-row">
            <span class="val-label">Total Billed Invoices:</span>
            <span class="val-value">${sales.invoiceCount} Invoices</span>
          </div>
        </div>
      </div>

      <div class="grid">
        <!-- Expenses Card -->
        <div class="card">
          <h2>Expenses Summary</h2>
          <div class="val-row">
            <span class="val-label">General Expenses:</span>
            <span class="val-value">₹${expenses.generalExpenses.toFixed(2)}</span>
          </div>
          <div class="val-row">
            <span class="val-label">Promotional Material Cost:</span>
            <span class="val-value">₹${expenses.promotionalExpenses.toFixed(2)}</span>
          </div>
          <div class="val-row" style="background-color: #f8fafc; border-radius: 8px; padding: 10px 6px; margin-top: 10px;">
            <span class="val-label" style="font-weight: bold;">Total Expenses:</span>
            <span class="val-value" style="color: #ef4444;">₹${expenses.totalExpenses.toFixed(2)}</span>
          </div>
        </div>

        <!-- Expenses Categories -->
        <div class="card">
          <h2>General Category Sums</h2>
          <table style="font-size: 11px;">
            <thead>
              <tr style="border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 10px;">Category</th>
                <th style="padding: 10px; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${categoryRows}
            </tbody>
          </table>
        </div>
      </div>

      <div class="footer">
        Consolidated Financial Report &copy; 2026 Mansara Foods Pvt. Ltd. | Confidential
      </div>
    </body>
    </html>
  `;
};

exports.exportConsolidatedReportPdf = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    let start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    start.setHours(0, 0, 0, 0);

    let end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    let dealerId = null;
    if (req.user.role === 'DEALER') {
      dealerId = req.user.dealer.id;
    } else if (req.query.dealerId) {
      dealerId = req.query.dealerId;
    }

    const invoiceWhere = {
      createdAt: { gte: start, lte: end },
      status: { in: ['GENERATED', 'PAID', 'CLOSED', 'OPEN'] }
    };
    if (dealerId) {
      invoiceWhere.dealerId = dealerId;
    }

    const invoices = await prisma.invoice.findMany({
      where: invoiceWhere,
      include: { dealer: true, store: true }
    });

    let grossSales = 0;
    let totalDiscount = 0;
    let netSales = 0;
    let totalGst = 0;
    let shipping = 0;
    
    let cashSales = 0;
    let onlineSales = 0;
    let creditSales = 0;

    invoices.forEach(inv => {
      const sub = parseFloat(inv.subtotal || 0);
      const gst = parseFloat(inv.totalGst || 0);
      const ship = parseFloat(inv.shippingCharges || 0);
      const disc = parseFloat(inv.totalDiscount || 0);
      const original = sub + gst + ship;
      const finalAmt = parseFloat(inv.totalAmount || 0);

      grossSales += original;
      totalDiscount += disc;
      netSales += finalAmt;
      totalGst += gst;
      shipping += ship;

      if (inv.status === 'OPEN') {
        creditSales += finalAmt;
      } else {
        const method = inv.paymentMethod || 'CASH';
        if (method === 'ONLINE') {
          onlineSales += finalAmt;
        } else {
          cashSales += finalAmt;
        }
      }
    });

    const expenseWhere = {
      date: { gte: start, lte: end }
    };
    if (dealerId) {
      expenseWhere.dealerId = dealerId;
    }

    const expenses = await prisma.expense.findMany({
      where: expenseWhere
    });

    let totalGeneralExpenses = 0;
    const categoryExpenses = {};
    expenses.forEach(exp => {
      const amt = parseFloat(exp.amount || 0);
      totalGeneralExpenses += amt;
      categoryExpenses[exp.category] = (categoryExpenses[exp.category] || 0) + amt;
    });

    const promoWhere = {
      createdAt: { gte: start, lte: end }
    };
    if (dealerId) {
      const dealerStores = await prisma.store.findMany({
        where: { dealerId, isActive: true }
      });
      const storeIds = dealerStores.map(s => s.id);
      promoWhere.OR = [
        { storeId: { in: storeIds } },
        { distributedTo: 'STORE', storeId: { in: storeIds } }
      ];
    }
    
    const promoDistributions = await prisma.offerDistribution.findMany({
      where: promoWhere,
      include: { offerItem: true }
    });

    let totalPromoExpenses = 0;
    promoDistributions.forEach(dist => {
      const qty = parseInt(dist.quantity || 0);
      const cost = parseFloat(dist.unitCost || (dist.offerItem ? dist.offerItem.unitCost : 0) || 0);
      totalPromoExpenses += qty * cost;
    });

    const totalExpenses = totalGeneralExpenses + totalPromoExpenses;
    const netProfit = netSales - totalExpenses;

    const data = {
      sales: { grossSales, totalDiscount, netSales, totalGst, cgst: totalGst / 2, sgst: totalGst / 2, shipping, invoiceCount: invoices.length, breakdown: { cashSales, onlineSales, creditSales } },
      expenses: { totalExpenses, generalExpenses: totalGeneralExpenses, promotionalExpenses: totalPromoExpenses, categoryBreakdown: categoryExpenses },
      financials: { totalIncome: netSales, totalExpenses, netProfit, outcome: netProfit >= 0 ? 'PROFIT' : 'LOSS' }
    };

    const htmlContent = buildReportHtml(data, req.user, start, end);
    const pdfBuffer = await generateInvoicePdf(htmlContent);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=financial-report-${startDate || 'current'}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};
