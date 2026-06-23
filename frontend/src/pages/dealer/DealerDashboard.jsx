// src/pages/dealer/DealerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Wallet, 
  FileText, 
  RotateCcw, 
  HelpCircle, 
  Store, 
  ShoppingBag, 
  ShoppingCart, 
  BarChart3, 
  User, 
  Bell,
  LayoutGrid,
  Boxes,
  AlertCircle,
  Truck
} from 'lucide-react';

const dealerModules = [
  { name: 'Browse Product',     path: '/dealer/products',            icon: ShoppingBag,     color: '#7c3aed', bg: '#ede9fe', desc: 'Browse catalog & check pricing' },
  { name: 'Cart Builder',       path: '/dealer/cart',                icon: ShoppingCart,    color: '#1d4ed8', bg: '#eff6ff', desc: 'Generate store billing invoices' },
  { name: 'My Shop',            path: '/dealer/stores',              icon: Store,           color: '#e11d48', bg: '#fff1f2', desc: 'Manage retail shop outlets' },
  { name: 'Ledger',             path: '/dealer/ledgers',             icon: Wallet,          color: '#0369a1', bg: '#e0f2fe', desc: 'Verify tax invoices and dispatches' },
  { name: 'Return Log',         path: '/dealer/returns',             icon: RotateCcw,       color: '#b45309', bg: '#fffbeb', desc: 'Manage store return logs' },
  { name: 'Complaint Log',      path: '/dealer/services',            icon: HelpCircle,      color: '#065f46', bg: '#ecfdf5', desc: 'Raise support tickets to admin' },
  { name: 'Order Request',      path: '/dealer/requests',            icon: FileText,        color: '#be185d', bg: '#fdf2f8', desc: 'Submit stock requests to warehouse' },
  { name: 'Analytics',          path: '/dealer/analytics',           icon: BarChart3,       color: '#0e7490', bg: '#ecfeff', desc: 'Analyze store sales performance' },
  { name: 'Billing Profile',    path: '/dealer/profile',             icon: User,            color: '#475569', bg: '#f8fafc', desc: 'View bank and business details' },
  { name: 'Notifications',      path: '/dealer/notifications',       icon: Bell,            color: '#dc2626', bg: '#fef2f2', desc: 'View system alerts' }
];

function AppTile({ module, navigate, badge }) {
  const Icon = module.icon;
  return (
    <button
      onClick={() => navigate(module.path)}
      className="group relative flex flex-col items-center text-center p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-300"
      title={module.desc}
    >
      {badge > 0 && (
        <span className="absolute top-2.5 right-2.5 bg-rose-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border border-white animate-pulse z-10 shadow-sm">
          {badge}
        </span>
      )}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform duration-200"
        style={{ backgroundColor: module.bg }}
      >
        <Icon style={{ color: module.color }} className="w-7 h-7" strokeWidth={1.8} />
      </div>
      <span className="text-[11px] font-bold text-slate-700 leading-tight group-hover:text-slate-900 transition-colors line-clamp-2">
        {module.name}
      </span>
    </button>
  );
}

export default function DealerDashboard() {
  const navigate = useNavigate();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [stats, setStats] = useState({
    totalStock: 0,
    storeCount: 0,
    pendingShipments: 0,
    lowStockCount: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [invRes, storesRes, notifRes, transfersRes] = await Promise.all([
          axios.get('/inventory/dealer'),
          axios.get('/stores'),
          axios.get('/notifications'),
          axios.get('/inventory/transfers')
        ]);

        const inventory = invRes.data.data || [];
        const stores = storesRes.data.data || [];
        const notifications = notifRes.data.data || [];
        const transfers = transfersRes.data.data || [];

        const totalStock = inventory.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
        const lowStockCount = inventory.filter(s => (s.quantity || 0) <= 20).length;
        const storeCount = stores.length;
        const pendingShipments = transfers.filter(t => t.status === 'PENDING' || t.status === 'IN_TRANSIT').length;
        const unreadCount = notifications.filter(n => !n.isRead).length;

        setStats({
          totalStock,
          storeCount,
          pendingShipments,
          lowStockCount
        });
        setUnreadNotifications(unreadCount);
      } catch (err) {
        console.error('Error fetching dealer stats', err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsLoading ? (
          Array(4).fill(0).map((_, idx) => (
            <div key={idx} className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm animate-pulse space-y-3">
              <div className="h-4 bg-slate-100 rounded-full w-24"></div>
              <div className="h-6 bg-slate-100 rounded-full w-16"></div>
            </div>
          ))
        ) : (
          <>
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 animate-fade-in">
              <div className="p-3.5 bg-emerald-50 rounded-2xl shrink-0">
                <Boxes className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Available Stock</span>
                <strong className="text-xl font-black text-slate-800 mt-1 block">{stats.totalStock.toLocaleString()} Units</strong>
              </div>
            </div>
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 animate-fade-in">
              <div className="p-3.5 bg-rose-50 rounded-2xl shrink-0">
                <Store className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Active Outlets</span>
                <strong className="text-xl font-black text-slate-800 mt-1 block">{stats.storeCount} Shops</strong>
              </div>
            </div>
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 animate-fade-in">
              <div className="p-3.5 bg-sky-50 rounded-2xl shrink-0">
                <Truck className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Incoming Shipments</span>
                <strong className="text-xl font-black text-slate-800 mt-1 block">{stats.pendingShipments} Transfers</strong>
              </div>
            </div>
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-4 animate-fade-in">
              <div className="p-3.5 bg-amber-50 rounded-2xl shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Low Stock Alerts</span>
                <strong className={`text-xl font-black mt-1 block ${stats.lowStockCount > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-800'}`}>
                  {stats.lowStockCount} items
                </strong>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Dealer Modules Section */}
      <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-xs font-black text-rose-700 uppercase tracking-widest flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" /> Dealer Portal Modules
          </h2>
          <span className="text-[10px] text-slate-400 font-semibold">{dealerModules.length} Modules</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {dealerModules.map(m => (
            <AppTile key={m.name} module={m} navigate={navigate} badge={m.name === 'Notifications' ? unreadNotifications : 0} />
          ))}
        </div>
      </div>
    </div>
  );
}
