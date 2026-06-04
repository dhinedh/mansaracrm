// src/pages/dealer/WarehouseTransfersPage.jsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Truck, 
  CheckCircle2, 
  AlertTriangle,
  X 
} from 'lucide-react';

export default function WarehouseTransfersPage() {
  const location = useLocation();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [highlightedId, setHighlightedId] = useState(null);

  // Verification Checklist modal states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyTransfer, setVerifyTransfer] = useState(null);
  const [verifyItems, setVerifyItems] = useState([]);
  const [verifyLoading, setVerifyLoading] = useState(false);

  useEffect(() => {
    fetchTransfers();
  }, []);

  useEffect(() => {
    if (location.state?.transferId) {
      setHighlightedId(location.state.transferId);
      setTimeout(() => {
        const element = document.getElementById(`transfer-${location.state.transferId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, [location.state]);

  const fetchTransfers = async () => {
    try {
      const res = await axios.get('/inventory/transfers');
      setTransfers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openVerifyModal = (transfer) => {
    setVerifyTransfer(transfer);
    const initialItems = transfer.items.map(it => ({
      productId: it.productId.toString(),
      name: it.product?.name || 'Unknown',
      sku: it.product?.sku || 'N/A',
      shippedQty: it.quantity,
      unit: it.product?.unit || 'PCS',
      isVerified: true,
      receivedQuantity: it.quantity,
      discrepancyComment: ''
    }));
    setVerifyItems(initialItems);
    setShowVerifyModal(true);
  };

  const handleVerifyItemChange = (productId, field, value) => {
    setVerifyItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const updated = { ...item, [field]: value };
        if (field === 'isVerified' && value) {
          updated.receivedQuantity = item.shippedQty;
          updated.discrepancyComment = '';
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    if (!verifyTransfer) return;

    const itemsWithIssues = verifyItems.filter(it => !it.isVerified || it.receivedQuantity < it.shippedQty);
    const invalidItem = itemsWithIssues.find(it => it.receivedQuantity !== it.shippedQty && !it.discrepancyComment.trim());
    
    if (invalidItem) {
      alert(`Please add a comment explaining the issue for: ${invalidItem.name}`);
      return;
    }

    setVerifyLoading(true);
    const hasAnyDiscrepancy = itemsWithIssues.length > 0;
    const finalStatus = hasAnyDiscrepancy ? 'DISCREPANCY' : 'DELIVERED';

    try {
      await axios.patch(`/inventory/transfers/${verifyTransfer.id}/status`, {
        status: finalStatus,
        items: verifyItems.map(it => ({
          productId: it.productId,
          receivedQuantity: parseInt(it.receivedQuantity),
          hasDiscrepancy: !it.isVerified || it.receivedQuantity < it.shippedQty,
          discrepancyComment: it.discrepancyComment
        }))
      });
      setShowVerifyModal(false);
      setVerifyTransfer(null);
      setVerifyItems([]);
      fetchTransfers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit shipment verification');
    } finally {
      setVerifyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Warehouse Shipments</h2>
        <p className="text-slate-500 text-xs">Verify and approve stock dispatches sent from the central company warehouse.</p>
      </div>

      <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-2 uppercase tracking-wider">
          <Truck className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Warehouse Stock Shipments Log</span>
        </h3>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {transfers.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 font-semibold">
              No warehouse dispatches initiated yet.
            </div>
          ) : (
            transfers.map((item) => (
              <div 
                key={item.id} 
                id={`transfer-${item.id}`}
                className={`rounded-xl p-4 space-y-3 border transition-all duration-300 ${
                  item.id === highlightedId
                    ? 'border-rose-500 bg-rose-50/10 shadow-md ring-2 ring-rose-500/20'
                    : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
                  <div>
                    <span className="font-black text-slate-800 text-xs">{item.transferNo}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Dispatched: {new Date(item.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${
                      item.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700' :
                      item.status === 'DISCREPANCY' ? 'bg-amber-50 text-amber-700' :
                      item.status === 'IN_TRANSIT' ? 'bg-indigo-50 text-indigo-700 animate-pulse' :
                      item.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' : 'bg-slate-50 text-slate-700'
                    }`}>
                      {item.status === 'DISCREPANCY' ? 'DISCREPANCY' : item.status}
                    </span>
                    
                    {item.status === 'IN_TRANSIT' && (
                      <button
                        onClick={() => openVerifyModal(item)}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-lg shadow-rose-100 transition-all cursor-pointer flex items-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify & Approve Receipt</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Products details */}
                <div className="space-y-1">
                  <span className="block text-[9px] font-black uppercase text-slate-400">Shipped Items</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {item.items?.map((it) => (
                      <div key={it.id} className="bg-white border border-slate-150 p-2 rounded-lg flex items-center justify-between">
                        <div className="truncate max-w-[120px]">
                          <p className="font-bold text-slate-700 truncate">{it.product?.name}</p>
                          <span className="text-[9px] font-semibold text-slate-400">SKU: {it.product?.sku}</span>
                        </div>
                        <span className="font-black text-slate-800 bg-slate-50 px-2 py-0.5 rounded text-[10px]">
                          {it.quantity} {it.product?.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {item.notes && (
                  <p className="text-[10px] text-slate-500 bg-slate-100/50 p-2 rounded-lg">
                    <strong>Memo:</strong> {item.notes}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Verification Checklist Modal */}
      {showVerifyModal && verifyTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50/80">
              <div>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">Shipment Verification</span>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Verify & Approve Shipment: {verifyTransfer.transferNo}</h3>
              </div>
              <button 
                onClick={() => { setShowVerifyModal(false); setVerifyTransfer(null); }} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitVerification} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="bg-indigo-50/50 border border-indigo-100/50 text-indigo-900 p-4 rounded-xl space-y-1">
                <strong className="font-bold block text-indigo-950 flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Shipment Checklist Verification:</span>
                </strong>
                <p className="leading-relaxed text-slate-600">Please check off each item received. If any item has a quantity mismatch or damage, uncheck "Verified" and update the actual received quantity and add a comment. Only verified stock will be added to your inventory after approval.</p>
              </div>

              <div className="space-y-4">
                <span className="block text-[10px] font-black uppercase text-slate-400">Items Checklist</span>
                <div className="space-y-3">
                  {verifyItems.map((item) => (
                    <div key={item.productId} className={`p-4 border rounded-xl space-y-3 transition-colors ${
                      item.isVerified ? 'border-slate-150 bg-slate-50/20' : 'border-rose-300 bg-rose-50/10'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{item.name}</p>
                          <span className="text-[9px] font-semibold text-slate-400 block">SKU: {item.sku} · Shipped: {item.shippedQty} {item.unit}</span>
                        </div>
                        
                        <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.isVerified}
                            onChange={(e) => handleVerifyItemChange(item.productId, 'isVerified', e.target.checked)}
                            className="rounded text-rose-600 border-slate-300 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                          />
                          <span>Verified (No Issues)</span>
                        </label>
                      </div>

                      {!item.isVerified && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-dashed border-rose-200 animate-fade-in">
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Received Qty ({item.unit})</label>
                            <input
                              type="number"
                              min="0"
                              max={item.shippedQty}
                              required
                              value={item.receivedQuantity}
                              onChange={(e) => handleVerifyItemChange(item.productId, 'receivedQuantity', Math.min(item.shippedQty, Math.max(0, parseInt(e.target.value) || 0)))}
                              className="w-full p-2 bg-white border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-slate-500 font-bold mb-1">Explain Issue / Comment *</label>
                            <input
                              type="text"
                              required={item.receivedQuantity !== item.shippedQty}
                              value={item.discrepancyComment}
                              placeholder="e.g. 2 packets damaged, or 3 packets missing"
                              onChange={(e) => handleVerifyItemChange(item.productId, 'discrepancyComment', e.target.value)}
                              className="w-full p-2 bg-white border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowVerifyModal(false); setVerifyTransfer(null); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyLoading}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all text-center flex items-center justify-center space-x-2 cursor-pointer disabled:bg-slate-200"
                >
                  {verifyLoading ? (
                    <span>Approving Receipt...</span>
                  ) : (
                    <span>Approve Receipt & Update Stock</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
