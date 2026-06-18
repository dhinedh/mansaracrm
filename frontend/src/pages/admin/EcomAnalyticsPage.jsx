// src/pages/admin/EcomAnalyticsPage.jsx
// E-Commerce Analytics Dashboard — connects to mansara-nourish-hub backend
import React, { useEffect, useState } from 'react';
import {
  TrendingUp, Users, ShoppingCart, IndianRupee, Package,
  RefreshCw, Calendar, AlertTriangle, Star, Clock, Zap
} from 'lucide-react';

const ECOM_API = import.meta.env.VITE_ECOM_API_URL || 'http://localhost:5000/api';
const getEcomToken = () => localStorage.getItem('mansara-token') || '';

// Minimal bar chart using pure CSS/SVG
function MiniBar({ data, valueKey, labelKey, color = '#3b82f6' }) {
  if (!data || data.length === 0) return <p className="text-xs text-slate-400 text-center py-4">No data</p>;
  const max = Math.max(...data.map(d => d[valueKey] || 0));
  return (
    <div className="flex items-end gap-1 h-32 px-1">
      {data.slice(0, 14).map((d, i) => {
        const h = max > 0 ? Math.max(4, ((d[valueKey] || 0) / max) * 100) : 4;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 bg-slate-800 text-white text-[9px] rounded px-1.5 py-0.5 whitespace-nowrap z-10 transition-opacity">
              {d[labelKey]}: {d[valueKey]?.toLocaleString?.() ?? d[valueKey]}
            </div>
            <div
              className="w-full rounded-t-sm transition-all"
              style={{ height: `${h}%`, backgroundColor: color }}
            />
          </div>
        );
      })}
    </div>
  );
}

// Minimal donut using SVG
function DonutChart({ data, valueKey, nameKey }) {
  if (!data || data.length === 0) return <p className="text-xs text-slate-400 text-center py-4">No data</p>;
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const total = data.reduce((s, d) => s + (d[valueKey] || 0), 0);
  let cumAngle = 0;
  const slices = data.map((d, i) => {
    const frac = total > 0 ? (d[valueKey] || 0) / total : 0;
    const angle = frac * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const r = 40, cx = 50, cy = 50;
    const toRad = a => (a - 90) * (Math.PI / 180);
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(cumAngle));
    const y2 = cy + r * Math.sin(toRad(cumAngle));
    const largeArc = angle > 180 ? 1 : 0;
    const pathD = angle >= 359.9
      ? `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`
      : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { pathD, color: COLORS[i % COLORS.length], name: d[nameKey], value: d[valueKey], frac };
  });
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-28 h-28 flex-shrink-0">
        {slices.map((s, i) => <path key={i} d={s.pathD} fill={s.color} />)}
        <circle cx="50" cy="50" r="25" fill="white" />
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px]">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-slate-600 truncate">{s.name}</span>
            <span className="font-bold text-slate-800 ml-auto">{(s.frac * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EcomAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, totalCustomers: 0 });
  const [salesData, setSalesData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [stockData, setStockData] = useState({ inStock: 0, lowStock: 0, outOfStock: 0 });
  const [topProducts, setTopProducts] = useState([]);
  const [inactiveCustomers, setInactiveCustomers] = useState([]);
  const [slowMoving, setSlowMoving] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => { fetchAll(); }, [timeRange]);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const h = { Authorization: `Bearer ${getEcomToken()}` };
      const safe = async (url) => {
        try { const r = await fetch(url, { headers: h }); return r.ok ? await r.json() : null; }
        catch { return null; }
      };

      const [statsD, salesD, prodD, catD, payD, stockD, inactiveD, slowD] = await Promise.all([
        safe(`${ECOM_API}/stats`),
        safe(`${ECOM_API}/stats/sales?period=${timeRange}days`),
        safe(`${ECOM_API}/stats/products?limit=5`),
        safe(`${ECOM_API}/stats/categories`),
        safe(`${ECOM_API}/stats/payment-methods`),
        safe(`${ECOM_API}/stats/stock-health`),
        safe(`${ECOM_API}/stats/insights/inactive-customers`),
        safe(`${ECOM_API}/stats/insights/slow-moving`),
      ]);

      if (statsD) setStats({
        totalRevenue: statsD.totalRevenue || 0,
        totalOrders: statsD.totalOrders || 0,
        avgOrderValue: statsD.totalOrders > 0 ? Math.round(statsD.totalRevenue / statsD.totalOrders) : 0,
        totalCustomers: statsD.totalCustomers || 0,
      });
      setSalesData(salesD || []);
      setTopProducts(prodD || []);
      setCategoryData(catD || []);
      setPaymentData(payD || []);
      setStockData(stockD || { inStock: 0, lowStock: 0, outOfStock: 0 });
      setInactiveCustomers(inactiveD || []);
      setSlowMoving(slowD || []);
    } catch (err) {
      setError('Could not connect to e-commerce backend.');
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    { label: 'Avg. Order Value', value: `₹${stats.avgOrderValue.toLocaleString('en-IN')}`, icon: TrendingUp, bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
    { label: 'Total Customers', value: stats.totalCustomers, icon: Users, bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            E-Commerce Analytics
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Live performance metrics from the Mansara online store.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select value={timeRange} onChange={e => setTimeRange(e.target.value)}
              className="text-xs bg-transparent border-none focus:outline-none font-semibold text-slate-600 cursor-pointer">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
              <option value="365">Last 1 year</option>
            </select>
          </div>
          <button onClick={fetchAll}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 font-semibold">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error} Make sure the e-commerce backend is running at {ECOM_API}.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpiCards.map(card => {
              const Icon = card.icon;
              return (
                <div key={card.label} className={`bg-white border ${card.border} rounded-2xl p-5 flex items-center gap-4 shadow-sm`}>
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <Icon className={`w-5 h-5 ${card.text}`} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                    <p className="text-lg font-black text-slate-800">{card.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Trend */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" /> Sales Trend
                </h3>
                <span className="text-[10px] text-slate-400">{salesData.length} data points</span>
              </div>
              <MiniBar
                data={salesData.map(d => ({ label: d._id || d.date, value: d.totalSales || d.total || 0 }))}
                valueKey="value" labelKey="label" color="#3b82f6"
              />
            </div>

            {/* Stock Health */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" /> Stock Health
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'In Stock', value: stockData.inStock, color: 'emerald' },
                  { label: 'Low Stock', value: stockData.lowStock, color: 'amber' },
                  { label: 'Out of Stock', value: stockData.outOfStock, color: 'rose' },
                ].map(item => {
                  const total = (stockData.inStock || 0) + (stockData.lowStock || 0) + (stockData.outOfStock || 0);
                  const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                  const barColors = { emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500' };
                  const textColors = { emerald: 'text-emerald-700', amber: 'text-amber-700', rose: 'text-rose-700' };
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-[11px] font-semibold mb-1">
                        <span className="text-slate-600">{item.label}</span>
                        <span className={textColors[item.color]}>{item.value} SKUs</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${barColors[item.color]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Category + Payment Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-black text-slate-800 text-sm mb-4">Sales by Category</h3>
              <DonutChart data={categoryData} valueKey="revenue" nameKey="_id" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-black text-slate-800 text-sm mb-4">Payment Methods</h3>
              <DonutChart data={paymentData} valueKey="count" nameKey="_id" />
            </div>
          </div>

          {/* Insights Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" /> Top Products
              </h3>
              <div className="space-y-3">
                {topProducts.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No data</p>
                ) : topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-black text-[10px] flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.totalSold || p.sold || 0} units</p>
                    </div>
                    <span className="font-black text-slate-700 text-xs">₹{(p.revenue || 0).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* At-Risk & Slow Moving */}
            <div className="space-y-4">
              {/* At-Risk Customers */}
              <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                <h3 className="font-black text-rose-800 text-xs mb-3 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> At-Risk VIP Customers
                  <span className="ml-auto text-[10px] text-rose-600">Inactive 45+ days</span>
                </h3>
                {inactiveCustomers.length === 0 ? (
                  <p className="text-[11px] text-rose-400 italic">No at-risk customers 🎉</p>
                ) : inactiveCustomers.slice(0, 3).map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-rose-100 last:border-none">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{c.name}</p>
                      <p className="text-[10px] text-rose-500">{c.daysSinceLastOrder}d since last order</p>
                    </div>
                    <span className="text-xs font-black text-slate-700">₹{(c.totalSpent || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Slow Moving Stock */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <h3 className="font-black text-amber-800 text-xs mb-3 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Clearance Candidates
                  <span className="ml-auto text-[10px] text-amber-600">High stock, low sales</span>
                </h3>
                {slowMoving.length === 0 ? (
                  <p className="text-[11px] text-amber-400 italic">No slow-moving stock 🎉</p>
                ) : slowMoving.slice(0, 3).map((p, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-amber-100 last:border-none">
                    <div>
                      <p className="text-xs font-bold text-slate-800 truncate max-w-[140px]">{p.name}</p>
                      <p className="text-[10px] text-amber-600">{p.soldLast30Days || 0} sold last 30d</p>
                    </div>
                    <span className="text-xs font-black text-amber-700">{p.stock} in stock</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
