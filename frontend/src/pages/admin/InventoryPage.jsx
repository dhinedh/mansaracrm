// src/pages/admin/InventoryPage.jsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Truck,
  Plus,
  ClipboardList,
  Warehouse,
  User,
  ShoppingCart,
  X,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Edit3,
  CheckCircle2
} from 'lucide-react';

export default function InventoryPage({ defaultTab }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(defaultTab || 'stocks'); // 'stocks', 'transfer', 'history'
  const [highlightedId, setHighlightedId] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Stock states
  const [showEditStockModal, setShowEditStockModal] = useState(false);
  const [editStockItem, setEditStockItem] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [editMinQty, setEditMinQty] = useState('');

  // Transfer Wizard states
  const [selectedDealerId, setSelectedDealerId] = useState('');
  const [transferItems, setTransferItems] = useState([]); // [{ productId, product, quantity }]
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentQty, setCurrentQty] = useState('10');
  const [transferNotes, setTransferNotes] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchStocks();
    fetchDealers();
    fetchTransfers();
  }, []);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    } else if (defaultTab) {
      setActiveTab(defaultTab);
    }
    if (location.state?.transferId) {
      setHighlightedId(location.state.transferId);
      setTimeout(() => {
        const element = document.getElementById(`transfer-${location.state.transferId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [location.state, defaultTab]);

  const [dealerMargins, setDealerMargins] = useState([]);

  useEffect(() => {
    if (selectedDealerId) {
      fetchDealerMargins(selectedDealerId);
    } else {
      setDealerMargins([]);
    }
  }, [selectedDealerId]);

  const fetchDealerMargins = async (dealerId) => {
    try {
      const res = await axios.get('/margins', { params: { dealerId } });
      setDealerMargins(res.data.data || []);
    } catch (err) {
      console.error('Failed to load dealer margins', err);
    }
  };

  const fetchStocks = async () => {
    try {
      const res = await axios.get('/inventory/company');
      setStocks(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDealers = async () => {
    try {
      const res = await axios.get('/dealers', { params: { status: 'APPROVED' } });
      setDealers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransfers = async () => {
    try {
      const res = await axios.get('/inventory/transfers');
      setTransfers(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToTransferCart = () => {
    if (!currentProductId || parseInt(currentQty) <= 0) return;

    const productRecord = stocks.find(s => s.productId === currentProductId)?.product;
    const availableQty = stocks.find(s => s.productId === currentProductId)?.quantity || 0;

    if (!productRecord) return;

    if (parseInt(currentQty) > availableQty) {
      alert(`Cannot transfer more than available stock (${availableQty} ${productRecord.unit})`);
      return;
    }

    // Auto-detect margin percentage based on dealer configuration
    let detectedMargin = 0;
    const prodMargin = dealerMargins.find(m => m.productId === currentProductId);
    const catId = productRecord.categoryId || productRecord.category?._id || productRecord.category;
    const catMargin = dealerMargins.find(m => m.categoryId === String(catId));
    const defaultMargin = dealerMargins.find(m => m.isDefault);

    if (prodMargin) {
      detectedMargin = prodMargin.marginPercent;
    } else if (catMargin) {
      detectedMargin = catMargin.marginPercent;
    } else if (defaultMargin) {
      detectedMargin = defaultMargin.marginPercent;
    }

    const existingIndex = transferItems.findIndex(i => i.productId === currentProductId);
    if (existingIndex > -1) {
      const newItems = [...transferItems];
      const potentialNewQty = newItems[existingIndex].quantity + parseInt(currentQty);
      if (potentialNewQty > availableQty) {
        alert(`Total transfer quantity exceeds available stock (${availableQty})`);
        return;
      }
      newItems[existingIndex].quantity = potentialNewQty;
      // Update margin if it wasn't customized yet
      if (!newItems[existingIndex].isMarginCustomized) {
        newItems[existingIndex].marginPct = detectedMargin;
      }
      setTransferItems(newItems);
    } else {
      setTransferItems([...transferItems, {
        productId: currentProductId,
        product: productRecord,
        quantity: parseInt(currentQty),
        marginPct: detectedMargin,
        isMarginCustomized: false
      }]);
    }

    setCurrentProductId('');
    setCurrentQty('10');
  };

  const handleRemoveFromTransferCart = (prodId) => {
    setTransferItems(transferItems.filter(item => item.productId !== prodId));
  };

  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    if (!selectedDealerId || transferItems.length === 0) return;

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await axios.post('/inventory/transfers', {
        dealerId: selectedDealerId,
        items: transferItems.map(i => ({ productId: i.productId, quantity: i.quantity, marginPct: i.marginPct || 0 })),
        notes: transferNotes
      });

      setMessage({ text: 'Stock transfer order created successfully! (Pending approval)', type: 'success' });
      setTransferItems([]);
      setSelectedDealerId('');
      setTransferNotes('');
      fetchTransfers();
      fetchStocks();
      setActiveTab('history');
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Stock transfer failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (transferId, status) => {
    try {
      await axios.patch(`/inventory/transfers/${transferId}/status`, { status });
      fetchTransfers();
      fetchStocks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update transfer status');
    }
  };

  const openEditStockModal = (item) => {
    setEditStockItem(item);
    setEditQty(String(item.quantity));
    setEditMinQty(String(item.minQuantity));
    setShowEditStockModal(true);
  };

  const handleEditStockSubmit = async (e) => {
    e.preventDefault();
    if (!editStockItem) return;

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      await axios.put('/inventory/company/update', {
        productId: editStockItem.productId,
        quantity: parseInt(editQty),
        minQuantity: parseInt(editMinQty)
      });

      setMessage({ text: `Stock for ${editStockItem.product.name} updated successfully!`, type: 'success' });
      setShowEditStockModal(false);
      setEditStockItem(null);
      fetchStocks();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update stock', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Stock Logistics</h2>
        <p className="text-slate-500 text-xs">Verify warehouse stocks, initialize dealer dispatches, and track logs.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('stocks')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${activeTab === 'stocks'
            ? 'border-rose-600 text-rose-700 font-extrabold'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>Warehouse Stocks</span>
        </button>
        <button
          onClick={() => setActiveTab('transfer')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${activeTab === 'transfer'
            ? 'border-rose-600 text-rose-700 font-extrabold'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Dispatch Stock</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-3 text-xs font-bold transition-all border-b-2 flex items-center space-x-2 ${activeTab === 'history'
            ? 'border-rose-600 text-rose-700 font-extrabold'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Transfer Log Tracker</span>
        </button>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
          {message.text}
        </div>
      )}

      {/* Stocks Tab */}
      {activeTab === 'stocks' && (
        <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[700px] sm:min-w-0">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">SKU / Product</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-center">Available Stock</th>
                  <th className="p-4 text-center">Min Threshold Alert</th>
                  <th className="p-4 text-right">Price</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="p-4">
                      <div>
                        <span className="font-black text-rose-600 block text-[10px]">SKU: {item.product.sku}</span>
                        <span className="font-bold text-slate-800 text-xs">{item.product.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 font-medium">{item.product.category?.name}</td>
                    <td className="p-4 text-center">
                      <span className={`font-black px-2.5 py-1 rounded-full text-[10px] ${item.quantity <= item.minQuantity ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                        {item.quantity} {item.product.unit}
                      </span>
                    </td>
                    <td className="p-4 text-center text-slate-400 font-bold">{item.minQuantity} {item.product.unit}</td>
                    <td className="p-4 text-right font-bold text-slate-800">₹{parseFloat(item.product.price).toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => openEditStockModal(item)}
                        className="inline-flex items-center space-x-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl text-[10px] font-bold"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dispatch Tab */}
      {activeTab === 'transfer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Builder Form */}
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-6">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Dispatch Stock Wizard</h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1.5">Select Approved Dealer *</label>
                <select
                  value={selectedDealerId}
                  onChange={(e) => setSelectedDealerId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer font-bold text-slate-700"
                >
                  <option value="">Choose Dealer...</option>
                  {dealers.map(d => {
                    const keyVal = typeof d.id === 'object' ? d.id?.id || d.id?.toString() : d.id;
                    return (
                      <option key={keyVal} value={keyVal}>{d.companyName} ({d.user?.name})</option>
                    );
                  })}
                </select>
              </div>

              {/* Add item to list builder */}
              <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl space-y-4">
                <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Add Products to Dispatch List</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-500 font-bold mb-1">Select Product SKU</label>
                    <select
                      value={currentProductId}
                      onChange={(e) => setCurrentProductId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer"
                    >
                      <option value="">Choose Product...</option>
                      {stocks.map(item => {
                        const keyVal = typeof item.productId === 'object' ? item.productId?.id || item.productId?.toString() : item.productId;
                        return (
                          <option key={keyVal} value={keyVal}>
                            {item.product.name} (Avail: {item.quantity} {item.product.unit})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Quantity</label>
                    <input
                      type="number"
                      value={currentQty}
                      onChange={(e) => setCurrentQty(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddToTransferCart}
                  className="inline-flex items-center space-x-2 bg-slate-800 text-white font-bold text-[10px] px-3.5 py-2 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Cart Items list */}
              {transferItems.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Dispatch List Details</span>
                  <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                    {transferItems.map((item) => {
                      const keyVal = typeof item.productId === 'object' ? item.productId?.id || item.productId?.toString() : item.productId;
                      return (
                        <div key={keyVal} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border-b border-slate-100 last:border-0 gap-3">
                          <div>
                            <p className="font-bold text-slate-800">{item.product.name}</p>
                            <p className="text-[9px] font-black text-rose-600">SKU: {item.product.sku} | Base: ₹{item.product.price}</p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <div className="flex items-center space-x-1">
                              <span className="text-[10px] text-slate-400 font-bold">Margin:</span>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.marginPct !== undefined ? item.marginPct : 0}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const newItems = [...transferItems];
                                  const idx = newItems.findIndex(i => i.productId === item.productId);
                                  if (idx > -1) {
                                    newItems[idx].marginPct = Math.min(100, Math.max(0, val));
                                    newItems[idx].isMarginCustomized = true;
                                    setTransferItems(newItems);
                                  }
                                }}
                                className="w-14 p-1 text-center bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-rose-500 font-bold text-slate-700"
                              />
                              <span className="text-[10px] text-slate-400 font-bold">%</span>
                            </div>
                            <div className="text-right">
                              <p className="font-black text-slate-700 text-xs">{item.quantity} {item.product.unit}</p>
                              <p className="text-[10px] text-rose-600 font-bold">
                                Eff: ₹{(item.product.price * (1 - (item.marginPct || 0)/100)).toFixed(2)}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromTransferCart(item.productId)}
                              className="text-rose-600 hover:text-rose-800 p-1 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-500 font-bold mb-1">Dispatch Memo / Comments</label>
                <textarea
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  rows="2"
                  placeholder="e.g. Transferred via Gati Cargo"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                ></textarea>
              </div>

              <button
                onClick={handleInitiateTransfer}
                disabled={!selectedDealerId || transferItems.length === 0}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-xs flex items-center justify-center space-x-2 disabled:bg-slate-200 disabled:shadow-none"
              >
                <Truck className="w-4 h-4" />
                <span>Confirm Stock Dispatch</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm h-fit space-y-4">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Logistics Guidelines</h4>
            <div className="space-y-3 text-[11px] text-slate-500 leading-relaxed">
              <p>1. **Initiate Transfer:** Admin creates transfer request. Status starts as **PENDING**.</p>
              <p>2. **Shipment:** When items are dispatched physically, mark status as **IN_TRANSIT**.</p>
              <p>3. **Dealer Receipt:** When dealer receives the items and confirms receipt, status updates to **DELIVERED**. Company stock decrements and Dealer stock increments in one database transaction.</p>
            </div>
          </div>
        </div>
      )}

      {/* History Log Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {transfers.map((item) => (
            <div 
              key={item.id} 
              id={`transfer-${item.id}`}
              className={`p-6 rounded-2xl shadow-sm space-y-4 transition-all duration-300 border ${
                item.id === highlightedId
                  ? 'border-rose-500 bg-rose-50/10 shadow-md ring-2 ring-rose-500/20'
                  : 'bg-white border-slate-150'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-black text-slate-800 text-xs">{item.transferNo}</span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      item.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      item.status === 'IN_TRANSIT' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                      item.status === 'DISCREPANCY' ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse' :
                      item.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">To Dealer: <strong className="text-slate-600">{item.dealer?.companyName} ({item.dealer?.phone})</strong></p>
                </div>

                <div className="flex space-x-2">
                  {item.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(item.id, 'IN_TRANSIT')}
                        className="inline-flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Ship Stock</span>
                      </button>
                      <button
                        onClick={() => handleStatusChange(item.id, 'CANCELLED')}
                        className="inline-flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-rose-100"
                      >
                        <span>Cancel</span>
                      </button>
                    </>
                  )}
                  {item.status === 'IN_TRANSIT' && (
                    <button
                      onClick={() => handleStatusChange(item.id, 'DELIVERED')}
                      className="inline-flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Delivered</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Items in transfer */}
              <div className="space-y-2">
                <span className="block text-[9px] font-black uppercase text-slate-400">Products Dispatched</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {item.items?.map((it) => (
                    <div key={it.id} className={`border p-3 rounded-xl flex flex-col justify-between text-xs transition-colors ${
                      it.hasDiscrepancy ? 'bg-amber-50/50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <p className="font-bold text-slate-700">{it.product?.name}</p>
                          <p className="text-[9px] font-black text-rose-600">SKU: {it.product?.sku}</p>
                        </div>
                        <span className="font-black text-slate-800">{it.quantity} {it.product?.unit}</span>
                      </div>
                      {it.hasDiscrepancy && (
                        <div className="mt-2 pt-2 border-t border-dashed border-amber-200 text-amber-800 text-[10px] space-y-0.5">
                          <p className="font-bold">⚠️ Discrepancy Reported:</p>
                          <p>Received: <strong>{it.receivedQuantity} {it.product?.unit}</strong> (Shortage: {it.quantity - it.receivedQuantity} {it.product?.unit})</p>
                          {it.discrepancyComment && <p className="italic">Comment: "{it.discrepancyComment}"</p>}
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
          ))}
        </div>
      )}
      {/* Edit Stock Modal */}
      {showEditStockModal && editStockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">SKU: {editStockItem.product.sku}</span>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Adjust Stock Logistics</h3>
              </div>
              <button 
                onClick={() => { setShowEditStockModal(false); setEditStockItem(null); }} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditStockSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-black uppercase text-[10px] mb-1">Product Name</label>
                <p className="font-bold text-slate-800 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-xs">{editStockItem.product.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Available Stock ({editStockItem.product.unit}) *</label>
                  <input 
                    type="number" 
                    required 
                    value={editQty} 
                    onChange={e => setEditQty(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Min Threshold Alert ({editStockItem.product.unit}) *</label>
                  <input 
                    type="number" 
                    required 
                    value={editMinQty} 
                    onChange={e => setEditMinQty(e.target.value)} 
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" 
                  />
                </div>
              </div>

              <div className="pt-4 flex space-x-3">
                <button 
                  type="button" 
                  onClick={() => { setShowEditStockModal(false); setEditStockItem(null); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-center"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-rose-100 transition-all text-center"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
