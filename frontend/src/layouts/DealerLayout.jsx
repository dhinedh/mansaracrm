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
  HelpCircle
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
    { name: 'Dashboard', path: '/dealer/dashboard', icon: LayoutDashboard },
    { name: 'Ledger', path: '/dealer/ledgers', icon: Receipt },
    { name: 'Order Requests', path: '/dealer/requests', icon: FileText },
    { name: 'Returns Log', path: '/dealer/returns', icon: RotateCcw },
    { name: 'Complaints tickets', path: '/dealer/services', icon: HelpCircle },
    { name: 'My Shops', path: '/dealer/stores', icon: Store },
    { name: 'Browse Products', path: '/dealer/products', icon: ShoppingBag },
    { name: 'Cart / Bill Builder', path: '/dealer/cart', icon: ShoppingCart, badge: items.length },
    { name: 'My Analytics', path: '/dealer/analytics', icon: BarChart3 },
    { name: 'Billing Profile', path: '/dealer/profile', icon: User },
    { name: 'Notifications', path: '/dealer/notifications', icon: Bell, badge: unreadNotifications },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
        {/* Brand header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 bg-white">
          <div className="flex items-center space-x-2.5">
            <img src="/logo.png" alt="Mansara Foods" className="h-10 w-auto object-contain" />
            <span className="font-bold text-slate-800 text-base tracking-wide uppercase">Mansara Partner</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Dealer Workspace
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-100/50'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-rose-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge > 0 && (
                  <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center space-x-3 p-2 rounded-xl bg-slate-50 border border-slate-100 mb-2">
            <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Loading Partner...'}</p>
              <p className="text-[10px] text-slate-500 truncate">{user?.dealer?.companyName || 'Mansara Foods'}</p>
              {user?.dealer?.initialDeposit !== undefined && user?.dealer?.initialDeposit !== null && (
                <p className="text-[9px] text-rose-600 font-black mt-0.5">
                  Deposit: ₹{Number(user.dealer.initialDeposit).toLocaleString('en-IN')}
                </p>
              )}
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-50 focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-base font-bold text-slate-800 md:text-lg tracking-tight">
              {menuItems.find(item => item.path === location.pathname)?.name || 'Dealer Portal'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-xs bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase">
              {user?.dealer?.approvalStatus || 'PENDING'}
            </span>
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

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/40 backdrop-blur-sm transition-opacity">
          <div className="w-72 bg-white flex flex-col h-full shadow-2xl relative animate-slide-in">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-600 hover:bg-slate-50"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <img src="/logo.png" alt="Mansara Foods" className="h-10 w-auto object-contain" />
                <span className="font-bold text-slate-800 text-base uppercase">Mansara Partner</span>
              </div>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-rose-50 text-rose-700 border border-rose-100/50'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-rose-600' : 'text-slate-400'}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge > 0 && (
                      <span className="bg-rose-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-6 border-t border-slate-100">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.dealer?.companyName}</p>
                  {user?.dealer?.initialDeposit !== undefined && user?.dealer?.initialDeposit !== null && (
                    <p className="text-[10px] text-rose-600 font-black mt-0.5">
                      Deposit: ₹{Number(user.dealer.initialDeposit).toLocaleString('en-IN')}
                    </p>
                  )}
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
