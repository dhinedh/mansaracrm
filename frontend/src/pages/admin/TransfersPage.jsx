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
  Building2,
  Download,
  Calendar,
  Lock
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
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  /* ── wizard state ── */
  const [selectedDealerId, setSelectedDealerId] = useState('');
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentQty, setCurrentQty] = useState('10');
  const [transferItems, setTransferItems] = useState([]);
  const [transferNotes, setTransferNotes] = useState('');
  const [invoiceType, setInvoiceType] = useState('NORMAL');

  /* ── invoice preview modal ── */
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showInvoiceDetailModal, setShowInvoiceDetailModal] = useState(false);

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
    if (location.state?.dealerId) {
      setSelectedDealerId(location.state.dealerId);
      setActiveTab('dispatch');
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
    const prodMargin = dealerMargins.find(m => (m.productId?.toString() || m.productId) === String(productId));
    const catId = productRecord?.categoryId || productRecord?.category?._id || productRecord?.category;
    const catMargin = dealerMargins.find(m => (m.categoryId?.toString() || m.categoryId) === String(catId));
    const defMargin = dealerMargins.find(m => m.isDefault);
    return prodMargin?.marginPercent ?? catMargin?.marginPercent ?? defMargin?.marginPercent ?? 0;
  };

  const handleAddProduct = () => {
    if (!currentProductId || parseInt(currentQty) <= 0) return;
    const stockRecord = stocks.find(s => (s.productId?.toString() || s.productId) === String(currentProductId));
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
    const mrp = parseFloat(item.product.mrp || item.product.price || 0);
    const margin = item.marginPct || 0;
    const sellingPrice = mrp * (1 - margin / 100);
    const gstPct = parseFloat(item.product.gstPercent || 0);
    const lineSubtotal = sellingPrice * item.quantity;
    const lineGst = lineSubtotal * (gstPct / 100);
    const lineTotal = lineSubtotal + lineGst;
    return { ...item, basePrice: mrp, sellingPrice, gstPct, lineSubtotal, lineGst, lineTotal };
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
        notes: transferNotes,
        invoiceType
      });

      setMessage({ text: 'Dispatch initiated! B2B invoice auto-generated and transfer is now PENDING shipment.', type: 'success' });
      setTransferItems([]);
      setSelectedDealerId('');
      setTransferNotes('');
      setInvoiceType('NORMAL');
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

  const handleDownloadPdf = async (invoice) => {
    try {
      const response = await axios.get(`/billing/${invoice.id || invoice._id}/pdf`, { responseType: 'blob' });
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('text/html')) {
        window.open(URL.createObjectURL(new Blob([response.data], { type: 'text/html' })), '_blank');
      } else {
        const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = fileURL;
        link.setAttribute('download', `Invoice_${invoice.invoiceNo}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.warn('PDF download failed:', err);
      alert('Could not download invoice. Please try again.');
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

              {/* Invoice Type selection */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">Invoice Type</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="invoiceType"
                      value="NORMAL"
                      checked={invoiceType === 'NORMAL'}
                      onChange={() => setInvoiceType('NORMAL')}
                      className="w-4 h-4 text-rose-600 focus:ring-rose-500 border-slate-300"
                    />
                    Normal Invoice
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="invoiceType"
                      value="ADVANCE"
                      checked={invoiceType === 'ADVANCE'}
                      onChange={() => setInvoiceType('ADVANCE')}
                      className="w-4 h-4 text-rose-600 focus:ring-rose-500 border-slate-300"
                    />
                    Advance Invoice
                  </label>
                </div>
              </div>
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
                      const mrp = parseFloat(item.product.mrp || item.product.price || 0);
                      const effPrice = mrp * (1 - (item.marginPct || 0) / 100);
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
                      {item.invoice?.invoiceNo && (
                        <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full pl-2.5 pr-1.5 py-0.5 text-[9px] font-bold text-indigo-600">
                          <span>Invoice: {item.invoice.invoiceNo}</span>
                          <button
                            onClick={() => { setSelectedInvoice(item.invoice); setShowInvoiceDetailModal(true); }}
                            className="p-0.5 hover:bg-indigo-100 rounded transition-colors cursor-pointer text-indigo-600"
                            title="View Invoice Details"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(item.invoice)}
                            className="p-0.5 hover:bg-indigo-100 rounded transition-colors cursor-pointer text-indigo-600"
                            title="Download PDF"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
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
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider">
                  {invoiceType === 'ADVANCE' ? 'Advance Invoice Preview' : 'Invoice Preview'}
                </p>
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
                            <span className="bg-emerald-50 text-emerald-700 font-black text-[10px] px-2 py-0.5 rounded-full">
                              +{line.marginPct}%
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
                The B2B {invoiceType === 'ADVANCE' ? 'Advance' : 'Tax'} invoice will be auto-generated on confirmation. Stock will be deducted only when delivery is confirmed.
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

      {/* ─── GST Tax Invoice Details Modal ────────────────────────────────────── */}
      {showInvoiceDetailModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col animate-zoom-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                  {selectedInvoice.invoiceType === 'ADVANCE' ? 'GST Advance Invoice Breakdown' : 'GST Tax Invoice Breakdown'}
                </h3>
                <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{selectedInvoice.invoiceNo}</span>
                {selectedInvoice.invoiceType === 'ADVANCE' && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[8px] font-black text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded uppercase">Advance</span>
                  </div>
                )}
              </div>
              <button onClick={() => setShowInvoiceDetailModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 border border-slate-100 rounded-xl">
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Dealer Info</span>
                  <p className="font-bold text-slate-800">Distributor: {selectedInvoice.dealer?.companyName || 'B2B Partner'}</p>
                  <p className="text-slate-500 font-medium">Billed To: {selectedInvoice.store ? selectedInvoice.store.name : 'B2B Warehouse Direct'}</p>
                  {selectedInvoice.store && <p className="text-slate-400">Store GST: {selectedInvoice.store.gstNumber || 'N/A'}</p>}
                </div>
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Invoice Info</span>
                  <p className="flex items-center space-x-1.5 text-slate-600">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Date: {new Date(selectedInvoice.createdAt).toLocaleDateString('en-IN')}</span>
                  </p>
                  <p className="flex items-center space-x-1.5 text-slate-600">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Status: <strong className={`uppercase ${selectedInvoice.status === 'CLOSED' ? 'text-emerald-600' : 'text-blue-600'}`}>{selectedInvoice.status}</strong></span>
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Items Breakdown</span>
                <div className="border border-slate-150 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 p-3 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    <div className="col-span-5">Product / SKU</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-center">Margin</div>
                    <div className="col-span-3 text-right">Line Total</div>
                  </div>
                  {selectedInvoice.items?.map(item => (
                    <div key={item.id || item._id} className="grid grid-cols-12 items-center p-3 border-b border-slate-100 last:border-0">
                      <div className="col-span-5 font-bold text-slate-800">
                        {item.product?.name}
                        <span className="block text-[9px] font-black text-rose-600">SKU: {item.product?.sku}</span>
                      </div>
                      <div className="col-span-2 text-center font-bold text-slate-700">{item.quantity} {item.unit || item.product?.unit || 'PCS'}</div>
                      <div className="col-span-2 text-center font-bold text-slate-700">{parseFloat(item.marginPct || 0)}%</div>
                      <div className="col-span-3 text-right font-bold text-slate-800">{fmt(item.lineTotal || 0)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end pt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between w-48 text-[11px] text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-700">{fmt(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.isGstEnabled !== false ? (
                  <>
                    <div className="flex justify-between w-48 text-[11px] text-slate-500">
                      <span>CGST:</span>
                      <span className="font-bold text-slate-700">{fmt((selectedInvoice.cgst !== undefined ? parseFloat(selectedInvoice.cgst) : parseFloat(selectedInvoice.totalGst) / 2) || 0)}</span>
                    </div>
                    <div className="flex justify-between w-48 text-[11px] text-slate-500">
                      <span>SGST:</span>
                      <span className="font-bold text-slate-700">{fmt((selectedInvoice.sgst !== undefined ? parseFloat(selectedInvoice.sgst) : parseFloat(selectedInvoice.totalGst) / 2) || 0)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between w-48 text-[11px] text-slate-500">
                    <span>GST:</span>
                    <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[9px] uppercase">Disabled</span>
                  </div>
                )}
                {selectedInvoice.shippingCharges && parseFloat(selectedInvoice.shippingCharges) > 0 && (
                  <div className="flex justify-between w-48 text-[11px] text-slate-500">
                    <span>Shipping:</span>
                    <span className="font-bold text-slate-700">{fmt(selectedInvoice.shippingCharges)}</span>
                  </div>
                )}
                <div className="flex justify-between w-48 text-xs font-black text-slate-800 border-t border-slate-100 pt-2">
                  <span>Grand Total:</span>
                  <span className="text-rose-600">{fmt(selectedInvoice.totalAmount)}</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-between items-center gap-3">
              <button onClick={() => setShowInvoiceDetailModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer">
                Close
              </button>
              <button onClick={() => handleDownloadPdf(selectedInvoice)}
                className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer">
                <Download className="w-4 h-4" /><span>Print PDF Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
