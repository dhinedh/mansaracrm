// src/pages/admin/TransfersPage.jsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Truck,
  Plus,
  ClipboardList,
  ShoppingCart,
  User,
  X,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Package,
  ArrowRight,
  Edit2,
  RefreshCw,
  Send,
  Eye,
  Building2
} from 'lucide-react';

/* ─── helpers ─────────────────────────────────────── */
const fmt = (n) => `₹${parseFloat(n || 0).toFixed(2)}`;

/* ════════════════════════════════════════════════════ */
export default function TransfersPage() {
  const location = useLocation();

  // Tab: 'dispatch' | 'history'
  const [activeTab, setActiveTab] = useState('dispatch');
  const [highlightedId, setHighlightedId] = useState(null);

  /* ── data ── */
  const [stocks, setStocks] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [dealerMargins, setDealerMargins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  /* ── wizard state ── */
  const [selectedDealerId, setSelectedDealerId] = useState('');
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentQty, setCurrentQty] = useState('10');
  const [transferItems, setTransferItems] = useState([]);
  const [transferNotes, setTransferNotes] = useState('');

  /* ── invoice preview modal ── */
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  /* ─── mount ───────────────────────────────────────── */
  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (location.state?.activeTab === 'history') setActiveTab('history');
    if (location.state?.transferId) {
      setHighlightedId(location.state.transferId);
      setActiveTab('history');
      setTimeout(() => {
        document.getElementById(`transfer-${location.state.transferId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [location.state]);

  useEffect(() => {
    if (selectedDealerId) fetchDealerMargins(selectedDealerId);
    else setDealerMargins([]);
  }, [selectedDealerId]);

  /* ─── fetch helpers ───────────────────────────────── */
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [stockRes, dealerRes, txRes] = await Promise.all([
        axios.get('/inventory/company'),
        axios.get('/dealers', { params: { status: 'APPROVED' } }),
        axios.get('/inventory/transfers')
      ]);
      setStocks(stockRes.data.data);
      setDealers(dealerRes.data.data);
      setTransfers(txRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDealerMargins = async (dealerId) => {
    try {
      const res = await axios.get('/margins', { params: { dealerId } });
      setDealerMargins(res.data.data || []);
    } catch (err) {
      console.error('Margins fetch failed', err);
    }
  };

  /* ─── cart logic ──────────────────────────────────── */
  const detectMargin = (productId, productRecord) => {
    const prodMargin = dealerMargins.find(m => m.productId === productId);
    const catId = productRecord?.categoryId || productRecord?.category?._id || productRecord?.category;
    const catMargin = dealerMargins.find(m => m.categoryId === String(catId));
    const defMargin = dealerMargins.find(m => m.isDefault);
    return prodMargin?.marginPercent ?? catMargin?.marginPercent ?? defMargin?.marginPercent ?? 0;
  };

  const handleAddProduct = () => {
    if (!currentProductId || parseInt(currentQty) <= 0) return;
    const stockRecord = stocks.find(s => s.productId === currentProductId);
    if (!stockRecord) return;
    const availableQty = stockRecord.quantity;
    const product = stockRecord.product;

    if (parseInt(currentQty) > availableQty) {
      alert(`Cannot transfer more than available stock (${availableQty} ${product.unit})`);
      return;
    }

    const detectedMargin = detectMargin(currentProductId, product);
    const existingIdx = transferItems.findIndex(i => i.productId === currentProductId);

    if (existingIdx > -1) {
      const newItems = [...transferItems];
      const total = newItems[existingIdx].quantity + parseInt(currentQty);
      if (total > availableQty) {
        alert(`Total quantity exceeds available stock (${availableQty})`);
        return;
      }
      newItems[existingIdx].quantity = total;
      if (!newItems[existingIdx].isMarginCustomized) {
        newItems[existingIdx].marginPct = detectedMargin;
      }
      setTransferItems(newItems);
    } else {
      setTransferItems([...transferItems, {
        productId: currentProductId,
        product,
        quantity: parseInt(currentQty),
        marginPct: detectedMargin,
        isMarginCustomized: false
      }]);
    }

    setCurrentProductId('');
    setCurrentQty('10');
  };

  const handleRemoveProduct = (prodId) => {
    setTransferItems(prev => prev.filter(i => i.productId !== prodId));
  };

  const handleMarginChange = (prodId, val) => {
    setTransferItems(prev => prev.map(i =>
      i.productId === prodId
        ? { ...i, marginPct: Math.min(100, Math.max(0, parseFloat(val) || 0)), isMarginCustomized: true }
        : i
    ));
  };

  /* ─── invoice preview computed values ────────────── */
  const selectedDealer = dealers.find(d => {
    const id = typeof d.id === 'object' ? d.id?.id || d.id?.toString() : d.id;
    return id === selectedDealerId;
  });

  const invoiceLines = transferItems.map(item => {
    const basePrice = parseFloat(item.product.price);
    const margin = item.marginPct || 0;
    const sellingPrice = basePrice * (1 - margin / 100);
    const gstPct = parseFloat(item.product.gstPercent || 0);
    const lineSubtotal = sellingPrice * item.quantity;
    const lineGst = lineSubtotal * (gstPct / 100);
    const lineTotal = lineSubtotal + lineGst;
    return { ...item, basePrice, sellingPrice, gstPct, lineSubtotal, lineGst, lineTotal };
  });

  const invoiceSubtotal = invoiceLines.reduce((s, l) => s + l.lineSubtotal, 0);
  const invoiceGst = invoiceLines.reduce((s, l) => s + l.lineGst, 0);
  const invoiceTotal = invoiceSubtotal + invoiceGst;

  /* ─── submit ──────────────────────────────────────── */
  const handleConfirmDispatch = async () => {
    if (!selectedDealerId || transferItems.length === 0) return;
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      await axios.post('/inventory/transfers', {
        dealerId: selectedDealerId,
        items: transferItems.map(i => ({ productId: i.productId, quantity: i.quantity, marginPct: i.marginPct || 0 })),
        notes: transferNotes
      });

      setMessage({ text: 'Dispatch initiated! B2B invoice auto-generated and transfer is now PENDING shipment.', type: 'success' });
      setTransferItems([]);
      setSelectedDealerId('');
      setTransferNotes('');
      setShowInvoicePreview(false);
      fetchAll();
      setActiveTab('history');
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Dispatch failed. Please try again.', type: 'error' });
      setShowInvoicePreview(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (transferId, status) => {
    try {
      await axios.patch(`/inventory/transfers/${transferId}/status`, { status });
      fetchAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  /* ════════════════ RENDER ════════════════════════════ */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Truck className="w-5 h-5 text-rose-600" />
          Transfers
        </h2>
        <p className="text-slate-500 text-xs mt-0.5">
          Dispatch stock to dealers. Each product carries a configurable margin and an invoice is generated before dispatch.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {[
          { key: 'dispatch', label: 'Dispatch Stock', icon: ShoppingCart },
          { key: 'history', label: 'Transfer Log', icon: ClipboardList }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${
              activeTab === key
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Global Message */}
      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
            : 'bg-rose-50 text-rose-800 border border-rose-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* ════ DISPATCH TAB ════ */}
      {activeTab === 'dispatch' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Wizard */}
          <div className="lg:col-span-2 space-y-5">
            {/* Step 1: Dealer */}
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
                <h3 className="font-black text-slate-800 text-sm">Select Dealer</h3>
              </div>
              <select
                value={selectedDealerId}
                onChange={e => setSelectedDealerId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="">Choose an approved dealer...</option>
                {dealers.map(d => {
                  const id = typeof d.id === 'object' ? d.id?.id || d.id?.toString() : d.id;
                  return (
                    <option key={id} value={id}>{d.companyName} ({d.user?.name})</option>
                  );
                })}
              </select>
              {selectedDealer && (
                <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-xs">
                  <Building2 className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <div>
                    <p className="font-black text-slate-800">{selectedDealer.companyName}</p>
                    <p className="text-slate-500">{selectedDealer.user?.name} · {selectedDealer.phone}</p>
                  </div>
                  {dealerMargins.length > 0 && (
                    <span className="ml-auto text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full font-black">
                      {dealerMargins.length} margin rule{dealerMargins.length > 1 ? 's' : ''} loaded
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Step 2: Products */}
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">2</span>
                <h3 className="font-black text-slate-800 text-sm">Add Products &amp; Set Margins</h3>
              </div>

              {/* Add row */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Product (SKU)</label>
                    <select
                      value={currentProductId}
                      onChange={e => setCurrentProductId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none text-xs cursor-pointer"
                    >
                      <option value="">Choose product...</option>
                      {stocks.map(item => {
                        const id = typeof item.productId === 'object' ? item.productId?.id || item.productId?.toString() : item.productId;
                        return (
                          <option key={id} value={id}>
                            {item.product.name} — Avail: {item.quantity} {item.product.unit}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={currentQty}
                      onChange={e => setCurrentQty(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none text-xs"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={!currentProductId}
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold text-[10px] px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add to Dispatch List
                </button>
              </div>

              {/* Cart */}
              {transferItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Dispatch List — Configurable Margins</p>
                  <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                    {/* Column headers */}
                    <div className="grid grid-cols-12 gap-2 bg-slate-50 border-b border-slate-100 px-4 py-2 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      <div className="col-span-4">Product</div>
                      <div className="col-span-2 text-center">Qty</div>
                      <div className="col-span-2 text-center">Base ₹</div>
                      <div className="col-span-2 text-center">Margin %</div>
                      <div className="col-span-1 text-right">Eff. ₹</div>
                      <div className="col-span-1"></div>
                    </div>
                    {transferItems.map(item => {
                      const id = typeof item.productId === 'object' ? item.productId?.id || item.productId?.toString() : item.productId;
                      const effPrice = parseFloat(item.product.price) * (1 - (item.marginPct || 0) / 100);
                      return (
                        <div key={id} className="grid grid-cols-12 gap-2 items-center px-4 py-3 border-b border-slate-100 last:border-0 text-xs">
                          <div className="col-span-4">
                            <p className="font-bold text-slate-800 truncate">{item.product.name}</p>
                            <p className="text-[9px] text-rose-600 font-black">SKU: {item.product.sku}</p>
                          </div>
                          <div className="col-span-2 text-center font-bold text-slate-700">
                            {item.quantity} <span className="text-slate-400">{item.product.unit}</span>
                          </div>
                          <div className="col-span-2 text-center font-bold text-slate-600">
                            {fmt(item.product.price)}
                          </div>
                          <div className="col-span-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.marginPct !== undefined ? item.marginPct : 0}
                                onChange={e => handleMarginChange(item.productId, e.target.value)}
                                className="w-14 p-1 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-rose-500 font-bold"
                              />
                              <span className="text-[10px] text-slate-400 font-bold">%</span>
                            </div>
                          </div>
                          <div className="col-span-1 text-right font-black text-rose-600 text-[11px]">
                            {fmt(effPrice)}
                          </div>
                          <div className="col-span-1 text-right">
                            <button
                              onClick={() => handleRemoveProduct(item.productId)}
                              className="text-rose-500 hover:text-rose-700 p-1 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Mini totals row */}
                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-6 text-[10px] font-black text-slate-600">
                      <span>Subtotal: <span className="text-slate-800">{fmt(invoiceSubtotal)}</span></span>
                      <span>GST: <span className="text-slate-800">{fmt(invoiceGst)}</span></span>
                      <span className="text-rose-700">Grand Total: <span>{fmt(invoiceTotal)}</span></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Dispatch Notes / Remarks</label>
                <textarea
                  value={transferNotes}
                  onChange={e => setTransferNotes(e.target.value)}
                  rows="2"
                  placeholder="e.g. Shipped via Gati Cargo, batch #45..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none text-xs"
                />
              </div>

              {/* Preview Invoice → Confirm Dispatch */}
              <button
                onClick={() => setShowInvoicePreview(true)}
                disabled={!selectedDealerId || transferItems.length === 0}
                className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-rose-100 transition-all text-xs flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Review Invoice &amp; Confirm Dispatch
              </button>
            </div>
          </div>

          {/* Right: Guidelines */}
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm h-fit space-y-5">
            <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Dispatch Flow</h4>
            {[
              { step: '1', title: 'Select Dealer & Add Products', desc: 'Choose dealer. Margins auto-detect from dealer margin rules. You can override any margin.' },
              { step: '2', title: 'Review Invoice Preview', desc: 'See the B2B invoice with line-by-line breakdown before confirming.' },
              { step: '3', title: 'Confirm Dispatch', desc: 'Invoice auto-generated. Transfer enters PENDING status.' },
              { step: '4', title: 'Ship Stock', desc: 'Mark IN_TRANSIT when physically shipped.' },
              { step: '5', title: 'Delivered', desc: 'On delivery confirmation, company stock decrements and dealer inventory increments atomically.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{step}</div>
                <div>
                  <p className="font-bold text-slate-700 text-[11px]">{title}</p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════ HISTORY TAB ════ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-500">{transfers.length} transfer record{transfers.length !== 1 ? 's' : ''}</p>
            <button
              onClick={fetchAll}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 text-xs font-bold">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading transfers...
            </div>
          ) : transfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
              <Truck className="w-8 h-8" />
              <p className="text-xs font-bold">No transfers yet. Start a dispatch from the Dispatch Stock tab.</p>
            </div>
          ) : (
            transfers.map(item => (
              <div
                key={item.id}
                id={`transfer-${item.id}`}
                className={`p-6 rounded-2xl shadow-sm space-y-4 transition-all duration-300 border ${
                  item.id === highlightedId
                    ? 'border-rose-500 bg-rose-50/10 shadow-md ring-2 ring-rose-500/20'
                    : 'bg-white border-slate-150'
                }`}
              >
                {/* Transfer header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-800 text-xs">{item.transferNo}</span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                        item.status === 'DELIVERED'    ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        item.status === 'IN_TRANSIT'   ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                        item.status === 'DISCREPANCY'  ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse' :
                        item.status === 'CANCELLED'    ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                                         'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {item.status}
                      </span>
                      {item.invoiceId && (
                        <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                          Invoice Generated ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Dealer: <strong className="text-slate-600">{item.dealer?.companyName} ({item.dealer?.phone})</strong>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Date: {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(item.id, 'IN_TRANSIT')}
                          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg"
                        >
                          <Truck className="w-3.5 h-3.5" /> Ship Stock
                        </button>
                        <button
                          onClick={() => handleStatusChange(item.id, 'CANCELLED')}
                          className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-rose-100"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {item.status === 'IN_TRANSIT' && (
                      <button
                        onClick={() => handleStatusChange(item.id, 'DELIVERED')}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Delivered
                      </button>
                    )}
                  </div>
                </div>

                {/* Products */}
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Products Dispatched</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {item.items?.map(it => (
                      <div
                        key={it.id}
                        className={`border p-3 rounded-xl text-xs ${
                          it.hasDiscrepancy ? 'bg-amber-50/50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-slate-700">{it.product?.name}</p>
                            <p className="text-[9px] font-black text-rose-600">SKU: {it.product?.sku}</p>
                            {it.marginPct != null && (
                              <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                                Margin: {it.marginPct}% · Eff: {fmt(it.unitPrice)}
                              </p>
                            )}
                          </div>
                          <span className="font-black text-slate-800 ml-2 whitespace-nowrap">{it.quantity} {it.product?.unit}</span>
                        </div>
                        {it.hasDiscrepancy && (
                          <div className="mt-2 pt-2 border-t border-dashed border-amber-200 text-amber-800 text-[10px] space-y-0.5">
                            <p className="font-bold">⚠️ Discrepancy:</p>
                            <p>Received: <strong>{it.receivedQuantity} {it.product?.unit}</strong> (Shortage: {it.quantity - it.receivedQuantity})</p>
                            {it.discrepancyComment && <p className="italic">"{it.discrepancyComment}"</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {item.notes && (
                  <div className="text-[10px] bg-slate-50/50 border border-slate-100 p-3 rounded-xl text-slate-500">
                    <strong>Notes:</strong> {item.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ════ INVOICE PREVIEW MODAL ════ */}
      {showInvoicePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 to-orange-50">
              <div>
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Invoice Preview</p>
                <h3 className="font-black text-slate-800 text-sm">Review Before Dispatch</h3>
              </div>
              <button
                onClick={() => setShowInvoicePreview(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Invoice Body */}
            <div className="p-6 space-y-5">
              {/* Parties */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">From (Company)</p>
                  <p className="font-black text-slate-800">Mansara Foods Pvt. Ltd.</p>
                  <p className="text-slate-500">Mumbai, Maharashtra</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">To (Dealer)</p>
                  <p className="font-black text-slate-800">{selectedDealer?.companyName}</p>
                  <p className="text-slate-500">{selectedDealer?.user?.name} · {selectedDealer?.phone}</p>
                </div>
              </div>

              {/* Line items */}
              <div className="border border-slate-150 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black text-[9px] uppercase tracking-wider">
                      <th className="px-4 py-2.5 text-left">Product</th>
                      <th className="px-4 py-2.5 text-center">Qty</th>
                      <th className="px-4 py-2.5 text-center">Base</th>
                      <th className="px-4 py-2.5 text-center">Margin</th>
                      <th className="px-4 py-2.5 text-center">Selling</th>
                      <th className="px-4 py-2.5 text-center">GST</th>
                      <th className="px-4 py-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceLines.map(line => {
                      const id = typeof line.productId === 'object' ? line.productId?.id || line.productId?.toString() : line.productId;
                      return (
                        <tr key={id} className="border-b border-slate-100 last:border-0">
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-800">{line.product.name}</p>
                            <p className="text-[9px] text-rose-600 font-black">SKU: {line.product.sku}</p>
                          </td>
                          <td className="px-4 py-3 text-center text-slate-600 font-bold">{line.quantity}</td>
                          <td className="px-4 py-3 text-center text-slate-500">{fmt(line.basePrice)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-rose-50 text-rose-700 font-black text-[10px] px-2 py-0.5 rounded-full">
                              -{line.marginPct}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-slate-700">{fmt(line.sellingPrice)}</td>
                          <td className="px-4 py-3 text-center text-slate-500">{line.gstPct}%</td>
                          <td className="px-4 py-3 text-right font-black text-slate-800">{fmt(line.lineTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span className="font-bold">Subtotal (excl. GST)</span>
                  <span className="font-bold">{fmt(invoiceSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span className="font-bold">Total GST (CGST + SGST)</span>
                  <span className="font-bold">{fmt(invoiceGst)}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-black pt-2 border-t border-slate-200 text-sm">
                  <span>Grand Total</span>
                  <span>{fmt(invoiceTotal)}</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-[10px] text-amber-800 font-semibold flex gap-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                The B2B invoice will be auto-generated on confirmation. Stock will be deducted only when delivery is confirmed.
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowInvoicePreview(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl text-xs"
              >
                ← Back to Edit
              </button>
              <button
                onClick={handleConfirmDispatch}
                disabled={submitting}
                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl shadow-lg shadow-rose-100 transition-all text-xs flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Invoice...</>
                ) : (
                  <><Send className="w-4 h-4" /> Generate Invoice &amp; Dispatch</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
