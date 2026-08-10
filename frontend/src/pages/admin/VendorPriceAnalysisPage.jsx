// src/pages/admin/VendorPriceAnalysisPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Package,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Printer,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Layers,
  ChevronRight,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Area,
  AreaChart
} from 'recharts';

export default function VendorPriceAnalysisPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMaterialName, setSelectedMaterialName] = useState('Ragi (Finger Millet)');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    fetchPriceHistory();
  }, []);

  const fetchPriceHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get('/procurement/item-price-history');
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        setData(res.data.data);
        if (res.data.data.length > 0) {
          const ragiItem = res.data.data.find(i => i.itemName.toLowerCase().includes('ragi'));
          if (ragiItem) {
            setSelectedMaterialName(ragiItem.itemName);
          } else {
            setSelectedMaterialName(res.data.data[0].itemName);
          }
        }
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Failed to load price history:', err);
      setError('Failed to load price analysis data.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [data, searchTerm, selectedCategory]);

  const selectedMaterial = useMemo(() => {
    if (!data || data.length === 0) return null;
    return data.find(i => i.itemName.toLowerCase() === selectedMaterialName.toLowerCase()) || data[0];
  }, [data, selectedMaterialName]);

  const categories = useMemo(() => {
    const set = new Set(data.map(i => i.category));
    return ['ALL', ...Array.from(set)];
  }, [data]);

  const chartData = useMemo(() => {
    if (!selectedMaterial || !selectedMaterial.historyLog) return [];
    const list = [...selectedMaterial.historyLog].sort((a, b) => new Date(a.date) - new Date(b.date));
    return list.map(h => ({
      date: new Date(h.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: '2-digit' }),
      price: h.unitPrice,
      quantity: h.quantity,
      vendor: h.vendorName,
      type: h.type,
      totalCost: h.totalAmount || (h.unitPrice * h.quantity)
    }));
  }, [selectedMaterial]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Price Movement & Vendor Analysis
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-0.5">
                Raw Material Purchase History, Vendor-wise Price Trends & Procurement Metrics
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPriceHistory}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-all text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-all shadow-sm text-sm"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* ── Quick Material Selector Pills ───────────────────────────────── */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <Package className="w-4 h-4 text-rose-600" />
            Select Raw Material / Supply Item:
          </div>

          <div className="flex items-center gap-3">
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search raw material..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          {filteredMaterials.map(mat => {
            const isSelected = selectedMaterial && selectedMaterial.itemName === mat.itemName;
            return (
              <button
                key={mat.itemName}
                onClick={() => setSelectedMaterialName(mat.itemName)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 scale-105'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{mat.itemName}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  ₹{mat.currentPrice}/{mat.unit}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100">
          <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-sm font-medium">Loading raw material price history & vendor analysis...</p>
        </div>
      ) : selectedMaterial ? (
        <>
          {/* ── Active Raw Material Header Banner ──────────────────────────── */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
              <Package className="w-64 h-64" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 bg-rose-500/30 text-rose-300 border border-rose-400/30 rounded-full text-xs font-semibold uppercase tracking-wider">
                    {selectedMaterial.category}
                  </span>
                  <span className="px-3 py-1 bg-white/10 text-slate-200 rounded-full text-xs font-semibold">
                    Unit: {selectedMaterial.unit}
                  </span>
                  {selectedMaterial.stockStatus === 'LOW_STOCK' && (
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Low Stock
                    </span>
                  )}
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight">
                  {selectedMaterial.itemName}
                </h2>
                <p className="text-slate-300 text-sm mt-1">
                  Primary Vendor: <span className="text-white font-semibold">{selectedMaterial.bestVendorName}</span> • Total Vendors: <span className="text-white font-semibold">{selectedMaterial.vendorCount}</span>
                </p>
              </div>

              <div className="flex items-center gap-6 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Price</p>
                  <p className="text-2xl font-black text-white">₹{selectedMaterial.currentPrice.toLocaleString('en-IN')}</p>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Trend</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {selectedMaterial.priceTrendDirection === 'UP' ? (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-sm bg-rose-500/20 px-2 py-0.5 rounded-md">
                        <ArrowUpRight className="w-4 h-4" /> +{selectedMaterial.priceTrendPercent}%
                      </span>
                    ) : selectedMaterial.priceTrendDirection === 'DOWN' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-sm bg-emerald-500/20 px-2 py-0.5 rounded-md">
                        <ArrowDownRight className="w-4 h-4" /> {selectedMaterial.priceTrendPercent}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-300 font-bold text-sm bg-white/10 px-2 py-0.5 rounded-md">
                        <Minus className="w-4 h-4" /> 0.0%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 7 Core Analytics KPI Cards Grid ────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {/* Card 1: Current Price */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Current Price</span>
                <DollarSign className="w-4 h-4 text-rose-600" />
              </div>
              <p className="text-xl font-bold text-slate-900">
                ₹{selectedMaterial.currentPrice.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-400">Per {selectedMaterial.unit} (Latest PO/GRN)</p>
            </div>

            {/* Card 2: Previous Price */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Previous Price</span>
                <Clock className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-xl font-bold text-slate-900">
                ₹{selectedMaterial.previousPurchasePrice.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-400">Prior purchase rate</p>
            </div>

            {/* Card 3: Price Movement */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Price Movement</span>
                {selectedMaterial.priceChangeAmount >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-rose-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className={`text-xl font-bold ${
                  selectedMaterial.priceChangeAmount > 0 ? 'text-rose-600' :
                  selectedMaterial.priceChangeAmount < 0 ? 'text-emerald-600' : 'text-slate-900'
                }`}>
                  {selectedMaterial.priceChangeAmount > 0 ? `+₹${selectedMaterial.priceChangeAmount}` :
                   selectedMaterial.priceChangeAmount < 0 ? `-₹${Math.abs(selectedMaterial.priceChangeAmount)}` : '₹0'}
                </p>
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  selectedMaterial.priceTrendPercent > 0 ? 'bg-rose-50 text-rose-700' :
                  selectedMaterial.priceTrendPercent < 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {selectedMaterial.priceTrendPercent > 0 ? `+${selectedMaterial.priceTrendPercent}%` : `${selectedMaterial.priceTrendPercent}%`}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Price variance from last order</p>
            </div>

            {/* Card 4: Average Price */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Average Price</span>
                <BarChart3 className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-xl font-bold text-slate-900">
                ₹{selectedMaterial.averagePrice.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-400">Weighted avg across all purchases</p>
            </div>

            {/* Card 5: This Month Qty */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">This Month</span>
                <Calendar className="w-4 h-4 text-sky-600" />
              </div>
              <p className="text-xl font-bold text-slate-900">
                {selectedMaterial.thisMonthQuantity.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">{selectedMaterial.unit}</span>
              </p>
              <p className="text-[11px] text-slate-400">Procured in current month</p>
            </div>

            {/* Card 6: This Year Qty */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">This Year</span>
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xl font-bold text-slate-900">
                {selectedMaterial.thisYearQuantity.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">{selectedMaterial.unit}</span>
              </p>
              <p className="text-[11px] text-slate-400">YTD purchase volume</p>
            </div>

            {/* Card 7: Total Purchase Qty */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Quantity</span>
                <Layers className="w-4 h-4 text-purple-600" />
              </div>
              <p className="text-xl font-bold text-slate-900">
                {selectedMaterial.totalPurchaseQuantity.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-500">{selectedMaterial.unit}</span>
              </p>
              <p className="text-[11px] text-slate-400">All-time cumulative total</p>
            </div>
          </div>

          {/* ── Vendor-wise Purchase Breakdown (ஒரு Raw Material-ஐ click செய்தால்) ── */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-rose-600" />
                  Vendor-wise Purchase History & Quotations for {selectedMaterial.itemName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Suppliers who provided this raw material, quantities purchased, prices, and quotations
                </p>
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg self-start sm:self-auto">
                {selectedMaterial.vendorAnalysis?.length || 0} Suppliers Found
              </span>
            </div>

            {/* Vendor Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {selectedMaterial.vendorAnalysis && selectedMaterial.vendorAnalysis.map((vendor, idx) => (
                <div
                  key={vendor.vendorName}
                  className="bg-slate-50/70 hover:bg-slate-50 p-5 rounded-xl border border-slate-200/80 transition-all hover:shadow-md space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <h4 className="font-bold text-slate-900 text-base">
                          {vendor.vendorName}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 pl-8">
                        {vendor.purchaseCount} Order(s) • Last: {new Date(vendor.lastPurchaseDate).toLocaleDateString('en-IN')}
                      </p>
                    </div>

                    <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold text-xs rounded-lg border border-rose-100">
                      {vendor.sharePercent}% Share
                    </span>
                  </div>

                  {/* Supply Share Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-500 font-medium">
                      <span>Supply Volume</span>
                      <span>{vendor.totalQuantity.toLocaleString('en-IN')} {selectedMaterial.unit}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(vendor.sharePercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Price Specs Grid */}
                  <div className="grid grid-cols-2 gap-3 bg-white p-3 rounded-lg border border-slate-200/60 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Last Purchase Price</span>
                      <span className="font-bold text-slate-900 text-sm">₹{vendor.lastPrice} / {selectedMaterial.unit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Average Price</span>
                      <span className="font-bold text-slate-900 text-sm">₹{vendor.averagePrice} / {selectedMaterial.unit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Price Range</span>
                      <span className="font-semibold text-slate-700">₹{vendor.minPrice} - ₹{vendor.maxPrice}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Total Spend</span>
                      <span className="font-semibold text-slate-700">₹{vendor.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Recent Quotes badge */}
                  {vendor.quotes && vendor.quotes.length > 0 && (
                    <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs flex items-center justify-between text-amber-900">
                      <span className="font-semibold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Vendor Quote:
                      </span>
                      <span className="font-bold">₹{vendor.quotes[0].unitPrice} / {selectedMaterial.unit}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Price Movement Trend Chart (Recharts) ────────────────────── */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  Price Trend Timeline for {selectedMaterial.itemName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Historical purchase prices (₹ / {selectedMaterial.unit}) over time
                </p>
              </div>
            </div>

            <div className="h-[320px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={v => `₹${v}`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                            <p className="font-bold text-rose-400">{d.date}</p>
                            <p className="text-slate-200">Price: <span className="font-bold text-white">₹{d.price} / {selectedMaterial.unit}</span></p>
                            <p className="text-slate-200">Quantity: <span className="font-bold text-white">{d.quantity} {selectedMaterial.unit}</span></p>
                            <p className="text-slate-200">Vendor: <span className="font-bold text-white">{d.vendor}</span></p>
                            <p className="text-slate-400 text-[10px]">Type: {d.type}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#e11d48"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#priceGradient)"
                    activeDot={{ r: 6, fill: '#e11d48', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Purchase History Log Table ────────────────────────────────── */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-rose-600" />
                  Full Purchase History Records
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed timeline of GRNs, POs, and Vendor Quotations for {selectedMaterial.itemName}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-y border-slate-200/80 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Ref Number</th>
                    <th className="py-3 px-4">Vendor Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Quantity ({selectedMaterial.unit})</th>
                    <th className="py-3 px-4 text-right">Unit Price (₹)</th>
                    <th className="py-3 px-4 text-right">Total Cost (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {selectedMaterial.historyLog && selectedMaterial.historyLog.map((log, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {new Date(log.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 font-semibold">
                        {log.refNo || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {log.vendorName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                          log.type === 'GRN' ? 'bg-emerald-100 text-emerald-800' :
                          log.type === 'PO' ? 'bg-sky-100 text-sky-800' :
                          log.type === 'QUOTE' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium">
                        {(log.quantity || 1).toLocaleString('en-IN')} {selectedMaterial.unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        ₹{log.unitPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                        ₹{(log.totalAmount || (log.unitPrice * (log.quantity || 1))).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 text-slate-500">
          No raw material selected.
        </div>
      )}

      {/* ── All Raw Materials Comparison Master Table ──────────────────────── */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-rose-600" />
              All Materials Overview & Comparison
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Summary of all tracked raw materials, current prices, averages, and vendor metrics
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-y border-slate-200/80 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Material Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Current Price</th>
                <th className="py-3.5 px-4 text-right">Prev Price</th>
                <th className="py-3.5 px-4 text-center">Movement</th>
                <th className="py-3.5 px-4 text-right">Average Price</th>
                <th className="py-3.5 px-4 text-right">Total Qty Procured</th>
                <th className="py-3.5 px-4">Primary Supplier</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredMaterials.map((mat) => (
                <tr key={mat.itemName} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {mat.itemName}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {mat.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                    ₹{mat.currentPrice.toLocaleString('en-IN')} / {mat.unit}
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-500">
                    ₹{mat.previousPurchasePrice.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {mat.priceTrendDirection === 'UP' ? (
                      <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-xs bg-rose-50 px-2 py-0.5 rounded-full">
                        <ArrowUpRight className="w-3.5 h-3.5" /> +{mat.priceTrendPercent}%
                      </span>
                    ) : mat.priceTrendDirection === 'DOWN' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded-full">
                        <ArrowDownRight className="w-3.5 h-3.5" /> {mat.priceTrendPercent}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-500 font-medium text-xs bg-slate-100 px-2 py-0.5 rounded-full">
                        <Minus className="w-3.5 h-3.5" /> 0.0%
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                    ₹{mat.averagePrice.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium">
                    {mat.totalPurchaseQuantity.toLocaleString('en-IN')} {mat.unit}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    {mat.bestVendorName}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedMaterialName(mat.itemName);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg transition-all"
                    >
                      Analyze
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
