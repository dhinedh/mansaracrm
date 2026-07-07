// src/pages/admin/OffersPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Gift, 
  Send, 
  Calendar, 
  Store, 
  Building2, 
  Boxes, 
  ArrowLeftRight,
  TrendingUp, 
  DollarSign, 
  Loader2, 
  AlertTriangle,
  FileText
} from 'lucide-react';
import { BACKEND_URL } from '../../store/authStore';
import axiosInstance from 'axios';

export default function OffersPage() {
  // Tabs: 'inventory' | 'distributions'
  const [activeTab, setActiveTab] = useState('inventory');

  // Lists
  const [items, setItems] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [stores, setStores] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Item Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [purchaseCost, setPurchaseCost] = useState('');
  const [quantity, setQuantity] = useState('');
  const [submittingItem, setSubmittingItem] = useState(false);

  // Distribute Form State
  const [showDistModal, setShowDistModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [distQuantity, setDistQuantity] = useState('');
  const [distDate, setDistDate] = useState(new Date().toISOString().split('T')[0]);
  const [distributedToType, setDistributedToType] = useState('STORE');
  const [storeId, setStoreId] = useState('');
  const [stallSessionId, setStallSessionId] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingDist, setSubmittingDist] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [itemsRes, distRes, storesRes, sessionsRes] = await Promise.all([
        axiosInstance.get('/offers/items'),
        axiosInstance.get('/offers/distributions'),
        axiosInstance.get('/stores'),
        axiosInstance.get('/stalls/sessions')
      ]);
      setItems(itemsRes.data.data);
      setDistributions(distRes.data.data);
      setStores(storesRes.data.data);
      setSessions(sessionsRes.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch promotional offers data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      setSubmittingItem(true);
      await axiosInstance.post('/offers/items', {
        name,
        description,
        purchaseCost: parseFloat(purchaseCost),
        quantity: parseInt(quantity)
      });
      alert('Promotional item added successfully!');
      setName('');
      setDescription('');
      setPurchaseCost('');
      setQuantity('');
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add promotional item');
    } finally {
      setSubmittingItem(false);
    }
  };

  const handleDistribute = async (e) => {
    e.preventDefault();

    // Client-side stock check
    const selectedItem = items.find(item => item.id === selectedItemId);
    if (!selectedItem) {
      alert('Please select a promotional item.');
      return;
    }

    const reqQty = parseInt(distQuantity);
    if (selectedItem.quantity < reqQty) {
      alert(`Insufficient stock. Only ${selectedItem.quantity} units of "${selectedItem.name}" remain in inventory.`);
      return;
    }

    try {
      setSubmittingDist(true);
      await axiosInstance.post('/offers/distributions', {
        offerItemId: selectedItemId,
        quantity: reqQty,
        date: distDate,
        distributedToType,
        storeId: distributedToType === 'STORE' ? storeId : null,
        stallSessionId: distributedToType === 'EVENT' ? stallSessionId : null,
        notes
      });
      alert('Promotional items distributed successfully!');
      setSelectedItemId('');
      setDistQuantity('');
      setStoreId('');
      setStallSessionId('');
      setNotes('');
      setShowDistModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to distribute item');
    } finally {
      setSubmittingDist(false);
    }
  };

  // Helper metrics
  const totalInitialCost = items.reduce((sum, item) => sum + (item.initialQuantity * item.purchaseCost), 0);
  const totalCurrentCost = items.reduce((sum, item) => sum + (item.quantity * item.purchaseCost), 0);
  const totalUnitsDistributed = distributions.reduce((sum, d) => sum + d.quantity, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Gift className="w-7 h-7 text-amber-600" />
            Offer / Promotional Items Ledger
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Track promotional item inventories (headsets, welcome kits, gifts), purchase costs, and distribution targets.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Promotional Item
          </button>
          <button
            onClick={() => setShowDistModal(true)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Distribute Item
          </button>
        </div>
      </div>

      {/* Quick Metrics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Remaining Stock Value</span>
            <h4 className="text-lg font-black text-slate-850">₹{totalCurrentCost.toLocaleString()}</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Distributed Items</span>
            <h4 className="text-lg font-black text-slate-850">{totalUnitsDistributed.toLocaleString()} Units</h4>
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Purchase Investment</span>
            <h4 className="text-lg font-black text-slate-850">₹{totalInitialCost.toLocaleString()}</h4>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 text-sm font-bold transition-all cursor-pointer relative ${
            activeTab === 'inventory' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Promotional Inventory
          {activeTab === 'inventory' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveTab('distributions')}
          className={`pb-3 text-sm font-bold transition-all cursor-pointer relative ${
            activeTab === 'distributions' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Distribution Ledger
          {activeTab === 'distributions' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-full" />}
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      ) : activeTab === 'inventory' ? (
        // INVENTORY TAB
        items.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm">
            <Gift className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-sm">No Promotional Products Found</h3>
            <p className="text-slate-500 text-xs mt-1">Register items like Headsets, Kits, or Gifts to track costs and stocks.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <th className="p-3">Item Name / Description</th>
                    <th className="p-3 text-right">Unit Purchase Cost</th>
                    <th className="p-3 text-center">Initial Qty</th>
                    <th className="p-3 text-center">Remaining Stock</th>
                    <th className="p-3 text-right">Total Cost Value</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                      <td className="p-3">
                        <strong className="text-slate-850 font-black block">{item.name}</strong>
                        {item.description && <span className="text-[10px] text-slate-450 block mt-0.5">{item.description}</span>}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800">₹{item.purchaseCost.toLocaleString()}</td>
                      <td className="p-3 text-center text-slate-500 font-semibold">{item.initialQuantity}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          item.quantity > 10 ? 'bg-emerald-50 text-emerald-800' : item.quantity > 0 ? 'bg-amber-50 text-amber-850' : 'bg-red-50 text-red-800'
                        }`}>
                          {item.quantity} units
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-slate-800 text-sm">₹{(item.initialQuantity * item.purchaseCost).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        // DISTRIBUTION TAB
        distributions.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm">
            <Send className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-sm">No Distribution Records Found</h3>
            <p className="text-slate-500 text-xs mt-1">Distribute items to Stores or events by clicking "Distribute Item" above.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                    <th className="p-3">Date</th>
                    <th className="p-3">Promotional Item</th>
                    <th className="p-3 text-center">Quantity Distributed</th>
                    <th className="p-3">Distributed To</th>
                    <th className="p-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {distributions.map((d) => (
                    <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                      <td className="p-3 text-slate-500 font-semibold">{new Date(d.date).toLocaleDateString()}</td>
                      <td className="p-3">
                        <strong className="text-slate-850 font-bold">{d.offerItem?.name || 'Unknown Item'}</strong>
                        {d.offerItem?.purchaseCost && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">Value: ₹{(d.quantity * d.offerItem.purchaseCost).toLocaleString()}</span>
                        )}
                      </td>
                      <td className="p-3 text-center font-black text-slate-800">{d.quantity}</td>
                      <td className="p-3 text-slate-700">
                        {d.distributedToType === 'STORE' && d.store && (
                          <span className="flex items-center gap-1">
                            <Store className="w-3.5 h-3.5 text-slate-400" />
                            Store: <strong>{d.store.name}</strong>
                          </span>
                        )}
                        {d.distributedToType === 'EVENT' && d.stallSession && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            Event: <strong>{d.stallSession.name}</strong>
                          </span>
                        )}
                        {d.distributedToType === 'GENERAL' && (
                          <span className="text-slate-550 font-medium">General Marketing</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 italic font-normal">{d.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <h2 className="text-lg font-black text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Gift className="w-5.5 h-5.5 text-amber-600" />
              Add Promotional Item
            </h2>
            <form onSubmit={handleAddItem} className="space-y-4 mt-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block uppercase tracking-wider mb-1">Item Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Welcome Kits, Headsets, Gifts"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-normal text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1">Description</label>
                <input 
                  type="text" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Branded corporate diaries and pens"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-normal text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider mb-1">Purchase Cost (₹)</label>
                  <input 
                    type="number" 
                    value={purchaseCost} 
                    onChange={(e) => setPurchaseCost(e.target.value)}
                    placeholder="e.g. 150"
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider mb-1">Initial Quantity</label>
                  <input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 200"
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-sm border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingItem}
                  className="px-5 py-2 rounded-xl font-semibold text-sm bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingItem && <Loader2 className="w-4 h-4 animate-spin" />}
                  Register Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Distribute Modal */}
      {showDistModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <h2 className="text-lg font-black text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Send className="w-5.5 h-5.5 text-amber-600" />
              Distribute Promotional Stock
            </h2>
            <form onSubmit={handleDistribute} className="space-y-4 mt-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block uppercase tracking-wider mb-1">Select Promotional Item</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-sm bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-750"
                >
                  <option value="">-- Choose Item --</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Stock: {item.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider mb-1">Quantity to Distribute</label>
                  <input 
                    type="number" 
                    value={distQuantity} 
                    onChange={(e) => setDistQuantity(e.target.value)}
                    placeholder="e.g. 50"
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider mb-1">Distribution Date</label>
                  <input 
                    type="date" 
                    value={distDate} 
                    onChange={(e) => setDistDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider mb-1">Distribution Destination</label>
                <select
                  value={distributedToType}
                  onChange={(e) => {
                    setDistributedToType(e.target.value);
                    setStoreId('');
                    setStallSessionId('');
                  }}
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-sm bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-750"
                >
                  <option value="STORE">STORE-WISE</option>
                  <option value="EVENT">EVENT-WISE</option>
                  <option value="GENERAL">GENERAL MARKETING</option>
                </select>
              </div>

              {distributedToType === 'STORE' && (
                <div>
                  <label className="block uppercase tracking-wider mb-1">Select Store</label>
                  <select
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-sm bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-750"
                  >
                    <option value="">-- Choose Store --</option>
                    {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {distributedToType === 'EVENT' && (
                <div>
                  <label className="block uppercase tracking-wider mb-1">Select Stall Event</label>
                  <select
                    value={stallSessionId}
                    onChange={(e) => setStallSessionId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-semibold text-sm bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-slate-750"
                  >
                    <option value="">-- Choose Stall Event --</option>
                    {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block uppercase tracking-wider mb-1">Distribution Notes</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Distributed during the opening ceremony"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-normal text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDistModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-sm border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDist}
                  className="px-5 py-2 rounded-xl font-semibold text-sm bg-amber-600 hover:bg-amber-700 text-white transition flex items-center gap-1.5 cursor-pointer"
                >
                  {submittingDist && <Loader2 className="w-4 h-4 animate-spin" />}
                  Record Distribution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
