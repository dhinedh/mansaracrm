// src/pages/admin/AdminAnalyticsPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, RadialBarChart, RadialBar
} from 'recharts';
import {
  TrendingUp, Award, Map, RefreshCw, Globe, ShoppingBag,
  Truck, Building2, BarChart3, ShoppingCart, Package,
  ArrowUpRight, Layers, Filter, CheckCircle2, Clock, Zap
} from 'lucide-react';

/* ─── colour tokens ──────────────────────────────── */
const ZONE_COLORS  = ['#be123c','#0d9488','#ea580c','#6366f1','#f59e0b','#10b981','#7c3aed'];
const CHAN_COLORS  = {
  B2B:        '#be123c',
  RETAIL:     '#0d9488',
  WEBSITE:    '#6366f1',
  E_COMMERCE: '#f59e0b',
};

const fmt  = (n) => `₹${parseFloat(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const pct  = (a, total) => total > 0 ? ((a / total) * 100).toFixed(1) : '0.0';

/* ─── channel metadata ───────────────────────────── */
const CHANNEL_META = {
  B2B:        { label: 'B2B (Dealer)',   icon: Truck,       color: '#be123c', bg: 'bg-rose-50',    border: 'border-rose-100',    text: 'text-rose-700',    live: true  },
  RETAIL:     { label: 'Retail / Store', icon: ShoppingBag, color: '#0d9488', bg: 'bg-teal-50',    border: 'border-teal-100',    text: 'text-teal-700',    live: true  },
  WEBSITE:    { label: 'Website Orders', icon: Globe,       color: '#6366f1', bg: 'bg-indigo-50',  border: 'border-indigo-100',  text: 'text-indigo-700',  live: false },
  E_COMMERCE: { label: 'E-Commerce',    icon: ShoppingCart, color: '#f59e0b', bg: 'bg-amber-50',   border: 'border-amber-100',   text: 'text-amber-700',   live: false },
};

/* ─── custom tooltip ─────────────────────────────── */
const CurrencyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-black text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

/* ─── stat card ──────────────────────────────────── */
const StatCard = ({ label, value, sub, icon: Icon, accent = 'rose', className = '' }) => {
  const map = {
    rose:   { bg: 'bg-rose-50',   text: 'text-rose-600',   icon: 'text-rose-400' },
    teal:   { bg: 'bg-teal-50',   text: 'text-teal-600',   icon: 'text-teal-400' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'text-indigo-400' },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-600',  icon: 'text-amber-400' },
  };
  const c = map[accent] || map.rose;
  return (
    <div className={`bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-start gap-3 ${className}`}>
      <div className={`${c.bg} p-2.5 rounded-xl`}>
        <Icon className={`w-4 h-4 ${c.icon}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p>
        <p className={`text-xl font-black ${c.text} leading-tight`}>{value}</p>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════ */
export default function AdminAnalyticsPage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/analytics/admin');
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ── derived zone data ── */
  const zoneList = useMemo(() => data?.zoneSales?.map(z => z.name) || [], [data]);

  const filteredZonePlayers = useMemo(() => {
    if (!data?.zoneSales) return [];
    if (zoneFilter === 'ALL') return data.zoneSales;
    return data.zoneSales.filter(z => z.name === zoneFilter);
  }, [data, zoneFilter]);

  /* ── channel data augmented with RETAIL channel ── */
  const channelChartData = useMemo(() => {
    if (!data?.channelSales) return [];
    const existingNames = data.channelSales.map(c => c.name);
    const result = [...data.channelSales];
    // Ensure all 4 channels always appear (even with 0)
    ['B2B', 'RETAIL', 'WEBSITE', 'E_COMMERCE'].forEach(ch => {
      if (!existingNames.includes(ch)) result.push({ name: ch, value: 0 });
    });
    return result.map(c => ({
      ...c,
      label: CHANNEL_META[c.name]?.label || c.name,
      color: CHAN_COLORS[c.name] || '#94a3b8',
      isLive: CHANNEL_META[c.name]?.live ?? false
    }));
  }, [data]);

  const totalChannelRevenue = channelChartData.reduce((s, c) => s + (c.value || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span className="text-sm font-bold">Loading Business Intelligence...</span>
      </div>
    );
  }

  /* ════════════ RENDER ════════════════════════════════ */
  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-600" />
            Business Intelligence
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Zone-wise · Channel-wise · Product movement — unified database across all sales channels.
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs px-4 py-2 rounded-xl shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Section Nav ── */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'zone', label: 'Zone-wise', icon: Map },
          { key: 'channel', label: 'Channel-wise', icon: Layers },
          { key: 'products', label: 'Products', icon: Package },
          { key: 'leaderboard', label: 'Leaderboard', icon: Award },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border transition-colors ${
              activeSection === key
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ════════ OVERVIEW ════════ */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* KPI grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Revenue" value={fmt(data?.kpis?.totalRevenue)} sub="All channels combined" icon={TrendingUp} accent="rose" />
            <StatCard label="Active Dealers" value={data?.kpis?.activeDealers ?? 0} sub={`of ${data?.kpis?.totalDealers ?? 0} total`} icon={Building2} accent="teal" />
            <StatCard label="Today's Sales" value={fmt(data?.kpis?.todaySales)} sub="Invoices generated today" icon={ShoppingBag} accent="indigo" />
            <StatCard label="Dispatch Pending" value={data?.kpis?.dispatchPending ?? 0} sub="Awaiting shipment" icon={Truck} accent="amber" />
          </div>

          {/* Dual chart: territory + product movement */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Map className="w-4 h-4 text-rose-600" />
                Territory Sales Distribution
              </h3>
              <div className="h-60">
                {data?.areaSales?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.areaSales} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 9 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={75} />
                      <Tooltip content={<CurrencyTooltip />} />
                      <Bar dataKey="value" name="Revenue" fill="#0d9488" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400">No territory data yet.</div>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-600" />
                Channel Revenue Split
              </h3>
              <div className="h-60">
                {channelChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={channelChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<CurrencyTooltip />} />
                      <Bar dataKey="value" name="Revenue" radius={[4, 4, 0, 0]}>
                        {channelChartData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400">No channel data yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* CRM Funnel */}
          {data?.crmStats && (
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-rose-600" />
                CRM Conversion Funnel
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Leads', value: data.crmStats.totalLeads, sub: 'Registered in CRM', accent: 'indigo' },
                  { label: 'Leads Converted', value: `${data.crmStats.convertedLeads} (${data.crmStats.leadConversionRate?.toFixed(1)}%)`, sub: 'Conversion rate', accent: 'teal' },
                  { label: 'Field Visits', value: data.crmStats.totalVisits, sub: 'Logged visits', accent: 'amber' },
                  { label: 'Samples Distributed', value: data.crmStats.totalSamples, sub: 'Trial samples given', accent: 'rose' },
                ].map(({ label, value, sub, accent }) => (
                  <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                    <p className="text-lg font-black text-slate-800 mt-0.5">{value}</p>
                    <p className="text-[10px] text-slate-400">{sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════ ZONE-WISE ════════ */}
      {activeSection === 'zone' && (
        <div className="space-y-6">
          {/* Zone filter bar */}
          <div className="flex gap-2 flex-wrap items-center">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-black uppercase text-slate-400 mr-1">Filter Zone:</span>
            {['ALL', ...zoneList].map(z => (
              <button
                key={z}
                onClick={() => setZoneFilter(z)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-full border transition-colors ${
                  zoneFilter === z
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {z === 'ALL' ? 'All Zones' : z}
              </button>
            ))}
          </div>

          {/* Zone totals pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {data?.zoneSales?.map((zone, idx) => (
              <div
                key={zone.name}
                onClick={() => setZoneFilter(zone.name === zoneFilter ? 'ALL' : zone.name)}
                className={`cursor-pointer bg-white border rounded-2xl p-4 shadow-sm transition-all ${
                  zoneFilter === zone.name
                    ? 'border-rose-400 ring-2 ring-rose-100 shadow-md'
                    : 'border-slate-150 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ZONE_COLORS[idx % ZONE_COLORS.length] }} />
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{zone.name}</span>
                </div>
                <p className="text-lg font-black text-slate-800">{fmt(zone.value)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {zone.dealerCount} dealer{zone.dealerCount !== 1 ? 's' : ''} · {pct(zone.value, data?.kpis?.totalRevenue)}% of total
                </p>
              </div>
            ))}
          </div>

          {/* Zone pie + zone breakdown table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Map className="w-4 h-4 text-rose-600" />
                Zone Distribution
              </h3>
              <div className="h-52 flex items-center justify-center">
                {data?.zoneSales?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.zoneSales}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {data.zoneSales.map((_, i) => (
                          <Cell key={i} fill={ZONE_COLORS[i % ZONE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={v => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-400">No zone data</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {data?.zoneSales?.map((z, i) => (
                  <div key={z.name} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ZONE_COLORS[i % ZONE_COLORS.length] }} />
                    {z.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Players table */}
            <div className="lg:col-span-2 bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Award className="w-4 h-4 text-rose-600" />
                Zone Players &amp; Revenue
              </h3>
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {filteredZonePlayers.length > 0 ? (
                  filteredZonePlayers.map((zone, zi) => (
                    <div key={zone.name} className="border border-slate-100 rounded-xl overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ZONE_COLORS[zi % ZONE_COLORS.length] }} />
                          <span className="font-black text-slate-800 text-xs uppercase">{zone.name}</span>
                          <span className="text-[9px] text-slate-400 font-bold">{zone.dealerCount} dealer{zone.dealerCount !== 1 ? 's' : ''}</span>
                        </div>
                        <strong className="text-rose-600 font-black text-xs">{fmt(zone.value)}</strong>
                      </div>
                      {zone.players?.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-100">
                          {zone.players.map((pl, pi) => (
                            <div key={pi} className="bg-white px-4 py-2.5 flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-700 truncate max-w-[140px]">{pl.companyName}</span>
                              <span className="font-black text-slate-800 ml-2">{fmt(pl.revenue)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic px-4 py-3">No billing activity recorded in this zone.</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-xs text-slate-400 py-8">No zone data available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════ CHANNEL-WISE ════════ */}
      {activeSection === 'channel' && (
        <div className="space-y-6">
          {/* Channel cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {['B2B', 'RETAIL', 'WEBSITE', 'E_COMMERCE'].map(ch => {
              const meta = CHANNEL_META[ch];
              const entry = channelChartData.find(c => c.name === ch);
              const val = entry?.value || 0;
              const Icon = meta.icon;
              return (
                <div key={ch} className={`bg-white border ${meta.border} rounded-2xl p-5 shadow-sm space-y-3`}>
                  <div className="flex items-center justify-between">
                    <div className={`${meta.bg} p-2.5 rounded-xl`}>
                      <Icon className={`w-4 h-4 ${meta.text}`} />
                    </div>
                    {meta.live ? (
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> LIVE
                      </span>
                    ) : (
                      <span className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> COMING SOON
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{meta.label}</p>
                    <p className={`text-xl font-black mt-0.5 ${meta.live ? meta.text : 'text-slate-300'}`}>
                      {meta.live ? fmt(val) : '—'}
                    </p>
                    {meta.live && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {pct(val, totalChannelRevenue)}% of total revenue
                      </p>
                    )}
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${meta.live ? pct(val, totalChannelRevenue) : 0}%`, backgroundColor: meta.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Channel pie + bar combo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-600" />
                Channel Revenue Proportion
              </h3>
              <div className="h-56 flex items-center justify-center">
                {channelChartData.some(c => c.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelChartData}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="label"
                      >
                        {channelChartData.map((c, i) => (
                          <Cell key={i} fill={c.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={v => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center space-y-2">
                    <Layers className="w-8 h-8 text-slate-200 mx-auto" />
                    <p className="text-xs text-slate-400">No channel data yet.</p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                {channelChartData.map(c => (
                  <div key={c.name} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Future pipeline info */}
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-rose-600" />
                Omni-channel Architecture
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                All sales channels — dealer B2B, retail store billing, website orders, and e-commerce — flow into a
                <strong className="text-slate-700"> single unified database</strong>. Each order is tagged with its
                <code className="bg-slate-100 text-rose-600 px-1 rounded text-[10px]">channel</code> field for isolation and comparison.
              </p>
              <div className="space-y-2.5">
                {[
                  { ch: 'B2B',        desc: 'Dealer transfer invoices, generated via Transfers module.' },
                  { ch: 'RETAIL',     desc: 'Dealer-to-store bills created in the dealer billing portal.' },
                  { ch: 'WEBSITE',    desc: 'Website orders — API-ready, pending frontend integration.' },
                  { ch: 'E_COMMERCE', desc: 'E-commerce platform orders — unique schema channel ready.' },
                ].map(({ ch, desc }) => {
                  const meta = CHANNEL_META[ch];
                  const Icon = meta.icon;
                  return (
                    <div key={ch} className={`flex gap-3 items-start p-3 ${meta.bg} border ${meta.border} rounded-xl`}>
                      <div className={`${meta.bg} p-1.5 rounded-lg border ${meta.border}`}>
                        <Icon className={`w-3 h-3 ${meta.text}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-[10px] font-black ${meta.text}`}>{meta.label}</p>
                          {meta.live
                            ? <span className="text-[8px] bg-emerald-100 text-emerald-700 font-black px-1.5 py-0.5 rounded-full">LIVE</span>
                            : <span className="text-[8px] bg-slate-200 text-slate-500 font-black px-1.5 py-0.5 rounded-full">PLANNED</span>
                          }
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════ PRODUCTS ════════ */}
      {activeSection === 'products' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fast Movers */}
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                Top Moving Products
              </h3>
              <div className="h-56">
                {data?.fastMovers?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.fastMovers}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="sku" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip />
                      <Bar dataKey="quantityTransferred" name="Qty Dispatched" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400">No transfer data yet</div>
                )}
              </div>
              <div className="space-y-2">
                {data?.fastMovers?.slice(0, 5).map((p, i) => (
                  <div key={p.productId} className="flex items-center justify-between text-xs bg-emerald-50/50 border border-emerald-100 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[8px] font-black flex items-center justify-center">{i + 1}</span>
                      <div>
                        <p className="font-bold text-slate-700 truncate max-w-[160px]">{p.name}</p>
                        <p className="text-[9px] text-slate-400">{p.sku}</p>
                      </div>
                    </div>
                    <span className="font-black text-emerald-700">{p.quantityTransferred} units</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Slow Movers */}
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-amber-600 rotate-180" />
                Slow Moving Products
              </h3>
              <div className="h-56">
                {data?.slowMovers?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.slowMovers}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="sku" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip />
                      <Bar dataKey="quantityTransferred" name="Qty Dispatched" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400">No data yet</div>
                )}
              </div>
              <div className="space-y-2">
                {data?.slowMovers?.slice(0, 5).map((p, i) => (
                  <div key={p.productId} className="flex items-center justify-between text-xs bg-amber-50/50 border border-amber-100 rounded-xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[8px] font-black flex items-center justify-center">{i + 1}</span>
                      <div>
                        <p className="font-bold text-slate-700 truncate max-w-[160px]">{p.name}</p>
                        <p className="text-[9px] text-slate-400">{p.sku}</p>
                      </div>
                    </div>
                    <span className="font-black text-amber-700">{p.quantityTransferred} units</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════ LEADERBOARD ════════ */}
      {activeSection === 'leaderboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dealer leaderboard */}
            <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <Award className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Top Dealers (Retail / Wholesale)</h3>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-black text-[9px] uppercase tracking-wider bg-slate-50/50">
                    <th className="px-4 py-2 text-left">Rank</th>
                    <th className="px-4 py-2 text-left">Company</th>
                    <th className="px-4 py-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.dealerPerformance?.length > 0 ? (
                    data.dealerPerformance.map((item, idx) => (
                      <tr key={item.dealerId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-2.5">
                          <span className={`w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center ${
                            idx === 0 ? 'bg-amber-400 text-white' :
                            idx === 1 ? 'bg-slate-300 text-slate-700' :
                            idx === 2 ? 'bg-orange-400 text-white' :
                            'bg-slate-100 text-slate-500'
                          }`}>{idx + 1}</span>
                        </td>
                        <td className="px-4 py-2.5 font-bold text-slate-800">{item.companyName}</td>
                        <td className="px-4 py-2.5 text-right font-black text-rose-600">{fmt(item.totalAmount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400 text-xs">No dealer billing data yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Distributor leaderboard */}
            <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Top Distributors</h3>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-black text-[9px] uppercase tracking-wider bg-slate-50/50">
                    <th className="px-4 py-2 text-left">Rank</th>
                    <th className="px-4 py-2 text-left">Company</th>
                    <th className="px-4 py-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.distributorPerformance?.length > 0 ? (
                    data.distributorPerformance.map((item, idx) => (
                      <tr key={item.dealerId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                        <td className="px-4 py-2.5">
                          <span className={`w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center ${
                            idx === 0 ? 'bg-amber-400 text-white' :
                            idx === 1 ? 'bg-slate-300 text-slate-700' :
                            idx === 2 ? 'bg-orange-400 text-white' :
                            'bg-slate-100 text-slate-500'
                          }`}>{idx + 1}</span>
                        </td>
                        <td className="px-4 py-2.5 font-bold text-slate-800">{item.companyName}</td>
                        <td className="px-4 py-2.5 text-right font-black text-indigo-600">{fmt(item.totalAmount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-400 text-xs">No distributor billing data yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
