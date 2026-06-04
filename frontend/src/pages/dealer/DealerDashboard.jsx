// src/pages/dealer/DealerDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  DollarSign, 
  Store, 
  Bell, 
  ShoppingCart, 
  Truck, 
  AlertTriangle,
  Receipt,
  ArrowRight,
  CheckCircle2,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DealerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Discrepancy modal states
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);
  const [discrepancyTransfer, setDiscrepancyTransfer] = useState(null);
  const [discrepancyItems, setDiscrepancyItems] = useState([]);
  const [discrepancyLoading, setDiscrepancyLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/analytics/dealer');
      setData(res.data.data);

      const transfersRes = await axios.get('/inventory/transfers');
      setTransfers(transfersRes.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async (transferId) => {
    try {
      await axios.patch(`/inventory/transfers/${transferId}/status`, { status: 'DELIVERED' });
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm receipt');
    }
  };

  const openDiscrepancyModal = (transfer) => {
    setDiscrepancyTransfer(transfer);
    const initialItems = transfer.items.map(it => ({
      productId: it.productId.toString(),
      name: it.product?.name || 'Unknown',
      sku: it.product?.sku || 'N/A',
      shippedQty: it.quantity,
      unit: it.product?.unit || 'PCS',
      hasDiscrepancy: false,
      receivedQuantity: it.quantity,
      discrepancyComment: ''
    }));
    setDiscrepancyItems(initialItems);
    setShowDiscrepancyModal(true);
  };

  const handleDiscrepancyItemChange = (productId, field, value) => {
    setDiscrepancyItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const updated = { ...item, [field]: value };
        if (field === 'hasDiscrepancy' && !value) {
          updated.receivedQuantity = item.shippedQty;
          updated.discrepancyComment = '';
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSubmitDiscrepancy = async (e) => {
    e.preventDefault();
    if (!discrepancyTransfer) return;

    const invalidItem = discrepancyItems.find(it => it.hasDiscrepancy && !it.discrepancyComment.trim());
    if (invalidItem) {
      alert(`Please add a comment explaining the issue for: ${invalidItem.name}`);
      return;
    }

    setDiscrepancyLoading(true);
    try {
      await axios.patch(`/inventory/transfers/${discrepancyTransfer.id}/status`, {
        status: 'DISCREPANCY',
        items: discrepancyItems.map(it => ({
          productId: it.productId,
          receivedQuantity: parseInt(it.receivedQuantity),
          hasDiscrepancy: it.hasDiscrepancy,
          discrepancyComment: it.discrepancyComment
        }))
      });
      setShowDiscrepancyModal(false);
      setDiscrepancyTransfer(null);
      setDiscrepancyItems([]);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit discrepancy report');
    } finally {
      setDiscrepancyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  const kpis = [
    { name: 'Total Store Billing', value: `₹${data?.kpis?.totalSales?.toLocaleString('en-IN') || 0}`, desc: 'Gross invoice sales', icon: DollarSign, color: 'text-rose-600 bg-rose-50' },
    { name: 'Invoices Generated', value: data?.kpis?.totalBills || 0, desc: 'Active customer bills', icon: Receipt, color: 'text-indigo-600 bg-indigo-50' },
    { name: 'Active Outlets', value: data?.storeSales?.length || 0, desc: 'Registered retail shops', icon: Store, color: 'text-teal-600 bg-teal-50' },
    { name: 'Low Stock SKU Alerts', value: data?.lowStockAlerts?.length || 0, desc: 'Items with quantity <= 10', icon: AlertTriangle, color: data?.lowStockAlerts?.length > 0 ? 'text-amber-600 bg-amber-50 animate-pulse' : 'text-slate-400 bg-slate-50' }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 p-8 rounded-3xl text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-full bg-white/5 skew-x-12"></div>
        <div className="relative z-10 space-y-2">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">Partner Portal</h2>
          <p className="text-slate-300 text-xs md:text-sm">Welcome to Mansara Foods! View stock catalog, add retail outlets, set custom margin rules, and build GST compliant bills instantly.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.name} className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.name}</span>
                <div className={`p-2.5 rounded-xl ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-800">{kpi.value}</h3>
              <p className="text-slate-400 text-[10px] font-medium mt-1">{kpi.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Stock warnings and recent dispatches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Low Stock Alerts */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-2 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Low Stock Alerts</span>
          </h3>

          <div className="space-y-3 max-h-72 overflow-y-auto">
            {data?.lowStockAlerts?.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 font-semibold">
                Perfect! No low stock alerts.
              </div>
            ) : (
              data?.lowStockAlerts?.map(item => (
                <div key={item.productId} className="flex items-center justify-between p-3.5 bg-rose-50/20 border border-rose-100/50 rounded-xl text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800 truncate max-w-[120px]">{item.name}</h4>
                    <span className="text-[9px] font-black text-rose-600 block">SKU: {item.sku}</span>
                  </div>
                  <span className="font-black text-rose-700 bg-white border border-rose-100 px-2.5 py-0.5 rounded-lg">
                    {item.quantity} units left
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Store Performance Leaderboard & Warehouse Shipments */}
        <div className="lg:col-span-2 space-y-8">
          {/* Store Performance Leaderboard */}
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-2 uppercase tracking-wider">
              <Store className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Outlets Performance Billing</span>
            </h3>

            <div className="space-y-3">
              {data?.storeSales?.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 font-semibold">
                  No billing generated. Go to browse products or build invoices to start.
                </div>
              ) : (
                data?.storeSales?.map((store, index) => (
                  <div key={store.storeId} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                    <div className="flex items-center space-x-3">
                      <span className="font-black text-slate-400">#{index + 1}</span>
                      <strong className="text-slate-800">{store.name}</strong>
                    </div>
                    <strong className="font-black text-rose-600">₹{store.totalSales?.toLocaleString('en-IN')}</strong>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Warehouse Shipments Log */}
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center space-x-2 uppercase tracking-wider">
              <Truck className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Warehouse Stock Shipments</span>
            </h3>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {transfers.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 font-semibold">
                  No warehouse dispatches initiated yet.
                </div>
              ) : (
                transfers.map((item) => (
                  <div key={item.id} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-3">
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
                          <div className="flex space-x-1.5">
                            <button
                              onClick={() => handleConfirmReceipt(item.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                            >
                              Approve Receipt
                            </button>
                            <button
                              onClick={() => openDiscrepancyModal(item)}
                              className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all cursor-pointer"
                            >
                              Raise Discrepancy
                            </button>
                          </div>
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
        </div>
      </div>

      {/* Quick Action blocks */}
      <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 mb-6 uppercase tracking-wider">Quick Actions Panel</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/dealer/products')}
            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-rose-50/50 hover:border-rose-100 transition-all text-left group animate-fade-in"
          >
            <div>
              <span className="block text-xs font-bold text-slate-800">Browse Warehouse</span>
              <span className="text-[10px] text-slate-400">Browse and add to cart</span>
            </div>
            <ShoppingCart className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
          </button>

          <button
            onClick={() => navigate('/dealer/stores')}
            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-rose-50/50 hover:border-rose-100 transition-all text-left group"
          >
            <div>
              <span className="block text-xs font-bold text-slate-800">Manage Retail Outlets</span>
              <span className="text-[10px] text-slate-400">Add multiple shop outlets</span>
            </div>
            <Store className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
          </button>

          <button
            onClick={() => navigate('/dealer/invoices')}
            className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-rose-50/50 hover:border-rose-100 transition-all text-left group"
          >
            <div>
              <span className="block text-xs font-bold text-slate-800">Invoices History</span>
              <span className="text-[10px] text-slate-400">Manage tax bill prints</span>
            </div>
            <Receipt className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors" />
          </button>
        </div>
      </div>
    </div>

      {/* Discrepancy Modal */}
      {showDiscrepancyModal && discrepancyTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-amber-50">
              <div>
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider block">Logistics Discrepancy</span>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Report Shipment Discrepancy: {discrepancyTransfer.transferNo}</h3>
              </div>
              <button 
                onClick={() => { setShowDiscrepancyModal(false); setDiscrepancyTransfer(null); }} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDiscrepancy} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="bg-amber-50/50 border border-amber-200/50 text-amber-800 p-4 rounded-xl space-y-1">
                <strong className="font-bold block">⚠️ Important Stock Policy:</strong>
                <p className="leading-relaxed">Your distributor inventory will be updated automatically ONLY by the actual quantities received. Any differences will be logged in system notifications for Admin review.</p>
              </div>

              <div className="space-y-4">
                <span className="block text-[10px] font-black uppercase text-slate-400">Shipped Items List</span>
                <div className="space-y-3">
                  {discrepancyItems.map((item) => (
                    <div key={item.productId} className={`p-4 border rounded-xl space-y-3 transition-colors ${
                      item.hasDiscrepancy ? 'border-amber-300 bg-amber-50/10' : 'border-slate-150 bg-slate-50/20'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{item.name}</p>
                          <span className="text-[9px] font-semibold text-slate-400 block">SKU: {item.sku} · Shipped: {item.shippedQty} {item.unit}</span>
                        </div>
                        
                        <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={item.hasDiscrepancy}
                            onChange={(e) => handleDiscrepancyItemChange(item.productId, 'hasDiscrepancy', e.target.checked)}
                            className="rounded text-rose-600 border-slate-300 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                          />
                          <span>Report Issue</span>
                        </label>
                      </div>

                      {item.hasDiscrepancy && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-dashed border-slate-200 animate-fade-in">
                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Received Qty ({item.unit})</label>
                            <input
                              type="number"
                              min="0"
                              max={item.shippedQty}
                              required
                              value={item.receivedQuantity}
                              onChange={(e) => handleDiscrepancyItemChange(item.productId, 'receivedQuantity', Math.min(item.shippedQty, Math.max(0, parseInt(e.target.value) || 0)))}
                              className="w-full p-2 bg-white border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-slate-500 font-bold mb-1">Issue Description / Comment *</label>
                            <input
                              type="text"
                              required
                              value={item.discrepancyComment}
                              placeholder="e.g. 2 packets torn and spilled, or count was 8 instead of 10"
                              onChange={(e) => handleDiscrepancyItemChange(item.productId, 'discrepancyComment', e.target.value)}
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
                  onClick={() => { setShowDiscrepancyModal(false); setDiscrepancyTransfer(null); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={discrepancyLoading}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl shadow-lg transition-all text-center flex items-center justify-center space-x-2 cursor-pointer disabled:bg-slate-200"
                >
                  {discrepancyLoading ? (
                    <span>Submitting Report...</span>
                  ) : (
                    <span>Submit Discrepancy Report</span>
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
