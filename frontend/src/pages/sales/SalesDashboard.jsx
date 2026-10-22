// src/pages/sales/SalesDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  CheckCircle2, Clock, MapPin, DollarSign, ShoppingBag, 
  TrendingUp, AlertCircle, Calendar, ArrowRight, RefreshCw, 
  Store, Target, Award, ChevronRight, Sparkles, Navigation 
} from 'lucide-react';

export default function SalesDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeBeat, setActiveBeat] = useState('Beat A - North Chennai Commercial Hub');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/field-sales/dashboard/stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const today = stats?.today || {
    totalVisits: 0,
    completedVisits: 0,
    targetVisits: 6,
    ordersValue: 0,
    collections: 0
  };

  const monthly = stats?.monthly || {
    target: 100000,
    achieved: 0,
    achievementPercent: 0,
    collections: 0,
    visitsTotal: 0
  };

  const pendingFollowUps = stats?.pendingFollowUpsCount || 0;
  const pendingMargins = stats?.pendingMarginApprovalsCount || 0;

  return (
    <div className="space-y-6">
      {/* Welcome & Beat Route Header */}
      <div className="bg-gradient-to-r from-amber-500/20 via-slate-800 to-slate-900 border border-amber-500/30 p-5 sm:p-6 rounded-3xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Today's Active Beat</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {stats?.activeBeatRoute || activeBeat}
            </h1>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/sales/visits')}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all text-xs flex items-center gap-2 cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>Start GPS Check-In</span>
            </button>
            <button
              type="button"
              onClick={fetchStats}
              className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (Module 2 requirements) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Visits */}
        <div className="bg-slate-800/80 border border-white/10 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Today's Visits</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{today.completedVisits}</span>
            <span className="text-xs text-slate-400">/ {today.targetVisits} target</span>
          </div>
          <div className="w-full bg-slate-700/50 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (today.completedVisits / (today.targetVisits || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Orders & Sales Value */}
        <div className="bg-slate-800/80 border border-white/10 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Today's Sales</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            ₹{today.ordersValue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Booked across field visits</p>
        </div>

        {/* Collections */}
        <div className="bg-slate-800/80 border border-white/10 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Today's Collections</span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            ₹{today.collections.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-cyan-400 font-semibold mt-1">Cash & Online receipts</p>
        </div>

        {/* Pending Follow-Ups & Approvals */}
        <div className="bg-slate-800/80 border border-white/10 p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Pending Actions</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <span className="text-xl font-black text-amber-400">{pendingFollowUps}</span>
              <p className="text-[10px] text-slate-400">Follow-ups</p>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div>
              <span className="text-xl font-black text-rose-400">{pendingMargins}</span>
              <p className="text-[10px] text-slate-400">Margin Queued</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Target & Achievement Card (Module 2, 30) */}
      <div className="bg-slate-800/70 border border-white/10 p-5 sm:p-6 rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Monthly Sales Target & Achievement</h3>
              <p className="text-xs text-slate-400">Cycle: Current Month Active Performance</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">Achievement Rate</span>
            <div className="text-xl font-black text-emerald-400">{monthly.achievementPercent}%</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div 
              className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, monthly.achievementPercent)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-400 font-semibold pt-1">
            <span>Achieved: <strong className="text-white">₹{monthly.achieved.toLocaleString('en-IN')}</strong></span>
            <span>Target: <strong className="text-white">₹{monthly.target.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>
      </div>

      {/* Quick Access Matrix (Modules 3-34) */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-1">
          Quick Field Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            type="button"
            onClick={() => navigate('/sales/visits')}
            className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-white/10 hover:border-amber-500/50 rounded-2xl flex flex-col items-center text-center gap-2 group transition-all cursor-pointer"
          >
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Shop Visits</span>
            <span className="text-[10px] text-slate-400">GPS Check-In</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/sales/orders')}
            className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-white/10 hover:border-amber-500/50 rounded-2xl flex flex-col items-center text-center gap-2 group transition-all cursor-pointer"
          >
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Book Order</span>
            <span className="text-[10px] text-slate-400">Quick Reorder</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/sales/collections')}
            className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-white/10 hover:border-amber-500/50 rounded-2xl flex flex-col items-center text-center gap-2 group transition-all cursor-pointer"
          >
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Collections</span>
            <span className="text-[10px] text-slate-400">Record Receipts</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/sales/pricing')}
            className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-white/10 hover:border-amber-500/50 rounded-2xl flex flex-col items-center text-center gap-2 group transition-all cursor-pointer"
          >
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Price Simulator</span>
            <span className="text-[10px] text-slate-400">Margin Calculation</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/sales/follow-ups')}
            className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-white/10 hover:border-amber-500/50 rounded-2xl flex flex-col items-center text-center gap-2 group transition-all cursor-pointer"
          >
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Follow-Ups</span>
            <span className="text-[10px] text-slate-400">Pending Tasks</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/sales/dar')}
            className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-white/10 hover:border-amber-500/50 rounded-2xl flex flex-col items-center text-center gap-2 group transition-all cursor-pointer"
          >
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-white">Daily Report</span>
            <span className="text-[10px] text-slate-400">Activity DAR</span>
          </button>
        </div>
      </div>
    </div>
  );
}
