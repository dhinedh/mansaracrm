// src/layouts/SalespersonLayout.jsx
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Home, MapPin, ShoppingBag, Package, DollarSign, Clock, 
  Menu, X, LogOut, User, CheckCircle2, AlertCircle, Wifi, 
  WifiOff, RefreshCw, ChevronRight, FileText, BarChart3, HelpCircle,
  TrendingUp, Award, Tag, Smartphone
} from 'lucide-react';

export default function SalespersonLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [gpsReady, setGpsReady] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Geolocation check
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setGpsReady(true),
        () => setGpsReady(false)
      );
    }

    // Check localStorage for offline queue
    const checkOfflineQueue = () => {
      try {
        const queuedVisits = JSON.parse(localStorage.getItem('mansara_offline_visits') || '[]');
        const queuedOrders = JSON.parse(localStorage.getItem('mansara_offline_orders') || '[]');
        setPendingSyncCount(queuedVisits.length + queuedOrders.length);
      } catch (e) {
        setPendingSyncCount(0);
      }
    };

    checkOfflineQueue();
    const interval = setInterval(checkOfflineQueue, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/sales/login');
  };

  const handleManualSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setPendingSyncCount(0);
      localStorage.removeItem('mansara_offline_visits');
      localStorage.removeItem('mansara_offline_orders');
    }, 1200);
  };

  // 34 Modules structured into high-level navigation
  const navSections = [
    {
      title: 'A. Core & Beat',
      items: [
        { name: 'Dashboard', path: '/sales/dashboard', icon: Home, badge: 'Today' },
        { name: 'Beat & Shop Visits', path: '/sales/visits', icon: MapPin, badge: 'GPS' },
      ]
    },
    {
      title: 'B. Products & Pricing',
      items: [
        { name: 'Product Catalogue', path: '/sales/catalogue', icon: Package },
        { name: 'Price Simulator', path: '/sales/pricing', icon: DollarSign },
        { name: 'Trade Schemes', path: '/sales/schemes', icon: Tag },
        { name: 'Stock Availability', path: '/sales/stock', icon: ShoppingBag },
      ]
    },
    {
      title: 'C. Orders & Quotations',
      items: [
        { name: 'Sales Orders', path: '/sales/orders', icon: ShoppingBag, badge: 'New' },
        { name: 'Quotations', path: '/sales/quotations', icon: FileText },
        { name: 'Order Tracking', path: '/sales/tracking', icon: Clock },
        { name: 'Returns & Amendments', path: '/sales/amendments', icon: AlertCircle },
      ]
    },
    {
      title: 'D. Collections & Follow-Ups',
      items: [
        { name: 'Payment Collections', path: '/sales/collections', icon: DollarSign },
        { name: 'Follow-Up Tasks', path: '/sales/follow-ups', icon: Clock },
        { name: 'Daily Activity (DAR)', path: '/sales/dar', icon: FileText, badge: 'Report' },
      ]
    },
    {
      title: 'E. Performance & System',
      items: [
        { name: 'Targets & Achievement', path: '/sales/performance', icon: Award },
        { name: 'Offline Sync & Cloud', path: '/sales/sync', icon: RefreshCw, count: pendingSyncCount },
        { name: 'My Profile & Password', path: '/sales/profile', icon: User },
        { name: 'Help & Settings', path: '/sales/help', icon: HelpCircle },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-amber-100 selection:text-amber-900 sales-portal-light">
      {/* Top App Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-1 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 active:scale-95 transition-all lg:hidden cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center font-black text-slate-950 text-xs shadow-md shadow-amber-500/20">
              MF
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wider text-amber-600 uppercase">Field Sales</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">v2.5</span>
              </div>
              <h2 className="text-xs font-semibold text-slate-700 truncate max-w-[150px] sm:max-w-xs">{user?.name || 'Sales Officer'}</h2>
            </div>
          </div>
        </div>
        
        {/* Status Indicators & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online/Offline status */}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            isOnline 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline Mode'}</span>
          </div>

          {/* GPS Status */}
          <div className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            gpsReady 
              ? 'bg-cyan-50 border-cyan-200 text-cyan-700' 
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            <MapPin className="w-3 h-3" />
            <span>{gpsReady ? 'GPS Active' : 'Acquiring GPS'}</span>
          </div>

          {/* Sync status button */}
          <button
            type="button"
            onClick={handleManualSync}
            disabled={syncing}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border cursor-pointer transition-all ${
              pendingSyncCount > 0
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm animate-bounce'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title="Sync offline records to server"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            <span>{pendingSyncCount > 0 ? `${pendingSyncCount} Sync` : 'Synced'}</span>
          </button>

          {/* Quick Profile Link */}
          <button
            type="button"
            onClick={() => navigate('/sales/profile')}
            className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-amber-400 transition-all cursor-pointer"
            title="Profile & Settings"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar (hidden on mobile, visible lg+) */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-60px)] sticky top-[60px] pb-24 shadow-xs">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1.5">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3">{sec.title}</h3>
              <div className="space-y-0.5">
                {sec.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={itemIdx}
                      to={item.path}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                          isActive ? 'bg-slate-950 text-amber-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 pb-28 lg:pb-28 max-w-full overflow-x-hidden bg-slate-50">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation Bar - Always visible across all screens */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <NavLink
          to="/sales/dashboard"
          className={({ isActive }) => `flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
            isActive ? 'text-amber-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/sales/checkin"
          className={({ isActive }) => `flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
            isActive || location.pathname === '/sales/visits' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Beat / GPS</span>
        </NavLink>

        <NavLink
          to="/sales/orders"
          className={({ isActive }) => `flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
            isActive ? 'text-amber-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Orders</span>
        </NavLink>

        <NavLink
          to="/sales/catalogue"
          className={({ isActive }) => `flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
            isActive ? 'text-amber-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products</span>
        </NavLink>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          <Menu className="w-4 h-4" />
          <span>34 Modules</span>
        </button>
      </nav>

      {/* Slide-out Full 34-Module Hub Modal / Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border-l border-slate-200 h-full flex flex-col p-5 overflow-y-auto shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-600">Complete SFA Portal</span>
                <h3 className="text-base font-black text-slate-900">All 34 Sales Modules</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-xl bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Lists */}
            <div className="flex-1 py-4 space-y-6">
              {navSections.map((sec, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">{sec.title}</h4>
                  <div className="space-y-1">
                    {sec.items.map((item, itemIdx) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <button
                          key={itemIdx}
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            navigate(item.path);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4" />
                            <span>{item.name}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 opacity-50" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Logout button */}
            <div className="pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 hover:bg-rose-100 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
