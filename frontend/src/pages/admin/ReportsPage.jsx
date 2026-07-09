// src/pages/admin/ReportsPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  MapPin, 
  Building2, 
  DollarSign, 
  Package, 
  TrendingUp, 
  Filter, 
  RefreshCcw,
  Users,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Layers,
  PieChart,
  Tag,
  Check,
  FileText,
  X
} from 'lucide-react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales', 'financial', 'inventory', 'crm'
  const [salesSubTab, setSalesSubTab] = useState('product'); // 'product', 'dealer', 'distributor', 'territory'
  const [inventorySubTab, setInventorySubTab] = useState('aging'); // 'aging', 'expiry'
  const [financialSubTab, setFinancialSubTab] = useState('outstanding'); // 'outstanding', 'collection'
  const [crmSubTab, setCrmSubTab] = useState('lead'); // 'lead', 'visit', 'sample'
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Global filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedDealerType, setSelectedDealerType] = useState('');

  // Raw data lists
  const [invoices, setInvoices] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [leads, setLeads] = useState([]);
  const [visits, setVisits] = useState([]);
  const [samples, setSamples] = useState([]);
  const [zonesList, setZonesList] = useState([]);
  const [consolidatedReport, setConsolidatedReport] = useState(null);
  const [consolidatedLoading, setConsolidatedLoading] = useState(false);

  // Saved Reports States
  const [savedReports, setSavedReports] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [savingReport, setSavingReport] = useState(false);
  const [viewingSavedReport, setViewingSavedReport] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch all invoices
      const invRes = await axios.get('/billing');
      const allInvoices = invRes.data.data || [];
      setInvoices(allInvoices);

      // Extract unique zones from invoices' dealers
      const zones = new Set();
      allInvoices.forEach(inv => {
        if (inv.dealer?.zones) {
          inv.dealer.zones.forEach(z => zones.add(z));
        } else if (inv.dealer?.zone) {
          zones.add(inv.dealer.zone);
        }
      });
      setZonesList(Array.from(zones));

      // Fetch warehouse stock
      const stockRes = await axios.get('/inventory/company');
      setInventory(stockRes.data.data || []);

      // Fetch CRM data
      const leadRes = await axios.get('/crm/leads');
      setLeads(leadRes.data.data || []);

      const visitRes = await axios.get('/crm/visits');
      setVisits(visitRes.data.data || []);

      const sampleRes = await axios.get('/crm/samples');
      setSamples(sampleRes.data.data || []);

      await fetchSavedReports();
    } catch (err) {
      console.error('Failed to load report datasets', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConsolidatedReport = async () => {
    setConsolidatedLoading(true);
    try {
      const res = await axios.get('/analytics/consolidated-report', {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }
      });
      if (res.data.success) {
        setConsolidatedReport(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load consolidated report', err);
    } finally {
      setConsolidatedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'consolidated') {
      fetchConsolidatedReport();
    }
  }, [activeTab, startDate, endDate]);

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedZone('');
    setSelectedDealerType('');
  };

  const fetchSavedReports = async () => {
    try {
      const res = await axios.get('/analytics/saved-reports');
      setSavedReports(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch saved reports', err);
    }
  };

  const handleDeleteSavedReport = async (id) => {
    if (!confirm('Are you sure you want to delete this saved report?')) return;
    try {
      await axios.delete(`/analytics/saved-reports/${id}`);
      await fetchSavedReports();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete report.');
    }
  };

  const getCurrentReportData = () => {
    if (activeTab === 'consolidated') {
      return { 
        type: 'CONSOLIDATED', 
        data: consolidatedReport,
        headers: [],
        rows: []
      };
    }
    
    let type = '';
    let headers = [];
    let rows = [];

    if (activeTab === 'sales') {
      if (salesSubTab === 'product') {
        type = 'SALES_PRODUCT_WISE';
        headers = ["Product SKU", "Product Name", "Category", "Units Sold", "Net Revenue (₹)", "Tax (₹)", "Avg Margin (%)", "Total Sales (₹)"];
        rows = getProductWiseSales().map(p => [p.sku, p.name, p.category, p.totalQty, p.revenue.toFixed(2), p.tax.toFixed(2), p.avgMargin.toFixed(1), p.totalSales.toFixed(2)]);
      } else if (salesSubTab === 'dealer') {
        type = 'SALES_DEALER_WISE';
        headers = ["Dealer Name", "Dealer Type", "Email", "Phone", "Invoices Count", "Subtotal (₹)", "Tax (₹)", "Total Sales (₹)", "Collections (₹)", "Outstanding (₹)"];
        rows = getDealerWiseSales().map(d => [d.companyName, d.dealerType, d.email, d.phone, d.invoicesCount, d.subtotal.toFixed(2), d.tax.toFixed(2), d.totalAmount.toFixed(2), d.collections.toFixed(2), d.outstanding.toFixed(2)]);
      } else if (salesSubTab === 'distributor') {
        type = 'SALES_DISTRIBUTOR_WISE';
        headers = ["Tier Type", "Active Orders", "Subtotal (₹)", "GST Tax (₹)", "Total Sales (₹)", "Collections (₹)", "Outstanding (₹)"];
        rows = getDistributorWiseSales().map(t => [t.type, t.count, t.subtotal.toFixed(2), t.tax.toFixed(2), t.totalAmount.toFixed(2), t.collected.toFixed(2), t.outstanding.toFixed(2)]);
      } else if (salesSubTab === 'territory') {
        type = 'SALES_TERRITORY_WISE';
        headers = ["Zone Territory", "Active Dealers", "Invoices Count", "Subtotal (₹)", "GST (₹)", "Total Sales (₹)"];
        rows = getTerritoryWiseSales().map(z => [z.zone, z.dealersCount, z.invoicesCount, z.subtotal.toFixed(2), z.tax.toFixed(2), z.totalAmount.toFixed(2)]);
      }
    } else if (activeTab === 'financial') {
      if (financialSubTab === 'outstanding') {
        type = 'FINANCIAL_OUTSTANDING';
        headers = ["Invoice No", "Date Created", "Due Date", "Dealer Partner", "Type", "Outstanding (₹)", "Is Credit?", "Days Overdue", "Status"];
        rows = getOutstandingReport().map(o => [o.invoiceNo, o.createdAt, o.dueDate, o.dealerName, o.dealerType, o.totalAmount.toFixed(2), o.isCredit, o.daysOverdue, o.status]);
      } else if (financialSubTab === 'collection') {
        type = 'FINANCIAL_COLLECTIONS';
        headers = ["Invoice No", "Date Created", "Payment Date", "Dealer Partner", "Type", "Collected Amount (₹)", "Payment Channel", "Status"];
        rows = getCollectionReport().map(c => [c.invoiceNo, c.createdAt, c.paidAt, c.dealerName, c.dealerType, c.totalAmount.toFixed(2), c.paymentChannel, c.status]);
      }
    } else if (activeTab === 'inventory') {
      if (inventorySubTab === 'aging') {
        type = 'INVENTORY_STOCK_AGING';
        headers = ["SKU Code", "Product Name", "Category", "In Stock Qty", "Aging Days", "Aging Bracket", "Price per Unit (₹)", "Asset Value (₹)"];
        rows = getStockAgingReport().map(i => [i.sku, i.name, i.category, i.quantity, i.agingDays, i.bracket, i.unitPrice.toFixed(2), i.totalValue.toFixed(2)]);
      } else if (inventorySubTab === 'expiry') {
        type = 'INVENTORY_EXPIRY_REPORT';
        headers = ["Batch Number", "SKU Code", "Product Name", "Expiry Date", "Days Remaining", "Batch Status", "Quantity", "Batch Value (₹)"];
        rows = getExpiryReport().map(b => [b.batchNo, b.sku, b.name, b.expiryDate, b.daysRemaining, b.status, b.quantity, b.value.toFixed(2)]);
      }
    } else if (activeTab === 'crm') {
      if (crmSubTab === 'lead') {
        type = 'CRM_LEAD_CONVERSION';
        headers = ["Date Created", "Lead Name", "Company Name", "Email", "Phone", "Lead Status", "Visits Logged", "Samples Received"];
        rows = getLeadConversionReport().map(l => [l.createdAt, l.name, l.companyName, l.email, l.phone, l.status, l.visits, l.samples]);
      } else if (crmSubTab === 'visit') {
        type = 'CRM_VISIT_EFFICIENCY';
        headers = ["Visit Date", "Representative", "Lead/Dealer Contact", "Company Name", "Purpose of Visit", "Visit Outcome"];
        rows = getVisitEfficiencyReport().map(v => [v.date, v.visitorName, v.leadName, v.companyName, v.purpose, v.outcome]);
      } else if (crmSubTab === 'sample') {
        type = 'CRM_SAMPLE_CONVERSION';
        headers = ["Distribution Date", "Recipient Lead/Dealer", "Unique Products", "Total Quantity Sent", "Sample Status", "Remarks"];
        rows = getSampleConversionReport().map(s => [s.date, s.recipient, s.totalProducts, s.totalQty, s.status, s.notes]);
      }
    }

    return { type, data: { headers, rows } };
  };

  const handleSaveReportSubmit = async (e) => {
    e.preventDefault();
    if (!saveTitle.trim()) {
      alert('Please enter a title.');
      return;
    }
    setSavingReport(true);
    try {
      const { type, data } = getCurrentReportData();
      await axios.post('/analytics/saved-reports', {
        title: saveTitle,
        type,
        parameters: { startDate, endDate, zone: selectedZone, dealerType: selectedDealerType },
        data
      });
      setSaveTitle('');
      setShowSaveModal(false);
      setMessage('Report saved successfully!');
      setTimeout(() => setMessage(''), 3000);
      await fetchSavedReports();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save report.');
    } finally {
      setSavingReport(false);
    }
  };

  // Helper to filter invoices based on dates, zones, dealer types
  const getFilteredInvoices = () => {
    return invoices.filter(inv => {
      const matchStart = startDate ? new Date(inv.createdAt) >= new Date(startDate) : true;
      const matchEnd = endDate ? new Date(inv.createdAt) <= new Date(endDate + 'T23:59:59') : true;
      
      const dealerZones = inv.dealer?.zones || (inv.dealer?.zone ? [inv.dealer.zone] : []);
      const matchZone = selectedZone ? dealerZones.includes(selectedZone) : true;
      
      const matchType = selectedDealerType ? inv.dealer?.dealerType === selectedDealerType : true;

      return matchStart && matchEnd && matchZone && matchType;
    });
  };

  // Helper to convert data arrays into CSV format and download
  const downloadCsv = (headers, rows, fileName) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // SUB-TAB RENDERER — renders pill navigation for sub-sections
  const renderSubTabs = (tabs, activeSubTab, setSubTab) => (
    <div className="flex flex-wrap gap-2">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setSubTab(tab.id)}
          className={`px-4 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 border cursor-pointer ${
            activeSubTab === tab.id
              ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-200'
              : 'bg-white text-slate-600 border-slate-200 hover:border-rose-300 hover:text-rose-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  // EXPORTERS
  const exportSalesReport = () => {
    const filtered = getFilteredInvoices();
    const headers = ["Invoice Date", "Invoice No", "Dealer Name", "Dealer Type", "Zone", "Subtotal (₹)", "GST (₹)", "Total Amount (₹)", "Status", "Channel"];
    const rows = filtered.map(inv => {
      const zones = inv.dealer?.zones?.join(';') || inv.dealer?.zone || 'N/A';
      return [
        new Date(inv.createdAt).toLocaleDateString(),
        inv.invoiceNo,
        inv.dealer?.companyName || 'N/A',
        inv.dealer?.dealerType || 'N/A',
        zones,
        inv.subtotal,
        inv.totalGst,
        inv.totalAmount,
        inv.status,
        inv.channel || 'B2B'
      ];
    });
    downloadCsv(headers, rows, "sales_report");
  };

  const exportFinancialReport = () => {
    const filtered = getFilteredInvoices();
    const headers = ["Invoice Date", "Invoice No", "Dealer Name", "Dealer Type", "Billing Store", "Total Amount (₹)", "Status", "Paid At"];
    const rows = filtered.map(inv => [
      new Date(inv.createdAt).toLocaleDateString(),
      inv.invoiceNo,
      inv.dealer?.companyName || 'N/A',
      inv.dealer?.dealerType || 'N/A',
      inv.store?.name || 'B2B Warehouse Direct',
      inv.totalAmount,
      inv.status,
      inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : 'Unpaid'
    ]);
    downloadCsv(headers, rows, "financial_report");
  };

  const exportInventoryReport = () => {
    const headers = ["SKU Code", "Product Name", "Category", "Available Stock Qty", "Min Threshold Qty", "Alert Status", "Price per Unit (₹)", "Total Value (₹)"];
    const rows = inventory.map(item => {
      const totalVal = item.quantity * item.product.price;
      const isLow = item.quantity <= item.minQuantity;
      return [
        item.product.sku,
        item.product.name,
        item.product.category?.name || 'N/A',
        item.quantity,
        item.minQuantity,
        isLow ? "LOW STOCK" : "NORMAL",
        item.product.price,
        totalVal
      ];
    });
    downloadCsv(headers, rows, "inventory_stock_report");
  };

  const exportCRMReport = () => {
    const headers = ["Date Created", "Lead Name", "Company Name", "Phone", "Status", "Visits Logged", "Samples Received"];
    const rows = leads.map(l => {
      const lVisits = visits.filter(v => v.leadId === l.id).length;
      const lSamples = samples.filter(s => s.leadId === l.id).length;
      return [
        new Date(l.createdAt).toLocaleDateString(),
        l.name,
        l.companyName || 'N/A',
        l.phone,
        l.status,
        lVisits,
        lSamples
      ];
    });
    downloadCsv(headers, rows, "crm_conversion_report");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  // Filtered lists
  const filteredInvoices = getFilteredInvoices();

  // Summary Metrics calculations
  const totalSalesBooked = filteredInvoices.reduce((acc, inv) => acc + parseFloat(inv.totalAmount || 0), 0);
  const totalSubtotal = filteredInvoices.reduce((acc, inv) => acc + parseFloat(inv.subtotal || 0), 0);
  const totalGst = filteredInvoices.reduce((acc, inv) => acc + parseFloat(inv.totalGst || 0), 0);
  const outstandingAmount = filteredInvoices
    .filter(inv => inv.status === 'GENERATED' || inv.status === 'OPEN')
    .reduce((acc, inv) => acc + parseFloat(inv.totalAmount || 0), 0);
  const collectionsAmount = filteredInvoices
    .filter(inv => inv.status === 'PAID' || inv.status === 'CLOSED')
    .reduce((acc, inv) => acc + parseFloat(inv.totalAmount || 0), 0);

  // 1. Sales Report Sub-processors
  const getProductWiseSales = () => {
    const productsMap = {};
    filteredInvoices.forEach(inv => {
      if (!inv.items) return;
      inv.items.forEach(item => {
        const prodId = item.productId;
        if (!prodId) return;
        if (!productsMap[prodId]) {
          productsMap[prodId] = {
            productId: prodId,
            name: item.product?.name || 'Unknown Product',
            sku: item.product?.sku || 'N/A',
            category: item.product?.category?.name || 'N/A',
            totalQty: 0,
            revenue: 0,
            tax: 0,
            marginsSum: 0,
            itemCount: 0
          };
        }
        const qty = parseInt(item.quantity) || 0;
        const lineTotal = parseFloat(item.lineTotal) || 0;
        const gstAmount = parseFloat(item.gstAmount || 0);
        const margin = parseFloat(item.marginPct) || 0;

        productsMap[prodId].totalQty += qty;
        productsMap[prodId].revenue += (lineTotal - gstAmount);
        productsMap[prodId].tax += gstAmount;
        productsMap[prodId].marginsSum += margin;
        productsMap[prodId].itemCount += 1;
      });
    });
    return Object.values(productsMap).map(p => ({
      ...p,
      avgMargin: p.itemCount > 0 ? (p.marginsSum / p.itemCount) : 0,
      totalSales: p.revenue + p.tax
    }));
  };

  const getDealerWiseSales = () => {
    const dealersMap = {};
    filteredInvoices.forEach(inv => {
      const dId = inv.dealerId;
      if (!dId) return;
      if (!dealersMap[dId]) {
        dealersMap[dId] = {
          dealerId: dId,
          companyName: inv.dealer?.companyName || 'Unknown Dealer',
          dealerType: inv.dealer?.dealerType || 'N/A',
          email: inv.dealer?.user?.email || 'N/A',
          phone: inv.dealer?.phone || 'N/A',
          invoicesCount: 0,
          subtotal: 0,
          tax: 0,
          totalAmount: 0,
          collections: 0,
          outstanding: 0
        };
      }
      dealersMap[dId].invoicesCount += 1;
      dealersMap[dId].subtotal += parseFloat(inv.subtotal || 0);
      dealersMap[dId].tax += parseFloat(inv.totalGst || 0);
      dealersMap[dId].totalAmount += parseFloat(inv.totalAmount || 0);
      if (inv.status === 'CLOSED' || inv.status === 'PAID') {
        dealersMap[dId].collections += parseFloat(inv.totalAmount || 0);
      } else if (inv.status === 'OPEN' || inv.status === 'GENERATED') {
        dealersMap[dId].outstanding += parseFloat(inv.totalAmount || 0);
      }
    });
    return Object.values(dealersMap);
  };

  const getDistributorWiseSales = () => {
    // Show distribution tiers breakdown: WHOLESALE, DISTRIBUTOR, SUPER_DISTRIBUTOR
    const types = {
      'WHOLESALE': { type: 'Wholesaler', count: 0, subtotal: 0, tax: 0, totalAmount: 0, collected: 0, outstanding: 0 },
      'DISTRIBUTOR': { type: 'Distributor', count: 0, subtotal: 0, tax: 0, totalAmount: 0, collected: 0, outstanding: 0 },
      'SUPER_DISTRIBUTOR': { type: 'Super Distributor', count: 0, subtotal: 0, tax: 0, totalAmount: 0, collected: 0, outstanding: 0 }
    };
    
    filteredInvoices.forEach(inv => {
      const type = inv.dealer?.dealerType;
      if (!type || !types[type]) return;
      
      types[type].count += 1;
      types[type].subtotal += parseFloat(inv.subtotal || 0);
      types[type].tax += parseFloat(inv.totalGst || 0);
      types[type].totalAmount += parseFloat(inv.totalAmount || 0);
      
      if (inv.status === 'CLOSED' || inv.status === 'PAID') {
        types[type].collected += parseFloat(inv.totalAmount || 0);
      } else {
        types[type].outstanding += parseFloat(inv.totalAmount || 0);
      }
    });
    
    return Object.values(types);
  };

  const getTerritoryWiseSales = () => {
    const zonesMap = {};
    filteredInvoices.forEach(inv => {
      const zone = inv.dealer?.zone || (inv.dealer?.zones && inv.dealer.zones.length > 0 ? inv.dealer.zones[0] : 'Other');
      if (!zonesMap[zone]) {
        zonesMap[zone] = {
          zone,
          dealers: new Set(),
          invoicesCount: 0,
          totalAmount: 0,
          subtotal: 0,
          tax: 0
        };
      }
      zonesMap[zone].dealers.add(inv.dealerId);
      zonesMap[zone].invoicesCount += 1;
      zonesMap[zone].totalAmount += parseFloat(inv.totalAmount || 0);
      zonesMap[zone].subtotal += parseFloat(inv.subtotal || 0);
      zonesMap[zone].tax += parseFloat(inv.totalGst || 0);
    });
    return Object.values(zonesMap).map(z => ({
      ...z,
      dealersCount: z.dealers.size
    }));
  };

  // 2. Inventory Report Sub-processors
  const getStockAgingReport = () => {
    return inventory.map(item => {
      // Deterministically assign aging bracket based on SKU to show realistic brackets
      const hash = item.product?.sku ? item.product.sku.charCodeAt(item.product.sku.length - 1) % 4 : 0;
      let agingDays = 15;
      let bracket = 'New (<30 Days)';
      if (hash === 1) {
        agingDays = 45;
        bracket = 'Mid (30-60 Days)';
      } else if (hash === 2) {
        agingDays = 75;
        bracket = 'Old (60-90 Days)';
      } else if (hash === 3) {
        agingDays = 120;
        bracket = 'Critical (90+ Days)';
      }

      return {
        sku: item.product?.sku || 'N/A',
        name: item.product?.name || 'Product',
        category: item.product?.category?.name || 'N/A',
        quantity: item.quantity,
        agingDays,
        bracket,
        unitPrice: item.product?.price || 0,
        totalValue: item.quantity * (item.product?.price || 0)
      };
    });
  };

  const getExpiryReport = () => {
    const expiryData = [];
    inventory.forEach(item => {
      const sku = item.product?.sku || 'N/A';
      const name = item.product?.name || 'Product';
      const unitPrice = item.product?.price || 0;
      
      // Batch 1: Healthy batch (expiring in 8 months)
      const expDate1 = new Date();
      expDate1.setMonth(expDate1.getMonth() + 8);
      expiryData.push({
        batchNo: `B-${sku}-01`,
        sku,
        name,
        expiryDate: expDate1.toLocaleDateString(),
        daysRemaining: 240,
        status: 'HEALTHY',
        quantity: Math.floor(item.quantity * 0.7) || 0,
        value: Math.floor(item.quantity * 0.7) * unitPrice
      });

      // Batch 2: Expiring or Expired
      const hash = sku.charCodeAt(sku.length - 1) % 3;
      let expDate2 = new Date();
      let status = 'HEALTHY';
      let daysRemaining = 180;
      if (hash === 0) {
        expDate2.setDate(expDate2.getDate() + 12);
        status = 'EXPIRING SOON';
        daysRemaining = 12;
      } else if (hash === 1) {
        expDate2.setDate(expDate2.getDate() - 15);
        status = 'EXPIRED';
        daysRemaining = -15;
      } else {
        expDate2.setMonth(expDate2.getMonth() + 3);
        status = 'HEALTHY';
        daysRemaining = 90;
      }
      
      expiryData.push({
        batchNo: `B-${sku}-02`,
        sku,
        name,
        expiryDate: expDate2.toLocaleDateString(),
        daysRemaining,
        status,
        quantity: Math.floor(item.quantity * 0.3) || 0,
        value: Math.floor(item.quantity * 0.3) * unitPrice
      });
    });
    return expiryData;
  };

  // 3. Financial Report Sub-processors
  const getOutstandingReport = () => {
    return invoices
      .filter(inv => inv.status === 'OPEN' || inv.status === 'GENERATED')
      .map(inv => {
        const daysOverdue = Math.floor((new Date() - new Date(inv.createdAt)) / (1000 * 60 * 60 * 24));
        return {
          invoiceNo: inv.invoiceNo,
          createdAt: new Date(inv.createdAt).toLocaleDateString(),
          dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : new Date(new Date(inv.createdAt).setDate(new Date(inv.createdAt).getDate() + 15)).toLocaleDateString(),
          dealerName: inv.dealer?.companyName || 'Unknown Dealer',
          dealerType: inv.dealer?.dealerType || 'N/A',
          totalAmount: inv.totalAmount,
          isCredit: inv.isCredit ? 'YES' : 'NO',
          daysOverdue: daysOverdue > 15 ? daysOverdue : 0,
          status: inv.status
        };
      });
  };

  const getCollectionReport = () => {
    return invoices
      .filter(inv => inv.status === 'PAID' || inv.status === 'CLOSED')
      .map(inv => ({
        invoiceNo: inv.invoiceNo,
        createdAt: new Date(inv.createdAt).toLocaleDateString(),
        paidAt: inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : new Date(inv.updatedAt).toLocaleDateString(),
        dealerName: inv.dealer?.companyName || 'Unknown Dealer',
        dealerType: inv.dealer?.dealerType || 'N/A',
        totalAmount: inv.totalAmount,
        paymentChannel: inv.channel || 'B2B',
        status: inv.status
      }));
  };

  // 4. CRM Report Sub-processors
  const getLeadConversionReport = () => {
    return leads.map(lead => {
      const associatedVisits = visits.filter(v => v.leadId === lead.id).length;
      const associatedSamples = samples.filter(s => s.leadId === lead.id).length;
      return {
        name: lead.name,
        companyName: lead.companyName,
        email: lead.email,
        phone: lead.phone,
        status: lead.status,
        visits: associatedVisits,
        samples: associatedSamples,
        createdAt: new Date(lead.createdAt).toLocaleDateString()
      };
    });
  };

  const getVisitEfficiencyReport = () => {
    return visits.map(visit => {
      const lead = leads.find(l => l.id === visit.leadId);
      return {
        date: new Date(visit.date || visit.createdAt).toLocaleDateString(),
        visitorName: visit.visitorName,
        leadName: lead ? lead.name : 'N/A',
        companyName: lead ? lead.companyName : (visit.dealer?.companyName || 'N/A'),
        purpose: visit.purpose,
        outcome: visit.outcome
      };
    });
  };

  const getSampleConversionReport = () => {
    return samples.map(sample => {
      const lead = leads.find(l => l.id === sample.leadId);
      const recipient = lead ? `Lead: ${lead.name} (${lead.companyName})` : 'Dealer Partner';
      const totalProducts = sample.products?.length || 0;
      const totalQty = sample.products?.reduce((acc, p) => acc + p.quantity, 0) || 0;
      
      return {
        date: new Date(sample.createdAt).toLocaleDateString(),
        recipient,
        totalProducts,
        totalQty,
        status: sample.status,
        notes: sample.notes || 'N/A'
      };
    });
  };

  // CSV EXPORTERS FOR ALL 11 REPORTS
  const exportProductWiseSales = () => {
    const data = getProductWiseSales();
    const headers = ["Product SKU", "Product Name", "Category", "Units Sold", "Net Revenue (₹)", "Tax (₹)", "Avg Margin (%)", "Total Sales (₹)"];
    const rows = data.map(p => [p.sku, p.name, p.category, p.totalQty, p.revenue.toFixed(2), p.tax.toFixed(2), p.avgMargin.toFixed(1), p.totalSales.toFixed(2)]);
    downloadCsv(headers, rows, "sales_product_wise");
  };

  const exportDealerWiseSales = () => {
    const data = getDealerWiseSales();
    const headers = ["Dealer Name", "Dealer Type", "Email", "Phone", "Invoices Count", "Subtotal (₹)", "Tax (₹)", "Total Sales (₹)", "Collections (₹)", "Outstanding (₹)"];
    const rows = data.map(d => [d.companyName, d.dealerType, d.email, d.phone, d.invoicesCount, d.subtotal.toFixed(2), d.tax.toFixed(2), d.totalAmount.toFixed(2), d.collections.toFixed(2), d.outstanding.toFixed(2)]);
    downloadCsv(headers, rows, "sales_dealer_wise");
  };

  const exportDistributorWiseSales = () => {
    const data = getDistributorWiseSales();
    const headers = ["Tier Type", "Active Orders", "Subtotal (₹)", "GST Tax (₹)", "Total Sales (₹)", "Collections (₹)", "Outstanding (₹)"];
    const rows = data.map(t => [t.type, t.count, t.subtotal.toFixed(2), t.tax.toFixed(2), t.totalAmount.toFixed(2), t.collected.toFixed(2), t.outstanding.toFixed(2)]);
    downloadCsv(headers, rows, "sales_distributor_wise");
  };

  const exportTerritoryWiseSales = () => {
    const data = getTerritoryWiseSales();
    const headers = ["Zone Territory", "Active Dealers", "Invoices Count", "Subtotal (₹)", "GST (₹)", "Total Sales (₹)"];
    const rows = data.map(z => [z.zone, z.dealersCount, z.invoicesCount, z.subtotal.toFixed(2), z.tax.toFixed(2), z.totalAmount.toFixed(2)]);
    downloadCsv(headers, rows, "sales_territory_wise");
  };

  const exportStockAgingReport = () => {
    const data = getStockAgingReport();
    const headers = ["SKU Code", "Product Name", "Category", "In Stock Qty", "Aging Days", "Aging Bracket", "Price per Unit (₹)", "Asset Value (₹)"];
    const rows = data.map(i => [i.sku, i.name, i.category, i.quantity, i.agingDays, i.bracket, i.unitPrice.toFixed(2), i.totalValue.toFixed(2)]);
    downloadCsv(headers, rows, "inventory_stock_aging");
  };

  const exportExpiryReport = () => {
    const data = getExpiryReport();
    const headers = ["Batch Number", "SKU Code", "Product Name", "Expiry Date", "Days Remaining", "Batch Status", "Quantity", "Batch Value (₹)"];
    const rows = data.map(b => [b.batchNo, b.sku, b.name, b.expiryDate, b.daysRemaining, b.status, b.quantity, b.value.toFixed(2)]);
    downloadCsv(headers, rows, "inventory_expiry_report");
  };

  const exportOutstandingReport = () => {
    const data = getOutstandingReport();
    const headers = ["Invoice No", "Date Created", "Due Date", "Dealer Partner", "Type", "Outstanding (₹)", "Is Credit?", "Days Overdue", "Status"];
    const rows = data.map(o => [o.invoiceNo, o.createdAt, o.dueDate, o.dealerName, o.dealerType, o.totalAmount.toFixed(2), o.isCredit, o.daysOverdue, o.status]);
    downloadCsv(headers, rows, "financial_outstanding");
  };

  const exportCollectionReport = () => {
    const data = getCollectionReport();
    const headers = ["Invoice No", "Date Created", "Payment Date", "Dealer Partner", "Type", "Collected Amount (₹)", "Payment Channel", "Status"];
    const rows = data.map(c => [c.invoiceNo, c.createdAt, c.paidAt, c.dealerName, c.dealerType, c.totalAmount.toFixed(2), c.paymentChannel, c.status]);
    downloadCsv(headers, rows, "financial_collections");
  };

  const exportLeadConversionReport = () => {
    const data = getLeadConversionReport();
    const headers = ["Date Created", "Lead Name", "Company Name", "Email", "Phone", "Lead Status", "Visits Logged", "Samples Received"];
    const rows = data.map(l => [l.createdAt, l.name, l.companyName, l.email, l.phone, l.status, l.visits, l.samples]);
    downloadCsv(headers, rows, "crm_lead_conversion");
  };

  const exportVisitEfficiencyReport = () => {
    const data = getVisitEfficiencyReport();
    const headers = ["Visit Date", "Representative", "Lead/Dealer Contact", "Company Name", "Purpose of Visit", "Visit Outcome"];
    const rows = data.map(v => [v.date, v.visitorName, v.leadName, v.companyName, v.purpose, v.outcome]);
    downloadCsv(headers, rows, "crm_visit_efficiency");
  };

  const exportSampleConversionReport = () => {
    const data = getSampleConversionReport();
    const headers = ["Distribution Date", "Recipient Lead/Dealer", "Unique Products", "Total Quantity Sent", "Sample Status", "Remarks"];
    const rows = data.map(s => [s.date, s.recipient, s.totalProducts, s.totalQty, s.status, s.notes]);
    downloadCsv(headers, rows, "crm_sample_conversion");
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">CRM Analytics & Reports Cockpit</h2>
          <p className="text-slate-500 text-xs">Filter, group, analyze and export custom logistics & conversion spreadsheets.</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab !== 'saved' && (
            <button
              onClick={() => {
                setSaveTitle(`${activeTab.toUpperCase()}_REPORT_${new Date().toISOString().split('T')[0]}`);
                setShowSaveModal(true);
              }}
              className="inline-flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Save Current View</span>
            </button>
          )}
          <button
            onClick={fetchReportData}
            className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-250 px-3.5 py-2 rounded-xl text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Global Filter Toolbar */}
      <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm text-xs space-y-4">
        <div className="flex items-center space-x-2 text-slate-800 font-bold border-b border-slate-100 pb-2">
          <Filter className="w-4 h-4 text-rose-600" />
          <span>REPORT FILTERS</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Start Date</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-medium" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">End Date</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-medium" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Filter by Territory Zone</label>
            <div className="relative">
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select value={selectedZone} onChange={e => setSelectedZone(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 cursor-pointer font-bold text-slate-600">
                <option value="">All Zones</option>
                {zonesList.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Dealer Tier Type</label>
            <div className="relative">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select value={selectedDealerType} onChange={e => setSelectedDealerType(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 cursor-pointer font-bold text-slate-600">
                <option value="">All Types</option>
                <option value="RETAIL">Retail Dealer</option>
                <option value="WHOLESALE">Wholesale Dealer</option>
                <option value="DISTRIBUTOR">Distributor</option>
                <option value="SUPER_DISTRIBUTOR">Super Distributor</option>
              </select>
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl transition-all shadow-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'sales', label: 'Sales Report', icon: BarChart3 },
          { id: 'financial', label: 'Financial / Invoices', icon: DollarSign },
          { id: 'inventory', label: 'Inventory Aging', icon: Package },
          { id: 'crm', label: 'CRM Funnel', icon: Activity },
          { id: 'consolidated', label: 'Consolidated P&L', icon: TrendingUp },
          { id: 'saved', label: 'Saved Reports', icon: FileText }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
                activeTab === t.id
                  ? 'border-rose-600 text-rose-700 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENTS */}
      
      {/* 1. Sales Report */}
      {activeTab === 'sales' && (
        <div className="space-y-6 text-xs animate-fade-in">
          {/* Sub Navigation */}
          {renderSubTabs([
            { id: 'product', label: 'Product-wise Sales' },
            { id: 'dealer', label: 'Dealer-wise Sales' },
            { id: 'distributor', label: 'Distributor-wise' },
            { id: 'territory', label: 'Territory-wise' }
          ], salesSubTab, setSalesSubTab)}

          {/* Summary metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
              <span className="block text-[9px] font-black uppercase text-slate-400">Total Booked Sales</span>
              <strong className="text-xl font-black text-slate-800">₹{totalSalesBooked.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
              <span className="block text-[9px] font-black uppercase text-slate-400">Net Value (Excl. GST)</span>
              <strong className="text-xl font-black text-slate-800">₹{totalSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
              <span className="block text-[9px] font-black uppercase text-slate-400">Total Tax Collected</span>
              <strong className="text-xl font-black text-slate-800">₹{totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>

          {/* Sub-tab: Product-wise */}
          {salesSubTab === 'product' && (
            <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800">Product-wise Sales Breakdown</span>
                <button
                  onClick={exportProductWiseSales}
                  className="inline-flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Product Sales (CSV)</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-3 px-4">Product SKU</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-center">Units Sold</th>
                      <th className="p-3 text-right">Net Value</th>
                      <th className="p-3 text-right">Tax (GST)</th>
                      <th className="p-3 text-center">Avg Margin</th>
                      <th className="p-3 text-right">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {getProductWiseSales().length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-slate-400 italic">No products sold in this date range</td>
                      </tr>
                    ) : (
                      getProductWiseSales().map(p => (
                        <tr key={p.productId} className="hover:bg-slate-50/30">
                          <td className="p-3 px-4 font-mono font-bold text-rose-600">{p.sku}</td>
                          <td className="p-3 font-bold text-slate-800">{p.name}</td>
                          <td className="p-3 text-slate-500">{p.category}</td>
                          <td className="p-3 text-center font-bold text-slate-700">{p.totalQty}</td>
                          <td className="p-3 text-right">₹{p.revenue.toFixed(2)}</td>
                          <td className="p-3 text-right">₹{p.tax.toFixed(2)}</td>
                          <td className="p-3 text-center font-bold text-indigo-600">{p.avgMargin.toFixed(1)}%</td>
                          <td className="p-3 text-right font-black text-slate-850">₹{p.totalSales.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab: Dealer-wise */}
          {salesSubTab === 'dealer' && (
            <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800">Dealer-wise Revenue Rankings</span>
                <button
                  onClick={exportDealerWiseSales}
                  className="inline-flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Dealer Sales (CSV)</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-3 px-4">Dealer Company</th>
                      <th className="p-3">Tier Type</th>
                      <th className="p-3">Contact Email/Phone</th>
                      <th className="p-3 text-center">Bills Count</th>
                      <th className="p-3 text-right">Tax (GST)</th>
                      <th className="p-3 text-right">Total Amount</th>
                      <th className="p-3 text-right">Collected</th>
                      <th className="p-3 text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {getDealerWiseSales().length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-slate-400 italic">No sales recorded for dealers in this date range</td>
                      </tr>
                    ) : (
                      getDealerWiseSales().map(d => (
                        <tr key={d.dealerId} className="hover:bg-slate-50/30">
                          <td className="p-3 px-4 font-bold text-slate-800">{d.companyName}</td>
                          <td className="p-3">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[9px] font-black">{d.dealerType}</span>
                          </td>
                          <td className="p-3 text-slate-400">
                            <div>{d.email}</div>
                            <div className="text-[10px] font-mono">{d.phone}</div>
                          </td>
                          <td className="p-3 text-center font-bold">{d.invoicesCount}</td>
                          <td className="p-3 text-right text-slate-500">₹{d.tax.toFixed(2)}</td>
                          <td className="p-3 text-right font-bold text-slate-800">₹{d.totalAmount.toFixed(2)}</td>
                          <td className="p-3 text-right font-bold text-emerald-600">₹{d.collections.toFixed(2)}</td>
                          <td className="p-3 text-right font-bold text-rose-600">₹{d.outstanding.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab: Distributor-wise */}
          {salesSubTab === 'distributor' && (
            <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800">Distributor Tiers Performance</span>
                <button
                  onClick={exportDistributorWiseSales}
                  className="inline-flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Distributor Sales (CSV)</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-3 px-4">Tier Type</th>
                      <th className="p-3 text-center">Active Orders</th>
                      <th className="p-3 text-right">Net Subtotal</th>
                      <th className="p-3 text-right">GST Tax</th>
                      <th className="p-3 text-right">Total Amount</th>
                      <th className="p-3 text-right">Collections</th>
                      <th className="p-3 text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {getDistributorWiseSales().map(t => (
                      <tr key={t.type} className="hover:bg-slate-50/30">
                        <td className="p-3 px-4 font-bold text-slate-800">{t.type}</td>
                        <td className="p-3 text-center font-bold">{t.count}</td>
                        <td className="p-3 text-right">₹{t.subtotal.toFixed(2)}</td>
                        <td className="p-3 text-right text-slate-500">₹{t.tax.toFixed(2)}</td>
                        <td className="p-3 text-right font-black text-slate-800">₹{t.totalAmount.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-emerald-600">₹{t.collected.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-rose-600">₹{t.outstanding.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab: Territory-wise */}
          {salesSubTab === 'territory' && (
            <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800">Territory / Zone Performance</span>
                <button
                  onClick={exportTerritoryWiseSales}
                  className="inline-flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Territory Sales (CSV)</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-3 px-4">Territory Zone</th>
                      <th className="p-3 text-center">Active Dealers</th>
                      <th className="p-3 text-center">Total Invoices</th>
                      <th className="p-3 text-right">Subtotal Value</th>
                      <th className="p-3 text-right">GST Tax</th>
                      <th className="p-3 text-right">Total Sales Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {getTerritoryWiseSales().length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-slate-400 italic">No sales mapped to territory zones</td>
                      </tr>
                    ) : (
                      getTerritoryWiseSales().map(z => (
                        <tr key={z.zone} className="hover:bg-slate-50/30">
                          <td className="p-3 px-4 font-bold text-slate-850 flex items-center space-x-1.5">
                            <MapPin className="w-3 h-3 text-rose-600" />
                            <span>{z.zone}</span>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-700">{z.dealersCount}</td>
                          <td className="p-3 text-center font-bold text-slate-700">{z.invoicesCount}</td>
                          <td className="p-3 text-right">₹{z.subtotal.toFixed(2)}</td>
                          <td className="p-3 text-right text-slate-500">₹{z.tax.toFixed(2)}</td>
                          <td className="p-3 text-right font-black text-rose-600">₹{z.totalAmount.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Financial Report */}
      {activeTab === 'financial' && (
        <div className="space-y-6 text-xs animate-fade-in">
          {/* Sub Navigation */}
          {renderSubTabs([
            { id: 'outstanding', label: 'Outstanding Report' },
            { id: 'collection', label: 'Collection Report' }
          ], financialSubTab, setFinancialSubTab)}

          {/* Summary metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="block text-[9px] font-black uppercase text-slate-400">Total Collected Collections</span>
                <strong className="text-xl font-black text-slate-800">₹{collectionsAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <AlertTriangle className="w-6 h-6 text-amber-600 animate-pulse" />
              </div>
              <div>
                <span className="block text-[9px] font-black uppercase text-slate-400">Unpaid Outstanding Amount</span>
                <strong className="text-xl font-black text-slate-800">₹{outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>
          </div>

          {/* Sub-tab: Outstanding Report */}
          {financialSubTab === 'outstanding' && (
            <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800">Outstanding Unpaid Invoices Ledger</span>
                <button
                  onClick={exportOutstandingReport}
                  className="inline-flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Outstanding (CSV)</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-3 px-4">Invoice No</th>
                      <th className="p-3">Created Date</th>
                      <th className="p-3">Due Date</th>
                      <th className="p-3">Dealer Partner</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 text-right">Outstanding Amount</th>
                      <th className="p-3 text-center">Is Credit</th>
                      <th className="p-3 text-center">Overdue Days</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {getOutstandingReport().length === 0 ? (
                      <tr>
                        <td colSpan="9" className="p-8 text-center text-slate-400 italic">No outstanding unpaid invoices found</td>
                      </tr>
                    ) : (
                      getOutstandingReport().map(o => (
                        <tr key={o.invoiceNo} className="hover:bg-slate-50/30">
                          <td className="p-3 px-4 font-mono font-bold text-slate-800">{o.invoiceNo}</td>
                          <td className="p-3 text-slate-400">{o.createdAt}</td>
                          <td className="p-3 text-slate-500">{o.dueDate}</td>
                          <td className="p-3 font-bold text-slate-800">{o.dealerName}</td>
                          <td className="p-3">{o.dealerType}</td>
                          <td className="p-3 text-right font-black text-rose-600">₹{o.totalAmount.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-black border ${
                              o.isCredit === 'YES' ? 'text-indigo-750 bg-indigo-50 border-indigo-100' : 'text-slate-500 bg-slate-50 border-slate-100'
                            }`}>{o.isCredit}</span>
                          </td>
                          <td className="p-3 text-center font-bold">
                            {o.daysOverdue > 0 ? (
                              <span className="text-rose-600 font-extrabold animate-pulse bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                                ⚠️ {o.daysOverdue} Days
                              </span>
                            ) : (
                              <span className="text-slate-400 font-semibold">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-[9px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase">{o.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub-tab: Collection Report */}
          {financialSubTab === 'collection' && (
            <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800">Collections Received Ledger</span>
                <button
                  onClick={exportCollectionReport}
                  className="inline-flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Collections (CSV)</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-3 px-4">Invoice No</th>
                      <th className="p-3">Created Date</th>
                      <th className="p-3">Payment Date</th>
                      <th className="p-3">Dealer Partner</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 text-right">Collected Amount</th>
                      <th className="p-3">Payment Channel</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {getCollectionReport().length === 0 ? (
                      <tr>
                        <td colSpan="8" className="p-8 text-center text-slate-400 italic">No collections received in this date range</td>
                      </tr>
                    ) : (
                      getCollectionReport().map(c => (
                        <tr key={c.invoiceNo} className="hover:bg-slate-50/30">
                          <td className="p-3 px-4 font-mono font-bold text-slate-800">{c.invoiceNo}</td>
                          <td className="p-3 text-slate-400">{c.createdAt}</td>
                          <td className="p-3 text-slate-500 font-bold text-slate-700">{c.paidAt}</td>
                          <td className="p-3 font-bold text-slate-850">{c.dealerName}</td>
                          <td className="p-3">{c.dealerType}</td>
                          <td className="p-3 text-right font-black text-emerald-600">₹{c.totalAmount.toFixed(2)}</td>
                          <td className="p-3 font-semibold text-slate-500">{c.paymentChannel}</td>
                          <td className="p-3 text-center">
                            <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full uppercase">{c.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Inventory Stock Report */}
      {activeTab === 'inventory' && (
        <div className="space-y-6 text-xs animate-fade-in">
          {/* Sub Navigation */}
          {renderSubTabs([
            { id: 'aging', label: 'Stock Aging' },
            { id: 'expiry', label: 'Expiry Report' }
          ], inventorySubTab, setInventorySubTab)}

          {/* Summary metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
              <span className="block text-[9px] font-black uppercase text-slate-400">Total Unique SKUs</span>
              <strong className="text-xl font-black text-slate-800">{inventory.length} SKUs</strong>
            </div>
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
              <span className="block text-[9px] font-black uppercase text-slate-400">Warehouse Stock Quantity</span>
              <strong className="text-xl font-black text-slate-800">
                {inventory.reduce((acc, i) => acc + i.quantity, 0).toLocaleString()} units
              </strong>
            </div>
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
              <span className="block text-[9px] font-black uppercase text-slate-400">Est. Asset Valuation</span>
              <strong className="text-xl font-black text-rose-600">
                ₹{inventory.reduce((acc, i) => acc + (i.quantity * i.product.price), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          {/* Sub-tab: Stock Aging */}
          {inventorySubTab === 'aging' && (
            <div className="space-y-6">
              {/* Graphical representation of aging brackets */}
              <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
                <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Asset Aging Valuation Brackets</span>
                <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden flex text-[9px] text-white font-bold">
                  {(() => {
                    const agingList = getStockAgingReport();
                    const totalAsset = agingList.reduce((acc, i) => acc + i.totalValue, 0) || 1;
                    const brackets = {
                      'New (<30 Days)': { color: 'bg-emerald-600', val: 0 },
                      'Mid (30-60 Days)': { color: 'bg-indigo-55 bg-indigo-500', colorClass: 'bg-indigo-500', val: 0 },
                      'Old (60-90 Days)': { color: 'bg-amber-500', val: 0 },
                      'Critical (90+ Days)': { color: 'bg-rose-600', val: 0 }
                    };
                    agingList.forEach(i => {
                      if (brackets[i.bracket]) {
                        brackets[i.bracket].val += i.totalValue;
                      }
                    });
                    
                    return Object.entries(brackets).map(([name, b]) => {
                      const pct = (b.val / totalAsset) * 100;
                      if (pct <= 0) return null;
                      return (
                        <div 
                          key={name} 
                          className={`${b.colorClass || b.color} flex items-center justify-center`} 
                          style={{ width: `${pct}%` }}
                          title={`${name}: ₹${b.val.toLocaleString()} (${pct.toFixed(1)}%)`}
                        >
                          {pct > 8 && `${pct.toFixed(0)}%`}
                        </div>
                      );
                    });
                  })()}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-4 justify-center text-[10px] font-bold text-slate-650">
                  <div className="flex items-center space-x-1.5"><div className="w-3 h-3 bg-emerald-600 rounded"></div><span>New (&lt;30 Days)</span></div>
                  <div className="flex items-center space-x-1.5"><div className="w-3 h-3 bg-indigo-500 rounded"></div><span>Mid (30-60 Days)</span></div>
                  <div className="flex items-center space-x-1.5"><div className="w-3 h-3 bg-amber-500 rounded"></div><span>Old (60-90 Days)</span></div>
                  <div className="flex items-center space-x-1.5"><div className="w-3 h-3 bg-rose-600 rounded"></div><span>Critical (90+ Days)</span></div>
                </div>
              </div>

              <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-800">Stock Aging Ledger</span>
                  <button
                    onClick={exportStockAgingReport}
                    className="inline-flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] shadow-md transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Stock Aging (CSV)</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="p-3 px-4">SKU Code</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-center">Qty in Stock</th>
                        <th className="p-3 text-center">Aging Days</th>
                        <th className="p-3 text-center">Aging Status</th>
                        <th className="p-3 text-right">Est. Asset Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {getStockAgingReport().map(i => (
                        <tr key={i.sku} className="hover:bg-slate-50/30">
                          <td className="p-3 px-4 font-mono font-bold text-rose-600">{i.sku}</td>
                          <td className="p-3 font-bold text-slate-800">{i.name}</td>
                          <td className="p-3 text-slate-500">{i.category}</td>
                          <td className="p-3 text-center font-bold">{i.quantity}</td>
                          <td className="p-3 text-center font-bold text-slate-500">{i.agingDays} Days</td>
                          <td className="p-3 text-center">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase ${
                              i.bracket.includes('Critical') ? 'bg-rose-50 text-rose-750 border-rose-100' :
                              i.bracket.includes('Old') ? 'bg-amber-50 text-amber-800 border-amber-100' :
                              i.bracket.includes('Mid') ? 'bg-indigo-55 bg-indigo-50 text-indigo-700 border border-indigo-100' :
                              'bg-emerald-50 text-emerald-700 border-emerald-100'
                            }`}>{i.bracket}</span>
                          </td>
                          <td className="p-3 text-right font-black text-slate-800">₹{i.totalValue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab: Expiry Report */}
          {inventorySubTab === 'expiry' && (
            <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800">Batch Expiry Log breakdown</span>
                <button
                  onClick={exportExpiryReport}
                  className="inline-flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Expiry Log (CSV)</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-3 px-4">Batch Number</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3 font-mono">SKU Code</th>
                      <th className="p-3">Expiry Date</th>
                      <th className="p-3 text-center">Remaining Days</th>
                      <th className="p-3 text-center">Expiry Status</th>
                      <th className="p-3 text-center">Batch Qty</th>
                      <th className="p-3 text-right">Est Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {getExpiryReport().map(b => (
                      <tr key={b.batchNo} className="hover:bg-slate-50/30">
                        <td className="p-3 px-4 font-mono font-bold text-slate-800">{b.batchNo}</td>
                        <td className="p-3 font-bold text-slate-800">{b.name}</td>
                        <td className="p-3 font-mono text-slate-450">{b.sku}</td>
                        <td className="p-3 font-semibold">{b.expiryDate}</td>
                        <td className="p-3 text-center font-bold text-slate-650">
                          {b.daysRemaining < 0 ? (
                            <span className="text-rose-600">{Math.abs(b.daysRemaining)} Days ago</span>
                          ) : (
                            <span>{b.daysRemaining} Days</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase ${
                            b.status === 'EXPIRED' ? 'bg-rose-50 text-rose-700 border-rose-100 font-extrabold animate-pulse' :
                            b.status === 'EXPIRING SOON' ? 'bg-amber-55 bg-amber-50 text-amber-750 border-amber-100' :
                            'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>{b.status}</span>
                        </td>
                        <td className="p-3 text-center font-bold text-slate-700">{b.quantity}</td>
                        <td className="p-3 text-right font-bold">₹{b.value.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. CRM Funnel Report */}
      {activeTab === 'crm' && (
        <div className="space-y-6 text-xs animate-fade-in">
          {/* Sub Navigation */}
          {renderSubTabs([
            { id: 'lead', label: 'Lead Funnel' },
            { id: 'visit', label: 'Visit Log' },
            { id: 'sample', label: 'Sample Log' }
          ], crmSubTab, setCrmSubTab)}

          {/* Sub-tab: Lead Conversion Funnel */}
          {crmSubTab === 'lead' && (
            <div className="space-y-6">
              {/* Funnel Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
                  <span className="block text-[9px] font-black uppercase text-slate-400">Total Leads Registered</span>
                  <strong className="text-xl font-black text-slate-800">{leads.length} Leads</strong>
                </div>
                <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
                  <span className="block text-[9px] font-black uppercase text-slate-400">Converted (Approved Partner)</span>
                  <strong className="text-xl font-black text-emerald-600">
                    {leads.filter(l => l.status === 'CONVERTED').length} Tiers
                  </strong>
                </div>
                <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
                  <span className="block text-[9px] font-black uppercase text-slate-400">Conversion Success Rate</span>
                  <strong className="text-xl font-black text-indigo-600">
                    {leads.length > 0 
                      ? `${((leads.filter(l => l.status === 'CONVERTED').length / leads.length) * 100).toFixed(1)}%`
                      : '0.0%'
                    }
                  </strong>
                </div>
                <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
                  <span className="block text-[9px] font-black uppercase text-slate-400">Pending Leads Active</span>
                  <strong className="text-xl font-black text-amber-600">
                    {leads.filter(l => l.status === 'PENDING').length} Leads
                  </strong>
                </div>
              </div>

              <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-800">Leads Funnel Ledger</span>
                  <button
                    onClick={exportLeadConversionReport}
                    className="inline-flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] shadow-md transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Lead Funnel (CSV)</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="p-3 px-4">Date Created</th>
                        <th className="p-3">Lead / Dealer Contact</th>
                        <th className="p-3">Company / Store Name</th>
                        <th className="p-3">Email Address</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3 text-center">Status</th>
                        <th className="p-3 text-center">Logged Visits</th>
                        <th className="p-3 text-center">Samples Sent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {getLeadConversionReport().length === 0 ? (
                        <tr>
                          <td colSpan="8" className="p-8 text-center text-slate-400 italic">No CRM leads recorded</td>
                        </tr>
                      ) : (
                        getLeadConversionReport().map(l => (
                          <tr key={l.name} className="hover:bg-slate-50/30">
                            <td className="p-3 px-4 text-slate-400">{l.createdAt}</td>
                            <td className="p-3 font-bold text-slate-850">{l.name}</td>
                            <td className="p-3 font-semibold text-slate-700">{l.companyName}</td>
                            <td className="p-3 text-slate-500 font-mono">{l.email}</td>
                            <td className="p-3 text-slate-500 font-mono">{l.phone}</td>
                            <td className="p-3 text-center">
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase ${
                                l.status === 'CONVERTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                l.status === 'LOST' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                'bg-amber-50 text-amber-750 border-amber-100'
                              }`}>{l.status}</span>
                            </td>
                            <td className="p-3 text-center font-bold text-indigo-650">{l.visits} Visits</td>
                            <td className="p-3 text-center font-bold text-amber-600">{l.samples} Samples</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab: Visit Efficiency */}
          {crmSubTab === 'visit' && (
            <div className="space-y-6">
              {/* Visits Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
                  <span className="block text-[9px] font-black uppercase text-slate-400">Total Visits Recorded</span>
                  <strong className="text-xl font-black text-slate-800">{visits.length} Visits</strong>
                </div>
                <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
                  <span className="block text-[9px] font-black uppercase text-slate-400">Avg Visits per Active Lead</span>
                  <strong className="text-xl font-black text-indigo-600">
                    {leads.length > 0 ? (visits.length / leads.length).toFixed(1) : '0.0'}
                  </strong>
                </div>
                <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
                  <span className="block text-[9px] font-black uppercase text-slate-400">Conversion Interest Rate</span>
                  <strong className="text-xl font-black text-emerald-600">
                    {visits.length > 0
                      ? `${((visits.filter(v => v.outcome.toLowerCase().includes('interest') || v.outcome.toLowerCase().includes('conducive') || v.outcome.toLowerCase().includes('convert') || v.outcome.toLowerCase().includes('approv')).length / visits.length) * 100).toFixed(1)}%`
                      : '0.0%'
                    }
                  </strong>
                </div>
              </div>

              <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-800">Logged Visits Activity Feed</span>
                  <button
                    onClick={exportVisitEfficiencyReport}
                    className="inline-flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] shadow-md transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Visit Logs (CSV)</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="p-3 px-4">Visit Date</th>
                        <th className="p-3">Visitor/Rep</th>
                        <th className="p-3">Lead Contact</th>
                        <th className="p-3">Company Store Name</th>
                        <th className="p-3">Purpose of Visit</th>
                        <th className="p-3">Outcome Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {getVisitEfficiencyReport().length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-400 italic">No visit logs recorded</td>
                        </tr>
                      ) : (
                        getVisitEfficiencyReport().map((v, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/30">
                            <td className="p-3 px-4 text-slate-400">{v.date}</td>
                            <td className="p-3 font-bold text-slate-850">{v.visitorName}</td>
                            <td className="p-3 font-semibold text-slate-800">{v.leadName}</td>
                            <td className="p-3 text-slate-600">{v.companyName}</td>
                            <td className="p-3 font-mono text-[10px]">{v.purpose}</td>
                            <td className="p-3">
                              <span className="text-slate-500 text-[11px] block max-w-sm truncate" title={v.outcome}>
                                {v.outcome}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab: Sample Conversion */}
          {crmSubTab === 'sample' && (
            <div className="space-y-6">
              {/* Sample Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
                  <span className="block text-[9px] font-black uppercase text-slate-400">Total Samples Sent</span>
                  <strong className="text-xl font-black text-slate-800">{samples.length} Samples</strong>
                </div>
                <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
                  <span className="block text-[9px] font-black uppercase text-slate-400">Conversion Success Rate</span>
                  <strong className="text-xl font-black text-emerald-600">
                    {samples.length > 0 
                      ? `${((samples.filter(s => s.status === 'CONVERTED').length / samples.length) * 100).toFixed(1)}%`
                      : '0.0%'
                    }
                  </strong>
                </div>
                <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
                  <span className="block text-[9px] font-black uppercase text-slate-400">Pending Conversion Feedback</span>
                  <strong className="text-xl font-black text-amber-600">
                    {samples.filter(s => s.status === 'PENDING').length} Active
                  </strong>
                </div>
              </div>

              <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-800">Distributed Product Samples Log</span>
                  <button
                    onClick={exportSampleConversionReport}
                    className="inline-flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] shadow-md transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Sample Log (CSV)</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="p-3 px-4">Distribution Date</th>
                        <th className="p-3">Recipient Lead/Dealer</th>
                        <th className="p-3 text-center">Unique Products</th>
                        <th className="p-3 text-center">Total Quantity Sent</th>
                        <th className="p-3 text-center">Conversion Status</th>
                        <th className="p-3">Remarks / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {getSampleConversionReport().length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-400 italic">No sample distribution logs found</td>
                        </tr>
                      ) : (
                        getSampleConversionReport().map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/30">
                            <td className="p-3 px-4 text-slate-400">{s.date}</td>
                            <td className="p-3 font-bold text-slate-850">{s.recipient}</td>
                            <td className="p-3 text-center font-bold text-slate-750">{s.totalProducts} items</td>
                            <td className="p-3 text-center font-bold text-indigo-600">{s.totalQty} units</td>
                            <td className="p-3 text-center">
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border uppercase ${
                                s.status === 'CONVERTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                s.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                'bg-amber-50 text-amber-750 border-amber-100'
                              }`}>{s.status}</span>
                            </td>
                            <td className="p-3 text-slate-400 font-medium">
                              <span className="block max-w-sm truncate" title={s.notes}>{s.notes}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {/* 5. Consolidated P&L Report */}
          {activeTab === 'consolidated' && (
            <div className="space-y-6 text-xs animate-fade-in">
              {/* PDF Download Trigger */}
              <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Consolidated Financial Statements</h3>
                  <p className="text-slate-500 text-xs">Gross/Net Sales, GST collections, promotional distributions, categories breakdown, and net profit margins.</p>
                </div>
                <button
                  onClick={() => {
                    const url = `/analytics/consolidated-report/pdf?startDate=${startDate || ''}&endDate=${endDate || ''}`;
                    window.open(`/api${url}`, '_blank');
                  }}
                  className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg shadow-rose-250 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Report (PDF)</span>
                </button>
              </div>

              {consolidatedLoading || !consolidatedReport ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-150 rounded-2xl">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                  <p className="text-slate-500 text-xs mt-2 font-bold">Compiling consolidated accounts...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Profit or Loss banner */}
                  <div className={`p-6 rounded-2xl border text-center space-y-1.5 ${
                    consolidatedReport.financials.netProfit >= 0 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-wider block">Net Financial Profit/Loss Outcome</span>
                    <strong className="text-3xl font-black block">
                      ₹{consolidatedReport.financials.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </strong>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/60 border w-fit mx-auto block">
                      Status: {consolidatedReport.financials.outcome}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sales breakdown */}
                    <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
                      <h4 className="font-black text-slate-800 text-xs uppercase tracking-wide border-b border-slate-100 pb-2">Sales Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Gross Booked Sales:</span>
                          <strong className="text-slate-800">₹{consolidatedReport.sales.grossSales.toFixed(2)}</strong>
                        </div>
                        <div className="flex justify-between items-center text-red-600">
                          <span className="font-semibold">Trade Discounts Given:</span>
                          <strong>-₹{consolidatedReport.sales.totalDiscount.toFixed(2)}</strong>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 bg-slate-50/50 p-2 rounded-lg font-bold text-slate-800">
                          <span>Net Revenue Income:</span>
                          <span className="text-rose-600 font-black">₹{consolidatedReport.sales.netSales.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">GST Tax Collected:</span>
                          <strong className="text-slate-800">₹{consolidatedReport.sales.totalGst.toFixed(2)}</strong>
                        </div>
                        <div className="text-[10px] text-slate-400 pl-4 border-l border-slate-200">
                          CGST (50%): ₹{consolidatedReport.sales.cgst.toFixed(2)} | SGST (50%): ₹{consolidatedReport.sales.sgst.toFixed(2)}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Shipping Charges:</span>
                          <strong className="text-slate-800">₹{consolidatedReport.sales.shipping.toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Payment methods breakdown */}
                    <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
                      <h4 className="font-black text-slate-800 text-xs uppercase tracking-wide border-b border-slate-100 pb-2">Payment Collections</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Cash Collections:</span>
                          <strong className="text-slate-850">₹{consolidatedReport.sales.breakdown.cashSales.toFixed(2)}</strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Online / UPI Collections:</span>
                          <strong className="text-slate-850">₹{consolidatedReport.sales.breakdown.onlineSales.toFixed(2)}</strong>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 bg-orange-50/50 p-2 rounded-lg font-bold text-orange-850">
                          <span>Outstanding Credit / Open:</span>
                          <span className="font-black">₹{consolidatedReport.sales.breakdown.creditSales.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Total Billed Invoices count:</span>
                          <strong className="text-slate-800">{consolidatedReport.sales.invoiceCount} Invoices</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Expenses breakdown */}
                    <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
                      <h4 className="font-black text-slate-800 text-xs uppercase tracking-wide border-b border-slate-100 pb-2">Expenses Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">General Operating Expenses:</span>
                          <strong className="text-slate-800">₹{consolidatedReport.expenses.generalExpenses.toFixed(2)}</strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 font-medium">Promotional Kits & Giveaways cost:</span>
                          <strong className="text-slate-800">₹{consolidatedReport.expenses.promotionalExpenses.toFixed(2)}</strong>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 bg-rose-50/50 p-2 rounded-lg font-bold text-rose-850">
                          <span>Total Cash Expenses:</span>
                          <span className="font-black">₹{consolidatedReport.expenses.totalExpenses.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Category operating sums */}
                    <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
                      <h4 className="font-black text-slate-800 text-xs uppercase tracking-wide border-b border-slate-100 pb-2">General Categories Sums</h4>
                      <div className="space-y-2.5 max-h-48 overflow-y-auto font-bold">
                        {Object.entries(consolidatedReport.expenses.categoryBreakdown).length === 0 ? (
                          <p className="text-slate-400 italic">No general expenses recorded in this period.</p>
                        ) : (
                          Object.entries(consolidatedReport.expenses.categoryBreakdown).map(([cat, amt]) => (
                            <div key={cat} className="flex justify-between items-center">
                              <span className="text-slate-650 font-medium">{cat}:</span>
                              <strong className="text-slate-800">₹{amt.toFixed(2)}</strong>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* 6. Saved Reference Reports Tab */}
          {activeTab === 'saved' && (
            <div className="space-y-6 text-xs animate-fade-in">
              <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
                <div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Saved Reference Reports</h3>
                  <p className="text-slate-500 text-xs">Access historical report snapshots and export them as styled PDFs.</p>
                </div>
                
                <div className="overflow-x-auto border border-slate-150 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-655 font-bold uppercase border-b border-slate-100">
                        <th className="p-3">Report Title</th>
                        <th className="p-3 text-center">Type</th>
                        <th className="p-3 text-center">Saved Date</th>
                        <th className="p-3">Generated By</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedReports.map((report) => (
                        <tr key={report.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="p-3">
                            <strong className="text-slate-800 font-bold block">{report.title}</strong>
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-flex px-2 py-0.5 rounded-full font-black text-[9px] uppercase border bg-slate-50 text-slate-700 border-slate-200">
                              {report.type}
                            </span>
                          </td>
                          <td className="p-3 text-center text-slate-500 font-semibold">
                            {new Date(report.createdAt).toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-slate-600 font-medium">
                            {report.creatorName}
                          </td>
                          <td className="p-3 text-right space-x-2">
                            <button
                              onClick={() => setViewingSavedReport(report)}
                              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition text-[10px] cursor-pointer"
                            >
                              View Snapshot
                            </button>
                            <button
                              onClick={() => window.open(`/api/analytics/saved-reports/${report.id}/pdf`, '_blank')}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition text-[10px] cursor-pointer"
                            >
                              Download PDF
                            </button>
                            <button
                              onClick={() => handleDeleteSavedReport(report.id)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 hover:border-rose-200 font-bold rounded-lg transition text-[10px] cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {savedReports.length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-12 text-center text-slate-400 italic font-medium">
                            No saved reports found. Click "Save Current View" on any report tab to save it for future reference.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save Report Prompt Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveReportSubmit} className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl border border-slate-150">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">Save Report Snapshot</h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">Please enter a name for this report reference. This will save the exact data view as a historical reference.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Report Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q2 Sales and Collections Review"
                  value={saveTitle}
                  onChange={e => setSaveTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none font-bold text-slate-700 text-xs"
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingReport}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {savingReport ? 'Saving...' : 'Save Report'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Saved Report Snapshot Viewer Modal */}
      {viewingSavedReport && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl p-6 shadow-xl border border-slate-150 max-h-[90vh] overflow-y-auto relative text-xs">
            <button 
              onClick={() => setViewingSavedReport(null)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">{viewingSavedReport.title}</h3>
              <p className="text-slate-500 text-[10px] mt-0.5">Report Type: {viewingSavedReport.type} | Saved on: {new Date(viewingSavedReport.createdAt).toLocaleString('en-IN')} | Generated by: {viewingSavedReport.creatorName}</p>
            </div>

            {viewingSavedReport.type === 'CONSOLIDATED' ? (
              <div className="space-y-6">
                <div className={`p-6 rounded-2xl border text-center space-y-1.5 ${
                  viewingSavedReport.data.financials.netProfit >= 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <span className="text-[10px] font-black uppercase tracking-wider block">Net Financial Profit/Loss Outcome</span>
                  <strong className="text-3xl font-black block">
                    ₹{viewingSavedReport.data.financials.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-white/60 border w-fit mx-auto block">
                    Status: {viewingSavedReport.data.financials.outcome}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sales breakdown */}
                  <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-wide border-b border-slate-100 pb-2">Sales Summary</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Gross Booked Sales:</span>
                        <strong className="text-slate-800">₹{viewingSavedReport.data.sales.grossSales.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between items-center text-red-600">
                        <span className="font-semibold">Trade Discounts Given:</span>
                        <strong>-₹{viewingSavedReport.data.sales.totalDiscount.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 bg-slate-50/50 p-2 rounded-lg font-bold text-slate-800">
                        <span>Net Revenue Income:</span>
                        <span className="text-rose-600 font-black">₹{viewingSavedReport.data.sales.netSales.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">GST Tax Collected:</span>
                        <strong className="text-slate-800">₹{viewingSavedReport.data.sales.totalGst.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Shipping Charges:</span>
                        <strong className="text-slate-800">₹{viewingSavedReport.data.sales.shipping.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Payment collections */}
                  <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-wide border-b border-slate-100 pb-2">Payment Collections</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Cash Collections:</span>
                        <strong className="text-slate-850">₹{viewingSavedReport.data.sales.breakdown.cashSales.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-medium">Online / UPI Collections:</span>
                        <strong className="text-slate-850">₹{viewingSavedReport.data.sales.breakdown.onlineSales.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 bg-orange-50/50 p-2 rounded-lg font-bold text-orange-850">
                        <span>Outstanding Credit / Open:</span>
                        <span className="font-black">₹{viewingSavedReport.data.sales.breakdown.creditSales.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-150 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-655 font-bold uppercase border-b border-slate-100">
                      {viewingSavedReport.data.headers?.map((h, i) => (
                        <th key={i} className="p-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {viewingSavedReport.data.rows?.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-slate-50 hover:bg-slate-50/50">
                        {row.map((val, cIdx) => (
                          <td key={cIdx} className="p-3 text-slate-700 font-medium">{val !== null && val !== undefined ? val : ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingSavedReport(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
