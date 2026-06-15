// src/pages/admin/ReturnsPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  RotateCcw, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  Store, 
  Package, 
  Eye,
  AlertTriangle,
  ArrowRight,
  User,
  Phone
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function ReturnsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Return Wizard states
  const [returnType, setReturnType] = useState('DEALER_TO_WAREHOUSE'); // 'DEALER_TO_WAREHOUSE' | 'STORE_TO_DEALER'
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQty, setSelectedQty] = useState('1');
  const [returnItems, setReturnItems] = useState([]); // [{ productId, product, quantity }]
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal states
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Admin decision states
  const [decisionNotes, setDecisionNotes] = useState('');
  const [processingDecision, setProcessingDecision] = useState(false);

  useEffect(() => {
    fetchReturns();
    if (!isAdmin) {
      fetchProducts();
      fetchStores();
    }
  }, [statusFilter, returnType]);

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const params = { status: statusFilter };
      if (!isAdmin) {
        // For dealers, we let them filter by return type to keep dashboard clean
        params.type = returnType;
      }
      const res = await axios.get('/returns', { params });
      setReturns(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch returns log', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/products');
      setProducts(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStores = async () => {
    try {
      const res = await axios.get('/stores');
      setStores(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToReturnCart = () => {
    if (!selectedProductId || parseInt(selectedQty) <= 0) return;
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const existingIndex = returnItems.findIndex(item => item.productId === selectedProductId);
    if (existingIndex > -1) {
      const updated = [...returnItems];
      updated[existingIndex].quantity += parseInt(selectedQty);
      setReturnItems(updated);
    } else {
      setReturnItems([...returnItems, {
        productId: selectedProductId,
        product: prod,
        quantity: parseInt(selectedQty)
      }]);
    }

    setSelectedProductId('');
    setSelectedQty('1');
  };

  const handleRemoveFromReturnCart = (prodId) => {
    setReturnItems(returnItems.filter(item => item.productId !== prodId));
  };

  const handleInitiateReturn = async (e) => {
    e.preventDefault();
    if (returnItems.length === 0) return;
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      await axios.post('/returns', {
        type: returnType,
        storeId: returnType === 'STORE_TO_DEALER' ? selectedStoreId : undefined,
        items: returnItems.map(i => ({ 
          productId: i.productId, 
          quantity: i.quantity,
          reason: notes || 'Defective/Return'
        })),
        notes
      });
      setMessage({ 
        text: returnType === 'DEALER_TO_WAREHOUSE' 
          ? 'Return request submitted successfully. Awaiting Admin approval.' 
          : 'Store return logged successfully. Approve below to update your stock.', 
        type: 'success' 
      });
      setReturnItems([]);
      setSelectedStoreId('');
      setNotes('');
      fetchReturns();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to submit return request', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessReturn = async (id, status) => {
    const actionText = status === 'APPROVED' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${actionText} this return?`)) return;
    
    setProcessingDecision(true);
    try {
      await axios.patch(`/returns/${id}/status`, {
        status,
        notes: decisionNotes
      });
      setMessage({ text: `Return request ${status.toLowerCase()} successfully.`, type: 'success' });
      setShowDetailModal(false);
      setSelectedReturn(null);
      setDecisionNotes('');
      fetchReturns();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process return');
    } finally {
      setProcessingDecision(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Returns & Defective Stock Logs</h2>
        <p className="text-slate-500 text-xs">
          {isAdmin 
            ? 'Review returned stocks from dealers and record additions to warehouse inventory.'
            : 'Initiate returns to warehouse, record store-to-dealer returns, and verify inventory additions.'}
        </p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT PANEL: Dealer creation Wizard OR Admin filter triggers */}
        <div className="lg:col-span-1 space-y-6">
          {!isAdmin ? (
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-5">
              <div className="flex border-b border-slate-100 pb-2">
                <button
                  onClick={() => { setReturnType('DEALER_TO_WAREHOUSE'); setReturnItems([]); }}
                  className={`flex-1 pb-2 text-center text-xs font-bold transition-all border-b-2 ${
                    returnType === 'DEALER_TO_WAREHOUSE' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-400'
                  }`}
                >
                  Return to Warehouse
                </button>
                <button
                  onClick={() => { setReturnType('STORE_TO_DEALER'); setReturnItems([]); }}
                  className={`flex-1 pb-2 text-center text-xs font-bold transition-all border-b-2 ${
                    returnType === 'STORE_TO_DEALER' ? 'border-rose-600 text-rose-600' : 'border-transparent text-slate-400'
                  }`}
                >
                  Store Return to Me
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {returnType === 'STORE_TO_DEALER' && (
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Select Source Outlet Store *</label>
                    <select
                      value={selectedStoreId}
                      onChange={(e) => setSelectedStoreId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer"
                    >
                      <option value="">Choose Store...</option>
                      {stores.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 font-bold mb-1">Select Product</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer"
                    >
                      <option value="">Choose Product...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddToReturnCart}
                  disabled={!selectedProductId}
                  className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Cart View */}
              {returnItems.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100 text-xs">
                  <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Returned items list</span>
                  <div className="border border-slate-250 rounded-xl overflow-hidden bg-white">
                    {returnItems.map(item => (
                      <div key={item.productId} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0">
                        <div>
                          <p className="font-bold text-slate-800">{item.product.name}</p>
                          <p className="text-[9px] font-black text-rose-600">Qty: {item.quantity} {item.product.unit}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromReturnCart(item.productId)}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded-lg hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleInitiateReturn} className="space-y-3 pt-2">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">Reason for Return / Defect description</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows="2"
                        placeholder="e.g. Expired batch or transit packaging damage..."
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                      ></textarea>
                    </div>
                    <button
                      type="submit"
                      disabled={submitting || (returnType === 'STORE_TO_DEALER' && !selectedStoreId)}
                      className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold py-2.5 rounded-xl transition-all shadow-md"
                    >
                      {submitting ? 'Recording...' : returnType === 'DEALER_TO_WAREHOUSE' ? 'Submit Return to Company' : 'Record Store Return'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider">Return Status Filters</h3>
              <div className="flex flex-col space-y-2">
                {['PENDING', 'APPROVED', 'REJECTED'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`text-left px-4 py-2.5 rounded-xl font-semibold transition-colors flex items-center justify-between ${
                      statusFilter === status 
                        ? 'bg-rose-50 text-rose-700 border border-rose-100/50' 
                        : 'bg-white hover:bg-slate-50 text-slate-600 border border-transparent'
                    }`}
                  >
                    <span>{status} Returns</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Dealer Filters */}
          {!isAdmin && (
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider">Status Filters</h3>
              <div className="flex flex-wrap gap-2">
                {['PENDING', 'APPROVED', 'REJECTED'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                      statusFilter === status 
                        ? 'bg-rose-600 text-white border-rose-600' 
                        : 'bg-white text-slate-600 border-slate-250 hover:bg-slate-50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Returns List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Returns Inventory Log</span>
              <span className="text-[10px] text-slate-400 font-bold">{returns.length} logs found</span>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-rose-600"></div>
              </div>
            ) : returns.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 font-semibold italic">
                No returns logged under this filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {returns.map(ret => {
                  const itemsCount = ret.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
                  return (
                    <div key={ret.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-slate-50/20 transition-colors">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <strong className="text-slate-800 text-xs">{ret.returnNo}</strong>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                            ret.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            ret.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                            'bg-amber-50 text-amber-800 border border-amber-250 animate-pulse'
                          }`}>
                            {ret.status}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-600 uppercase flex items-center space-x-1">
                          <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{ret.type.replace(/_/g, ' ')}</span>
                        </p>
                        {isAdmin && (
                          <p className="text-[10px] text-slate-500 flex items-center space-x-1">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <strong>{ret.dealer?.companyName}</strong>
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400">
                          Date: {new Date(ret.createdAt).toLocaleDateString('en-IN')} · Items: <strong className="text-slate-600">{ret.items?.length || 0} ({itemsCount} units)</strong>
                        </p>

                        {/* Detailed list of returned products & reasons directly inside the list card */}
                        <div className="mt-3 bg-slate-50 border border-slate-150 p-3.5 rounded-xl max-w-xl space-y-2">
                          <div className="space-y-1.5">
                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-1.5">Returned Products Log</span>
                            {ret.items?.map((it, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[10px] text-slate-650">
                                <span className="font-semibold text-slate-700">{it.product?.name || 'Product'} (SKU: {it.product?.sku || 'N/A'})</span>
                                <span className="font-black text-rose-600 bg-white border border-slate-150 px-2 py-0.5 rounded text-[9px]">{it.quantity} {it.product?.unit || 'PCS'}</span>
                              </div>
                            ))}
                          </div>
                          {ret.notes && (
                            <div className="text-[10px] text-slate-500 italic border-t border-slate-150 pt-1.5 mt-1.5 flex items-start gap-1">
                              <span className="font-bold text-slate-600 not-italic">Remarks:</span>
                              <span className="leading-relaxed">"{ret.notes}"</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center shrink-0">
                        <button
                          onClick={() => { setSelectedReturn(ret); setDecisionNotes(ret.notes || ''); setShowDetailModal(true); }}
                          className="inline-flex items-center space-x-1 text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-3.5 py-2.5 rounded-xl font-bold cursor-pointer transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Log Details</span>
                        </button>
                      </div>
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
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div>
                <span className="text-[10px] font-black text-rose-600 block">RETURN LOG DETAILS</span>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">{selectedReturn.returnNo}</h3>
              </div>
              <button 
                onClick={() => { setShowDetailModal(false); setSelectedReturn(null); setDecisionNotes(''); }} 
                className="text-slate-400 hover:text-slate-600 font-bold bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer text-xs"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-1.5">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Logistics Type</span>
                  <p className="font-black text-slate-700 uppercase tracking-wide text-[10px]">{selectedReturn.type.replace(/_/g, ' ')}</p>
                </div>
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-1.5">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Current Status</span>
                  <span className="inline-block text-[9px] font-black bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-700 uppercase tracking-wide">
                    {selectedReturn.status}
                  </span>
                </div>
              </div>

              {/* Contact Profile */}
              {selectedReturn.dealer && (
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Requester Dealer Profile</span>
                  <div className="space-y-1.5 text-slate-600">
                    <p className="flex items-center space-x-2 font-bold text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span>{selectedReturn.dealer.companyName}</span>
                    </p>
                    <p className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedReturn.dealer.phone}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div className="space-y-2">
                <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Returned Products List</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase text-slate-400">
                        <th className="p-3">Product Name</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3 text-right">Return Qty</th>
                        <th className="p-3 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {selectedReturn.items?.map((item, index) => {
                        const prod = item.product || {};
                        return (
                          <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                            <td className="p-3 font-bold text-slate-800">{prod.name || 'Unknown Product'}</td>
                            <td className="p-3 font-mono text-[10px] text-slate-400">{prod.sku || 'N/A'}</td>
                            <td className="p-3 text-right font-black text-rose-600">{item.quantity} {prod.unit || 'PCS'}</td>
                            <td className="p-3 text-right font-bold">₹{(prod.price || 0).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reason / Comments */}
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-1.5">
                <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Reason/Remarks for return</span>
                <p className="text-slate-700 italic">"{selectedReturn.notes || 'No comments added.'}"</p>
              </div>
            </div>

            {/* Decision panel for approvals */}
            {selectedReturn.status === 'PENDING' && (
              <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4 text-xs">
                {/* Check authorization: admin approves DEALER_TO_WAREHOUSE, dealer approves STORE_TO_DEALER */}
                {((isAdmin && selectedReturn.type === 'DEALER_TO_WAREHOUSE') || 
                  (!isAdmin && selectedReturn.type === 'STORE_TO_DEALER')) ? (
                  <>
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 space-y-1 text-[11px] leading-relaxed">
                      <p className="font-bold flex items-center space-x-1.5 text-xs text-amber-900">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Inventory Transaction Warning</span>
                      </p>
                      <p>
                        Approving this return will automatically adjust corresponding warehouse and dealer stocks. This operation is recorded in the system audit logs.
                      </p>
                    </div>

                    <div>
                      <label className="block text-slate-500 font-bold mb-1.5">Decision Remarks / Notes</label>
                      <input 
                        type="text" 
                        value={decisionNotes}
                        onChange={(e) => setDecisionNotes(e.target.value)}
                        placeholder="e.g. Approved and added back to stocks, damaged items discarded."
                        className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none"
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        type="button"
                        disabled={processingDecision}
                        onClick={() => handleProcessReturn(selectedReturn.id, 'APPROVED')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Adjust Stock</span>
                      </button>
                      <button
                        type="button"
                        disabled={processingDecision}
                        onClick={() => handleProcessReturn(selectedReturn.id, 'REJECTED')}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject Request</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-slate-400 italic text-center">
                    Awaiting decision approval from {selectedReturn.type === 'DEALER_TO_WAREHOUSE' ? 'Mansara Foods Admin' : 'Dealer Partner'}.
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
