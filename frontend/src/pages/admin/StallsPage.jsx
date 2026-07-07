// src/pages/admin/StallsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, 
  Store, 
  User, 
  MapPin, 
  TrendingUp, 
  IndianRupee, 
  Calendar, 
  Activity, 
  CheckCircle,
  FileText,
  DollarSign,
  ChevronRight,
  Loader2,
  AlertTriangle,
  Lock,
  Unlock,
  Upload,
  Check,
  Image,
  CreditCard,
  Search
} from 'lucide-react';
import { BACKEND_URL } from '../../store/authStore';

export default function StallsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State (Stage 1 Register)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [registrationAmount, setRegistrationAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Stepper Workflow Modal State
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [workflowTab, setWorkflowTab] = useState(1);
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [stockDraft, setStockDraft] = useState({}); // { [productId]: qty }
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Expenses Form State (Stage 4)
  const [expenses, setExpenses] = useState({
    store: 0,
    travel: 0,
    food: 0,
    hotel: 0,
    offer: 0,
    billUrl: ''
  });
  const [uploadingBill, setUploadingBill] = useState(false);
  const [savingExpenses, setSavingExpenses] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/stalls/sessions');
      setSessions(res.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch stall sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axios.post('/stalls/sessions', {
        name,
        location,
        operatorName,
        registrationAmount: parseFloat(registrationAmount || 0)
      });
      setName('');
      setLocation('');
      setOperatorName('');
      setRegistrationAmount('');
      setShowCreateModal(false);
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenWorkflow = async (session) => {
    setSelectedSession(session);
    setWorkflowTab(session.stage || 1);
    setShowWorkflowModal(true);
    setStockDraft({});
    
    // Load products list for Stage 2
    fetchProducts();

    // If session is already in Stage 5, fetch report immediately
    if (session.stage === 5 || session.status === 'CLOSED') {
      fetchReport(session.id);
    }

    // Set initial expenses draft if they exist
    if (session.expenses) {
      setExpenses({
        store: session.expenses.store || 0,
        travel: session.expenses.travel || 0,
        food: session.expenses.food || 0,
        hotel: session.expenses.hotel || 0,
        offer: session.expenses.offer || 0,
        billUrl: session.expenses.billUrl || ''
      });
    } else {
      setExpenses({ store: 0, travel: 0, food: 0, hotel: 0, offer: 0, billUrl: '' });
    }

    // Initialize stock draft from existing configured products if in DRAFT mode
    if (session.products && session.stockStatus !== 'FROZEN') {
      const draft = {};
      session.products.forEach(p => {
        draft[p.productId] = p.initialStock;
      });
      setStockDraft(draft);
    }
  };

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await axios.get('/products');
      setAllProducts(res.data.data);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchReport = async (id) => {
    try {
      setReportLoading(true);
      const res = await axios.get(`/stalls/sessions/${id}/report`);
      setReportData(res.data.data);
    } catch (err) {
      console.error('Failed to load report data', err);
    } finally {
      setReportLoading(false);
    }
  };

  const handleSaveStockDraft = async () => {
    try {
      setSavingExpenses(true);
      const configuredProducts = allProducts
        .filter(p => stockDraft[p.id] !== undefined && parseInt(stockDraft[p.id]) > 0)
        .map(p => ({
          productId: p.id,
          productName: p.name,
          initialStock: parseInt(stockDraft[p.id]),
          price: parseFloat(p.mrp || p.price || 0)
        }));

      const res = await axios.put(`/stalls/sessions/${selectedSession.id}/stock`, {
        products: configuredProducts
      });

      setSelectedSession(res.data.data);
      alert('Stock configuration draft saved successfully!');
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save stock draft');
    } finally {
      setSavingExpenses(false);
    }
  };

  const handleFreezeStock = async () => {
    if (!window.confirm('Are you sure you want to freeze this stock list? The stock quantities will be locked, and billing will become active.')) {
      return;
    }
    try {
      setSavingExpenses(true);
      // First save draft to make sure latest values are stored
      const configuredProducts = allProducts
        .filter(p => stockDraft[p.id] !== undefined && parseInt(stockDraft[p.id]) > 0)
        .map(p => ({
          productId: p.id,
          productName: p.name,
          initialStock: parseInt(stockDraft[p.id]),
          price: parseFloat(p.mrp || p.price || 0)
        }));

      await axios.put(`/stalls/sessions/${selectedSession.id}/stock`, {
        products: configuredProducts
      });

      // Then freeze
      const res = await axios.post(`/stalls/sessions/${selectedSession.id}/freeze`);
      setSelectedSession(res.data.data);
      setWorkflowTab(3); // Advance to Stage 3 sales
      fetchSessions();
      alert('Stock list frozen successfully! Stall Billing Terminal is now active.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to freeze stock');
    } finally {
      setSavingExpenses(false);
    }
  };

  const handleUnfreezeStock = async () => {
    if (!window.confirm('Are you sure you want to unfreeze the stock list? Billing will be disabled while editing.')) {
      return;
    }
    try {
      setSavingExpenses(true);
      const res = await axios.post(`/stalls/sessions/${selectedSession.id}/unfreeze`);
      setSelectedSession(res.data.data);
      setWorkflowTab(2); // Go back to Stage 2 configuration
      fetchSessions();
      alert('Stock list unfrozen. You can now edit product stock quantities.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unfreeze stock');
    } finally {
      setSavingExpenses(false);
    }
  };

  const handleUploadBill = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('bill', file);

    try {
      setUploadingBill(true);
      const res = await axios.post(`/stalls/sessions/${selectedSession.id}/upload-bill`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setExpenses(prev => ({ ...prev, billUrl: res.data.billUrl }));
      alert('Receipt uploaded successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to upload receipt file');
    } finally {
      setUploadingBill(false);
    }
  };

  const handleSaveExpenses = async (e) => {
    e.preventDefault();
    try {
      setSavingExpenses(true);
      const res = await axios.put(`/stalls/sessions/${selectedSession.id}/expenses`, expenses);
      setSelectedSession(res.data.data);
      setWorkflowTab(5); // Advance to Stage 5 Consolidated Report
      fetchReport(selectedSession.id);
      fetchSessions();
      alert('Expenses saved successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save expenses');
    } finally {
      setSavingExpenses(false);
    }
  };

  const handleCloseSession = async (id) => {
    if (!window.confirm('Are you sure you want to CLOSE this stall session permanently? No further transactions or stock modifications can be made.')) {
      return;
    }
    try {
      setSavingExpenses(true);
      const res = await axios.post(`/stalls/sessions/${id}/close`);
      setSelectedSession(res.data.data);
      fetchReport(id);
      fetchSessions();
      alert('Stall session closed successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close session');
    } finally {
      setSavingExpenses(false);
    }
  };

  const getUploadedImageUrl = (path) => {
    if (!path) return '';
    return `${BACKEND_URL.replace('/api', '')}/${path}`;
  };

  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="w-7 h-7 text-rose-500" />
            B2C Stall Module
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage high-speed direct-to-customer stall billing, locations, and real-time profitability metrics.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Start New Stall Session
        </button>
      </div>

      {/* Main Sessions Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
          <p className="text-slate-500 mt-2 font-medium">Loading stall sessions...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">No Stall Sessions Yet</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mt-1">
            Start your first direct sales session to manage on-site billing and live event reports.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            Launch Stall Session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((sess) => (
            <div 
              key={sess.id} 
              className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                sess.status === 'ACTIVE' ? 'border-rose-100 bg-gradient-to-tr from-white to-rose-50/20' : 'border-slate-200'
              }`}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  sess.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  <span className={`w-1 h-1 rounded-full ${sess.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  {sess.status}
                </span>
                <span className="bg-slate-150 text-slate-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  Stage {sess.stage || 1}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 pr-24 leading-snug">{sess.name}</h3>
                
                {/* Session Details */}
                <div className="space-y-2 mt-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{sess.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Operator: <strong className="text-slate-700">{sess.operatorName}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-slate-400" />
                    <span>Reg Amount: <strong className="text-slate-700">₹{sess.registrationAmount?.toLocaleString() || sess.investment?.toLocaleString()}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Opened: {new Date(sess.startDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 gap-2.5 mt-6 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleOpenWorkflow(sess)}
                  className="bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Activity className="w-3.5 h-3.5" />
                  Manage Workflow & Stepper
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Start Session Modal (Stage 1 Register) */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-black text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Store className="w-5 h-5 text-rose-500" />
              Launch Stall Session (Stage 1)
            </h2>
            <form onSubmit={handleCreateSession} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Stall Name / Event</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pondicherry Food Fest Stall 1"
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Location</label>
                <input 
                  type="text" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Pondicherry"
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Operator Name (Staff In-Charge)</label>
                <input 
                  type="text" 
                  value={operatorName} 
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="e.g. Murali Krishnan"
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Registration Amount / Stall Investment (₹)</label>
                <input 
                  type="number" 
                  value={registrationAmount} 
                  onChange={(e) => setRegistrationAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                  min="0"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Register & Proceed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Multi-Stage Stepper Workflow Modal */}
      {showWorkflowModal && selectedSession && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Store className="w-6 h-6 text-rose-500" />
                  {selectedSession.name} Workflow Dashboard
                </h2>
                <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-2">
                  <span>Location: <strong>{selectedSession.location}</strong></span> • 
                  <span>Operator: <strong>{selectedSession.operatorName}</strong></span>
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowWorkflowModal(false);
                  fetchSessions();
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-3.5 mb-6 text-xs font-semibold text-slate-500 overflow-x-auto">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={s > (selectedSession.stage || 1) && selectedSession.status === 'ACTIVE'}
                  onClick={() => setWorkflowTab(s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    workflowTab === s 
                      ? 'bg-rose-500 text-white shadow-sm font-bold scale-105' 
                      : s <= (selectedSession.stage || 1)
                        ? 'text-rose-600 bg-rose-50 hover:bg-rose-100/70 font-semibold cursor-pointer'
                        : 'text-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    workflowTab === s 
                      ? 'bg-white text-rose-500 font-bold' 
                      : s <= (selectedSession.stage || 1)
                        ? 'bg-rose-100 text-rose-600 font-semibold'
                        : 'bg-slate-200 text-slate-400'
                  }`}>
                    {s}
                  </span>
                  <span>
                    {s === 1 && 'Register'}
                    {s === 2 && 'Configure Stock'}
                    {s === 3 && 'Billing & Sales'}
                    {s === 4 && 'Expenses'}
                    {s === 5 && 'Consolidated Report'}
                  </span>
                </button>
              ))}
            </div>

            {/* Stepper Content */}
            <div className="space-y-6 min-h-[300px]">

              {/* Stage 1 Content: Register Stall */}
              {workflowTab === 1 && (
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Stage 1: Stall Registration Info</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <div>
                      <span className="text-slate-400 text-xs font-bold uppercase block mb-0.5">Stall/Event Name</span>
                      <strong className="text-slate-800 font-bold text-lg">{selectedSession.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs font-bold uppercase block mb-0.5">Location</span>
                      <strong className="text-slate-800 text-base">{selectedSession.location}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs font-bold uppercase block mb-0.5">Operator Name</span>
                      <strong className="text-slate-800 text-base">{selectedSession.operatorName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs font-bold uppercase block mb-0.5">Registration Amount</span>
                      <strong className="text-rose-500 font-black text-xl">₹{selectedSession.registrationAmount?.toLocaleString()}</strong>
                    </div>
                  </div>
                  <div className="bg-emerald-50 text-emerald-800 text-xs font-semibold p-4 rounded-xl border border-emerald-100 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Stall is successfully registered. Please proceed to Stage 2: Configure Stock.</span>
                  </div>
                </div>
              )}

              {/* Stage 2 Content: Stock Configuration */}
              {workflowTab === 2 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Stage 2: Configure Products & Stock</h3>
                      <p className="text-slate-500 text-xs mt-0.5">Configure which products are issued to the stall and freeze the list to activate billing.</p>
                    </div>
                    {selectedSession.stockStatus === 'FROZEN' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl">
                        <Lock className="w-3.5 h-3.5" />
                        Stock Configuration Frozen
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 border border-yellow-100 px-3 py-1.5 rounded-xl">
                        <Unlock className="w-3.5 h-3.5" />
                        Editable Draft Mode
                      </span>
                    )}
                  </div>

                  {selectedSession.stockStatus === 'FROZEN' ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center">
                            <Lock className="w-5 h-5 text-rose-500" />
                          </div>
                          <div>
                            <strong className="text-slate-800 text-sm font-bold block">Frozen Product Catalog</strong>
                            <span className="text-slate-500 text-xs">Total Products Configured: {selectedSession.products?.length || 0}</span>
                          </div>
                        </div>
                        {selectedSession.status === 'ACTIVE' && (
                          <button
                            onClick={handleUnfreezeStock}
                            disabled={savingExpenses}
                            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition shadow-sm cursor-pointer"
                          >
                            {savingExpenses ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
                            Unfreeze to Edit Config
                          </button>
                        )}
                      </div>

                      <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-100">
                              <th className="p-3">Product Name</th>
                              <th className="p-3 text-center">Unit Price (₹)</th>
                              <th className="p-3 text-center">Initial Issued Stock</th>
                              <th className="p-3 text-center">Current Remaining Stock</th>
                              <th className="p-3 text-right">Cost Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(selectedSession.products || []).map((p) => (
                              <tr key={p.productId} className="border-b border-slate-50 hover:bg-slate-50/50">
                                <td className="p-3 font-semibold text-slate-700">{p.productName}</td>
                                <td className="p-3 text-center font-bold text-slate-850">₹{p.price}</td>
                                <td className="p-3 text-center font-bold text-slate-850">{p.initialStock}</td>
                                <td className={`p-3 text-center font-bold ${p.currentStock <= 5 ? 'text-rose-600 bg-rose-50/50' : 'text-slate-850'}`}>{p.currentStock}</td>
                                <td className="p-3 text-right font-bold text-slate-850">₹{(p.initialStock * p.price).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Search and draft tools */}
                      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-slate-50 border border-slate-100 rounded-xl p-3">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                          <input
                            type="text"
                            placeholder="Search products by name or SKU..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 bg-white"
                          />
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={handleSaveStockDraft}
                            disabled={savingExpenses}
                            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition shadow-sm cursor-pointer"
                          >
                            {savingExpenses && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Save Draft
                          </button>
                          <button
                            onClick={handleFreezeStock}
                            disabled={savingExpenses}
                            className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition shadow-sm cursor-pointer"
                          >
                            {savingExpenses && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Freeze & Activate Billing
                          </button>
                        </div>
                      </div>

                      {/* Products setup list */}
                      {productsLoading ? (
                        <div className="flex justify-center items-center py-10">
                          <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-[350px] overflow-y-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200 sticky top-0 z-10">
                                <th className="p-3">Product Name</th>
                                <th className="p-3">SKU</th>
                                <th className="p-3 text-center">Price / MRP</th>
                                <th className="p-3 text-center w-36">Initial Stock Issued</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredProducts.map((p) => {
                                const val = stockDraft[p.id] || '';
                                return (
                                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                    <td className="p-3 font-semibold text-slate-700">{p.name}</td>
                                    <td className="p-3 text-slate-500 font-mono">{p.sku}</td>
                                    <td className="p-3 text-center font-bold text-slate-750">₹{p.mrp || p.price}</td>
                                    <td className="p-3 text-center">
                                      <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={val}
                                        onChange={(e) => {
                                          const v = e.target.value;
                                          setStockDraft(prev => {
                                            const updated = { ...prev };
                                            if (v === '' || parseInt(v) <= 0) {
                                              delete updated[p.id];
                                            } else {
                                              updated[p.id] = parseInt(v);
                                            }
                                            return updated;
                                          });
                                        }}
                                        className="w-24 text-center border border-slate-200 rounded-lg py-1 px-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500 font-bold text-slate-800"
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Stage 3 Content: Billing & Sales */}
              {workflowTab === 3 && (
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Stage 3: Sales & Billing Terminal</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Redirect to the direct billing terminal to record cash/online sales with stock limit validation.</p>
                  </div>

                  {selectedSession.stockStatus !== 'FROZEN' ? (
                    <div className="bg-yellow-50 text-yellow-800 text-xs font-semibold p-4 rounded-xl border border-yellow-100 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
                      <span>Billing cannot be opened because the product stock list is not frozen yet. Go back to Stage 2: Configure Stock and click "Freeze Stock List".</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                      {/* Left card: stats & link */}
                      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div>
                            <strong className="text-slate-800 font-black text-lg block">Open Billing Console</strong>
                            <p className="text-slate-500 text-xs mt-0.5">Launch the high-speed direct-to-customer POS billing page for this session.</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            window.open(`/admin/stall-billing?sessionId=${selectedSession.id}`, '_blank');
                          }}
                          className="w-full mt-6 bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                        >
                          <Store className="w-4 h-4" />
                          Launch Billing Terminal (New Tab)
                        </button>
                      </div>

                      {/* Right card: info message */}
                      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                        <div className="space-y-3 text-slate-600 text-xs">
                          <strong className="text-slate-800 text-sm font-bold block uppercase tracking-wider text-rose-500">POS Guidelines</strong>
                          <ul className="list-disc pl-4 space-y-1.5">
                            <li>Enforces inventory limits dynamically based on the Stage 2 frozen stock quantities.</li>
                            <li>Allows manual price overrides on the fly.</li>
                            <li>Supports flat transaction-level discount entries.</li>
                            <li>Transactions are immediately synchronized to the P&L report sheet.</li>
                          </ul>
                        </div>

                        {selectedSession.status === 'ACTIVE' && (
                          <button
                            onClick={() => setWorkflowTab(4)}
                            className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                          >
                            Proceed to Stage 4: Expenses
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stage 4 Content: Expenses */}
              {workflowTab === 4 && (
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Stage 4: Record Stall Expenses</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Input operational costs and upload receipts to build the consolidated P&L report.</p>
                  </div>

                  <form onSubmit={handleSaveExpenses} className="space-y-4 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Store / Setup Expenses (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={expenses.store}
                          onChange={(e) => setExpenses(prev => ({ ...prev, store: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-850"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Travel Expenses (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={expenses.travel}
                          onChange={(e) => setExpenses(prev => ({ ...prev, travel: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-850"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Food Expenses (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={expenses.food}
                          onChange={(e) => setExpenses(prev => ({ ...prev, food: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-850"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Hotel / Stay Expenses (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={expenses.hotel}
                          onChange={(e) => setExpenses(prev => ({ ...prev, hotel: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-850"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Offer / Promotion Expenses (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={expenses.offer}
                          onChange={(e) => setExpenses(prev => ({ ...prev, offer: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-850"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Receipt / Bill Upload</label>
                        <div className="flex gap-2 items-center">
                          <label className="cursor-pointer border border-dashed border-slate-350 hover:bg-slate-50 transition p-2.5 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 flex-1">
                            {uploadingBill ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-slate-400" />}
                            <span>{expenses.billUrl ? 'Change Receipt' : 'Upload Receipt'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleUploadBill}
                              className="hidden"
                            />
                          </label>
                          {expenses.billUrl && (
                            <a
                              href={getUploadedImageUrl(expenses.billUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-rose-50 hover:bg-rose-100 border border-rose-100 p-2 rounded-lg text-rose-600 transition shrink-0"
                            >
                              <Image className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                      <button
                        type="submit"
                        disabled={savingExpenses || uploadingBill}
                        className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                      >
                        {savingExpenses && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Save & Generate Report
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Stage 5 Content: Consolidated Report */}
              {workflowTab === 5 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Stage 5: Consolidated Stall Report</h3>
                      <p className="text-slate-500 text-xs mt-0.5">Real-time P&L calculations and product breakdown metrics for the stall event.</p>
                    </div>
                    {selectedSession.status === 'CLOSED' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl">
                        <CheckCircle className="w-3.5 h-3.5 text-slate-500" />
                        Stall Session Finalized & Closed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                        <Activity className="w-3.5 h-3.5 text-emerald-500" />
                        Stall Active
                      </span>
                    )}
                  </div>

                  {reportLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                      <p className="text-slate-500 mt-2">Compiling report data...</p>
                    </div>
                  ) : reportData ? (
                    <div className="space-y-6">
                      {/* Financial Metrics Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 shadow-sm">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Registration Amount</span>
                          <div className="text-lg font-black text-slate-800 mt-1">
                            ₹{reportData.metrics.registrationAmount?.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 shadow-sm">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Issued Stock Value</span>
                          <div className="text-lg font-black text-slate-800 mt-1">
                            ₹{reportData.metrics.stockIssuedValue?.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 shadow-sm">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Gross Sales Revenue</span>
                          <div className="text-lg font-black text-slate-800 mt-1">
                            ₹{reportData.metrics.grossSales?.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 shadow-sm">
                          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Discounts Given</span>
                          <div className="text-lg font-black text-rose-600 mt-1">
                            - ₹{reportData.metrics.discounts?.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Total P&L Highlight Card */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                        <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                          <div>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Net Income</span>
                            <div className="text-2xl font-black text-slate-800 mt-0.5">
                              ₹{reportData.metrics.totalIncome?.toLocaleString()}
                            </div>
                            <span className="text-[10px] text-slate-500">Gross Sales minus discounts.</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total expenses</span>
                            <div className="text-lg font-black text-slate-800 mt-0.5">
                              ₹{reportData.metrics.totalExpenses?.toLocaleString()}
                            </div>
                            <span className="text-[10px] text-slate-500">Reg fee, store, travel, food, stay, offers.</span>
                          </div>
                        </div>

                        <div className={`border rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-sm ${
                          reportData.metrics.netProfit >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                        }`}>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">Net Profit / Loss</span>
                            <div className="text-3xl font-black mt-1">
                              ₹{reportData.metrics.netProfit?.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs font-bold block">
                              {reportData.metrics.netProfit >= 0 ? '🎉 Profitable Stall' : '⚠️ Non-Profitable Stall'}
                            </span>
                            <span className="text-[10px] opacity-80 block mt-0.5">
                              {reportData.metrics.netProfit >= 0 ? 'Net positive margins generated at event.' : 'Expenses exceeded sales income at event.'}
                            </span>
                          </div>
                        </div>

                        {/* File receipt box and actions */}
                        <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-between space-y-3">
                          <div>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Receipt Attachment</span>
                            {selectedSession.expenses?.billUrl ? (
                              <a
                                href={getUploadedImageUrl(selectedSession.expenses.billUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600 transition"
                              >
                                <Image className="w-4 h-4" />
                                View Uploaded Receipt Bill
                              </a>
                            ) : (
                              <span className="text-slate-500 text-xs italic">No receipt file uploaded.</span>
                            )}
                          </div>

                          {selectedSession.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleCloseSession(selectedSession.id)}
                              disabled={savingExpenses}
                              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer active:scale-95"
                            >
                              {savingExpenses ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                              Close Session & Finalize Stall
                            </button>
                          ) : (
                            <div className="bg-slate-100 border border-slate-200 p-3 rounded-xl text-center text-xs font-bold text-slate-600 flex items-center justify-center gap-1">
                              <Check className="w-4 h-4 text-emerald-500" />
                              Closed Event Ledger
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Product Demand Performance */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">Stock Issued Summary</h4>
                          <div className="border border-slate-150 rounded-xl overflow-hidden bg-white shadow-sm max-h-[250px] overflow-y-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-100 sticky top-0">
                                  <th className="p-2.5">Product</th>
                                  <th className="p-2.5 text-center">Issued Qty</th>
                                  <th className="p-2.5 text-center">Rem Qty</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reportData.stockIssued.map((prod) => (
                                  <tr key={prod.productId} className="border-b border-slate-50 hover:bg-slate-50/50">
                                    <td className="p-2.5 font-semibold text-slate-700">{prod.productName}</td>
                                    <td className="p-2.5 text-center font-bold text-slate-800">{prod.initialStock}</td>
                                    <td className={`p-2.5 text-center font-bold ${prod.currentStock <= 5 ? 'text-rose-600' : 'text-slate-800'}`}>{prod.currentStock}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">Sales breakdown</h4>
                          <div className="border border-slate-150 rounded-xl overflow-hidden bg-white shadow-sm max-h-[250px] overflow-y-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-100 sticky top-0">
                                  <th className="p-2.5">Product</th>
                                  <th className="p-2.5 text-center">Sold Qty</th>
                                  <th className="p-2.5 text-right">Revenue</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reportData.productDemands.map((prod) => (
                                  <tr key={prod.productId} className="border-b border-slate-50 hover:bg-slate-50/50">
                                    <td className="p-2.5 font-semibold text-slate-700">{prod.productName}</td>
                                    <td className="p-2.5 text-center font-bold text-slate-800">{prod.quantitySold}</td>
                                    <td className="p-2.5 text-right font-bold text-slate-800">₹{prod.totalRevenue?.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-400 text-sm">
                      Failed to compile report. Please ensure sales data exists.
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-right">
              <button
                onClick={() => {
                  setShowWorkflowModal(false);
                  fetchSessions();
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close Workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
