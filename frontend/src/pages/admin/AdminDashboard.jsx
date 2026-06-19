// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Users, ShoppingBag, Warehouse, Truck, FileText, RotateCcw,
  HelpCircle, BarChart3, TrendingUp, Bell, Tag, Cable, Microscope,
  Globe, ShoppingCart, Image, MessageSquare, Settings, PackageSearch,
  Boxes, Package, DollarSign, AlertCircle, BookOpen, UserCog,
  LayoutGrid, MapPin
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
  { name: 'Zone Map',      path: '/admin/dealers',             icon: MapPin,        color: '#16a34a', bg: '#f0fdf4', desc: 'Territory assignments' },
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
function AppTile({ module, navigate }) {
  const Icon = module.icon;
  return (
    <button
      onClick={() => navigate(module.path)}
      className="group flex flex-col items-center text-center p-4 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-300"
      title={module.desc}
    >
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
  const [kpis, setKpis] = useState(null);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('crm');
  const bannerImages = [
    '/products/ragi-choco-malt-front.png',
    '/products/black-rice-delight-front.jpg',
    '/products/millet-idly-podi-front.jpg',
    '/products/urad-classic-front.jpg'
  ];
  const [bannerIdx, setBannerIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setBannerIdx(p => (p + 1) % bannerImages.length), 4000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/analytics/admin');
        setKpis(res.data.data?.kpis || {});
        // Lightweight overdue check
        const billRes = await axios.get('/billing');
        const allInv = billRes.data.data || [];
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 15);
        setOverdueCount(allInv.filter(i =>
          (i.status === 'GENERATED' || (i.isCredit && i.status === 'OPEN')) &&
          new Date(i.createdAt) <= cutoff
        ).length);
      } catch { /* silent */ }
      finally { setLoading(false); }
    })();
  }, []);

  const fmt = (n) => typeof n === 'number' ? n.toLocaleString('en-IN') : (n || '—');

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Hero Banner ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 rounded-3xl overflow-hidden shadow-xl relative">
        {/* Decorative blob */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-rose-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-slate-600/30 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8">
          <div className="space-y-3 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 bg-rose-600/25 text-rose-300 border border-rose-500/20 text-[9px] font-black uppercase px-3 py-1 rounded-full tracking-widest">
              <LayoutGrid className="w-2.5 h-2.5" /> Operations Portal
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Mansara CRM <span className="text-rose-400">Command Centre</span>
            </h1>
            <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
              Select any module below to launch it instantly. Dealers, inventory, billing, e-commerce, analytics — all in one place.
            </p>

            {/* Quick KPIs inline */}
            {!loading && kpis && (
              <div className="flex flex-wrap gap-2 pt-1">
                <KpiPill icon={DollarSign} label="Today's Sales" value={`₹${fmt(kpis.todaySales)}`} color="#f43f5e" />
                <KpiPill icon={Users}      label="Active Dealers" value={fmt(kpis.activeDealers)} color="#6366f1" />
                <KpiPill icon={Truck}      label="Pending Dispatch" value={fmt(kpis.dispatchPending)} color="#f59e0b" />
                <KpiPill icon={FileText}   label="Total Invoices" value={fmt(kpis.totalInvoices)} color="#14b8a6" />
              </div>
            )}
          </div>

          {/* Product Screensaver */}
          <div className="relative w-28 h-28 md:w-36 md:h-36 bg-white/10 border border-white/10 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner">
            {bannerImages.map((img, i) => (
              <img
                key={i} src={img} alt="Mansara Product"
                className={`absolute inset-0 object-contain w-full h-full p-2 transition-all duration-1000 ${i === bannerIdx ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
              />
            ))}
          </div>
        </div>

        {/* Overdue Alert Bar */}
        {overdueCount > 0 && (
          <div
            onClick={() => navigate('/admin/reports')}
            className="relative z-10 flex items-center gap-3 bg-amber-500/20 border-t border-amber-500/30 px-6 py-2.5 cursor-pointer hover:bg-amber-500/30 transition-colors"
          >
            <AlertCircle className="w-4 h-4 text-amber-300 flex-shrink-0" />
            <p className="text-amber-200 text-xs font-semibold">
              ⚠️ {overdueCount} overdue invoice{overdueCount > 1 ? 's' : ''} pending (≥15 days) — Click to review
            </p>
          </div>
        )}
      </div>

      {/* ── Section Toggle ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 shadow-inner">
          <button
            onClick={() => setActiveSection('crm')}
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeSection === 'crm'
                ? 'bg-white text-rose-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            CRM Modules
          </button>
          <button
            onClick={() => setActiveSection('ecom')}
            className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeSection === 'ecom'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            E-Commerce
          </button>
        </div>
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          {activeSection === 'crm' ? `${crmModules.length} modules` : `${ecomModules.length} modules`}
        </span>
      </div>

      {/* ── CRM Module Grid ───────────────────────────────────────────────── */}
      {activeSection === 'crm' && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {crmModules.map(m => (
            <AppTile key={m.name} module={m} navigate={navigate} />
          ))}
        </div>
      )}

      {/* ── E-Com Module Grid ─────────────────────────────────────────────── */}
      {activeSection === 'ecom' && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {ecomModules.map(m => (
            <AppTile key={m.name} module={m} navigate={navigate} />
          ))}
        </div>
      )}

      {/* ── Quick Action Strip ────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Quick Executive Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add New Partner',     sub: 'Register dealer',         path: '/admin/dealers',   color: '#e11d48' },
            { label: 'Initiate Transfer',   sub: 'Move stock to dealer',    path: '/admin/inventory', color: '#0369a1' },
            { label: 'Add Catalog Product', sub: 'New SKU + price',         path: '/admin/products',  color: '#0f766e' },
            { label: 'Generate Report',     sub: 'Export billing data',     path: '/admin/reports',   color: '#7c3aed' },
          ].map(a => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className="flex flex-col items-start p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200 text-left cursor-pointer group"
            >
              <div className="w-2 h-2 rounded-full mb-2 group-hover:scale-125 transition-transform" style={{ backgroundColor: a.color }} />
              <span className="text-xs font-bold text-slate-800">{a.label}</span>
              <span className="text-[10px] text-slate-400 mt-0.5">{a.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
