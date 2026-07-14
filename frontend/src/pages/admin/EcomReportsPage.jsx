// src/pages/admin/EcomReportsPage.jsx
// E-Commerce Sales Reports — connects to mansara-nourish-hub backend
import React, { useEffect, useState } from 'react';
import {
  BarChart3, Download, RefreshCw, TrendingUp,
  ShoppingCart, Users, IndianRupee, Package,
  Calendar, Filter, AlertTriangle
} from 'lucide-react';

const getEcomApiUrl = () => {
  const envUrl = import.meta.env.VITE_ECOM_API_URL;
  if (envUrl) return envUrl;
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal ? 'http://localhost:5001/api' : 'https://api.mansarafoods.com/api';
};

const ECOM_API = getEcomApiUrl();
const getEcomToken = () => localStorage.getItem('mansara_token') || localStorage.getItem('mansara-token') || '';

const downloadCsv = (headers, rows, fileName) => {
  let csv = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n';
  rows.forEach(r => { csv += r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',') + '\n'; });
  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csv));
  link.setAttribute('download', `${fileName}_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function EcomReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // orders | products | customers
  const [timeRange, setTimeRange] = useState('30');
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, avgOrderValue: 0, totalCustomers: 0 });
  const [orders, setOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [salesData, setSalesData] = useState([]);

  useEffect(() => { fetchAll(); }, [timeRange]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const h = { Authorization: `Bearer ${getEcomToken()}` };

      const [statsRes, ordersRes, prodRes, custRes, salesRes] = await Promise.all([
        fetch(`${ECOM_API}/stats`, { headers: h }),
        fetch(`${ECOM_API}/orders?limit=200`, { headers: h }),
        fetch(`${ECOM_API}/stats/products?limit=10`, { headers: h }),
        fetch(`${ECOM_API}/stats/customers?limit=10`, { headers: h }),
        fetch(`${ECOM_API}/stats/sales?period=${timeRange}days`, { headers: h }),
      ]);

      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();
      const prodData = await prodRes.json();
      const custData = await custRes.json();
      const salesD = await salesRes.json();

      setStats({
        totalRevenue: statsData.totalRevenue || 0,
        totalOrders: statsData.totalOrders || 0,
        avgOrderValue: statsData.totalOrders > 0 ? Math.round(statsData.totalRevenue / statsData.totalOrders) : 0,
        totalCustomers: statsData.totalCustomers || 0,
      });
      setOrders(ordersData.orders || ordersData.data || []);
      setTopProducts(prodData || []);
      setTopCustomers(custData || []);
      setSalesData(salesD || []);
    } catch (err) {
      console.error('EcomReports fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportOrders = () => {
    const h = ['Date', 'Order ID', 'Customer', 'Email', 'Items', 'Total (₹)', 'Status', 'Payment'];
    const rows = orders.map(o => [
      new Date(o.createdAt).toLocaleDateString(),
      o._id || o.id,
      o.user?.name || o.shippingAddress?.name || 'Guest',
      o.user?.email || '—',
      o.items?.length || 0,
      o.totalAmount || o.total || 0,
      o.status,
      o.paymentMethod || '—',
    ]);
    downloadCsv(h, rows, 'ecom_orders');
  };

  const exportTopProducts = () => {
    const h = ['Product Name', 'Units Sold', 'Revenue (₹)'];
    const rows = topProducts.map(p => [p.name, p.totalSold || p.sold || 0, p.revenue || 0]);
    downloadCsv(h, rows, 'ecom_top_products');
  };

  const exportTopCustomers = () => {
    const h = ['Customer Name', 'Total Orders', 'Total Spent (₹)'];
    const rows = topCustomers.map(c => [c.name, c.totalOrders || 0, c.totalSpent || 0]);
    downloadCsv(h, rows, 'ecom_top_customers');
  };

  const statCards = [
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'emerald' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'blue' },
    { label: 'Avg. Order Value', value: `₹${stats.avgOrderValue.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'purple' },
    { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'orange' },
  ];

  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            E-Commerce Reports
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Sales, order, and customer analytics for the online store.</p>
        </div>
        <div className="flex gap-2 items-center">
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

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map(card => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                  <div className={`p-3 rounded-xl ${colorMap[card.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
                    <p className="text-lg font-black text-slate-800">{card.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 gap-1">
            {[
              { id: 'orders', label: 'Orders', icon: ShoppingCart },
              { id: 'products', label: 'Top Products', icon: Package },
              { id: 'customers', label: 'Top Customers', icon: Users },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-5 py-3 text-xs font-bold border-b-2 transition-all ${
                    activeTab === t.id
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}>
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">{orders.length} Orders</span>
                <button onClick={exportOrders}
                  className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] transition-all cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="p-3 px-4">Date</th>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3 text-center">Items</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {orders.length === 0 ? (
                      <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">No orders found</td></tr>
                    ) : (
                      orders.slice(0, 50).map(o => {
                        const statusColors = {
                          delivered: 'bg-emerald-50 text-emerald-700',
                          processing: 'bg-blue-50 text-blue-700',
                          shipped: 'bg-purple-50 text-purple-700',
                          cancelled: 'bg-rose-50 text-rose-700',
                          pending: 'bg-amber-50 text-amber-700',
                        };
                        const sc = statusColors[(o.status || '').toLowerCase()] || 'bg-slate-100 text-slate-600';
                        return (
                          <tr key={o._id || o.id} className="hover:bg-slate-50/30">
                            <td className="p-3 px-4 text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                            <td className="p-3 font-mono text-[10px] text-slate-600">#{(o._id || o.id || '').slice(-8).toUpperCase()}</td>
                            <td className="p-3 font-bold text-slate-800">{o.user?.name || o.shippingAddress?.name || 'Guest'}</td>
                            <td className="p-3 text-center">{o.items?.length || 0}</td>
                            <td className="p-3 text-right font-black text-slate-800">₹{(o.totalAmount || o.total || 0).toLocaleString('en-IN')}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${sc}`}>{o.status}</span>
                            </td>
                            <td className="p-3 text-center text-slate-500">{o.paymentMethod || '—'}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top Products Tab */}
          {activeTab === 'products' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">Top Selling Products</span>
                <button onClick={exportTopProducts}
                  className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {topProducts.length === 0 ? (
                  <p className="p-8 text-center text-slate-400 text-xs italic">No product data available</p>
                ) : topProducts.map((p, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50/50">
                    <span className="text-slate-400 font-black text-sm w-6 text-center">#{i + 1}</span>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-xs">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.totalSold || p.sold || 0} units sold</p>
                    </div>
                    <span className="font-black text-slate-800 text-sm">₹{(p.revenue || 0).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Customers Tab */}
          {activeTab === 'customers' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">Top Customers</span>
                <button onClick={exportTopCustomers}
                  className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-xl text-[10px] cursor-pointer">
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {topCustomers.length === 0 ? (
                  <p className="p-8 text-center text-slate-400 text-xs italic">No customer data available</p>
                ) : topCustomers.map((c, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50/50">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center text-sm flex-shrink-0">
                      {(c.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-xs">{c.name}</p>
                      <p className="text-[10px] text-slate-400">{c.totalOrders || 0} orders</p>
                    </div>
                    <span className="font-black text-slate-800 text-sm">₹{(c.totalSpent || 0).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
