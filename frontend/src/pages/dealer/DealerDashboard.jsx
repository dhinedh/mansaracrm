// src/pages/dealer/DealerDashboard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  LayoutGrid
} from 'lucide-react';

const dealerModules = [
  { name: 'Ledger',             path: '/dealer/ledgers',             icon: Wallet,          color: '#0369a1', bg: '#e0f2fe', desc: 'Verify tax invoices and dispatches' },
  { name: 'Order Requests',     path: '/dealer/requests',            icon: FileText,        color: '#be185d', bg: '#fdf2f8', desc: 'Submit stock requests to warehouse' },
  { name: 'Returns Log',        path: '/dealer/returns',             icon: RotateCcw,       color: '#b45309', bg: '#fffbeb', desc: 'Manage store return logs' },
  { name: 'Complaints / Tickets',path: '/dealer/services',           icon: HelpCircle,      color: '#065f46', bg: '#ecfdf5', desc: 'Raise support tickets to admin' },
  { name: 'My Shops / Stores',  path: '/dealer/stores',              icon: Store,           color: '#e11d48', bg: '#fff1f2', desc: 'Manage retail shop outlets' },
  { name: 'Browse Products',    path: '/dealer/products',            icon: ShoppingBag,     color: '#7c3aed', bg: '#ede9fe', desc: 'Browse catalog & check pricing' },
  { name: 'Cart / Bill Builder',path: '/dealer/cart',                icon: ShoppingCart,    color: '#1d4ed8', bg: '#eff6ff', desc: 'Generate store billing invoices' },
  { name: 'My Analytics',       path: '/dealer/analytics',           icon: BarChart3,       color: '#0e7490', bg: '#ecfeff', desc: 'Analyze store sales performance' },
  { name: 'Billing Profile',    path: '/dealer/profile',             icon: User,            color: '#475569', bg: '#f8fafc', desc: 'View bank and business details' },
  { name: 'Notifications',      path: '/dealer/notifications',       icon: Bell,            color: '#dc2626', bg: '#fef2f2', desc: 'View system alerts' }
];

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

export default function DealerDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-fade-in">
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
            <AppTile key={m.name} module={m} navigate={navigate} />
          ))}
        </div>
      </div>
    </div>
  );
}
