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
  Lock,
  Store,
  Search,
  UserPlus,
  Check,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Layers,
  Boxes
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
  const [stores, setStores] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [dealerMargins, setDealerMargins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  /* ── recipient wizard state ── */
  const [recipientType, setRecipientType] = useState('ALL'); // 'ALL' | 'DEALER' | 'STORE' | 'OTHER'
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(null); // { type: 'DEALER'|'STORE'|'OTHER', id, name, phone, address, raw }
  const [selectedDealerId, setSelectedDealerId] = useState('');
  const [transferReason, setTransferReason] = useState('RESTOCK'); // 'RESTOCK' | 'NEW_OPENING' | 'REPLACEMENT' | 'SAMPLE' | 'DEMO' | 'OTHER'
  const [customReason, setCustomReason] = useState('');
  
  /* ── quick add new recipient modal/drawer state ── */
  const [showAddNewModal, setShowAddNewModal] = useState(false);
  const [newRecipientData, setNewRecipientData] = useState({
    type: 'STORE', // 'STORE' | 'OTHER'
    name: '',
    phone: '',
    address: '',
    city: '',
    notes: ''
  });
  const [creatingRecipient, setCreatingRecipient] = useState(false);

  /* ── products & cart state ── */
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
      const [stockRes, dealerRes, txRes, storeRes] = await Promise.all([
        axios.get('/inventory/company', { params: { type: 'all' } }),
        axios.get('/dealers', { params: { status: 'APPROVED' } }),
        axios.get('/inventory/transfers'),
        axios.get('/stores').catch(() => ({ data: { data: [] } }))
      ]);
      setStocks(stockRes.data.data || []);
      setDealers(dealerRes.data.data || []);
      setTransfers(txRes.data.data || []);
      setStores(storeRes.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecipient = (rec) => {
    setSelectedRecipient(rec);
    if (rec.type === 'DEALER') {
      setSelectedDealerId(rec.id);
    } else {
      setSelectedDealerId('');
      setDealerMargins([]);
    }
  };

  const handleCreateNewRecipient = async (e) => {
    e.preventDefault();
    if (!newRecipientData.name.trim()) return;

    setCreatingRecipient(true);
    try {
      if (newRecipientData.type === 'STORE') {
        const res = await axios.post('/stores', {
          name: newRecipientData.name.trim(),
          phone: newRecipientData.phone.trim(),
          address: newRecipientData.address.trim() || 'Direct Store',
          city: newRecipientData.city.trim() || '',
          notes: newRecipientData.notes.trim() || ''
        });
        if (res.data?.success && res.data?.data) {
          const created = res.data.data;
          setStores(prev => [created, ...prev]);
          handleSelectRecipient({
            type: 'STORE',
            id: created.id || created._id,
            name: created.name,
            phone: created.phone || created.ownerPhone || '',
            address: created.address || '',
            raw: created
          });
        }
      } else {
        // OTHER PERSON / ENTITY
        handleSelectRecipient({
          type: 'OTHER',
          id: `OTHER-${Date.now()}`,
          name: newRecipientData.name.trim(),
          phone: newRecipientData.phone.trim(),
          address: newRecipientData.address.trim(),
          notes: newRecipientData.notes.trim()
        });
      }
      setShowAddNewModal(false);
      setNewRecipientData({
        type: 'STORE',
        name: '',
        phone: '',
        address: '',
        city: '',
        notes: ''
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create recipient');
    } finally {
      setCreatingRecipient(false);
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

  /* ─── FIFO stock allocation & costing helper ─────── */
  const getStockAllocation = (stockRecord, requestedQty) => {
    const reqQty = Math.max(0, parseInt(requestedQty) || 0);
    if (!stockRecord) {
      return {
        oldStockTaken: 0,
        latestStockTaken: reqQty,
        oldStockAvail: 0,
        latestStockAvail: 0,
        oldCostPrice: 0,
        latestCostPrice: 0,
        oldBatchId: 'BATCH-OLD',
        latestBatchId: 'BATCH-NEW',
        totalCost: 0,
        avgCostPerUnit: 0
      };
    }

    const batches = Array.isArray(stockRecord.batches) && stockRecord.batches.length > 0 ? stockRecord.batches : [];
    const oldBatch = batches.find(b => (b.label || '').toLowerCase().includes('old')) || batches[0];
    const latestBatch = batches.find(b => (b.label || '').toLowerCase().includes('latest')) || batches[1] || batches[0];

    const totalQty = Number(stockRecord.quantity) || 0;
    const oldStockAvail = oldBatch ? (oldBatch.availableQty !== undefined ? Number(oldBatch.availableQty) : Number(oldBatch.quantity) || 0) : Math.floor(totalQty * 0.4);
    const latestStockAvail = latestBatch ? (latestBatch.availableQty !== undefined ? Number(latestBatch.availableQty) : Number(latestBatch.quantity) || 0) : Math.max(0, totalQty - oldStockAvail);

    // FIFO: First take from old stock; remainder from latest stock
    const oldStockTaken = Math.min(oldStockAvail, reqQty);
    const latestStockTaken = Math.max(0, reqQty - oldStockTaken);

    const baseUnitCost = Number(stockRecord.costPerUnit) || Number(stockRecord.product?.costPrice) || Number(stockRecord.product?.mrp ? stockRecord.product.mrp * 0.65 : 95);
    const oldCostPrice = Number(oldBatch?.costPrice) || Math.round(baseUnitCost * 0.96 * 100) / 100;
    const latestCostPrice = Number(latestBatch?.costPrice) || Math.round(baseUnitCost * 1.02 * 100) / 100;

    const totalCost = Number(((oldStockTaken * oldCostPrice) + (latestStockTaken * latestCostPrice)).toFixed(2));
    const avgCostPerUnit = reqQty > 0 ? Number((totalCost / reqQty).toFixed(2)) : 0;

    return {
      oldStockTaken,
      latestStockTaken,
      oldStockAvail,
      latestStockAvail,
      oldCostPrice,
      latestCostPrice,
      oldBatchId: oldBatch?.batchId || 'BATCH-OLD',
      latestBatchId: latestBatch?.batchId || 'BATCH-NEW',
      totalCost,
      avgCostPerUnit
    };
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
    if (!currentProductId) {
      alert('Please choose a product or item to dispatch.');
      return;
    }
    const reqQty = parseInt(currentQty) || 0;
    if (reqQty <= 0) {
      alert('Please enter a valid dispatch quantity greater than 0.');
      return;
    }

    const stockRecord = stocks.find(s => {
      const sId = s.id || s._id || (typeof s.productId === 'object' ? s.productId?.id || s.productId?._id : s.productId);
      const pId = s.productId ? (typeof s.productId === 'object' ? s.productId?.id || s.productId?._id : s.productId) : null;
      return String(sId) === String(currentProductId) || (pId && String(pId) === String(currentProductId));
    });

    if (!stockRecord) {
      alert('Selected product record could not be found in warehouse stock.');
      return;
    }

    const availableQty = Number(stockRecord.quantity) || 0;
    if (reqQty > availableQty) {
      alert(`Cannot transfer more than available stock (${availableQty} ${stockRecord.product?.unit || stockRecord.unit || 'PCS'})`);
      return;
    }

    const itemProduct = stockRecord.product || {
      name: stockRecord.itemName || 'Warehouse Item',
      sku: stockRecord.stockId || stockRecord.inventoryId || 'SKU-INV',
      unit: stockRecord.unit || 'PCS',
      mrp: Number(stockRecord.costPerUnit) || (stockRecord.totalPrice ? Math.round(stockRecord.totalPrice / (stockRecord.quantity || 1)) : 100),
      price: Number(stockRecord.costPerUnit) || (stockRecord.totalPrice ? Math.round(stockRecord.totalPrice / (stockRecord.quantity || 1)) : 100),
      gstPercent: Number(stockRecord.gstPercent) || 5
    };

    const detectedMargin = detectMargin(currentProductId, itemProduct);
    const existingIdx = transferItems.findIndex(i => {
      const iId = i.productId || i.id || i._id;
      return String(iId) === String(currentProductId);
    });

    if (existingIdx > -1) {
      const newItems = [...transferItems];
      const total = newItems[existingIdx].quantity + reqQty;
      if (total > availableQty) {
        alert(`Total quantity (${total}) exceeds available stock (${availableQty})`);
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
        stockRecordId: stockRecord.id || stockRecord._id,
        product: itemProduct,
        quantity: reqQty,
        marginPct: detectedMargin,
        isMarginCustomized: false,
        stockRecord: stockRecord
      }]);
    }

    setCurrentProductId('');
    setCurrentQty('10');
  };

  const handleRemoveProduct = (prodId) => {
    setTransferItems(prev => prev.filter(i => {
      const iId = i.productId || i.id || i._id;
      return String(iId) !== String(prodId);
    }));
  };

  const handleMarginChange = (prodId, val) => {
    setTransferItems(prev => prev.map(i => {
      const iId = i.productId || i.id || i._id;
      return String(iId) === String(prodId)
        ? { ...i, marginPct: Math.min(100, Math.max(0, parseFloat(val) || 0)), isMarginCustomized: true }
        : i;
    }));
  };

  /* ─── invoice preview & P&L computed values ────────────── */
  const selectedDealer = selectedRecipient?.type === 'DEALER' ? selectedRecipient.raw : dealers.find(d => {
    const id = typeof d.id === 'object' ? d.id?.id || d.id?.toString() : d.id;
    return id === selectedDealerId;
  });

  const finalRecipientName = selectedRecipient?.name || selectedDealer?.companyName || 'Unknown Recipient';
  const finalRecipientPhone = selectedRecipient?.phone || selectedDealer?.phone || '';
  const finalRecipientAddress = selectedRecipient?.address || selectedDealer?.address || '';
  const finalTransferReason = transferReason === 'OTHER' && customReason.trim() ? customReason.trim() : transferReason;

  const invoiceLines = transferItems.map(item => {
    const stockRecord = stocks.find(s => {
      const sId = s.id || s._id || (typeof s.productId === 'object' ? s.productId?.id || s.productId?._id : s.productId);
      const pId = s.productId ? (typeof s.productId === 'object' ? s.productId?.id || s.productId?._id : s.productId) : null;
      const iId = item.productId || item.id || item._id;
      return String(sId) === String(iId) || (pId && String(pId) === String(iId));
    }) || item.stockRecord;

    const alloc = getStockAllocation(stockRecord, item.quantity);
    const mrp = parseFloat(item.product?.mrp || item.product?.price || stockRecord?.costPerUnit || 100);
    const margin = item.marginPct || 0;
    const sellingPrice = mrp * (1 - margin / 100);
    const gstPct = parseFloat(item.product?.gstPercent || 5);
    const lineSubtotal = sellingPrice * item.quantity;
    const lineGst = lineSubtotal * (gstPct / 100);
    const lineTotal = lineSubtotal + lineGst;
    const totalCost = alloc.totalCost;
    const lineProfit = lineSubtotal - totalCost;
    const lineProfitMarginPct = lineSubtotal > 0 ? (lineProfit / lineSubtotal) * 100 : 0;

    return {
      ...item,
      ...alloc,
      basePrice: mrp,
      sellingPrice,
      gstPct,
      lineSubtotal,
      lineGst,
      lineTotal,
      totalCost,
      lineProfit,
      lineProfitMarginPct
    };
  });

  const invoiceSubtotal = invoiceLines.reduce((s, l) => s + l.lineSubtotal, 0);
  const invoiceGst = invoiceLines.reduce((s, l) => s + l.lineGst, 0);
  const invoiceTotal = invoiceSubtotal + invoiceGst;
  const invoiceTotalCost = invoiceLines.reduce((s, l) => s + (l.totalCost || 0), 0);
  const invoiceTotalProfit = invoiceSubtotal - invoiceTotalCost;
  const invoiceProfitMarginPct = invoiceSubtotal > 0 ? (invoiceTotalProfit / invoiceSubtotal) * 100 : 0;
  const invoiceOldStockTotal = invoiceLines.reduce((s, l) => s + (l.oldStockTaken || 0), 0);
  const invoiceLatestStockTotal = invoiceLines.reduce((s, l) => s + (l.latestStockTaken || 0), 0);

  /* ─── submit ──────────────────────────────────────── */
  const handleConfirmDispatch = async () => {
    if ((!selectedRecipient && !selectedDealerId) || transferItems.length === 0) return;
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const payload = {
        recipientType: selectedRecipient?.type || (selectedDealerId ? 'DEALER' : 'OTHER'),
        dealerId: selectedRecipient?.type === 'DEALER' ? selectedRecipient.id : selectedDealerId || undefined,
        storeId: selectedRecipient?.type === 'STORE' ? selectedRecipient.id : undefined,
        recipientName: finalRecipientName,
        recipientPhone: finalRecipientPhone,
        recipientAddress: finalRecipientAddress,
        transferReason: finalTransferReason,
        items: invoiceLines.map(i => ({
          productId: typeof i.productId === 'object' ? i.productId?.id || i.productId?.toString() : i.productId,
          quantity: i.quantity,
          marginPct: i.marginPct || 0,
          oldStockTaken: i.oldStockTaken,
          latestStockTaken: i.latestStockTaken,
          oldBatchId: i.oldBatchId,
          latestBatchId: i.latestBatchId,
          oldCostPrice: i.oldCostPrice,
          latestCostPrice: i.latestCostPrice,
          costPrice: i.avgCostPerUnit,
          totalCost: i.totalCost,
          profit: i.lineProfit,
          profitMarginPct: i.lineProfitMarginPct
        })),
        notes: transferNotes,
        invoiceType
      };

      await axios.post('/inventory/transfers', payload);

      setMessage({
        text: `Dispatch initiated for ${finalRecipientName}! Sourced ${invoiceOldStockTotal} Old Stock & ${invoiceLatestStockTotal} Latest Stock (Est. Profit: +₹${invoiceTotalProfit.toFixed(2)}).`,
        type: 'success'
      });
      setTransferItems([]);
      setSelectedDealerId('');
      setSelectedRecipient(null);
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
        <div className="w-full space-y-5">
          {/* Dispatch Wizard */}
          <div className="space-y-5">
            {/* Step 1: Select Recipient (Dealer, Shop/Store, or Other Person) & Transfer Reason */}
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center">1</span>
                  <h3 className="font-black text-slate-800 text-sm">Select Recipient (Dealer, Shop or Person)</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddNewModal(true)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Add New Shop / Person</span>
                </button>
              </div>

              {/* Recipient Type Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
                {[
                  { id: 'ALL', label: 'All Recipients' },
                  { id: 'DEALER', label: 'Dealers' },
                  { id: 'STORE', label: 'Shops / Stores' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRecipientType(tab.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      recipientType === tab.id
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Bar & Direct Select Dropdown */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={recipientSearch}
                    onChange={e => setRecipientSearch(e.target.value)}
                    placeholder="Search approved dealer, retail shop, store name or phone..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none text-xs font-bold text-slate-700"
                  />
                  {recipientSearch && (
                    <button
                      type="button"
                      onClick={() => setRecipientSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Recipient Dropdown / Select List */}
                <select
                  value={selectedRecipient ? `${selectedRecipient.type}:${selectedRecipient.id}` : ''}
                  onChange={e => {
                    const val = e.target.value;
                    if (!val) {
                      setSelectedRecipient(null);
                      setSelectedDealerId('');
                      return;
                    }
                    const [type, id] = val.split(':');
                    if (type === 'DEALER') {
                      const d = dealers.find(item => {
                        const dId = typeof item.id === 'object' ? item.id?.id || item.id?.toString() : item.id;
                        return dId === id;
                      });
                      if (d) {
                        handleSelectRecipient({
                          type: 'DEALER',
                          id,
                          name: d.companyName || d.user?.name,
                          phone: d.phone || d.user?.phone || '',
                          address: d.address || '',
                          raw: d
                        });
                      }
                    } else if (type === 'STORE') {
                      const s = stores.find(item => (item.id || item._id) === id);
                      if (s) {
                        handleSelectRecipient({
                          type: 'STORE',
                          id,
                          name: s.name,
                          phone: s.phone || s.ownerPhone || '',
                          address: s.address || '',
                          raw: s
                        });
                      }
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none text-xs font-bold text-slate-700 cursor-pointer"
                >
                  <option value="">
                    {selectedRecipient ? `Selected: ${selectedRecipient.name} (${selectedRecipient.type})` : 'Choose a dealer, shop, or person...'}
                  </option>
                  
                  {/* Dealers Group */}
                  {(recipientType === 'ALL' || recipientType === 'DEALER') && (
                    <optgroup label="── Approved Dealers ──">
                      {dealers
                        .filter(d => {
                          if (!recipientSearch) return true;
                          const q = recipientSearch.toLowerCase();
                          return (d.companyName || '').toLowerCase().includes(q) ||
                                 (d.user?.name || '').toLowerCase().includes(q) ||
                                 (d.phone || '').includes(q);
                        })
                        .map((d, dIdx) => {
                          const id = typeof d.id === 'object' ? d.id?.id || d.id?.toString() : d.id || d._id || dIdx;
                          return (
                            <option key={`dealer-${id}-${dIdx}`} value={`DEALER:${id}`}>
                              🏢 {d.companyName} ({d.user?.name || d.phone || 'Dealer'})
                            </option>
                          );
                        })}
                    </optgroup>
                  )}

                  {/* Stores / Shops Group */}
                  {(recipientType === 'ALL' || recipientType === 'STORE') && (
                    <optgroup label="── Retail Shops &amp; Kirana Stores ──">
                      {stores
                        .filter(s => {
                          if (!recipientSearch) return true;
                          const q = recipientSearch.toLowerCase();
                          return (s.name || '').toLowerCase().includes(q) ||
                                 (s.ownerName || '').toLowerCase().includes(q) ||
                                 (s.phone || s.ownerPhone || '').includes(q) ||
                                 (s.city || '').toLowerCase().includes(q);
                        })
                        .map((s, sIdx) => {
                          const id = s.id || s._id || sIdx;
                          return (
                            <option key={`store-${id}-${sIdx}`} value={`STORE:${id}`}>
                              🏪 {s.name} ({s.ownerName ? `${s.ownerName} · ` : ''}{s.phone || s.city || 'Shop'})
                            </option>
                          );
                        })}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Selected Recipient Card */}
              {selectedRecipient && (
                <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 rounded-xl px-4 py-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-rose-200 text-rose-600">
                      {selectedRecipient.type === 'DEALER' ? (
                        <Building2 className="w-4 h-4" />
                      ) : selectedRecipient.type === 'STORE' ? (
                        <Store className="w-4 h-4" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-slate-800 text-sm">{selectedRecipient.name}</p>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white text-rose-700 border border-rose-200">
                          {selectedRecipient.type === 'DEALER' ? 'Dealer' : selectedRecipient.type === 'STORE' ? 'Shop / Store' : 'Person'}
                        </span>
                      </div>
                      <p className="text-slate-600 font-medium mt-0.5">
                        {selectedRecipient.phone ? `Phone: ${selectedRecipient.phone}` : ''}
                        {selectedRecipient.address ? ` · ${selectedRecipient.address}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedRecipient.type === 'DEALER' && dealerMargins.length > 0 && (
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-black">
                        {dealerMargins.length} margins
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecipient(null);
                        setSelectedDealerId('');
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {/* Reason for Stock Transfer */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Reason for Stock Transfer <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Logged in invoice &amp; ledger</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'RESTOCK', label: 'Periodic Restock' },
                    { id: 'NEW_OPENING', label: 'New Shop/Store Opening' },
                    { id: 'REPLACEMENT', label: 'Damaged / Replacement' },
                    { id: 'SAMPLE', label: 'Sample / Marketing Kit' },
                    { id: 'DEMO', label: 'Expo / Stall Stock' },
                    { id: 'OTHER', label: 'Other Reason...' }
                  ].map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setTransferReason(r.id)}
                      className={`p-2.5 rounded-xl text-xs font-bold text-left border transition cursor-pointer flex items-center justify-between ${
                        transferReason === r.id
                          ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{r.label}</span>
                      {transferReason === r.id && <Check className="w-3.5 h-3.5 text-rose-600 shrink-0 ml-1" />}
                    </button>
                  ))}
                </div>

                {transferReason === 'OTHER' && (
                  <input
                    type="text"
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    placeholder="Enter custom reason for stock transfer..."
                    className="w-full mt-2 p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none text-xs font-bold text-slate-700"
                  />
                )}
              </div>

              {/* Invoice Type selection */}
              <div className="pt-3 border-t border-slate-100">
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
                      {stocks.map((item, itmIdx) => {
                        const id = item.id || item._id || (typeof item.productId === 'object' ? item.productId?.id || item.productId?._id : item.productId) || itmIdx;
                        const name = item.product?.name || item.itemName || 'Unknown Product';
                        const unit = item.product?.unit || item.unit || 'PCS';
                        return (
                          <option key={`prod-${id}-${itmIdx}`} value={String(id)}>
                            {name} — Avail: {item.quantity} {unit}
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
                      className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Live FIFO Stock Allocation Preview for currently selected product */}
                {(() => {
                  const selStock = stocks.find(s => {
                    const sId = s.id || s._id || (typeof s.productId === 'object' ? s.productId?.id || s.productId?._id : s.productId);
                    const pId = s.productId ? (typeof s.productId === 'object' ? s.productId?.id || s.productId?._id : s.productId) : null;
                    return String(sId) === String(currentProductId) || (pId && String(pId) === String(currentProductId));
                  });
                  if (!selStock) return null;
                  const alloc = getStockAllocation(selStock, currentQty);
                  return (
                    <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs space-y-1.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                          <Package className="w-3.5 h-3.5 text-amber-600" />
                          Warehouse Stock: <strong>{selStock.quantity} {selStock.product?.unit || 'PCS'}</strong>
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-bold">
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                            📦 Old Stock: {alloc.oldStockAvail} pcs
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-300">
                            ✨ Latest Stock: {alloc.latestStockAvail} pcs
                          </span>
                        </div>
                      </div>
                      {parseInt(currentQty) > 0 && (
                        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-amber-200/60 text-[11px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-slate-600 font-semibold text-[10px]">Stock Taken:</span>
                            <span className="px-2 py-0.5 rounded bg-amber-600 text-white font-black text-[10px] shadow-2xs">
                              📦 {alloc.oldStockTaken} Old Stock
                            </span>
                            <span className="px-2 py-0.5 rounded bg-blue-600 text-white font-black text-[10px] shadow-2xs">
                              ✨ {alloc.latestStockTaken} Latest Stock
                            </span>
                          </div>
                          <span className="text-slate-700 font-bold text-[10px]">
                            Est. Batch Cost: {fmt(alloc.totalCost)} ({fmt(alloc.avgCostPerUnit)}/pc)
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={!currentProductId}
                  className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold text-[10px] px-4 py-2 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add to Dispatch List
                </button>
              </div>

              {/* Cart / Dispatch List */}
              {transferItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Dispatch List — Stock Breakdown
                    </p>
                    <span className="text-[10px] font-bold text-slate-500">
                      {transferItems.length} product{transferItems.length !== 1 ? 's' : ''} added
                    </span>
                  </div>

                  <div className="border border-slate-150 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs min-w-[620px]">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase text-slate-400 tracking-wider">
                            <th className="px-4 py-2.5 text-left min-w-[180px]">Product &amp; SKU</th>
                            <th className="px-3 py-2.5 text-center w-16">Qty</th>
                            <th className="px-3 py-2.5 text-center min-w-[180px]">Stock Sourced (FIFO)</th>
                            <th className="px-3 py-2.5 text-center min-w-[95px]">Margin</th>
                            <th className="px-3 py-2.5 text-right min-w-[95px]">Selling</th>
                            <th className="px-3 py-2.5 text-center w-12"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {invoiceLines.map(line => {
                            const id = typeof line.productId === 'object' ? line.productId?.id || line.productId?.toString() : line.productId;
                            return (
                              <tr key={id} className="hover:bg-slate-50/50 transition-colors">
                                {/* Product Info */}
                                <td className="px-4 py-3 align-middle">
                                  <p className="font-bold text-slate-800 line-clamp-1">{line.product?.name || 'Unknown Product'}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] text-rose-600 font-black">SKU: {line.product?.sku || 'N/A'}</span>
                                    <span className="text-[9px] text-slate-400 font-semibold">MRP: {fmt(line.basePrice)}</span>
                                  </div>
                                </td>

                                {/* Qty */}
                                <td className="px-3 py-3 text-center align-middle font-bold text-slate-800 whitespace-nowrap">
                                  {line.quantity} <span className="text-[10px] text-slate-400 block font-normal">{line.product?.unit || 'PCS'}</span>
                                </td>

                                {/* Stock Sourcing Breakdown (Old vs Latest) */}
                                <td className="px-3 py-3 align-middle">
                                  <div className="flex flex-col gap-1 text-[10px] max-w-[180px] mx-auto">
                                    <div className="flex items-center justify-between px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-md font-bold text-amber-900">
                                      <span className="flex items-center gap-1 font-semibold">📦 Old Stock:</span>
                                      <span className="font-black">{line.oldStockTaken} pcs</span>
                                    </div>
                                    <div className="flex items-center justify-between px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-md font-bold text-blue-900">
                                      <span className="flex items-center gap-1 font-semibold">✨ Latest Stock:</span>
                                      <span className="font-black">{line.latestStockTaken} pcs</span>
                                    </div>
                                  </div>
                                </td>

                                {/* Margin */}
                                <td className="px-3 py-3 text-center align-middle whitespace-nowrap">
                                  <div className="inline-flex items-center justify-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      value={line.marginPct !== undefined ? line.marginPct : 0}
                                      onChange={e => handleMarginChange(line.productId, e.target.value)}
                                      className="w-9 text-center bg-transparent text-xs focus:outline-none font-bold text-slate-800"
                                    />
                                    <span className="text-[10px] text-slate-400 font-black">%</span>
                                  </div>
                                </td>

                                {/* Selling Price */}
                                <td className="px-3 py-3 text-right align-middle whitespace-nowrap">
                                  <span className="font-black text-slate-800 text-xs">{fmt(line.sellingPrice)}</span>
                                </td>

                                {/* Remove */}
                                <td className="px-3 py-3 text-center align-middle whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveProduct(line.productId)}
                                    className="text-rose-500 hover:text-rose-700 p-1.5 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                                    title="Remove item"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Stock Sourcing & Totals Summary */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Total Stock Sourced</span>
                          <p className="font-bold text-slate-800 mt-0.5 text-[11px]">
                            📦 {invoiceOldStockTotal} Old · ✨ {invoiceLatestStockTotal} Latest
                          </p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Total Quantity</span>
                          <p className="font-bold text-slate-800 mt-0.5 text-[11px]">
                            {invoiceLines.reduce((s, l) => s + (l.quantity || 0), 0)} Items
                          </p>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                          <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Subtotal (excl. GST)</span>
                          <p className="font-bold text-slate-800 mt-0.5 text-[11px]">{fmt(invoiceSubtotal)}</p>
                        </div>
                      </div>

                      <div className="flex justify-end items-center gap-6 text-[10px] font-black text-slate-600 pt-1">
                        <span>GST: <span className="text-slate-800">{fmt(invoiceGst)}</span></span>
                        <span className="text-rose-700 text-xs font-black">Grand Total: <span>{fmt(invoiceTotal)}</span></span>
                      </div>
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
                disabled={(!selectedRecipient && !selectedDealerId) || transferItems.length === 0}
                className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-rose-100 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                Review Invoice &amp; Confirm Dispatch ({finalRecipientName})
              </button>
            </div>
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
                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                      <span className="text-slate-400">
                        {item.recipientType === 'STORE' || item.store ? 'Shop/Store:' : item.recipientType === 'OTHER' ? 'Person/Entity:' : 'Dealer:'}
                      </span>
                      <strong className="text-slate-700 font-black">
                        {item.dealer?.companyName || item.store?.name || item.recipientName || 'Unknown Recipient'}
                      </strong>
                      {(item.dealer?.phone || item.store?.phone || item.recipientPhone) && (
                        <span className="text-slate-400">
                          ({item.dealer?.phone || item.store?.phone || item.recipientPhone})
                        </span>
                      )}
                      {item.transferReason && (
                        <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2 py-0.2 rounded-full">
                          Reason: {item.transferReason}
                        </span>
                      )}
                      {(item.oldStockTotal > 0 || item.latestStockTotal > 0) && (
                        <span className="text-[9px] bg-slate-100 text-slate-700 border border-slate-200 font-bold px-2 py-0.2 rounded-full">
                          📦 {item.oldStockTotal || 0} Old · ✨ {item.latestStockTotal || 0} Latest
                        </span>
                      )}
                      {item.totalProfit !== undefined && (
                        <span className={`text-[9px] font-black px-2 py-0.2 rounded-full border ${
                          item.totalProfit >= 0
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}>
                          Profit: {item.totalProfit >= 0 ? `+${fmt(item.totalProfit)}` : `-${fmt(Math.abs(item.totalProfit))}`} ({item.profitMarginPct || 0}%)
                        </span>
                      )}
                    </div>
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
                            <p className="text-[9px] text-rose-600 font-black">SKU: {it.product?.sku}</p>
                            {it.marginPct != null && (
                              <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                                Margin: {it.marginPct}% · Eff: {fmt(it.unitPrice)}
                              </p>
                            )}
                            {(it.oldStockTaken !== undefined || it.latestStockTaken !== undefined) && (
                              <div className="flex items-center gap-1.5 mt-1 text-[9px] font-bold flex-wrap">
                                <span className="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  📦 Old: {it.oldStockTaken || 0}
                                </span>
                                <span className="text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                  ✨ New: {it.latestStockTaken || 0}
                                </span>
                                {it.profit != null && (
                                  <span className={`px-1.5 py-0.2 rounded font-black ${
                                    it.profit >= 0 ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-rose-700 bg-rose-50 border border-rose-200'
                                  }`}>
                                    {it.profit >= 0 ? `+${fmt(it.profit)}` : `-${fmt(Math.abs(it.profit))}`}
                                  </span>
                                )}
                              </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white max-w-4xl w-full rounded-3xl shadow-2xl overflow-hidden my-8 border border-slate-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-600 text-white rounded-xl shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider">
                    {invoiceType === 'ADVANCE' ? 'Advance Invoice Preview' : 'Invoice Preview & Stock Audit'}
                  </p>
                  <h3 className="font-black text-slate-800 text-sm">Review Before Dispatch &amp; Confirm Allocation</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInvoicePreview(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-white/80 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Invoice Body */}
            <div className="p-6 space-y-5">
              {/* Parties */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">From (Company)</p>
                  <p className="font-black text-slate-800">Mansara Foods Pvt. Ltd.</p>
                  <p className="text-slate-500">Mumbai, Maharashtra</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    To ({selectedRecipient?.type === 'STORE' ? 'Shop / Store' : selectedRecipient?.type === 'OTHER' ? 'Person / Entity' : 'Dealer'})
                  </p>
                  <p className="font-black text-slate-800 text-sm">{finalRecipientName}</p>
                  <p className="text-slate-500">{finalRecipientPhone} {finalRecipientAddress ? `· ${finalRecipientAddress}` : ''}</p>
                  <p className="text-[10px] text-amber-700 font-bold mt-1">
                    Transfer Reason: <span className="uppercase font-black">{finalTransferReason}</span>
                  </p>
                </div>
              </div>

              {/* Line items with FIFO stock sourcing and P&L */}
              <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-black text-[9px] uppercase tracking-wider">
                      <th className="px-3.5 py-3 text-left">Product</th>
                      <th className="px-3 py-3 text-center">Qty</th>
                      <th className="px-3.5 py-3 text-center">Stock Sourced (FIFO)</th>
                      <th className="px-3 py-3 text-center">Base</th>
                      <th className="px-3 py-3 text-center">Margin</th>
                      <th className="px-3 py-3 text-center">Selling</th>
                      <th className="px-3 py-3 text-center">GST</th>
                      <th className="px-3.5 py-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceLines.map(line => {
                      const id = typeof line.productId === 'object' ? line.productId?.id || line.productId?.toString() : line.productId;
                      return (
                        <tr key={id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition">
                          <td className="px-3.5 py-3">
                            <p className="font-bold text-slate-800">{line.product?.name || 'Unknown Product'}</p>
                            <p className="text-[9px] text-rose-600 font-black">SKU: {line.product?.sku || 'N/A'}</p>
                          </td>
                          <td className="px-3 py-3 text-center text-slate-700 font-bold">
                            {line.quantity} <span className="text-[10px] text-slate-400 font-normal">{line.product?.unit || 'PCS'}</span>
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <div className="flex flex-col gap-1 text-[10px]">
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 font-bold flex items-center justify-between">
                                <span>📦 Old:</span> <strong className="font-black">{line.oldStockTaken} pcs</strong>
                              </span>
                              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200 font-bold flex items-center justify-between">
                                <span>✨ Latest:</span> <strong className="font-black">{line.latestStockTaken} pcs</strong>
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center text-slate-500 font-medium">{fmt(line.basePrice)}</td>
                          <td className="px-3 py-3 text-center">
                            <span className="bg-emerald-50 text-emerald-700 font-black text-[10px] px-2 py-0.5 rounded-full border border-emerald-100">
                              +{line.marginPct}%
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-slate-700">{fmt(line.sellingPrice)}</td>
                          <td className="px-3 py-3 text-center text-slate-500">{line.gstPct}%</td>
                          <td className="px-3.5 py-3 text-right font-black text-slate-800">{fmt(line.lineTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Financial & Stock Overview Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-md space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                      Dispatch Stock &amp; Value Overview
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    FIFO batch sourcing evaluation
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                    <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">📦 Old Stock Cleared</span>
                    <p className="text-sm font-black text-amber-300 mt-0.5">{invoiceOldStockTotal} PCS</p>
                    <span className="text-[9px] text-slate-400">Earliest batches</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                    <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">✨ Latest Stock Dispatched</span>
                    <p className="text-sm font-black text-blue-300 mt-0.5">{invoiceLatestStockTotal} PCS</p>
                    <span className="text-[9px] text-slate-400">Fresh production</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-3 rounded-xl">
                    <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">📦 Total Quantity</span>
                    <p className="text-sm font-black text-slate-200 mt-0.5">{invoiceLines.reduce((s, l) => s + (l.quantity || 0), 0)} PCS</p>
                    <span className="text-[9px] text-slate-400">Combined count</span>
                  </div>
                  <div className="bg-white/10 border border-amber-400/30 p-3 rounded-xl">
                    <span className="text-[9px] font-black uppercase text-amber-300 block tracking-wider">🧾 Invoice Grand Total</span>
                    <p className="text-sm font-black text-amber-400 mt-0.5">
                      {fmt(invoiceTotal)}
                    </p>
                    <span className="text-[9px] text-slate-400 font-bold">
                      Incl. GST {fmt(invoiceGst)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Totals Box */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Subtotal (Revenue excl. GST)</span>
                  <span className="font-bold text-slate-700">{fmt(invoiceSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Total GST (CGST + SGST)</span>
                  <span className="font-bold text-slate-700">{fmt(invoiceGst)}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-black pt-2 border-t border-slate-200 text-sm">
                  <span>Grand Total (Invoice Amount)</span>
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
                type="button"
                onClick={() => setShowInvoicePreview(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl text-xs cursor-pointer transition"
              >
                ← Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                disabled={submitting}
                className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl shadow-lg shadow-rose-100 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Invoice &amp; Dispatching...</>
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
                <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Items Breakdown &amp; Stock Sourcing</span>
                <div className="border border-slate-150 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 p-3 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    <div className="col-span-4">Product / SKU</div>
                    <div className="col-span-1 text-center">Qty</div>
                    <div className="col-span-3 text-center">Stock Sourced</div>
                    <div className="col-span-1 text-center">Margin</div>
                    <div className="col-span-1 text-right">Profit</div>
                    <div className="col-span-2 text-right">Line Total</div>
                  </div>
                  {selectedInvoice.items?.map(item => (
                    <div key={item.id || item._id} className="grid grid-cols-12 items-center p-3 border-b border-slate-100 last:border-0 text-xs">
                      <div className="col-span-4 font-bold text-slate-800">
                        {item.product?.name}
                        <span className="block text-[9px] font-black text-rose-600">SKU: {item.product?.sku}</span>
                      </div>
                      <div className="col-span-1 text-center font-bold text-slate-700">{item.quantity} {item.unit || item.product?.unit || 'PCS'}</div>
                      <div className="col-span-3 text-center">
                        <div className="flex flex-col gap-0.5 text-[10px]">
                          <span className="text-amber-800 bg-amber-50 px-1 rounded font-bold">
                            📦 Old: {item.oldStockTaken || 0} pcs
                          </span>
                          <span className="text-blue-800 bg-blue-50 px-1 rounded font-bold">
                            ✨ New: {item.latestStockTaken || 0} pcs
                          </span>
                        </div>
                      </div>
                      <div className="col-span-1 text-center font-bold text-slate-700">{parseFloat(item.marginPct || 0)}%</div>
                      <div className="col-span-1 text-right font-black text-emerald-700 text-[11px]">
                        {item.profit !== undefined ? fmt(item.profit) : '-'}
                      </div>
                      <div className="col-span-2 text-right font-bold text-slate-800">{fmt(item.lineTotal || 0)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end pt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between w-60 text-[11px] text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-700">{fmt(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.totalCost && (
                  <div className="flex justify-between w-60 text-[11px] text-slate-500">
                    <span>Goods Cost (COGS):</span>
                    <span className="font-bold text-slate-700">{fmt(selectedInvoice.totalCost)}</span>
                  </div>
                )}
                {selectedInvoice.totalProfit !== undefined && (
                  <div className="flex justify-between w-60 text-[11px] text-emerald-700 font-bold">
                    <span>Estimated Net Profit:</span>
                    <span>+{fmt(selectedInvoice.totalProfit)} ({selectedInvoice.profitMarginPct || 0}%)</span>
                  </div>
                )}
                {selectedInvoice.isGstEnabled !== false ? (
                  <>
                    <div className="flex justify-between w-60 text-[11px] text-slate-500">
                      <span>CGST:</span>
                      <span className="font-bold text-slate-700">{fmt((selectedInvoice.cgst !== undefined ? parseFloat(selectedInvoice.cgst) : parseFloat(selectedInvoice.totalGst) / 2) || 0)}</span>
                    </div>
                    <div className="flex justify-between w-60 text-[11px] text-slate-500">
                      <span>SGST:</span>
                      <span className="font-bold text-slate-700">{fmt((selectedInvoice.sgst !== undefined ? parseFloat(selectedInvoice.sgst) : parseFloat(selectedInvoice.totalGst) / 2) || 0)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between w-60 text-[11px] text-slate-500">
                    <span>GST:</span>
                    <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[9px] uppercase">Disabled</span>
                  </div>
                )}
                {selectedInvoice.shippingCharges && parseFloat(selectedInvoice.shippingCharges) > 0 && (
                  <div className="flex justify-between w-60 text-[11px] text-slate-500">
                    <span>Shipping:</span>
                    <span className="font-bold text-slate-700">{fmt(selectedInvoice.shippingCharges)}</span>
                  </div>
                )}
                <div className="flex justify-between w-60 text-xs font-black text-slate-800 border-t border-slate-100 pt-2">
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

      {/* ════ ADD NEW SHOP / PERSON MODAL ════ */}
      {showAddNewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-rose-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-600/30 border border-rose-400/30 rounded-xl text-rose-300">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Add New Shop or Person</h3>
                  <p className="text-[11px] text-rose-200 font-medium">Create and immediately select for stock transfer</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddNewModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewRecipient} className="p-6 space-y-4">
              {/* Type Switch */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5 tracking-wider">
                  Recipient Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRecipientData(prev => ({ ...prev, type: 'STORE' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      newRecipientData.type === 'STORE'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>Retail Shop / Kirana</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRecipientData(prev => ({ ...prev, type: 'OTHER' }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      newRecipientData.type === 'OTHER'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Person / Representative</span>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">
                  {newRecipientData.type === 'STORE' ? 'Shop / Store Name *' : 'Person / Business Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newRecipientData.name}
                  onChange={e => setNewRecipientData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={newRecipientData.type === 'STORE' ? 'e.g. Annapoorna Daily Mart' : 'e.g. Ramesh Kumar'}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-rose-500 focus:bg-white text-xs font-bold text-slate-800"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={newRecipientData.phone}
                  onChange={e => setNewRecipientData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-rose-500 focus:bg-white text-xs font-bold text-slate-800"
                />
              </div>

              {/* Address & City */}
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">
                    Address / Location
                  </label>
                  <input
                    type="text"
                    value={newRecipientData.address}
                    onChange={e => setNewRecipientData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="e.g. 14 Market Road, Main Junction"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-rose-500 focus:bg-white text-xs font-medium text-slate-800"
                  />
                </div>
                {newRecipientData.type === 'STORE' && (
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">
                      City / Area
                    </label>
                    <input
                      type="text"
                      value={newRecipientData.city}
                      onChange={e => setNewRecipientData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder="e.g. Coimbatore"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-rose-500 focus:bg-white text-xs font-medium text-slate-800"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddNewModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRecipient || !newRecipientData.name.trim()}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  {creatingRecipient ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Save &amp; Select</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
