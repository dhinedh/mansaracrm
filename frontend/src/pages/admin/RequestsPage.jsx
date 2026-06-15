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
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function RequestsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(isAdmin ? 'PENDING' : '');
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Dealer Submit Form states
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState('10');
  const [requestItems, setRequestItems] = useState([]); // [{ productId, product, quantity }]
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Admin Dispatch Dialog states
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchRequestId, setDispatchRequestId] = useState(null);
  const [dispatching, setDispatching] = useState(false);

  useEffect(() => {
    fetchRequests();
    if (!isAdmin) {
      fetchProducts();
    }
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/requests', {
        params: { status: statusFilter }
      });
      setRequests(res.data.data || []);
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
      setRequestItems([...requestItems, {
        productId: selectedProductId,
        product: prod,
        quantity: parseInt(selectedQty)
      }]);
    }

    setSelectedProductId('');
    setSelectedQty('10');
  };

  const handleRemoveFromRequestCart = (prodId) => {
    setRequestItems(requestItems.filter(item => item.productId !== prodId));
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

  const openDispatchDialog = (id) => {
    setDispatchRequestId(id);
    setDispatchNotes('');
    setShowDispatchModal(true);
  };

  const handleDispatchRequest = async (e) => {
    e.preventDefault();
    setDispatching(true);
    try {
      const res = await axios.post(`/requests/${dispatchRequestId}/dispatch`, {
        notes: dispatchNotes
      });
      if (res.data.success) {
        setMessage({ text: 'Request successfully approved and dispatched! B2B Invoice generated.', type: 'success' });
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">
          {isAdmin ? 'Dealers Purchase & Stock Requests' : 'Warehouse Purchase Orders'}
        </h2>
        <p className="text-slate-500 text-xs">
          {isAdmin 
            ? 'Review dealer stock requests and dispatch logistics to generate invoices.' 
            : 'Request warehouse stock dispatches and monitor B2B shipment approvals.'}
        </p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Dealer Wizard Form OR Admin Filters */}
        <div className="lg:col-span-1 space-y-6">
          {!isAdmin ? (
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-rose-600" />
                <span>Create PO Request</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Select Product SKU</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none cursor-pointer"
                  >
                    <option value="">Choose Product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Required Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddToRequestCart}
                  disabled={!selectedProductId}
                  className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Cart List */}
              {requestItems.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                  <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Requested Items List</span>
                  <div className="border border-slate-250 rounded-xl overflow-hidden bg-white">
                    {requestItems.map(item => (
                      <div key={item.productId} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0">
                        <div>
                          <p className="font-bold text-slate-800">{item.product.name}</p>
                          <p className="text-[9px] font-black text-rose-600">Qty: {item.quantity} {item.product.unit}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromRequestCart(item.productId)}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSubmitRequest} className="space-y-3 pt-2">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Requester Notes / Comments</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows="2"
                        placeholder="Add special delivery remarks..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
                    >
                      {submitting ? 'Submitting...' : 'Submit Purchase Request'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider">Request Filters</h3>
              <div className="flex flex-col space-y-2">
                {['PENDING', 'DISPATCHED', 'CANCELLED', ''].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`text-left px-4 py-2.5 rounded-xl font-semibold transition-colors flex items-center justify-between ${
                      statusFilter === status 
                        ? 'bg-rose-50 text-rose-700 border border-rose-100/50' 
                        : 'bg-white hover:bg-slate-50 text-slate-600 border border-transparent'
                    }`}
                  >
                    <span>{status === '' ? 'All Requests' : status}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Guidelines Box */}
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-3">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Logistics Flow</h4>
            <div className="space-y-2 text-[11px] text-slate-500 leading-relaxed">
              <p>1. **Submit Request:** Dealer partner compiles items and submits request to the company warehouse.</p>
              <p>2. **Admin Review:** Admin checks stock levels and clicks "Dispatch Stock" to approve.</p>
              <p>3. **Auto Billing:** Approval automatically generates B2B invoice and linked stock transfer log immediately.</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Requests Log List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Stock Requests Tracker</span>
              <span className="text-[10px] text-slate-400 font-bold">{requests.length} Requests Found</span>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-rose-600"></div>
              </div>
            ) : requests.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 font-semibold italic">
                No stock requests found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {requests.map(req => {
                  const totalItemsQty = req.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
                  return (
                    <div key={req.id} className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-slate-50/30 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <strong className="text-slate-800 text-xs">{req.requestNo}</strong>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            req.status === 'DISPATCHED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            req.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        {isAdmin && (
                          <p className="text-[10px] text-slate-500 flex items-center space-x-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <strong className="text-slate-700">{req.dealer?.companyName}</strong>
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400">
                          Date: {new Date(req.createdAt).toLocaleDateString('en-IN')} · Items: <strong className="text-slate-600">{req.items?.length || 0} ({totalItemsQty} units)</strong>
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => { setSelectedRequest(req); setShowDetailModal(true); }}
                          className="inline-flex items-center space-x-1 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1.5 rounded-lg font-bold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>

                        {isAdmin && req.status === 'PENDING' && (
                          <button
                            onClick={() => openDispatchDialog(req.id)}
                            className="inline-flex items-center space-x-1 text-[10px] bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded-lg font-bold shadow-sm"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Dispatch Stock</span>
                          </button>
                        )}

                        {req.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancelRequest(req.id)}
                            className="inline-flex items-center space-x-1 text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 px-2.5 py-1.5 rounded-lg border border-rose-100 font-bold"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{isAdmin ? 'Reject' : 'Cancel'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
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
              {/* Requester Profile if Admin */}
              {isAdmin && selectedRequest.dealer && (
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Dealer Partner Contact</span>
                  <div className="space-y-1 text-slate-600">
                    <p className="flex items-center space-x-2 font-bold text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{selectedRequest.dealer.companyName}</span>
                    </p>
                    <p className="flex items-center space-x-2">
                      <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedRequest.dealer.user?.name || 'Unknown Contact'}</span>
                    </p>
                    <p className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedRequest.dealer.phone}</span>
                    </p>
                    <p className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedRequest.dealer.user?.email}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Items Table */}
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

              {/* Memo/Notes */}
              {selectedRequest.notes && (
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-1.5">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Dealer Memo</span>
                  <p className="text-slate-700 italic">"{selectedRequest.notes}"</p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            {selectedRequest.status === 'PENDING' && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
                {isAdmin ? (
                  <button
                    onClick={() => { setShowDetailModal(false); openDispatchDialog(selectedRequest.id); }}
                    className="inline-flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Approve & Dispatch</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleCancelRequest(selectedRequest.id)}
                    className="inline-flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel Request</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Dispatch Confirmation Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div className="flex items-center space-x-2 text-slate-800">
                <Truck className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Approve & Dispatch Shipment</h3>
              </div>
              <button 
                onClick={() => setShowDispatchModal(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer text-xs"
              >
                ✕ Cancel
              </button>
            </div>

            <form onSubmit={handleDispatchRequest} className="p-6 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 space-y-1.5">
                <p className="font-bold flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Before you confirm:</span>
                </p>
                <p className="leading-relaxed text-[11px]">
                  Confirming this dispatch will instantly adjust the company's warehouse stock and automatically generate a tax invoice using configured margins.
                </p>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1.5">Logistics/Billing Notes (optional)</label>
                <textarea
                  value={dispatchNotes}
                  onChange={(e) => setDispatchNotes(e.target.value)}
                  rows="3"
                  placeholder="e.g. Dispatched via VRL Logistics, Invoice linked."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="flex-1 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-center"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  disabled={dispatching}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold py-2.5 rounded-xl shadow-lg transition-all text-center flex items-center justify-center space-x-1.5"
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
