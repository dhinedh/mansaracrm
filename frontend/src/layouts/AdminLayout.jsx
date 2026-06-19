// src/layouts/AdminLayout.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Warehouse,
  BarChart3,
  Bell,
  LogOut,
  Menu,
  X,
  User,
  Truck,
  FileText,
  RotateCcw,
  TrendingUp,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Cable,
  Microscope,
  Tag,
  Globe,
  ShoppingCart,
  Image,
  MessageSquare,
  Settings,
  PackageSearch,
  Boxes,
  Package
} from 'lucide-react';
import axios from 'axios';

// ─── Menu Sections Config ────────────────────────────────────────────────────
const getCrmMenuItems = (unreadNotifications) => [
  { name: 'Dashboard',             path: '/admin/dashboard',           icon: LayoutDashboard, allowedStaffRoles: ['ADMIN', 'ECOM_MANAGER', 'B2B_MANAGER', 'SUPPORT_AGENT', 'FINANCE_OFFICER', 'VIEWER'] },
  { name: 'Dealers',               path: '/admin/dealers',             icon: Users, allowedStaffRoles: ['ADMIN', 'B2B_MANAGER'] },
  {
    name: 'Products',
    icon: ShoppingBag,
    allowedStaffRoles: ['ADMIN', 'B2B_MANAGER'],
    subItems: [
      { name: 'All Products', path: '/admin/products',   icon: ShoppingBag },
      { name: 'Categories',   path: '/admin/categories', icon: Tag }
    ]
  },
  { name: 'Stock',                 path: '/admin/inventory',           icon: Warehouse, allowedStaffRoles: ['ADMIN', 'B2B_MANAGER'] },
  { name: 'Inventories',           path: '/admin/inventories',         icon: Boxes, allowedStaffRoles: ['ADMIN', 'B2B_MANAGER'] },
  { name: 'Channel Integration',   path: '/admin/channel-integration', icon: Cable, allowedStaffRoles: ['ADMIN', 'B2B_MANAGER'] },
  { name: 'R&D',                   path: '/admin/rnd',                 icon: Microscope, allowedStaffRoles: ['ADMIN', 'B2B_MANAGER'] },
  { name: 'Transfers',             path: '/admin/transfers',           icon: Truck, allowedStaffRoles: ['ADMIN', 'B2B_MANAGER'] },
  { name: 'Order Requests',        path: '/admin/requests',            icon: FileText, allowedStaffRoles: ['ADMIN', 'B2B_MANAGER'] },
  { name: 'Invoice Ledger',        path: '/admin/invoice-ledger',      icon: FileText, allowedStaffRoles: ['ADMIN', 'FINANCE_OFFICER', 'B2B_MANAGER'] },
  { name: 'Returns Log',           path: '/admin/returns',             icon: RotateCcw, allowedStaffRoles: ['ADMIN', 'SUPPORT_AGENT', 'B2B_MANAGER'] },
  { name: 'Tickets / Support',     path: '/admin/services',            icon: HelpCircle, allowedStaffRoles: ['ADMIN', 'SUPPORT_AGENT'] },
  { name: 'Reports',               path: '/admin/reports',             icon: BarChart3, allowedStaffRoles: ['ADMIN', 'FINANCE_OFFICER'] },
  { name: 'Forecasting',           path: '/admin/forecasting',         icon: TrendingUp, allowedStaffRoles: ['ADMIN', 'FINANCE_OFFICER'] },
  { name: 'Analytics',             path: '/admin/analytics',           icon: BarChart3, allowedStaffRoles: ['ADMIN', 'FINANCE_OFFICER'] },
  { name: 'Privilege Management',  path: '/admin/users',               icon: Settings, allowedStaffRoles: ['ADMIN'] },
  {
    name: 'Notifications',
    path: '/admin/notifications',
    icon: Bell,
    badge: unreadNotifications,
    allowedStaffRoles: ['ADMIN', 'ECOM_MANAGER', 'B2B_MANAGER', 'SUPPORT_AGENT', 'FINANCE_OFFICER', 'VIEWER']
  },
];

const ecomMenuItems = [
  { name: 'E-Com Products',  path: '/admin/ecom/products',  icon: Package, allowedStaffRoles: ['ADMIN', 'ECOM_MANAGER'] },
  { name: 'Website Orders',  path: '/admin/ecom/orders',    icon: ShoppingCart, allowedStaffRoles: ['ADMIN', 'ECOM_MANAGER'] },
  { name: 'Customers',       path: '/admin/ecom/customers', icon: Users, allowedStaffRoles: ['ADMIN', 'ECOM_MANAGER'] },
  { name: 'Product Combos',  path: '/admin/ecom/combos',    icon: PackageSearch, allowedStaffRoles: ['ADMIN', 'ECOM_MANAGER'] },
  { name: 'Banners & Hero',  path: '/admin/ecom/banners',   icon: Image, allowedStaffRoles: ['ADMIN', 'ECOM_MANAGER'] },
  { name: 'Product Reviews', path: '/admin/ecom/reviews',   icon: MessageSquare, allowedStaffRoles: ['ADMIN', 'ECOM_MANAGER'] },
  { name: 'Website Content', path: '/admin/ecom/content',   icon: FileText, allowedStaffRoles: ['ADMIN', 'ECOM_MANAGER'] },
  { name: 'Store Settings',  path: '/admin/ecom/settings',  icon: Settings, allowedStaffRoles: ['ADMIN', 'ECOM_MANAGER'] },
  { name: 'Ecom Reports',    path: '/admin/ecom/reports',   icon: BarChart3, allowedStaffRoles: ['ADMIN', 'ECOM_MANAGER'] },
  { name: 'Ecom Analytics',  path: '/admin/ecom/analytics', icon: TrendingUp, allowedStaffRoles: ['ADMIN', 'ECOM_MANAGER'] },
];

// ─── Reusable Nav Item Components ────────────────────────────────────────────

function NavLink({ item, onLinkClick }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onLinkClick}
      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
        isActive
          ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-100/50'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-rose-600' : 'text-slate-400'}`} />
        <span>{item.name}</span>
      </div>
      {item.badge > 0 && (
        <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function NavLinkEcom({ item, onLinkClick }) {
  const location = useLocation();
  const isActive = location.pathname === item.path;
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onLinkClick}
      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
        isActive
          ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50'
          : 'text-slate-600 hover:bg-blue-50/40 hover:text-blue-800'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
        <span>{item.name}</span>
      </div>
    </Link>
  );
}

function NavGroup({ item, submenusOpen, toggleSubmenu, onLinkClick }) {
  const location = useLocation();
  const isOpen = !!submenusOpen[item.name];
  const isAnySubActive = item.subItems.some(sub => location.pathname === sub.path);
  const ParentIcon = item.icon;
  return (
    <div className="space-y-1">
      <button
        onClick={() => toggleSubmenu(item.name)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
          isAnySubActive
            ? 'bg-rose-50/70 text-rose-800 font-bold border border-rose-100/30 shadow-sm'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center space-x-3">
          <ParentIcon className={`w-4 h-4 flex-shrink-0 ${isAnySubActive ? 'text-rose-600' : 'text-slate-400'}`} />
          <span>{item.name}</span>
        </div>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {isOpen && (
        <div className="pl-6 space-y-1 transition-all">
          {item.subItems.map((sub) => {
            const SubIcon = sub.icon;
            const isSubActive = location.pathname === sub.path;
            return (
              <Link
                key={sub.name}
                to={sub.path}
                onClick={onLinkClick}
                className={`flex items-center space-x-3 px-3.5 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${
                  isSubActive
                    ? 'bg-rose-50/50 text-rose-700 font-bold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <SubIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isSubActive ? 'text-rose-600' : 'text-slate-400'}`} />
                <span>{sub.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ label, color = 'slate' }) {
  const colorMap = {
    slate: 'text-slate-400 border-slate-200',
    blue:  'text-blue-400  border-blue-100',
  };
  return (
    <div className={`flex items-center gap-2 px-3 pt-2 pb-1`}>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${colorMap[color].split(' ')[0]}`}>
        {label}
      </span>
      <div className={`flex-1 border-t ${colorMap[color].split(' ')[1]}`} />
    </div>
  );
}

// ─── Full Sidebar Nav ─────────────────────────────────────────────────────────
function SidebarNav({ submenusOpen, toggleSubmenu, onLinkClick, unreadNotifications, staffRole }) {
  const crmItems = getCrmMenuItems(unreadNotifications);
  
  // Filter items based on staffRole
  const filteredCrmItems = crmItems.filter(item => {
    // If user's staffRole is ADMIN (super admin), allow all
    if (staffRole === 'ADMIN') return true;
    if (item.allowedStaffRoles && !item.allowedStaffRoles.includes(staffRole)) {
      return false;
    }
    return true;
  });

  const filteredEcomItems = ecomMenuItems.filter(item => {
    if (staffRole === 'ADMIN') return true;
    if (item.allowedStaffRoles && !item.allowedStaffRoles.includes(staffRole)) {
      return false;
    }
    return true;
  });

  return (
    <nav className="flex-1 px-4 py-4 space-y-0.5 overflow-y-auto">
      {/* ── CRM Section ── */}
      {filteredCrmItems.length > 0 && (
        <>
          <SectionLabel label="CRM Management" color="slate" />
          {filteredCrmItems.map((item) =>
            item.subItems ? (
              <NavGroup
                key={item.name}
                item={item}
                submenusOpen={submenusOpen}
                toggleSubmenu={toggleSubmenu}
                onLinkClick={onLinkClick}
              />
            ) : (
              <NavLink key={item.name} item={item} onLinkClick={onLinkClick} />
            )
          )}
        </>
      )}

      {/* ── E-Commerce Section ── */}
      {filteredEcomItems.length > 0 && (
        <>
          <div className="pt-3" />
          <SectionLabel label="E-Commerce" color="blue" />
          {filteredEcomItems.map((item) => (
            <NavLinkEcom key={item.name} item={item} onLinkClick={onLinkClick} />
          ))}
        </>
      )}
    </nav>
  );
}

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function AdminLayout() {
  const { user, logout, fetchCurrentUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [submenusOpen, setSubmenusOpen] = useState({
    Products:
      location.pathname === '/admin/products' ||
      location.pathname === '/admin/categories',
  });

  const toggleSubmenu = (name) => {
    setSubmenusOpen(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const getActivePageName = () => {
    const crmItems = getCrmMenuItems(0);
    for (const item of [...crmItems, ...ecomMenuItems]) {
      if (item.path === location.pathname) return item.name;
      if (item.subItems) {
        const sub = item.subItems.find(s => s.path === location.pathname);
        if (sub) return sub.name;
      }
    }
    return 'Admin Panel';
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchNotificationsCount();
    const interval = setInterval(fetchNotificationsCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotificationsCount = async () => {
    try {
      const res = await axios.get('/notifications');
      const unread = res.data.data.filter(n => !n.isRead).length;
      setUnreadNotifications(unread);
    } catch {
      // silent fail
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 bg-white">
          <div className="flex items-center space-x-2.5">
            <img src="/logo.png" alt="Mansara Foods" className="h-10 w-auto object-contain" />
            <span className="font-bold text-slate-800 text-base tracking-wide uppercase">Mansara CRM</span>
          </div>
        </div>

        {/* Nav */}
        <SidebarNav
          submenusOpen={submenusOpen}
          toggleSubmenu={toggleSubmenu}
          onLinkClick={undefined}
          unreadNotifications={unreadNotifications}
          staffRole={user?.staffRole}
        />

        {/* User Card */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center space-x-3 p-2 rounded-xl bg-slate-50 border border-slate-100 mb-2">
            <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Administrator'}</p>
              <p className="text-[9px] text-rose-600 font-bold tracking-wider uppercase truncate">
                {user?.staffRole || user?.role}
              </p>
              <p className="text-[9px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2.5 w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50/50 rounded-lg transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-50 focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-base font-bold text-slate-800 md:text-lg tracking-tight">
              {getActivePageName()}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">
                {user?.staffRole || user?.role}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="w-72 bg-white flex flex-col h-full shadow-2xl relative">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <img src="/logo.png" alt="Mansara Foods" className="h-10 w-auto object-contain" />
                <span className="font-bold text-slate-800 text-base uppercase">Mansara CRM</span>
              </div>
            </div>

            <SidebarNav
              submenusOpen={submenusOpen}
              toggleSubmenu={toggleSubmenu}
              onLinkClick={() => setMobileMenuOpen(false)}
              unreadNotifications={unreadNotifications}
              staffRole={user?.staffRole}
            />

            <div className="p-6 border-t border-slate-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                  <p className="text-[10px] text-rose-600 font-bold tracking-wider uppercase">
                    {user?.staffRole || user?.role}
                  </p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2.5 w-full px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
