// src/pages/admin/AdminSalesPerformancePage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Trophy, Award, TrendingUp, Users, Target, 
  DollarSign, CheckCircle2, Download, Search, 
  MapPin, Store, ArrowUpRight
} from 'lucide-react';

export default function AdminSalesPerformancePage() {
  const [performanceList, setPerformanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/field-sales/admin/performance');
      if (res.data?.success) {
        setPerformanceList(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching admin sales performance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const filtered = performanceList.filter(item => {
    const name = item.salesperson?.name || '';
    const code = item.profile?.employeeCode || '';
    const beat = item.profile?.activeBeatRoute || '';
    const q = search.toLowerCase();
    return !q || name.toLowerCase().includes(q) || code.toLowerCase().includes(q) || beat.toLowerCase().includes(q);
  });

  const totalTeamSales = performanceList.reduce((acc, p) => acc + (p.actualSales || 0), 0);
  const totalTeamTarget = performanceList.reduce((acc, p) => acc + (p.monthlyTarget || 0), 0);
  const avgAchievement = totalTeamTarget > 0 ? Math.round((totalTeamSales / totalTeamTarget) * 100) : 0;
  const topPerformer = performanceList.length > 0 ? performanceList[0] : null;

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const headers = ['Rank', 'Executive', 'Employee Code', 'Beat Route', 'Target (INR)', 'Actual Sales (INR)', 'Achievement %', 'Orders Booked', 'Completed Visits', 'Collections (INR)'];
    const rows = filtered.map((p, idx) => [
      idx + 1,
      `"${p.salesperson?.name || 'Sales Rep'}"`,
      `"${p.profile?.employeeCode || 'SALES'}"`,
      `"${p.profile?.activeBeatRoute || 'Beat A'}"`,
      p.monthlyTarget || 0,
      p.actualSales || 0,
      `"${p.achievementPct}%"`,
      p.ordersBookedCount || 0,
      p.completedVisits || 0,
      p.collectionsTotal || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Performance_Leaderboard_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Sales Force Performance & Targets Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time executive leaderboard, monthly quota achievement, visit compliance, and sales revenue realization
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={!filtered.length}
          className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Leaderboard CSV</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Team Revenue (MTD)</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            ₹{totalTeamSales.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Target: ₹{totalTeamTarget.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Team Achievement</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">{avgAchievement}%</div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className={`h-full rounded-full ${avgAchievement >= 100 ? 'bg-emerald-500' : avgAchievement >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, avgAchievement)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Top Performer</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-lg font-black text-slate-800 mt-2 truncate">
            {topPerformer?.salesperson?.name || 'Karthik Raja'}
          </div>
          <p className="text-[11px] font-bold text-amber-600 mt-0.5">
            ₹{(topPerformer?.actualSales || 0).toLocaleString('en-IN')} ({topPerformer?.achievementPct || 0}%)
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Field Reps</span>
            <Users className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">{performanceList.length} Reps</div>
          <p className="text-[11px] text-slate-500 mt-1">On field today</p>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {performanceList.length >= 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {performanceList.slice(0, 3).map((p, idx) => {
            const medals = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place'];
            const medalColors = ['from-amber-500/10 to-amber-500/5 border-amber-300 text-amber-800', 'from-slate-200/50 to-slate-100 border-slate-300 text-slate-800', 'from-amber-700/10 to-amber-700/5 border-amber-600/30 text-amber-900'];

            return (
              <div 
                key={p.salesperson?._id || idx}
                className={`bg-gradient-to-b ${medalColors[idx]} border rounded-3xl p-5 shadow-sm relative overflow-hidden`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white shadow-xs">
                    {medals[idx]}
                  </span>
                  <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-white/80">
                    {p.profile?.employeeCode || 'SALES'}
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 leading-tight">
                  {p.salesperson?.name}
                </h3>
                <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{p.profile?.activeBeatRoute || 'Beat Route A'}</span>
                </p>

                <div className="mt-4 pt-3 border-t border-black/5 grid grid-cols-2 gap-2 text-center bg-white/60 p-2.5 rounded-2xl">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Booked Sales</span>
                    <p className="text-sm font-black text-emerald-700 font-mono">₹{p.actualSales.toLocaleString('en-IN')}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Target Achieved</span>
                    <p className="text-sm font-black text-rose-600 font-mono">{p.achievementPct}%</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search executive name, employee code, or beat route..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 shadow-sm"
        />
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800">
            Sales Force Leaderboard & Activity Compliance
          </h3>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            {filtered.length} Sales Officers
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs">Loading sales performance data...</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs">No sales executives found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-center">Rank</th>
                  <th className="px-4 py-3">Sales Executive</th>
                  <th className="px-4 py-3">Active Beat Route</th>
                  <th className="px-4 py-3">Monthly Target</th>
                  <th className="px-4 py-3">Actual Booked</th>
                  <th className="px-4 py-3">Achievement</th>
                  <th className="px-4 py-3">Visits Completed</th>
                  <th className="px-4 py-3">Collections</th>
                  <th className="px-4 py-3 text-right">Status Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((p, idx) => {
                  const tier = p.achievementPct >= 100 ? 'Champion' : p.achievementPct >= 70 ? 'On Track' : 'Needs Focus';
                  const tierColor = p.achievementPct >= 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    p.achievementPct >= 70 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200';

                  return (
                    <tr key={p.salesperson?._id || idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-center font-black font-mono text-slate-800">
                        #{idx + 1}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {p.salesperson?.name?.slice(0, 2).toUpperCase() || 'SO'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">{p.salesperson?.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">{p.profile?.employeeCode || 'SALES'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {p.profile?.activeBeatRoute || 'Beat Route A'}
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-700">
                        ₹{(p.monthlyTarget || 100000).toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        ₹{(p.actualSales || 0).toLocaleString('en-IN')}
                        <span className="text-[10px] font-normal text-slate-400 block font-sans">
                          {p.ordersBookedCount || 0} order(s)
                        </span>
                      </td>

                      <td className="px-4 py-3 min-w-[130px]">
                        <div className="flex items-center justify-between text-xs font-mono font-black mb-1">
                          <span className={p.achievementPct >= 100 ? 'text-emerald-600' : p.achievementPct >= 70 ? 'text-blue-600' : 'text-amber-600'}>
                            {p.achievementPct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${p.achievementPct >= 100 ? 'bg-emerald-500' : p.achievementPct >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(100, p.achievementPct)}%` }}
                          ></div>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-700">
                        <span className="font-bold text-slate-900">{p.completedVisits}</span> / {p.monthVisitsCount} visits
                        <span className="text-[10px] text-slate-400 block font-sans">
                          Quota: {p.dailyVisitsTarget || 6}/day
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                        ₹{(p.collectionsTotal || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${tierColor}`}>
                          {tier}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
