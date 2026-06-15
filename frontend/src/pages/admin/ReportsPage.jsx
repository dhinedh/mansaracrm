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
  Activity
} from 'lucide-react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales', 'financial', 'inventory', 'crm'
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

    } catch (err) {
      console.error('Failed to load report datasets', err);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedZone('');
    setSelectedDealerType('');
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
    .filter(inv => inv.status === 'GENERATED')
    .reduce((acc, inv) => acc + parseFloat(inv.totalAmount || 0), 0);
  const collectionsAmount = filteredInvoices
    .filter(inv => inv.status === 'PAID')
    .reduce((acc, inv) => acc + parseFloat(inv.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">CRM Analytics & Reports Cockpit</h2>
          <p className="text-slate-500 text-xs">Filter, group, analyze and export custom logistics & conversion spreadsheets.</p>
        </div>
        <button
          onClick={fetchReportData}
          className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-250 px-3.5 py-2 rounded-xl text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
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
          { id: 'crm', label: 'CRM Funnel', icon: Activity }
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

          <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-800">Sales Transactions Table</span>
              <button
                onClick={exportSalesReport}
                className="inline-flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] shadow-md transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Sales (CSV)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3 px-4">Date</th>
                    <th className="p-3">Invoice No</th>
                    <th className="p-3">Dealer</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Subtotal</th>
                    <th className="p-3 text-right">GST</th>
                    <th className="p-3 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/30">
                      <td className="p-3 px-4">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 font-mono font-bold text-rose-600">{inv.invoiceNo}</td>
                      <td className="p-3 font-bold text-slate-800">{inv.dealer?.companyName}</td>
                      <td className="p-3">{inv.dealer?.dealerType}</td>
                      <td className="p-3 text-right">₹{parseFloat(inv.subtotal).toFixed(2)}</td>
                      <td className="p-3 text-right">₹{parseFloat(inv.totalGst).toFixed(2)}</td>
                      <td className="p-3 text-right font-black text-slate-800">₹{parseFloat(inv.totalAmount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Financial Report */}
      {activeTab === 'financial' && (
        <div className="space-y-6 text-xs animate-fade-in">
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

          <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-800">Financial Billing Ledger</span>
              <button
                onClick={exportFinancialReport}
                className="inline-flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] shadow-md transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Ledger (CSV)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3 px-4">Date</th>
                    <th className="p-3">Invoice No</th>
                    <th className="p-3">Dealer Partner</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Grand Total</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3">Payment Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/30">
                      <td className="p-3 px-4">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 font-mono font-bold text-slate-800">{inv.invoiceNo}</td>
                      <td className="p-3 font-bold text-slate-700">{inv.dealer?.companyName}</td>
                      <td className="p-3">{inv.dealer?.dealerType}</td>
                      <td className="p-3 text-right font-black">₹{parseFloat(inv.totalAmount).toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${
                          inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 font-medium">
                        {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Inventory Stock Report */}
      {activeTab === 'inventory' && (
        <div className="space-y-6 text-xs animate-fade-in">
          {/* Summary metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
              <span className="block text-[9px] font-black uppercase text-slate-400">Total Unique SKUs</span>
              <strong className="text-xl font-black text-slate-800">{inventory.length} SKUs</strong>
            </div>
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
              <span className="block text-[9px] font-black uppercase text-slate-400">Total Warehouse Stock Quantity</span>
              <strong className="text-xl font-black text-slate-800">
                {inventory.reduce((acc, i) => acc + i.quantity, 0).toLocaleString()} units
              </strong>
            </div>
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
              <span className="block text-[9px] font-black uppercase text-slate-400">Low Stock SKUs Alerts</span>
              <strong className="text-xl font-black text-rose-600">
                {inventory.filter(i => i.quantity <= i.minQuantity).length} Warnings
              </strong>
            </div>
          </div>

          <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-800">Warehouse Stocks Ledger</span>
              <button
                onClick={exportInventoryReport}
                className="inline-flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] shadow-md transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Stock Report (CSV)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3 px-4">SKU Code</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-center">In Stock</th>
                    <th className="p-3 text-center">Min Threshold</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-right">Est. Asset Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {inventory.map(item => {
                    const isLow = item.quantity <= item.minQuantity;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/30">
                        <td className="p-3 px-4 font-mono font-bold text-rose-600">{item.product.sku}</td>
                        <td className="p-3 font-bold text-slate-800">{item.product.name}</td>
                        <td className="p-3 text-slate-500">{item.product.category?.name}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full font-black text-[10px] ${
                            isLow ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.quantity} {item.product.unit}
                          </span>
                        </td>
                        <td className="p-3 text-center text-slate-400 font-bold">{item.minQuantity} {item.product.unit}</td>
                        <td className="p-3 text-right">₹{parseFloat(item.product.price).toFixed(2)}</td>
                        <td className="p-3 text-right font-black text-slate-850">
                          ₹{(item.quantity * item.product.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. CRM Funnel Report */}
      {activeTab === 'crm' && (
        <div className="space-y-6 text-xs animate-fade-in">
          {/* Summary metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
              <span className="block text-[9px] font-black uppercase text-slate-400">Total Leads Registered</span>
              <strong className="text-xl font-black text-slate-800">{leads.length} Leads</strong>
            </div>
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
              <span className="block text-[9px] font-black uppercase text-slate-400">Leads Converted (APPROVED)</span>
              <strong className="text-xl font-black text-emerald-600">
                {leads.filter(l => l.status === 'CONVERTED').length} Converted
              </strong>
            </div>
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
              <span className="block text-[9px] font-black uppercase text-slate-400">Log Visits Recorded</span>
              <strong className="text-xl font-black text-indigo-600">{visits.length} Visits</strong>
            </div>
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm">
              <span className="block text-[9px] font-black uppercase text-slate-400">Product Samples Distributed</span>
              <strong className="text-xl font-black text-amber-600">{samples.length} Samples</strong>
            </div>
          </div>

          <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="font-bold text-slate-800">CRM Conversion Funnel activity</span>
              <button
                onClick={exportCRMReport}
                className="inline-flex items-center space-x-1 bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] shadow-md transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CRM Activity (CSV)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3 px-4">Date Created</th>
                    <th className="p-3">Lead / Dealer Contact</th>
                    <th className="p-3">Company / Store Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Logged Visits</th>
                    <th className="p-3 text-center">Samples Sent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {leads.map(l => {
                    const lVisits = visits.filter(v => v.leadId === l.id).length;
                    const lSamples = samples.filter(s => s.leadId === l.id).length;
                    return (
                      <tr key={l.id} className="hover:bg-slate-50/30">
                        <td className="p-3 px-4">{new Date(l.createdAt).toLocaleDateString()}</td>
                        <td className="p-3 font-bold text-slate-800">{l.name}</td>
                        <td className="p-3">{l.companyName || 'N/A'}</td>
                        <td className="p-3">{l.phone}</td>
                        <td className="p-3 text-center">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                            l.status === 'CONVERTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            l.status === 'LOST' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            'bg-amber-50 text-amber-750 border border-amber-100'
                          }`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-indigo-600">{lVisits} Visits</td>
                        <td className="p-3 text-center font-bold text-amber-600">{lSamples} Samples</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
