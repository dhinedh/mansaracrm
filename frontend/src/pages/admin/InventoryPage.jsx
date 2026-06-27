// src/pages/admin/InventoryPage.jsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Warehouse,
  Edit3,
  X,
  AlertTriangle,
  RefreshCw,
  Search,
  Package,
  TrendingDown,
  CheckCircle2
} from 'lucide-react';

export default function InventoryPage() {
  const location = useLocation();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editQty, setEditQty] = useState('');
  const [editMinQty, setEditMinQty] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    fetchStocks();
  }, []);

  useEffect(() => {
    if (location.state?.filter === 'low_stock') {
      setFilterLowStock(true);
    }
  }, [location.state]);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/inventory/company');
      setStocks(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setEditQty(String(item.quantity));
    setEditMinQty(String(item.minQuantity));
    setShowEditModal(true);
    setMessage({ text: '', type: '' });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    setEditSaving(true);
    try {
      await axios.put('/inventory/company/update', {
        productId: editItem.productId,
        quantity: parseInt(editQty),
        minQuantity: parseInt(editMinQty)
      });
      setMessage({ text: `Stock for "${editItem.product.name}" updated successfully!`, type: 'success' });
      setShowEditModal(false);
      setEditItem(null);
      fetchStocks();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update stock', type: 'error' });
    } finally {
      setEditSaving(false);
    }
  };

  const filteredStocks = stocks.filter(item => {
    const isLow = item.quantity <= item.minQuantity;
    if (filterLowStock && !isLow) return false;

    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.product.name.toLowerCase().includes(q) ||
      item.product.sku.toLowerCase().includes(q) ||
      item.product.category?.name?.toLowerCase().includes(q)
    );
  });

  const lowStockCount = stocks.filter(s => s.quantity <= s.minQuantity).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-rose-600" />
            Stock Management
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Live warehouse stock — data pulled directly from the database.</p>
        </div>
        <button
          onClick={fetchStocks}
          className="inline-flex items-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total SKUs</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{stocks.length}</p>
        </div>
        <div className={`bg-white border rounded-2xl p-4 shadow-sm ${lowStockCount > 0 ? 'border-rose-100' : 'border-slate-100'}`}>
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            {lowStockCount > 0 && <AlertTriangle className="w-3 h-3 text-rose-500" />}
            Low Stock Alerts
          </p>
          <p className={`text-2xl font-black mt-1 ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{lowStockCount}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Healthy Stock</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stocks.length - lowStockCount}</p>
        </div>
      </div>

      {/* Message */}
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

      {/* Active Filter Chips */}
      {filterLowStock && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-xl text-xs font-semibold w-fit animate-fade-in">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Showing Low Stock Alerts Only</span>
          <button
            onClick={() => setFilterLowStock(false)}
            className="text-amber-500 hover:text-amber-700 ml-1 cursor-pointer focus:outline-none flex items-center justify-center p-0.5 hover:bg-amber-100 rounded-lg transition-colors"
            title="Clear filter"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by product name, SKU, or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-rose-400 text-xs text-slate-700 font-medium"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-xs font-bold">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading stock...
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Package className="w-8 h-8" />
            <p className="text-xs font-bold">{search ? 'No results match your search.' : 'No stock records found.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-black uppercase tracking-wider text-[10px]">
                  <th className="p-4">SKU / Product</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-center">Available Stock</th>
                  <th className="p-4 text-center">Min Threshold</th>
                  <th className="p-4 text-right">Base Price</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((item) => {
                  const isLow = item.quantity <= item.minQuantity;
                  return (
                    <tr
                      key={item.id}
                      className={`border-b border-slate-100 last:border-0 transition-colors ${isLow ? 'bg-rose-50/30 hover:bg-rose-50/50' : 'hover:bg-slate-50/50'}`}
                    >
                      <td className="p-4">
                        <span className="font-black text-rose-600 block text-[10px] mb-0.5">SKU: {item.product.sku}</span>
                        <span className="font-bold text-slate-800">{item.product.name}</span>
                      </td>
                      <td className="p-4 text-slate-500 font-medium">{item.product.category?.name || '—'}</td>
                      <td className="p-4 text-center">
                        <span className={`font-black px-2.5 py-1 rounded-full text-[10px] ${
                          isLow ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {item.quantity} {item.product.unit}
                        </span>
                      </td>
                      <td className="p-4 text-center text-slate-400 font-bold">{item.minQuantity} {item.product.unit}</td>
                      <td className="p-4 text-right font-bold text-slate-800">₹{parseFloat(item.product.price).toFixed(2)}</td>
                      <td className="p-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-black px-2.5 py-1 rounded-full">
                            <TrendingDown className="w-2.5 h-2.5" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-2.5 h-2.5" /> OK
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => openEditModal(item)}
                          className="inline-flex items-center space-x-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Stock Modal */}
      {showEditModal && editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">SKU: {editItem.product.sku}</span>
                <h3 className="font-black text-slate-800 text-sm">Adjust Stock</h3>
              </div>
              <button
                onClick={() => { setShowEditModal(false); setEditItem(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-black uppercase text-[10px] mb-1">Product</label>
                <p className="font-bold text-slate-800 bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl">{editItem.product.name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Available Stock ({editItem.product.unit}) *</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-0.5 justify-between">
                    <button
                      type="button"
                      onClick={() => setEditQty(q => String(Math.max(0, (parseInt(q) || 0) - 1)))}
                      className="px-3 py-1.5 hover:bg-slate-200 rounded-lg text-slate-500 font-extrabold text-sm select-none cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      required
                      min="0"
                      value={editQty}
                      onChange={e => setEditQty(e.target.value)}
                      className="w-full border-0 bg-transparent text-center font-bold text-slate-800 focus:outline-none focus:ring-0 p-0 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => setEditQty(q => String((parseInt(q) || 0) + 1))}
                      className="px-3 py-1.5 hover:bg-slate-200 rounded-lg text-slate-500 font-extrabold text-sm select-none cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Min Threshold ({editItem.product.unit}) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editMinQty}
                    onChange={e => setEditMinQty(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditItem(null); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-rose-100 transition-all"
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
