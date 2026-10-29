// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Users, ShoppingBag, Warehouse, Truck, FileText, RotateCcw,
  HelpCircle, BarChart3, TrendingUp, Bell, Tag, Cable, Microscope,
  Globe, ShoppingCart, Image, MessageSquare, Settings, PackageSearch,
  Boxes, Package, DollarSign, AlertCircle, BookOpen, UserCog,
  LayoutGrid, MapPin, X, Store, Receipt, Gift, Calculator,
  ShieldCheck, Calendar, Search
} from 'lucide-react';



// ─── Module Tiles Config ──────────────────────────────────────────────────────
const crmModules = [
  { name: 'Dealers',       path: '/admin/dealers',             icon: Users,         color: '#e11d48', bg: '#fff1f2', desc: 'Manage distributor partners' },
  { name: 'Price Simulator', path: '/admin/price-simulator',   icon: Calculator,    color: '#e11d48', bg: '#fff1f2', desc: 'Margin calculator & pricing suite' },
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
  { name: 'Sales Executives', path: '/admin/sales-team',       icon: Users,        color: '#e11d48', bg: '#fff1f2', desc: 'Roster, credentials & monthly targets' },
  { name: 'Beats & Routes',   path: '/admin/beats',            icon: MapPin,       color: '#2563eb', bg: '#eff6ff', desc: 'Territory beats & retail store mapping' },
  { name: 'Field Orders',     path: '/admin/field-orders',     icon: ShoppingBag,  color: '#059669', bg: '#ecfdf5', desc: 'Booked retail orders & dispatch status' },
  { name: 'Collections',      path: '/admin/sales-collections',icon: Receipt,      color: '#d97706', bg: '#fffbeb', desc: 'Cash/UPI payments & settlement ledger' },
  { name: 'Approvals Hub',    path: '/admin/sales-approvals',  icon: ShieldCheck,  color: '#dc2626', bg: '#fef2f2', desc: 'Margins, quotations & order amendments' },
  { name: 'Store Visits',     path: '/admin/store-visits',     icon: Truck,        color: '#16a34a', bg: '#f0fdf4', desc: 'Manage store check-ins & spot billing' },
  { name: 'DAR Audit',        path: '/admin/sales-dar',        icon: Calendar,     color: '#7c3aed', bg: '#faf5ff', desc: 'Daily activity reports & shift verification' },
  { name: 'Performance',      path: '/admin/sales-performance',icon: TrendingUp,   color: '#0891b2', bg: '#ecfeff', desc: 'MTD target tracking & rep leaderboards' },
  { name: 'Competitor Intel', path: '/admin/competitor-intel', icon: Search,       color: '#4f46e5', bg: '#eef2ff', desc: 'Market pricing & scheme tracking' },
  { name: 'B2C Stalls',       path: '/admin/stalls',           icon: Store,        color: '#be185d', bg: '#fdf2f8', desc: 'Direct-to-customer stall events & billing' },
  { name: 'B2C Stores',       path: '/admin/b2c-stores',       icon: ShoppingBag,  color: '#059669', bg: '#ecfdf5', desc: 'Retail outlets directory & ledger' },
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
      className="group relative flex flex-col items-center text-center p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-300"
      title={module.desc}
    >
      {badge > 0 && (
        <span className="absolute top-2 right-2 bg-rose-600 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white animate-pulse z-10 shadow-sm">
          {badge}
        </span>
      )}
      <div
        className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 shadow-sm group-hover:scale-110 transition-transform duration-200"
        style={{ backgroundColor: module.bg }}
      >
        <Icon style={{ color: module.color }} className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={1.8} />
      </div>
      <span className="text-[10px] sm:text-[11px] font-bold text-slate-700 leading-tight group-hover:text-slate-900 transition-colors line-clamp-2">
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {statsLoading ? (
          Array(4).fill(0).map((_, idx) => (
            <div key={idx} className="bg-white border border-slate-150 rounded-2xl p-3.5 sm:p-5 shadow-sm animate-pulse space-y-3">
              <div className="w-9 h-9 sm:w-12 sm:h-12 bg-slate-100 rounded-xl"></div>
              <div className="h-3 sm:h-4 bg-slate-100 rounded-full w-20 sm:w-24"></div>
              <div className="h-5 sm:h-6 bg-slate-100 rounded-full w-14 sm:w-16"></div>
            </div>
          ))
        ) : (
          <>
            <button
              onClick={() => navigate('/admin/products')}
              className="bg-white border border-slate-150 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 animate-fade-in cursor-pointer text-left w-full group min-w-0 overflow-hidden"
            >
              <div className="p-2.5 sm:p-3.5 bg-sky-50 rounded-xl sm:rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-200">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">Available Products</span>
                <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1 flex-wrap">
                  <span className="text-base sm:text-xl font-black text-slate-800 leading-tight">{stats.productsCount}</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-500 leading-tight">SKUs</span>
                </div>
                <span className="text-[9px] text-sky-500 font-semibold mt-0.5 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity">View Products →</span>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/dealers')}
              className="bg-white border border-slate-150 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 animate-fade-in cursor-pointer text-left w-full group min-w-0 overflow-hidden"
            >
              <div className="p-2.5 sm:p-3.5 bg-rose-50 rounded-xl sm:rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-200">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-rose-600" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">Active Dealers</span>
                <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1 flex-wrap">
                  <span className="text-base sm:text-xl font-black text-slate-800 leading-tight">{stats.dealersCount}</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-500 leading-tight">Partners</span>
                </div>
                <span className="text-[9px] text-rose-500 font-semibold mt-0.5 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity">View Dealers →</span>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/inventory')}
              className="bg-white border border-slate-150 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 animate-fade-in cursor-pointer text-left w-full group min-w-0 overflow-hidden"
            >
              <div className="p-2.5 sm:p-3.5 bg-emerald-50 rounded-xl sm:rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-200">
                <Boxes className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">Total Stock Qty</span>
                <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1 flex-wrap">
                  <span className="text-base sm:text-xl font-black text-slate-800 leading-tight">{stats.totalStock.toLocaleString()}</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-500 leading-tight">Units</span>
                </div>
                <span className="text-[9px] text-emerald-500 font-semibold mt-0.5 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity">View Inventory →</span>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/inventory', { state: { filter: 'low_stock' } })}
              className="bg-white border border-slate-150 rounded-2xl p-3.5 sm:p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-4 animate-fade-in cursor-pointer text-left w-full group min-w-0 overflow-hidden"
            >
              <div className="p-2.5 sm:p-3.5 bg-amber-50 rounded-xl sm:rounded-2xl shrink-0 group-hover:scale-110 transition-transform duration-200">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">Low Stock Alerts</span>
                <div className="flex items-baseline gap-1 mt-0.5 sm:mt-1 flex-wrap">
                  <span className={`text-base sm:text-xl font-black leading-tight ${stats.lowStockCount > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-800'}`}>
                    {stats.lowStockCount}
                  </span>
                  <span className={`text-xs sm:text-sm font-bold leading-tight ${stats.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-500'}`}>
                    items
                  </span>
                </div>
                <span className="text-[9px] text-amber-500 font-semibold mt-0.5 hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity">View Low Stock →</span>
              </div>
            </button>
          </>
        )}
      </div>

      {/* CRM Modules Section */}
      <div className="bg-white border border-slate-150 p-4 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-xs font-black text-rose-700 uppercase tracking-widest flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" /> CRM Management Modules
          </h2>
          <span className="text-[10px] text-slate-400 font-semibold">{crmModules.length} Modules</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 sm:gap-4">
          {crmModules.map(m => (
            <AppTile key={m.name} module={m} onClick={() => navigate(m.path)} badge={m.name === 'Notifications' ? unreadNotifications : 0} />
          ))}
        </div>
      </div>

      {/* E-Commerce Section */}
      <div className="bg-white border border-slate-150 p-4 sm:p-6 rounded-2xl shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-xs font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" /> E-Commerce Modules
          </h2>
          <span className="text-[10px] text-slate-400 font-semibold">{ecomModules.length} Modules</span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 sm:gap-4">
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
          <div className="bg-white border border-slate-150 p-4 sm:p-6 rounded-2xl shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-xs font-black text-rose-700 uppercase tracking-widest flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" /> Stalls & Field Sales
              </h2>
              <span className="text-[10px] text-slate-400 font-semibold">{activeFieldModules.length} Modules</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 sm:gap-4">
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
