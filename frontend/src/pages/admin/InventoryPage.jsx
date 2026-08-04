// src/pages/admin/InventoryPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Warehouse,
  Edit3,
  AlertTriangle,
  RefreshCw,
  Search,
  Package,
  CheckCircle2,
  Plus,
  ArrowRightLeft,
  Boxes,
  Download,
  Calendar,
  MapPin,
  Tag,
  Clock,
  Send,
  ChevronDown,
  ChevronRight,
  Trash2
} from 'lucide-react';

export default function InventoryPage() {
  const location = useLocation();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // State to track expanded Stock Item rows for Multi-Batch view
  const [expandedStockRows, setExpandedStockRows] = useState({});

  // Modals
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showFGModal, setShowFGModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Add Stock Form State (Supports Multiple Batches per Stock Item)
  const [addStockData, setAddStockData] = useState({
    stockId: 'STK-2026-089',
    itemName: '',
    unit: 'Cartons',
    minQuantity: 50,
    packagingBreakdown: '',
    grnNumber: '',
    vendorName: '',
    notes: '',
    batches: [
      {
        batchId: `BATCH-RM-${Date.now().toString().slice(-4)}-1`,
        quantity: '',
        mfgDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        storageLocation: 'Warehouse 1, Rack A',
        status: 'Available'
      }
    ]
  });

  // Issue to Operations Form State
  const [selectedStockForIssue, setSelectedStockForIssue] = useState('');
  const [issueQuantity, setIssueQuantity] = useState('');
  const [targetProcess, setTargetProcess] = useState('Grinding & Mixing Unit');
  const [yieldQuantity, setYieldQuantity] = useState('');
  const [scrapQuantity, setScrapQuantity] = useState('');
  const [issueNotes, setIssueNotes] = useState('');

  // Finished Goods Batch Form State
  const [fgData, setFgData] = useState({
    itemName: '',
    cartonsCount: '',
    packetsPerCarton: '',
    storageLocation: 'Finished Goods Warehouse, Rack B',
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  });

  // Edit Stock State
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
      setStocks(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch stock inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpandRow = (stockKey) => {
    setExpandedStockRows(prev => ({
      ...prev,
      [stockKey]: !prev[stockKey]
    }));
  };

  // Open Add Stock Modal (New Item or Add Batch to Existing Item)
  const handleOpenAddStockModal = (existingItem = null) => {
    if (existingItem) {
      setAddStockData({
        stockId: existingItem.stockId,
        itemName: existingItem.itemName,
        unit: existingItem.unit || 'Cartons',
        minQuantity: existingItem.minQuantity || 50,
        packagingBreakdown: '',
        grnNumber: '',
        vendorName: '',
        notes: '',
        batches: [
          {
            batchId: `BATCH-RM-${Date.now().toString().slice(-4)}`,
            quantity: '',
            mfgDate: new Date().toISOString().split('T')[0],
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            storageLocation: 'Warehouse 1, Rack A',
            status: 'Available'
          }
        ]
      });
    } else {
      setAddStockData({
        stockId: `STK-2026-${Math.floor(100 + Math.random() * 900)}`,
        itemName: '',
        unit: 'Cartons',
        minQuantity: 50,
        packagingBreakdown: '',
        grnNumber: '',
        vendorName: '',
        notes: '',
        batches: [
          {
            batchId: `BATCH-RM-${Date.now().toString().slice(-4)}-1`,
            quantity: '',
            mfgDate: new Date().toISOString().split('T')[0],
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            storageLocation: 'Warehouse 1, Rack A',
            status: 'Available'
          }
        ]
      });
    }
    setShowAddStockModal(true);
  };

  // Add another batch row inside the Add Stock Modal
  const handleAddBatchRow = () => {
    setAddStockData(prev => ({
      ...prev,
      batches: [
        ...prev.batches,
        {
          batchId: `BATCH-RM-${Date.now().toString().slice(-4)}-${prev.batches.length + 1}`,
          quantity: '',
          mfgDate: new Date().toISOString().split('T')[0],
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          storageLocation: 'Warehouse 1, Rack A',
          status: 'Available'
        }
      ]
    }));
  };

  // Remove batch row inside modal
  const handleRemoveBatchRow = (idx) => {
    if (addStockData.batches.length <= 1) return;
    setAddStockData(prev => ({
      ...prev,
      batches: prev.batches.filter((_, i) => i !== idx)
    }));
  };

  // 1. Submit Manual Stock & Multi-Batch Entry
  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/inventory/company/create', addStockData);
      if (res.data.success) {
        setMessage({ text: res.data.message, type: 'success' });
        setShowAddStockModal(false);
        fetchStocks();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to create stock entry.', type: 'error' });
    }
  };

  // 2. Submit Issue to Operations (Movement & Yield/Scrap)
  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/inventory/company/issue-production', {
        stockId: selectedStockForIssue,
        issueQuantity: Number(issueQuantity),
        targetProcess,
        yieldQuantity: yieldQuantity ? Number(yieldQuantity) : undefined,
        scrapQuantity: scrapQuantity ? Number(scrapQuantity) : undefined,
        notes: issueNotes
      });
      if (res.data.success) {
        setMessage({ text: res.data.message, type: 'success' });
        setShowIssueModal(false);
        setSelectedStockForIssue('');
        setIssueQuantity('');
        setYieldQuantity('');
        setScrapQuantity('');
        setIssueNotes('');
        fetchStocks();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to issue stock to operations.', type: 'error' });
    }
  };

  // 3. Submit Finished Goods Batch Creation
  const handleFGSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/inventory/company/finished-goods', fgData);
      if (res.data.success) {
        setMessage({ text: res.data.message, type: 'success' });
        setShowFGModal(false);
        setFgData({
          itemName: '',
          cartonsCount: '',
          packetsPerCarton: '',
          storageLocation: 'Finished Goods Warehouse, Rack B',
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: ''
        });
        fetchStocks();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to create finished goods batch.', type: 'error' });
    }
  };

  // 4. Trigger Purchase Request (PR) when stock is low
  const handleTriggerPR = async (stockItem) => {
    try {
      const res = await axios.post('/inventory/company/trigger-pr', {
        stockId: stockItem.id || stockItem.stockId,
        itemName: stockItem.itemName || stockItem.product?.name,
        currentQuantity: stockItem.totalQuantity || stockItem.quantity,
        minQuantity: stockItem.minQuantity
      });
      if (res.data.success) {
        setMessage({ text: res.data.message, type: 'success' });
      }
    } catch (err) {
      setMessage({ text: 'Failed to trigger purchase request.', type: 'error' });
    }
  };

  // 5. Edit Stock Quantity & Threshold
  const openEditModal = (item) => {
    setEditItem(item);
    setEditQty(String(item.quantity));
    setEditMinQty(String(item.minQuantity || 50));
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    setEditSaving(true);
    try {
      await axios.put('/inventory/company/update', {
        productId: editItem.productId || editItem.id,
        quantity: parseInt(editQty),
        minQuantity: parseInt(editMinQty)
      });
      setMessage({ text: `Stock count for "${editItem.itemName || editItem.product?.name}" updated!`, type: 'success' });
      setShowEditModal(false);
      setEditItem(null);
      fetchStocks();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update stock', type: 'error' });
    } finally {
      setEditSaving(false);
    }
  };

  // Export CSV Report
  const handleExportCSV = () => {
    if (stocks.length === 0) return;
    const headers = ['Stock ID', 'Batch ID', 'Item Name', 'Count / Cartons', 'Unit', 'Storage Location', 'Mfg Date', 'Expiry Date', 'Status'];
    const rows = stocks.map(s => [
      s.stockId || 'N/A',
      s.batchId || 'N/A',
      `"${s.itemName || s.product?.name || ''}"`,
      s.quantity,
      s.unit || 'Cartons',
      `"${s.storageLocation || ''}"`,
      new Date(s.mfgDate || s.createdAt).toLocaleDateString(),
      s.expiryDate ? new Date(s.expiryDate).toLocaleDateString() : 'N/A',
      s.status || 'Available'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── GROUPING LOGIC: ONE STOCK ITEM -> MULTIPLE BATCHES ──────────────────────
  const groupedStockItems = useMemo(() => {
    const map = {};

    stocks.forEach((item, idx) => {
      const isLow = item.quantity <= (item.minQuantity || 10);

      // Filtering check
      if (filterLowStock && !isLow) return;

      if (search) {
        const q = search.toLowerCase();
        const name = (item.itemName || item.product?.name || '').toLowerCase();
        const batch = (item.batchId || '').toLowerCase();
        const stockId = (item.stockId || '').toLowerCase();
        const location = (item.storageLocation || '').toLowerCase();
        if (!name.includes(q) && !batch.includes(q) && !stockId.includes(q) && !location.includes(q)) {
          return;
        }
      }

      // Key for grouping by Item Name & Stock ID
      const itemKey = (item.itemName || item.product?.name || `Item-${idx}`).trim();

      if (!map[itemKey]) {
        map[itemKey] = {
          stockKey: itemKey,
          stockId: item.stockId || `STK-2026-${String(idx + 1).padStart(3, '0')}`,
          itemName: item.itemName || item.product?.name || 'Stock Item',
          unit: item.unit || 'Cartons',
          minQuantity: item.minQuantity || 50,
          totalQuantity: 0,
          batches: []
        };
      }

      map[itemKey].totalQuantity += Number(item.quantity) || 0;
      map[itemKey].batches.push(item);
    });

    return Object.values(map);
  }, [stocks, search, filterLowStock]);

  const lowStockCount = stocks.filter(s => s.quantity <= (s.minQuantity || 10)).length;
  const totalBatchesCount = stocks.length;
  const totalUnitsCount = stocks.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Warehouse className="w-7 h-7 text-rose-400" />
            <h1 className="text-xl font-black tracking-tight">Central Stock & Multi-Batch Traceability Hub</h1>
          </div>
          <p className="text-xs text-slate-300">1 Stock Item → Multiple Batches tracking (Cartons / Numbers / Units), yield/scrap logs & automated low stock alerts.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleOpenAddStockModal()}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Stock</span>
          </button>

          <button
            onClick={() => setShowIssueModal(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Issue to Operations</span>
          </button>

          <button
            onClick={() => setShowFGModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Boxes className="w-4 h-4" />
            <span>+ Create Finished Goods</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Stock Items</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{groupedStockItems.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1">
            <Tag className="w-3 h-3 text-indigo-500" />
            Active Batches
          </p>
          <p className="text-2xl font-black text-slate-800 mt-1">{totalBatchesCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1">
            <Boxes className="w-3 h-3 text-emerald-500" />
            Total Count (Cartons / Numbers)
          </p>
          <p className="text-2xl font-black text-slate-800 mt-1">{totalUnitsCount}</p>
        </div>
        <div className={`bg-white border rounded-2xl p-4 shadow-sm ${lowStockCount > 0 ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'}`}>
          <p className="text-[10px] font-black uppercase tracking-wider text-rose-600 flex items-center gap-1">
            {lowStockCount > 0 && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />}
            Low Stock Alerts
          </p>
          <p className={`text-2xl font-black mt-1 ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{lowStockCount}</p>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ text: '', type: '' })} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Stock ID, Batch ID, Item Name, Location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-400 text-xs font-bold text-slate-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center space-x-1.5 ${
              filterLowStock ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Only</span>
          </button>
          <button onClick={fetchStocks} className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 cursor-pointer" title="Refresh Data">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      ut7tfv
      {/* Stock Items Multi-Batch Grouped Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-xs font-bold">
            <RefreshCw className="w-5 h-5 animate-spin mr-2 text-rose-600" /> Loading multi-batch stock inventory...
          </div>
        ) : groupedStockItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <Package className="w-10 h-10 text-slate-300" />
            <p className="text-xs font-bold">{search ? 'No stock items match your search filters.' : 'No stock entries found in inventory.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-900 text-white font-black uppercase tracking-wider text-[10px]">
                  <th className="p-4 w-10"></th>
                  <th className="p-4">Stock ID</th>
                  <th className="p-4">Item Name</th>
                  <th className="p-4 text-center">Total Stock Count (Cartons / Numbers)</th>
                  <th className="p-4 text-center">Active Batches</th>
                  <th className="p-4 text-center">Min Threshold</th>
                  <th className="p-4 text-center">Overall Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {groupedStockItems.map(stockGroup => {
                  const isExpanded = !!expandedStockRows[stockGroup.stockKey];
                  const isLow = stockGroup.totalQuantity <= (stockGroup.minQuantity || 10);

                  return (
                    <React.Fragment key={stockGroup.stockKey}>
                      {/* Master Stock Item Row */}
                      <tr className={`hover:bg-slate-50 transition-colors ${isLow ? 'bg-rose-50/40' : 'bg-white'}`}>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleExpandRow(stockGroup.stockKey)}
                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                            title="Expand / Collapse Batches"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                        </td>

                        <td className="p-4">
                          <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                            {stockGroup.stockId}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="font-black text-slate-900 text-sm block">{stockGroup.itemName}</span>
                        </td>

                        <td className="p-4 text-center">
                          <span className={`text-base font-black ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                            {stockGroup.totalQuantity} {stockGroup.unit}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleExpandRow(stockGroup.stockKey)}
                            className="inline-flex items-center gap-1 text-xs font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                          >
                            <Tag className="w-3 h-3 text-rose-500" />
                            {stockGroup.batches.length} Batch{stockGroup.batches.length > 1 ? 'es' : ''}
                          </button>
                        </td>

                        <td className="p-4 text-center">
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                            {stockGroup.minQuantity} {stockGroup.unit}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                            isLow ? 'bg-rose-600 text-white shadow-sm animate-pulse' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {isLow && <AlertTriangle className="w-3 h-3" />}
                            {isLow ? 'LOW STOCK' : 'HEALTHY'}
                          </span>
                        </td>

                        <td className="p-4 text-center space-x-1">
                          <button
                            onClick={() => handleOpenAddStockModal(stockGroup)}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center space-x-1 cursor-pointer"
                            title="Add another Batch ID under this Stock Item"
                          >
                            <Plus className="w-3 h-3" />
                            <span>+ Add Batch</span>
                          </button>

                          {isLow && (
                            <button
                              onClick={() => handleTriggerPR(stockGroup)}
                              className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition cursor-pointer"
                              title="Auto Trigger Purchase Request (PR)"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>

                      {/* Expanded Multiple Batches Breakdown Sub-Table */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="p-0 bg-slate-50/70 border-y border-slate-200">
                            <div className="p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                                  <Tag className="w-4 h-4 text-rose-600" />
                                  Multiple Batch IDs under "{stockGroup.itemName}" ({stockGroup.stockId}):
                                </span>
                                <button
                                  onClick={() => handleOpenAddStockModal(stockGroup)}
                                  className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add New Batch ID</span>
                                </button>
                              </div>

                              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                                <table className="w-full text-xs text-left">
                                  <thead>
                                    <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[9px]">
                                      <th className="p-3">Batch ID</th>
                                      <th className="p-3">Stock Count (Cartons / Numbers)</th>
                                      <th className="p-3">Packaging Breakdown</th>
                                      <th className="p-3">Mfg & Expiry Date</th>
                                      <th className="p-3">Storage Location</th>
                                      <th className="p-3 text-center">Batch Status</th>
                                      <th className="p-3 text-center">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {stockGroup.batches.map((batchItem, bIdx) => {
                                      const isExpiring = batchItem.expiryDate && (new Date(batchItem.expiryDate) - Date.now()) < 30 * 24 * 60 * 60 * 1000;

                                      return (
                                        <tr key={batchItem.id || batchItem._id || bIdx} className="hover:bg-slate-50">
                                          <td className="p-3 font-mono font-black text-rose-700 text-xs">
                                            {batchItem.batchId || `BATCH-${bIdx + 1}`}
                                          </td>
                                          <td className="p-3 font-bold text-slate-900">
                                            {batchItem.quantity} {batchItem.unit || stockGroup.unit}
                                          </td>
                                          <td className="p-3 text-slate-600">
                                            {batchItem.packagingBreakdown || '1 Batch = Direct Stock'}
                                          </td>
                                          <td className="p-3 text-[11px]">
                                            <div>Mfg: {new Date(batchItem.mfgDate || batchItem.createdAt).toLocaleDateString()}</div>
                                            {batchItem.expiryDate && (
                                              <div className={isExpiring ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                                                Exp: {new Date(batchItem.expiryDate).toLocaleDateString()}
                                              </div>
                                            )}
                                          </td>
                                          <td className="p-3 text-slate-700 flex items-center gap-1 font-medium">
                                            <MapPin className="w-3 h-3 text-rose-500" />
                                            {batchItem.storageLocation || 'Warehouse 1, Rack A'}
                                          </td>
                                          <td className="p-3 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                              batchItem.status === 'In Production' ? 'bg-purple-100 text-purple-800' :
                                              batchItem.status === 'In Inspection' ? 'bg-blue-100 text-blue-800' :
                                              'bg-emerald-100 text-emerald-800'
                                            }`}>
                                              {batchItem.status || 'AVAILABLE'}
                                            </span>
                                          </td>
                                          <td className="p-3 text-center">
                                            <button
                                              onClick={() => openEditModal(batchItem)}
                                              className="p-1 text-slate-600 hover:text-rose-600 cursor-pointer"
                                              title="Edit Batch Count & Location"
                                            >
                                              <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL 1: ADD NEW STOCK & MULTIPLE BATCHES ── */}
      {showAddStockModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 my-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-rose-600" />
                Manual Stock Entry & Multi-Batch Assignment
              </h3>
              <button onClick={() => setShowAddStockModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddStockSubmit} className="space-y-4 text-xs">
              {/* Row 1: Stock ID & Item Name */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. STK-2026-089"
                    value={addStockData.stockId || ''}
                    onChange={e => setAddStockData({ ...addStockData, stockId: e.target.value })}
                    className="w-full p-2 bg-white border rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Premium Chili Powder / Ulunthu"
                    value={addStockData.itemName}
                    onChange={e => setAddStockData({ ...addStockData, itemName: e.target.value })}
                    className="w-full p-2 bg-white border rounded-xl font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Row 2: Unit Type & Min Threshold */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Measurement (Cartons / Numbers) *</label>
                  <select
                    value={addStockData.unit}
                    onChange={e => setAddStockData({ ...addStockData, unit: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold cursor-pointer"
                  >
                    <option value="Cartons">Cartons</option>
                    <option value="Numbers">Numbers (Units)</option>
                    <option value="Packets">Packets</option>
                    <option value="Boxes">Boxes</option>
                    <option value="kg">kg (Kilograms)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Threshold Limit *</label>
                  <input
                    type="number"
                    required
                    placeholder="50"
                    value={addStockData.minQuantity}
                    onChange={e => setAddStockData({ ...addStockData, minQuantity: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-amber-700"
                  />
                </div>
              </div>

              {/* Dynamic Multiple Batches List Section */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-black text-rose-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-rose-600" />
                    Batches List under Stock ({addStockData.batches.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddBatchRow}
                    className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 rounded-xl text-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Another Batch ID</span>
                  </button>
                </div>

                {addStockData.batches.map((batch, bIdx) => (
                  <div key={bIdx} className="bg-rose-50/40 p-3 rounded-2xl border border-rose-200/80 space-y-2 relative">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 text-xs">Batch #{bIdx + 1}</span>
                      {addStockData.batches.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBatchRow(bIdx)}
                          className="text-rose-600 hover:text-rose-800 font-bold text-xs flex items-center gap-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Batch ID *</label>
                        <input
                          type="text"
                          required
                          value={batch.batchId}
                          onChange={e => {
                            const updated = [...addStockData.batches];
                            updated[bIdx].batchId = e.target.value;
                            setAddStockData({ ...addStockData, batches: updated });
                          }}
                          className="w-full p-2 bg-white border rounded-xl font-mono font-bold text-rose-700"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Stock Count ({addStockData.unit}) *</label>
                        <input
                          type="number"
                          required
                          placeholder="100"
                          value={batch.quantity}
                          onChange={e => {
                            const updated = [...addStockData.batches];
                            updated[bIdx].quantity = e.target.value;
                            setAddStockData({ ...addStockData, batches: updated });
                          }}
                          className="w-full p-2 bg-white border rounded-xl font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Mfg Date</label>
                        <input
                          type="date"
                          value={batch.mfgDate}
                          onChange={e => {
                            const updated = [...addStockData.batches];
                            updated[bIdx].mfgDate = e.target.value;
                            setAddStockData({ ...addStockData, batches: updated });
                          }}
                          className="w-full p-2 bg-white border rounded-xl cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Expiry Date</label>
                        <input
                          type="date"
                          value={batch.expiryDate}
                          onChange={e => {
                            const updated = [...addStockData.batches];
                            updated[bIdx].expiryDate = e.target.value;
                            setAddStockData({ ...addStockData, batches: updated });
                          }}
                          className="w-full p-2 bg-white border rounded-xl cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Storage Location</label>
                        <input
                          type="text"
                          placeholder="Rack A, Warehouse 1"
                          value={batch.storageLocation}
                          onChange={e => {
                            const updated = [...addStockData.batches];
                            updated[bIdx].storageLocation = e.target.value;
                            setAddStockData({ ...addStockData, batches: updated });
                          }}
                          className="w-full p-2 bg-white border rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddStockModal(false)} className="px-4 py-2 border rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg cursor-pointer">
                  Save Stock & {addStockData.batches.length} Batch{addStockData.batches.length > 1 ? 'es' : ''}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ISSUE MATERIAL TO OPERATIONS & YIELD/SCRAP ENTRY ── */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 my-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-600" />
                Issue Stock to Operations
              </h3>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Stock Batch *</label>
                <select
                  required
                  value={selectedStockForIssue}
                  onChange={e => setSelectedStockForIssue(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold cursor-pointer"
                >
                  <option value="">-- Choose Stock Batch --</option>
                  {stocks.map(s => (
                    <option key={s.id || s._id} value={s.id || s.stockId}>
                      {s.itemName || s.product?.name} ({s.batchId}) - Count: {s.quantity} {s.unit || 'Cartons'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Issue Count (Cartons / Numbers) *</label>
                  <input
                    type="number"
                    required
                    placeholder="100"
                    value={issueQuantity}
                    onChange={e => setIssueQuantity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Process</label>
                  <select
                    value={targetProcess}
                    onChange={e => setTargetProcess(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold cursor-pointer"
                  >
                    <option value="Grinding & Mixing Unit">Grinding & Mixing Unit</option>
                    <option value="Roasting Process">Roasting Process</option>
                    <option value="Packaging & Sealing">Packaging & Sealing</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-amber-50 p-3 rounded-2xl border border-amber-200">
                <div>
                  <label className="block font-bold text-amber-900 mb-1">Expected Yield Count</label>
                  <input
                    type="number"
                    placeholder="e.g. 95"
                    value={yieldQuantity}
                    onChange={e => setYieldQuantity(e.target.value)}
                    className="w-full p-2 bg-white border border-amber-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-amber-900 mb-1">Scrap / Wastage Count</label>
                  <input
                    type="number"
                    placeholder="e.g. 5"
                    value={scrapQuantity}
                    onChange={e => setScrapQuantity(e.target.value)}
                    className="w-full p-2 bg-white border border-amber-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Batch processing order"
                  value={issueNotes}
                  onChange={e => setIssueNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowIssueModal(false)} className="px-4 py-2 border rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-lg cursor-pointer">Confirm Transfer to Operations</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: CREATE FINISHED GOODS BATCH ── */}
      {showFGModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 my-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-600" />
                Create Finished Goods Batch ID
              </h3>
              <button onClick={() => setShowFGModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleFGSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Finished Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium Chili Powder (200g Packets)"
                  value={fgData.itemName}
                  onChange={e => setFgData({ ...fgData, itemName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
                <div>
                  <label className="block font-bold text-emerald-900 mb-1">Number of Cartons *</label>
                  <input
                    type="number"
                    required
                    placeholder="50"
                    value={fgData.cartonsCount}
                    onChange={e => setFgData({ ...fgData, cartonsCount: e.target.value })}
                    className="w-full p-2 bg-white border border-emerald-300 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-emerald-900 mb-1">Packets per Carton *</label>
                  <input
                    type="number"
                    required
                    placeholder="20"
                    value={fgData.packetsPerCarton}
                    onChange={e => setFgData({ ...fgData, packetsPerCarton: e.target.value })}
                    className="w-full p-2 bg-white border border-emerald-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={fgData.expiryDate}
                    onChange={e => setFgData({ ...fgData, expiryDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Warehouse Location</label>
                  <input
                    type="text"
                    value={fgData.storageLocation}
                    onChange={e => setFgData({ ...fgData, storageLocation: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowFGModal(false)} className="px-4 py-2 border rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg cursor-pointer">Generate FG Batch ID & Ready for Sales</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: EDIT STOCK & MIN THRESHOLD LIMIT ── */}
      {showEditModal && editItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-sm">Edit Stock Count & Location</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <p className="font-black text-slate-800">{editItem.itemName || editItem.product?.name} ({editItem.batchId})</p>
              
              <div>
                <label className="block font-bold text-slate-700 mb-1">Stock Count (Cartons / Numbers)</label>
                <input
                  type="number"
                  required
                  value={editQty}
                  onChange={e => setEditQty(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Minimum Alert Threshold Limit</label>
                <input
                  type="number"
                  required
                  value={editMinQty}
                  onChange={e => setEditMinQty(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl font-bold text-rose-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-3 py-2 border rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" disabled={editSaving} className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
