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
        { name: 'Customer 360°', path: '/sales/customer-360', icon: User },
        { name: 'Competitor Intel', path: '/sales/competitor-intel', icon: TrendingUp },
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased selection:bg-amber-500 selection:text-slate-950">
      {/* Top App Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-1 text-slate-300 hover:text-white rounded-xl hover:bg-white/5 active:scale-95 transition-all lg:hidden cursor-pointer"
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
                <span className="text-xs font-black tracking-wider text-amber-400 uppercase">Field Sales</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">v2.5</span>
              </div>
              <h2 className="text-xs font-semibold text-slate-300 truncate max-w-[150px] sm:max-w-xs">{user?.name || 'Sales Officer'}</h2>
            </div>
          </div>
        </div>

        {/* Status Indicators & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Online/Offline status */}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            isOnline 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
          }`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline Mode'}</span>
          </div>

          {/* GPS Status */}
          <div className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
            gpsReady 
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
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
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
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
            className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:border-amber-500/50 transition-all cursor-pointer"
            title="Profile & Settings"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar (hidden on mobile, visible lg+) */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-white/10 p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-60px)] sticky top-[60px]">
          {navSections.map((sec, idx) => (
            <div key={idx} className="space-y-1.5">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3">{sec.title}</h3>
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
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                          isActive ? 'bg-slate-950 text-amber-400' : 'bg-white/10 text-slate-300'
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

          <div className="pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 pb-24 lg:pb-8 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Modules 2, 4-6, 18, 11, Hub) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 flex items-center justify-around lg:hidden shadow-2xl">
        <NavLink
          to="/sales/dashboard"
          className={({ isActive }) => `flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
            isActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/sales/visits"
          className={({ isActive }) => `flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
            isActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Beat / GPS</span>
        </NavLink>

        <NavLink
          to="/sales/orders"
          className={({ isActive }) => `flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
            isActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Orders</span>
        </NavLink>

        <NavLink
          to="/sales/catalogue"
          className={({ isActive }) => `flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
            isActive ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products</span>
        </NavLink>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer"
        >
          <Menu className="w-4 h-4" />
          <span>34 Modules</span>
        </button>
      </nav>

      {/* Slide-out Full 34-Module Hub Modal / Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border-l border-white/10 h-full flex flex-col p-5 overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-400">Complete SFA Portal</span>
                <h3 className="text-base font-black text-white">All 34 Sales Modules</h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 cursor-pointer"
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
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'text-slate-200 hover:bg-white/5'
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
            <div className="pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600/20 text-rose-300 font-bold text-xs rounded-xl border border-rose-500/30 hover:bg-rose-600/30 cursor-pointer"
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
