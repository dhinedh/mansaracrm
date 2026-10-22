// src/pages/admin/AdminSalesTeamPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, Plus, Search, ShieldCheck, MapPin, 
  Phone, Mail, DollarSign, Target, Award, Edit3, X, Check,
  Eye, ExternalLink, ShoppingBag, Receipt, Calendar, TrendingUp,
  Clock, CheckCircle2, AlertCircle, Truck, FileText, Building2
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
    setDetailTab('overview');
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
            className="bg-white border border-slate-200 hover:border-rose-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div 
                    onClick={() => handleOpenDetails(item.user._id)}
                    className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center font-black text-white text-sm shadow-md shadow-amber-500/20 cursor-pointer hover:scale-105 transition-transform"
                    title="Click to view full 360° profile"
                  >
                    {item.user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 
                      onClick={() => handleOpenDetails(item.user._id)}
                      className="text-sm font-black text-slate-800 leading-tight hover:text-rose-600 cursor-pointer transition-colors"
                      title="Click to view full 360° profile"
                    >
                      {item.user.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleOpenDetails(item.user._id)}
                      className="mt-0.5 inline-flex items-center gap-1 font-mono text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md transition-all cursor-pointer border border-rose-200/60"
                      title="Click salesperson ID to view complete dossier"
                    >
                      <span>{item.profile?.employeeCode || 'SALES-001'}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
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
                onClick={() => handleOpenEdit(item)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
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

                {/* 4 Metric KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-rose-50/60 border border-rose-100 p-3.5 rounded-2xl">
                    <div className="flex items-center justify-between text-rose-700 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">MTD Sales Target</span>
                      <Target className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-base font-black text-rose-900">
                      ₹{(selectedRepData.metrics.actualSales || 0).toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-rose-600 mt-0.5">
                      Target: ₹{(selectedRepData.metrics.monthlyTarget || 0).toLocaleString('en-IN')}
                    </p>
                    <div className="w-full bg-rose-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-rose-600 h-full rounded-full transition-all" 
                        style={{ width: `${Math.min(selectedRepData.metrics.achievementPct || 0, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-[9px] font-black text-rose-700 mt-1 block">
                      {selectedRepData.metrics.achievementPct}% Quota Achieved
                    </span>
                  </div>

                  <div className="bg-emerald-50/60 border border-emerald-100 p-3.5 rounded-2xl">
                    <div className="flex items-center justify-between text-emerald-700 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Visits Compliance</span>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-base font-black text-emerald-900">
                      {selectedRepData.metrics.completedVisits} Completed
                    </div>
                    <p className="text-[10px] text-emerald-600 mt-0.5">
                      Quota: {selectedRepData.metrics.dailyVisitsTarget} visits/day
                    </p>
                    <span className="text-[9px] font-bold text-emerald-700 mt-2 block">
                      {selectedRepData.metrics.monthVisitsCount} logged this month
                    </span>
                  </div>

                  <div className="bg-amber-50/60 border border-amber-100 p-3.5 rounded-2xl">
                    <div className="flex items-center justify-between text-amber-700 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Collections</span>
                      <Receipt className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-base font-black text-amber-900">
                      ₹{(selectedRepData.metrics.totalCollected || 0).toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-amber-600 mt-0.5">
                      Reconciled Cash & UPI
                    </p>
                    <span className="text-[9px] font-bold text-amber-700 mt-2 block">
                      {selectedRepData.recentCollections.length} verified handovers
                    </span>
                  </div>

                  <div className="bg-blue-50/60 border border-blue-100 p-3.5 rounded-2xl">
                    <div className="flex items-center justify-between text-blue-700 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Secondary Orders</span>
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-base font-black text-blue-900">
                      {selectedRepData.metrics.ordersBookedCount} Booked
                    </div>
                    <p className="text-[10px] text-blue-600 mt-0.5">
                      ₹{(selectedRepData.metrics.allTimeSales || 0).toLocaleString('en-IN')} Total Volume
                    </p>
                    <span className="text-[9px] font-bold text-blue-700 mt-2 block">
                      {selectedRepData.metrics.monthOrdersCount} booked this month
                    </span>
                  </div>
                </div>

                {/* Subtabs Navigation */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setDetailTab('overview')}
                    className={`px-3.5 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                      detailTab === 'overview' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Territory & Beat Overview
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('visits')}
                    className={`px-3.5 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                      detailTab === 'visits' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Recent Visits ({selectedRepData.recentVisits?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('orders')}
                    className={`px-3.5 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                      detailTab === 'orders' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Booked Orders ({selectedRepData.recentOrders?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('collections')}
                    className={`px-3.5 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                      detailTab === 'collections' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Collections ({selectedRepData.recentCollections?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailTab('approvals')}
                    className={`px-3.5 py-1.5 rounded-xl font-bold cursor-pointer transition-all ${
                      detailTab === 'approvals' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Commercial ({selectedRepData.quotations?.length + selectedRepData.margins?.length})
                  </button>
                </div>

                {/* Tab 1: Territory & Beat Overview */}
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
