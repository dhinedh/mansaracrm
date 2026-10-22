// src/pages/auth/SalesLoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { 
  Lock, Mail, Loader2, ArrowRight, Eye, EyeOff, 
  MapPin, Navigation, ShieldCheck, Briefcase, Sparkles 
} from 'lucide-react';

export default function SalesLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, loading, error, clearError } = useAuthStore();
  const { clearCart } = useCartStore();

  const [email, setEmail] = useState('sales@mansarafoods.com');
  const [password, setPassword] = useState('Sales@123');
  const [showPassword, setShowPassword] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('detecting');

  useEffect(() => {
    clearError();
    // Verify GPS permission on sales login screen
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setGpsStatus('active'),
        () => setGpsStatus('permission_needed'),
        { timeout: 5000 }
      );
    } else {
      setGpsStatus('unsupported');
    }

    if (isAuthenticated && user) {
      if (user.role === 'SALESPERSON') {
        navigate('/sales/dashboard');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dealer/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    const res = await login(email, password);
    if (res.success) {
      clearCart();
      if (res.role === 'SALESPERSON') {
        navigate('/sales/dashboard');
      } else if (res.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dealer/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white flex flex-col justify-between px-4 py-6 sm:py-10">
      {/* Top Header Badge */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Briefcase className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white">MANSARA FOODS</h1>
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Field Sales Executive Portal</p>
          </div>
        </div>

        {/* GPS Badge */}
        <div className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 ${
          gpsStatus === 'active' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          <MapPin className="w-3.5 h-3.5 animate-pulse" />
          <span>{gpsStatus === 'active' ? 'GPS Ready' : 'Location Check'}</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-rose-500/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="mb-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Beat & Field Sales Login</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Salesperson Sign In</h2>
          <p className="text-slate-400 text-xs mt-1">Check in to your daily beat route, record visits & book orders</p>
        </div>

        {/* Quick Demo Credentials Info */}
        <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between text-xs text-amber-300">
          <div>
            <p className="font-bold">Default Demo Salesperson:</p>
            <p className="text-[11px] text-amber-400/90 font-mono">sales@mansarafoods.com / Sales@123</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEmail('sales@mansarafoods.com');
              setPassword('Sales@123');
            }}
            className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black rounded-lg hover:bg-amber-400 transition-all text-[11px] cursor-pointer"
          >
            Auto Fill
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs px-4 py-3 rounded-xl mb-6 font-semibold animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Salesperson Email ID
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sales@mansarafoods.com"
                className="w-full pl-11 pr-4 py-3 text-sm bg-slate-950/60 border border-slate-700/60 focus:border-amber-500 focus:bg-slate-950 rounded-xl text-white placeholder-slate-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Security Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-3 text-sm bg-slate-950/60 border border-slate-700/60 focus:border-amber-500 focus:bg-slate-950 rounded-xl text-white placeholder-slate-500 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-slate-950" />
            ) : (
              <>
                <span>Launch Sales Dashboard</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center relative z-10 flex flex-col items-center gap-2">
          <p className="text-xs text-slate-400">Are you an Admin or B2B Dealer?</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-xs font-bold text-slate-300 hover:text-white underline cursor-pointer"
          >
            Go to Main Portal Login
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-md w-full mx-auto text-center text-[11px] text-slate-500 pt-4">
        <p>© {new Date().getFullYear()} Mansara Foods Private Limited. Field Sales Automation (SFA) v2.5</p>
      </div>
    </div>
  );
}
