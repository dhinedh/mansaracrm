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
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50/30 border border-amber-200 p-5 sm:p-6 rounded-3xl relative overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-300 text-amber-800 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Today's Active Beat</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {stats?.activeBeatRoute || activeBeat}
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/sales/checkin')}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all text-xs flex items-center gap-2 cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>Start GPS Check-In</span>
            </button>
            <button
              type="button"
              onClick={fetchStats}
              className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
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
        <div className="bg-white border border-slate-200 p-4 rounded-2xl relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Today's Visits</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{today.completedVisits}</span>
            <span className="text-xs text-slate-500">/ {today.targetVisits} target</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (today.completedVisits / (today.targetVisits || 1)) * 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Orders & Sales Value */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Today's Sales</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{today.ordersValue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Booked across field visits</p>
        </div>

        {/* Collections */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Today's Collections</span>
            <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl border border-cyan-100">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{today.collections.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-cyan-700 font-semibold mt-1">Cash & Online receipts</p>
        </div>

        {/* Pending Follow-Ups & Approvals */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Pending Actions</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <span className="text-xl font-black text-amber-600">{pendingFollowUps}</span>
              <p className="text-[10px] text-slate-500">Follow-ups</p>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div>
              <span className="text-xl font-black text-rose-600">{pendingMargins}</span>
              <p className="text-[10px] text-slate-500">Margin Queued</p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Target & Achievement Card (Module 2, 30) */}
      <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Monthly Sales Target & Achievement</h3>
              <p className="text-xs text-slate-500">Cycle: Current Month Active Performance</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500">Achievement Rate</span>
            <div className="text-xl font-black text-emerald-600">{monthly.achievementPercent}%</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div 
              className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, monthly.achievementPercent)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-slate-600 font-semibold pt-1">
            <span>Achieved: <strong className="text-slate-900">₹{monthly.achieved.toLocaleString('en-IN')}</strong></span>
            <span>Target: <strong className="text-slate-900">₹{monthly.target.toLocaleString('en-IN')}</strong></span>
          </div>
        </div>
      </div>

      {/* Quick Access Matrix (Modules 3-34) */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 px-1">
          Quick Field Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            type="button"
            onClick={() => navigate('/sales/visits')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-400 rounded-2xl flex flex-col items-center text-center gap-2 group transition-all cursor-pointer shadow-xs"
          >
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Shop Visits</span>
            <span className="text-[10px] text-slate-500">GPS Check-In</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/sales/orders')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-400 rounded-2xl flex flex-col items-center text-center gap-2 group transition-all cursor-pointer shadow-xs"
          >
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Book Order</span>
            <span className="text-[10px] text-slate-500">Quick Reorder</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/sales/collections')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-400 rounded-2xl flex flex-col items-center text-center gap-2 group transition-all cursor-pointer shadow-xs"
          >
            <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Collections</span>
            <span className="text-[10px] text-slate-500">Record Receipts</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/sales/pricing')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-400 rounded-2xl flex flex-col items-center text-center gap-2 group transition-all cursor-pointer shadow-xs"
          >
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Price Simulator</span>
            <span className="text-[10px] text-slate-500">Margin Calculation</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/sales/follow-ups')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-400 rounded-2xl flex flex-col items-center text-center gap-2 group transition-all cursor-pointer shadow-xs"
          >
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Follow-Ups</span>
            <span className="text-[10px] text-slate-500">Pending Tasks</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/sales/dar')}
            className="p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-400 rounded-2xl flex flex-col items-center text-center gap-2 group transition-all cursor-pointer shadow-xs"
          >
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
              <Award className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900">Daily Report</span>
            <span className="text-[10px] text-slate-500">Activity DAR</span>
          </button>
        </div>
      </div>
    </div>
  );
}
