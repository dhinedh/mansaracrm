// src/pages/sales/SalesOrdersPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ShoppingBag, Plus, Trash2, Clock, CheckCircle2, 
  FileText, Send, ArrowRight, RefreshCw, X, AlertCircle,
  Download, Eye, Printer, Copy
} from 'lucide-react';
import WhatsAppShareModal from '../../components/WhatsAppShareModal';
import {
  buildQuotationHtml,
  triggerPrintQuotation,
  downloadQuotationHtml,
  downloadQuotationPdf,
  formatQuotationWhatsAppText
} from '../../utils/quotationHelper';

export default function SalesOrdersPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const getInitialTab = () => {
    const p = window.location.pathname;
    if (p.includes('/quotations')) return 'quotations';
    if (p.includes('/tracking')) return 'orders';
    if (p.includes('/amendments')) return 'amendments';
    return 'new';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Order Form state (Module 18, 19)
  const [selectedShopId, setSelectedShopId] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  // Booked Orders state
  const [bookedOrders, setBookedOrders] = useState([]);

  // Quotation state (Module 20)
  const [quotations, setQuotations] = useState([]);
  const [quoteCustomerName, setQuoteCustomerName] = useState('');
  const [quoteCustomerPhone, setQuoteCustomerPhone] = useState('');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [activeQuotationData, setActiveQuotationData] = useState(null);
  const [previewQuote, setPreviewQuote] = useState(null);

  // Amendments & returns state (Module 22, 23)
  const [amendments, setAmendments] = useState([]);
  const [amendModalOpen, setAmendModalOpen] = useState(false);
  const [amendRefNo, setAmendRefNo] = useState('');
  const [amendType, setAmendType] = useState('AMENDMENT');
  const [amendReason, setAmendReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shopsRes, prodRes, quoteRes, amendRes, ordersRes] = await Promise.all([
        axios.get('/field-sales/shops'),
        axios.get('/field-sales/catalogue'),
        axios.get('/field-sales/quotations'),
        axios.get('/field-sales/amendments'),
        axios.get('/field-sales/orders')
      ]);

      if (shopsRes.data?.success) setShops(shopsRes.data.data || []);
      if (prodRes.data?.success) setProducts(prodRes.data.data.products || []);
      if (quoteRes.data?.success) setQuotations(quoteRes.data.data || []);
      if (amendRes.data?.success) setAmendments(amendRes.data.data || []);
      if (ordersRes.data?.success) setBookedOrders(ordersRes.data.data || []);

      if (shopsRes.data?.data?.length > 0) {
        setSelectedShopId(shopsRes.data.data[0]._id);
      }
    } catch (err) {
      console.error('Error loading order data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync tab with URL
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/quotations')) {
      setActiveTab('quotations');
    } else if (path.includes('/tracking')) {
      setActiveTab('orders');
    } else if (path.includes('/amendments')) {
      setActiveTab('amendments');
    } else if (path.includes('/orders')) {
      setActiveTab('new');
    }
  }, [location.pathname]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'quotations') navigate('/sales/quotations');
    else if (tab === 'orders') navigate('/sales/tracking');
    else if (tab === 'amendments') navigate('/sales/amendments');
    else navigate('/sales/orders');
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Add Item to Order
  const handleAddItem = (productId) => {
    const prod = products.find(p => p._id === productId);
    if (!prod) return;

    const existing = orderItems.find(item => item.productId === productId);
    if (existing) {
      setOrderItems(orderItems.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setOrderItems([...orderItems, {
        productId: prod._id,
        productName: prod.name,
        unitPrice: prod.mrp || 100,
        quantity: 1
      }]);
    }
  };

  // Remove Item
  const handleRemoveItem = (productId) => {
    setOrderItems(orderItems.filter(i => i.productId !== productId));
  };

  // Order Subtotal
  const orderSubtotal = orderItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);

  // Submit Order (Module 18)
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!selectedShopId || orderItems.length === 0) {
      alert('Please select a customer shop and add at least one product.');
      return;
    }

    setOrderSubmitting(true);
    try {
      const res = await axios.post('/field-sales/orders', {
        storeId: selectedShopId,
        items: orderItems,
        notes: orderNotes
      });

      if (res.data?.success) {
        alert('Order booked successfully! Order No: ' + res.data.data.orderNumber);
        setOrderItems([]);
        setOrderNotes('');
        await fetchData();
        setActiveTab('orders');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit order');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleDownloadQuotation = async (q) => {
    const isApproved = q.status === 'APPROVED';
    const enriched = {
      ...q,
      isInvoice: isApproved
    };
    try {
      await downloadQuotationPdf(enriched);
    } catch (err) {
      const htmlContent = buildQuotationHtml(enriched);
      const prefix = isApproved ? 'Invoice' : 'Quotation';
      const num = isApproved ? (q.invoiceNo || (q.quotationNo ? q.quotationNo.replace(/QTN|qtn|QT-/g, 'INV-') : 'INV')) : q.quotationNo;
      const fileName = `${prefix}_${(num || 'Mansara').replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
      downloadQuotationHtml(htmlContent, fileName);
      triggerPrintQuotation(htmlContent);
    }
  };

  const handleShareWhatsApp = (q) => {
    const isApproved = q.status === 'APPROVED';
    const enriched = {
      ...q,
      isInvoice: isApproved
    };
    setActiveQuotationData(enriched);
    const text = formatQuotationWhatsAppText(enriched);
    const phone = q.customerPhone || '';
    setWhatsAppPhone(phone);
    setWhatsAppMessage(text);
    setShowWhatsAppModal(true);
  };

  // Submit Quotation (Module 20)
  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    if (!quoteCustomerName || orderItems.length === 0) {
      alert('Please enter customer name and at least one item');
      return;
    }

    try {
      const res = await axios.post('/field-sales/quotations', {
        customerName: quoteCustomerName,
        customerPhone: quoteCustomerPhone,
        items: orderItems
      });

      if (res.data?.success) {
        const createdQuote = res.data.data;
        alert('Quotation submitted for review! Quotation No: ' + createdQuote.quotationNo);
        setQuoteCustomerName('');
        setQuoteCustomerPhone('');
        const qRes = await axios.get('/field-sales/quotations');
        if (qRes.data?.success) setQuotations(qRes.data.data);
        // Automatically open WhatsApp share modal with the newly created quote
        handleShareWhatsApp(createdQuote);
      }
    } catch (err) {
      alert('Failed to create quotation');
    }
  };

  // Submit Amendment / Return (Module 22, 23)
  const handleSubmitAmendment = async (e) => {
    e.preventDefault();
    if (!amendRefNo || !amendReason) return;

    try {
      const res = await axios.post('/field-sales/amendments', {
        referenceNo: amendRefNo,
        requestType: amendType,
        reason: amendReason
      });

      if (res.data?.success) {
        alert('Request submitted to Admin for review');
        setAmendModalOpen(false);
        setAmendRefNo('');
        setAmendReason('');
        const aRes = await axios.get('/field-sales/amendments');
        if (aRes.data?.success) setAmendments(aRes.data.data);
      }
    } catch (err) {
      alert('Failed to submit amendment request');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Sales & Order Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Modules 18–23: Order Booking, Quick Reorder, Quotations, Tracking & Amendments
          </p>
        </div>

        <button
          type="button"
          onClick={() => setAmendModalOpen(true)}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-xs"
        >
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>Request Amendment / Return</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabClick('new')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'new' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Create Sales Order
        </button>
        <button
          type="button"
          onClick={() => handleTabClick('orders')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'orders' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Booked Orders ({bookedOrders.length})
        </button>
        <button
          type="button"
          onClick={() => handleTabClick('quotations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'quotations' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Quotations ({quotations.length})
        </button>
        <button
          type="button"
          onClick={() => handleTabClick('amendments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'amendments' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Amendments & Returns ({amendments.length})
        </button>
      </div>

      {/* Tab 1: New Sales Order Creation (Module 18, 19) */}
      {activeTab === 'new' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Product Picker */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-800/80 border border-white/10 p-4 rounded-2xl space-y-3">
              <label className="block text-xs font-bold text-slate-300 uppercase">
                1. Select Retail Customer Shop
              </label>
              <select
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {shops.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} - {s.address || 'Chennai'}</option>
                ))}
              </select>
            </div>

            <div className="bg-slate-800/80 border border-white/10 p-4 rounded-2xl space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase">
                2. Tap Products to Add to Order
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {products.map((p) => (
                  <div
                    key={p._id}
                    className="p-3 bg-slate-900/60 border border-white/5 rounded-xl flex items-center justify-between hover:border-amber-500/40 transition-all"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1">{p.name}</h4>
                      <p className="text-[11px] text-amber-400 font-semibold mt-0.5">₹{p.mrp}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddItem(p._id)}
                      className="p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg cursor-pointer active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Order Cart & Summary */}
          <div className="bg-slate-800/90 border border-white/10 p-5 rounded-3xl flex flex-col justify-between h-fit space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <h3 className="text-sm font-black text-white">Order Summary</h3>
                <span className="text-xs text-amber-400 font-bold">{orderItems.length} Items</span>
              </div>

              {orderItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No items added yet. Click (+) on any product to add.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {orderItems.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5">
                      <div className="max-w-[140px] truncate">
                        <span className="font-semibold text-white">{item.productName}</span>
                        <div className="text-[10px] text-slate-400">₹{item.unitPrice} × {item.quantity}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">₹{item.unitPrice * item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId)}
                          className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 pt-3 border-t border-white/10">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Subtotal:</span>
                <span className="text-white font-bold">₹{orderSubtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Estimated GST (5%):</span>
                <span className="text-white font-bold">₹{(orderSubtotal * 0.05).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-amber-400 pt-1 border-t border-white/10">
                <span>Order Grand Total:</span>
                <span>₹{(orderSubtotal * 1.05).toLocaleString('en-IN')}</span>
              </div>

              <textarea
                rows="2"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Delivery instructions / notes..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              ></textarea>

              <button
                type="button"
                onClick={handleSubmitOrder}
                disabled={orderSubmitting || orderItems.length === 0}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{orderSubmitting ? 'Booking Order...' : 'Submit Sales Order'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Booked Orders (Salesperson Traceability) */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Live status and fulfillment tracking for all secondary sales orders booked by you.
            </p>
            <button
              onClick={fetchData}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Orders</span>
            </button>
          </div>

          {bookedOrders.length === 0 ? (
            <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-12 text-center">
              <ShoppingBag className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">No Orders Booked Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Use the "Create Sales Order" tab to take spot bookings from retail stores.
              </p>
              <button
                onClick={() => setActiveTab('new')}
                className="bg-amber-500 text-slate-950 text-xs font-black px-4 py-2 rounded-xl cursor-pointer"
              >
                Create First Order
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookedOrders.map((ord) => {
                const statusColors = {
                  PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                  APPROVED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                  DISPATCHED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
                  DELIVERED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                  CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                };
                const color = statusColors[ord.status] || 'bg-slate-500/10 text-slate-300 border-slate-500/30';

                return (
                  <div key={ord._id} className="bg-slate-800/90 border border-white/10 rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-amber-400">
                          {ord.orderNumber}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${color}`}>
                        {ord.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-white">{ord.storeName || ord.store?.name || 'Retail Outlet'}</h4>
                      <p className="text-[11px] text-slate-400">
                        {ord.store?.address || ord.store?.phone ? `${ord.store?.address || ''} • ${ord.store?.phone || ''}` : 'Secondary Outlet Booking'}
                      </p>
                      {ord.dealer && (
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Assigned Distributor: <span className="text-slate-300 font-semibold">{ord.dealer.companyName || ord.dealer.name}</span>
                        </p>
                      )}
                    </div>

                    <div className="bg-slate-900/80 rounded-xl p-2.5 border border-white/5 space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Booked Line Items</div>
                      {ord.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-slate-300 font-medium truncate max-w-[200px]">{it.productName || it.name}</span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {it.quantity} x ₹{it.unitPrice} = <strong className="text-white">₹{(it.quantity * it.unitPrice).toLocaleString('en-IN')}</strong>
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400">Payment: </span>
                        <span className="text-[11px] font-bold text-slate-200">{ord.paymentMethod || 'CASH'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 mr-1.5">Total Value:</span>
                        <span className="text-sm font-black text-amber-400">
                          ₹{(ord.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Quotations (Module 20) */}
      {activeTab === 'quotations' && (
        <div className="space-y-4">
          {quotations.length === 0 ? (
            <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-8 text-center text-slate-400">
              <FileText className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <p className="font-bold text-white text-sm">No quotations created yet</p>
              <p className="text-xs text-slate-400 mt-1">Use the "Book New Order" form to draft a commercial quote for review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quotations.map((q) => (
                <div key={q._id} className="bg-slate-800/80 border border-white/10 p-5 rounded-2xl space-y-3 hover:border-amber-500/30 transition flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-slate-200">
                        {q.quotationNo}
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                        q.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' :
                        q.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {q.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-white">{q.customerName}</h3>
                      {q.customerPhone && (
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">Ph: {q.customerPhone}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {q.items?.length || 0} {q.items?.length === 1 ? 'Item' : 'Items'} &bull; {new Date(q.createdAt || Date.now()).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-2 border-t border-white/10">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">Total Value:</span>
                      <span className="font-black text-amber-400 text-sm">₹{(q.grandTotal || 0).toLocaleString('en-IN')}</span>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleShareWhatsApp(q)}
                        className="py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition cursor-pointer text-[11px]"
                        title="Share on WhatsApp"
                      >
                        <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.825zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.981-1.306A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                        </svg>
                        <span>WhatsApp</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadQuotation(q)}
                        className="py-1.5 px-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition cursor-pointer text-[11px]"
                        title="Download Quotation Document & Print"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewQuote(q)}
                        className="py-1.5 px-2 bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl font-bold flex items-center justify-center gap-1 active:scale-95 transition cursor-pointer text-[11px]"
                        title="Preview Details"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Amendments & Returns (Module 22, 23) */}
      {activeTab === 'amendments' && (
        <div className="bg-slate-800/80 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Reference No</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {amendments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                    No amendment or return requests logged.
                  </td>
                </tr>
              ) : (
                amendments.map((a) => (
                  <tr key={a._id} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-mono font-bold text-white">{a.referenceNo}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10">
                        {a.requestType}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-400">{a.reason}</td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold text-amber-400 uppercase">{a.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Amendment Modal */}
      {amendModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setAmendModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-white mb-1">Request Order Amendment / Return</h3>
            <p className="text-xs text-slate-400 mb-4">Submit cancellation, item quantity amendment or replacement request</p>

            <form onSubmit={handleSubmitAmendment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Request Type *</label>
                <select
                  value={amendType}
                  onChange={(e) => setAmendType(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="AMENDMENT">Order Quantity Amendment</option>
                  <option value="CANCELLATION">Order Cancellation</option>
                  <option value="RETURN_REPLACEMENT">Product Return & Replacement</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Order / Invoice Reference No *</label>
                <input
                  type="text"
                  required
                  value={amendRefNo}
                  onChange={(e) => setAmendRefNo(e.target.value)}
                  placeholder="e.g. SO-123456 or MF-INV-0038"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Reason & Customer Request Details *</label>
                <textarea
                  rows="3"
                  required
                  value={amendReason}
                  onChange={(e) => setAmendReason(e.target.value)}
                  placeholder="Retailer requested 2 fewer cartons due to shelf constraint..."
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Submit Amendment Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── QUOTATION PREVIEW MODAL ─────────────────────────────────────── */}
      {previewQuote && (
        <div
          onClick={() => setPreviewQuote(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-white/10 rounded-3xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">
                  {previewQuote.quotationNo}
                </span>
                <h3 className="text-base font-black text-white mt-1">{previewQuote.customerName}</h3>
                {previewQuote.customerPhone && (
                  <p className="text-xs text-slate-400">Phone: {previewQuote.customerPhone}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewQuote(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Itemized Products</h4>
              <div className="divide-y divide-white/5 border border-white/5 rounded-2xl overflow-hidden bg-slate-950/40">
                {(previewQuote.items || []).map((it, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{it.productName || 'Product'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Qty: {it.quantity} &bull; Rate: ₹{(it.unitPrice || 0).toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-amber-400">₹{(it.totalPrice || (it.quantity * it.unitPrice) || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financials */}
            <div className="p-3.5 bg-white/5 rounded-2xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono text-white">₹{(previewQuote.subtotal || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST (Tax):</span>
                <span className="font-mono text-white">₹{(previewQuote.taxTotal || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-white font-bold pt-1.5 border-t border-white/10 text-sm">
                <span>Grand Total:</span>
                <span className="text-amber-400 font-black">₹{(previewQuote.grandTotal || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  const q = previewQuote;
                  setPreviewQuote(null);
                  handleShareWhatsApp(q);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.825zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.981-1.306A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                </svg>
                <span>Share WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={() => handleDownloadQuotation(previewQuote)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-rose-600/20 active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download / Print</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── WHATSAPP SHARE MODAL ─────────────────────────────────────────── */}
      <WhatsAppShareModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        defaultPhone={whatsAppPhone}
        defaultMessage={whatsAppMessage}
        quotationData={activeQuotationData}
      />
    </div>
  );
}
