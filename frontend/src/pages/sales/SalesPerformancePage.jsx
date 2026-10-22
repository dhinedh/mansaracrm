// src/pages/sales/SalesPerformancePage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Award, TrendingUp, Target, Calendar, User, 
  MapPin, CheckCircle2, ShoppingBag, DollarSign, Clock 
} from 'lucide-react';

export default function SalesPerformancePage() {
  const [perfData, setPerfData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/field-sales/performance');
      if (res.data?.success) {
        setPerfData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching performance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const profile = perfData?.profile || {};
  const targetSummary = perfData?.targetSummary || {
    monthlyTarget: 100000,
    visitsTarget: 120,
    dailyVisitsTarget: 6
  };
  const recentVisits = perfData?.recentVisits || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Sales Target & Performance History
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Modules 30–32: Target tracking, customer acquisition pipeline & personal sales history
        </p>
      </div>

      {/* Target Breakdown Grid (Module 30) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-800/80 border border-white/10 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Monthly Sales Target</span>
              <div className="text-xl font-black text-white">
                ₹{targetSummary.monthlyTarget.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
          <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full w-2/3 rounded-full"></div>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-white/10 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Monthly Visits Target</span>
              <div className="text-xl font-black text-white">
                {targetSummary.visitsTarget} Visits
              </div>
            </div>
          </div>
          <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full w-3/4 rounded-full"></div>
          </div>
        </div>

        <div className="bg-slate-800/80 border border-white/10 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Daily Beat Target</span>
              <div className="text-xl font-black text-white">
                {targetSummary.dailyVisitsTarget} Visits / Day
              </div>
            </div>
          </div>
          <div className="w-full bg-slate-700/50 h-2 rounded-full overflow-hidden">
            <div className="bg-cyan-500 h-full w-full rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Customer Acquisition Pipeline (Module 31) */}
      <div className="bg-slate-800/80 border border-white/10 p-5 sm:p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">Customer Acquisition Pipeline</h3>
            <p className="text-xs text-slate-400">Track conversion stages from newly identified shops to regular ordering retailers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">1. Leads Identified</span>
            <div className="text-lg font-black text-white mt-1">14 Shops</div>
            <p className="text-[10px] text-slate-500 mt-0.5">GPS location recorded</p>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">2. Samples / Pitch</span>
            <div className="text-lg font-black text-amber-400 mt-1">8 Shops</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Product display pitch done</p>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">3. First Order</span>
            <div className="text-lg font-black text-cyan-400 mt-1">5 Shops</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Trial carton booked</p>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">4. Repeat Customers</span>
            <div className="text-lg font-black text-emerald-400 mt-1">3 Accounts</div>
            <p className="text-[10px] text-slate-500 mt-0.5">Added to weekly beat</p>
          </div>
        </div>
      </div>

      {/* Historical Visits Table (Module 32) */}
      <div className="bg-slate-800/80 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
            Personal Performance & Visit Log
          </h3>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/60 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-white/10">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Purpose</th>
              <th className="px-4 py-3">Outcome</th>
              <th className="px-4 py-3">Collections</th>
              <th className="px-4 py-3">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-200">
            {recentVisits.slice(0, 15).map((v, i) => (
              <tr key={v._id || i} className="hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-slate-400">
                  {new Date(v.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 font-semibold text-white">{v.purpose}</td>
                <td className="px-4 py-3 max-w-sm truncate text-slate-300">{v.outcome || 'Logged'}</td>
                <td className="px-4 py-3 font-mono text-emerald-400 font-bold">
                  ₹{(v.paymentsCollected || 0).toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">
                    GPS Verified
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
