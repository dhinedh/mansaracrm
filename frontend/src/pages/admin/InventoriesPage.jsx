// src/pages/admin/InventoriesPage.jsx
// Mansara Foods — Raw Material Multi-Inventory & Inward Goods Hub
// Strictly for Raw Material Products & Formulation Ingredients (Not for prepared end products)

import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  Warehouse,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Tag,
  ArrowRightLeft,
  Package,
  Layers,
  SlidersHorizontal,
  ChevronRight,
  TrendingDown,
  Building,
  Factory,
  Check,
  X,
  FileText,
  Clock,
  Calendar,
  AlertCircle,
  Copy,
  Info,
  ShieldCheck,
  Eye,
  Filter,
  Upload,
  Download,
  FileSpreadsheet
} from 'lucide-react';

export default function InventoriesPage() {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [rawCategories, setRawCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [message, setMessage] = useState({ text: '', type: '' });

  // ─── ADD STOCK / INWARD MODAL STATE ────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Auto-generated Inventory ID format: MIP / YEAR / DATE / TIME / NUMBER
  const [inventoryId, setInventoryId] = useState('');
  const [quotationIdInput, setQuotationIdInput] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [storageLocation, setStorageLocation] = useState('Central Warehouse, Bay 1');
  const [generalNotes, setGeneralNotes] = useState('');

  // Quotation items fetched & managed
  const [quotationItems, setQuotationItems] = useState([]);
  const [quotationSearching, setQuotationSearching] = useState(false);
  const [quotationSource, setQuotationSource] = useState('');
  const [availableQuotes, setAvailableQuotes] = useState([]);
  const [rawMaterialCatalog, setRawMaterialCatalog] = useState([]);

  // Detail Modal for viewing Inward & Acceptance breakdown
  const [selectedStockForDetail, setSelectedStockForDetail] = useState(null);

  // ─── BULK UPLOAD MODAL STATE ───────────────────────────────────────────
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkPreviewRows, setBulkPreviewRows] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkError, setBulkError] = useState('');

  // ─── BULK UPLOAD HANDLERS ──────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const csvContent = [
      'Category Name,Sub Category,Item Name,Quantity,Unit,Quotation Rate,Quotation ID,Warehouse Location,Batch ID,Notes',
      '"Pulses & Legumes","Urad Dal (Black Gram)","Superfine Urad Dal Flour",500,"kg",115,"QTN-2026-881","Central Warehouse, Bay 1","BATCH-RM-0412-01","QC verified pure grain"',
      '"Grains & Millets","Finger Millet (Ragi)","Organic Roasted Ragi Flour",400,"kg",48,"QTN-2026-881","Grain Silo 2, Bin A","BATCH-RM-0412-02","Moisture < 10%"',
      '"Spices & Condiments","Black Pepper","Crushed Tellicherry Pepper",90,"kg",720,"QTN-2026-752","Spice Vault, Rack 4","BATCH-RM-0412-03","Aroma sealed packaging"',
      '"Packaging Materials","Printed Pouches","150g Metallized Barrier Pouch",6000,"pcs",2.45,"QTN-2026-640","Packaging Store 1, Row 3","BATCH-RM-0412-04","Food-grade foil barrier"'
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mansara_raw_material_inventory_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFile(file);
    setBulkError('');
    setBulkResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length <= 1) {
          setBulkError('Uploaded CSV file has no data rows');
          setBulkPreviewRows([]);
          return;
        }

        const parseLine = (line) => {
          const res = [];
          let cur = '';
          let inQ = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') inQ = !inQ;
            else if (ch === ',' && !inQ) { res.push(cur.trim()); cur = ''; }
            else cur += ch;
          }
          res.push(cur.trim());
          return res;
        };

        const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        const preview = [];

        for (let i = 1; i < Math.min(lines.length, 11); i++) {
          const cols = parseLine(lines[i]);
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = cols[idx] !== undefined ? cols[idx].replace(/^"|"$/g, '') : '';
          });
          preview.push(rowObj);
        }

        setBulkPreviewRows(preview);
      } catch (err) {
        console.error('Failed to preview CSV:', err);
        setBulkError('Failed to parse CSV preview: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteBulkUpload = async () => {
    if (!bulkFile) {
      setBulkError('Please select a valid CSV file first');
      return;
    }

    setBulkUploading(true);
    setBulkError('');
    setBulkResult(null);

    const formData = new FormData();
    formData.append('file', bulkFile);

    try {
      const res = await axios.post('/inventory/bulk-inward', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setBulkResult(res.data);
      setMessage({
        text: res.data?.message || 'Bulk raw material inventory uploaded successfully!',
        type: 'success'
      });
      fetchStocks();
    } catch (err) {
      try {
        const res2 = await axios.post('/raw-materials/bulk-upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setBulkResult(res2.data);
        setMessage({
          text: res2.data?.message || 'Bulk raw material products uploaded successfully!',
          type: 'success'
        });
        fetchStocks();
      } catch (fallbackErr) {
        setBulkError(err.response?.data?.message || fallbackErr.response?.data?.message || err.message || 'Bulk upload failed');
      }
    } finally {
      setBulkUploading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
    fetchCategories();
    loadQuotationMetadata();
  }, []);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/inventory/company');
      // Strictly raw materials (filter out prepared finished goods if any exist in DB)
      const rawOnly = (res.data?.data || []).filter(item => {
        const cat = (item.category || '').toLowerCase().trim();
        return cat !== 'finished goods' && cat !== 'end product' && cat !== 'finished goods (prepared)';
      });
      setStocks(rawOnly);
    } catch (err) {
      console.error('Failed to fetch multi-inventory stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/raw-materials/categories');
      setRawCategories(res.data?.data || []);
    } catch (err) {
      console.error('Failed to fetch raw material categories:', err);
    }
  };

  const loadQuotationMetadata = async () => {
    try {
      const res = await axios.get('/inventory/lookup-quotation');
      if (res.data?.availableQuotations) {
        setAvailableQuotes(res.data.availableQuotations);
      }
      if (res.data?.rawMaterialCatalog) {
        setRawMaterialCatalog(res.data.rawMaterialCatalog);
      }
    } catch (err) {
      console.error('Failed to load quotation metadata:', err);
    }
  };

  const showToast = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 4500);
  };

  // ─── GENERATE INVENTORY ID: MIP / YEAR / DATE / TIME / NUMBER ─────────
  const generateNewInventoryId = async () => {
    try {
      const res = await axios.get('/inventory/generate-inventory-id');
      if (res.data?.inventoryId) {
        setInventoryId(res.data.inventoryId);
        return res.data.inventoryId;
      }
    } catch (err) {
      console.warn('Backend ID generator unavailable, generating local MIP ID:', err);
    }

    // Fallback: local client generator adhering strictly to MIP/YEAR/DATE/TIME/NUM
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const num = String((stocks.length % 999) + 1).padStart(3, '0');
    const genId = `MIP/${year}/${month}${day}/${hours}${minutes}/${num}`;
    setInventoryId(genId);
    return genId;
  };

  // Open Inward Stock Modal
  const handleOpenAddStockModal = () => {
    generateNewInventoryId();
    setQuotationIdInput('');
    setVendorName('');
    setStorageLocation('Central Warehouse, Bay 1');
    setGeneralNotes('');
    setQuotationItems([]);
    setQuotationSource('');
    setShowAddModal(true);
  };

  // ─── LOOKUP QUOTATION AND LIST RAW MATERIALS ──────────────────────────
  const handleLookupQuotation = async (qIdToSearch) => {
    const qId = (qIdToSearch || quotationIdInput).trim();
    if (!qId) return;

    setQuotationSearching(true);
    try {
      const res = await axios.get(`/inventory/lookup-quotation?quotationId=${encodeURIComponent(qId)}`);
      if (res.data?.found && res.data?.data) {
        const qData = res.data.data;
        setQuotationSource(res.data.source || 'QUOTATION');
        setVendorName(qData.vendorName || '');
        if (qData.notes) setGeneralNotes(qData.notes);

        // Pre-populate items with default acceptance values
        const mappedItems = (qData.items || []).map((item, idx) => {
          const qty = Number(item.orderedQuantity || item.quantity) || 0;
          return {
            id: `qi-${idx}-${Date.now()}`,
            rawMaterialId: item.rawMaterialId || '',
            itemName: item.itemName || '',
            category: item.category || 'Pulses & Legumes',
            subCategory: item.subCategory || '',
            orderedQuantity: qty,
            unit: item.unit || 'kg',
            costPerUnit: item.costPerUnit || 0,
            acceptedQty: qty,
            rejectedQty: 0,
            acceptanceStatus: 'ACCEPTED',
            acceptReason: item.acceptReason || 'Meets QA/QC moisture & purity standard',
            rejectReason: item.rejectReason || '',
            storageLocation: storageLocation,
            batchId: `BATCH-RM-${Date.now().toString().slice(-4)}-${idx + 1}`
          };
        });

        setQuotationItems(mappedItems);
        showToast(`Quotation "${qId}" loaded with ${mappedItems.length} raw material(s).`);
      } else {
        setQuotationSource('CUSTOM');
        showToast(`Quotation "${qId}" not found in pre-orders. Enter custom raw materials below.`, 'error');
        if (quotationItems.length === 0) {
          handleAddEmptyItemRow();
        }
      }
    } catch (err) {
      console.error('Failed to lookup quotation:', err);
      showToast('Error looking up quotation', 'error');
    } finally {
      setQuotationSearching(false);
    }
  };

  // Add empty row for custom / additional raw material
  const handleAddEmptyItemRow = () => {
    const defaultRm = rawMaterialCatalog[0];
    setQuotationItems(prev => [
      ...prev,
      {
        id: `qi-${Date.now()}-${Math.random()}`,
        rawMaterialId: defaultRm?._id || '',
        itemName: defaultRm?.name || '',
        category: defaultRm?.categoryName || defaultRm?.categoryId?.name || 'Raw Material',
        subCategory: defaultRm?.subCategory || '',
        orderedQuantity: 100,
        unit: defaultRm?.unit || 'kg',
        costPerUnit: defaultRm?.costPerUnit || 0,
        acceptedQty: 100,
        rejectedQty: 0,
        acceptanceStatus: 'ACCEPTED',
        acceptReason: 'Approved as per raw material quality standard',
        rejectReason: '',
        storageLocation: storageLocation,
        batchId: `BATCH-RM-${Date.now().toString().slice(-4)}`
      }
    ]);
  };

  const handleUpdateItemField = (index, field, value) => {
    setQuotationItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      // Synchronize acceptance / rejection quantities
      if (field === 'acceptedQty') {
        const acc = Number(value) || 0;
        const total = Number(item.orderedQuantity) || 0;
        item.rejectedQty = Math.max(0, total - acc);
        item.acceptanceStatus = item.rejectedQty > 0 ? (acc > 0 ? 'PARTIALLY_ACCEPTED' : 'REJECTED') : 'ACCEPTED';
      } else if (field === 'rejectedQty') {
        const rej = Number(value) || 0;
        const total = Number(item.orderedQuantity) || 0;
        item.acceptedQty = Math.max(0, total - rej);
        item.acceptanceStatus = rej > 0 ? (item.acceptedQty > 0 ? 'PARTIALLY_ACCEPTED' : 'REJECTED') : 'ACCEPTED';
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleItemQuickAcceptAll = (index) => {
    setQuotationItems(prev => {
      const updated = [...prev];
      const total = Number(updated[index].orderedQuantity) || 0;
      updated[index] = {
        ...updated[index],
        acceptedQty: total,
        rejectedQty: 0,
        acceptanceStatus: 'ACCEPTED',
        acceptReason: updated[index].acceptReason || '100% Accepted - verified standard QA test',
        rejectReason: ''
      };
      return updated;
    });
  };

  const handleItemQuickRejectAll = (index) => {
    setQuotationItems(prev => {
      const updated = [...prev];
      const total = Number(updated[index].orderedQuantity) || 0;
      updated[index] = {
        ...updated[index],
        acceptedQty: 0,
        rejectedQty: total,
        acceptanceStatus: 'REJECTED',
        rejectReason: updated[index].rejectReason || 'Failed QC: Packaging damaged / moisture out of spec',
        acceptReason: ''
      };
      return updated;
    });
  };

  const handleRemoveItemRow = (index) => {
    setQuotationItems(prev => prev.filter((_, i) => i !== index));
  };

  // ─── CONFIRM & SAVE INWARD STOCK ──────────────────────────────────────
  const handleInwardStockSubmit = async (e) => {
    e.preventDefault();

    if (!quotationIdInput.trim()) {
      showToast('Quotation ID is required', 'error');
      return;
    }

    if (quotationItems.length === 0) {
      showToast('Please add at least one raw material item from the quotation', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        inventoryId: inventoryId || (await generateNewInventoryId()),
        quotationId: quotationIdInput.trim().toUpperCase(),
        vendorName: vendorName.trim(),
        storageLocation: storageLocation.trim(),
        notes: generalNotes.trim(),
        items: quotationItems.map(item => ({
          rawMaterialId: item.rawMaterialId,
          itemName: item.itemName,
          category: item.category,
          subCategory: item.subCategory,
          orderedQuantity: Number(item.orderedQuantity) || 0,
          acceptedQty: Number(item.acceptedQty) || 0,
          rejectedQty: Number(item.rejectedQty) || 0,
          unit: item.unit || 'kg',
          costPerUnit: Number(item.costPerUnit) || 0,
          acceptanceStatus: item.acceptanceStatus,
          acceptReason: item.acceptReason,
          rejectReason: item.rejectReason,
          storageLocation: item.storageLocation || storageLocation,
          batchId: item.batchId
        }))
      };

      const res = await axios.post('/inventory/inward-stock', payload);

      showToast(res.data?.message || 'Stock successfully inwarded and stored in categories!');
      setShowAddModal(false);
      fetchStocks();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to inward stock', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── FILTERING & KPIS ──────────────────────────────────────────────────
  const locations = useMemo(() => {
    const locSet = new Set();
    stocks.forEach(s => {
      if (s.storageLocation) locSet.add(s.storageLocation.trim());
    });
    return Array.from(locSet);
  }, [stocks]);

  const categories = useMemo(() => {
    const catSet = new Set();
    stocks.forEach(s => {
      if (s.category) catSet.add(s.category.trim());
    });
    return Array.from(catSet);
  }, [stocks]);

  // KPI calculations (strictly raw materials)
  const totalItems = stocks.length;
  const lowStockCount = stocks.filter(s => Number(s.quantity) <= Number(s.minQuantity || 10)).length;
  const totalRawQty = stocks.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  const totalAcceptedEntries = stocks.filter(s => (s.acceptedQty || s.quantity) > 0).length;

  // Filtered stocks
  const filteredStocks = stocks.filter(item => {
    const q = search.toLowerCase().trim();
    const matchesLoc = selectedLocation === 'All' || item.storageLocation === selectedLocation;
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;

    if (!q) return matchesLoc && matchesCat;

    const matchesSearch = (
      (item.itemName && item.itemName.toLowerCase().includes(q)) ||
      (item.stockId && item.stockId.toLowerCase().includes(q)) ||
      (item.inventoryId && item.inventoryId.toLowerCase().includes(q)) ||
      (item.quotationId && item.quotationId.toLowerCase().includes(q)) ||
      (item.batchId && item.batchId.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.subCategory && item.subCategory.toLowerCase().includes(q)) ||
      (item.storageLocation && item.storageLocation.toLowerCase().includes(q))
    );

    return matchesLoc && matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ─── TOAST NOTIFICATION ───────────────────────────────────────── */}
      {message.text && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg border transition-all animate-in fade-in ${
          message.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2.5">
            {message.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage({ text: '', type: '' })}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── DESKTOP HEADER (HIDDEN ON MOBILE TO STREAMLINE MOBILE UI) ── */}
      <div className="hidden md:flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700">
              <Boxes className="w-3.5 h-3.5" /> RAW MATERIAL MULTI-INVENTORY
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-slate-500 text-xs font-bold">
              Formulation Raw Materials & Ingredients
            </span>
          </div>

          <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-rose-600" />
            Multi-Inventory & Inward Stock Management
          </h1>
        </div>
      </div>

      {/* ─── KPI SUMMARY CARDS (HIDDEN ON MOBILE/TABLET) ─────────────── */}
      <div className="hidden lg:grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Raw Material Lots</p>
            <h3 className="text-xl font-black text-slate-900">{totalItems} Lots</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Storage Warehouses</p>
            <h3 className="text-xl font-black text-slate-900">{locations.length || 3} Locations</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Quotation Inward Passes</p>
            <h3 className="text-xl font-black text-emerald-700">{totalAcceptedEntries} Verified</h3>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Low Stock Alerts</p>
            <h3 className={`text-xl font-black ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
              {lowStockCount} Items
            </h3>
          </div>
        </div>
      </div>

      {/* ─── LOCATION PILLS (HIDDEN ON MOBILE TO SIMPLIFY MOBILE UI) ─── */}
      <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
        <span className="text-[10px] uppercase text-slate-400 font-black shrink-0">Warehouses:</span>
        <button
          onClick={() => setSelectedLocation('All')}
          className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 font-bold ${
            selectedLocation === 'All'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Locations ({stocks.length})
        </button>
        {locations.map(loc => {
          const count = stocks.filter(s => s.storageLocation === loc).length;
          return (
            <button
              key={loc}
              onClick={() => setSelectedLocation(loc)}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 font-bold ${
                selectedLocation === loc
                  ? 'bg-rose-600 text-white shadow-sm shadow-rose-200'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{loc}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedLocation === loc ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── SEARCH & ACTIONS ROW (COMPACT FOR MOBILE & DESKTOP) ───────── */}
      <div className="flex flex-col md:flex-row gap-2.5 bg-white p-3 sm:p-4 border border-slate-200 rounded-2xl shadow-sm">
        {/* Search input with right-side Material Issue & Add Stock buttons */}
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search raw material, MIP ID, Quotation ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none transition-all font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Bulk Upload Icon Button */}
          <button
            onClick={() => {
              setBulkFile(null);
              setBulkPreviewRows([]);
              setBulkResult(null);
              setBulkError('');
              setShowBulkModal(true);
            }}
            className="p-2 sm:px-3 sm:py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl shadow-2xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Bulk Upload Raw Material Stock"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Bulk Upload</span>
          </button>

          {/* Add Stock (Inward Entry) Button */}
          <button
            onClick={handleOpenAddStockModal}
            className="p-2 sm:px-3.5 sm:py-2 text-xs font-black text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 rounded-xl shadow-md shadow-rose-200 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Add Stock (Inward Entry)"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Stock</span>
          </button>
        </div>

        {/* Warehouse, Category Filter & Refresh */}
        <div className="flex items-center gap-2">
          {/* Mobile-only Warehouse Selector */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="md:hidden flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none font-bold text-slate-700 cursor-pointer"
          >
            <option value="All">All Warehouses ({stocks.length})</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 md:flex-initial px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none font-bold text-slate-700 cursor-pointer"
          >
            <option value="All">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button
            onClick={fetchStocks}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Refresh Stock List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── RAW MATERIAL STOCKS TABLE ────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 font-medium">
            No raw material inventory records found. Click <span className="font-bold text-rose-600">"Add Stock (Inward Entry)"</span> to enter stock with an auto-generated Inventory ID and Quotation verification.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-3 sm:px-4">Item ID</th>
                  <th className="py-3 px-3 sm:px-4">Item Name & Category</th>
                  <th className="py-3 px-3 sm:px-4 text-center">Quantity</th>
                  <th className="hidden md:table-cell py-3 px-4 text-right">Quotation Rate</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Total Price (Quotation Allocated)</th>
                  <th className="hidden md:table-cell py-3 px-4">Quotation Ref</th>
                  <th className="hidden md:table-cell py-3 px-4">Storage Location</th>
                  <th className="hidden md:table-cell py-3 px-4 text-center">Status</th>
                  <th className="hidden md:table-cell py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredStocks.map((stock) => {
                  const qty = Number(stock.quantity) || 0;
                  const unitPrice = Number(stock.costPerUnit) || 95;
                  const totalPrice = Number(stock.totalPrice) || (qty * unitPrice);
                  const isLow = qty <= Number(stock.minQuantity || 10);
                  const isAccepted = stock.acceptanceStatus === 'ACCEPTED';
                  const isPartAccepted = stock.acceptanceStatus === 'PARTIALLY_ACCEPTED';
                  const isRejected = stock.acceptanceStatus === 'REJECTED';

                  return (
                    <tr
                      key={stock._id || stock.id}
                      onClick={() => setSelectedStockForDetail(stock)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer md:cursor-default"
                    >
                      {/* Item ID */}
                      <td className="py-3.5 px-3 sm:px-4">
                        {stock.inventoryId ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] sm:text-[11px] text-rose-700 font-bold bg-rose-50 border border-rose-200 px-1.5 sm:px-2 py-0.5 rounded-lg shadow-2xs">
                            {stock.inventoryId}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] sm:text-[11px] text-slate-700 font-bold bg-slate-100 border border-slate-200 px-1.5 sm:px-2 py-0.5 rounded-lg">
                            {stock.stockId}
                          </span>
                        )}
                      </td>

                      {/* Item Name & Category */}
                      <td className="py-3.5 px-3 sm:px-4">
                        <span className="font-black text-slate-900 text-xs sm:text-sm block">{stock.itemName}</span>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-[11px] text-slate-500">
                          <span className="font-semibold text-rose-600">{stock.category}</span>
                          {stock.subCategory && (
                            <>
                              <span>•</span>
                              <span className="text-slate-600 font-medium truncate max-w-[120px]">{stock.subCategory}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-3 sm:px-4 text-center">
                        <div className="font-black text-slate-900 text-xs sm:text-sm">
                          {qty} <span className="text-[10px] sm:text-[11px] font-bold text-slate-500">{stock.unit || 'kg'}</span>
                        </div>
                        {isLow && (
                          <span className="text-[9px] sm:text-[10px] font-bold text-amber-600 block mt-0.5">
                            ⚠️ Low Stock
                          </span>
                        )}
                      </td>

                      {/* Quotation Rate (Desktop only) */}
                      <td className="hidden md:table-cell py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-slate-700 text-xs">
                          ₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-sans">
                          per {stock.unit || 'kg'}
                        </span>
                      </td>

                      {/* Total Price (Quotation Allocated - Visible on both Mobile & Desktop) */}
                      <td className="py-3.5 px-3 sm:px-4 text-right">
                        <div className="inline-flex flex-col items-end">
                          <span className="font-black text-emerald-700 text-xs sm:text-sm font-mono bg-emerald-50 border border-emerald-200 px-1.5 sm:px-2 py-0.5 rounded-lg shadow-2xs">
                            ₹{totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 font-medium">
                            {qty} × ₹{unitPrice}
                          </span>
                        </div>
                      </td>

                      {/* Quotation ID Ref (Desktop only) */}
                      <td className="hidden md:table-cell py-3.5 px-4">
                        {stock.quotationId ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <FileText className="w-3 h-3" />
                            {stock.quotationId}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">—</span>
                        )}
                        {stock.vendorName && (
                          <span className="block text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                            {stock.vendorName}
                          </span>
                        )}
                      </td>

                      {/* Storage Location (Desktop only) */}
                      <td className="hidden md:table-cell py-3.5 px-4">
                        <span className="flex items-center gap-1 text-slate-700 text-xs font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{stock.storageLocation || 'Central Warehouse'}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">Batch: {stock.batchId || 'N/A'}</span>
                      </td>

                      {/* Status (Desktop only) */}
                      <td className="hidden md:table-cell py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          isAccepted
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isPartAccepted
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {isAccepted ? '✅ Accepted' : isPartAccepted ? '⚠️ Partial' : '❌ Rejected'}
                        </span>
                      </td>

                      {/* Actions (Desktop only) */}
                      <td className="hidden md:table-cell py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedStockForDetail(stock)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View Inward & QC Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => navigate('/admin/material-issue')}
                            className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Issue
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL: ADD STOCK WITH AUTO-INVENTORY ID & QUOTATION CHECK ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white max-w-4xl w-full rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 my-8 border border-slate-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-rose-50 via-white to-indigo-50">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-rose-600 text-white rounded-xl shadow-xs">
                  <Boxes className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    Inward Raw Material Stock Entry
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Multi-Inventory raw material receipt linked with Quotation verification and quality inspection
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInwardStockSubmit} className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
              {/* TOP BAR: AUTO-GENERATED INVENTORY ID & QUOTATION ID */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4.5 bg-slate-50/80 rounded-2xl border border-slate-200">
                {/* Auto-Generated Inventory ID */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-rose-600" />
                      Auto-Generated Inventory ID <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={generateNewInventoryId}
                      className="text-[10px] text-rose-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      title="Re-generate timestamp"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh Time
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inventoryId}
                      className="w-full px-3.5 py-2.5 text-sm font-mono font-black text-rose-700 bg-white border border-rose-200 rounded-xl shadow-2xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(inventoryId);
                        showToast(`Copied Inventory ID: ${inventoryId}`);
                      }}
                      className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer"
                      title="Copy ID"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Strict Format: <span className="font-mono font-bold text-slate-600">MIP / YEAR / DATE / TIME / NUMBER</span>
                  </span>
                </div>

                {/* Quotation ID Lookup */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      Quotation ID Reference <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">Enter ID to auto-load raw materials</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      placeholder="e.g. QT-2026-001, PO-2026-001, PR-2026-001..."
                      value={quotationIdInput}
                      onChange={(e) => setQuotationIdInput(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleLookupQuotation(e.target.value);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 text-sm font-mono font-bold uppercase text-slate-900 bg-white border border-slate-300 focus:border-indigo-500 rounded-xl focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={quotationSearching || !quotationIdInput.trim()}
                      onClick={() => handleLookupQuotation(quotationIdInput)}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Search className={`w-3.5 h-3.5 ${quotationSearching ? 'animate-spin' : ''}`} />
                      <span>{quotationSearching ? 'Loading...' : 'Lookup'}</span>
                    </button>
                  </div>

                  {/* Quick Select Quotation Pills */}
                  <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-0.5">
                    <span className="text-[10px] text-slate-400 font-bold shrink-0">Quick Select:</span>
                    {availableQuotes.map(qId => (
                      <button
                        key={qId}
                        type="button"
                        onClick={() => {
                          setQuotationIdInput(qId);
                          handleLookupQuotation(qId);
                        }}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-bold transition-all shrink-0 cursor-pointer ${
                          quotationIdInput === qId
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        {qId}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* VENDOR & LOCATION DETAILS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Vendor / Supplier Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sri Lakshmi Agro Mills, Malabar Spices..."
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">
                    Warehouse Inward Storage Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Central Warehouse, Bay 1 / Silo A / Rack B"
                    value={storageLocation}
                    onChange={(e) => setStorageLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-semibold text-slate-800"
                  />
                </div>
              </div>

              {/* ─── QUOTATION RAW MATERIALS LIST (ACCEPT / REJECT SECTION) ──── */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-sm">
                      Raw Materials from Quotation ({quotationItems.length})
                    </span>
                    {quotationSource && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-700">
                        {quotationSource}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddEmptyItemRow}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add Another Raw Material
                  </button>
                </div>

                {quotationItems.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-600 font-bold text-xs">No raw materials loaded yet</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Select or type a Quotation ID above and click <span className="font-bold text-indigo-600">"Lookup"</span> to auto-load raw materials, or click "+ Add Another Raw Material".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {quotationItems.map((item, idx) => {
                      const totalQty = Number(item.orderedQuantity) || 0;
                      const accQty = Number(item.acceptedQty) || 0;
                      const rejQty = Number(item.rejectedQty) || 0;

                      return (
                        <div
                          key={item.id || idx}
                          className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
                        >
                          {/* Item Row Top: Name, Category, Quoted Qty */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <input
                                  type="text"
                                  required
                                  value={item.itemName}
                                  onChange={(e) => handleUpdateItemField(idx, 'itemName', e.target.value)}
                                  placeholder="Raw material name..."
                                  className="font-black text-slate-900 text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-rose-500 focus:outline-none flex-1"
                                />
                              </div>

                              <div className="flex items-center gap-2 mt-1 ml-7">
                                <select
                                  value={item.category}
                                  onChange={(e) => handleUpdateItemField(idx, 'category', e.target.value)}
                                  className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 focus:outline-none"
                                >
                                  <option value="Pulses & Legumes">Pulses & Legumes</option>
                                  <option value="Grains & Millets">Grains & Millets</option>
                                  <option value="Spices & Condiments">Spices & Condiments</option>
                                  <option value="Oils & Fats">Oils & Fats</option>
                                  <option value="Packaging Materials">Packaging Materials</option>
                                  <option value="Raw Material">Raw Material</option>
                                  {rawCategories.map(rc => (
                                    <option key={rc._id} value={rc.name}>{rc.name}</option>
                                  ))}
                                </select>

                                {item.subCategory && (
                                  <span className="text-[10px] font-semibold text-slate-500">
                                    Sub: {item.subCategory}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Quoted Quantity & Cost */}
                            <div className="flex items-center gap-3 shrink-0 ml-7 sm:ml-0">
                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 uppercase font-black block">Quoted Quantity</span>
                                <div className="font-bold text-slate-800 text-sm">
                                  {totalQty} {item.unit || 'kg'}
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] text-slate-400 uppercase font-black block">Cost / Unit</span>
                                <div className="font-bold text-slate-800 text-sm">
                                  ₹{item.costPerUnit || 0}
                                </div>
                              </div>

                              {/* Remove row */}
                              <button
                                type="button"
                                onClick={() => handleRemoveItemRow(idx)}
                                className="p-1 text-slate-300 hover:text-rose-600 rounded"
                                title="Remove item"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Acceptance vs Rejection Split Controls */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                            {/* Quantity Inputs */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-slate-700">Accept / Reject Split</label>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleItemQuickAcceptAll(idx)}
                                    className="text-[10px] font-bold text-emerald-700 hover:underline"
                                  >
                                    Accept All
                                  </button>
                                  <span className="text-slate-300">•</span>
                                  <button
                                    type="button"
                                    onClick={() => handleItemQuickRejectAll(idx)}
                                    className="text-[10px] font-bold text-rose-700 hover:underline"
                                  >
                                    Reject All
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-[10px] text-emerald-700 font-bold block">Accepted Qty</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={totalQty}
                                    value={accQty}
                                    onChange={(e) => handleUpdateItemField(idx, 'acceptedQty', e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg font-black text-emerald-800 text-xs focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-rose-700 font-bold block">Rejected Qty</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={totalQty}
                                    value={rejQty}
                                    onChange={(e) => handleUpdateItemField(idx, 'rejectedQty', e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border border-rose-300 rounded-lg font-black text-rose-800 text-xs focus:ring-1 focus:ring-rose-500"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Reason for Accept */}
                            <div>
                              <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                                Reason for Acceptance
                              </label>
                              <input
                                type="text"
                                placeholder="Passed quality check standard, aroma & moisture OK..."
                                value={item.acceptReason}
                                onChange={(e) => handleUpdateItemField(idx, 'acceptReason', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-400 mt-0.5 block">Stored with audit timestamp</span>
                            </div>

                            {/* Reason for Reject */}
                            <div>
                              <label className="block text-[11px] font-bold text-rose-800 mb-1">
                                Reason for Rejection
                              </label>
                              <input
                                type="text"
                                placeholder="Packaging damaged, moisture ingress, foreign matter..."
                                value={item.rejectReason}
                                onChange={(e) => handleUpdateItemField(idx, 'rejectReason', e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:border-rose-500 focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-400 mt-0.5 block">Recorded for vendor dispute/claims</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* General Inward Notes */}
              <div>
                <label className="block text-slate-600 font-bold mb-1">Inward Notes / Supplier Delivery Details</label>
                <input
                  type="text"
                  placeholder="Invoice / Challan reference, delivery truck number, driver contact..."
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none text-slate-700 font-medium"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  <span className="font-bold text-slate-800">{quotationItems.reduce((acc, i) => acc + (Number(i.acceptedQty) || 0), 0)}</span> units will be added to Multi-Inventory under respective categories.
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || quotationItems.length === 0}
                    className="bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-black px-5 py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{submitting ? 'Inwarding...' : 'Confirm & Inward Stock'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: VIEW INWARD & QUALITY DETAIL BREAKDOWN ────────────── */}
      {selectedStockForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4 border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider">
                  Raw Material Inward Record
                </span>
                <h3 className="font-black text-slate-900 text-lg">{selectedStockForDetail.itemName}</h3>
                <div className="font-mono text-xs text-rose-700 font-bold mt-0.5">
                  ID: {selectedStockForDetail.inventoryId || selectedStockForDetail.stockId}
                </div>
              </div>
              <button
                onClick={() => setSelectedStockForDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-black">Category</span>
                  <span className="font-bold text-slate-800">{selectedStockForDetail.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-black">Sub-Category</span>
                  <span className="font-bold text-slate-800">{selectedStockForDetail.subCategory || 'General'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-black">Quotation Ref</span>
                  <span className="font-mono font-bold text-indigo-700">{selectedStockForDetail.quotationId || 'Direct'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-black">Storage Location</span>
                  <span className="font-bold text-slate-800">{selectedStockForDetail.storageLocation}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl text-center">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-black">Accepted Qty</span>
                  <span className="font-black text-emerald-700 text-sm">{selectedStockForDetail.acceptedQty || selectedStockForDetail.quantity} {selectedStockForDetail.unit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-black">Rejected Qty</span>
                  <span className="font-black text-rose-700 text-sm">{selectedStockForDetail.rejectedQty || 0} {selectedStockForDetail.unit}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-black">Inward Status</span>
                  <span className="font-black uppercase text-xs text-slate-800">{selectedStockForDetail.acceptanceStatus || 'ACCEPTED'}</span>
                </div>
              </div>

              {selectedStockForDetail.acceptReason && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-emerald-800 block mb-0.5">Acceptance Reason:</span>
                  <p className="text-emerald-900 font-semibold">{selectedStockForDetail.acceptReason}</p>
                </div>
              )}

              {selectedStockForDetail.rejectReason && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-rose-800 block mb-0.5">Rejection Reason:</span>
                  <p className="text-rose-900 font-semibold">{selectedStockForDetail.rejectReason}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-between text-slate-500 font-mono text-[11px]">
                <span>Inward Time:</span>
                <span>{selectedStockForDetail.inwardTime ? new Date(selectedStockForDetail.inwardTime).toLocaleString() : 'N/A'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                type="button"
                onClick={() => setSelectedStockForDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: BULK UPLOAD RAW MATERIAL INVENTORY ──────────────────── */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full my-6 overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
              <div className="flex items-center gap-3">
                <span className="p-2 sm:p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <Upload className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg">
                    Bulk Upload Raw Material Stock
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Inward multiple raw materials, quantities, batches & quotation rates via CSV
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Step 1: Download Template */}
              <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                    <FileSpreadsheet className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Need a formatted CSV template?</h4>
                    <p className="text-xs text-slate-600">
                      Download pre-configured template with Category, Sub-Category, Item Name, Qty, Unit, Quotation Rate, Quotation ID.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 shadow-2xs transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download Template (.csv)
                </button>
              </div>

              {/* Step 2: Upload Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select CSV File to Upload
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-800">
                    {bulkFile ? bulkFile.name : 'Drag & drop your CSV file here, or browse'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 mb-3">
                    Supports .csv files up to 10MB
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer shadow-sm transition-all">
                    Browse File
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleBulkFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {bulkError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              {/* Success Result */}
              {bulkResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{bulkResult.message || 'Bulk upload completed successfully!'}</span>
                  </div>
                  {bulkResult.summary && (
                    <div className="text-[11px] text-emerald-700 pl-6 flex flex-wrap gap-4 pt-1 font-semibold">
                      <span>Total Rows: {bulkResult.summary.totalRows}</span>
                      <span>Items Inwarded: {bulkResult.summary.createdCount || bulkResult.summary.itemsCreated || 0}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Live Preview Table */}
              {bulkPreviewRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Preview First {bulkPreviewRows.length} Rows
                    </span>
                    <span className="text-[11px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                      Ready to inward
                    </span>
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-56">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Item Name</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5 text-right">Quantity</th>
                          <th className="p-2.5">Unit</th>
                          <th className="p-2.5 text-right">Quotation Rate</th>
                          <th className="p-2.5">Quotation Ref</th>
                          <th className="p-2.5">Warehouse Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bulkPreviewRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 text-slate-700">
                            <td className="p-2.5 font-bold text-slate-900">{row.itemname || row.item || row.name || '—'}</td>
                            <td className="p-2.5">{row.categoryname || row.category || '—'}</td>
                            <td className="p-2.5 text-right font-black text-rose-600">{row.quantity || row.qty || '0'}</td>
                            <td className="p-2.5 font-medium">{row.unit || 'kg'}</td>
                            <td className="p-2.5 text-right font-bold text-emerald-600">₹{row.quotationrate || row.costperunit || row.rate || '95'}</td>
                            <td className="p-2.5 font-mono text-indigo-700">{row.quotationid || row.quotation || '—'}</td>
                            <td className="p-2.5 text-slate-500">{row.warehouselocation || row.storagelocation || row.location || 'Central Warehouse'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-200/50 transition-all cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkUpload}
                disabled={bulkUploading || !bulkFile}
                className="px-5 py-2 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-2 cursor-pointer"
              >
                {bulkUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Inwarding Bulk Stock...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    Upload & Inward Stock
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
