// src/layouts/DealerLayout.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { 
  LayoutDashboard, 
  Store, 
  ShoppingBag, 
  Receipt, 
  BarChart3, 
  Bell, 
  LogOut, 
  Menu, 
  X,
  User,
  ShoppingCart,
  Truck,
  FileText,
  RotateCcw,
  HelpCircle,
  Wallet
} from 'lucide-react';
import axios from 'axios';

export default function DealerLayout() {
  const { user, logout, fetchCurrentUser } = useAuthStore();
  const { items } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    fetchCurrentUser();
    fetchNotificationsCount();
    
    // Poll notifications every 30s
    const interval = setInterval(fetchNotificationsCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotificationsCount = async () => {
    try {
      const res = await axios.get('/notifications');
      const unread = res.data.data.filter(n => !n.isRead).length;
      setUnreadNotifications(unread);
    } catch (err) {
      // Slient fail
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { 
      name: 'Dashboard', 
      path: '/dealer/dashboard', 
      icon: LayoutDashboard,
      children: [
        { name: 'My Shop', path: '/dealer/stores', icon: Store },
        { name: 'Browse Product', path: '/dealer/products', icon: ShoppingBag },
        { name: 'Cart Builder', path: '/dealer/cart', icon: ShoppingCart, badge: items.length },
      ]
    },
    { name: 'Ledger', path: '/dealer/ledgers', icon: Wallet },
    { name: 'Order Request', path: '/dealer/requests', icon: FileText },
    { name: 'Return Log', path: '/dealer/returns', icon: RotateCcw },
    { name: 'Complaint Log', path: '/dealer/services', icon: HelpCircle },
    { name: 'Analytics', path: '/dealer/analytics', icon: BarChart3 },
    { name: 'Billing Profile', path: '/dealer/profile', icon: User },
    { name: 'Notifications', path: '/dealer/notifications', icon: Bell, badge: unreadNotifications },
  ];

  const isDashboard = location.pathname === '/dealer/dashboard' || location.pathname === '/dealer';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Nav (Only shown when not on Dashboard) */}
      {!isDashboard && (
        <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-slate-200 shrink-0 h-screen sticky top-0 overflow-hidden">
          {/* Logo / Header area for Sidebar */}
          <div className="h-16 border-b border-slate-200 flex items-center px-6 shrink-0">
            <Link to="/dealer/dashboard" className="flex items-center space-x-2.5">
              <img src="/logo.png" alt="Mansara Foods" className="h-9 w-auto object-contain" />
              <span className="font-black text-slate-800 text-sm tracking-wide uppercase">Mansara Partner</span>
            </Link>
          </div>
          {/* Nav Items */}
          <nav className="flex-1 px-4 py-4 space-y-0.5 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const hasChildren = item.children && item.children.length > 0;
              return (
                <div key={item.name} className="space-y-1">
                  <Link
                    to={item.path}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-100/50 font-bold'
                        : 'text-slate-650 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-rose-600' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge > 0 && !hasChildren && (
                      <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                  {hasChildren && (
                    <div className="pl-6 border-l border-slate-100 ml-5 space-y-1 mt-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = location.pathname === child.path;
                        return (
                          <Link
                            key={child.name}
                            to={child.path}
                            className={`flex items-center justify-between px-3.5 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${
                              isChildActive
                                ? 'bg-rose-50/50 text-rose-700 font-bold'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              <ChildIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isChildActive ? 'text-rose-600' : 'text-slate-400'}`} />
                              <span>{child.name}</span>
                            </div>
                            {child.badge > 0 && (
                              <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                {child.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
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
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-0.5 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const hasChildren = item.children && item.children.length > 0;
                return (
                  <div key={item.name} className="space-y-1">
                    <Link
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-100/50 font-bold'
                          : 'text-slate-600 hover:bg-slate-55 hover:bg-slate-50 hover:text-slate-905 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-rose-600' : 'text-slate-400'}`} />
                        <span>{item.name}</span>
                      </div>
                      {item.badge > 0 && !hasChildren && (
                        <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                    {hasChildren && (
                      <div className="pl-6 border-l border-slate-100 ml-5 space-y-1 mt-1">
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const isChildActive = location.pathname === child.path;
                          return (
                            <Link
                              key={child.name}
                              to={child.path}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`flex items-center justify-between px-3.5 py-2 rounded-lg font-medium text-xs transition-all duration-200 ${
                                isChildActive
                                  ? 'bg-rose-50/50 text-rose-700 font-bold'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                              }`}
                            >
                              <div className="flex items-center space-x-2.5">
                                <ChildIcon className={`w-3.5 h-3.5 flex-shrink-0 ${isChildActive ? 'text-rose-600' : 'text-slate-400'}`} />
                                <span>{child.name}</span>
                              </div>
                              {child.badge > 0 && (
                                <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                  {child.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shrink-0">
          <div className="flex items-center space-x-4">
            {isDashboard ? (
              <div className="flex items-center space-x-2.5">
                <img src="/logo.png" alt="Mansara Foods" className="h-10 w-auto object-contain" />
                <span className="font-bold text-slate-800 text-base tracking-wide uppercase">Mansara Partner</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="lg:hidden p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center border border-slate-100/50"
                  title="Open Navigation Menu"
                >
                  <Menu className="w-4.5 h-4.5" />
                </button>
                <Link
                  to="/dealer/dashboard"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center border border-slate-100/50"
                  title="Return to Dashboard"
                >
                  <LayoutDashboard className="w-4.5 h-4.5" />
                </Link>
                <h1 className="text-base font-bold text-slate-800 md:text-lg tracking-tight">
                  {(() => {
                    for (const item of menuItems) {
                      if (item.path === location.pathname) return item.name;
                      if (item.children) {
                        const child = item.children.find(c => c.path === location.pathname);
                        if (child) return child.name;
                      }
                    }
                    return 'Dealer Portal';
                  })()}
                </h1>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <Link
              to="/dealer/notifications"
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

            <span className="text-xs bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase">
              {user?.dealer?.approvalStatus || 'PENDING'}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all duration-200 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        {/* Pages Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {user?.dealer?.approvalStatus !== 'APPROVED' ? (
            <div className="max-w-2xl mx-auto mt-12 bg-white border border-rose-100 rounded-2xl p-8 text-center shadow-md">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600">
                <Bell className="w-8 h-8 animate-bounce" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Account Awaiting Approval</h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Your dealer registration for <strong>{user?.dealer?.companyName || 'your company'}</strong> has been recorded and is currently being verified by our administration team.
              </p>
              <div className="inline-flex items-center space-x-2 text-xs bg-slate-50 border border-slate-100 px-4 py-2 rounded-full font-medium text-slate-500">
                <span>Current Status:</span>
                <span className="font-bold text-amber-600">{user?.dealer?.approvalStatus || 'PENDING'}</span>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
