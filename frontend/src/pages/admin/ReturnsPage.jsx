// src/pages/admin/ReturnsPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  RotateCcw, Plus, Trash2, CheckCircle2, XCircle, Clock,
  Building2, Package, Eye, AlertTriangle, User, Phone,
  ChevronDown, ChevronUp, Tag, Hash, Calendar, FileText,
  ArrowUpLeft, ArrowDownRight, IndianRupee, Warehouse
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const STATUS_STYLE = {
  PENDING:  'bg-amber-50 text-amber-800 border-amber-200 animate-pulse',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
};
const STATUS_ICON = {
  PENDING:  <Clock className="w-3 h-3" />,
  APPROVED: <CheckCircle2 className="w-3 h-3" />,
  REJECTED: <XCircle className="w-3 h-3" />,
};

export default function ReturnsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [returns, setReturns]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [products, setProducts]       = useState([]);
  const [stores, setStores]           = useState([]);
  const [message, setMessage]         = useState({ text: '', type: '' });
  const [expandedId, setExpandedId]   = useState(null);

  // Return Wizard
  const [returnType, setReturnType]   = useState('DEALER_TO_WAREHOUSE');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState('1');
  const [itemReason, setItemReason]   = useState('Defective/Expired');
  const [customReason, setCustomReason] = useState('');
  const [returnItems, setReturnItems] = useState([]);
  const [notes, setNotes]             = useState('');
  const [submitting, setSubmitting]   = useState(false);

  // Detail modal
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [decisionNotes, setDecisionNotes]   = useState('');
  const [processingDecision, setProcessingDecision] = useState(false);

  useEffect(() => {
    fetchReturns();
    if (!isAdmin) { fetchProducts(); fetchStores(); }
  }, [statusFilter, returnType]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (!isAdmin) params.type = returnType;
      const res = await axios.get('/returns', { params });
      setReturns(res.data.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchProducts = async () => {
    try { const res = await axios.get('/products'); setProducts(res.data.data || []); } catch {}
  };
  const fetchStores = async () => {
    try { const res = await axios.get('/stores'); setStores(res.data.data || []); } catch {}
  };

  const handleAddToReturnCart = () => {
    if (!selectedProductId || parseInt(selectedQty) <= 0) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;
    const finalReason = itemReason === 'Other' ? (customReason.trim() || 'Other') : itemReason;
    const existing = returnItems.findIndex(i => i.productId === selectedProductId);
    if (existing > -1) {
      const updated = [...returnItems];
      updated[existing].quantity += parseInt(selectedQty);
      updated[existing].reason = finalReason;
      setReturnItems(updated);
    } else {
      setReturnItems([...returnItems, { productId: selectedProductId, product: prod, quantity: parseInt(selectedQty), reason: finalReason }]);
    }
    setSelectedProductId(''); setSelectedQty('1'); setItemReason('Defective/Expired'); setCustomReason('');
  };

  const handleRemoveFromReturnCart = (prodId) => setReturnItems(returnItems.filter(i => i.productId !== prodId));

  const handleInitiateReturn = async (e) => {
    e.preventDefault();
    if (returnItems.length === 0) return;
    setSubmitting(true); setMessage({ text: '', type: '' });
    try {
      await axios.post('/returns', {
        type: returnType,
        storeId: returnType === 'STORE_TO_DEALER' ? selectedStoreId : undefined,
        items: returnItems.map(i => ({ productId: i.productId, quantity: i.quantity, reason: i.reason })),
        notes
      });
      setMessage({
        text: returnType === 'DEALER_TO_WAREHOUSE'
          ? 'Return request submitted. Awaiting admin approval.'
          : 'Store return logged. Approve below to update your stock.',
        type: 'success'
      });
      setReturnItems([]); setSelectedStoreId(''); setNotes(''); fetchReturns();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to submit return', type: 'error' });
    } finally { setSubmitting(false); }
  };

  const handleProcessReturn = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status === 'APPROVED' ? 'approve' : 'reject'} this return?`)) return;
    setProcessingDecision(true);
    try {
      await axios.patch(`/returns/${id}/status`, { status, notes: decisionNotes });
      setMessage({ text: `Return ${status.toLowerCase()} successfully. Stock adjusted.`, type: 'success' });
      setShowDetailModal(false); setSelectedReturn(null); setDecisionNotes(''); fetchReturns();
    } catch (err) { alert(err.response?.data?.message || 'Failed to process return'); }
    finally { setProcessingDecision(false); }
  };

  // Calculate total returned value for a return record
  const calcReturnValue = (items) =>
    (items || []).reduce((sum, i) => sum + ((i.product?.price || 0) * i.quantity), 0);

  const filteredReturns = returns.filter(r => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Returns &amp; Defective Stock</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            {isAdmin
              ? 'Review and approve dealer return requests. Approved returns auto-adjust warehouse inventory.'
              : 'Log returns to central warehouse or receive store returns. Track status and stock impact.'}
          </p>
        </div>
        {/* Summary chips */}
        <div className="hidden sm:flex items-center space-x-2 text-xs">
          {['PENDING', 'APPROVED', 'REJECTED'].map(s => {
            const count = returns.filter(r => r.status === s).length;
            if (!count) return null;
            return (
              <span key={s} className={`flex items-center space-x-1 px-2.5 py-1 rounded-full border font-bold text-[10px] ${STATUS_STYLE[s]}`}>
                {STATUS_ICON[s]}
                <span>{count} {s.toLowerCase()}</span>
              </span>
            );
          })}
        </div>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT PANEL */}
        <div className="lg:col-span-1 space-y-4">

          {/* Dealer: Return Wizard */}
          {!isAdmin && (
            <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Create New Return</h3>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'DEALER_TO_WAREHOUSE', icon: ArrowUpLeft, label: 'Return to Central' },
                  { val: 'STORE_TO_DEALER',     icon: ArrowDownRight, label: 'Store Return to Me' },
                ].map(({ val, icon: Icon, label }) => (
                  <button key={val}
                    onClick={() => { setReturnType(val); setReturnItems([]); }}
                    className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl border-2 text-[10px] font-bold transition-all cursor-pointer ${
                      returnType === val ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="space-y-3 text-xs">
                {returnType === 'STORE_TO_DEALER' && (
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Source Store *</label>
                    <select value={selectedStoreId} onChange={e => setSelectedStoreId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer">
                      <option value="">Choose store...</option>
                      {stores.map(s => <option key={s.id} value={s.id}>{s.name} — {s.city}</option>)}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 items-end">
                  <div className="col-span-2">
                    <label className="block text-slate-500 font-bold mb-1">Product</label>
                    <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer">
                      <option value="">Choose product...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Qty</label>
                    <input type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none font-bold" />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Return Reason</label>
                  <select value={itemReason} onChange={e => setItemReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer">
                    <option value="Defective/Expired">Defective or Expired</option>
                    <option value="Transit Damage">Transit / Packaging Damage</option>
                    <option value="Incorrect Item">Wrong Item Sent</option>
                    <option value="Quality Issue">Quality Complaints</option>
                    <option value="Customer Return">Returned by End Customer</option>
                    <option value="Other">Other (Specify)</option>
                  </select>
                  {itemReason === 'Other' && (
                    <input type="text" value={customReason} onChange={e => setCustomReason(e.target.value)}
                      placeholder="Describe the reason..." className="w-full mt-2 p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none" />
                  )}
                </div>

                <button type="button" onClick={handleAddToReturnCart} disabled={!selectedProductId}
                  className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer">
                  <Plus className="w-4 h-4" />
                  <span>Add to Return List</span>
                </button>
              </div>

              {/* Return cart */}
              {returnItems.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Return list ({returnItems.length} items)</span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    {returnItems.map(item => (
                      <div key={item.productId} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-800">{item.product.name}</p>
                          <p className="text-[9px] text-rose-600 font-black">{item.quantity} {item.product.unit}</p>
                          <p className="text-[9px] text-slate-400 italic">{item.reason}</p>
                        </div>
                        <button type="button" onClick={() => handleRemoveFromReturnCart(item.productId)}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-50 cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleInitiateReturn} className="space-y-3">
                    <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="2"
                      placeholder="Overall logistics remarks (optional)..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none text-xs" />
                    <button type="submit"
                      disabled={submitting || (returnType === 'STORE_TO_DEALER' && !selectedStoreId)}
                      className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer text-xs">
                      <RotateCcw className="w-4 h-4" />
                      <span>{submitting ? 'Recording...' : returnType === 'DEALER_TO_WAREHOUSE' ? 'Submit Return to Company' : 'Record Store Return'}</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Status Filter */}
          <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Filter by Status</h3>
            <div className="space-y-1.5">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(s => {
                const count = s === 'ALL' ? returns.length : returns.filter(r => r.status === s).length;
                return (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      statusFilter === s ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {s !== 'ALL' && STATUS_ICON[s]}
                      <span>{s === 'ALL' ? 'All Returns' : `${s.charAt(0) + s.slice(1).toLowerCase()} Returns`}</span>
                    </div>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      statusFilter === s ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Returns list */}
        <div className="lg:col-span-2 space-y-3">
          <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Returns Log</span>
              <span className="text-[10px] text-slate-400 font-bold">{filteredReturns.length} record{filteredReturns.length !== 1 ? 's' : ''}</span>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-rose-600" />
              </div>
            ) : filteredReturns.length === 0 ? (
              <div className="py-16 text-center">
                <RotateCcw className="w-10 h-10 text-slate-200 mx-auto mb-3 stroke-1" />
                <p className="text-xs text-slate-400 font-bold">No returns found</p>
                <p className="text-[10px] text-slate-400 mt-1">No return logs match this filter.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredReturns.map(ret => {
                  const totalValue = calcReturnValue(ret.items);
                  const totalUnits = (ret.items || []).reduce((s, i) => s + i.quantity, 0);
                  const isExpanded = expandedId === ret.id;

                  return (
                    <div key={ret.id} className="text-xs">
                      {/* Summary Row */}
                      <div
                        className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : ret.id)}
                      >
                        <div className="space-y-1.5 flex-1">
                          {/* Return No + Status + Type */}
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="font-black text-slate-800 text-xs">{ret.returnNo}</span>
                            <span className={`inline-flex items-center space-x-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${STATUS_STYLE[ret.status]}`}>
                              {STATUS_ICON[ret.status]}
                              <span>{ret.status}</span>
                            </span>
                            <span className={`inline-flex items-center space-x-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${
                              ret.type === 'DEALER_TO_WAREHOUSE' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-sky-50 text-sky-700 border-sky-200'
                            }`}>
                              {ret.type === 'DEALER_TO_WAREHOUSE' ? <ArrowUpLeft className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                              <span>{ret.type === 'DEALER_TO_WAREHOUSE' ? 'To Warehouse' : 'Store → Dealer'}</span>
                            </span>
                          </div>

                          {/* Dealer name (admin view) */}
                          {isAdmin && ret.dealer && (
                            <p className="text-[10px] text-slate-600 flex items-center space-x-1.5">
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <strong>{ret.dealer.companyName}</strong>
                              {ret.dealer.phone && <span className="text-slate-400">· {ret.dealer.phone}</span>}
                            </p>
                          )}

                          {/* Quick stats */}
                          <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{new Date(ret.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Package className="w-3 h-3 text-slate-400" />
                              <strong className="text-slate-700">{ret.items?.length || 0} SKUs</strong>
                              <span>({totalUnits} units)</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <IndianRupee className="w-3 h-3 text-slate-400" />
                              <strong className="text-rose-700">₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                              <span className="text-slate-400 text-[9px]">est. value</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          {ret.status === 'PENDING' && (
                            <button
                              onClick={e => { e.stopPropagation(); setSelectedReturn(ret); setDecisionNotes(ret.notes || ''); setShowDetailModal(true); }}
                              className="text-[10px] bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg font-bold cursor-pointer transition-colors"
                            >
                              {isAdmin ? 'Review & Decide' : 'View / Approve'}
                            </button>
                          )}
                          <div className="text-slate-400">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Detail Panel */}
                      {isExpanded && (
                        <div className="px-5 pb-5 border-t border-slate-100 bg-slate-50/30">
                          <div className="pt-4 space-y-4">

                            {/* Products Table */}
                            <div>
                              <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2">Returned Products Detail</span>
                              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                <table className="w-full text-left">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase text-slate-400">
                                      <th className="px-3 py-2.5">#</th>
                                      <th className="px-3 py-2.5">Product</th>
                                      <th className="px-3 py-2.5">SKU / HSN</th>
                                      <th className="px-3 py-2.5">Return Reason</th>
                                      <th className="px-3 py-2.5 text-right">Qty</th>
                                      <th className="px-3 py-2.5 text-right">Unit Price</th>
                                      <th className="px-3 py-2.5 text-right">Value</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {(ret.items || []).map((item, idx) => {
                                      const prod = item.product || {};
                                      const lineVal = (prod.price || 0) * item.quantity;
                                      return (
                                        <tr key={idx} className="hover:bg-slate-50/40">
                                          <td className="px-3 py-2.5 text-slate-400">{idx + 1}</td>
                                          <td className="px-3 py-2.5">
                                            <p className="font-bold text-slate-800">{prod.name || 'Unknown Product'}</p>
                                            <p className="text-[9px] text-slate-400">{prod.unit || 'PCS'}</p>
                                          </td>
                                          <td className="px-3 py-2.5">
                                            <p className="font-mono text-[10px] text-slate-600">{prod.sku || 'N/A'}</p>
                                            <p className="text-[9px] text-slate-400">HSN: {prod.hsnCode || 'N/A'}</p>
                                          </td>
                                          <td className="px-3 py-2.5">
                                            <span className="inline-block bg-amber-50 border border-amber-100 text-amber-800 text-[9px] font-semibold px-2 py-0.5 rounded-lg">
                                              {item.reason || 'Defective/Return'}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2.5 text-right font-black text-rose-600">{item.quantity}</td>
                                          <td className="px-3 py-2.5 text-right text-slate-600">₹{(prod.price || 0).toLocaleString()}</td>
                                          <td className="px-3 py-2.5 text-right font-bold text-slate-800">₹{lineVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                  <tfoot>
                                    <tr className="bg-slate-50 border-t border-slate-200">
                                      <td colSpan={4} className="px-3 py-2.5 text-[10px] font-black text-slate-500 uppercase">Total Return Value</td>
                                      <td className="px-3 py-2.5 text-right font-black text-rose-600">{totalUnits} units</td>
                                      <td />
                                      <td className="px-3 py-2.5 text-right font-black text-rose-700">₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>

                            {/* Remarks + Stock Impact */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {ret.notes && (
                                <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
                                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Overall Remarks</span>
                                  <p className="text-slate-700 italic text-[10px] leading-relaxed">"{ret.notes}"</p>
                                </div>
                              )}
                              <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-1">
                                <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                                  {ret.status === 'APPROVED' ? 'Stock Impact (Applied)' : 'Expected Stock Impact'}
                                </span>
                                <div className="space-y-1 text-[10px] text-slate-600">
                                  {ret.type === 'DEALER_TO_WAREHOUSE' ? (
                                    <>
                                      <p className="flex items-center space-x-1.5">
                                        <ArrowUpLeft className="w-3 h-3 text-violet-500" />
                                        <span>Dealer stock <strong className="text-rose-600">↓ decremented</strong></span>
                                      </p>
                                      <p className="flex items-center space-x-1.5">
                                        <Warehouse className="w-3 h-3 text-emerald-500" />
                                        <span>Warehouse stock <strong className="text-emerald-600">↑ incremented</strong></span>
                                      </p>
                                    </>
                                  ) : (
                                    <p className="flex items-center space-x-1.5">
                                      <ArrowDownRight className="w-3 h-3 text-sky-500" />
                                      <span>Dealer stock <strong className="text-emerald-600">↑ incremented</strong> on approval</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail & Decision Modal */}
      {showDetailModal && selectedReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div>
                <span className="text-[10px] font-black text-rose-600 block uppercase tracking-wider">Return Request Decision</span>
                <h3 className="font-black text-slate-800 text-sm">{selectedReturn.returnNo}</h3>
              </div>
              <button onClick={() => { setShowDetailModal(false); setSelectedReturn(null); setDecisionNotes(''); }}
                className="text-slate-400 hover:text-slate-600 bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold cursor-pointer">
                ✕ Close
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Return Type</span>
                  <p className="font-black text-slate-700 uppercase text-[10px]">{selectedReturn.type.replace(/_/g, ' ')}</p>
                </div>
                <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Status</span>
                  <span className={`inline-flex items-center space-x-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${STATUS_STYLE[selectedReturn.status]}`}>
                    {STATUS_ICON[selectedReturn.status]}
                    <span>{selectedReturn.status}</span>
                  </span>
                </div>
              </div>

              {selectedReturn.dealer && (
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Dealer Profile</span>
                  <p className="font-bold text-slate-800 flex items-center space-x-2">
                    <Building2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>{selectedReturn.dealer.companyName}</span>
                  </p>
                  {selectedReturn.dealer.phone && (
                    <p className="text-slate-500 flex items-center space-x-2">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{selectedReturn.dealer.phone}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Items table */}
              <div>
                <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2">Returned Products</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase text-slate-400">
                        <th className="p-3">Product</th>
                        <th className="p-3">SKU / HSN</th>
                        <th className="p-3">Reason</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedReturn.items?.map((item, idx) => {
                        const prod = item.product || {};
                        return (
                          <tr key={idx} className="hover:bg-slate-50/30">
                            <td className="p-3 font-bold text-slate-800">{prod.name || 'Unknown'}</td>
                            <td className="p-3">
                              <p className="font-mono text-[10px]">{prod.sku || 'N/A'}</p>
                              <p className="text-[9px] text-slate-400">HSN: {prod.hsnCode || 'N/A'}</p>
                            </td>
                            <td className="p-3 italic text-slate-500">{item.reason || 'N/A'}</td>
                            <td className="p-3 text-right font-black text-rose-600">{item.quantity} {prod.unit || 'PCS'}</td>
                            <td className="p-3 text-right font-bold">₹{((prod.price || 0) * item.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedReturn.notes && (
                <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Overall Remarks</span>
                  <p className="italic text-slate-700">"{selectedReturn.notes}"</p>
                </div>
              )}
            </div>

            {/* Decision Panel */}
            {selectedReturn.status === 'PENDING' && (
              <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-4 text-xs">
                {((isAdmin && selectedReturn.type === 'DEALER_TO_WAREHOUSE') ||
                  (!isAdmin && selectedReturn.type === 'STORE_TO_DEALER')) ? (
                  <>
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-800 flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                      <p>Approving will <strong>automatically adjust inventory levels</strong>. This is recorded in audit logs and cannot be undone.</p>
                    </div>
                    <div>
                      <label className="block text-slate-500 font-bold mb-1.5">Decision Remarks</label>
                      <input type="text" value={decisionNotes} onChange={e => setDecisionNotes(e.target.value)}
                        placeholder="e.g. Approved – damaged items discarded, returned to stock."
                        className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none" />
                    </div>
                    <div className="flex space-x-3">
                      <button type="button" disabled={processingDecision}
                        onClick={() => handleProcessReturn(selectedReturn.id, 'APPROVED')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve &amp; Adjust Stock</span>
                      </button>
                      <button type="button" disabled={processingDecision}
                        onClick={() => handleProcessReturn(selectedReturn.id, 'REJECTED')}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl shadow-md flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50">
                        <XCircle className="w-4 h-4" />
                        <span>Reject Request</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-400 italic text-center py-2">
                    Awaiting decision from {selectedReturn.type === 'DEALER_TO_WAREHOUSE' ? 'Mansara Foods Admin' : 'Dealer Partner'}.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
