// src/pages/admin/B2CStorePage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../store/authStore';
import {
  Store, Plus, Search, Filter, RefreshCw, MapPin, Phone, User,
  Tag, Building2, Package, Calendar, Clock, CheckCircle, AlertTriangle,
  Loader2, X, ChevronRight, Edit, Trash2, Lock, Unlock, BarChart3,
  IndianRupee, FileText, Receipt, Gift, Camera, Image, ArrowLeft,
  TrendingUp, TrendingDown, Eye, ShoppingBag, Upload, CreditCard,
  DollarSign, Minus, Activity, Layers, Save, CircleDot
} from 'lucide-react';

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color = 'rose' }) {
  const c = {
    rose:    { bg: 'bg-rose-50',    icon: 'text-rose-600',    val: 'text-rose-700' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', val: 'text-emerald-700' },
    blue:    { bg: 'bg-blue-50',    icon: 'text-blue-600',    val: 'text-blue-700' },
    amber:   { bg: 'bg-amber-50',   icon: 'text-amber-600',   val: 'text-amber-700' },
    violet:  { bg: 'bg-violet-50',  icon: 'text-violet-600',  val: 'text-violet-700' },
  }[color] || { bg: 'bg-rose-50', icon: 'text-rose-600', val: 'text-rose-700' };

  return (
    <div className="bg-white border border-slate-150 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${c.icon}`} />
      </div>
      <div>
        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-black ${c.val}`}>{value}</p>
        {sub && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ClassBadge({ type }) {
  if (type === 'KIRANA') return (
    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase bg-amber-50 text-amber-800 border border-amber-100">Kirana</span>
  );
  return (
    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-800 border border-emerald-100">Retail</span>
  );
}

function StockBadge({ status }) {
  if (status === 'FROZEN') return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
      <Lock className="w-2.5 h-2.5" /> Frozen
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-100">
      <Unlock className="w-2.5 h-2.5" /> Draft
    </span>
  );
}

const IMG = (url) => {
  if (!url) return '/placeholder.png';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${BACKEND_URL.replace('/api', '')}/${url}`;
};

const fmtCur = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'directory', label: 'All Stores', icon: Building2 },
  { id: 'profile',   label: 'Store Profile', icon: User },
  { id: 'stock',     label: 'Stock Config', icon: Package },
  { id: 'visits',    label: 'Visits & Sales', icon: Activity },
  { id: 'expenses',  label: 'Expenses & Offers', icon: Receipt },
  { id: 'report',    label: 'P&L Report', icon: BarChart3 },
];

export default function B2CStorePage() {
  const [activeTab, setActiveTab] = useState('directory');
  const [selectedStore, setSelectedStore] = useState(null);

  // Directory state
  const [stores, setStores]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [filterClass, setFilterClass] = useState('');

  // Products for stock config
  const [allProducts, setAllProducts]     = useState([]);
  const [productSearch, setProductSearch] = useState('');

  // Registration modal
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '', ownerName: '', ownerPhone: '', phone: '', gstNumber: '',
    address: '', city: '', state: '', pincode: '', zone: '',
    classification: 'RETAIL', initialInvestment: '', notes: ''
  });
  const [regSubmitting, setRegSubmitting] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal]   = useState(false);
  const [editForm, setEditForm]             = useState({});
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Store detail/profile
  const [storeDetail, setStoreDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Stock config state
  const [stockDraft, setStockDraft] = useState({});
  const [stockSaving, setStockSaving] = useState(false);

  // Visit state
  const [visits, setVisits]           = useState([]);
  const [visitLoading, setVisitLoading] = useState(false);
  const [activeVisit, setActiveVisit]  = useState(null);
  const [checkInForm, setCheckInForm]  = useState({ visitorName: '', purpose: 'Routine Visit', remarks: '' });
  const [checkOutForm, setCheckOutForm] = useState({ outcome: '', remarks: '', paymentsCollected: '', paymentMethod: 'CASH', revisitDate: '' });
  const [checkInSubmitting, setCheckInSubmitting]   = useState(false);
  const [checkOutSubmitting, setCheckOutSubmitting] = useState(false);

  // Invoice/billing state
  const [invoices, setInvoices]           = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [billCart, setBillCart]           = useState([]);
  const [billDiscount, setBillDiscount]   = useState('');
  const [billNotes, setBillNotes]         = useState('');
  const [billGst, setBillGst]             = useState(true);
  const [billSubmitting, setBillSubmitting] = useState(false);
  const [billProductSearch, setBillProductSearch] = useState('');

  // Expense state
  const [expenses, setExpenses]           = useState([]);
  const [expLoading, setExpLoading]       = useState(false);
  const [showExpModal, setShowExpModal]   = useState(false);
  const [expForm, setExpForm]             = useState({ title: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'TRAVEL', notes: '' });
  const [expSubmitting, setExpSubmitting] = useState(false);

  // Offers state
  const [offerDists, setOfferDists]       = useState([]);
  const [offerItems, setOfferItems]       = useState([]);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerForm, setOfferForm] = useState({ offerItemId: '', quantity: '', notes: '' });
  const [offerSubmitting, setOfferSubmitting] = useState(false);

  // Report state
  const [report, setReport]               = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const [message, setMessage] = useState({ text: '', type: '' });

  // ─── Fetch helpers ──────────────────────────────────────────────────────────

  const fetchStores = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/b2c-stores', { params: { classification: filterClass || undefined, search: search || undefined } });
      setStores(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/products');
      setAllProducts((res.data.data || []).filter(p => p.isActive));
    } catch (e) { console.error(e); }
  };

  const fetchStoreDetail = async (storeId) => {
    setDetailLoading(true);
    try {
      const res = await axios.get(`/b2c-stores/${storeId}`);
      const data = res.data.data;
      setStoreDetail(data);
      setStockDraft(
        (data.stockConfig || []).reduce((acc, sc) => {
          acc[sc.productId?.toString()] = sc.assignedStock;
          return acc;
        }, {})
      );
    } catch (e) { console.error(e); }
    finally { setDetailLoading(false); }
  };

  const fetchVisits = async (storeId) => {
    setVisitLoading(true);
    try {
      const res = await axios.get(`/b2c-stores/${storeId}/visits`);
      setVisits(res.data.data || []);
      // Find open visit (no checkOutTime)
      const open = (res.data.data || []).find(v => !v.checkOutTime);
      setActiveVisit(open || null);
    } catch (e) { console.error(e); }
    finally { setVisitLoading(false); }
  };

  const fetchInvoices = async (storeId) => {
    setInvoicesLoading(true);
    try {
      const res = await axios.get(`/b2c-stores/${storeId}/invoices`);
      setInvoices(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setInvoicesLoading(false); }
  };

  const fetchExpenses = async (storeId) => {
    setExpLoading(true);
    try {
      const res = await axios.get(`/b2c-stores/${storeId}/expenses`);
      setExpenses(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setExpLoading(false); }
  };

  const fetchOffers = async (storeId) => {
    try {
      const res = await axios.get(`/b2c-stores/${storeId}/offers`);
      setOfferDists(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchOfferItems = async () => {
    try {
      const res = await axios.get('/offers/items');
      setOfferItems(res.data.data || []);
    } catch (e) { console.error(e); }
  };

  const fetchReport = async (storeId) => {
    setReportLoading(true);
    try {
      const res = await axios.get(`/b2c-stores/${storeId}/report`);
      setReport(res.data.data);
    } catch (e) { console.error(e); }
    finally { setReportLoading(false); }
  };

  useEffect(() => { fetchStores(); fetchProducts(); }, []);
  useEffect(() => { fetchStores(); }, [filterClass]);

  const openStore = async (store) => {
    setSelectedStore(store);
    await fetchStoreDetail(store.id);
    await fetchVisits(store.id);
    await fetchInvoices(store.id);
    await fetchExpenses(store.id);
    await fetchOffers(store.id);
    await fetchOfferItems();
    setActiveTab('profile');
  };

  const openReport = async (store) => {
    setSelectedStore(store);
    await fetchReport(store.id);
    setActiveTab('report');
  };

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegSubmitting(true);
    try {
      await axios.post('/b2c-stores', regForm);
      setShowRegModal(false);
      setRegForm({ name: '', ownerName: '', ownerPhone: '', phone: '', gstNumber: '', address: '', city: '', state: '', pincode: '', zone: '', classification: 'RETAIL', initialInvestment: '', notes: '' });
      fetchStores();
      setMessage({ text: 'Store registered successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    } catch (e) {
      setMessage({ text: e.response?.data?.message || 'Registration failed.', type: 'error' });
    }
    setRegSubmitting(false);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setEditSubmitting(true);
    try {
      const res = await axios.put(`/b2c-stores/${selectedStore.id}`, editForm);
      setShowEditModal(false);
      const updated = res.data.data;
      setSelectedStore(s => ({ ...s, ...updated }));
      setStoreDetail(d => d ? { ...d, ...updated } : d);
      fetchStores();
      setMessage({ text: 'Store updated!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (e) {
      setMessage({ text: e.response?.data?.message || 'Update failed.', type: 'error' });
    }
    setEditSubmitting(false);
  };

  const handleSaveStockDraft = async () => {
    setStockSaving(true);
    try {
      const products = allProducts
        .filter(p => stockDraft[p.id] !== undefined && parseInt(stockDraft[p.id]) > 0)
        .map(p => ({
          productId: p.id,
          productName: p.name,
          assignedStock: parseInt(stockDraft[p.id]),
          price: parseFloat(p.mrp || p.price || 0)
        }));
      await axios.put(`/b2c-stores/${selectedStore.id}/stock`, { products });
      await fetchStoreDetail(selectedStore.id);
      setMessage({ text: 'Stock draft saved!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (e) {
      setMessage({ text: e.response?.data?.message || 'Save failed.', type: 'error' });
    }
    setStockSaving(false);
  };

  const handleFreezeStock = async () => {
    if (!window.confirm('Freeze this stock configuration? Billing will use these stock limits.')) return;
    setStockSaving(true);
    try {
      // Save draft first
      const products = allProducts
        .filter(p => stockDraft[p.id] !== undefined && parseInt(stockDraft[p.id]) > 0)
        .map(p => ({
          productId: p.id,
          productName: p.name,
          assignedStock: parseInt(stockDraft[p.id]),
          price: parseFloat(p.mrp || p.price || 0)
        }));
      await axios.put(`/b2c-stores/${selectedStore.id}/stock`, { products });
      await axios.post(`/b2c-stores/${selectedStore.id}/stock/freeze`);
      await fetchStoreDetail(selectedStore.id);
      setMessage({ text: 'Stock frozen!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (e) {
      setMessage({ text: e.response?.data?.message || 'Freeze failed.', type: 'error' });
    }
    setStockSaving(false);
  };

  const handleUnfreezeStock = async () => {
    if (!window.confirm('Unfreeze to allow editing the stock configuration?')) return;
    setStockSaving(true);
    try {
      await axios.post(`/b2c-stores/${selectedStore.id}/stock/unfreeze`);
      await fetchStoreDetail(selectedStore.id);
      setMessage({ text: 'Stock unfrozen for editing.', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (e) {
      setMessage({ text: e.response?.data?.message || 'Unfreeze failed.', type: 'error' });
    }
    setStockSaving(false);
  };

  const handleCheckIn = async () => {
    if (!checkInForm.visitorName || !checkInForm.purpose) {
      alert('Visitor name and purpose are required.');
      return;
    }
    setCheckInSubmitting(true);
    try {
      const res = await axios.post(`/b2c-stores/${selectedStore.id}/visits/checkin`, checkInForm);
      setActiveVisit(res.data.data);
      await fetchVisits(selectedStore.id);
      setCheckInForm({ visitorName: '', purpose: 'Routine Visit', remarks: '' });
      setMessage({ text: 'Checked in successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (e) {
      setMessage({ text: e.response?.data?.message || 'Check-in failed.', type: 'error' });
    }
    setCheckInSubmitting(false);
  };

  const handleCheckOut = async () => {
    if (!checkOutForm.outcome) {
      alert('Please enter the visit outcome.');
      return;
    }
    setCheckOutSubmitting(true);
    try {
      await axios.put(`/b2c-stores/visits/${activeVisit.id}/checkout`, checkOutForm);
      setActiveVisit(null);
      await fetchVisits(selectedStore.id);
      await fetchInvoices(selectedStore.id);
      setCheckOutForm({ outcome: '', remarks: '', paymentsCollected: '', paymentMethod: 'CASH', revisitDate: '' });
      setMessage({ text: 'Checked out and payments processed!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (e) {
      setMessage({ text: e.response?.data?.message || 'Checkout failed.', type: 'error' });
    }
    setCheckOutSubmitting(false);
  };

  // Billing
  const addToBillCart = (product) => {
    setBillCart(prev => {
      const ex = prev.find(i => i.productId === product.id);
      if (ex) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, productName: product.name, quantity: 1, price: parseFloat(product.mrp || product.price || 0), gstPercent: product.gstPercent || 5 }];
    });
  };
  const updateBillQty = (productId, delta) => {
    setBillCart(prev => prev.map(i => i.productId === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  };
  const removeFromBillCart = (productId) => setBillCart(prev => prev.filter(i => i.productId !== productId));

  const billSubtotal = billCart.reduce((s, i) => s + i.quantity * i.price, 0);
  const billGstAmt = billGst ? billCart.reduce((s, i) => s + i.quantity * i.price * (i.gstPercent / 100), 0) : 0;
  const billTotal = Math.max(0, billSubtotal + billGstAmt - (parseFloat(billDiscount) || 0));

  const handleCreateInvoice = async (paymentMethod) => {
    if (billCart.length === 0) return;
    setBillSubmitting(true);
    try {
      await axios.post(`/b2c-stores/${selectedStore.id}/invoices`, {
        items: billCart.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
        discount: parseFloat(billDiscount || 0),
        notes: billNotes,
        isGstEnabled: billGst,
        paymentMethod: paymentMethod || null
      });
      setShowBillModal(false);
      setBillCart([]);
      setBillDiscount('');
      setBillNotes('');
      await fetchInvoices(selectedStore.id);
      await fetchStoreDetail(selectedStore.id);
      setMessage({ text: 'Invoice created!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (e) {
      setMessage({ text: e.response?.data?.message || 'Invoice creation failed.', type: 'error' });
    }
    setBillSubmitting(false);
  };

  // Expenses
  const handleAddExpense = async (e) => {
    e.preventDefault();
    setExpSubmitting(true);
    try {
      await axios.post(`/b2c-stores/${selectedStore.id}/expenses`, expForm);
      setShowExpModal(false);
      setExpForm({ title: '', amount: '', date: new Date().toISOString().split('T')[0], category: 'TRAVEL', notes: '' });
      await fetchExpenses(selectedStore.id);
      setMessage({ text: 'Expense logged!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (e) {
      setMessage({ text: e.response?.data?.message || 'Expense log failed.', type: 'error' });
    }
    setExpSubmitting(false);
  };

  // Offers
  const handleDistributeOffer = async (e) => {
    e.preventDefault();
    setOfferSubmitting(true);
    try {
      await axios.post('/offers/distribute', {
        ...offerForm,
        distributedToType: 'STORE',
        storeId: selectedStore.id,
        date: new Date().toISOString()
      });
      setShowOfferModal(false);
      setOfferForm({ offerItemId: '', quantity: '', notes: '' });
      await fetchOffers(selectedStore.id);
      await fetchOfferItems();
      setMessage({ text: 'Offer items distributed!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (e) {
      setMessage({ text: e.response?.data?.message || 'Offer distribution failed.', type: 'error' });
    }
    setOfferSubmitting(false);
  };

  // Derived data
  const filteredStores = useMemo(() => {
    if (!search) return stores;
    const q = search.toLowerCase();
    return stores.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.ownerName?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.phone?.includes(q) ||
      s.ownerPhone?.includes(q)
    );
  }, [stores, search]);

  const stats = useMemo(() => ({
    total: stores.length,
    retail: stores.filter(s => s.classification !== 'KIRANA').length,
    kirana: stores.filter(s => s.classification === 'KIRANA').length,
    withRevisit: stores.filter(s => s.revisitDate).length,
    pending: stores.reduce((sum, s) => sum + (s.pendingAmount || 0), 0)
  }), [stores]);

  const filteredBillProducts = useMemo(() => {
    if (!billProductSearch) return allProducts;
    const q = billProductSearch.toLowerCase();
    return allProducts.filter(p => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
  }, [allProducts, billProductSearch]);

  const filteredStockProducts = useMemo(() => {
    if (!productSearch) return allProducts;
    const q = productSearch.toLowerCase();
    return allProducts.filter(p => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
  }, [allProducts, productSearch]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          {activeTab !== 'directory' && (
            <button
              onClick={() => { setActiveTab('directory'); setSelectedStore(null); }}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Store className="w-6 h-6 text-rose-500" />
              B2C Retail Store Module
            </h2>
            <p className="text-slate-500 text-xs mt-0.5">
              {selectedStore ? `${selectedStore.name} — ${selectedStore.city || 'Store'}` : 'Manage standalone retail & kirana stores'}
            </p>
          </div>
        </div>
        {activeTab === 'directory' && (
          <button
            onClick={() => setShowRegModal(true)}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-rose-100 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Register Store
          </button>
        )}
        {selectedStore && activeTab !== 'directory' && (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditForm({ ...selectedStore }); setShowEditModal(true); }}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" /> Edit Store
            </button>
            <button
              onClick={() => fetchReport(selectedStore.id).then(() => setActiveTab('report'))}
              className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5" /> Report
            </button>
          </div>
        )}
      </div>

      {/* Alert */}
      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Tab Navigation (only show when store selected) */}
      {selectedStore && (
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-rose-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════ TAB: DIRECTORY ═══════════════════════ */}
      {activeTab === 'directory' && (
        <div className="space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="Total Stores"  value={stats.total}   icon={Store}       color="rose" />
            <StatCard label="Retail"        value={stats.retail}  icon={Building2}   color="emerald" />
            <StatCard label="Kirana"        value={stats.kirana}  icon={Package}     color="amber" />
            <StatCard label="With Revisit"  value={stats.withRevisit} icon={Calendar} color="blue" />
            <StatCard label="Total Pending" value={fmtCur(stats.pending)} icon={IndianRupee} color="violet" />
          </div>

          {/* Filters */}
          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, owner, city, phone…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl text-xs focus:outline-none"
                />
                {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><X className="w-3.5 h-3.5" /></button>}
              </div>
              <select
                value={filterClass}
                onChange={e => setFilterClass(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl text-xs focus:outline-none font-semibold text-slate-700"
              >
                <option value="">All Types</option>
                <option value="RETAIL">Retail</option>
                <option value="KIRANA">Kirana</option>
              </select>
              <button onClick={fetchStores} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-xs font-bold hover:bg-rose-100 transition cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>
          </div>

          {/* Store Cards Grid */}
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-rose-500 animate-spin" /></div>
          ) : filteredStores.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <Store className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-base">No stores found</h3>
              <p className="text-slate-400 text-xs mt-1">Register your first B2C retail store to get started.</p>
              <button onClick={() => setShowRegModal(true)} className="mt-4 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition">
                + Register Store
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStores.map(store => (
                <div key={store.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-2">
                      <h3 className="font-black text-slate-800 text-sm leading-tight">{store.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <ClassBadge type={store.classification} />
                        <StockBadge status={store.stockStatus} />
                      </div>
                    </div>
                    <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center shrink-0">
                      <Store className="w-4 h-4 text-rose-500" />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    {store.ownerName && (
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{store.ownerName}</span>
                      </div>
                    )}
                    {(store.ownerPhone || store.phone) && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{store.ownerPhone || store.phone}</span>
                      </div>
                    )}
                    {store.city && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{store.city}{store.state ? `, ${store.state}` : ''}</span>
                      </div>
                    )}
                    {store.revisitDate && (
                      <div className="flex items-center gap-1.5 text-amber-700">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        <span>Next Visit: {fmtDate(store.revisitDate)}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <div>
                      {(store.pendingAmount || 0) > 0 && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                          Pending: {fmtCur(store.pendingAmount)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => openReport(store)}
                        className="p-1.5 text-violet-500 hover:bg-violet-50 rounded-lg transition cursor-pointer"
                        title="P&L Report"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => openStore(store)}
                        className="inline-flex items-center gap-1 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
                      >
                        Open <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════ TAB: PROFILE ═══════════════════════ */}
      {activeTab === 'profile' && selectedStore && (
        <div className="space-y-5">
          {detailLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-rose-500 animate-spin" /></div>
          ) : storeDetail ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Store Info Card */}
                <div className="lg:col-span-2 bg-white border border-slate-150 rounded-2xl p-6 shadow-sm">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-rose-500" /> Store Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    {[
                      { label: 'Store Name', value: storeDetail.name },
                      { label: 'Owner Name', value: storeDetail.ownerName || '—' },
                      { label: 'Owner Phone', value: storeDetail.ownerPhone || '—' },
                      { label: 'Store Phone', value: storeDetail.phone || '—' },
                      { label: 'GST Number', value: storeDetail.gstNumber || '—' },
                      { label: 'Classification', value: storeDetail.classification },
                      { label: 'Address', value: storeDetail.address },
                      { label: 'City', value: storeDetail.city || '—' },
                      { label: 'State', value: storeDetail.state || '—' },
                      { label: 'Pincode', value: storeDetail.pincode || '—' },
                      { label: 'Zone', value: storeDetail.zone || '—' },
                      { label: 'Initial Investment', value: fmtCur(storeDetail.initialInvestment) },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <span className="text-slate-400 text-[10px] font-bold uppercase block">{label}</span>
                        <span className="font-semibold text-slate-800">{value}</span>
                      </div>
                    ))}
                  </div>
                  {storeDetail.notes && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <span className="text-slate-400 text-[10px] font-bold uppercase block mb-1">Notes</span>
                      <p className="text-xs text-slate-600">{storeDetail.notes}</p>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="space-y-3">
                  <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
                    <h4 className="text-[10px] text-slate-400 font-bold uppercase mb-3">Quick Stats</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-semibold">Total Invoices</span>
                        <span className="font-black text-slate-800">{storeDetail.invoices?.length || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-semibold">Pending Amount</span>
                        <span className="font-black text-rose-600">{fmtCur(storeDetail.pendingAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-semibold">Total Visits</span>
                        <span className="font-black text-slate-800">{storeDetail.visitCount || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-semibold">Last Visit</span>
                        <span className="font-bold text-slate-600">{fmtDate(storeDetail.lastVisitDate)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-semibold">Next Revisit</span>
                        <span className="font-bold text-amber-600">{fmtDate(storeDetail.revisitDate)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-semibold">Stock Status</span>
                        <StockBadge status={storeDetail.stockStatus} />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
                    <h4 className="text-[10px] text-slate-400 font-bold uppercase mb-3">Quick Actions</h4>
                    <div className="space-y-2">
                      <button onClick={() => setActiveTab('visits')} className="w-full flex items-center gap-2 text-xs font-bold text-slate-700 hover:bg-slate-50 p-2 rounded-xl transition cursor-pointer">
                        <Activity className="w-4 h-4 text-rose-500" /> Manage Visits
                      </button>
                      <button onClick={() => setActiveTab('stock')} className="w-full flex items-center gap-2 text-xs font-bold text-slate-700 hover:bg-slate-50 p-2 rounded-xl transition cursor-pointer">
                        <Package className="w-4 h-4 text-blue-500" /> Configure Stock
                      </button>
                      <button onClick={() => setActiveTab('expenses')} className="w-full flex items-center gap-2 text-xs font-bold text-slate-700 hover:bg-slate-50 p-2 rounded-xl transition cursor-pointer">
                        <Receipt className="w-4 h-4 text-amber-500" /> Log Expense
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Visits Timeline */}
              {visits.length > 0 && (
                <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-500" /> Recent Visits
                  </h3>
                  <div className="space-y-3">
                    {visits.slice(0, 5).map(v => (
                      <div key={v.id} className="flex items-start gap-3 text-xs">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${v.checkOutTime ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-bold text-slate-700">{v.purpose}</span>
                            <span className="text-slate-400">{fmtDate(v.date)}</span>
                          </div>
                          <p className="text-slate-500 mt-0.5">{v.outcome || 'In Progress…'}</p>
                          {v.paymentsCollected > 0 && (
                            <span className="text-emerald-600 font-bold">Collected: {fmtCur(v.paymentsCollected)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* ═══════════════════════ TAB: STOCK CONFIG ═══════════════════════ */}
      {activeTab === 'stock' && selectedStore && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">Stock Configuration</h3>
              <p className="text-slate-400 text-xs mt-0.5">Assign products and freeze configuration for billing.</p>
            </div>
            <div className="flex gap-2">
              {storeDetail?.stockStatus === 'FROZEN' ? (
                <button onClick={handleUnfreezeStock} disabled={stockSaving} className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition cursor-pointer">
                  {stockSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />} Unfreeze
                </button>
              ) : (
                <>
                  <button onClick={handleSaveStockDraft} disabled={stockSaving} className="inline-flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition cursor-pointer">
                    {stockSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Draft
                  </button>
                  <button onClick={handleFreezeStock} disabled={stockSaving} className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl transition cursor-pointer">
                    {stockSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />} Freeze Config
                  </button>
                </>
              )}
            </div>
          </div>

          {storeDetail?.stockStatus === 'FROZEN' ? (
            /* Frozen view */
            <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-100">
                    <th className="p-3">Product</th>
                    <th className="p-3 text-center">Price</th>
                    <th className="p-3 text-center">Assigned</th>
                    <th className="p-3 text-center">Current</th>
                    <th className="p-3 text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(storeDetail.stockConfig || []).map(sc => (
                    <tr key={sc.productId} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-700">{sc.productName}</td>
                      <td className="p-3 text-center">{fmtCur(sc.price)}</td>
                      <td className="p-3 text-center font-bold">{sc.assignedStock}</td>
                      <td className={`p-3 text-center font-bold ${(sc.currentStock || 0) <= 5 ? 'text-rose-600' : 'text-emerald-700'}`}>{sc.currentStock}</td>
                      <td className="p-3 text-right font-bold">{fmtCur((sc.assignedStock || 0) * (sc.price || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Draft edit view */
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products…"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl text-xs focus:outline-none"
                />
              </div>
              <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-100">
                      <th className="p-3">Product</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3 text-center">MRP</th>
                      <th className="p-3 text-center w-36">Assign Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStockProducts.map(p => (
                      <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="p-3 font-semibold text-slate-700">{p.name}</td>
                        <td className="p-3 text-slate-400 font-mono text-[10px]">{p.sku}</td>
                        <td className="p-3 text-center">{fmtCur(p.mrp || p.price)}</td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={stockDraft[p.id] || ''}
                            onChange={e => {
                              const v = e.target.value;
                              setStockDraft(prev => {
                                const updated = { ...prev };
                                if (!v || parseInt(v) <= 0) delete updated[p.id];
                                else updated[p.id] = parseInt(v);
                                return updated;
                              });
                            }}
                            className="w-24 text-center border border-slate-200 rounded-lg py-1 px-2 focus:outline-none focus:ring-1 focus:ring-rose-500 font-bold text-slate-800"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════ TAB: VISITS & SALES ═══════════════════════ */}
      {activeTab === 'visits' && selectedStore && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Check-in / Checkout Panel */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-500" /> Visit Management
                </h3>

                {!activeVisit ? (
                  /* Check-in form */
                  <div className="space-y-3">
                    <p className="text-xs text-slate-500 font-semibold">No active visit. Start a new visit:</p>
                    <input
                      type="text"
                      placeholder="Visitor / Staff Name"
                      value={checkInForm.visitorName}
                      onChange={e => setCheckInForm(f => ({ ...f, visitorName: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                    <select
                      value={checkInForm.purpose}
                      onChange={e => setCheckInForm(f => ({ ...f, purpose: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none font-semibold text-slate-700"
                    >
                      <option>Routine Visit</option>
                      <option>Payment Collection</option>
                      <option>Stock Delivery</option>
                      <option>New Order</option>
                      <option>Complaint Resolution</option>
                      <option>Product Demo</option>
                    </select>
                    <textarea
                      placeholder="Remarks (optional)…"
                      value={checkInForm.remarks}
                      onChange={e => setCheckInForm(f => ({ ...f, remarks: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none"
                    />
                    <button
                      onClick={handleCheckIn}
                      disabled={checkInSubmitting}
                      className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      {checkInSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CircleDot className="w-4 h-4" />}
                      Check In
                    </button>
                  </div>
                ) : (
                  /* Active visit — checkout form */
                  <div className="space-y-3">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-xs font-bold text-emerald-800">Active Visit: {activeVisit.visitorName} — {activeVisit.purpose}</span>
                    </div>
                    <textarea
                      placeholder="Visit outcome / remarks…"
                      value={checkOutForm.outcome}
                      onChange={e => setCheckOutForm(f => ({ ...f, outcome: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block mb-1">Payment Collected (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={checkOutForm.paymentsCollected}
                          onChange={e => setCheckOutForm(f => ({ ...f, paymentsCollected: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none font-bold"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block mb-1">Payment Method</label>
                        <select
                          value={checkOutForm.paymentMethod}
                          onChange={e => setCheckOutForm(f => ({ ...f, paymentMethod: e.target.value }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none font-semibold"
                        >
                          <option value="CASH">Cash</option>
                          <option value="ONLINE">Online / UPI</option>
                          <option value="NONE">No Payment</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 font-bold block mb-1">Next Revisit Date</label>
                      <input
                        type="date"
                        value={checkOutForm.revisitDate}
                        onChange={e => setCheckOutForm(f => ({ ...f, revisitDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={handleCheckOut}
                      disabled={checkOutSubmitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      {checkOutSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Complete Visit & Checkout
                    </button>
                  </div>
                )}
              </div>

              {/* Create New Invoice */}
              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-500" /> Billing
                  </h3>
                  <button
                    onClick={() => setShowBillModal(true)}
                    className="inline-flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> New Invoice
                  </button>
                </div>
                {invoicesLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-rose-500 animate-spin" /></div>
                ) : invoices.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No invoices yet.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {invoices.map(inv => (
                      <div key={inv.id} className="flex justify-between items-center text-xs border border-slate-100 rounded-xl p-3 hover:bg-slate-50">
                        <div>
                          <p className="font-bold text-slate-700">{inv.invoiceNo}</p>
                          <p className="text-slate-400">{fmtDate(inv.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-slate-800">{fmtCur(inv.totalAmount)}</p>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${inv.status === 'CLOSED' || inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {inv.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Visit History */}
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" /> Visit History
              </h3>
              {visitLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-rose-500 animate-spin" /></div>
              ) : visits.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No visits recorded yet.</p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {visits.map(v => (
                    <div key={v.id} className={`border rounded-xl p-3.5 text-xs ${v.checkOutTime ? 'border-slate-100 bg-white' : 'border-amber-100 bg-amber-50'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-slate-800">{v.purpose}</p>
                          <p className="text-slate-400 mt-0.5">{v.visitorName}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${v.checkOutTime ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                            {v.checkOutTime ? 'Completed' : 'Active'}
                          </span>
                          <p className="text-slate-400 mt-1">{fmtDate(v.date)}</p>
                        </div>
                      </div>
                      {v.outcome && <p className="text-slate-600 mt-1.5 border-t border-slate-100 pt-1.5">{v.outcome}</p>}
                      {v.remarks && <p className="text-slate-500 italic mt-1">{v.remarks}</p>}
                      {v.paymentsCollected > 0 && (
                        <p className="text-emerald-700 font-bold mt-1">Collected: {fmtCur(v.paymentsCollected)} via {v.paymentMethod}</p>
                      )}
                      {v.revisitDate && (
                        <p className="text-amber-600 font-bold mt-1">Next Visit: {fmtDate(v.revisitDate)}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ TAB: EXPENSES & OFFERS ═══════════════════════ */}
      {activeTab === 'expenses' && selectedStore && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Expenses Panel */}
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-rose-500" /> Expenses
                </h3>
                <button
                  onClick={() => setShowExpModal(true)}
                  className="inline-flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Log Expense
                </button>
              </div>
              {expLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-rose-500 animate-spin" /></div>
              ) : expenses.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No expenses logged.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {expenses.map(e => (
                    <div key={e.id} className="flex justify-between items-center text-xs border border-slate-100 rounded-xl p-3 hover:bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-700">{e.title}</p>
                        <p className="text-slate-400">{e.category} · {fmtDate(e.date)}</p>
                      </div>
                      <p className="font-black text-rose-600">{fmtCur(e.amount)}</p>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-slate-100 flex justify-between text-xs font-black text-slate-800">
                    <span>Total Expenses</span>
                    <span>{fmtCur(expenses.reduce((s, e) => s + (e.amount || 0), 0))}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Offers Panel */}
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Gift className="w-4 h-4 text-rose-500" /> Offer Distributions
                </h3>
                <button
                  onClick={() => setShowOfferModal(true)}
                  className="inline-flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Distribute
                </button>
              </div>
              {offerDists.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">No offer items distributed yet.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {offerDists.map(d => (
                    <div key={d.id} className="flex justify-between items-center text-xs border border-slate-100 rounded-xl p-3 hover:bg-slate-50">
                      <div>
                        <p className="font-bold text-slate-700">{d.offerItem?.name || 'Item'}</p>
                        <p className="text-slate-400">Qty: {d.quantity} · {fmtDate(d.date)}</p>
                        {d.notes && <p className="text-slate-400 italic">{d.notes}</p>}
                      </div>
                      <p className="font-black text-amber-700">
                        {fmtCur((d.offerItem?.purchaseCost || 0) * (d.quantity || 0))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════ TAB: P&L REPORT ═══════════════════════ */}
      {activeTab === 'report' && selectedStore && (
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider">P&L Report</h3>
              <p className="text-slate-400 text-xs">Financial summary for {selectedStore.name}</p>
            </div>
            <button
              onClick={() => fetchReport(selectedStore.id)}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>
          {reportLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
              <p className="text-slate-400 mt-2 text-sm">Compiling report…</p>
            </div>
          ) : report ? (
            <div className="space-y-5">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Billed" value={fmtCur(report.metrics.totalNetBilled)} icon={FileText} color="rose" />
                <StatCard label="Collected" value={fmtCur(report.metrics.totalCollected)} icon={CheckCircle} color="emerald" />
                <StatCard label="Pending" value={fmtCur(report.metrics.pendingAmount)} icon={Clock} color="amber" />
                <StatCard label="Total Discount" value={fmtCur(report.metrics.totalDiscount)} icon={Tag} color="blue" />
              </div>

              {/* P&L Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-3">
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase">Income & Costs</h4>
                  {[
                    { label: 'Initial Investment', value: report.metrics.initialInvestment, color: 'text-slate-700' },
                    { label: 'Total Expenses', value: report.metrics.totalExpenses, color: 'text-rose-600' },
                    { label: 'Offer/Promo Cost', value: report.metrics.totalOfferCost, color: 'text-amber-600' },
                    { label: 'Total Investment', value: report.metrics.totalInvestment, color: 'text-slate-900 font-black' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">{r.label}</span>
                      <span className={`font-bold ${r.color}`}>{fmtCur(r.value)}</span>
                    </div>
                  ))}
                </div>

                <div className={`rounded-2xl p-5 shadow-sm flex flex-col justify-center items-center border ${report.metrics.isProfitable ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 mb-1">{report.metrics.isProfitable ? '🎉 Profitable' : '⚠️ Loss'}</span>
                  <div className={`text-3xl font-black ${report.metrics.isProfitable ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {fmtCur(report.metrics.netProfit)}
                  </div>
                  <span className="text-xs opacity-70 mt-1">Net Profit / Loss</span>
                </div>

                <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-3">
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase">Expense Breakdown</h4>
                  {Object.entries(report.expenseBreakdown || {}).filter(([, v]) => v > 0).map(([cat, val]) => (
                    <div key={cat} className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 capitalize">{cat}</span>
                      <span className="font-bold text-slate-700">{fmtCur(val)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* GST Report */}
              <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
                <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-3">GST Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div><span className="text-slate-400 block text-[10px] font-bold">Total GST Collected</span><span className="font-black text-slate-800 text-lg">{fmtCur(report.metrics.totalGst)}</span></div>
                  <div><span className="text-slate-400 block text-[10px] font-bold">CGST (50%)</span><span className="font-bold text-slate-700">{fmtCur((report.metrics.totalGst || 0) / 2)}</span></div>
                  <div><span className="text-slate-400 block text-[10px] font-bold">SGST (50%)</span><span className="font-bold text-slate-700">{fmtCur((report.metrics.totalGst || 0) / 2)}</span></div>
                </div>
              </div>

              {/* Top Products */}
              {report.productDemands?.length > 0 && (
                <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
                  <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-3">Top Products by Demand</h4>
                  <div className="space-y-2">
                    {report.productDemands.slice(0, 8).map((pd, i) => (
                      <div key={pd.productId} className="flex items-center gap-3 text-xs">
                        <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-black flex items-center justify-center">{i + 1}</span>
                        <span className="flex-1 font-semibold text-slate-700">{pd.productName}</span>
                        <span className="text-slate-400">{pd.quantitySold} units</span>
                        <span className="font-bold text-slate-800">{fmtCur(pd.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No report data yet. Make some transactions first.</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════ MODALS ═══════════════════════ */}

      {/* Register Store Modal */}
      {showRegModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h2 className="font-black text-slate-800 text-base flex items-center gap-2">
                <Store className="w-5 h-5 text-rose-500" /> Register B2C Store
              </h2>
              <button onClick={() => setShowRegModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleRegister} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Store Name *', key: 'name', placeholder: 'e.g. Raji Stores', required: true },
                  { label: 'Owner Name', key: 'ownerName', placeholder: 'e.g. Rajan Kumar' },
                  { label: 'Owner Mobile *', key: 'ownerPhone', placeholder: '9876543210', required: true },
                  { label: 'Store Phone', key: 'phone', placeholder: 'Alternate number' },
                  { label: 'GST Number', key: 'gstNumber', placeholder: '29ABCDE1234F1Z5' },
                  { label: 'Initial Investment (₹)', key: 'initialInvestment', placeholder: '0', type: 'number' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-slate-500 font-bold mb-1">{f.label}</label>
                    <input
                      type={f.type || 'text'}
                      value={regForm[f.key]}
                      onChange={e => setRegForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      required={f.required}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">Address *</label>
                <input
                  type="text"
                  value={regForm.address}
                  onChange={e => setRegForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Full address"
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['city', 'state', 'pincode', 'zone'].map(key => (
                  <div key={key}>
                    <label className="block text-slate-500 font-bold mb-1 capitalize">{key}</label>
                    <input
                      type="text"
                      value={regForm[key]}
                      onChange={e => setRegForm(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">Classification</label>
                <select
                  value={regForm.classification}
                  onChange={e => setRegForm(p => ({ ...p, classification: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none font-semibold text-slate-700"
                >
                  <option value="RETAIL">Retail</option>
                  <option value="KIRANA">Kirana</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">Notes</label>
                <textarea
                  value={regForm.notes}
                  onChange={e => setRegForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="Any additional notes…"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowRegModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer">Cancel</button>
                <button type="submit" disabled={regSubmitting} className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer">
                  {regSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Register Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Store Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h2 className="font-black text-slate-800 text-base flex items-center gap-2">
                <Edit className="w-5 h-5 text-rose-500" /> Edit Store — {selectedStore?.name}
              </h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleEditSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: 'Store Name', key: 'name' },
                  { label: 'Owner Name', key: 'ownerName' },
                  { label: 'Owner Phone', key: 'ownerPhone' },
                  { label: 'Store Phone', key: 'phone' },
                  { label: 'GST Number', key: 'gstNumber' },
                  { label: 'Initial Investment (₹)', key: 'initialInvestment', type: 'number' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-slate-500 font-bold mb-1">{f.label}</label>
                    <input
                      type={f.type || 'text'}
                      value={editForm[f.key] || ''}
                      onChange={e => setEditForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">Address</label>
                <input type="text" value={editForm.address || ''} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['city', 'state', 'pincode', 'zone'].map(key => (
                  <div key={key}>
                    <label className="block text-slate-500 font-bold mb-1 capitalize">{key}</label>
                    <input type="text" value={editForm[key] || ''} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Classification</label>
                  <select value={editForm.classification || 'RETAIL'} onChange={e => setEditForm(p => ({ ...p, classification: e.target.value }))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-700">
                    <option value="RETAIL">Retail</option>
                    <option value="KIRANA">Kirana</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Next Revisit Date</label>
                  <input type="date" value={editForm.revisitDate ? new Date(editForm.revisitDate).toISOString().split('T')[0] : ''} onChange={e => setEditForm(p => ({ ...p, revisitDate: e.target.value }))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">Notes</label>
                <textarea value={editForm.notes || ''} onChange={e => setEditForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition cursor-pointer">Cancel</button>
                <button type="submit" disabled={editSubmitting} className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer">
                  {editSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bill / Invoice Creation Modal */}
      {showBillModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h2 className="font-black text-slate-800 text-base flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-rose-500" /> Create Invoice
              </h2>
              <button onClick={() => setShowBillModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Product Selection */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search products…"
                    value={billProductSearch}
                    onChange={e => setBillProductSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div className="max-h-72 overflow-y-auto border border-slate-100 rounded-xl">
                  {filteredBillProducts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addToBillCart(p)}
                      className="w-full flex justify-between items-center text-xs px-3 py-2.5 hover:bg-rose-50 border-b border-slate-50 last:border-0 transition cursor-pointer"
                    >
                      <span className="font-semibold text-slate-700 text-left">{p.name}</span>
                      <span className="font-black text-rose-500 shrink-0 ml-2">{fmtCur(p.mrp || p.price)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cart & Checkout */}
              <div className="space-y-3 text-xs">
                <p className="font-bold text-slate-600 uppercase text-[10px] tracking-wide">Cart ({billCart.length})</p>
                {billCart.length === 0 ? (
                  <div className="border border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400">Click products to add</div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {billCart.map(item => (
                      <div key={item.productId} className="flex items-center gap-2 border border-slate-100 rounded-xl p-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-700 truncate">{item.productName}</p>
                          <p className="text-slate-400">{fmtCur(item.price)} × {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => updateBillQty(item.productId, -1)} className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center hover:bg-slate-200 cursor-pointer"><Minus className="w-3 h-3" /></button>
                          <span className="font-black text-slate-800 w-5 text-center">{item.quantity}</span>
                          <button onClick={() => updateBillQty(item.productId, 1)} className="w-5 h-5 bg-slate-100 rounded flex items-center justify-center hover:bg-slate-200 cursor-pointer"><Plus className="w-3 h-3" /></button>
                          <button onClick={() => removeFromBillCart(item.productId)} className="text-rose-400 hover:text-rose-600 ml-1 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={billGst} onChange={e => setBillGst(e.target.checked)} className="rounded border-slate-300 text-rose-600 w-3.5 h-3.5" />
                      <span className="font-bold text-slate-600">Apply GST</span>
                    </label>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-semibold">Discount (₹)</span>
                    <input type="number" min="0" value={billDiscount} onChange={e => setBillDiscount(e.target.value)} placeholder="0" className="w-24 px-2 py-1.5 border border-slate-200 rounded-lg text-right font-bold focus:outline-none focus:ring-1 focus:ring-rose-500" />
                  </div>
                  <div className="border-t border-slate-100 pt-2 space-y-1">
                    <div className="flex justify-between"><span>Subtotal</span><span className="font-bold">{fmtCur(billSubtotal)}</span></div>
                    {billGst && <div className="flex justify-between text-slate-500"><span>GST</span><span>{fmtCur(billGstAmt)}</span></div>}
                    <div className="flex justify-between font-black text-sm text-slate-800 border-t border-slate-200 pt-2">
                      <span>Total</span><span className="text-rose-600">{fmtCur(billTotal)}</span>
                    </div>
                  </div>
                  <textarea value={billNotes} onChange={e => setBillNotes(e.target.value)} placeholder="Notes…" rows={1} className="w-full p-2 border border-slate-200 rounded-xl focus:outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleCreateInvoice('CASH')} disabled={billSubmitting || billCart.length === 0} className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 transition cursor-pointer">
                    {billSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />} Cash
                  </button>
                  <button onClick={() => handleCreateInvoice('ONLINE')} disabled={billSubmitting || billCart.length === 0} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 transition cursor-pointer">
                    {billSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />} Online
                  </button>
                  <button onClick={() => handleCreateInvoice(null)} disabled={billSubmitting || billCart.length === 0} className="col-span-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-1 transition cursor-pointer">
                    <FileText className="w-3.5 h-3.5" /> Create as Open (Pending)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h2 className="font-black text-slate-800 text-base flex items-center gap-2"><Receipt className="w-5 h-5 text-rose-500" /> Log Expense</h2>
              <button onClick={() => setShowExpModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Title *</label>
                <input type="text" value={expForm.title} onChange={e => setExpForm(p => ({ ...p, title: e.target.value }))} required placeholder="e.g. Auto fare to store" className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Amount (₹) *</label>
                  <input type="number" min="0" step="0.01" value={expForm.amount} onChange={e => setExpForm(p => ({ ...p, amount: e.target.value }))} required className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Date</label>
                  <input type="date" value={expForm.date} onChange={e => setExpForm(p => ({ ...p, date: e.target.value }))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">Category</label>
                <select value={expForm.category} onChange={e => setExpForm(p => ({ ...p, category: e.target.value }))} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-700">
                  <option value="TRAVEL">Travel</option>
                  <option value="FOOD">Food</option>
                  <option value="HOTEL">Hotel / Stay</option>
                  <option value="STORE">Store Setup</option>
                  <option value="OFFER">Offer / Promo</option>
                  <option value="MISC">Miscellaneous</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">Notes</label>
                <textarea value={expForm.notes} onChange={e => setExpForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowExpModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={expSubmitting} className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                  {expSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offer Distribution Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <h2 className="font-black text-slate-800 text-base flex items-center gap-2"><Gift className="w-5 h-5 text-rose-500" /> Distribute Offer Item</h2>
              <button onClick={() => setShowOfferModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleDistributeOffer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Offer Item *</label>
                <select value={offerForm.offerItemId} onChange={e => setOfferForm(p => ({ ...p, offerItemId: e.target.value }))} required className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none font-semibold text-slate-700">
                  <option value="">Select Item</option>
                  {offerItems.map(item => (
                    <option key={item.id} value={item.id}>{item.name} (Available: {item.quantity})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">Quantity *</label>
                <input type="number" min="1" value={offerForm.quantity} onChange={e => setOfferForm(p => ({ ...p, quantity: e.target.value }))} required className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none" />
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">Notes</label>
                <textarea value={offerForm.notes} onChange={e => setOfferForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none" />
              </div>
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowOfferModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={offerSubmitting} className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                  {offerSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Distribute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
