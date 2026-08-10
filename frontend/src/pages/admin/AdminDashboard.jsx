// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Users, ShoppingBag, Warehouse, Truck, FileText, RotateCcw,
  HelpCircle, BarChart3, TrendingUp, Bell, Tag, Cable, Microscope,
  Globe, ShoppingCart, Image, MessageSquare, Settings, PackageSearch,
  Boxes, Package, DollarSign, AlertCircle, BookOpen, UserCog,
  LayoutGrid, MapPin, X, Store, Receipt, Gift
} from 'lucide-react';



// ─── Module Tiles Config ──────────────────────────────────────────────────────
const crmModules = [
  { name: 'Dealers',       path: '/admin/dealers',             icon: Users,         color: '#e11d48', bg: '#fff1f2', desc: 'Manage distributor partners' },
  { name: 'Products',      path: '/admin/products',            icon: ShoppingBag,   color: '#0369a1', bg: '#e0f2fe', desc: 'Product catalog & pricing' },
  { name: 'Categories',    path: '/admin/categories',          icon: Tag,           color: '#7c3aed', bg: '#ede9fe', desc: 'Product groupings' },
  { name: 'Inventory',     path: '/admin/inventory',           icon: Warehouse,     color: '#0f766e', bg: '#f0fdfa', desc: 'Master stock management' },
  { name: 'Stock Slots',   path: '/admin/inventories',         icon: Boxes,         color: '#92400e', bg: '#fef3c7', desc: 'Multi-location inventory' },
  { name: 'Transfers',     path: '/admin/transfers',           icon: Truck,         color: '#1d4ed8', bg: '#eff6ff', desc: 'Dealer stock dispatches' },
  { name: 'Order Requests',path: '/admin/requests',            icon: FileText,      color: '#be185d', bg: '#fdf2f8', desc: 'Pending order queue' },
  { name: 'Returns',       path: '/admin/returns',             icon: RotateCcw,     color: '#b45309', bg: '#fffbeb', desc: 'Return & refund logs' },
  { name: 'Support Desk',  path: '/admin/services',            icon: HelpCircle,    color: '#065f46', bg: '#ecfdf5', desc: 'Customer service tickets' },
  { name: 'Reports',       path: '/admin/reports',             icon: BarChart3,     color: '#6d28d9', bg: '#f5f3ff', desc: 'Business reports & exports' },
  { name: 'Forecasting',   path: '/admin/forecasting',         icon: TrendingUp,    color: '#0e7490', bg: '#ecfeff', desc: 'Demand & sales forecast' },
  { name: 'Analytics',     path: '/admin/analytics',           icon: BarChart3,     color: '#7c3aed', bg: '#faf5ff', desc: 'Deep data analytics' },
  { name: 'Notifications', path: '/admin/notifications',       icon: Bell,          color: '#dc2626', bg: '#fef2f2', desc: 'System alerts & messages' },
  { name: 'Channels',      path: '/admin/channel-integration', icon: Cable,         color: '#0891b2', bg: '#ecfeff', desc: 'Platform integrations' },
  { name: 'R&D Lab',       path: '/admin/rnd',                 icon: Microscope,    color: '#475569', bg: '#f8fafc', desc: 'Research & development' },
  { name: 'Zone Map',      path: '/admin/zone-map',            icon: MapPin,        color: '#16a34a', bg: '#f0fdf4', desc: 'Territory assignments' },
  { name: 'Invoice Ledger', path: '/admin/invoice-ledger',      icon: FileText,      color: '#e11d48', bg: '#fff1f2', desc: 'B2B & B2C tax invoices ledger' },
  { name: 'Expenses',       path: '/admin/expenses',            icon: Receipt,       color: '#047857', bg: '#ecfdf5', desc: 'General business expense ledger' },
  { name: 'Offer Exp',      path: '/admin/offers',              icon: Gift,          color: '#c2410c', bg: '#fff7ed', desc: 'Promotional gift tracking' },
  { name: 'Privileges',     path: '/admin/users',               icon: UserCog,       color: '#0f766e', bg: '#f0fdfa', desc: 'Manage access privileges & roles' },
];

const fieldModules = [
  { name: 'B2C Stalls',    path: '/admin/stalls',       icon: Store,  color: '#e11d48', bg: '#fff1f2', desc: 'Direct-to-customer stall events & billing' },
  { name: 'Store Visits',  path: '/admin/store-visits', icon: Truck,  color: '#16a34a', bg: '#f0fdf4', desc: 'Manage store check-ins & order fulfillment' }
];

const ecomModules = [
  { name: 'E-Com Products', path: '/admin/ecom/products',  icon: Package,       color: '#2563eb', bg: '#eff6ff', desc: 'Website product listings' },
  { name: 'Website Orders', path: '/admin/ecom/orders',    icon: ShoppingCart,  color: '#059669', bg: '#ecfdf5', desc: 'Online customer orders' },
  { name: 'Customers',      path: '/admin/ecom/customers', icon: Users,         color: '#7c3aed', bg: '#faf5ff', desc: 'B2C customer database' },
  { name: 'Combos',         path: '/admin/ecom/combos',    icon: PackageSearch, color: '#dc2626', bg: '#fef2f2', desc: 'Product bundle deals' },
  { name: 'Banners',        path: '/admin/ecom/banners',   icon: Image,         color: '#d97706', bg: '#fffbeb', desc: 'Homepage visuals' },
  { name: 'Reviews',        path: '/admin/ecom/reviews',   icon: MessageSquare, color: '#0891b2', bg: '#ecfeff', desc: 'Customer feedback' },
  { name: 'Web Content',    path: '/admin/ecom/content',   icon: BookOpen,      color: '#4f46e5', bg: '#eef2ff', desc: 'Pages & descriptions' },
  { name: 'Store Settings', path: '/admin/ecom/settings',  icon: Settings,      color: '#475569', bg: '#f8fafc', desc: 'E-com configuration' },
  { name: 'Ecom Reports',   path: '/admin/ecom/reports',   icon: BarChart3,     color: '#065f46', bg: '#ecfdf5', desc: 'Online sales reports' },
  { name: 'Ecom Analytics', path: '/admin/ecom/analytics', icon: TrendingUp,    color: '#1d4ed8', bg: '#eff6ff', desc: 'Traffic & conversion' },
];

// ─── App Tile Component ───────────────────────────────────────────────────────
function AppTile({ module, onClick, badge }) {
  const Icon = module.icon;
  return (
    <button
      onClick={onClick}
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

// ─── KPI Pill ─────────────────────────────────────────────────────────────────
function KpiPill({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-4 py-2.5 shadow-sm">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '15' }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-sm font-black text-slate-800">{value}</p>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [licensing, setLicensing] = useState({ enableB2cStall: true, enableFieldSales: true });
  const [stats, setStats] = useState({
    productsCount: 0,
    dealersCount: 0,
    totalStock: 0,
    lowStockCount: 0
  });
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    const fetchStats = () => {
      axios.get('/inventory/company').then(stockRes => {
        const stocks = stockRes.data.data || [];
        const totalStock = stocks.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
        const lowStockCount = stocks.filter(s => (s.quantity || 0) <= (s.minQuantity || 10)).length;
        setStats(prev => ({
          ...prev,
          productsCount: stocks.length,
          totalStock,
          lowStockCount
        }));
      }).catch(err => console.error(err));

      axios.get('/dealers').then(dealersRes => {
        const dealers = dealersRes.data.data || [];
        setStats(prev => ({ ...prev, dealersCount: dealers.length }));
      }).catch(err => console.error(err));

      axios.get('/notifications').then(notifRes => {
        const notifications = notifRes.data.data || [];
        const unreadCount = notifications.filter(n => !n.isRead).length;
        setUnreadNotifications(unreadCount);
      }).catch(err => console.error(err));

      axios.get('/ecom/settings').then(settingsRes => {
        if (settingsRes.data?.success && settingsRes.data?.settings) {
          setLicensing({
            enableB2cStall: settingsRes.data.settings.enableB2cStall !== false,
            enableFieldSales: settingsRes.data.settings.enableFieldSales !== false
          });
        }
      }).catch(err => console.error(err));
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
            <button
              onClick={() => navigate('/admin/products')}
              className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4 animate-fade-in cursor-pointer text-left w-full group"
            >
              <div className="p-3.5 bg-sky-50 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-200">
                <ShoppingBag className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Available Products</span>
                <strong className="text-xl font-black text-slate-800 mt-1 block">{stats.productsCount} SKUs</strong>
                <span className="text-[9px] text-sky-500 font-semibold mt-0.5 block opacity-0 group-hover:opacity-100 transition-opacity">View Products →</span>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/dealers')}
              className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4 animate-fade-in cursor-pointer text-left w-full group"
            >
              <div className="p-3.5 bg-rose-50 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-200">
                <Users className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Active Dealers</span>
                <strong className="text-xl font-black text-slate-800 mt-1 block">{stats.dealersCount} Partners</strong>
                <span className="text-[9px] text-rose-500 font-semibold mt-0.5 block opacity-0 group-hover:opacity-100 transition-opacity">View Dealers →</span>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/inventory')}
              className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4 animate-fade-in cursor-pointer text-left w-full group"
            >
              <div className="p-3.5 bg-emerald-50 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-200">
                <Boxes className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Total Stock Qty</span>
                <strong className="text-xl font-black text-slate-800 mt-1 block">{stats.totalStock.toLocaleString()} Units</strong>
                <span className="text-[9px] text-emerald-500 font-semibold mt-0.5 block opacity-0 group-hover:opacity-100 transition-opacity">View Inventory →</span>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/inventory', { state: { filter: 'low_stock' } })}
              className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-4 animate-fade-in cursor-pointer text-left w-full group"
            >
              <div className="p-3.5 bg-amber-50 rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-200">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Low Stock Alerts</span>
                <strong className={`text-xl font-black mt-1 block ${stats.lowStockCount > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-800'}`}>
                  {stats.lowStockCount} items
                </strong>
                <span className="text-[9px] text-amber-500 font-semibold mt-0.5 block opacity-0 group-hover:opacity-100 transition-opacity">View Low Stock →</span>
              </div>
            </button>
          </>
        )}
      </div>

      {/* CRM Modules Section */}
      <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-xs font-black text-rose-700 uppercase tracking-widest flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" /> CRM Management Modules
          </h2>
          <span className="text-[10px] text-slate-400 font-semibold">{crmModules.length} Modules</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {crmModules.map(m => (
            <AppTile key={m.name} module={m} onClick={() => navigate(m.path)} badge={m.name === 'Notifications' ? unreadNotifications : 0} />
          ))}
        </div>
      </div>

      {/* E-Commerce Section */}
      <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-xs font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" /> E-Commerce Modules
          </h2>
          <span className="text-[10px] text-slate-400 font-semibold">{ecomModules.length} Modules</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {ecomModules.map(m => (
            <AppTile key={m.name} module={m} onClick={() => navigate(m.path)} />
          ))}
        </div>
      </div>

      {/* Stalls & Field Sales Section */}
      {(() => {
        const activeFieldModules = fieldModules.filter(m => {
          if (m.path === '/admin/stalls' && !licensing.enableB2cStall) return false;
          if (m.path === '/admin/store-visits' && !licensing.enableFieldSales) return false;
          return true;
        });

        if (activeFieldModules.length === 0) return null;

        return (
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-xs font-black text-rose-700 uppercase tracking-widest flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" /> Stalls & Field Sales
              </h2>
              <span className="text-[10px] text-slate-400 font-semibold">{activeFieldModules.length} Modules</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {activeFieldModules.map(m => (
                <AppTile key={m.name} module={m} onClick={() => navigate(m.path)} />
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
