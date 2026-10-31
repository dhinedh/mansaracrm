// src/pages/admin/AdminSalesTeamPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Plus, Search, ShieldCheck, MapPin, 
  Phone, Mail, DollarSign, Target, Award, Edit3, X, Check,
  Eye, ExternalLink, ShoppingBag, Receipt, Calendar, TrendingUp,
  Clock, CheckCircle2, AlertCircle, Truck, FileText, Building2,
  Store, Package, ListTodo, ChevronRight, BarChart3
} from 'lucide-react';

export default function AdminSalesTeamPage() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Create / Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [designation, setDesignation] = useState('Field Sales Executive');
  const [employeeCode, setEmployeeCode] = useState('');
  const [assignedZones, setAssignedZones] = useState('Chennai North, Chennai South');
  const [monthlyTarget, setMonthlyTarget] = useState('100000');
  const [dailyVisitsTarget, setDailyVisitsTarget] = useState('6');
  const [activeBeatRoute, setActiveBeatRoute] = useState('Beat A - North Commercial Hub');
  const [submitting, setSubmitting] = useState(false);

  // 360° Detailed Dossier Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedRepData, setSelectedRepData] = useState(null);
  const [detailTab, setDetailTab] = useState('overview'); // 'overview', 'visits', 'orders', 'collections', 'approvals'

  const fetchTeam = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/field-sales/admin/team');
      if (res.data?.success) {
        setTeam(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching sales team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleOpenDetails = async (idOrCode) => {
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailTab('todo');
    try {
      const res = await axios.get(`/field-sales/admin/team/${idOrCode}/details`);
      if (res.data?.success) {
        setSelectedRepData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching salesperson details:', err);
      alert('Could not load salesperson details.');
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingUserId(null);
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setDesignation('Field Sales Executive');
    setEmployeeCode('SALES-' + Math.floor(100 + Math.random() * 900));
    setAssignedZones('Chennai North, Chennai Central');
    setMonthlyTarget('100000');
    setDailyVisitsTarget('6');
    setActiveBeatRoute('Beat A - Commercial Beat');
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingUserId(item.user._id);
    setName(item.user.name);
    setEmail(item.user.email);
    setPhone(item.user.phone || '');
    setPassword('');
    setDesignation(item.profile?.designation || 'Field Sales Executive');
    setEmployeeCode(item.profile?.employeeCode || '');
    setAssignedZones(item.profile?.assignedZones?.join(', ') || 'Chennai');
    setMonthlyTarget(String(item.profile?.monthlyTarget || 100000));
    setDailyVisitsTarget(String(item.profile?.dailyVisitsTarget || 6));
    setActiveBeatRoute(item.profile?.activeBeatRoute || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const zonesArray = assignedZones.split(',').map(z => z.trim()).filter(Boolean);
      
      if (editingUserId) {
        await axios.put(`/field-sales/admin/team/${editingUserId}`, {
          name,
          phone,
          designation,
          employeeCode,
          assignedZones: zonesArray,
          monthlyTarget: parseFloat(monthlyTarget),
          dailyVisitsTarget: parseInt(dailyVisitsTarget),
          activeBeatRoute
        });
        alert('Salesperson updated successfully');
      } else {
        await axios.post('/field-sales/admin/team', {
          name,
          email,
          phone,
          password,
          designation,
          employeeCode,
          assignedZones: zonesArray,
          monthlyTarget: parseFloat(monthlyTarget),
          dailyVisitsTarget: parseInt(dailyVisitsTarget),
          activeBeatRoute
        });
        alert('New salesperson account created successfully');
      }
      setModalOpen(false);
      fetchTeam();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save salesperson');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTeam = team.filter((item) => {
    const q = search.toLowerCase();
    const nameMatch = item.user.name?.toLowerCase().includes(q);
    const emailMatch = item.user.email?.toLowerCase().includes(q);
    const codeMatch = item.profile?.employeeCode?.toLowerCase().includes(q);
    return nameMatch || emailMatch || codeMatch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Field Sales Team Directory & Roster
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage sales representatives, credential access, target quotas, and territory designations
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Salesperson</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or employee code..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 shadow-sm"
        />
      </div>

      {/* Sales Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeam.map((item) => (
          <div 
            key={item.user._id} 
            onClick={(e) => {
              if (e.target.closest('.edit-target-btn')) return;
              handleOpenDetails(item.user._id);
            }}
            className="bg-white border border-slate-200 hover:border-rose-400 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform"
                    title="Click to view full performance dossier"
                  >
                    {item.user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 
                      className="text-sm font-black text-slate-800 leading-tight group-hover:text-rose-600 transition-colors"
                      title="Click to view full performance dossier"
                    >
                      {item.user.name}
                    </h3>
                    <div
                      className="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200/60"
                      title="Click salesperson to view complete performance"
                    >
                      <span>{item.profile?.employeeCode || 'SALES-001'}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </div>
                  </div>
                </div>

                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  item.user.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {item.user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{item.user.email}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{item.user.phone || 'N/A'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">{item.profile?.activeBeatRoute || 'Beat Route A'}</span>
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly Target</span>
                  <p className="text-xs font-black text-slate-800">₹{(item.profile?.monthlyTarget || 100000).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Daily Target</span>
                  <p className="text-xs font-black text-emerald-600">{item.profile?.dailyVisitsTarget || 6} Visits/day</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleOpenDetails(item.user._id)}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border border-rose-200"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View Details</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEdit(item);
                }}
                className="edit-target-btn bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Targets</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ─── 360° SALESPERSON DETAIL DOSSIER MODAL ─────────────────────────────────── */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-4xl p-5 sm:p-6 shadow-2xl relative my-6 max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={() => setDetailModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {detailLoading || !selectedRepData ? (
              <div className="p-16 text-center text-slate-400 text-xs">
                <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                Loading comprehensive salesperson dossier...
              </div>
            ) : (
              <div className="space-y-5 overflow-y-auto pr-1">
                {/* Rep Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-amber-500/20">
                      {selectedRepData.user.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-slate-800">{selectedRepData.user.name}</h2>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          selectedRepData.user.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {selectedRepData.user.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {selectedRepData.profile?.designation || 'Field Sales Executive'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                        <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/50">
                          ID: {selectedRepData.profile?.employeeCode || 'SALES-001'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {selectedRepData.user.email}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {selectedRepData.user.phone || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const repItem = team.find(t => t.user._id === selectedRepData.user._id);
                        if (repItem) {
                          setDetailModalOpen(false);
                          handleOpenEdit(repItem);
                        }
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Targets & Beat</span>
                    </button>
                  </div>
                </div>

                {/* 4 Metric KPI Cards with Comprehensive Performance */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* KPI 1: Store Visit Target Set vs Target Achieved */}
                  <div className="bg-rose-50/60 border border-rose-100 p-3.5 rounded-2xl">
                    <div className="flex items-center justify-between text-rose-700 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Store Visit Target & Quota</span>
                      <Target className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-base font-black text-rose-900">
                      {selectedRepData.metrics.completedVisits || 0} / {selectedRepData.metrics.monthlyVisitsTarget || ((selectedRepData.metrics.dailyVisitsTarget || 6) * 26)} Visits
                    </div>
                    <p className="text-[10px] text-rose-600 mt-0.5 font-medium">
                      Daily Target: <strong className="text-rose-800">{selectedRepData.metrics.dailyVisitsTarget || 6}</strong> stores/day
                    </p>
                    <div className="w-full bg-rose-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-rose-600 h-full rounded-full transition-all" 
                        style={{ width: `${Math.min(selectedRepData.metrics.monthVisitsAchievementPct || 0, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-black text-rose-700 mt-1">
                      <span>{selectedRepData.metrics.monthVisitsAchievementPct || 0}% Monthly Achieved</span>
                      <span>Today: {selectedRepData.metrics.todayCompletedVisits || 0}/{selectedRepData.metrics.dailyVisitsTarget || 6}</span>
                    </div>
                  </div>

                  {/* KPI 2: Today Store Visits & Sales */}
                  <div className="bg-emerald-50/60 border border-emerald-100 p-3.5 rounded-2xl">
                    <div className="flex items-center justify-between text-emerald-700 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Today Store Visits</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-base font-black text-emerald-900">
                      {selectedRepData.metrics.todayCompletedVisits || 0} Done Today
                    </div>
                    <p className="text-[10px] text-emerald-600 mt-0.5">
                      {selectedRepData.metrics.todayVisitsCount || 0} Logged • {selectedRepData.metrics.todayVisitsAchievementPct || 0}% Target
                    </p>
                    <div className="mt-2 pt-1 border-t border-emerald-100/80 flex items-center justify-between text-[10px]">
                      <span className="text-emerald-700 font-bold">Today Sales:</span>
                      <strong className="text-emerald-950 font-mono font-bold">₹{(selectedRepData.metrics.todaySales || 0).toLocaleString('en-IN')}</strong>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-700 mt-0.5 block">
                      {selectedRepData.metrics.todayProductsSoldQty || 0} units saled today
                    </span>
                  </div>

                  {/* KPI 3: Totally How Many Stores Visited */}
                  <div className="bg-blue-50/60 border border-blue-100 p-3.5 rounded-2xl">
                    <div className="flex items-center justify-between text-blue-700 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Total Stores Visited</span>
                      <Store className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-base font-black text-blue-900">
                      {selectedRepData.metrics.allTimeVisitsCount || 0} Total Visits
                    </div>
                    <p className="text-[10px] text-blue-600 mt-0.5 font-medium">
                      Covered <strong className="text-blue-900 font-bold">{selectedRepData.metrics.totalUniqueStoresVisited || 0}</strong> Unique Outlets
                    </p>
                    <div className="mt-2 pt-1 border-t border-blue-100/80 flex items-center justify-between text-[10px]">
                      <span className="text-blue-700 font-bold">This Month:</span>
                      <strong className="text-blue-950 font-bold">{selectedRepData.metrics.monthVisitsCount || 0} visits</strong>
                    </div>
                    <span className="text-[9px] font-bold text-blue-700 mt-0.5 block">
                      Collected ₹{(selectedRepData.metrics.totalCollected || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* KPI 4: How Many Products Saled & Revenue */}
                  <div className="bg-amber-50/60 border border-amber-100 p-3.5 rounded-2xl">
                    <div className="flex items-center justify-between text-amber-700 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Products Saled & Revenue</span>
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-base font-black text-amber-900">
                      {(selectedRepData.metrics.totalProductsSoldQty || 0).toLocaleString()} Units Saled
                    </div>
                    <p className="text-[10px] text-amber-700 mt-0.5">
                      MTD: {(selectedRepData.metrics.monthProductsSoldQty || 0).toLocaleString()} units • ₹{(selectedRepData.metrics.actualSales || 0).toLocaleString('en-IN')}
                    </p>
                    <div className="w-full bg-amber-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-amber-600 h-full rounded-full transition-all" 
                        style={{ width: `${Math.min(selectedRepData.metrics.achievementPct || 0, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-[9px] font-bold text-amber-800 mt-1 block">
                      {selectedRepData.metrics.achievementPct || 0}% Sales Quota Achieved
                    </span>
                  </div>
                </div>

                {/* Subtabs Navigation */}
                <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 text-xs overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setDetailTab('todo')}
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      detailTab === 'todo' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ListTodo className="w-3.5 h-3.5" />
                    <span>Today To-Do ({selectedRepData.todayToDo?.length || 0})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('today_visits')}
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      detailTab === 'today_visits' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Today Store Visits ({selectedRepData.todayVisits?.length || 0})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('month_wise')}
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      detailTab === 'month_wise' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Month-Wise Performance</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('products')}
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      detailTab === 'products' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Products Saled ({selectedRepData.topProductsSold?.length || 0})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('visits')}
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      detailTab === 'visits' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>All Visits ({selectedRepData.recentVisits?.length || 0})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('orders')}
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      detailTab === 'orders' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Orders ({selectedRepData.recentOrders?.length || 0})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('collections')}
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      detailTab === 'collections' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Collections ({selectedRepData.recentCollections?.length || 0})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('overview')}
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      detailTab === 'overview' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Territory & Quotas</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('approvals')}
                    className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      detailTab === 'approvals' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Commercial ({selectedRepData.quotations?.length + selectedRepData.margins?.length})</span>
                  </button>
                </div>

                {/* Tab: Today To-Do */}
                {detailTab === 'todo' && (
                  <div className="space-y-3">
                    {/* Summary Counter Bar */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
                          <ListTodo className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">Today's Field Action Plan & Daily Beat To-Do</h4>
                          <p className="text-[11px] text-slate-500">Scheduled visits, daily beat stores, and priority follow-ups for today</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-700">
                          Total: <strong className="text-slate-900">{selectedRepData.todayToDo?.length || 0}</strong>
                        </span>
                        <span className="bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg text-[11px] font-bold text-emerald-700">
                          Completed: <strong>{selectedRepData.todayToDo?.filter(t => t.isCompleted || t.status === 'COMPLETED').length || 0}</strong>
                        </span>
                        <span className="bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg text-[11px] font-bold text-amber-700">
                          In Progress: <strong>{selectedRepData.todayToDo?.filter(t => t.status === 'IN_PROGRESS').length || 0}</strong>
                        </span>
                        <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-600">
                          Pending: <strong>{selectedRepData.todayToDo?.filter(t => !t.isCompleted && t.status !== 'COMPLETED' && t.status !== 'IN_PROGRESS').length || 0}</strong>
                        </span>
                      </div>
                    </div>

                    {/* To-Do Items List */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-3.5 py-2.5">Status</th>
                            <th className="px-3.5 py-2.5">Store / Target</th>
                            <th className="px-3.5 py-2.5">Schedule Type</th>
                            <th className="px-3.5 py-2.5">Purpose to Visit</th>
                            <th className="px-3.5 py-2.5">Priority</th>
                            <th className="px-3.5 py-2.5">Contact</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {(!selectedRepData.todayToDo || selectedRepData.todayToDo.length === 0) ? (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-slate-400">
                                <ListTodo className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                No to-do tasks or scheduled beat stores registered for today.
                              </td>
                            </tr>
                          ) : (
                            selectedRepData.todayToDo.map((task, idx) => {
                              const isDone = task.isCompleted || task.status === 'COMPLETED';
                              const inProg = task.status === 'IN_PROGRESS';
                              return (
                                <tr key={task.id || idx} className={`hover:bg-slate-50 transition-colors ${isDone ? 'bg-emerald-50/20' : ''}`}>
                                  <td className="px-3.5 py-2.5">
                                    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
                                      isDone ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                      inProg ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse' :
                                      'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}>
                                      {isDone ? <Check className="w-3 h-3 text-emerald-700" /> : <Clock className="w-3 h-3" />}
                                      {isDone ? 'Completed' : inProg ? 'In Progress' : 'Pending'}
                                    </span>
                                  </td>
                                  <td className="px-3.5 py-2.5">
                                    <span className="font-bold text-slate-900 block">{task.storeName}</span>
                                    <p className="text-[10px] text-slate-400 truncate max-w-xs">{task.storeAddress || 'Daily Beat Route'}</p>
                                  </td>
                                  <td className="px-3.5 py-2.5">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                      task.type === 'BEAT_ROUTE_STORE' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                      task.type === 'SCHEDULED_VISIT' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                      'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}>
                                      {task.type === 'BEAT_ROUTE_STORE' ? 'Daily Beat Store' :
                                       task.type === 'SCHEDULED_VISIT' ? 'Scheduled Visit' : 'Follow-Up Task'}
                                    </span>
                                  </td>
                                  <td className="px-3.5 py-2.5 font-medium text-slate-700">
                                    {task.purpose || 'Store Visit & Order Booking'}
                                  </td>
                                  <td className="px-3.5 py-2.5">
                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                      task.priority === 'URGENT' ? 'bg-rose-100 text-rose-700' :
                                      task.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                                      'bg-slate-100 text-slate-600'
                                    }`}>
                                      {task.priority || 'NORMAL'}
                                    </span>
                                  </td>
                                  <td className="px-3.5 py-2.5 text-[11px] text-slate-500 font-mono">
                                    {task.storePhone || '—'}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab: Today Store Visits */}
                {detailTab === 'today_visits' && (
                  <div className="space-y-3">
                    {/* Today Visits Summary Bar */}
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div>
                        <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Today's Store Visits Log</span>
                        </h4>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          Visits conducted today with check-in, purpose, outcome, orders, and collections
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-600 font-bold block uppercase">Today Booked</span>
                          <span className="font-mono font-black text-emerald-900 text-sm">₹{(selectedRepData.metrics.todaySales || 0).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="h-6 w-px bg-emerald-200"></div>
                        <div className="text-right">
                          <span className="text-[10px] text-emerald-600 font-bold block uppercase">Today Collected</span>
                          <span className="font-mono font-black text-emerald-900 text-sm">₹{(selectedRepData.metrics.todayCollected || 0).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-3.5 py-2.5">Check-In / Out</th>
                            <th className="px-3.5 py-2.5">Retail Store</th>
                            <th className="px-3.5 py-2.5">Purpose to Visit</th>
                            <th className="px-3.5 py-2.5">Outcome</th>
                            <th className="px-3.5 py-2.5">Order Booked</th>
                            <th className="px-3.5 py-2.5">Collected</th>
                            <th className="px-3.5 py-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {(!selectedRepData.todayVisits || selectedRepData.todayVisits.length === 0) ? (
                            <tr>
                              <td colSpan="7" className="p-8 text-center text-slate-400">
                                <Store className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                No store visits logged by this salesperson today yet.
                              </td>
                            </tr>
                          ) : (
                            selectedRepData.todayVisits.map((v) => {
                              const checkIn = v.checkInTime ? new Date(v.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
                              const checkOut = v.checkOutTime ? new Date(v.checkOutTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null;
                              return (
                                <tr key={v._id} className="hover:bg-slate-50">
                                  <td className="px-3.5 py-2.5 font-mono text-[11px]">
                                    <span className="font-bold text-slate-800">{checkIn}</span>
                                    {checkOut && <p className="text-[10px] text-emerald-600">Out: {checkOut}</p>}
                                  </td>
                                  <td className="px-3.5 py-2.5">
                                    <span className="font-bold text-slate-900 block">{v.storeId?.name || v.storeName || 'Retail Outlet'}</span>
                                    <p className="text-[10px] text-slate-400 truncate max-w-xs">{v.storeId?.address || 'Beat Route'}</p>
                                  </td>
                                  <td className="px-3.5 py-2.5 font-medium text-slate-700">
                                    {v.purpose || 'Store Visit & Order Booking'}
                                  </td>
                                  <td className="px-3.5 py-2.5 text-slate-600 max-w-xs truncate">
                                    {v.outcome || 'Check-in completed'}
                                  </td>
                                  <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900">
                                    {v.orderValue > 0 ? `₹${v.orderValue.toLocaleString('en-IN')}` : '—'}
                                  </td>
                                  <td className="px-3.5 py-2.5 font-mono font-bold text-emerald-600">
                                    {v.paymentsCollected > 0 ? `₹${v.paymentsCollected.toLocaleString('en-IN')}` : '—'}
                                  </td>
                                  <td className="px-3.5 py-2.5">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      v.checkOutTime ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                                    }`}>
                                      {v.checkOutTime ? 'Completed' : 'In-Store Active'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab: Month-Wise Performance Breakdown */}
                {detailTab === 'month_wise' && (
                  <div className="space-y-3">
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3 flex items-center justify-between text-xs">
                      <div>
                        <h4 className="font-bold text-indigo-950 flex items-center gap-1.5">
                          <BarChart3 className="w-4 h-4 text-indigo-600" />
                          <span>Month-Wise Historical Performance Dossier</span>
                        </h4>
                        <p className="text-[11px] text-indigo-700 mt-0.5">
                          Store visit quotas vs achieved, secondary sales targets, products saled, and collections (Last 6 Months)
                        </p>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-900 bg-white border border-indigo-200 px-2.5 py-1 rounded-lg">
                        Quota Base: {selectedRepData.metrics.dailyVisitsTarget || 6} visits/day (~{(selectedRepData.metrics.dailyVisitsTarget || 6) * 26}/month)
                      </span>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-3.5 py-2.5">Month</th>
                            <th className="px-3.5 py-2.5">Store Visits (Target vs Achieved)</th>
                            <th className="px-3.5 py-2.5">Sales Target vs Achieved</th>
                            <th className="px-3.5 py-2.5">Products Saled</th>
                            <th className="px-3.5 py-2.5">Collections Handover</th>
                            <th className="px-3.5 py-2.5">Performance Rating</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {(!selectedRepData.monthWiseStats || selectedRepData.monthWiseStats.length === 0) ? (
                            <tr>
                              <td colSpan="6" className="p-8 text-center text-slate-400">
                                No monthly performance history available yet.
                              </td>
                            </tr>
                          ) : (
                            selectedRepData.monthWiseStats.map((m, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-3.5 py-2.5 font-bold text-slate-900 whitespace-nowrap">
                                  {m.month}
                                  {idx === 0 && <span className="ml-1.5 text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-black">Current</span>}
                                </td>
                                <td className="px-3.5 py-2.5">
                                  <div className="flex items-center justify-between text-[11px] font-mono">
                                    <strong className="text-slate-900">{m.completedVisits}</strong>
                                    <span className="text-slate-400">/ {m.visitsTarget} visits</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                                    <div 
                                      className="bg-emerald-500 h-full rounded-full" 
                                      style={{ width: `${Math.min(m.visitsAchievementPct, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-[9px] font-bold text-emerald-700 mt-0.5 block">{m.visitsAchievementPct}% Visits Achieved</span>
                                </td>
                                <td className="px-3.5 py-2.5">
                                  <div className="flex items-center justify-between text-[11px] font-mono">
                                    <strong className="text-rose-600">₹{(m.actualSales || 0).toLocaleString('en-IN')}</strong>
                                    <span className="text-slate-400">/ ₹{(m.salesTarget || 0).toLocaleString('en-IN')}</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                                    <div 
                                      className="bg-rose-500 h-full rounded-full" 
                                      style={{ width: `${Math.min(m.salesAchievementPct, 100)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-[9px] font-bold text-rose-700 mt-0.5 block">{m.salesAchievementPct}% Sales Achieved</span>
                                </td>
                                <td className="px-3.5 py-2.5 font-mono font-bold text-slate-800">
                                  {(m.productsSoldQty || 0).toLocaleString()} units
                                </td>
                                <td className="px-3.5 py-2.5 font-mono font-bold text-emerald-600">
                                  ₹{(m.totalCollected || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="px-3.5 py-2.5">
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    m.salesAchievementPct >= 100 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                    m.salesAchievementPct >= 70 ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                    m.salesAchievementPct >= 40 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                    'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}>
                                    {m.salesAchievementPct >= 100 ? '⭐ Overachieved' :
                                     m.salesAchievementPct >= 70 ? 'On Track' :
                                     m.salesAchievementPct >= 40 ? 'In Progress' : 'Needs Focus'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab: Products Saled */}
                {detailTab === 'products' && (
                  <div className="space-y-3">
                    {/* Products Saled Metrics Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                      <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-amber-700 uppercase">Total Products Saled</span>
                        <div className="text-lg font-black text-amber-950 font-mono mt-0.5">
                          {(selectedRepData.metrics.totalProductsSoldQty || 0).toLocaleString()} Units
                        </div>
                        <span className="text-[10px] text-amber-600">All-time volume</span>
                      </div>
                      <div className="bg-rose-50 border border-rose-200/80 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-rose-700 uppercase">This Month Saled</span>
                        <div className="text-lg font-black text-rose-950 font-mono mt-0.5">
                          {(selectedRepData.metrics.monthProductsSoldQty || 0).toLocaleString()} Units
                        </div>
                        <span className="text-[10px] text-rose-600">Current MTD</span>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200/80 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-emerald-700 uppercase">Today Saled</span>
                        <div className="text-lg font-black text-emerald-950 font-mono mt-0.5">
                          {(selectedRepData.metrics.todayProductsSoldQty || 0).toLocaleString()} Units
                        </div>
                        <span className="text-[10px] text-emerald-600">Booked today</span>
                      </div>
                      <div className="bg-blue-50 border border-blue-200/80 p-3 rounded-xl">
                        <span className="text-[10px] font-bold text-blue-700 uppercase">Total Sales Value</span>
                        <div className="text-lg font-black text-blue-950 font-mono mt-0.5">
                          ₹{(selectedRepData.metrics.allTimeSales || 0).toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-blue-600">{selectedRepData.metrics.ordersBookedCount || 0} orders total</span>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-3.5 py-2.5">#</th>
                            <th className="px-3.5 py-2.5">Product SKU / Name</th>
                            <th className="px-3.5 py-2.5">Units / Quantity Saled</th>
                            <th className="px-3.5 py-2.5">Revenue Generated (₹)</th>
                            <th className="px-3.5 py-2.5">Volume Proportion</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {(!selectedRepData.topProductsSold || selectedRepData.topProductsSold.length === 0) ? (
                            <tr>
                              <td colSpan="5" className="p-8 text-center text-slate-400">
                                <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                No product sales recorded for this representative yet.
                              </td>
                            </tr>
                          ) : (
                            selectedRepData.topProductsSold.map((prod, idx) => {
                              const totalQty = selectedRepData.metrics.totalProductsSoldQty || 1;
                              const sharePct = Math.round((prod.quantity / totalQty) * 100);
                              return (
                                <tr key={prod.name || idx} className="hover:bg-slate-50">
                                  <td className="px-3.5 py-2.5 font-bold text-slate-400 text-[11px]">{idx + 1}</td>
                                  <td className="px-3.5 py-2.5">
                                    <span className="font-bold text-slate-900 block">{prod.name}</span>
                                  </td>
                                  <td className="px-3.5 py-2.5 font-mono font-black text-slate-800">
                                    {prod.quantity.toLocaleString()} units
                                  </td>
                                  <td className="px-3.5 py-2.5 font-mono font-black text-amber-600">
                                    ₹{prod.revenue.toLocaleString('en-IN')}
                                  </td>
                                  <td className="px-3.5 py-2.5">
                                    <div className="flex items-center gap-2">
                                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div 
                                          className="bg-amber-500 h-full rounded-full" 
                                          style={{ width: `${Math.min(sharePct * 2, 100)}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-500">{sharePct}%</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Tab: Territory & Beat Overview */}
                {detailTab === 'overview' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span>Territory Assignment</span>
                      </h4>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Active Beat Route</span>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">
                          {selectedRepData.profile?.activeBeatRoute || 'Beat Route A - North Retail Hub'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Assigned Zones</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedRepData.profile?.assignedZones?.map((z, idx) => (
                            <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                              {z}
                            </span>
                          )) || <span className="text-slate-500">Chennai Regional</span>}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Account Status</span>
                        <p className="text-slate-700 mt-0.5 font-semibold">
                          Staff Access Level: <strong className="text-slate-900">{selectedRepData.user.role}</strong>
                        </p>
                        <p className="text-slate-400 text-[11px] mt-0.5">
                          Account Created: {new Date(selectedRepData.user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                      <h4 className="font-black text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>Operational Quotas & Targets</span>
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-1 border-b border-slate-200">
                          <span className="text-slate-600">Monthly Sales Target</span>
                          <strong className="text-slate-900">₹{(selectedRepData.metrics.monthlyTarget || 0).toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200">
                          <span className="text-slate-600">Actual Sales Booked MTD</span>
                          <strong className="text-rose-600">₹{(selectedRepData.metrics.actualSales || 0).toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200">
                          <span className="text-slate-600">Daily Retail Store Visits</span>
                          <strong className="text-emerald-700">{selectedRepData.metrics.dailyVisitsTarget} Visits / Day</strong>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200">
                          <span className="text-slate-600">Lifetime Orders Value</span>
                          <strong className="text-slate-900">₹{(selectedRepData.metrics.allTimeSales || 0).toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-600">Total Visits Conducted</span>
                          <strong className="text-slate-900">{selectedRepData.metrics.allTimeVisitsCount} Stores</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Recent Visits */}
                {detailTab === 'visits' && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-3.5 py-2.5">Date & Time</th>
                          <th className="px-3.5 py-2.5">Retail Store</th>
                          <th className="px-3.5 py-2.5">Outcome</th>
                          <th className="px-3.5 py-2.5">Order Value</th>
                          <th className="px-3.5 py-2.5">Collected</th>
                          <th className="px-3.5 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {selectedRepData.recentVisits.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="p-8 text-center text-slate-400">
                              No store visits recorded for this representative yet.
                            </td>
                          </tr>
                        ) : (
                          selectedRepData.recentVisits.map((v) => (
                            <tr key={v._id} className="hover:bg-slate-50">
                              <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-500">
                                {new Date(v.checkInTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                <p className="text-[10px] text-slate-400">
                                  {new Date(v.checkInTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </td>
                              <td className="px-3.5 py-2.5">
                                <span className="font-bold text-slate-800">{v.storeId?.name || v.storeName || 'Store Visit'}</span>
                                <p className="text-[10px] text-slate-400 truncate max-w-xs">{v.storeId?.address || 'Field Visit'}</p>
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-600 max-w-xs truncate">
                                {v.outcome || 'Check-in completed'}
                              </td>
                              <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900">
                                {v.orderValue > 0 ? `₹${v.orderValue.toLocaleString('en-IN')}` : '—'}
                              </td>
                              <td className="px-3.5 py-2.5 font-mono font-bold text-emerald-600">
                                {v.paymentsCollected > 0 ? `₹${v.paymentsCollected.toLocaleString('en-IN')}` : '—'}
                              </td>
                              <td className="px-3.5 py-2.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  v.checkOutTime ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {v.checkOutTime ? 'Completed' : 'Active'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab 3: Booked Orders */}
                {detailTab === 'orders' && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-3.5 py-2.5">Order Number</th>
                          <th className="px-3.5 py-2.5">Date</th>
                          <th className="px-3.5 py-2.5">Retail Customer</th>
                          <th className="px-3.5 py-2.5">Distributor Dealer</th>
                          <th className="px-3.5 py-2.5">Total Amount</th>
                          <th className="px-3.5 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {selectedRepData.recentOrders.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="p-8 text-center text-slate-400">
                              No secondary sales orders booked by this representative yet.
                            </td>
                          </tr>
                        ) : (
                          selectedRepData.recentOrders.map((o) => (
                            <tr key={o._id} className="hover:bg-slate-50">
                              <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900">
                                {o.orderNumber}
                              </td>
                              <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-500">
                                {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </td>
                              <td className="px-3.5 py-2.5 font-bold text-slate-800">
                                {o.storeName || o.storeId?.name || 'Retail Outlet'}
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-600">
                                {o.dealerId?.companyName || 'Assigned Distributor'}
                              </td>
                              <td className="px-3.5 py-2.5 font-mono font-black text-rose-600">
                                ₹{(o.totalAmount || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="px-3.5 py-2.5">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  o.status === 'APPROVED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                  o.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {o.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab 4: Collections */}
                {detailTab === 'collections' && (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-3.5 py-2.5">Date</th>
                          <th className="px-3.5 py-2.5">Customer Shop</th>
                          <th className="px-3.5 py-2.5">Amount (₹)</th>
                          <th className="px-3.5 py-2.5">Payment Method</th>
                          <th className="px-3.5 py-2.5">Reference / Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {selectedRepData.recentCollections.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="p-8 text-center text-slate-400">
                              No payment collections recorded by this representative yet.
                            </td>
                          </tr>
                        ) : (
                          selectedRepData.recentCollections.map((c) => (
                            <tr key={c._id} className="hover:bg-slate-50">
                              <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-500">
                                {new Date(c.checkInTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                              </td>
                              <td className="px-3.5 py-2.5 font-bold text-slate-800">
                                {c.storeId?.name || 'Retail Customer'}
                              </td>
                              <td className="px-3.5 py-2.5 font-mono font-black text-emerald-600 text-sm">
                                ₹{(c.paymentsCollected || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="px-3.5 py-2.5">
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                  {c.paymentMethod || 'CASH'}
                                </span>
                              </td>
                              <td className="px-3.5 py-2.5 text-slate-500 text-[11px]">
                                {c.outcome || 'Payment collection'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tab 5: Commercial Approvals */}
                {detailTab === 'approvals' && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Special Margin Requests</h4>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] border-b border-slate-200">
                            <tr>
                              <th className="px-3 py-2">Customer / Store</th>
                              <th className="px-3 py-2">Product</th>
                              <th className="px-3 py-2">Requested Margin</th>
                              <th className="px-3 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {selectedRepData.margins.length === 0 ? (
                              <tr><td colSpan="4" className="p-4 text-center text-slate-400">No margin requests logged.</td></tr>
                            ) : (
                              selectedRepData.margins.map((m) => (
                                <tr key={m._id}>
                                  <td className="px-3 py-2 font-bold">{m.store?.name || 'Customer'}</td>
                                  <td className="px-3 py-2 text-slate-600">{m.product?.name || 'All Products'}</td>
                                  <td className="px-3 py-2 font-mono font-bold text-rose-600">{m.marginPercent}%</td>
                                  <td className="px-3 py-2">
                                    <span className="text-[10px] font-bold uppercase">{m.status}</span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">Quotations Submitted</h4>
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] border-b border-slate-200">
                            <tr>
                              <th className="px-3 py-2">Quote No</th>
                              <th className="px-3 py-2">Customer</th>
                              <th className="px-3 py-2">Total Value</th>
                              <th className="px-3 py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {selectedRepData.quotations.length === 0 ? (
                              <tr><td colSpan="4" className="p-4 text-center text-slate-400">No quotations generated yet.</td></tr>
                            ) : (
                              selectedRepData.quotations.map((q) => (
                                <tr key={q._id}>
                                  <td className="px-3 py-2 font-mono font-bold">{q.quotationNo}</td>
                                  <td className="px-3 py-2 font-bold">{q.customerName}</td>
                                  <td className="px-3 py-2 font-mono font-black text-amber-600">₹{(q.grandTotal || 0).toLocaleString('en-IN')}</td>
                                  <td className="px-3 py-2">
                                    <span className="text-[10px] font-bold uppercase">{q.status}</span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg p-6 shadow-2xl relative my-8">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-slate-800 mb-1">
              {editingUserId ? 'Edit Salesperson & Targets' : 'Add New Field Salesperson'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Configure credentials, beat assignment, monthly quota, and territory permissions
            </p>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Karthik Raja"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Employee Code *</label>
                  <input
                    type="text"
                    required
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="e.g. SALES-001"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Email ID *</label>
                  <input
                    type="email"
                    required
                    disabled={!!editingUserId}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sales@mansarafoods.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 12345"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {!editingUserId && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Login Password *</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Monthly Sales Target (₹)</label>
                  <input
                    type="number"
                    value={monthlyTarget}
                    onChange={(e) => setMonthlyTarget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Daily Visits Quota</label>
                  <input
                    type="number"
                    value={dailyVisitsTarget}
                    onChange={(e) => setDailyVisitsTarget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Active Beat Route</label>
                <input
                  type="text"
                  value={activeBeatRoute}
                  onChange={(e) => setActiveBeatRoute(e.target.value)}
                  placeholder="e.g. Beat A - North Chennai Commercial Beat"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Assigned Zones (comma separated)</label>
                <input
                  type="text"
                  value={assignedZones}
                  onChange={(e) => setAssignedZones(e.target.value)}
                  placeholder="Chennai North, Central Hub"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-xs active:scale-95 transition-all shadow-md cursor-pointer"
              >
                {submitting ? 'Saving Salesperson...' : (editingUserId ? 'Update Sales Executive' : 'Create Sales Account')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
