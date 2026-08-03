// src/pages/admin/ExpensesPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Receipt, 
  Calendar, 
  MapPin, 
  Store, 
  DollarSign, 
  Upload, 
  Image as ImageIcon, 
  Loader2, 
  AlertTriangle,
  Search,
  Filter,
  FileText,
  Building2,
  TrendingUp,
  Tag,
  ArrowRight,
  X,
  Eye,
  PieChart,
  Grid,
  CheckCircle,
  Briefcase
} from 'lucide-react';
import { useAuthStore, BACKEND_URL } from '../../store/authStore';
import axiosInstance from 'axios';

// Category Styling Configuration
const CATEGORY_MAP = {
  TRAVEL:     { label: 'Travel & Transport', color: 'emerald', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', barBg: 'bg-emerald-500' },
  FOOD:       { label: 'Food & Meals',       color: 'amber',   bg: 'bg-amber-50 text-amber-700 border-amber-100',     barBg: 'bg-amber-500' },
  STATIONERY: { label: 'Office Supplies',    color: 'blue',    bg: 'bg-blue-50 text-blue-700 border-blue-100',       barBg: 'bg-blue-500' },
  MARKETING:  { label: 'Marketing & Promo',  color: 'rose',    bg: 'bg-rose-50 text-rose-700 border-rose-100',       barBg: 'bg-rose-500' },
  RENT:       { label: 'Rent & Utilities',   color: 'violet',  bg: 'bg-violet-50 text-violet-700 border-violet-100',   barBg: 'bg-violet-500' },
  OTHERS:     { label: 'Miscellaneous',      color: 'slate',   bg: 'bg-slate-50 text-slate-700 border-slate-100',     barBg: 'bg-slate-500' },
};

function StatCard({ title, value, sub, icon: Icon, color = 'emerald' }) {
  const themes = {
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', val: 'text-emerald-700', border: 'border-emerald-100/50' },
    blue:    { bg: 'bg-blue-50',    icon: 'text-blue-600',    val: 'text-blue-700',    border: 'border-blue-100/50' },
    rose:    { bg: 'bg-rose-50',    icon: 'text-rose-600',    val: 'text-rose-700',    border: 'border-rose-100/50' },
    violet:  { bg: 'bg-violet-50',  icon: 'text-violet-600',  val: 'text-violet-700',  border: 'border-violet-100/50' },
  }[color];

  return (
    <div className={`bg-white border ${themes.border} rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all duration-300`}>
      <div className={`w-12 h-12 rounded-xl ${themes.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-6 h-6 ${themes.icon}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{title}</p>
        <p className={`text-2xl font-black ${themes.val} truncate mt-0.5`}>{value}</p>
        {sub && <p className="text-[10px] text-slate-450 truncate mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  const { user } = useAuthStore();
  const [expenses, setExpenses] = useState([]);
  const [stores, setStores] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Rejection modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingExpenseId, setRejectingExpenseId] = useState(null);
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Filters State
  const [search, setSearch] = useState('');
  const [selectedCategoryTag, setSelectedCategoryTag] = useState('ALL');
  const [filterStore, setFilterStore] = useState('');
  const [filterSession, setFilterSession] = useState('');
  const [dateRange, setDateRange] = useState('ALL'); // ALL, THIS_MONTH, LAST_30_DAYS, THIS_YEAR

  // Modal forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('TRAVEL');
  const [storeId, setStoreId] = useState('');
  const [stallSessionId, setStallSessionId] = useState('');
  const [billUrl, setBillUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [uploadingBill, setUploadingBill] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Detail View and Image View Modal
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [receiptZoomUrl, setReceiptZoomUrl] = useState(null);

  useEffect(() => {
    fetchExpenses();
    fetchStoresAndSessions();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/expenses');
      setExpenses(res.data.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch expenses list.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStoresAndSessions = async () => {
    try {
      const [storesRes, sessionsRes] = await Promise.all([
        axiosInstance.get('/stores'),
        axiosInstance.get('/stalls/sessions')
      ]);
      setStores(storesRes.data.data || []);
      setSessions(sessionsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load stores or sessions', err);
    }
  };

  const handleUploadBill = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('bill', file);

    try {
      setUploadingBill(true);
      const res = await axiosInstance.post('/expenses/upload-bill', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBillUrl(res.data.billUrl);
    } catch (err) {
      alert(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingBill(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axiosInstance.post('/expenses', {
        title,
        amount: parseFloat(amount),
        date,
        category,
        storeId: storeId || null,
        stallSessionId: stallSessionId || null,
        billUrl,
        notes
      });
      setTitle('');
      setAmount('');
      setCategory('TRAVEL');
      setStoreId('');
      setStallSessionId('');
      setBillUrl('');
      setNotes('');
      setShowAddModal(false);
      await fetchExpenses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status, remarks = '') => {
    try {
      await axiosInstance.put(`/expenses/${id}/status`, { status, remarks });
      await fetchExpenses();
      if (selectedExpense?.id === id) {
        setSelectedExpense(prev => ({ ...prev, status, rejectionRemarks: status === 'REJECTED' ? remarks : '' }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const getUploadedImageUrl = (path) => {
    if (!path) return '';
    return `${BACKEND_URL.replace('/api', '')}/${path}`;
  };

  // Live Filtration Logic in Frontend for instantaneous interaction
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // 1. Category Tag Filter
      if (selectedCategoryTag !== 'ALL' && exp.category !== selectedCategoryTag) return false;

      // 2. Search box
      if (search) {
        const q = search.toLowerCase();
        const matchesTitle = exp.title?.toLowerCase().includes(q);
        const matchesNotes = exp.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesNotes) return false;
      }

      // 3. Store filter
      if (filterStore && exp.storeId !== filterStore) return false;

      // 4. Session filter
      if (filterSession && exp.stallSessionId !== filterSession) return false;

      // 5. Date Range Filter
      if (dateRange !== 'ALL') {
        const expDate = new Date(exp.date);
        const now = new Date();
        if (dateRange === 'THIS_MONTH') {
          if (expDate.getMonth() !== now.getMonth() || expDate.getFullYear() !== now.getFullYear()) return false;
        } else if (dateRange === 'LAST_30_DAYS') {
          const limit = new Date();
          limit.setDate(now.getDate() - 30);
          if (expDate < limit) return false;
        } else if (dateRange === 'THIS_YEAR') {
          if (expDate.getFullYear() !== now.getFullYear()) return false;
        }
      }

      return true;
    });
  }, [expenses, selectedCategoryTag, search, filterStore, filterSession, dateRange]);

  // Dynamic Metrics & Stats based on live filtered list
  const metrics = useMemo(() => {
    let total = 0;
    let storeTotal = 0;
    let eventTotal = 0;
    let corporateTotal = 0;
    const catMap = {};

    filteredExpenses.forEach(exp => {
      const amt = exp.amount || 0;
      total += amt;
      if (exp.storeId) storeTotal += amt;
      else if (exp.stallSessionId) eventTotal += amt;
      else corporateTotal += amt;

      catMap[exp.category] = (catMap[exp.category] || 0) + amt;
    });

    const categorySummary = Object.entries(CATEGORY_MAP).map(([key, cfg]) => {
      const val = catMap[key] || 0;
      const pct = total > 0 ? (val / total) * 100 : 0;
      return { key, label: cfg.label, val, pct, barBg: cfg.barBg, textClass: cfg.bg.split(' ')[1] };
    }).sort((a, b) => b.val - a.val);

    return {
      total,
      storeTotal,
      eventTotal,
      corporateTotal,
      categorySummary
    };
  }, [filteredExpenses]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
              <Receipt className="w-6 h-6" />
            </span>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">Interactive Expenses Dashboard</h1>
          </div>
          <p className="text-slate-400 text-xs">
            Monitor, filter, and track corporate operational overheads, store expenditures, and stall campaign bills.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white px-5 py-3 rounded-2xl font-bold text-xs transition-all shadow-lg shadow-emerald-950/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Log Expense Entry
        </button>
      </div>

      {/* Analytics KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Spent" value={`₹${metrics.total.toLocaleString('en-IN')}`} sub="Sum of filtered items" icon={DollarSign} color="emerald" />
        <StatCard title="Store-Wise Costs" value={`₹${metrics.storeTotal.toLocaleString('en-IN')}`} sub="Spent on retail stores" icon={Store} color="blue" />
        <StatCard title="Stall Event Costs" value={`₹${metrics.eventTotal.toLocaleString('en-IN')}`} sub="Spent on B2C stalls" icon={Building2} color="rose" />
        <StatCard title="General Corporate" value={`₹${metrics.corporateTotal.toLocaleString('en-IN')}`} sub="HQ & general expenses" icon={Briefcase} color="violet" />
      </div>

      {/* Chart and Live Category Breakdown Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Category Spend Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-150 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-600" />
            Spend Distribution by Category
          </h3>
          <div className="space-y-4">
            {metrics.categorySummary.map(cat => (
              <div key={cat.key} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-700 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${cat.barBg}`} />
                    {cat.label}
                  </span>
                  <span className="text-slate-500 font-bold">
                    ₹{cat.val.toLocaleString()} <span className="text-[10px] text-slate-400">({cat.pct.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${cat.barBg}`} 
                    style={{ width: `${cat.pct}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time category selector pills */}
        <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            Live Category Filter
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategoryTag('ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                selectedCategoryTag === 'ALL' 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-650 border-slate-200'
              }`}
            >
              All Categories ({expenses.length})
            </button>
            {Object.entries(CATEGORY_MAP).map(([key, cfg]) => {
              const count = expenses.filter(e => e.category === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategoryTag(key)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    selectedCategoryTag === key 
                      ? 'bg-emerald-650 text-white border-emerald-650 shadow-sm shadow-emerald-100' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-650 border-slate-200'
                  }`}
                >
                  {cfg.label.split(' ')[0]} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Advanced Filter Box */}
      <div className="bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Live Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Live search by title or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-700">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date range filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-700"
          >
            <option value="ALL">All Dates</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_30_DAYS">Last 30 Days</option>
            <option value="THIS_YEAR">This Year</option>
          </select>

          {/* Store select filter */}
          <select
            value={filterStore}
            onChange={(e) => setFilterStore(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-700"
          >
            <option value="">All Stores (Store-Wise)</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {/* Session select filter */}
          <select
            value={filterSession}
            onChange={(e) => setFilterSession(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-700"
          >
            <option value="">All Stall Events (Event-Wise)</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Main List and Detailed view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Live List Container */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-20 bg-white border border-slate-150 rounded-3xl shadow-sm">
              <Loader2 className="w-8 h-8 text-emerald-650 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-rose-50 text-rose-800 p-4 rounded-2xl border border-rose-100 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="font-semibold text-xs">{error}</span>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="bg-white border border-slate-150 rounded-3xl p-16 text-center shadow-sm">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-bold text-slate-700 text-sm">No expenses match criteria</h3>
              <p className="text-slate-450 text-xs mt-1">Try resetting search filters or log a new transaction.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-150 rounded-3xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-655 font-bold uppercase border-b border-slate-100">
                      <th className="p-4">Expense Title</th>
                      <th className="p-4">Category</th>
                      <th className="p-4 text-center">Date</th>
                      <th className="p-4">Reference</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((exp) => {
                      const cfg = CATEGORY_MAP[exp.category] || CATEGORY_MAP.OTHERS;
                      const statusVal = exp.status || 'SUBMITTED';
                      const statusBadge = {
                        SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-100',
                        APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                        REJECTED: 'bg-rose-50 text-rose-700 border-rose-100'
                      }[statusVal];

                      return (
                        <tr 
                          key={exp.id} 
                          onClick={() => setSelectedExpense(exp)}
                          className={`border-b border-slate-50 hover:bg-slate-50/50 transition cursor-pointer ${
                            selectedExpense?.id === exp.id ? 'bg-emerald-50/40 hover:bg-emerald-50' : ''
                          }`}
                        >
                          <td className="p-4">
                            <strong className="text-slate-800 font-black block text-[13px]">{exp.title}</strong>
                            {exp.notes && <span className="text-[10px] text-slate-400 block truncate max-w-[200px] sm:max-w-xs mt-0.5">{exp.notes}</span>}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full font-black text-[9px] uppercase border ${cfg.bg}`}>
                              {cfg.label.split(' ')[0]}
                            </span>
                          </td>
                          <td className="p-4 text-center text-slate-500 font-semibold">{new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="p-4 text-slate-600">
                            {exp.store && (
                              <span className="flex items-center gap-1 text-[11px]">
                                <Store className="w-3.5 h-3.5 text-slate-400" />
                                Store: <strong>{exp.store.name}</strong>
                              </span>
                            )}
                            {exp.stallSession && (
                              <span className="flex items-center gap-1 text-[11px]">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                Event: <strong>{exp.stallSession.name}</strong>
                              </span>
                            )}
                            {!exp.store && !exp.stallSession && (
                              <span className="text-slate-455 italic text-[11px]">General Corporate</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase border ${statusBadge}`}>
                              {statusVal}
                            </span>
                          </td>
                          <td className="p-4 text-right font-black text-slate-800 text-sm">₹{exp.amount.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Selected Expense Detail Sidebar Panel */}
        <div className="bg-white border border-slate-150 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Receipt & Details
          </h3>

          {selectedExpense ? (
            <div className="space-y-4 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 font-bold block uppercase text-[9px]">Title</span>
                <strong className="text-slate-850 font-black text-[13px] block mt-0.5">{selectedExpense.title}</strong>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px]">Category</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full font-black text-[9px] uppercase border mt-1 ${CATEGORY_MAP[selectedExpense.category]?.bg}`}>
                    {selectedExpense.category}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px]">Amount</span>
                  <strong className="text-emerald-700 font-black text-base block mt-0.5">₹{selectedExpense.amount?.toLocaleString()}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px]">Status</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full font-black text-[9px] uppercase border mt-1 ${{
                    SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-100',
                    APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    REJECTED: 'bg-rose-50 text-rose-700 border-rose-100'
                  }[selectedExpense.status || 'SUBMITTED']}`}>
                    {selectedExpense.status || 'SUBMITTED'}
                  </span>
                </div>
                {selectedExpense.status === 'REJECTED' && (
                  <div>
                    <span className="text-slate-400 font-bold block uppercase text-[9px]">Rejection Reason</span>
                    <strong className="text-rose-600 block mt-0.5">{selectedExpense.rejectionRemarks || 'No remarks provided'}</strong>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px]">Date</span>
                  <strong className="text-slate-700 block mt-0.5">{new Date(selectedExpense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px]">Linked Entity</span>
                  <strong className="text-slate-700 block mt-0.5">
                    {selectedExpense.store ? `Store: ${selectedExpense.store.name}` : selectedExpense.stallSession ? `Event: ${selectedExpense.stallSession.name}` : 'General / HQ'}
                  </strong>
                </div>
              </div>

              {selectedExpense.notes && (
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[9px]">Notes</span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100 mt-1 whitespace-pre-line leading-relaxed font-semibold">{selectedExpense.notes}</p>
                </div>
              )}

              {/* Manager Actions */}
              {['ADMIN', 'B2B_MANAGER', 'FINANCE_OFFICER'].includes(user?.staffRole || user?.role) && (selectedExpense.status || 'SUBMITTED') === 'SUBMITTED' && (
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(selectedExpense.id, 'APPROVED')}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-center cursor-pointer transition text-[11px]"
                  >
                    Approve Claim
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingExpenseId(selectedExpense.id);
                      setRejectionNotes('');
                      setShowRejectModal(true);
                    }}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-center cursor-pointer transition text-[11px]"
                  >
                    Reject Claim
                  </button>
                </div>
              )}

              <div>
                <span className="text-slate-400 font-bold block uppercase text-[9px] mb-2">Receipt Attachment</span>
                {selectedExpense.billUrl ? (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm relative group bg-slate-50 cursor-pointer" onClick={() => setReceiptZoomUrl(getUploadedImageUrl(selectedExpense.billUrl))}>
                    <img 
                      src={getUploadedImageUrl(selectedExpense.billUrl)} 
                      alt="Receipt Attachment" 
                      className="w-full h-44 object-contain transition duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold gap-1 text-[11px]">
                      <Eye className="w-4 h-4" />
                      Zoom Receipt
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 italic">
                    No receipt uploaded.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 italic font-medium">
              Click an expense in the log sheet to inspect details, receipt attachments, and linked accounts.
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Receipt className="w-5.5 h-5.5 text-emerald-600" />
                Add Expense Entry
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddExpense} className="space-y-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block uppercase tracking-wider mb-1">Expense Title / Item</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Travel tickets to food exhibition"
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-normal text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider mb-1">Amount (₹)</label>
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 1500"
                    required
                    min="0"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider mb-1">Date</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                  >
                    <option value="TRAVEL">TRAVEL</option>
                    <option value="FOOD">FOOD</option>
                    <option value="STATIONERY">STATIONERY</option>
                    <option value="MARKETING">MARKETING</option>
                    <option value="RENT">RENT</option>
                    <option value="OTHERS">OTHERS</option>
                  </select>
                </div>

                <div>
                  <label className="block uppercase tracking-wider mb-1">Receipt Attachment</label>
                  <div className="flex gap-2 items-center">
                    <label className="cursor-pointer border border-dashed border-slate-300 hover:bg-slate-50 transition py-2 px-3 rounded-2xl flex items-center justify-center gap-1 font-semibold text-slate-700 flex-1">
                      {uploadingBill ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{billUrl ? 'Change Photo' : 'Upload Receipt'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadBill}
                        className="hidden"
                      />
                    </label>
                    {billUrl && (
                      <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-2 rounded-2xl border border-emerald-100 shrink-0">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block uppercase tracking-wider mb-1">Link to Store (Store-Wise)</label>
                  <select
                    value={storeId}
                    onChange={(e) => {
                      setStoreId(e.target.value);
                      if (e.target.value) setStallSessionId(''); // Exclusive link
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                  >
                    <option value="">None / General</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block uppercase tracking-wider mb-1">Link to Stall Event (Event-Wise)</label>
                  <select
                    value={stallSessionId}
                    onChange={(e) => {
                      setStallSessionId(e.target.value);
                      if (e.target.value) setStoreId(''); // Exclusive link
                    }}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl font-semibold text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                  >
                    <option value="">None / General</option>
                    {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block uppercase tracking-wider mb-1">Expense Notes</label>
                  <textarea
                    rows="3"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any additional notes about this expenditure..."
                    className="w-full px-3 py-2 border border-slate-205 rounded-2xl font-normal text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-2xl font-semibold text-sm border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingBill}
                  className="px-5 py-2.5 rounded-2xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-100"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Zoom Receipt Modal */}
      {receiptZoomUrl && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setReceiptZoomUrl(null)}>
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl bg-white border border-slate-100 p-2 shadow-2xl">
            <button className="absolute right-4 top-4 p-2 bg-slate-950/40 text-white hover:bg-slate-950/60 rounded-full cursor-pointer transition">
              <X className="w-5 h-5" />
            </button>
            <img 
              src={receiptZoomUrl} 
              alt="Receipt Zoom" 
              className="max-w-full max-h-[80vh] object-contain rounded-2xl"
              onClick={e => e.stopPropagation()} // Prevent closing
            />
          </div>
        </div>
      )}

      {/* Rejection Remarks Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-xl border border-slate-150 relative">
            <button 
              onClick={() => setShowRejectModal(false)}
              className="absolute right-4 top-4 p-1 text-slate-400 hover:text-slate-600 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-3">Reject Expense Claim</h3>
            <p className="text-xs text-slate-500 mb-4 font-medium">Please provide the remarks explaining why this expense claim is being rejected.</p>
            <textarea
              value={rejectionNotes}
              onChange={e => setRejectionNotes(e.target.value)}
              placeholder="Enter rejection remarks..."
              rows={4}
              className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-2xl focus:outline-none font-medium text-slate-700 text-xs mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!rejectionNotes.trim()) {
                    alert('Rejection remarks are required.');
                    return;
                  }
                  handleUpdateStatus(rejectingExpenseId, 'REJECTED', rejectionNotes);
                  setShowRejectModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Reject Claim
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
