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
  Package,
  Store,
  Receipt,
  Gift,
  Building2
} from 'lucide-react';
import axios from 'axios';

// ─── Menu Items Configuration ────────────────────────────────────────────────
const getOverviewMenuItems = (unreadNotifications) => [
  { name: 'Dashboard',             path: '/admin/dashboard',           icon: LayoutDashboard, allowedStaffRoles: ['ADMIN', 'ECOM_MANAGER', 'B2B_MANAGER', 'SUPPORT_AGENT', 'FINANCE_OFFICER', 'VIEWER'] },
  {
    name: 'Notifications',
    path: '/admin/notifications',
    icon: Bell,
    badge: unreadNotifications,
    allowedStaffRoles: ['ADMIN', 'ECOM_MANAGER', 'B2B_MANAGER', 'SUPPORT_AGENT', 'FINANCE_OFFICER', 'VIEWER']
  },
];

const getRndMenuItems = () => [
  { name: 'R&D',                   path: '/admin/rnd',                 icon: Microscope, allowedStaffRoles: ['ADMIN', 'B2B_MANAGER'] },
];

const getInventoryMenuItems = () => [
  {
    name: 'Products',
    icon: ShoppingBag,
    allowedStaffRoles: ['ADMIN', 'B2B_MANAGER'],
    subItems: [
      { name: 'All Products', path: '/admin/products',   icon: ShoppingBag },
      { name: 'Categories',   path: '/admin/categories', icon: Tag }
    ]
  },
  { name: 'Channel Integration',   path: '/admin/channel-integration', icon: Cable, allowedStaffRoles: ['ADMIN', 'B2B_MANAGER'] },
];

const getStockMenuItems = () => [
  { name: 'Warehouse Stock',       path: '/admin/inventory',           icon: Warehouse, allowedStaffRoles: ['ADMIN', 'B2B_MANAGER'] },
  { name: 'Multi-Inventories',     path: '/admin/inventories',         icon: Boxes, allowedStaffRoles: ['ADMIN', 'B2B_MANAGER'] },
  { name: 'Stock Transfers',       path: '/admin/transfers',           icon: Truck, allowedStaffRoles: ['ADMIN', 'B2B_MANAGER'] },
];

const getVendorMenuItems = () => [
  { name: 'Vendors',               path: '/admin/vendors',             icon: Building2, allowedStaffRoles: ['ADMIN', 'B2B_MANAGER', 'FINANCE_OFFICER'] },
  { name: 'Procurement & POs',     path: '/admin/procurement',         icon: Package, allowedStaffRoles: ['ADMIN', 'B2B_MANAGER', 'FINANCE_OFFICER'] },
  { name: 'Supply Categories',     path: '/admin/vendor-categories',   icon: Tag, allowedStaffRoles: ['ADMIN', 'B2B_MANAGER', 'FINANCE_OFFICER'] },
  { name: 'Price Movement / Analysis', path: '/admin/vendor-price-analysis', icon: TrendingUp, allowedStaffRoles: ['ADMIN', 'B2B_MANAGER', 'FINANCE_OFFICER'] },
];

const getSalesMarketingMenuItems = (licensing) => {
  const fieldSubItems = [
    { name: 'B2C Stalls',   path: '/admin/stalls',       icon: Store,       allowedStaffRoles: ['ADMIN', 'B2B_MANAGER'] },
    { name: 'Store Visits', path: '/admin/store-visits',  icon: Truck,       allowedStaffRoles: ['ADMIN', 'B2B_MANAGER'] },
    { name: 'B2C Stores',   path: '/admin/b2c-stores',    icon: ShoppingBag, allowedStaffRoles: ['ADMIN', 'B2B_MANAGER'] },
  ].filter(item => {
    if (item.path === '/admin/stalls' && !licensing.enableB2cStall) return false;
    if (item.path === '/admin/store-visits' && !licensing.enableFieldSales) return false;
    return true;
  });

  return [
    {
      name: 'B2B Sales',
      icon: Users,
      allowedStaffRoles: ['ADMIN', 'B2B_MANAGER'],
      subItems: [
        { name: 'Dealers',        path: '/admin/dealers',   icon: Users },
        { name: 'Order Requests', path: '/admin/requests',  icon: FileText }
      ]
    },
    {
      name: 'Field Sales',
      icon: Store,
      allowedStaffRoles: ['ADMIN', 'B2B_MANAGER'],
      subItems: fieldSubItems
    },
    {
      name: 'E-Commerce Store',
      icon: ShoppingCart,
      allowedStaffRoles: ['ADMIN', 'ECOM_MANAGER'],
      subItems: [
        { name: 'E-Com Products',  path: '/admin/ecom/products',  icon: Package },
        { name: 'Website Orders',  path: '/admin/ecom/orders',    icon: ShoppingCart },
        { name: 'Customers',       path: '/admin/ecom/customers', icon: Users },
        { name: 'Product Combos',  path: '/admin/ecom/combos',    icon: PackageSearch },
        { name: 'Banners & Hero',  path: '/admin/ecom/banners',   icon: Image },
        { name: 'Product Reviews', path: '/admin/ecom/reviews',   icon: MessageSquare },
        { name: 'Website Content', path: '/admin/ecom/content',   icon: FileText }
      ]
    }
  ];
};

const getFinanceMenuItems = () => [
  { name: 'Invoice Ledger',        path: '/admin/invoice-ledger',      icon: FileText, allowedStaffRoles: ['ADMIN', 'FINANCE_OFFICER', 'B2B_MANAGER'] },
  { name: 'Expenses Log',          path: '/admin/expenses',            icon: Receipt, allowedStaffRoles: ['ADMIN', 'FINANCE_OFFICER', 'B2B_MANAGER'] },
  { name: 'Offer Expenses',        path: '/admin/offers',              icon: Gift, allowedStaffRoles: ['ADMIN', 'FINANCE_OFFICER', 'B2B_MANAGER'] },
];

const getSupportMenuItems = () => [
  { name: 'Tickets / Support',     path: '/admin/services',            icon: HelpCircle, allowedStaffRoles: ['ADMIN', 'SUPPORT_AGENT'] },
  { name: 'Returns Log',           path: '/admin/returns',             icon: RotateCcw, allowedStaffRoles: ['ADMIN', 'SUPPORT_AGENT', 'B2B_MANAGER'] },
];

const getAnalyticsMenuItems = () => [
  { name: 'Reports',               path: '/admin/reports',             icon: BarChart3, allowedStaffRoles: ['ADMIN', 'FINANCE_OFFICER'] },
  { name: 'Forecasting',           path: '/admin/forecasting',         icon: TrendingUp, allowedStaffRoles: ['ADMIN', 'FINANCE_OFFICER'] },
  { name: 'Analytics',             path: '/admin/analytics',           icon: BarChart3, allowedStaffRoles: ['ADMIN', 'FINANCE_OFFICER'] },
  { name: 'Ecom Reports',          path: '/admin/ecom/reports',        icon: BarChart3, allowedStaffRoles: ['ADMIN', 'ECOM_MANAGER'] },
  { name: 'Ecom Analytics',        path: '/admin/ecom/analytics',      icon: TrendingUp, allowedStaffRoles: ['ADMIN', 'ECOM_MANAGER'] },
];

const getSystemMenuItems = () => [
  { name: 'Privilege Management',  path: '/admin/users',               icon: Settings, allowedStaffRoles: ['ADMIN'] },
  { name: 'Store Settings',        path: '/admin/ecom/settings',       icon: Settings, allowedStaffRoles: ['ADMIN', 'ECOM_MANAGER'] },
];

const getAllMenuItems = (unreadNotifications, licensing = { enableB2cStall: true, enableFieldSales: true }) => [
  ...getOverviewMenuItems(unreadNotifications),
  ...getRndMenuItems(),
  ...getInventoryMenuItems(),
  ...getVendorMenuItems(),
  ...getStockMenuItems(),
  ...getSalesMarketingMenuItems(licensing),
  ...getFinanceMenuItems(),
  ...getSupportMenuItems(),
  ...getAnalyticsMenuItems(),
  ...getSystemMenuItems(),
];

// Backward compatibility alias
const getCrmMenuItems = (unreadNotifications) => getAllMenuItems(unreadNotifications);

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
          ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-100/50 font-bold'
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
          ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50 font-bold'
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
  const isAnySubActive = item.subItems?.some(sub => location.pathname === sub.path);
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
          {item.subItems?.map((sub) => {
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
    rose:  'text-rose-500  border-rose-100',
  };
  return (
    <div className={`flex items-center gap-2 px-3 pt-3 pb-1`}>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${colorMap[color].split(' ')[0]}`}>
        {label}
      </span>
      <div className={`flex-1 border-t ${colorMap[color].split(' ')[1]}`} />
    </div>
  );
}

function SidebarNav({ submenusOpen, toggleSubmenu, onLinkClick, unreadNotifications, staffRole, licensing = { enableB2cStall: true, enableFieldSales: true } }) {
  const overviewItems = getOverviewMenuItems(unreadNotifications);
  const rndItems = getRndMenuItems();
  const inventoryItems = getInventoryMenuItems();
  const stockItems = getStockMenuItems();
  const vendorItems = getVendorMenuItems();
  const salesMarketingItems = getSalesMarketingMenuItems(licensing);
  const financeItems = getFinanceMenuItems();
  const supportItems = getSupportMenuItems();
  const analyticsItems = getAnalyticsMenuItems();
  const systemItems = getSystemMenuItems();

  const renderNavSection = (label, items, color = 'slate') => {
    if (!items || items.length === 0) return null;
    return (
      <div key={label} className="space-y-0.5">
        <SectionLabel label={label} color={color} />
        {items.map((item) =>
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
      </div>
    );
  };

  return (
    <nav className="flex-1 px-4 py-3 space-y-2 overflow-y-auto">
      {renderNavSection('Overview', overviewItems, 'slate')}
      {renderNavSection('R&D Department', rndItems, 'rose')}
      {renderNavSection('Inventory & Products', inventoryItems, 'slate')}
      {renderNavSection('Vendor & Procurement', vendorItems, 'slate')}
      {renderNavSection('Stock Management', stockItems, 'slate')}
      {renderNavSection('Sales & Marketing', salesMarketingItems, 'rose')}
      {renderNavSection('Finance & Accounting', financeItems, 'slate')}
      {renderNavSection('Customer Support', supportItems, 'slate')}
      {renderNavSection('Analytics & Reports', analyticsItems, 'blue')}
      {renderNavSection('System & Settings', systemItems, 'slate')}
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
  const [licensing, setLicensing] = useState({ enableB2cStall: true, enableFieldSales: true });
  const isDashboard = location.pathname === '/admin/dashboard' || location.pathname === '/admin';

  const [submenusOpen, setSubmenusOpen] = useState(() => {
    const allItems = getAllMenuItems(0, { enableB2cStall: true, enableFieldSales: true });
    const initial = {};
    allItems.forEach(item => {
      if (item.subItems && item.subItems.some(sub => sub.path === location.pathname)) {
        initial[item.name] = true;
      }
    });
    return initial;
  });

  const toggleSubmenu = (name) => {
    setSubmenusOpen(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const getActivePageName = () => {
    const allItems = getAllMenuItems(0, licensing);
    for (const item of allItems) {
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
    fetchLicensingSettings();

    const handleStorageChange = () => {
      fetchLicensingSettings();
    };
    window.addEventListener('storage', handleStorageChange);

    const interval = setInterval(fetchNotificationsCount, 30000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const fetchLicensingSettings = async () => {
    try {
      const res = await axios.get('/ecom/settings');
      if (res.data.success && res.data.settings) {
        setLicensing({
          enableB2cStall: res.data.settings.enableB2cStall !== false,
          enableFieldSales: res.data.settings.enableFieldSales !== false
        });
      }
    } catch {
      // silent fail
    }
  };

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
      {/* Sidebar Nav (Only shown when not on Dashboard) */}
      {!isDashboard && (
        <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-slate-200 shrink-0 h-screen sticky top-0 overflow-hidden">
          {/* Logo / Header area for Sidebar */}
          <div className="h-16 border-b border-slate-200 flex items-center px-6 shrink-0">
            <Link to="/admin/dashboard" className="flex items-center space-x-2.5">
              <img src="/logo.png" alt="Mansara Foods" className="h-9 w-auto object-contain" />
              <span className="font-black text-slate-800 text-sm tracking-wide uppercase">Mansara CRM</span>
            </Link>
          </div>
          {/* Nav Items */}
          <SidebarNav
            submenusOpen={submenusOpen}
            toggleSubmenu={toggleSubmenu}
            unreadNotifications={unreadNotifications}
            staffRole={user?.staffRole || 'ADMIN'}
            licensing={licensing}
          />
        </aside>
      )}

      {/* Mobile Drawer (Only shown when not on Dashboard and mobileMenuOpen is true) */}
      {!isDashboard && mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Sidebar content */}
          <div className="relative w-64 bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-in-left border-r border-slate-200">
            <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
              <span className="font-black text-slate-800 text-sm tracking-wide uppercase">Menu</span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close Navigation Menu"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarNav
              submenusOpen={submenusOpen}
              toggleSubmenu={toggleSubmenu}
              onLinkClick={() => setMobileMenuOpen(false)}
              unreadNotifications={unreadNotifications}
              staffRole={user?.staffRole || 'ADMIN'}
              licensing={licensing}
            />
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center space-x-4">
            {isDashboard ? (
              <div className="flex items-center space-x-2.5">
                <img src="/logo.png" alt="Mansara Foods" className="h-10 w-auto object-contain" />
                <span className="font-bold text-slate-800 text-base tracking-wide uppercase">Mansara CRM</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open Navigation Menu"
                  className="lg:hidden p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center border border-slate-100/50"
                  title="Open Navigation Menu"
                >
                  <Menu className="w-4.5 h-4.5" />
                </button>
                <Link
                  to="/admin/dashboard"
                  aria-label="Return to Admin Dashboard"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center border border-slate-100/50"
                  title="Return to Dashboard"
                >
                  <LayoutDashboard className="w-4.5 h-4.5" />
                </Link>
                <h1 className="text-base font-bold text-slate-800 md:text-lg tracking-tight">
                  {getActivePageName()}
                </h1>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Link
              to="/admin/notifications"
              aria-label="View Notifications"
              className="relative p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center border border-slate-100/50"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadNotifications}
                </span>
              )}
            </Link>

            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">{user?.name || 'Administrator'}</p>
              <span className="text-[9px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold uppercase text-rose-700">
                {user?.staffRole || user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Sign out of account"
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
