// src/pages/admin/MaterialIssuePage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  ArrowRightLeft,
  Package,
  Boxes,
  CheckCircle2,
  AlertTriangle,
  Search,
  RefreshCw,
  Plus,
  Layers,
  TrendingUp,
  Factory,
  CheckCheck,
  Send,
  X,
  Trash2,
  ChevronRight,
  ArrowLeft,
  Calculator,
  IndianRupee,
  AlertCircle,
  Check,
  Tag
} from 'lucide-react';

export default function MaterialIssuePage() {
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Issue Material Modal state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [issueData, setIssueData] = useState({
    stockId: '',
    targetProduct: '',
    issueQuantity: '',
    targetProcess: 'Roasting & Grinding',
    yieldQuantity: '',
    scrapQuantity: '',
    notes: ''
  });

  // Finish Goods Modal state
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [finishData, setFinishData] = useState({
    itemName: '',
    cartonsCount: '',
    packetsPerCarton: '24',
    storageLocation: 'Finished Goods Depot, Rack B',
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  });

  const [activeTab, setActiveTab] = useState('wip'); // 'wip' | 'available' | 'bom'

  // ─── ISSUE MATERIAL WIZARD STATE (MULTI-MATERIAL FIFO OLD/LATEST STOCK) ───
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1 = Product & Raw Selection, 2 = Stock & Price Breakdown Table
  const [wizardProduct, setWizardProduct] = useState('');
  const [wizardProductQty, setWizardProductQty] = useState('');
  const [wizardProductUnit, setWizardProductUnit] = useState('kg');
  const [rawSearchQuery, setRawSearchQuery] = useState('');
  const [selectedRawMaterials, setSelectedRawMaterials] = useState([]); // [{ itemName, category, subCategory, unit, totalAvailable, costPerUnit, issueQuantity }]
  const [wizardSubmitting, setWizardSubmitting] = useState(false);
  const [wizardError, setWizardError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stockRes, prodRes] = await Promise.all([
        axios.get('/inventory/company').catch(() => ({ data: { data: [] } })),
        axios.get('/products?limit=200').catch(() => ({ data: { data: [] } }))
      ]);
      setStocks(stockRes.data?.data || []);
      setProducts(prodRes.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch data for material issue:', err);
    } finally {
      setLoading(false);
    }
  };

  // Raw materials and packaging available for issue
  const availableRawMaterials = useMemo(() => {
    return stocks.filter(s => s.category !== 'WIP' && (Number(s.quantity) > 0));
  }, [stocks]);

  // Work in Progress (WIP) batches currently issued to operations
  const wipBatches = useMemo(() => {
    return stocks.filter(s => s.category === 'WIP' || s.status === 'In Production');
  }, [stocks]);

  // Selected stock item in issue modal
  const currentSelectedStock = useMemo(() => {
    return stocks.find(s => s.id === issueData.stockId || s.stockId === issueData.stockId);
  }, [stocks, issueData.stockId]);

  // Group available stocks into unique raw materials with total available quantities
  const uniqueRawMaterials = useMemo(() => {
    const map = new Map();
    availableRawMaterials.forEach(s => {
      const name = (s.itemName || '').trim();
      if (!name) return;
      const key = name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          itemName: name,
          category: s.category || 'Raw Material',
          subCategory: s.subCategory || '',
          unit: s.unit || 'kg',
          totalAvailable: 0,
          costPerUnit: s.costPerUnit || 95,
          batchesCount: 0
        });
      }
      const entry = map.get(key);
      entry.totalAvailable += Number(s.quantity) || 0;
      entry.batchesCount += 1;
    });
    return Array.from(map.values()).filter(r => r.totalAvailable > 0);
  }, [availableRawMaterials]);

  // Filter raw materials based on search query in the wizard
  const filteredSearchRawMaterials = useMemo(() => {
    const q = rawSearchQuery.toLowerCase().trim();
    if (!q) return uniqueRawMaterials.slice(0, 8);
    return uniqueRawMaterials.filter(r =>
      r.itemName.toLowerCase().includes(q) ||
      (r.category && r.category.toLowerCase().includes(q)) ||
      (r.subCategory && r.subCategory.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [uniqueRawMaterials, rawSearchQuery]);

  // When clicking a raw material: adds to TOP of list or moves to top
  const handleSelectRawMaterial = (rawItem) => {
    setSelectedRawMaterials(prev => {
      const existing = prev.find(p => p.itemName.toLowerCase() === rawItem.itemName.toLowerCase());
      if (existing) {
        // Move to top
        const without = prev.filter(p => p.itemName.toLowerCase() !== rawItem.itemName.toLowerCase());
        return [existing, ...without];
      }
      // Add new item to TOP
      return [
        {
          ...rawItem,
          issueQuantity: ''
        },
        ...prev
      ];
    });
    setRawSearchQuery('');
    setWizardError('');
  };

  // Change quantity for a selected material
  const handleQuantityChange = (itemName, qty) => {
    setSelectedRawMaterials(prev =>
      prev.map(item =>
        item.itemName.toLowerCase() === itemName.toLowerCase()
          ? { ...item, issueQuantity: qty }
          : item
      )
    );
    setWizardError('');
  };

  // Remove material from selection
  const handleRemoveMaterial = (itemName) => {
    setSelectedRawMaterials(prev => prev.filter(item => item.itemName.toLowerCase() !== itemName.toLowerCase()));
  };

  // Move from Step 1 to Step 2
  const handleGoToNextStep = () => {
    if (!wizardProduct.trim()) {
      setWizardError('Please enter or select the target finished product.');
      return;
    }
    if (!wizardProductQty || Number(wizardProductQty) <= 0) {
      setWizardError('Please enter a valid product quantity to produce.');
      return;
    }
    if (selectedRawMaterials.length === 0) {
      setWizardError('Please select at least one raw material under the search bar.');
      return;
    }
    for (const mat of selectedRawMaterials) {
      const q = Number(mat.issueQuantity);
      if (!q || q <= 0) {
        setWizardError(`Please enter a valid quantity for "${mat.itemName}".`);
        return;
      }
      if (q > mat.totalAvailable) {
        setWizardError(`Quantity for "${mat.itemName}" (${q} ${mat.unit}) exceeds available stock (${mat.totalAvailable} ${mat.unit}).`);
        return;
      }
    }
    setWizardError('');
    setWizardStep(2);
  };

  // Calculate Old Stock vs Latest Stock breakdown table (FIFO)
  const calculatedBreakdown = useMemo(() => {
    return selectedRawMaterials.map(mat => {
      const reqQty = Number(mat.issueQuantity) || 0;
      // Get all stock batches for this raw material sorted by date (oldest first)
      const batches = stocks.filter(s =>
        (s.itemName || '').trim().toLowerCase() === mat.itemName.trim().toLowerCase() &&
        Number(s.quantity) > 0
      ).sort((a, b) => new Date(a.createdAt || a.mfgDate || 0) - new Date(b.createdAt || b.mfgDate || 0));

      let oldBatch = null;
      let latestBatch = null;

      if (batches.length >= 2) {
        oldBatch = batches[0];
        latestBatch = batches[batches.length - 1];
      } else if (batches.length === 1) {
        oldBatch = batches[0];
        latestBatch = {
          id: null,
          stockId: 'None (Single Batch)',
          batchId: 'N/A',
          quantity: 0,
          costPerUnit: oldBatch.costPerUnit || 95,
          unit: oldBatch.unit || mat.unit
        };
      } else {
        oldBatch = {
          id: null,
          stockId: 'STK-OLD',
          batchId: 'LOT-1',
          quantity: mat.totalAvailable,
          costPerUnit: mat.costPerUnit || 95,
          unit: mat.unit
        };
        latestBatch = {
          id: null,
          stockId: 'STK-NEW',
          batchId: 'LOT-2',
          quantity: 0,
          costPerUnit: mat.costPerUnit || 95,
          unit: mat.unit
        };
      }

      // Old Stock Calculations
      const oldStockQty = Number(oldBatch.quantity) || 0;
      const oldStockRate = Number(oldBatch.costPerUnit) || 95;
      const oldTakenQty = Math.min(reqQty, oldStockQty);
      const oldRemainingQty = Math.max(0, oldStockQty - oldTakenQty);
      const oldTakenPrice = Number((oldTakenQty * oldStockRate).toFixed(2));

      // Latest Stock Calculations
      const neededFromLatest = Math.max(0, reqQty - oldTakenQty);
      const latestStockQty = Number(latestBatch.quantity) || 0;
      const latestStockRate = Number(latestBatch.costPerUnit) || oldStockRate;
      const latestTakenQty = Math.min(neededFromLatest, latestStockQty);
      const latestRemainingQty = Math.max(0, latestStockQty - latestTakenQty);
      const latestTakenPrice = Number((latestTakenQty * latestStockRate).toFixed(2));

      // Total price of this raw material
      const totalPrice = Number((oldTakenPrice + latestTakenPrice).toFixed(2));

      return {
        itemName: mat.itemName,
        category: mat.category,
        unit: mat.unit,
        totalRequested: reqQty,

        // Old Stock
        oldStockId: oldBatch.id || oldBatch.stockId,
        oldBatchId: oldBatch.batchId,
        oldStockQty,
        oldTakenQty,
        oldRemainingQty,
        oldStockRate,
        oldTakenPrice,

        // Latest Stock
        latestStockId: latestBatch.id || latestBatch.stockId,
        latestBatchId: latestBatch.batchId,
        latestStockQty,
        latestTakenQty,
        latestRemainingQty,
        latestStockRate,
        latestTakenPrice,

        // Total
        totalPrice
      };
    });
  }, [selectedRawMaterials, stocks]);

  // Overall Total Price across all materials
  const overallPrice = useMemo(() => {
    return Number(calculatedBreakdown.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toFixed(2));
  }, [calculatedBreakdown]);

  // Submit Final Issue Material
  const handleFinalIssueMaterial = async () => {
    setWizardSubmitting(true);
    setWizardError('');

    try {
      const res = await axios.post('/inventory/company/issue-production', {
        targetProduct: wizardProduct.trim(),
        productQuantity: Number(wizardProductQty),
        productUnit: wizardProductUnit,
        items: calculatedBreakdown,
        overallPrice,
        targetProcess: 'Batch Production'
      });

      if (res.data?.success) {
        setMessage({
          text: res.data.message || `Successfully issued ${calculatedBreakdown.length} materials for ${wizardProduct}! Total cost: ₹${overallPrice}`,
          type: 'success'
        });
        setShowWizardModal(false);
        setWizardStep(1);
        setWizardProduct('');
        setWizardProductQty('');
        setSelectedRawMaterials([]);
        fetchData();
      }
    } catch (err) {
      setWizardError(err.response?.data?.message || err.message || 'Failed to issue materials to production.');
    } finally {
      setWizardSubmitting(false);
    }
  };

  // Handle Material Issue Submission
  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueData.stockId || !issueData.issueQuantity) {
      setMessage({ text: 'Please select a raw material and quantity to issue.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const targetProcessDesc = issueData.targetProduct 
        ? `${issueData.targetProduct} — ${issueData.targetProcess}` 
        : issueData.targetProcess;

      const res = await axios.post('/inventory/company/issue-production', {
        stockId: issueData.stockId,
        issueQuantity: Number(issueData.issueQuantity),
        targetProcess: targetProcessDesc,
        yieldQuantity: issueData.yieldQuantity ? Number(issueData.yieldQuantity) : undefined,
        scrapQuantity: issueData.scrapQuantity ? Number(issueData.scrapQuantity) : undefined,
        notes: issueData.notes
      });

      if (res.data?.success) {
        setMessage({ text: res.data.message || 'Material issued to production successfully!', type: 'success' });
        setShowIssueModal(false);
        setIssueData({
          stockId: '',
          targetProduct: '',
          issueQuantity: '',
          targetProcess: 'Roasting & Grinding',
          yieldQuantity: '',
          scrapQuantity: '',
          notes: ''
        });
        fetchData();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to issue material to production', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Finishing Goods Batch
  const handleFinishSubmit = async (e) => {
    e.preventDefault();
    if (!finishData.itemName || !finishData.cartonsCount) {
      setMessage({ text: 'Please specify the finished product and carton count.', type: 'error' });
      return;
    }

    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await axios.post('/inventory/company/finished-goods', finishData);
      if (res.data?.success) {
        setMessage({ text: res.data.message || 'Finished Goods batch completed and stored!', type: 'success' });
        setShowFinishModal(false);
        setFinishData({
          itemName: '',
          cartonsCount: '',
          packetsPerCarton: '24',
          storageLocation: 'Finished Goods Depot, Rack B',
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: ''
        });
        fetchData();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to finish goods batch', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered WIP items
  const filteredWip = wipBatches.filter(item => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (item.itemName && item.itemName.toLowerCase().includes(q)) ||
      (item.batchId && item.batchId.toLowerCase().includes(q)) ||
      (item.stockId && item.stockId.toLowerCase().includes(q)) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  // Filtered available raw materials
  const filteredRaw = availableRawMaterials.filter(item => {
    const q = search.toLowerCase().trim();
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    if (!q) return matchesCategory;
    const matchesSearch = (
      (item.itemName && item.itemName.toLowerCase().includes(q)) ||
      (item.batchId && item.batchId.toLowerCase().includes(q)) ||
      (item.storageLocation && item.storageLocation.toLowerCase().includes(q))
    );
    return matchesCategory && matchesSearch;
  });

  // Standard Recipe / Formulation Reference (BOM)
  const standardRecipes = [
    {
      productName: 'Traditional Idly Podi 200g',
      sku: 'MF-IDL-200',
      batchSize: '100 kg Output Batch',
      rawIngredients: [
        { name: 'Urad Dal (Split Black Gram)', qty: '50 kg', percentage: '50%' },
        { name: 'Chana Dal (Bengal Gram)', qty: '25 kg', percentage: '25%' },
        { name: 'Red Chili Special', qty: '15 kg', percentage: '15%' },
        { name: 'Curry Leaves & Asafoetida', qty: '5 kg', percentage: '5%' },
        { name: 'Iodized Salt', qty: '5 kg', percentage: '5%' }
      ],
      packaging: '500 Pouches (200g) + 21 Outer Cartons'
    },
    {
      productName: 'Millet Health Mix 500g',
      sku: 'MF-MLT-500',
      batchSize: '150 kg Output Batch',
      rawIngredients: [
        { name: 'Finger Millet (Ragi)', qty: '60 kg', percentage: '40%' },
        { name: 'Pearl Millet (Kambu)', qty: '30 kg', percentage: '20%' },
        { name: 'Roasted Bengal Gram', qty: '20 kg', percentage: '13%' },
        { name: 'Almonds & Cashews', qty: '15 kg', percentage: '10%' },
        { name: 'Cardamom & Dry Ginger', qty: '5 kg', percentage: '3%' },
        { name: 'Red Rice & Green Gram', qty: '20 kg', percentage: '14%' }
      ],
      packaging: '300 Packets (500g) + 13 Master Cartons'
    },
    {
      productName: 'Coriander Rice Mix 100g',
      sku: 'MF-COR-100',
      batchSize: '50 kg Output Batch',
      rawIngredients: [
        { name: 'Dried Coriander Seeds', qty: '25 kg', percentage: '50%' },
        { name: 'Cumin & Black Pepper', qty: '10 kg', percentage: '20%' },
        { name: 'Urad Dal & Chana Dal', qty: '10 kg', percentage: '20%' },
        { name: 'Turmeric & Spices', qty: '5 kg', percentage: '10%' }
      ],
      packaging: '500 Sachets (100g) + 10 Shipping Boxes'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-rose-600" />
            Material Issue for Products
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Issue raw manufacturing ingredients & packaging materials to production lines for finished goods batches.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFinishModal(true)}
            className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Complete Batch (FG)</span>
          </button>
          <button
            onClick={() => {
              setWizardStep(1);
              setWizardProduct('');
              setWizardProductQty('');
              setWizardProductUnit('kg');
              setSelectedRawMaterials([]);
              setRawSearchQuery('');
              setWizardError('');
              setShowWizardModal(true);
            }}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white text-xs font-black px-4 py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Issue Material</span>
          </button>
        </div>
      </div>

      {/* Message feedback */}
      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
            : 'bg-rose-50 text-rose-800 border border-rose-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span className="flex-1">{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
        </div>
      )}

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <Factory className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">In Production (WIP)</p>
            <h3 className="text-lg font-black text-slate-800">{wipBatches.length} Batches</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Raw Stocks Available</p>
            <h3 className="text-lg font-black text-slate-800">{availableRawMaterials.length} Items</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Catalog Products</p>
            <h3 className="text-lg font-black text-slate-800">{products.length} SKUs</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Average Yield</p>
            <h3 className="text-lg font-black text-slate-800">96.8%</h3>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('wip')}
          className={`pb-3 transition-colors relative cursor-pointer ${
            activeTab === 'wip'
              ? 'text-rose-600 border-b-2 border-rose-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Production Batches (WIP) ({wipBatches.length})
        </button>
        <button
          onClick={() => setActiveTab('available')}
          className={`pb-3 transition-colors relative cursor-pointer ${
            activeTab === 'available'
              ? 'text-rose-600 border-b-2 border-rose-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Raw Materials Available ({availableRawMaterials.length})
        </button>
        <button
          onClick={() => setActiveTab('bom')}
          className={`pb-3 transition-colors relative cursor-pointer ${
            activeTab === 'bom'
              ? 'text-rose-600 border-b-2 border-rose-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Standard Recipe (BOM) Formulations
        </button>
      </div>

      {/* Controls row */}
      {activeTab !== 'bom' && (
        <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 sm:p-4 border border-slate-150 rounded-2xl shadow-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === 'wip' ? "Search batch ID, product name, or process..." : "Search raw materials or location..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none transition-all font-medium"
            />
          </div>

          {activeTab === 'available' && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none font-semibold text-slate-600 cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="Raw Materials">Raw Materials</option>
              <option value="Packaging Materials">Packaging Materials</option>
              <option value="Spices & Seasoning">Spices & Seasoning</option>
            </select>
          )}

          <button
            onClick={fetchData}
            className="inline-flex items-center space-x-1.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      )}

      {/* TAB 1: Active Production Batches (WIP) */}
      {activeTab === 'wip' && (
        <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
            </div>
          ) : filteredWip.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 font-medium">
              No active batches currently in production. Click <span className="font-bold text-rose-600">"Issue Material to Product"</span> above to start a production run.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="py-3 px-4">Batch ID / Stock</th>
                    <th className="py-3 px-4">Target Product & Process</th>
                    <th className="py-3 px-4">Current Yield / Qty</th>
                    <th className="py-3 px-4">Processing Floor</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Notes / Scrap</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredWip.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{item.batchId}</span>
                        <span className="text-[10px] text-slate-400">{item.stockId}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{item.itemName}</p>
                        <span className="text-[10px] text-rose-600 font-semibold">{item.category}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-black text-slate-800 text-sm">{item.quantity}</span>{' '}
                        <span className="text-[10px] text-slate-500 font-bold">{item.unit || 'Units'}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {item.storageLocation || 'Processing Floor, Unit 1'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase">
                          {item.status || 'In Production'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                        {item.notes || 'Normal production processing'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setFinishData(prev => ({
                              ...prev,
                              itemName: item.itemName.replace(/\s*\(.*\)/, '').trim(),
                              notes: `Completed from ${item.batchId}`
                            }));
                            setShowFinishModal(true);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Finish & Depot
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Raw Materials Available for Issue */}
      {activeTab === 'available' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRaw.map((stock) => (
            <div key={stock.id} className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
                      <Boxes className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">{stock.itemName}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{stock.stockId}</span>
                    </div>
                  </div>
                  <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {stock.category}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Available Qty</span>
                    <span className="font-black text-slate-800 text-sm">
                      {stock.quantity} <span className="text-[10px] text-slate-500 font-normal">{stock.unit}</span>
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">Location</span>
                    <span className="font-medium text-slate-600 text-[11px] truncate block">
                      {stock.storageLocation || 'Main Warehouse'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono">
                  Batch: {stock.batchId || 'N/A'}
                </span>
                <button
                  onClick={() => {
                    setIssueData(prev => ({
                      ...prev,
                      stockId: stock.id,
                      issueQuantity: ''
                    }));
                    setShowIssueModal(true);
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Issue Material</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Standard Recipe Formulations (BOM) */}
      {activeTab === 'bom' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {standardRecipes.map((recipe) => (
            <div key={recipe.sku} className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-slate-800 text-sm leading-tight">{recipe.productName}</h3>
                    <span className="text-[10px] font-mono font-bold text-rose-600">{recipe.sku}</span>
                  </div>
                  <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {recipe.batchSize}
                  </span>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                    <Layers className="w-3 h-3 text-rose-500" />
                    Required Ingredients Breakdown
                  </span>
                  <div className="space-y-1.5">
                    {recipe.rawIngredients.map((ing, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-100/80">
                        <span className="font-semibold text-slate-700 truncate pr-2">{ing.name}</span>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className="font-black text-slate-800">{ing.qty}</span>
                          <span className="text-[10px] text-slate-400">({ing.percentage})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50/70 border border-amber-100 p-2.5 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-amber-900 block text-[10px] uppercase">Packaging Requirement:</span>
                  <p className="text-amber-800 font-medium text-[11px] leading-tight">{recipe.packaging}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setWizardProduct(recipe.productName);
                  setWizardProductQty('100');
                  setWizardProductUnit('kg');
                  setWizardStep(1);
                  setSelectedRawMaterials([]);
                  setRawSearchQuery('');
                  setWizardError('');
                  setShowWizardModal(true);
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-xl transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Issue Material for {recipe.productName}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Issue Material to Product */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                  Issue Material to Product Batch
                </h3>
              </div>
              <button 
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="p-5 space-y-4 text-xs">
              {/* Target Finished Product */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Target Product Being Produced</label>
                <select
                  value={issueData.targetProduct}
                  onChange={(e) => setIssueData(prev => ({ ...prev, targetProduct: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold text-slate-800 cursor-pointer"
                >
                  <option value="">Select Target Catalog Product (or type custom)...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.name}>{p.name} ({p.sku})</option>
                  ))}
                  <option value="Traditional Idly Podi 200g">Traditional Idly Podi 200g</option>
                  <option value="Millet Health Mix 500g">Millet Health Mix 500g</option>
                  <option value="Coriander Rice Mix 100g">Coriander Rice Mix 100g</option>
                </select>
              </div>

              {/* Raw Material Selection */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Raw Ingredient / Material to Issue *</label>
                <select
                  required
                  value={issueData.stockId}
                  onChange={(e) => setIssueData(prev => ({ ...prev, stockId: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold text-slate-800 cursor-pointer"
                >
                  <option value="">Select Raw Material Stock...</option>
                  {availableRawMaterials.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.itemName} — Available: {s.quantity} {s.unit} ({s.storageLocation || 'Main Wh'})
                    </option>
                  ))}
                </select>
                {currentSelectedStock && (
                  <p className="mt-1 text-[11px] text-emerald-700 font-semibold">
                    Current Available Stock: {currentSelectedStock.quantity} {currentSelectedStock.unit}
                  </p>
                )}
              </div>

              {/* Issue Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Issue Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="any"
                    max={currentSelectedStock ? currentSelectedStock.quantity : undefined}
                    placeholder="e.g. 50"
                    value={issueData.issueQuantity}
                    onChange={(e) => setIssueData(prev => ({ ...prev, issueQuantity: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Production Process / Stage</label>
                  <select
                    value={issueData.targetProcess}
                    onChange={(e) => setIssueData(prev => ({ ...prev, targetProcess: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-semibold text-slate-700 cursor-pointer"
                  >
                    <option value="Cleaning & Destoning">Cleaning & Destoning</option>
                    <option value="Roasting & Toasting">Roasting & Toasting</option>
                    <option value="Grinding & Pulverizing">Grinding & Pulverizing</option>
                    <option value="Blending & Spice Mixing">Blending & Spice Mixing</option>
                    <option value="Pouch Filling & Sealing">Pouch Filling & Sealing</option>
                    <option value="Master Carton Packaging">Master Carton Packaging</option>
                  </select>
                </div>
              </div>

              {/* Expected Yield & Scrap */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Expected Output Yield</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 48"
                    value={issueData.yieldQuantity}
                    onChange={(e) => setIssueData(prev => ({ ...prev, yieldQuantity: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Allowed Scrap / Loss</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 2"
                    value={issueData.scrapQuantity}
                    onChange={(e) => setIssueData(prev => ({ ...prev, scrapQuantity: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Production Notes & Instructions</label>
                <textarea
                  rows="2"
                  placeholder="e.g. Roast at 120°C for 15 mins before grinding..."
                  value={issueData.notes}
                  onChange={(e) => setIssueData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none text-slate-700"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all text-center flex items-center justify-center space-x-1.5 cursor-pointer disabled:bg-slate-200"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Issuing...' : 'Confirm Issue'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Finish Goods Batch */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <div className="flex items-center space-x-2">
                <CheckCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                  Complete Finished Goods Batch
                </h3>
              </div>
              <button 
                onClick={() => setShowFinishModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFinishSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Finished Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Traditional Idly Podi 200g"
                  value={finishData.itemName}
                  onChange={(e) => setFinishData(prev => ({ ...prev, itemName: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl focus:outline-none font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Cartons Count *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 20"
                    value={finishData.cartonsCount}
                    onChange={(e) => setFinishData(prev => ({ ...prev, cartonsCount: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl focus:outline-none font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Packets per Carton</label>
                  <input
                    type="number"
                    value={finishData.packetsPerCarton}
                    onChange={(e) => setFinishData(prev => ({ ...prev, packetsPerCarton: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl focus:outline-none font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Storage Location</label>
                  <input
                    type="text"
                    value={finishData.storageLocation}
                    onChange={(e) => setFinishData(prev => ({ ...prev, storageLocation: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl focus:outline-none font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={finishData.expiryDate}
                    onChange={(e) => setFinishData(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl focus:outline-none font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Batch Notes</label>
                <textarea
                  rows="2"
                  placeholder="Quality passed, ready for dispatch..."
                  value={finishData.notes}
                  onChange={(e) => setFinishData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl focus:outline-none text-slate-700"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowFinishModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-emerald-200 transition-all text-center flex items-center justify-center space-x-1.5 cursor-pointer disabled:bg-slate-200"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Completing...' : 'Save Finished Batch'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: ISSUE MATERIAL WIZARD (STEP 1: SELECTION, STEP 2: TABLE BREAKDOWN) ─── */}
      {showWizardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className={`bg-white w-full ${wizardStep === 2 ? 'max-w-6xl' : 'max-w-3xl'} rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-zoom-in my-6 transition-all duration-300`}>
            
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-rose-50 via-white to-amber-50">
              <div className="flex items-center space-x-3">
                <span className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs">
                  <ArrowRightLeft className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg">
                    {wizardStep === 1 ? 'Issue Material — Product & Ingredients' : 'Material Issue — Old vs Latest Stock & Pricing Breakdown'}
                  </h3>
                  <p className="text-slate-500 text-xs">
                    {wizardStep === 1 
                      ? 'Step 1 of 2: Specify target product, quantity, and select raw materials to issue' 
                      : 'Step 2 of 2: FIFO stock allocation, old/latest stock breakdown, and overall price'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowWizardModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner */}
            {wizardError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{wizardError}</span>
              </div>
            )}

            {/* STEP 1: PRODUCT & RAW MATERIAL SELECTION */}
            {wizardStep === 1 && (
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* 1. Enter Target Product & Quantity */}
                <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-black flex items-center justify-center">1</span>
                    <h4 className="font-black text-slate-800 text-sm">Target Finished Product & Batch Quantity</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-600 font-bold text-xs mb-1">
                        Enter Product Being Produced *
                      </label>
                      <input
                        type="text"
                        list="catalog-products-list"
                        placeholder="e.g. Traditional Idly Podi 200g, Roasted Ragi Flour..."
                        value={wizardProduct}
                        onChange={(e) => {
                          setWizardProduct(e.target.value);
                          setWizardError('');
                        }}
                        className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none font-bold text-slate-800 text-xs shadow-2xs"
                      />
                      <datalist id="catalog-products-list">
                        {products.map(p => (
                          <option key={p.id} value={p.name} />
                        ))}
                        <option value="Traditional Idly Podi 200g" />
                        <option value="Millet Health Mix 500g" />
                        <option value="Coriander Rice Mix 100g" />
                        <option value="Roasted Gram Flour 500g" />
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold text-xs mb-1">
                        Batch Quantity *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          placeholder="e.g. 100"
                          value={wizardProductQty}
                          onChange={(e) => {
                            setWizardProductQty(e.target.value);
                            setWizardError('');
                          }}
                          className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none font-bold text-slate-800 text-xs shadow-2xs"
                        />
                        <select
                          value={wizardProductUnit}
                          onChange={(e) => setWizardProductUnit(e.target.value)}
                          className="p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none font-bold text-slate-700 text-xs shrink-0 cursor-pointer shadow-2xs"
                        >
                          <option value="kg">kg</option>
                          <option value="grams">grams</option>
                          <option value="Cartons">Cartons</option>
                          <option value="Packets">Packets</option>
                          <option value="Liters">Liters</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Search Bar to Select Raw Material */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-rose-600 text-white text-xs font-black flex items-center justify-center">2</span>
                      <h4 className="font-black text-slate-800 text-sm">Select Raw Materials to Issue</h4>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500">
                      {selectedRawMaterials.length} item(s) selected
                    </span>
                  </div>

                  {/* Search Bar Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search raw material by name, category, or subcategory to add..."
                      value={rawSearchQuery}
                      onChange={(e) => setRawSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-9 py-2.5 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none transition-all font-medium shadow-2xs"
                    />
                    {rawSearchQuery && (
                      <button
                        onClick={() => setRawSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Search Suggestions dropdown / quick results */}
                  {filteredSearchRawMaterials.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                      <div className="px-3 py-1.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Available Raw Materials in Stock (Click to add):
                      </div>
                      {filteredSearchRawMaterials.map((item, idx) => {
                        const isAlreadySelected = selectedRawMaterials.some(s => s.itemName.toLowerCase() === item.itemName.toLowerCase());
                        return (
                          <div
                            key={idx}
                            onClick={() => handleSelectRawMaterial(item)}
                            className="p-2.5 hover:bg-rose-50/60 rounded-xl cursor-pointer flex items-center justify-between transition-colors group"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs group-hover:text-rose-700">
                                  {item.itemName}
                                </span>
                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded">
                                  {item.category}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-500">
                                {item.subCategory ? `${item.subCategory} • ` : ''}Rate: ₹{item.costPerUnit}/{item.unit}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                {item.totalAvailable} {item.unit}
                              </span>
                              <span className={`px-2 py-1 text-[11px] font-bold rounded-lg ${isAlreadySelected ? 'bg-slate-100 text-slate-500' : 'bg-rose-600 text-white shadow-2xs group-hover:bg-rose-700'}`}>
                                {isAlreadySelected ? 'Selected (Move to top)' : '+ Add'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 3. Listed Under the Search Bar (Newly selected is always on TOP) */}
                  <div className="space-y-2.5 pt-2">
                    <label className="block text-slate-600 font-bold text-xs uppercase tracking-wider">
                      Selected Raw Materials for this Batch ({selectedRawMaterials.length})
                    </label>

                    {selectedRawMaterials.length === 0 ? (
                      <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 bg-slate-50/50">
                        <Boxes className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-semibold">No raw materials selected yet.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Use the search bar above to click and add ingredients for this product.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {selectedRawMaterials.map((mat, idx) => (
                          <div
                            key={mat.itemName}
                            className={`p-3.5 bg-white border ${idx === 0 ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'} rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {idx === 0 && (
                                  <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-black uppercase rounded tracking-wide">
                                    Latest Added
                                  </span>
                                )}
                                <h5 className="font-bold text-slate-900 text-xs sm:text-sm">
                                  {mat.itemName}
                                </h5>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                                  {mat.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Total Available in Stock: <strong className="text-emerald-700">{mat.totalAvailable} {mat.unit}</strong> • Standard Rate: ₹{mat.costPerUnit}/{mat.unit}
                              </p>
                            </div>

                            {/* Quantity Input for this Raw Material */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0.01"
                                  step="any"
                                  max={mat.totalAvailable}
                                  placeholder="Enter qty"
                                  value={mat.issueQuantity}
                                  onChange={(e) => handleQuantityChange(mat.itemName, e.target.value)}
                                  className="w-28 sm:w-32 py-1.5 px-3 bg-slate-50 border border-slate-300 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold text-slate-900 text-xs"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
                                  {mat.unit}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleQuantityChange(mat.itemName, mat.totalAvailable)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
                                title="Use max available stock"
                              >
                                Max
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRemoveMaterial(mat.itemName)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                                title="Remove raw material"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: OLD STOCK VS LATEST STOCK & PRICING BREAKDOWN TABLE */}
            {wizardStep === 2 && (
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* Product Summary Header Banner */}
                <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                  <div>
                    <span className="text-[10px] uppercase font-black text-rose-300 tracking-wider">Target Finished Goods Batch</span>
                    <h4 className="text-base font-black text-white">{wizardProduct}</h4>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Batch Target Qty</span>
                      <span className="font-black text-emerald-300 text-sm">{wizardProductQty} {wizardProductUnit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Ingredients</span>
                      <span className="font-black text-white text-sm">{calculatedBreakdown.length} Items</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Overall Raw Material Cost</span>
                      <span className="font-black text-amber-300 text-sm">₹{overallPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Breakdown Table */}
                <div className="overflow-x-auto border border-slate-200 rounded-2xl shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    {/* Multi-tier Table Header */}
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-black text-[11px] uppercase tracking-wider border-b border-slate-200">
                        <th rowSpan="2" className="p-3 border-r border-slate-200 bg-slate-100">
                          Raw Material Name
                        </th>
                        <th colSpan="4" className="p-2 text-center bg-amber-50 text-amber-900 border-r border-amber-200 font-black">
                          Old Stock Breakdown (FIFO Lot 1)
                        </th>
                        <th colSpan="4" className="p-2 text-center bg-blue-50 text-blue-900 border-r border-blue-200 font-black">
                          Latest Stock Breakdown (Recent Inward)
                        </th>
                        <th rowSpan="2" className="p-3 text-right bg-emerald-50 text-emerald-900 font-black">
                          Total Price (₹)
                        </th>
                      </tr>
                      <tr className="bg-slate-50 text-slate-600 text-[10px] font-bold uppercase border-b border-slate-200">
                        {/* Old Stock Columns */}
                        <th className="p-2 bg-amber-50/50 text-right">Old Stock</th>
                        <th className="p-2 bg-amber-50/50 text-right text-rose-700">Taken Qty</th>
                        <th className="p-2 bg-amber-50/50 text-right">Remaining</th>
                        <th className="p-2 bg-amber-50/50 text-right border-r border-amber-200">Taken Price</th>

                        {/* Latest Stock Columns */}
                        <th className="p-2 bg-blue-50/50 text-right">Latest Stock</th>
                        <th className="p-2 bg-blue-50/50 text-right text-rose-700">Taken Qty</th>
                        <th className="p-2 bg-blue-50/50 text-right">Remaining</th>
                        <th className="p-2 bg-blue-50/50 text-right border-r border-blue-200">Taken Price</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {calculatedBreakdown.map((row) => (
                        <tr key={row.itemName} className="hover:bg-slate-50/80 transition-colors">
                          {/* Raw Material Name */}
                          <td className="p-3 border-r border-slate-200 font-bold text-slate-900">
                            <div>{row.itemName}</div>
                            <span className="text-[10px] text-slate-400 font-medium">{row.category} • Req: {row.totalRequested} {row.unit}</span>
                          </td>

                          {/* Old Stock columns */}
                          <td className="p-2.5 text-right font-medium text-slate-700 bg-amber-50/20">
                            {row.oldStockQty} {row.unit}
                          </td>
                          <td className="p-2.5 text-right font-black text-rose-600 bg-amber-50/20">
                            {row.oldTakenQty} {row.unit}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-600 bg-amber-50/20">
                            {row.oldRemainingQty} {row.unit}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-800 bg-amber-50/20 border-r border-amber-200">
                            ₹{row.oldTakenPrice.toLocaleString('en-IN')}
                            <span className="block text-[9px] text-slate-400 font-normal">@ ₹{row.oldStockRate}/{row.unit}</span>
                          </td>

                          {/* Latest Stock columns */}
                          <td className="p-2.5 text-right font-medium text-slate-700 bg-blue-50/20">
                            {row.latestStockQty} {row.unit}
                          </td>
                          <td className="p-2.5 text-right font-black text-rose-600 bg-blue-50/20">
                            {row.latestTakenQty} {row.unit}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-600 bg-blue-50/20">
                            {row.latestRemainingQty} {row.unit}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-800 bg-blue-50/20 border-r border-blue-200">
                            ₹{row.latestTakenPrice.toLocaleString('en-IN')}
                            <span className="block text-[9px] text-slate-400 font-normal">@ ₹{row.latestStockRate}/{row.unit}</span>
                          </td>

                          {/* Total Price of each raw material */}
                          <td className="p-3 text-right font-black text-emerald-700 bg-emerald-50/30 text-sm">
                            ₹{row.totalPrice.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                    {/* Overall Price Footer */}
                    <tfoot className="bg-slate-100 font-black border-t-2 border-slate-200">
                      <tr>
                        <td className="p-3 text-slate-800 uppercase tracking-wider text-xs">
                          Overall Summary ({calculatedBreakdown.length} Raw Materials)
                        </td>
                        <td colSpan="3" className="p-3 text-right text-amber-900 font-bold text-xs bg-amber-100/50">
                          Total Old Stock Val:
                        </td>
                        <td className="p-3 text-right font-black text-amber-900 border-r border-amber-300 text-xs bg-amber-100/50">
                          ₹{overallOldPrice.toLocaleString('en-IN')}
                        </td>
                        <td colSpan="3" className="p-3 text-right text-blue-900 font-bold text-xs bg-blue-100/50">
                          Total Latest Stock Val:
                        </td>
                        <td className="p-3 text-right font-black text-blue-900 border-r border-blue-300 text-xs bg-blue-100/50">
                          ₹{overallLatestPrice.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right font-black text-emerald-800 bg-emerald-100 text-base">
                          ₹{overallPrice.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Bottom Overall Price Highlight Banner */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                      <Calculator className="w-5 h-5" />
                    </span>
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                        Total Material Issue Valuation
                      </span>
                      <p className="text-xs text-emerald-900 font-semibold">
                        Sum calculated from Old Stock FIFO lots and Latest Stock inward rates
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Overall Price</span>
                    <div className="text-2xl font-black text-emerald-700">
                      ₹{overallPrice.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              {wizardStep === 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowWizardModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/50 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleGoToNextStep}
                    className="px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 rounded-xl shadow-md shadow-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next: Stock & Price Breakdown</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setWizardStep(1);
                      setWizardError('');
                    }}
                    className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Selection</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFinalIssueMaterial}
                    disabled={wizardSubmitting}
                    className="px-6 py-2.5 text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {wizardSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Issuing Material...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Issue Material</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
