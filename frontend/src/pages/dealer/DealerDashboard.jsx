// src/pages/dealer/DealerDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  DollarSign, 
  Store, 
  AlertTriangle,
  AlertCircle,
  Receipt,
  ShoppingCart,
  User,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function DealerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overdueInvoices, setOverdueInvoices] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/analytics/dealer');
      setData(res.data.data);

      const billRes = await axios.get('/billing');
      const allInvoices = billRes.data.data || [];
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      const overdue = allInvoices.filter(inv => 
        inv.status === 'GENERATED' && 
        new Date(inv.createdAt) <= fifteenDaysAgo
      );
      setOverdueInvoices(overdue);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  const kpis = [
    { name: 'Total Store Billing', value: `₹${data?.kpis?.totalSales?.toLocaleString('en-IN') || 0}`, desc: 'Gross invoice sales', icon: DollarSign, color: 'text-rose-600 bg-rose-50' },
    { name: 'Invoices Generated', value: data?.kpis?.totalBills || 0, desc: 'Active customer bills', icon: Receipt, color: 'text-indigo-600 bg-indigo-50' },
    { name: 'Active Outlets', value: data?.storeSales?.length || 0, desc: 'Registered retail shops', icon: Store, color: 'text-teal-600 bg-teal-50' },
    { name: 'Low Stock SKU Alerts', value: data?.lowStockAlerts?.length || 0, desc: 'Items with quantity <= 10', icon: AlertTriangle, color: data?.lowStockAlerts?.length > 0 ? 'text-amber-600 bg-amber-50 animate-pulse' : 'text-slate-400 bg-slate-50' }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 p-8 rounded-3xl text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-12"></div>
        <div className="relative z-10 space-y-2">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">Partner Portal</h2>
          <p className="text-slate-300 text-xs md:text-sm">Welcome to Mansara Foods! View stock catalog, add retail outlets, set custom margin rules, and build GST compliant bills instantly.</p>
        </div>
      </div>

      {/* Overdue Invoices Alert Section */}
      {overdueInvoices.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4 shadow-sm text-xs">
          <div className="flex items-center space-x-3 text-amber-800 font-bold">
            <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
            <h3 className="text-sm uppercase tracking-wide">Action Required: Overdue Unpaid Invoices (&gt;= 15 Days)</h3>
          </div>
          <p className="text-amber-700 font-medium">Please clear these outstanding invoices generated more than 15 days ago to prevent logistics or delivery blockages.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {overdueInvoices.map(inv => {
              const days = Math.floor((new Date() - new Date(inv.createdAt)) / (1000 * 60 * 60 * 24));
              return (
                <div 
                  key={inv.id} 
                  className="bg-white border border-amber-100 p-4 rounded-xl flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800 text-xs">Invoice: {inv.invoiceNo}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Date: {new Date(inv.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="text-rose-600 font-black text-xs">₹{(inv.totalAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100">
                    <span className="text-[9px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-full">
                      ⚠️ {days} Days Overdue
                    </span>
                    <button
                      onClick={() => navigate('/dealer/invoices')}
                      className="text-[9px] text-rose-600 font-bold hover:underline"
                    >
                      View Invoice →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dealer Profile and Account Status Card */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">Verified Account Profile</span>
          <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <span className="bg-rose-50 p-1.5 rounded-lg text-rose-600 shrink-0">
              <User className="w-4 h-4" />
            </span>
            <span>{user?.dealer?.companyName || 'Mansara Foods Partner'}</span>
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            Partner Name: <strong className="text-slate-700">{user?.name}</strong> · Email: <strong className="text-slate-700">{user?.email}</strong> · Phone: <strong className="text-slate-700">{user?.dealer?.phone}</strong>
          </p>
        </div>
        <div className="flex flex-wrap gap-4 items-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 shrink-0">
          <div className="bg-rose-50/50 border border-rose-100/50 px-4 py-3 rounded-xl min-w-[140px]">
            <span className="block text-[9px] font-bold text-rose-600 uppercase tracking-wider">Initial Deposit Paid</span>
            <strong className="text-base font-black text-rose-700">
              ₹{user?.dealer?.initialDeposit !== undefined && user?.dealer?.initialDeposit !== null
                ? Number(user.dealer.initialDeposit).toLocaleString('en-IN', { minimumFractionDigits: 2 })
                : '0.00'}
            </strong>
          </div>
          <div className="bg-slate-50 border border-slate-150 px-4 py-3 rounded-xl min-w-[140px]">
            <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">Credit Limit</span>
            <strong className="text-base font-black text-slate-700">
              {user?.dealer?.creditLimit !== undefined && user?.dealer?.creditLimit !== null
                ? `₹${Number(user.dealer.creditLimit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                : 'No Limit'}
            </strong>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.name} className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.name}</span>
                <div className={`p-2.5 rounded-xl ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800">{kpi.value}</h3>
              <p className="text-slate-400 text-[10px] font-medium mt-1">{kpi.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Stock warnings and leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Low Stock Alerts */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-2 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Low Stock Alerts</span>
          </h3>

          <div className="space-y-3 max-h-72 overflow-y-auto">
            {data?.lowStockAlerts?.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 font-semibold">
                Perfect! No low stock alerts.
              </div>
            ) : (
              data?.lowStockAlerts?.map(item => (
                <div key={item.productId} className="flex items-center justify-between p-3.5 bg-rose-50/20 border border-rose-100/50 rounded-xl text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800 truncate max-w-[120px]">{item.name}</h4>
                    <span className="text-[9px] font-black text-rose-600 block">SKU: {item.sku}</span>
                  </div>
                  <span className="font-black text-rose-700 bg-white border border-rose-100 px-2.5 py-0.5 rounded-lg">
                    {item.quantity} units left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Store Performance Leaderboard */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-2 uppercase tracking-wider">
            <Store className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Outlets Performance Billing</span>
          </h3>

          <div className="space-y-3">
            {data?.storeSales?.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 font-semibold">
                No billing generated. Go to browse products or build invoices to start.
              </div>
            ) : (
              data?.storeSales?.map((store, index) => (
                <div key={store.storeId} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="font-black text-slate-400">#{index + 1}</span>
                    <strong className="text-slate-800">{store.name}</strong>
                  </div>
                  <strong className="font-black text-rose-600">₹{store.totalSales?.toLocaleString('en-IN')}</strong>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Product Movers Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>My Fast Moving Products</span>
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {data?.fastMovers?.length > 0 ? data.fastMovers.map((prod) => (
              <div key={prod.productId} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800 text-xs">{prod.name}</p>
                  <p className="text-[9px] text-slate-400 font-mono">SKU: {prod.sku}</p>
                </div>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-black px-2.5 py-1 rounded-lg">
                  {prod.quantitySold} units sold
                </span>
              </div>
            )) : (
              <p className="text-slate-400 py-3 text-center italic">No customer bills recorded</p>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>My Slow Moving Products</span>
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {data?.slowMovers?.length > 0 ? data.slowMovers.map((prod) => (
              <div key={prod.productId} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-800 text-xs">{prod.name}</p>
                  <p className="text-[9px] text-slate-400 font-mono">SKU: {prod.sku}</p>
                </div>
                <span className="text-xs bg-rose-50 text-rose-700 font-black px-2.5 py-1 rounded-lg">
                  {prod.quantitySold} units sold
                </span>
              </div>
            )) : (
              <p className="text-slate-400 py-3 text-center italic">No customer bills recorded</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Action blocks */}
      <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 mb-6 uppercase tracking-wider">Quick Actions Panel</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/dealer/products')}
            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-rose-50/50 hover:border-rose-100 transition-all text-left group animate-fade-in"
          >
            <div>
              <span className="block text-xs font-bold text-slate-800">Browse Warehouse</span>
              <span className="text-[10px] text-slate-400">Browse and add to cart</span>
            </div>
            <ShoppingCart className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
          </button>

          <button
            onClick={() => navigate('/dealer/stores')}
            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-rose-50/50 hover:border-rose-100 transition-all text-left group"
          >
            <div>
              <span className="block text-xs font-bold text-slate-800">Manage Retail Outlets</span>
              <span className="text-[10px] text-slate-400">Add multiple shop outlets</span>
            </div>
            <Store className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
          </button>

          <button
            onClick={() => navigate('/dealer/ledgers')}
            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-rose-50/50 hover:border-rose-100 transition-all text-left group"
          >
            <div>
              <span className="block text-xs font-bold text-slate-800">Invoices History</span>
              <span className="text-[10px] text-slate-400">Manage tax bill prints</span>
            </div>
            <Receipt className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
}
