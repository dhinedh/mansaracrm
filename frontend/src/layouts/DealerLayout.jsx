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
    { name: 'Dashboard', path: '/dealer/dashboard', icon: LayoutDashboard },
    { name: 'Ledger', path: '/dealer/ledgers', icon: Wallet },
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

  const isDashboard = location.pathname === '/dealer/dashboard' || location.pathname === '/dealer';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10">
          <div className="flex items-center space-x-4">
            {isDashboard ? (
              <div className="flex items-center space-x-2.5">
                <img src="/logo.png" alt="Mansara Foods" className="h-10 w-auto object-contain" />
                <span className="font-bold text-slate-800 text-base tracking-wide uppercase">Mansara Partner</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/dealer/dashboard"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-55 hover:bg-slate-50 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-center border border-slate-100/50"
                  title="Return to Dashboard"
                >
                  <LayoutDashboard className="w-4.5 h-4.5" />
                </Link>
                <h1 className="text-base font-bold text-slate-800 md:text-lg tracking-tight">
                  {menuItems.find(item => item.path === location.pathname)?.name || 'Dealer Portal'}
                </h1>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
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
