import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { 
  Home, MapPin, ShoppingBag, Package, DollarSign, Clock, 
  Menu, X, LogOut, User, CheckCircle2, AlertCircle, Wifi, 
  WifiOff, RefreshCw, ChevronRight, FileText, BarChart3, HelpCircle,
  TrendingUp, Award, Tag, Smartphone, Receipt, ShieldAlert
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
  const [checkingLogout, setCheckingLogout] = useState(false);
  const [blockedLogoutModalOpen, setBlockedLogoutModalOpen] = useState(false);
  const [activeCheckInVisit, setActiveCheckInVisit] = useState(null);
  const [instantCheckingOut, setInstantCheckingOut] = useState(false);

  const isDashboard = location.pathname === '/sales/dashboard' || location.pathname === '/sales';
  const isBillingActive = location.pathname === '/sales/orders' || location.pathname === '/sales/pricing' || location.pathname === '/sales/quotations' || location.pathname === '/sales/amendments';
  const isProductStockActive = location.pathname === '/sales/catalogue' || location.pathname === '/sales/stock' || location.pathname === '/sales/schemes';
  const isSummaryActive = location.pathname === '/sales/dar' || location.pathname === '/sales/performance' || location.pathname === '/sales/collections' || location.pathname === '/sales/follow-ups';

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

  const handleLogout = async () => {
    setCheckingLogout(true);
    try {
      // 1. When online, ALWAYS verify with server first (source of truth)
      if (navigator.onLine) {
        try {
          const res = await axios.get('/field-sales/visits/active');
          if (res.data?.success) {
            if (!res.data.hasActiveCheckIn) {
              // Server confirms visit is already checked out!
              // Clear stale local cache and log out immediately
              localStorage.removeItem('mansara_active_visit');
              logout();
              navigate('/sales/login');
              return;
            } else if (res.data.data) {
              // Server confirms active check-in in progress
              setActiveCheckInVisit(res.data.data);
              setBlockedLogoutModalOpen(true);
              setMobileMenuOpen(false);
              return;
            }
          }
        } catch (err) {
          console.warn('Could not query active visit from server:', err);
        }
      }

      // 2. Offline fallback: check local storage only if offline or server unreachable
      try {
        const saved = localStorage.getItem('mansara_active_visit');
        if (saved) {
          const parsed = JSON.parse(saved);
          const startedAt = new Date(parsed.startedAt || parsed.visit?.checkInTime || parsed.visit?.createdAt || 0).getTime();
          const hoursOld = (Date.now() - startedAt) / (1000 * 60 * 60);
          if (parsed.visit && !parsed.visit.checkOutTime && hoursOld < 12) {
            setActiveCheckInVisit({
              ...parsed.visit,
              store: parsed.store || { name: 'Active Store Visit' },
              purpose: parsed.purpose || parsed.visit.purpose
            });
            setBlockedLogoutModalOpen(true);
            setMobileMenuOpen(false);
            return;
          } else {
            // Older than 12h or stale
            localStorage.removeItem('mansara_active_visit');
          }
        }
      } catch (e) {
        console.warn('Error checking local active visit:', e);
      }

      // 3. Clear local visit cache and proceed to log out
      localStorage.removeItem('mansara_active_visit');
      logout();
      navigate('/sales/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('mansara_active_visit');
      logout();
      navigate('/sales/login');
    } finally {
      setCheckingLogout(false);
    }
  };

  // Instant Check-Out and Log Out
  const handleInstantCheckOutAndExit = async () => {
    setInstantCheckingOut(true);
    try {
      const visitId = activeCheckInVisit?._id || activeCheckInVisit?.id;
      if (visitId) {
        await axios.post(`/field-sales/visits/${visitId}/check-out`, {
          outcome: 'Store visit checked out upon logout'
        }).catch(async () => {
          await axios.post('/field-sales/visits/active/check-out', {
            outcome: 'Store visit checked out upon logout'
          }).catch(() => {});
        });
      } else {
        await axios.post('/field-sales/visits/active/check-out', {
          outcome: 'Store visit checked out upon logout'
        }).catch(() => {});
      }
    } catch (e) {
      console.warn('Instant check-out error:', e);
    } finally {
      localStorage.removeItem('mansara_active_visit');
      setBlockedLogoutModalOpen(false);
      setInstantCheckingOut(false);
      logout();
      navigate('/sales/login');
    }
  };

  // Force Log Out (clears local cache & tells server to complete active visit)
  const handleForceLogOut = async () => {
    try {
      await axios.post('/field-sales/visits/active/check-out', {
        outcome: 'Completed visit & forced sign-out'
      }).catch(() => {});
    } catch (e) {}
    localStorage.removeItem('mansara_active_visit');
    setBlockedLogoutModalOpen(false);
    logout();
    navigate('/sales/login');
  };

  const handleGoToCheckOut = () => {
    setBlockedLogoutModalOpen(false);
    const storeId = activeCheckInVisit?.storeId || activeCheckInVisit?.store?._id || activeCheckInVisit?.store?.id;
    if (storeId) {
      navigate(`/sales/store-visit/${storeId}`, {
        state: {
          visit: activeCheckInVisit,
          activeVisitId: activeCheckInVisit._id || activeCheckInVisit.id,
          promptCheckOut: true
        }
      });
    } else {
      navigate('/sales/visits', {
        state: {
          activeVisitId: activeCheckInVisit?._id || activeCheckInVisit?.id,
          promptCheckOut: true
        }
      });
    }
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
      {/* Main Container Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar (hidden on mobile, visible lg+) */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 p-4 space-y-6 overflow-y-auto max-h-screen sticky top-0 pb-24 shadow-xs">
          {/* Brand & Rep Identity in Desktop Sidebar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center font-black text-slate-950 text-xs shadow-md shadow-amber-500/20">
                MF
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black tracking-wider text-amber-600 uppercase block">Field Sales</span>
                <h2 className="text-xs font-semibold text-slate-700 truncate max-w-[130px]">{user?.name || 'Sales Officer'}</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/sales/profile')}
              className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-amber-400 transition-all cursor-pointer"
              title="Profile & Settings"
            >
              <User className="w-3.5 h-3.5" />
            </button>
          </div>

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
              disabled={checkingLogout}
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-200 disabled:opacity-50"
            >
              {checkingLogout ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              <span>{checkingLogout ? 'Checking Status...' : 'Log Out'}</span>
            </button>
          </div>
        </aside>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 pb-28 lg:pb-28 max-w-full overflow-x-hidden bg-slate-50">
          <Outlet />
        </main>
      </div>

      {/* Bottom Navigation Bar - Modern styled downbar */}
      <nav 
        aria-label="Sales Navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around"
      >
        {/* 1. Home */}
        <Link
          to="/sales/dashboard"
          onClick={() => setMobileMenuOpen(false)}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 ${
            isDashboard
              ? 'text-amber-600 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${isDashboard ? 'bg-amber-50 text-amber-600' : ''}`}>
            <Home className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight leading-tight mt-0.5 truncate max-w-full">Home</span>
        </Link>

        {/* 2. Invoice Billing (Price Simulator) */}
        <Link
          to="/sales/pricing"
          onClick={() => setMobileMenuOpen(false)}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 ${
            isBillingActive
              ? 'text-amber-600 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${isBillingActive ? 'bg-amber-50 text-amber-600' : ''}`}>
            <Receipt className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight leading-tight mt-0.5 truncate max-w-full">Invoice Billing</span>
        </Link>

        {/* 3. Product & Stock */}
        <Link
          to="/sales/catalogue"
          onClick={() => setMobileMenuOpen(false)}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 ${
            isProductStockActive
              ? 'text-amber-600 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${isProductStockActive ? 'bg-amber-50 text-amber-600' : ''}`}>
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight leading-tight mt-0.5 truncate max-w-full">Product & Stock</span>
        </Link>

        {/* 4. Report */}
        <Link
          to="/sales/dar"
          onClick={() => setMobileMenuOpen(false)}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 ${
            isSummaryActive
              ? 'text-amber-600 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors ${isSummaryActive ? 'bg-amber-50 text-amber-600' : ''}`}>
            <BarChart3 className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight leading-tight mt-0.5 truncate max-w-full">Report</span>
        </Link>

        {/* 5. Menu */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(prev => !prev)}
          className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer relative ${
            mobileMenuOpen
              ? 'text-amber-600 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className={`p-1 rounded-lg transition-colors relative ${mobileMenuOpen ? 'bg-amber-50 text-amber-600' : ''}`}>
            <Menu className="w-5 h-5" />
            {pendingSyncCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-amber-600 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {pendingSyncCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight leading-tight mt-0.5 truncate max-w-full">Menu</span>
        </button>
      </nav>

      {/* Slide-out Full 34-Module Hub Modal / Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border-l border-slate-200 h-full flex flex-col p-5 overflow-y-auto shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center font-black text-slate-950 text-xs shadow-md shadow-amber-500/20">
                  MF
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-amber-600">Field Sales</span>
                  <h3 className="text-sm font-bold text-slate-900">{user?.name || 'Sales Officer'}</h3>
                </div>
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
                disabled={checkingLogout}
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 hover:bg-rose-100 cursor-pointer disabled:opacity-50"
              >
                {checkingLogout ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                <span>{checkingLogout ? 'Checking Status...' : 'Log Out of Portal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BLOCKED LOGOUT MODAL (Check-Out Required) ─── */}
      {blockedLogoutModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-rose-200 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Header Icon & Title */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 bg-rose-100/70 px-2 py-0.5 rounded-full inline-block mb-1">
                  Check-Out Required
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Cannot Log Out While Checked In
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  You have an active store visit in progress. Company field sales policy requires completing your visit report and check-out before logging out.
                </p>
              </div>
            </div>

            {/* Active Visit Details Card */}
            {activeCheckInVisit && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wide">Active Store</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                    Checked-In
                  </span>
                </div>
                <div className="font-black text-slate-900 text-sm truncate">
                  {activeCheckInVisit.store?.name || activeCheckInVisit.store?.companyName || activeCheckInVisit.visitorName || 'Store Visit'}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/80">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>In: {new Date(activeCheckInVisit.checkInTime || activeCheckInVisit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="truncate max-w-[180px] text-[11px] font-medium text-slate-600">
                    {activeCheckInVisit.purpose || 'Store Visit'}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleInstantCheckOutAndExit}
                disabled={instantCheckingOut}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer disabled:opacity-75"
              >
                {instantCheckingOut ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{instantCheckingOut ? 'Checking Out & Signing Out...' : 'Check-Out & Log Out Now'}</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGoToCheckOut}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-200"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  <span>Go to Visit Page</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBlockedLogoutModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-3 rounded-xl text-xs transition-all cursor-pointer text-center border border-slate-200"
                >
                  Stay Logged In
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={handleForceLogOut}
                  className="text-[11px] text-slate-400 hover:text-slate-700 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
                >
                  Already checked out? Clear cache &amp; force sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
