// src/pages/admin/ExpensesPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Receipt, 
  Calendar, 
  MapPin, 
  Store, 
  DollarSign, 
  Upload, 
  Image, 
  Loader2, 
  AlertTriangle,
  Search,
  Filter,
  FileText,
  Building2
} from 'lucide-react';
import { BACKEND_URL } from '../../store/authStore';
import axiosInstance from 'axios'; // We will use standard axios since it is configured

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [stores, setStores] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [filterSession, setFilterSession] = useState('');

  // Add Expense Form State
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

  // Selected Expense View Detail State
  const [selectedExpense, setSelectedExpense] = useState(null);

  useEffect(() => {
    fetchExpenses();
    fetchStoresAndSessions();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterCategory) params.category = filterCategory;
      if (filterStore) params.storeId = filterStore;
      if (filterSession) params.stallSessionId = filterSession;
      if (search) params.search = search;

      const res = await axiosInstance.get('/expenses', { params });
      setExpenses(res.data.data);
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
      setStores(storesRes.data.data);
      setSessions(sessionsRes.data.data);
    } catch (err) {
      console.error('Failed to load stores or sessions', err);
    }
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchExpenses();
  };

  const handleClearFilters = () => {
    setSearch('');
    setFilterCategory('');
    setFilterStore('');
    setFilterSession('');
    // We fetch immediately by scheduling a call
    setTimeout(() => {
      axiosInstance.get('/expenses').then(res => setExpenses(res.data.data));
    }, 50);
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
      alert('Receipt uploaded successfully!');
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
      const res = await axiosInstance.post('/expenses', {
        title,
        amount: parseFloat(amount),
        date,
        category,
        storeId: storeId || null,
        stallSessionId: stallSessionId || null,
        billUrl,
        notes
      });
      alert('Expense recorded successfully!');
      setTitle('');
      setAmount('');
      setCategory('TRAVEL');
      setStoreId('');
      setStallSessionId('');
      setBillUrl('');
      setNotes('');
      setShowAddModal(false);
      fetchExpenses();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record expense');
    } finally {
      setSubmitting(false);
    }
  };

  const getUploadedImageUrl = (path) => {
    if (!path) return '';
    return `${BACKEND_URL.replace('/api', '')}/${path}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="w-7 h-7 text-emerald-600" />
            General Expenses Log
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Log operational costs, upload receipts, and categorize expenditures across stores and events.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Expense Entry
        </button>
      </div>

      {/* Search and Filters */}
      <form onSubmit={handleApplyFilters} className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by title or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Categories</option>
            <option value="TRAVEL">TRAVEL</option>
            <option value="FOOD">FOOD</option>
            <option value="STATIONERY">STATIONERY</option>
            <option value="MARKETING">MARKETING</option>
            <option value="RENT">RENT</option>
            <option value="OTHERS">OTHERS</option>
          </select>

          <select
            value={filterStore}
            onChange={(e) => setFilterStore(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Stores (Store-Wise)</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <select
            value={filterSession}
            onChange={(e) => setFilterSession(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">All Stall Events (Event-Wise)</option>
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
          >
            Clear Filters
          </button>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </form>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Expenses List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-20 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          ) : expenses.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm">
              <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">No Expense Logs Found</h3>
              <p className="text-slate-500 text-xs mt-1">Log your first company expense by clicking "Add Expense Entry" above.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                      <th className="p-3">Title / Expense</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-center">Date</th>
                      <th className="p-3">Reference (Store/Event)</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp) => (
                      <tr 
                        key={exp.id} 
                        onClick={() => setSelectedExpense(exp)}
                        className={`border-b border-slate-100 hover:bg-slate-50/70 transition cursor-pointer ${
                          selectedExpense?.id === exp.id ? 'bg-emerald-50/40 hover:bg-emerald-50/60' : ''
                        }`}
                      >
                        <td className="p-3">
                          <strong className="text-slate-800 font-bold block">{exp.title}</strong>
                          {exp.notes && <span className="text-[10px] text-slate-450 block truncate max-w-xs mt-0.5">{exp.notes}</span>}
                        </td>
                        <td className="p-3">
                          <span className="inline-flex px-2 py-0.5 rounded-full font-bold text-[9px] bg-slate-100 text-slate-700">
                            {exp.category}
                          </span>
                        </td>
                        <td className="p-3 text-center text-slate-500 font-medium">{new Date(exp.date).toLocaleDateString()}</td>
                        <td className="p-3 text-slate-600">
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
                            <span className="text-slate-400 italic">General Corporate</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-black text-slate-800 text-sm">₹{exp.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Selected Expense Detail Panel */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-600" />
            Expense Details
          </h3>

          {selectedExpense ? (
            <div className="space-y-4 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Title</span>
                <strong className="text-slate-800 font-bold text-sm block mt-0.5">{selectedExpense.title}</strong>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Category</span>
                  <strong className="text-slate-800 font-bold block mt-0.5">{selectedExpense.category}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Amount</span>
                  <strong className="text-emerald-600 font-black text-sm block mt-0.5">₹{selectedExpense.amount?.toLocaleString()}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Date</span>
                  <strong className="text-slate-800 block mt-0.5">{new Date(selectedExpense.date).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Linked Entity</span>
                  <strong className="text-slate-800 block mt-0.5">
                    {selectedExpense.store ? `Store: ${selectedExpense.store.name}` : selectedExpense.stallSession ? `Event: ${selectedExpense.stallSession.name}` : 'General'}
                  </strong>
                </div>
              </div>

              {selectedExpense.notes && (
                <div>
                  <span className="text-slate-400 font-semibold block uppercase text-[10px]">Notes</span>
                  <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1 whitespace-pre-line leading-relaxed">{selectedExpense.notes}</p>
                </div>
              )}

              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px] mb-1.5">Receipt Attachment</span>
                {selectedExpense.billUrl ? (
                  <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm relative group bg-slate-50">
                    <img 
                      src={getUploadedImageUrl(selectedExpense.billUrl)} 
                      alt="Receipt Attachment" 
                      className="w-full h-44 object-contain"
                    />
                    <a
                      href={getUploadedImageUrl(selectedExpense.billUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold gap-1 text-[11px]"
                    >
                      <Image className="w-4 h-4" />
                      View Full Image
                    </a>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 italic">
                    No receipt attached to this expense.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 italic">
              Click an expense in the log sheet to view its transaction receipts and details.
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Receipt className="w-5.5 h-5.5 text-emerald-600" />
              Add Expense Entry
            </h2>
            <form onSubmit={handleAddExpense} className="space-y-4 mt-4 text-xs font-bold text-slate-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block uppercase tracking-wider mb-1">Expense Title / Item</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Travel tickets to food exhibition"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-normal text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider mb-1">Date</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-750"
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
                    <label className="cursor-pointer border border-dashed border-slate-350 hover:bg-slate-50 transition py-1.5 px-3 rounded-xl flex items-center justify-center gap-1 font-semibold text-slate-700 flex-1">
                      {uploadingBill ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-slate-400" />}
                      <span>{billUrl ? 'Change bill photo' : 'Upload Receipt'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleUploadBill}
                        className="hidden"
                      />
                    </label>
                    {billUrl && (
                      <a
                        href={getUploadedImageUrl(billUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 p-2 rounded-xl text-emerald-600 transition shrink-0"
                      >
                        <Image className="w-4 h-4" />
                      </a>
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-750"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-750"
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
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-normal text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  ></textarea>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-sm border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingBill}
                  className="px-5 py-2 rounded-xl font-semibold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
