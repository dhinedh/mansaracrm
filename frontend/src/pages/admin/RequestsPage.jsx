// src/pages/admin/RequestsPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Truck, 
  Building2, 
  Phone, 
  Mail, 
  MessageSquare,
  AlertTriangle,
  X,
  Eye,
  ChevronRight,
  ChevronDown,
  User,
  Package,
  Layers,
  Store,
  Search,
  ShoppingBag,
  DollarSign,
  RefreshCw,
  Tag,
  MapPin,
  Check,
  Send,
  PackageCheck
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function RequestsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'B2B_MANAGER';

  // Primary Top Channel: 'FIELD_SALES' (Retail Store Orders) vs 'DEALER_PO' (Dealer Purchase Orders)
  const [requestSource, setRequestSource] = useState('FIELD_SALES');

  // ─── FIELD SALES ORDERS STATE ──────────────────────────────────────────────
  const [fieldOrders, setFieldOrders] = useState([]);
  const [fieldStats, setFieldStats] = useState({
    totalOrders: 0,
    totalOrderValue: 0,
    pendingOrdersCount: 0,
    approvedOrdersCount: 0,
    dispatchedOrdersCount: 0
  });
  const [fieldLoading, setFieldLoading] = useState(false);
  const [fieldStatusFilter, setFieldStatusFilter] = useState('ALL');
  const [fieldSearch, setFieldSearch] = useState('');
  const [selectedFieldOrder, setSelectedFieldOrder] = useState(null);
  const [showFieldDetailModal, setShowFieldDetailModal] = useState(false);
  const [updatingFieldOrderId, setUpdatingFieldOrderId] = useState(null);

  // Field Action Dialog (Approve, Dispatch, Deliver, Reject)
  const [fieldActionModal, setFieldActionModal] = useState({
    open: false,
    type: '', // 'APPROVE' | 'DISPATCH' | 'DELIVER' | 'REJECT'
    order: null,
    notes: '',
    dispatchDetails: ''
  });

  // ─── DEALER PO STATE ───────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(isAdmin ? 'pending' : 'create');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState(isAdmin ? 'PENDING' : '');
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Dealer Submit Form states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState('10');
  const [requestItems, setRequestItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Dealer Detail Modal states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Dealer Admin Dispatch Dialog states
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchRequestId, setDispatchRequestId] = useState(null);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchItems, setDispatchItems] = useState([]);

  // Grouped dealer accordion states
  const [expandedDealers, setExpandedDealers] = useState({});

  // ─── FIELD SALES ORDERS FETCHING & ACTIONS ─────────────────────────────────
  const fetchFieldOrders = async () => {
    if (!isAdmin) return;
    setFieldLoading(true);
    try {
      const res = await axios.get('/field-sales/admin/orders', {
        params: {
          status: fieldStatusFilter,
          search: fieldSearch
        }
      });
      if (res.data?.success) {
        setFieldOrders(res.data.data.orders || []);
        setFieldStats({
          totalOrders: res.data.data.totalOrders || 0,
          totalOrderValue: res.data.data.totalOrderValue || 0,
          pendingOrdersCount: res.data.data.pendingOrdersCount || 0,
          approvedOrdersCount: res.data.data.approvedOrdersCount || 0,
          dispatchedOrdersCount: res.data.data.dispatchedOrdersCount || 0
        });
      }
    } catch (err) {
      console.error('Failed to fetch field sales orders:', err);
    } finally {
      setFieldLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && requestSource === 'FIELD_SALES') {
      fetchFieldOrders();
    }
  }, [fieldStatusFilter, requestSource, isAdmin]);

  const handleFieldSearchSubmit = (e) => {
    e.preventDefault();
    fetchFieldOrders();
  };

  const handleUpdateFieldOrderStatus = async (orderId, newStatus, notes = '', dispatchDetails = '') => {
    setUpdatingFieldOrderId(orderId);
    try {
      const res = await axios.put(`/field-sales/admin/orders/${orderId}/status`, {
        status: newStatus,
        notes: notes || undefined,
        dispatchDetails: dispatchDetails || undefined
      });
      if (res.data?.success) {
        setMessage({
          text: `Order #${res.data.data?.orderNumber || ''} status successfully updated to ${newStatus}. Salesperson has been notified!`,
          type: 'success'
        });
        fetchFieldOrders();
        if (selectedFieldOrder && (selectedFieldOrder._id === orderId || selectedFieldOrder.id === orderId)) {
          setSelectedFieldOrder(res.data.data);
        }
        setFieldActionModal({ open: false, type: '', order: null, notes: '', dispatchDetails: '' });
      }
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || 'Failed to update order status',
        type: 'error'
      });
    } finally {
      setUpdatingFieldOrderId(null);
    }
  };

  const openFieldActionDialog = (order, type) => {
    setFieldActionModal({
      open: true,
      type,
      order,
      notes: '',
      dispatchDetails: type === 'DISPATCH' ? 'Dispatched via Direct Van / Delivery Agent' : ''
    });
  };

  // ─── DEALER PO FETCHING & ACTIONS ──────────────────────────────────────────
  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'pending') {
        setStatusFilter('PENDING');
      } else {
        setStatusFilter('');
      }
    } else {
      setStatusFilter('');
    }
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (!isAdmin || requestSource === 'DEALER_PO') {
      fetchRequests();
      if (!isAdmin) {
        fetchProducts();
      }
    }
  }, [statusFilter, requestSource]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/requests', {
        params: { status: statusFilter }
      });
      const data = res.data.data || [];
      setRequests(data);
      if (isAdmin && (statusFilter === 'PENDING' || activeTab === 'pending')) {
        const grouped = groupByDealer(data);
        const allExpanded = {};
        Object.keys(grouped).forEach(k => { allExpanded[k] = true; });
        setExpandedDealers(allExpanded);
      }
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/products');
      setProducts(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  const groupByDealer = (reqs) => {
    return reqs.reduce((acc, req) => {
      const dealerId = req.dealerId || req.dealer?.id || 'unknown';
      if (!acc[dealerId]) acc[dealerId] = { dealer: req.dealer, requests: [] };
      acc[dealerId].requests.push(req);
      return acc;
    }, {});
  };

  const toggleDealer = (dealerId) => {
    setExpandedDealers(prev => ({ ...prev, [dealerId]: !prev[dealerId] }));
  };

  const handleAddToRequestCart = () => {
    if (!selectedProductId || parseInt(selectedQty) <= 0) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;
    const existingIndex = requestItems.findIndex(item => item.productId === selectedProductId);
    if (existingIndex > -1) {
      const updated = [...requestItems];
      updated[existingIndex].quantity += parseInt(selectedQty);
      setRequestItems(updated);
    } else {
      setRequestItems([...requestItems, { productId: selectedProductId, product: prod, quantity: parseInt(selectedQty) }]);
    }
    setSelectedProductId('');
    setSelectedQty('10');
  };

  const handleRemoveFromRequestCart = (prodId) => {
    setRequestItems(requestItems.filter(item => item.productId !== prodId));
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      const newItems = [...requestItems];
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length < 2) continue;
        
        const sku = parts[0].trim().replace(/^["']|["']$/g, '');
        const qty = parseInt(parts[1].trim().replace(/^["']|["']$/g, ''));
        
        if (!sku || isNaN(qty) || qty <= 0) {
          errorCount++;
          continue;
        }
        
        const prod = products.find(p => 
          p.sku?.toLowerCase() === sku.toLowerCase() || 
          p.name?.toLowerCase() === sku.toLowerCase()
        );
        
        if (prod) {
          const existingIdx = newItems.findIndex(it => it.productId === prod.id);
          if (existingIdx > -1) {
            newItems[existingIdx].quantity += qty;
          } else {
            newItems.push({ productId: prod.id, product: prod, quantity: qty });
          }
          successCount++;
        } else {
          errorCount++;
        }
      }
      
      setRequestItems(newItems);
      setMessage({
        text: `Bulk PO import complete: ${successCount} products added.${errorCount > 0 ? ` Skipped ${errorCount} invalid lines/SKUs.` : ''}`,
        type: successCount > 0 ? 'success' : 'error'
      });
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (requestItems.length === 0) return;
    setSubmitting(true);
    setMessage({ text: '', type: '' });
    try {
      await axios.post('/requests', {
        items: requestItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
        notes
      });
      setMessage({ text: 'Order request submitted successfully to Admin.', type: 'success' });
      setRequestItems([]);
      setNotes('');
      setActiveTab('history');
      fetchRequests();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to submit request', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;
    try {
      await axios.patch(`/requests/${id}/cancel`);
      setMessage({ text: 'Request cancelled successfully.', type: 'success' });
      fetchRequests();
      if (showDetailModal) setShowDetailModal(false);
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to cancel request', type: 'error' });
    }
  };

  const openDispatchDialog = async (id) => {
    const reqObj = requests.find(r => r.id === id);
    if (!reqObj) return;
    setDispatchRequestId(id);
    setDispatchNotes('');
    setDispatchItems([]);
    setShowDispatchModal(true);
    try {
      const res = await axios.get('/margins', { params: { dealerId: reqObj.dealerId } });
      const margins = res.data.data || [];
      const itemsWithMargins = reqObj.items.map(item => {
        const product = item.product || {};
        const prodMargin = margins.find(m => (m.productId?.toString() || m.productId) === String(item.productId));
        const catId = product.categoryId || product.category?._id || product.category;
        const catMargin = margins.find(m => (m.categoryId?.toString() || m.categoryId) === String(catId));
        const defMargin = margins.find(m => m.isDefault);
        const marginPct = prodMargin?.marginPercent ?? catMargin?.marginPercent ?? defMargin?.marginPercent ?? 10;
        return {
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          sku: product.sku,
          unit: product.unit,
          mrp: parseFloat(product.mrp || product.price || 0),
          marginPct
        };
      });
      setDispatchItems(itemsWithMargins);
    } catch (err) {
      console.error(err);
      setDispatchItems(reqObj.items.map(item => ({
        productId: item.productId,
        productName: item.product?.name,
        quantity: item.quantity,
        sku: item.product?.sku,
        unit: item.product?.unit,
        mrp: parseFloat(item.product?.mrp || item.product?.price || 0),
        marginPct: 10
      })));
    }
  };

  const handleDispatchMarginChange = (productId, val) => {
    const numeric = parseFloat(val);
    const cleaned = isNaN(numeric) ? 0 : Math.min(100, Math.max(0, numeric));
    setDispatchItems(prev => prev.map(item =>
      item.productId === productId ? { ...item, marginPct: cleaned } : item
    ));
  };

  const handleDispatchRequest = async (e) => {
    e.preventDefault();
    setDispatching(true);
    try {
      const res = await axios.post(`/requests/${dispatchRequestId}/dispatch`, {
        notes: dispatchNotes,
        items: dispatchItems.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          marginPct: i.marginPct
        }))
      });
      if (res.data.success) {
        setMessage({ text: 'Request approved & dispatched! B2B Invoice generated.', type: 'success' });
        setShowDispatchModal(false);
        fetchRequests();
      } else {
        alert(res.data.message || 'Dispatch failed');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Dispatch failed due to server error');
    } finally {
      setDispatching(false);
    }
  };

  const tabs = isAdmin
    ? [
        { id: 'pending', label: 'Pending Requests', icon: Clock },
        { id: 'history', label: 'Request History / Archive', icon: FileText }
      ]
    : [
        { id: 'create', label: 'Create PO Request', icon: Plus },
        { id: 'history', label: 'Request History & Status', icon: FileText }
      ];

  // ─── ADMIN DEALER PENDING VIEW ─────────────────────────────────────────────
  const renderAdminPending = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-16 bg-white border border-slate-150 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      );
    }
    const pendingReqs = requests.filter(r => r.status === 'PENDING');
    if (pendingReqs.length === 0) {
      return (
        <div className="py-20 text-center text-xs text-slate-400 font-semibold italic bg-white border border-slate-150 rounded-2xl">
          No pending dealer requests. All dealer replenishment orders have been processed. ✅
        </div>
      );
    }

    const grouped = groupByDealer(pendingReqs);

    return (
      <div className="space-y-4">
        {Object.entries(grouped).map(([dealerId, { dealer, requests: dealerReqs }]) => {
          const isExpanded = expandedDealers[dealerId] !== false;
          const totalItems = dealerReqs.reduce((acc, r) => acc + (r.items?.length || 0), 0);
          const totalQty = dealerReqs.reduce((acc, r) =>
            acc + r.items?.reduce((a, i) => a + i.quantity, 0), 0);

          return (
            <div key={dealerId} className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => toggleDealer(dealerId)}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-50/40 transition-colors group cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 group-hover:bg-rose-100 transition-colors">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-slate-800 text-sm">{dealer?.companyName || 'Unknown Dealer'}</h3>
                    <div className="flex items-center space-x-3 mt-0.5">
                      {dealer?.phone && (
                        <a
                          href={`tel:${dealer.phone}`}
                          onClick={e => e.stopPropagation()}
                          className="text-[10px] text-rose-600 font-bold hover:underline flex items-center space-x-1"
                        >
                          <Phone className="w-2.5 h-2.5" />
                          <span>{dealer.phone}</span>
                        </a>
                      )}
                      {dealer?.user?.email && (
                        <a
                          href={`mailto:${dealer.user.email}`}
                          onClick={e => e.stopPropagation()}
                          className="text-[10px] text-slate-500 hover:underline flex items-center space-x-1"
                        >
                          <Mail className="w-2.5 h-2.5" />
                          <span>{dealer.user.email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 shrink-0">
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="bg-amber-50 text-amber-700 border border-amber-200 font-black px-2.5 py-1 rounded-full text-[10px] animate-pulse">
                      {dealerReqs.length} Request{dealerReqs.length > 1 ? 's' : ''}
                    </span>
                    <span className="bg-slate-50 text-slate-600 border border-slate-200 font-semibold px-2.5 py-1 rounded-full text-[10px]">
                      {totalItems} SKU · {totalQty} units
                    </span>
                  </div>
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-slate-400" />
                    : <ChevronRight className="w-4 h-4 text-slate-400" />
                  }
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-100 divide-y divide-slate-100">
                  {dealerReqs.map((req, reqIdx) => (
                    <div key={req.id} className="p-5 space-y-3 bg-slate-50/20 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">#{reqIdx + 1}</span>
                          <span className="font-mono text-[11px] bg-white border border-slate-200 text-slate-800 font-bold px-2.5 py-0.5 rounded-lg">
                            {req.requestNo}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {new Date(req.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            onClick={() => { setSelectedRequest(req); setShowDetailModal(true); }}
                            className="inline-flex items-center space-x-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Details</span>
                          </button>
                          <button
                            onClick={() => openDispatchDialog(req.id)}
                            className="inline-flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg font-bold text-[10px] shadow-sm cursor-pointer transition-all hover:scale-[1.02]"
                          >
                            <Truck className="w-3 h-3" />
                            <span>Dispatch</span>
                          </button>
                          <button
                            onClick={() => handleCancelRequest(req.id)}
                            className="inline-flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-600 px-2.5 py-1 rounded-lg border border-rose-100 font-bold text-[10px] cursor-pointer transition-colors"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {req.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-2 bg-white border border-slate-100 rounded-xl p-2.5 shadow-sm">
                            <div className="p-1.5 bg-rose-50 rounded-lg shrink-0">
                              <Package className="w-3 h-3 text-rose-500" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-800 text-[10px] truncate">{item.product?.name || 'Unknown Product'}</p>
                              <p className="text-[9px] text-rose-600 font-black">{item.quantity} {item.product?.unit || 'PCS'}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {req.notes && (
                        <p className="text-[10px] text-slate-500 italic pl-1">
                          <span className="font-bold text-slate-600">Remarks: </span>"{req.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ─── DEALER HISTORY VIEW ───────────────────────────────────────────────────
  const renderRequestList = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-16 bg-white border border-slate-150 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      );
    }
    if (requests.length === 0) {
      return (
        <div className="py-20 text-center text-xs text-slate-400 font-semibold italic bg-white border border-slate-150 rounded-2xl">
          No dealer orders or requests found.
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {requests.map(req => (
          <div key={req.id} className="p-6 bg-white border border-slate-150 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[11px] bg-slate-100 border border-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded-lg">
                  {req.requestNo}
                </span>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                  req.status === 'DISPATCHED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  req.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                  'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                }`}>
                  {req.status}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">
                {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
              <div className="space-y-3">
                <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">
                  {isAdmin ? 'Dealer Partner Contact' : 'My Information'}
                </span>
                {isAdmin ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600"><Building2 className="w-3.5 h-3.5" /></div>
                      <div>
                        <strong className="text-slate-800 text-xs">{req.dealer?.companyName}</strong>
                        {req.dealer?.user?.name && (
                          <span className="block text-[10px] text-slate-500 font-medium">Contact: {req.dealer.user.name}</span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pl-1 pt-1">
                      <a href={`tel:${req.dealer?.phone}`} className="inline-flex items-center space-x-1.5 text-rose-600 hover:text-rose-700 font-bold border border-rose-100 hover:bg-rose-50/50 px-2 py-1 rounded-lg transition-colors cursor-pointer">
                        <Phone className="w-3 h-3" /><span>{req.dealer?.phone || 'No Phone'}</span>
                      </a>
                      <a href={`mailto:${req.dealer?.user?.email}`} className="inline-flex items-center space-x-1.5 text-slate-600 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 px-2 py-1 rounded-lg transition-colors cursor-pointer truncate" title={req.dealer?.user?.email}>
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" /><span className="truncate">{req.dealer?.user?.email || 'No Email'}</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 bg-slate-50 border border-slate-100 p-3 rounded-xl text-slate-600 text-[11px]">
                    <p className="font-bold text-slate-700">Self Request Fulfillment</p>
                    <p className="text-slate-400 text-[10px]">Your stock requests are fulfilled directly by the manufacturer logistics team.</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Products Requested ({req.items?.length || 0})</span>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {req.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                      <div className="flex items-center space-x-2">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-700">{item.product?.name || 'Item'}</span>
                      </div>
                      <span className="font-black text-rose-600 bg-white border border-rose-100 px-2 py-0.5 rounded-lg text-[11px]">
                        {item.quantity} {item.product?.unit || 'PCS'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {req.notes && (
              <div className="text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-100 italic text-slate-600">
                <span className="font-bold text-slate-700 not-italic">Notes: </span>"{req.notes}"
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-medium">Request ID: {req.id}</span>
              <div className="space-x-2">
                <button
                  onClick={() => { setSelectedRequest(req); setShowDetailModal(true); }}
                  className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /><span>View Details</span>
                </button>
                {isAdmin && req.status === 'PENDING' && (
                  <button
                    onClick={() => openDispatchDialog(req.id)}
                    className="inline-flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md cursor-pointer transition-colors"
                  >
                    <Truck className="w-3.5 h-3.5" /><span>Dispatch</span>
                  </button>
                )}
                {req.status === 'PENDING' && (
                  <button
                    onClick={() => handleCancelRequest(req.id)}
                    className="inline-flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl border border-rose-100 font-bold cursor-pointer transition-colors text-xs"
                  >
                    <XCircle className="w-3.5 h-3.5" /><span>{isAdmin ? 'Reject' : 'Cancel'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ─── ADMIN FIELD SALES ORDERS SECTION ──────────────────────────────────────
  const renderFieldSalesOrdersSection = () => {
    const statusBadges = {
      PENDING: { label: '⏳ Pending Approval', bg: 'bg-amber-100/80 text-amber-900 border-amber-300 animate-pulse' },
      APPROVED: { label: '✅ Approved by Admin', bg: 'bg-blue-50 text-blue-800 border-blue-200' },
      DISPATCHED: { label: '🚚 Dispatched', bg: 'bg-purple-50 text-purple-800 border-purple-200' },
      DELIVERED: { label: '🎉 Delivered', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
      CANCELLED: { label: '❌ Rejected', bg: 'bg-rose-50 text-rose-800 border-rose-200' }
    };

    return (
      <div className="space-y-6 animate-fade-in">
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Store Orders</span>
              <ShoppingBag className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">{fieldStats.totalOrders}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Booked across all retail territories</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Booking Value</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-2">
              ₹{fieldStats.totalOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Total retail booking volume</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs ring-1 ring-amber-300">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Pending Approval</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-600 mt-2">{fieldStats.pendingOrdersCount}</div>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5">Awaiting admin review &amp; approval</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Approved &amp; Dispatched</span>
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-600 mt-2">
              {fieldStats.approvedOrdersCount + fieldStats.dispatchedOrdersCount}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Orders in fulfillment &amp; delivery</p>
          </div>
        </div>

        {/* Toolbar: Search and Status Filters */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Status Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {[
                { id: 'ALL', label: 'All Orders' },
                { id: 'PENDING', label: 'Pending', count: fieldStats.pendingOrdersCount },
                { id: 'APPROVED', label: 'Approved' },
                { id: 'DISPATCHED', label: 'Dispatched' },
                { id: 'DELIVERED', label: 'Delivered' },
                { id: 'CANCELLED', label: 'Rejected' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFieldStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    fieldStatusFilter === f.id
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{f.label}</span>
                  {f.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      fieldStatusFilter === f.id ? 'bg-white text-rose-600' : 'bg-rose-600 text-white animate-pulse'
                    }`}>
                      {f.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <form onSubmit={handleFieldSearchSubmit} className="flex items-center gap-2">
              <div className="relative flex-1 md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={fieldSearch}
                  onChange={e => setFieldSearch(e.target.value)}
                  placeholder="Search order #, store, sales rep..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* Orders Listing */}
        {fieldLoading ? (
          <div className="flex justify-center items-center py-20 bg-white border border-slate-200 rounded-2xl shadow-xs">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
              <span className="text-xs font-bold text-slate-500">Loading store order requests...</span>
            </div>
          </div>
        ) : fieldOrders.length === 0 ? (
          <div className="py-20 text-center bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
            <Store className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No store order requests found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Orders booked by sales officers during retail store visits will appear here with full line items, retailer margins, and instant approval triggers.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {fieldOrders.map(order => {
              const badge = statusBadges[order.status] || { label: order.status, bg: 'bg-slate-100 text-slate-700' };
              const totalUnits = (order.items || []).reduce((acc, it) => acc + (it.quantity || 0), 0);
              const isPending = order.status === 'PENDING';
              const isApproved = order.status === 'APPROVED';
              const isDispatched = order.status === 'DISPATCHED';

              return (
                <div
                  key={order._id || order.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
                >
                  {/* Order Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-black text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg">
                        #{order.orderNumber}
                      </span>
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setSelectedFieldOrder(order); setShowFieldDetailModal(true); }}
                        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>

                      {isPending && (
                        <>
                          <button
                            type="button"
                            disabled={updatingFieldOrderId === order._id}
                            onClick={() => handleUpdateFieldOrderStatus(order._id, 'APPROVED')}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            disabled={updatingFieldOrderId === order._id}
                            onClick={() => openFieldActionDialog(order, 'REJECT')}
                            className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-colors disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      )}

                      {isApproved && (
                        <>
                          <button
                            type="button"
                            onClick={() => openFieldActionDialog(order, 'DISPATCH')}
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer transition-all active:scale-95"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Dispatch</span>
                          </button>
                          <button
                            type="button"
                            disabled={updatingFieldOrderId === order._id}
                            onClick={() => handleUpdateFieldOrderStatus(order._id, 'DELIVERED')}
                            className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer transition-colors disabled:opacity-50"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Mark Delivered</span>
                          </button>
                        </>
                      )}

                      {isDispatched && (
                        <button
                          type="button"
                          disabled={updatingFieldOrderId === order._id}
                          onClick={() => handleUpdateFieldOrderStatus(order._id, 'DELIVERED')}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Mark Delivered</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3 Information Cards: Store, Sales Rep, Dealer */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Store Card */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1 text-xs">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <Store className="w-3 h-3 text-rose-500" />
                        <span>Retail Store</span>
                      </span>
                      <p className="font-bold text-slate-900 text-sm">{order.storeName || order.storeId?.name || 'Retail Outlet'}</p>
                      <p className="text-[11px] text-slate-500 flex items-start gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                        <span>{order.storeAddress || order.storeId?.address || 'Address on file'}</span>
                      </p>
                      {(order.storePhone || order.storeId?.phone) && (
                        <a href={`tel:${order.storePhone || order.storeId?.phone}`} className="text-[11px] text-rose-600 font-bold hover:underline inline-flex items-center gap-1 pt-0.5">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{order.storePhone || order.storeId?.phone}</span>
                        </a>
                      )}
                    </div>

                    {/* Salesperson Card */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1 text-xs">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <User className="w-3 h-3 text-blue-500" />
                        <span>Booked by Sales Officer</span>
                      </span>
                      <p className="font-bold text-slate-900 text-sm">{order.salespersonName || order.salespersonId?.name || 'Field Executive'}</p>
                      {(order.salespersonPhone || order.salespersonId?.phone) && (
                        <a href={`tel:${order.salespersonPhone || order.salespersonId?.phone}`} className="text-[11px] text-blue-600 font-bold hover:underline inline-flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{order.salespersonPhone || order.salespersonId?.phone}</span>
                        </a>
                      )}
                      {order.salespersonId?.email && (
                        <p className="text-[10px] text-slate-400 truncate">{order.salespersonId?.email}</p>
                      )}
                    </div>

                    {/* Dealer Distributor Card */}
                    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 space-y-1 text-xs">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-amber-500" />
                        <span>Assigned Distributor</span>
                      </span>
                      <p className="font-bold text-slate-900 text-sm">{order.dealerName || order.dealerId?.companyName || 'Mansara Central Logistics'}</p>
                      {order.dealerId?.phone && (
                        <p className="text-[11px] text-slate-600 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 text-slate-400" />
                          <span>{order.dealerId.phone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Line Items Preview */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Ordered Line Items ({(order.items || []).length} SKUs · {totalUnits} Units)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {(order.items || []).map((it, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-2">
                            <p className="font-bold text-slate-800 truncate text-[11px]">{it.productName}</p>
                            <p className="text-[10px] text-slate-400">
                              MRP: ₹{it.mrp || it.price} {it.marginPct > 0 ? `· ${it.marginPct}% margin` : ''}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono text-slate-700 text-[11px] block">{it.quantity} units</span>
                            <span className="font-mono font-black text-rose-600 text-xs">
                              ₹{(it.lineTotal || (it.quantity * (it.unitPrice || it.price))).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Order Financials & Remarks Banner */}
                  <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 text-xs">
                      {order.notes && (
                        <p className="text-slate-600">
                          <span className="font-bold text-slate-800">Requester Notes: </span>
                          <span className="italic">"{order.notes}"</span>
                        </p>
                      )}
                      {order.adminNotes && (
                        <p className="text-slate-800">
                          <span className="font-bold text-rose-700">Admin Remarks: </span>
                          <span className="italic">"{order.adminNotes}"</span>
                        </p>
                      )}
                      {order.dispatchDetails && (
                        <p className="text-purple-800">
                          <span className="font-bold">Dispatch Info: </span>
                          <span className="font-mono text-[11px]">{order.dispatchDetails}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-baseline gap-3 shrink-0 self-end sm:self-auto">
                      {order.totalMarginSavings > 0 && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-full">
                          Retailer Margin: ₹{order.totalMarginSavings.toFixed(2)}
                        </span>
                      )}
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-black text-slate-400 block">Total Order Value</span>
                        <span className="text-lg font-black text-rose-600 font-mono">
                          ₹{(order.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          {isAdmin ? 'Order Requests & Dispatch Center' : 'Warehouse Purchase Orders'}
        </h2>
        <p className="text-slate-500 text-xs">
          {isAdmin
            ? 'Unified order processing desk. Manage retail store orders booked by sales officers and bulk dealer stock purchase orders.'
            : 'Request warehouse stock dispatches and monitor B2B shipment approvals.'}
        </p>
      </div>

      {/* Primary Top Channel Switcher (For Admin) */}
      {isAdmin && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setRequestSource('FIELD_SALES')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                requestSource === 'FIELD_SALES'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>🏪 Retail Store Orders (Field Sales)</span>
              {fieldStats.pendingOrdersCount > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  requestSource === 'FIELD_SALES' ? 'bg-white text-rose-600' : 'bg-rose-100 text-rose-700 animate-pulse'
                }`}>
                  {fieldStats.pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setRequestSource('DEALER_PO')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                requestSource === 'DEALER_PO'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>🏢 Dealer Purchase Orders (PO)</span>
              {requests.filter(r => r.status === 'PENDING').length > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  requestSource === 'DEALER_PO' ? 'bg-white text-rose-600' : 'bg-amber-100 text-amber-700 animate-pulse'
                }`}>
                  {requests.filter(r => r.status === 'PENDING').length}
                </span>
              )}
            </button>
          </div>

          {requestSource === 'FIELD_SALES' && (
            <button
              type="button"
              onClick={fetchFieldOrders}
              disabled={fieldLoading}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer ml-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fieldLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Orders</span>
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
        }`}>
          <span>{message.text}</span>
          <button type="button" onClick={() => setMessage({ text: '', type: '' })} className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold ml-2">✕</button>
        </div>
      )}

      {/* ─── CASE 1: ADMIN FIELD SALES ORDERS CHANNEL ─── */}
      {isAdmin && requestSource === 'FIELD_SALES' && (
        renderFieldSalesOrdersSection()
      )}

      {/* ─── CASE 2: DEALER PO CHANNEL (OR NON-ADMIN DEALER PORTAL) ─── */}
      {(!isAdmin || requestSource === 'DEALER_PO') && (
        <div className="space-y-6">
          {/* Tabs Switcher for Dealer PO */}
          <div className="flex border-b border-slate-200">
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-3 px-6 border-b-2 font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    isActive ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* DEALER TAB 1: CREATE REQUEST */}
          {!isAdmin && activeTab === 'create' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-3">
                <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Logistics Flow &amp; Guidelines</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[12px] text-slate-600 leading-relaxed">
                  <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-1">
                    <span className="font-black text-rose-600 text-xs uppercase tracking-wider block">1. Compile PO List</span>
                    <p className="text-slate-500 text-[11px]">Choose items and quantities from the dropdown select bar, or upload your SKU list using the CSV button.</p>
                  </div>
                  <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-1">
                    <span className="font-black text-rose-600 text-xs uppercase tracking-wider block">2. Submit to Warehouse</span>
                    <p className="text-slate-500 text-[11px]">Once ready, review estimated values, add special delivery remarks, and submit to company administrators.</p>
                  </div>
                  <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-1">
                    <span className="font-black text-rose-600 text-xs uppercase tracking-wider block">3. Approval &amp; Dispatch</span>
                    <p className="text-slate-500 text-[11px]">Admin dispatches the order, generating a tax invoice. Shipped stock is credited to your portal on confirmation.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                  <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-rose-600" />
                    <span>Build Purchase Order (PO)</span>
                  </h3>
                  
                  <div className="flex items-center space-x-3">
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded-lg text-[10px] cursor-pointer transition-colors flex items-center space-x-1 border border-slate-200">
                      <Plus className="w-3.5 h-3.5 text-slate-500" />
                      <span>Import PO SKU list (CSV)</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const headers = "SKU,Quantity\nMF-URAD-CLA-250,50\nMF-URAD-PRE-250,100";
                        const blob = new Blob([headers], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', 'PO_Bulk_Template.csv');
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="text-[10px] text-rose-600 hover:text-rose-700 underline font-bold cursor-pointer"
                    >
                      Download CSV Template
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end bg-slate-50 p-4 border border-slate-150 rounded-xl">
                  <div className="sm:col-span-7 text-xs">
                    <label className="block text-slate-500 font-bold mb-1">Select Product SKU</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer font-bold text-slate-700 text-xs"
                    >
                      <option value="">Choose Product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku} | Price: ₹{p.price})</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3 text-xs">
                    <label className="block text-slate-500 font-bold mb-1">Required Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none font-bold text-center text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddToRequestCart}
                      disabled={!selectedProductId}
                      className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-sm shadow-rose-100"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add to list</span>
                    </button>
                  </div>
                </div>

                {requestItems.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Requested Items List</span>
                    <div className="border border-slate-150 rounded-xl overflow-hidden bg-white shadow-sm">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-[9px] font-black uppercase tracking-wider text-slate-400 p-3">
                            <th className="p-3">Product Name</th>
                            <th className="p-3">SKU Code</th>
                            <th className="p-3 text-center">Unit Price (MRP)</th>
                            <th className="p-3 text-center">Quantity</th>
                            <th className="p-3 text-right">Line Subtotal</th>
                            <th className="p-3 text-center">Remove</th>
                          </tr>
                        </thead>
                        <tbody>
                          {requestItems.map(item => {
                            const mrp = parseFloat(item.product.mrp || item.product.price || 0);
                            const lineVal = mrp * item.quantity;
                            return (
                              <tr key={item.productId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/20">
                                <td className="p-3 font-bold text-slate-800">{item.product.name}</td>
                                <td className="p-3 text-slate-500 font-mono text-[10px]">{item.product.sku}</td>
                                <td className="p-3 text-center text-slate-600">₹{mrp.toFixed(2)}</td>
                                <td className="p-3 text-center font-bold text-slate-700">{item.quantity} {item.product.unit || 'PCS'}</td>
                                <td className="p-3 text-right font-black text-rose-600">₹{lineVal.toFixed(2)}</td>
                                <td className="p-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFromRequestCart(item.productId)}
                                    className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 cursor-pointer"
                                    title="Remove Item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <form onSubmit={handleSubmitRequest} className="space-y-4">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1.5 text-xs">Requester Delivery Notes / Comments</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows="2"
                          placeholder="Add special warehouse delivery instructions or comments..."
                          className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none text-xs"
                        />
                      </div>

                      <div className="flex justify-between items-center bg-rose-50/50 p-4 border border-rose-100/50 rounded-xl">
                        <div>
                          <span className="text-[9px] font-black text-rose-600 uppercase tracking-wider block">Estimated PO Value</span>
                          <span className="text-[10px] text-slate-400 font-medium">Estimated cost before central margins &amp; GST taxes</span>
                        </div>
                        <span className="text-lg font-black text-rose-600">
                          ₹{requestItems.reduce((acc, it) => acc + (parseFloat(it.product.mrp || it.product.price || 0) * it.quantity), 0).toFixed(2)}
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-rose-100 flex items-center justify-center space-x-2 cursor-pointer text-xs uppercase tracking-wider"
                      >
                        {submitting ? 'Submitting PO...' : 'Submit Purchase Order (PO)'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ADMIN TAB: PENDING (Grouped by Dealer) */}
          {isAdmin && activeTab === 'pending' && (
            <div>
              {!loading && requests.filter(r => r.status === 'PENDING').length > 0 && (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 mb-4">
                  <div className="flex items-center space-x-2 text-amber-800">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-black">
                      {requests.filter(r => r.status === 'PENDING').length} pending request(s) from{' '}
                      {Object.keys(groupByDealer(requests.filter(r => r.status === 'PENDING'))).length} dealer(s)
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const grouped = groupByDealer(requests.filter(r => r.status === 'PENDING'));
                      const allCollapsed = Object.values(expandedDealers).every(v => v === false);
                      const next = {};
                      Object.keys(grouped).forEach(k => { next[k] = allCollapsed ? true : false; });
                      setExpandedDealers(next);
                    }}
                    className="text-[10px] font-black text-amber-700 hover:text-amber-900 underline cursor-pointer"
                  >
                    {Object.values(expandedDealers).every(v => v === false) ? 'Expand All' : 'Collapse All'}
                  </button>
                </div>
              )}
              {renderAdminPending()}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {isAdmin && (
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4 text-xs">
                    <h3 className="font-bold text-slate-800 uppercase tracking-wider">Status Filters</h3>
                    <div className="flex flex-col space-y-2">
                      {[
                        { id: '', label: 'All Requests' },
                        { id: 'PENDING', label: 'Pending' },
                        { id: 'DISPATCHED', label: 'Dispatched' },
                        { id: 'CANCELLED', label: 'Cancelled' }
                      ].map(filter => (
                        <button
                          key={filter.id}
                          onClick={() => setStatusFilter(filter.id)}
                          className={`text-left px-4 py-2.5 rounded-xl font-semibold transition-colors flex items-center justify-between cursor-pointer ${
                            statusFilter === filter.id
                              ? 'bg-rose-50 text-rose-700 border border-rose-100/50'
                              : 'bg-white hover:bg-slate-50 text-slate-600 border border-transparent'
                          }`}
                        >
                          <span>{filter.label}</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className={isAdmin ? 'lg:col-span-3 space-y-4' : 'lg:col-span-4 space-y-4'}>
                {renderRequestList()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── FIELD ORDER DETAIL MODAL ────────────────────────────────────────── */}
      {showFieldDetailModal && selectedFieldOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-3xl w-full rounded-2xl shadow-xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-rose-50/70">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-600 text-white rounded-xl shadow-xs">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-lg">
                      #{selectedFieldOrder.orderNumber}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-700">
                      {selectedFieldOrder.status}
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-sm mt-0.5">
                    {selectedFieldOrder.storeName || selectedFieldOrder.storeId?.name || 'Retail Outlet'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowFieldDetailModal(false); setSelectedFieldOrder(null); }}
                className="text-slate-400 hover:text-slate-700 font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* 3 Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Retail Store</span>
                  <p className="font-bold text-slate-800">{selectedFieldOrder.storeName || selectedFieldOrder.storeId?.name}</p>
                  <p className="text-[11px] text-slate-500">{selectedFieldOrder.storeAddress || selectedFieldOrder.storeId?.address}</p>
                  {(selectedFieldOrder.storePhone || selectedFieldOrder.storeId?.phone) && (
                    <p className="text-[11px] text-rose-600 font-bold">Ph: {selectedFieldOrder.storePhone || selectedFieldOrder.storeId?.phone}</p>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Sales Officer</span>
                  <p className="font-bold text-slate-800">{selectedFieldOrder.salespersonName || selectedFieldOrder.salespersonId?.name}</p>
                  {(selectedFieldOrder.salespersonPhone || selectedFieldOrder.salespersonId?.phone) && (
                    <p className="text-[11px] text-blue-600 font-bold">Ph: {selectedFieldOrder.salespersonPhone || selectedFieldOrder.salespersonId?.phone}</p>
                  )}
                  {selectedFieldOrder.salespersonId?.email && (
                    <p className="text-[10px] text-slate-400 truncate">{selectedFieldOrder.salespersonId.email}</p>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Assigned Distributor</span>
                  <p className="font-bold text-slate-800">{selectedFieldOrder.dealerName || selectedFieldOrder.dealerId?.companyName || 'Mansara Logistics'}</p>
                  {selectedFieldOrder.dealerId?.phone && (
                    <p className="text-[11px] text-slate-600">Ph: {selectedFieldOrder.dealerId.phone}</p>
                  )}
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                  Complete Itemized SKU Breakdown ({(selectedFieldOrder.items || []).length} Products)
                </span>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500">
                        <th className="p-3">#</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3 text-right">MRP</th>
                        <th className="p-3 text-center">Margin %</th>
                        <th className="p-3 text-right">Net Price</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {(selectedFieldOrder.items || []).map((it, idx) => {
                        const unitRate = it.unitPrice || it.price;
                        const sub = it.lineTotal || (it.quantity * unitRate);
                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-900">{it.productName}</td>
                            <td className="p-3 text-right text-slate-600">₹{(it.mrp || unitRate).toFixed(2)}</td>
                            <td className="p-3 text-center">
                              {it.marginPct > 0 ? (
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[10px]">
                                  {it.marginPct}%
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">0%</span>
                              )}
                            </td>
                            <td className="p-3 text-right font-mono font-semibold">₹{unitRate.toFixed(2)}</td>
                            <td className="p-3 text-center font-black text-slate-900">{it.quantity}</td>
                            <td className="p-3 text-right font-mono font-black text-rose-600">₹{sub.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Remarks & Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Notes &amp; Audit Trail</span>
                  {selectedFieldOrder.notes && (
                    <p className="text-slate-700">
                      <span className="font-bold text-slate-900">Requester: </span>
                      <span className="italic">"{selectedFieldOrder.notes}"</span>
                    </p>
                  )}
                  {selectedFieldOrder.adminNotes && (
                    <p className="text-rose-800">
                      <span className="font-bold">Admin Remarks: </span>
                      <span className="italic">"{selectedFieldOrder.adminNotes}"</span>
                    </p>
                  )}
                  {selectedFieldOrder.dispatchDetails && (
                    <p className="text-blue-800">
                      <span className="font-bold">Dispatch Info: </span>
                      <span className="font-mono text-[11px]">{selectedFieldOrder.dispatchDetails}</span>
                    </p>
                  )}
                  <div className="pt-2 text-[10px] text-slate-400 space-y-0.5 border-t border-slate-200">
                    <p>Booked: {new Date(selectedFieldOrder.createdAt).toLocaleString('en-IN')}</p>
                    {selectedFieldOrder.approvedAt && <p>Approved: {new Date(selectedFieldOrder.approvedAt).toLocaleString('en-IN')}</p>}
                    {selectedFieldOrder.dispatchedAt && <p>Dispatched: {new Date(selectedFieldOrder.dispatchedAt).toLocaleString('en-IN')}</p>}
                    {selectedFieldOrder.deliveredAt && <p>Delivered: {new Date(selectedFieldOrder.deliveredAt).toLocaleString('en-IN')}</p>}
                  </div>
                </div>

                <div className="bg-rose-50/50 border border-rose-200/80 rounded-xl p-4 space-y-2 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-slate-600 text-xs">
                      <span>Total Units:</span>
                      <span className="font-bold text-slate-900">
                        {(selectedFieldOrder.items || []).reduce((acc, it) => acc + (it.quantity || 0), 0)} units
                      </span>
                    </div>
                    {selectedFieldOrder.totalMarginSavings > 0 && (
                      <div className="flex justify-between text-emerald-700 text-xs font-bold">
                        <span>Retailer Margin Savings:</span>
                        <span>₹{selectedFieldOrder.totalMarginSavings.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-rose-200 pt-2 flex justify-between items-baseline">
                    <span className="text-xs font-black uppercase text-slate-700">Total Order Amount</span>
                    <span className="text-xl font-black text-rose-600 font-mono">
                      ₹{(selectedFieldOrder.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400">Order ID: {selectedFieldOrder._id}</span>
              <div className="flex items-center gap-2">
                {selectedFieldOrder.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      disabled={updatingFieldOrderId === selectedFieldOrder._id}
                      onClick={() => handleUpdateFieldOrderStatus(selectedFieldOrder._id, 'APPROVED')}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Order</span>
                    </button>
                    <button
                      type="button"
                      disabled={updatingFieldOrderId === selectedFieldOrder._id}
                      onClick={() => { setShowFieldDetailModal(false); openFieldActionDialog(selectedFieldOrder, 'REJECT'); }}
                      className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject Order</span>
                    </button>
                  </>
                )}

                {selectedFieldOrder.status === 'APPROVED' && (
                  <>
                    <button
                      type="button"
                      onClick={() => { setShowFieldDetailModal(false); openFieldActionDialog(selectedFieldOrder, 'DISPATCH'); }}
                      className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                    >
                      <Truck className="w-4 h-4" />
                      <span>Dispatch Shipment</span>
                    </button>
                    <button
                      type="button"
                      disabled={updatingFieldOrderId === selectedFieldOrder._id}
                      onClick={() => handleUpdateFieldOrderStatus(selectedFieldOrder._id, 'DELIVERED')}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                    >
                      <PackageCheck className="w-4 h-4" />
                      <span>Mark Delivered</span>
                    </button>
                  </>
                )}

                {selectedFieldOrder.status === 'DISPATCHED' && (
                  <button
                    type="button"
                    disabled={updatingFieldOrderId === selectedFieldOrder._id}
                    onClick={() => handleUpdateFieldOrderStatus(selectedFieldOrder._id, 'DELIVERED')}
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>Mark Delivered</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── FIELD ORDER ACTION DIALOG (DISPATCH OR REJECT) ──────────────────── */}
      {fieldActionModal.open && fieldActionModal.order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 flex flex-col">
            <div className={`p-5 border-b border-slate-100 flex justify-between items-center ${
              fieldActionModal.type === 'DISPATCH' ? 'bg-blue-50 text-blue-900' : 'bg-rose-50 text-rose-900'
            }`}>
              <div className="flex items-center gap-2">
                {fieldActionModal.type === 'DISPATCH' ? <Truck className="w-5 h-5 text-blue-600" /> : <XCircle className="w-5 h-5 text-rose-600" />}
                <h3 className="font-black text-sm uppercase tracking-wide">
                  {fieldActionModal.type === 'DISPATCH' ? 'Dispatch Order Shipment' : 'Reject Order Request'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFieldActionModal({ open: false, type: '', order: null, notes: '', dispatchDetails: '' })}
                className="text-slate-400 hover:text-slate-700 font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer text-xs"
              >
                ✕ Cancel
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newStatus = fieldActionModal.type === 'DISPATCH' ? 'DISPATCHED' : 'CANCELLED';
                handleUpdateFieldOrderStatus(
                  fieldActionModal.order._id,
                  newStatus,
                  fieldActionModal.notes,
                  fieldActionModal.dispatchDetails
                );
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Target Store &amp; Order</span>
                <p className="font-bold text-slate-900 text-sm">
                  #{fieldActionModal.order.orderNumber} · {fieldActionModal.order.storeName || fieldActionModal.order.storeId?.name}
                </p>
                <p className="text-[11px] text-slate-500">
                  Value: ₹{(fieldActionModal.order.totalAmount || 0).toFixed(2)} · Rep: {fieldActionModal.order.salespersonName}
                </p>
              </div>

              {fieldActionModal.type === 'DISPATCH' ? (
                <>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Carrier / Vehicle Details / Tracking # *
                    </label>
                    <input
                      type="text"
                      required
                      value={fieldActionModal.dispatchDetails}
                      onChange={e => setFieldActionModal({ ...fieldActionModal, dispatchDetails: e.target.value })}
                      placeholder="e.g. Delivery Van TN-32-AB-1234 / Driver Ramesh (9876543210)"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl focus:outline-none text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      Dispatch Notes for Salesperson &amp; Store (Optional)
                    </label>
                    <textarea
                      value={fieldActionModal.notes}
                      onChange={e => setFieldActionModal({ ...fieldActionModal, notes: e.target.value })}
                      rows="2"
                      placeholder="e.g. Shipped from Central Warehouse. Expected arrival today 4 PM."
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl focus:outline-none text-xs"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Reason for Cancellation / Rejection *
                  </label>
                  <textarea
                    required
                    value={fieldActionModal.notes}
                    onChange={e => setFieldActionModal({ ...fieldActionModal, notes: e.target.value })}
                    rows="3"
                    placeholder="e.g. Product SKU temporarily out of stock at distributor, or store credit limit exceeded. Contact manager."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    This note will be sent directly to the sales officer as a notification and shown on their store visit screen.
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFieldActionModal({ open: false, type: '', order: null, notes: '', dispatchDetails: '' })}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingFieldOrderId === fieldActionModal.order._id}
                  className={`flex-1 text-white font-bold py-2.5 rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-50 ${
                    fieldActionModal.type === 'DISPATCH' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {updatingFieldOrderId === fieldActionModal.order._id ? 'Processing...' : (
                    fieldActionModal.type === 'DISPATCH' ? 'Confirm Dispatch' : 'Confirm Rejection'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── DEALER PO DETAIL MODAL ──────────────────────────────────────────── */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div>
                <span className="text-[10px] font-black text-rose-600 block">STOCK REQ DETAILS</span>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">{selectedRequest.requestNo}</h3>
              </div>
              <button
                onClick={() => { setShowDetailModal(false); setSelectedRequest(null); }}
                className="text-slate-400 hover:text-slate-600 font-bold bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer text-xs"
              >
                ✕ Close
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {isAdmin && selectedRequest.dealer && (
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Dealer Partner Contact</span>
                  <div className="space-y-1 text-slate-600">
                    <p className="flex items-center space-x-2 font-bold text-slate-800"><Building2 className="w-3.5 h-3.5 text-rose-600 shrink-0" /><span>{selectedRequest.dealer.companyName}</span></p>
                    <p className="flex items-center space-x-2"><User className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span>{selectedRequest.dealer.user?.name || 'Unknown Contact'}</span></p>
                    <p className="flex items-center space-x-2"><Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span>{selectedRequest.dealer.phone}</span></p>
                    <p className="flex items-center space-x-2"><Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span>{selectedRequest.dealer.user?.email}</span></p>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Products List Breakdown</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase text-slate-400">
                        <th className="p-3">Product Name</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3 text-right">Requested Qty</th>
                        <th className="p-3 text-right">Base Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedRequest.items?.map((item, index) => {
                        const prod = item.product || {};
                        return (
                          <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                            <td className="p-3 font-bold text-slate-800">{prod.name || 'Unknown Product'}</td>
                            <td className="p-3 font-mono text-[10px] text-slate-400">{prod.sku || 'N/A'}</td>
                            <td className="p-3 text-right font-black text-slate-800">{item.quantity} {prod.unit || 'PCS'}</td>
                            <td className="p-3 text-right font-bold">₹{(prod.price || 0).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              {selectedRequest.notes && (
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-1.5">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Dealer Memo</span>
                  <p className="text-slate-700 italic">"{selectedRequest.notes}"</p>
                </div>
              )}
            </div>
            {selectedRequest.status === 'PENDING' && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
                {isAdmin ? (
                  <button
                    onClick={() => { setShowDetailModal(false); openDispatchDialog(selectedRequest.id); }}
                    className="inline-flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                  >
                    <Truck className="w-4 h-4" /><span>Approve &amp; Dispatch</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleCancelRequest(selectedRequest.id)}
                    className="inline-flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" /><span>Cancel Request</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── DEALER PO DISPATCH MODAL ────────────────────────────────────────── */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div className="flex items-center space-x-2 text-slate-800">
                <Truck className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Approve &amp; Dispatch Shipment</h3>
              </div>
              <button onClick={() => setShowDispatchModal(false)} className="text-slate-400 hover:text-slate-600 font-bold bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer text-xs">
                ✕ Cancel
              </button>
            </div>
            <form onSubmit={handleDispatchRequest} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 space-y-1.5">
                <p className="font-bold flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Before you confirm:</span>
                </p>
                <p className="leading-relaxed text-[11px]">
                  Confirming this dispatch will instantly adjust the company's warehouse stock and automatically generate a B2B tax invoice. Review and adjust margins below.
                </p>
              </div>
              <div className="space-y-2">
                <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Configure Invoice Margins</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase text-slate-400">
                        <th className="p-3">Product</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-center">Margin %</th>
                        <th className="p-3 text-right">Eff. Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {dispatchItems.length === 0 ? (
                        <tr><td colSpan="4" className="p-4 text-center text-slate-400 font-medium">Loading margins...</td></tr>
                      ) : (
                        dispatchItems.map((item, index) => {
                          const effPrice = item.mrp * (1 - (item.marginPct || 0) / 100);
                          return (
                            <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                              <td className="p-3">
                                <div className="font-bold text-slate-800">{item.productName || 'Unknown Product'}</div>
                                <div className="text-[9px] text-slate-400">SKU: {item.sku || 'N/A'} · MRP: ₹{item.mrp}</div>
                              </td>
                              <td className="p-3 text-right font-black text-slate-800">{item.quantity} {item.unit || 'PCS'}</td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="number" min="0" max="100" step="0.1"
                                    value={item.marginPct}
                                    onChange={e => handleDispatchMarginChange(item.productId, e.target.value)}
                                    className="w-14 p-1 text-center bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-rose-500 font-bold"
                                  />
                                  <span className="text-[10px] text-slate-400 font-bold">%</span>
                                </div>
                              </td>
                              <td className="p-3 text-right font-black text-rose-600">₹{effPrice.toFixed(2)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1.5">Logistics/Billing Notes (optional)</label>
                <textarea
                  value={dispatchNotes} onChange={(e) => setDispatchNotes(e.target.value)}
                  rows="3" placeholder="e.g. Dispatched via Gati Cargo, Invoice linked."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                />
              </div>
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => setShowDispatchModal(false)} className="flex-1 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-center cursor-pointer">
                  Go Back
                </button>
                <button
                  type="submit" disabled={dispatching || dispatchItems.length === 0}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-2.5 rounded-xl shadow-lg transition-all text-center flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  {dispatching ? 'Processing...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}