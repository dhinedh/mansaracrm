// src/pages/admin/RawMaterialCategoryPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Layers,
  Plus,
  Search,
  RefreshCw,
  FolderPlus,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Trash2,
  Package,
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  X,
  Filter,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Building2,
  Tag,
  Boxes,
  Microscope,
  Info,
  Check,
  Eye,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

export default function RawMaterialCategoryPage() {
  // ─── STATE ─────────────────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL'); // 'ALL' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'IN_STOCK'
  const [viewMode, setViewMode] = useState('CATEGORIES'); // 'CATEGORIES' | 'ITEMS'
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  // ─── CATEGORY MODAL STATE ──────────────────────────────────────────────
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catSubCategories, setCatSubCategories] = useState([]);
  const [subCatInput, setSubCatInput] = useState('');
  const [catSubmitting, setCatSubmitting] = useState(false);

  // Inline quick-add subcategory on cards
  const [cardQuickSubInputs, setCardQuickSubInputs] = useState({});

  // ─── ITEM / PRODUCT MODAL STATE ────────────────────────────────────────
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    sku: '',
    categoryId: '',
    subCategory: '',
    unit: 'kg',
    costPerUnit: '',
    currentStock: '',
    minStockLevel: '20',
    hsnCode: '',
    gstPercent: '5',
    storageCondition: 'Cool & Dry',
    specifications: '',
    notes: '',
    status: 'ACTIVE'
  });
  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [newSubInlineInput, setNewSubInlineInput] = useState('');
  const [showInlineNewSub, setShowInlineNewSub] = useState(false);

  // ─── BULK UPLOAD MODAL STATE ───────────────────────────────────────────
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkPreviewRows, setBulkPreviewRows] = useState([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkError, setBulkError] = useState('');

  // ─── INITIAL LOAD ──────────────────────────────────────────────────────
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catsRes, itemsRes] = await Promise.all([
        axios.get('/raw-materials/categories').catch(() => ({ data: { data: [] } })),
        axios.get('/raw-materials/items').catch(() => ({ data: { data: [] } }))
      ]);

      setCategories(catsRes.data?.data || []);
      setItems(itemsRes.data?.data || []);
    } catch (err) {
      console.error('Error fetching raw material data:', err);
      showToast('Failed to load raw material data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage({ text: '', type: '' });
    }, 4500);
  };

  // ─── KPI METRICS ───────────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalCategories = categories.length;
    const totalSubCategories = categories.reduce((acc, cat) => acc + (cat.subCategories?.length || 0), 0);
    const totalItems = items.length;
    const lowStockCount = items.filter(i => (i.currentStock || 0) <= (i.minStockLevel || 10)).length;
    const totalValuation = items.reduce((acc, i) => acc + ((i.currentStock || 0) * (i.costPerUnit || 0)), 0);

    return {
      totalCategories,
      totalSubCategories,
      totalItems,
      lowStockCount,
      totalValuation
    };
  }, [categories, items]);

  // ─── FILTERED DATA ─────────────────────────────────────────────────────
  const filteredCategories = useMemo(() => {
    let result = [...categories];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.subCategories && c.subCategories.some(s => s.toLowerCase().includes(q)))
      );
    }

    if (selectedCategoryFilter !== 'ALL') {
      result = result.filter(c => c._id === selectedCategoryFilter);
    }

    return result;
  }, [categories, search, selectedCategoryFilter]);

  const filteredItems = useMemo(() => {
    let result = [...items];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.sku && i.sku.toLowerCase().includes(q)) ||
        (i.categoryName && i.categoryName.toLowerCase().includes(q)) ||
        (i.subCategory && i.subCategory.toLowerCase().includes(q)) ||
        (i.hsnCode && i.hsnCode.toLowerCase().includes(q)) ||
        (i.specifications && i.specifications.toLowerCase().includes(q))
      );
    }

    if (selectedCategoryFilter !== 'ALL') {
      result = result.filter(i => (i.categoryId?._id || i.categoryId) === selectedCategoryFilter);
    }

    if (stockFilter === 'LOW_STOCK') {
      result = result.filter(i => (i.currentStock || 0) <= (i.minStockLevel || 10) && (i.currentStock || 0) > 0);
    } else if (stockFilter === 'OUT_OF_STOCK') {
      result = result.filter(i => (i.currentStock || 0) <= 0);
    } else if (stockFilter === 'IN_STOCK') {
      result = result.filter(i => (i.currentStock || 0) > (i.minStockLevel || 10));
    }

    return result;
  }, [items, search, selectedCategoryFilter, stockFilter]);

  // ─── CATEGORY HANDLERS ─────────────────────────────────────────────────
  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatCode('');
    setCatDesc('');
    setCatSubCategories([]);
    setSubCatInput('');
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat) => {
    setEditingCategory(cat);
    setCatName(cat.name || '');
    setCatCode(cat.code || '');
    setCatDesc(cat.description || '');
    setCatSubCategories(Array.isArray(cat.subCategories) ? [...cat.subCategories] : []);
    setSubCatInput('');
    setShowCategoryModal(true);
  };

  const handleAddSubTag = () => {
    const trimmed = subCatInput.trim();
    if (trimmed && !catSubCategories.includes(trimmed)) {
      setCatSubCategories([...catSubCategories, trimmed]);
      setSubCatInput('');
    }
  };

  const handleRemoveSubTag = (subToRemove) => {
    setCatSubCategories(catSubCategories.filter(s => s !== subToRemove));
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    setCatSubmitting(true);
    try {
      const payload = {
        name: catName.trim(),
        code: catCode.trim(),
        description: catDesc.trim(),
        subCategories: catSubCategories
      };

      if (editingCategory) {
        const res = await axios.put(`/raw-materials/categories/${editingCategory._id}`, payload);
        showToast(res.data?.message || 'Category updated successfully');
      } else {
        const res = await axios.post('/raw-materials/categories', payload);
        showToast(res.data?.message || 'Category created successfully');
      }

      setShowCategoryModal(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save category', 'error');
    } finally {
      setCatSubmitting(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (cat.itemCount > 0) {
      alert(`Cannot delete category "${cat.name}" because it contains ${cat.itemCount} raw material product(s). Please delete or reassign those products first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return;
    }

    try {
      const res = await axios.delete(`/raw-materials/categories/${cat._id}`);
      showToast(res.data?.message || 'Category deleted successfully');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete category', 'error');
    }
  };

  // Inline Quick Add Sub-Category from Category Card
  const handleQuickAddSub = async (catId) => {
    const inputVal = cardQuickSubInputs[catId]?.trim();
    if (!inputVal) return;

    try {
      await axios.post(`/raw-materials/categories/${catId}/subcategories`, {
        subCategory: inputVal
      });
      showToast(`Added sub-category "${inputVal}"`);
      setCardQuickSubInputs(prev => ({ ...prev, [catId]: '' }));
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add sub-category', 'error');
    }
  };

  const handleQuickRemoveSub = async (catId, subName) => {
    if (!window.confirm(`Remove sub-category "${subName}" from this category?`)) return;

    try {
      await axios.delete(`/raw-materials/categories/${catId}/subcategories/${encodeURIComponent(subName)}`);
      showToast(`Removed sub-category "${subName}"`);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove sub-category', 'error');
    }
  };

  // ─── PRODUCT / ITEM HANDLERS ───────────────────────────────────────────
  const handleOpenCreateItem = (preSelectedCatId = '') => {
    setEditingItem(null);
    const defaultCatId = preSelectedCatId || (categories[0]?._id || '');
    const foundCat = categories.find(c => c._id === defaultCatId);

    setItemForm({
      name: '',
      sku: '',
      categoryId: defaultCatId,
      subCategory: foundCat?.subCategories?.[0] || '',
      unit: 'kg',
      costPerUnit: '',
      currentStock: '',
      minStockLevel: '20',
      hsnCode: '',
      gstPercent: '5',
      storageCondition: 'Cool & Dry',
      specifications: '',
      notes: '',
      status: 'ACTIVE'
    });
    setShowInlineNewSub(false);
    setNewSubInlineInput('');
    setShowItemModal(true);
  };

  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    const catId = item.categoryId?._id || item.categoryId || '';
    setItemForm({
      name: item.name || '',
      sku: item.sku || '',
      categoryId: catId,
      subCategory: item.subCategory || '',
      unit: item.unit || 'kg',
      costPerUnit: item.costPerUnit || '',
      currentStock: item.currentStock || '',
      minStockLevel: item.minStockLevel || '20',
      hsnCode: item.hsnCode || '',
      gstPercent: item.gstPercent !== undefined ? item.gstPercent : '5',
      storageCondition: item.storageCondition || 'Cool & Dry',
      specifications: item.specifications || '',
      notes: item.notes || '',
      status: item.status || 'ACTIVE'
    });
    setShowInlineNewSub(false);
    setNewSubInlineInput('');
    setShowItemModal(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim()) {
      showToast('Product / Item name is required', 'error');
      return;
    }
    if (!itemForm.categoryId) {
      showToast('Please select a Category', 'error');
      return;
    }

    setItemSubmitting(true);
    try {
      const payload = {
        name: itemForm.name.trim(),
        sku: itemForm.sku.trim(),
        categoryId: itemForm.categoryId,
        subCategory: itemForm.subCategory.trim(),
        unit: itemForm.unit.trim(),
        costPerUnit: Number(itemForm.costPerUnit) || 0,
        currentStock: Number(itemForm.currentStock) || 0,
        minStockLevel: Number(itemForm.minStockLevel) >= 0 ? Number(itemForm.minStockLevel) : 10,
        hsnCode: itemForm.hsnCode.trim(),
        gstPercent: Number(itemForm.gstPercent) || 0,
        storageCondition: itemForm.storageCondition.trim(),
        specifications: itemForm.specifications.trim(),
        notes: itemForm.notes.trim(),
        status: itemForm.status
      };

      if (editingItem) {
        const res = await axios.put(`/raw-materials/items/${editingItem._id}`, payload);
        showToast(res.data?.message || 'Raw material product updated');
      } else {
        const res = await axios.post('/raw-materials/items', payload);
        showToast(res.data?.message || 'Raw material product added');
      }

      setShowItemModal(false);
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save raw material product', 'error');
    } finally {
      setItemSubmitting(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete raw material "${item.name}"?`)) return;

    try {
      const res = await axios.delete(`/raw-materials/items/${item._id}`);
      showToast(res.data?.message || 'Raw material product deleted');
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete raw material product', 'error');
    }
  };

  // ─── BULK UPLOAD HANDLERS ──────────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const csvContent = [
      'Category Name,Category Code,Sub Category,Item Name,SKU,Unit,Cost Per Unit,Current Stock,Min Stock Level,HSN Code,GST Percent,Storage Condition,Specifications',
      '"Pulses & Legumes","RMC-PLS","Urad Dal (Black Gram)","Superfine Urad Dal Flour","RM-PLS-URAD02","kg",115,500,100,"1106",0,"Airtight Silo","Moisture < 10.5%, 120 mesh"',
      '"Grains & Millets","RMC-GRN","Finger Millet (Ragi)","Organic Roasted Ragi Flour","RM-GRN-RAGI02","kg",48,400,150,"1008",0,"Dry warehouse","High calcium grade"',
      '"Spices & Condiments","RMC-SPC","Black Pepper","Crushed Tellicherry Black Pepper","RM-SPC-PEP02","kg",720,90,25,"0904",5,"Spice cellar","Piperine > 5.8%"',
      '"Packaging Materials","RMC-PKG","Printed Pouches","150g Metallized Barrier Pouch","RM-PKG-PCH150","pcs",2.45,6000,1500,"3923",18,"Dust-free racks","70 micron food grade"'
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mansara_raw_materials_bulk_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCsv = () => {
    if (items.length === 0) {
      showToast('No raw materials available to export', 'error');
      return;
    }

    const headers = [
      'Category Name',
      'Category Code',
      'Sub Category',
      'Item Name',
      'SKU',
      'Unit',
      'Cost Per Unit (INR)',
      'Current Stock',
      'Min Stock Level',
      'HSN Code',
      'GST Percent',
      'Storage Condition',
      'Specifications',
      'Status'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const lines = [headers.join(',')];

    items.forEach(item => {
      lines.push([
        escapeCsv(item.categoryName || item.categoryId?.name || ''),
        escapeCsv(item.categoryId?.code || ''),
        escapeCsv(item.subCategory || ''),
        escapeCsv(item.name || ''),
        escapeCsv(item.sku || ''),
        escapeCsv(item.unit || 'kg'),
        item.costPerUnit || 0,
        item.currentStock || 0,
        item.minStockLevel || 0,
        escapeCsv(item.hsnCode || ''),
        item.gstPercent || 0,
        escapeCsv(item.storageCondition || ''),
        escapeCsv(item.specifications || ''),
        escapeCsv(item.status || 'ACTIVE')
      ].join(','));
    });

    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `mansara_raw_materials_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported raw materials to CSV successfully');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFile(file);
    setBulkError('');
    setBulkResult(null);

    // Parse and show live preview
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
      const res = await axios.post('/raw-materials/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setBulkResult(res.data);
      showToast(res.data?.message || 'Bulk upload completed successfully');
      fetchData();
    } catch (err) {
      setBulkError(err.response?.data?.message || err.message || 'Bulk upload failed');
    } finally {
      setBulkUploading(false);
    }
  };

  // Selected Category's subcategories for Item modal
  const activeCategoryForModal = categories.find(c => c._id === itemForm.categoryId);

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* ─── TOAST NOTIFICATION ───────────────────────────────────────── */}
      {toastMessage.text && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${
          toastMessage.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800 shadow-rose-100'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-100'
        }`}>
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage({ text: '', type: '' })}
            className="ml-2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── DESKTOP HEADER (HIDDEN ON MOBILE TO STREAMLINE MOBILE UI) ── */}
      <div className="hidden md:flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-gradient-to-tr from-rose-500 to-rose-600 text-white rounded-xl shadow-sm inline-flex">
            <Layers className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-100 text-rose-700">
                <Microscope className="w-3 h-3" /> R&D
              </span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-slate-500 text-xs font-semibold">Formulation Ingredients & Materials</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight">
              Raw Material Categories
            </h1>
          </div>
        </div>
      </div>

      {/* ─── METRIC CARDS (HIDDEN ON MOBILE/TABLET TO SIMPLIFY MOBILE UI) ─────── */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Categories</span>
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.totalCategories}</div>
          <span className="text-xs text-slate-500 mt-1">Material Classifications</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Sub-Categories</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Tag className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.totalSubCategories}</div>
          <span className="text-xs text-slate-500 mt-1">Specialized Sub-types</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Raw Material Items</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">{metrics.totalItems}</div>
          <span className="text-xs text-slate-500 mt-1">Formulation Products</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Low Stock Alert</span>
            <span className={`p-2 rounded-xl ${metrics.lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className={`text-2xl font-black ${metrics.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {metrics.lowStockCount}
          </div>
          <span className="text-xs text-slate-500 mt-1">At or below reorder level</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Inventory Value</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            ₹{metrics.totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-slate-500 mt-1">Estimated Stock Holding</span>
        </div>
      </div>

      {/* ─── CONTROLS & FILTER BAR WITH SEARCH, UPLOAD & ADD CATEGORY ───── */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Search input with right-side Upload & Add New Category icon buttons */}
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search raw materials, categories, SKU..."
              className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
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
            title="Bulk Upload CSV"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline">Bulk Upload</span>
          </button>

          {/* Add New Category Icon Button */}
          <button
            onClick={handleOpenCreateCategory}
            className="p-2 sm:px-3.5 sm:py-2 text-xs font-black text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-xl shadow-md shadow-rose-200 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Add New Category"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">+ Category</span>
          </button>
        </div>

        {/* Center & Right Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Category:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="flex-1 sm:flex-initial px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat.name} ({cat.itemCount || 0})
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="grid grid-cols-2 sm:inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('CATEGORIES')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                viewMode === 'CATEGORIES'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Categories</span>
              <span className="px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-600 text-[10px] font-bold">
                {filteredCategories.length}
              </span>
            </button>

            <button
              onClick={() => setViewMode('ITEMS')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                viewMode === 'ITEMS'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Products</span>
              <span className="px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold">
                {filteredItems.length}
              </span>
            </button>
          </div>

          {/* Stock Filter (Shown in table mode) */}
          {viewMode === 'ITEMS' && (
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
            >
              <option value="ALL">All Stock Status</option>
              <option value="LOW_STOCK">⚠️ Low Stock Alerts</option>
              <option value="OUT_OF_STOCK">⛔ Out of Stock (0)</option>
              <option value="IN_STOCK">✅ Healthy Stock</option>
            </select>
          )}
        </div>
      </div>

      {/* ─── MAIN CONTENT ─────────────────────────────────────────────── */}
      {viewMode === 'CATEGORIES' ? (
        /* ═══════════════════════════════════════════════════════════════ */
        /* CATEGORY GRID VIEW                                             */
        /* ═══════════════════════════════════════════════════════════════ */
        <div>
          {filteredCategories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="w-16 h-16 mx-auto mb-4 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">No Raw Material Categories Found</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mt-1 mb-6">
                {search ? 'Try clearing your search query or adjust your filters.' : 'Get started by creating your first raw material category or perform a bulk upload.'}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleOpenCreateCategory}
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-md transition-all"
                >
                  + Create Category
                </button>
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
                >
                  Bulk Upload CSV
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCategories.map((cat) => {
                const catItems = items.filter(i => (i.categoryId?._id || i.categoryId) === cat._id);
                const lowStockInCat = catItems.filter(i => (i.currentStock || 0) <= (i.minStockLevel || 10)).length;

                return (
                  <div
                    key={cat._id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Card Header */}
                    <div className="p-5 border-b border-slate-100">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-gradient-to-tr from-rose-50 to-rose-100 text-rose-600 rounded-xl">
                            <Layers className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-900 text-base leading-snug group-hover:text-rose-600 transition-colors">
                              {cat.name}
                            </h3>
                            {cat.code && (
                              <span className="inline-block px-2 py-0.5 mt-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                {cat.code}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Top Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditCategory(cat)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Category"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {cat.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-2">
                          {cat.description}
                        </p>
                      )}
                    </div>

                    {/* Sub-Categories Section */}
                    <div className="p-5 bg-slate-50/50 flex-1 border-b border-slate-100">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                          <Tag className="w-3 h-3 text-rose-500" />
                          Sub-Categories ({cat.subCategories?.length || 0})
                        </span>
                      </div>

                      {/* Sub-category chips */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {cat.subCategories && cat.subCategories.length > 0 ? (
                          cat.subCategories.map((sub, sIdx) => (
                            <span
                              key={sIdx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs hover:border-rose-300 transition-colors"
                            >
                              <span>{sub}</span>
                              <button
                                type="button"
                                onClick={() => handleQuickRemoveSub(cat._id, sub)}
                                className="text-slate-300 hover:text-rose-600 rounded"
                                title={`Remove ${sub}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No sub-categories defined</span>
                        )}
                      </div>

                      {/* Quick Add Subcategory Input */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={cardQuickSubInputs[cat._id] || ''}
                          onChange={(e) => setCardQuickSubInputs({ ...cardQuickSubInputs, [cat._id]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleQuickAddSub(cat._id);
                            }
                          }}
                          placeholder="+ Add sub-category..."
                          className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuickAddSub(cat._id)}
                          className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Card Footer: Metrics & Actions */}
                    <div className="p-4 bg-white flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-800">
                          {catItems.length} Products
                        </span>

                        {lowStockInCat > 0 && (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {lowStockInCat} low
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenCreateItem(cat._id)}
                          className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center gap-1"
                          title="Add product under this category"
                        >
                          <Plus className="w-3.5 h-3.5" /> Product
                        </button>

                        <button
                          onClick={() => {
                            setSelectedCategoryFilter(cat._id);
                            setViewMode('ITEMS');
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                          title="View all products in this category"
                        >
                          View <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════ */
        /* ALL PRODUCTS / RAW MATERIAL ITEMS TABLE VIEW                    */
        /* ═══════════════════════════════════════════════════════════════ */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table Header Summary */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50">
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-900 text-sm">
                Raw Material Products List
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                {filteredItems.length} items
              </span>
              {selectedCategoryFilter !== 'ALL' && (
                <button
                  onClick={() => setSelectedCategoryFilter('ALL')}
                  className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold ml-2"
                >
                  <X className="w-3 h-3" /> Reset category filter
                </button>
              )}
            </div>

            <button
              onClick={() => handleOpenCreateItem(selectedCategoryFilter !== 'ALL' ? selectedCategoryFilter : '')}
              className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all flex items-center gap-1 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Raw Material
            </button>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center">
                <Package className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-800 text-base">No Raw Material Products Found</h4>
              <p className="text-slate-500 text-xs mt-1 mb-4">
                No items match your selected filters. Add a new raw material or adjust filters.
              </p>
              <button
                onClick={() => handleOpenCreateItem(selectedCategoryFilter !== 'ALL' ? selectedCategoryFilter : '')}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 shadow-sm"
              >
                + Add Raw Material
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Card List (Simplified & Touch-friendly for mobile screens) */}
              <div className="block md:hidden divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isLow = (item.currentStock || 0) <= (item.minStockLevel || 10);
                  const isOut = (item.currentStock || 0) <= 0;

                  return (
                    <div key={item._id} className="p-3.5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-900 text-sm truncate">{item.name}</div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                            <span className="font-semibold text-rose-600">
                              {item.categoryName || item.categoryId?.name || 'Unassigned'}
                            </span>
                            {item.subCategory && (
                              <>
                                <span>•</span>
                                <span className="font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                  {item.subCategory}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                          isOut
                            ? 'bg-rose-100 text-rose-800'
                            : isLow
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isOut ? 'Out of Stock' : `${item.currentStock || 0} ${item.unit || 'kg'}`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 mt-2.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="text-slate-400 text-[10px] uppercase font-bold block">Cost</span>
                            <span className="font-black text-slate-900">
                              ₹{(item.costPerUnit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              <span className="text-[10px] font-normal text-slate-400">/{item.unit || 'kg'}</span>
                            </span>
                          </div>
                          {item.sku && (
                            <div>
                              <span className="text-slate-400 text-[10px] uppercase font-bold block">SKU</span>
                              <span className="font-mono font-bold text-slate-700 text-xs">{item.sku}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditItem(item)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Data Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-black uppercase tracking-wider text-slate-600">
                      <th className="py-3.5 px-4">Item & Specifications</th>
                      <th className="py-3.5 px-4">Category & Sub-Category</th>
                      <th className="py-3.5 px-4">SKU / Code</th>
                      <th className="py-3.5 px-4 text-right">Cost (INR)</th>
                      <th className="py-3.5 px-4 text-center">Stock Level</th>
                      <th className="py-3.5 px-4 text-center">Reorder (Min)</th>
                      <th className="py-3.5 px-4">Storage / HSN</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredItems.map((item) => {
                      const isLow = (item.currentStock || 0) <= (item.minStockLevel || 10);
                      const isOut = (item.currentStock || 0) <= 0;

                      return (
                        <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Name & Specs */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                            {item.specifications && (
                              <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 max-w-xs">
                                {item.specifications}
                              </div>
                            )}
                          </td>

                          {/* Category & Subcategory */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">
                              {item.categoryName || item.categoryId?.name || 'Unassigned'}
                            </div>
                            {item.subCategory && (
                              <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                {item.subCategory}
                              </span>
                            )}
                          </td>

                          {/* SKU */}
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                            {item.sku || '—'}
                          </td>

                          {/* Cost Per Unit */}
                          <td className="py-3.5 px-4 text-right">
                            <span className="font-bold text-slate-900">
                              ₹{(item.costPerUnit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[10px] text-slate-400 block">/ {item.unit || 'kg'}</span>
                          </td>

                          {/* Current Stock */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex flex-col items-center">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-black inline-flex items-center gap-1 ${
                                isOut
                                  ? 'bg-rose-100 text-rose-800'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {isOut ? '⛔ Out of Stock' : `${item.currentStock || 0} ${item.unit || 'kg'}`}
                              </span>
                              {!isOut && isLow && (
                                <span className="text-[10px] text-amber-600 font-bold mt-0.5">
                                  ⚠️ Low Stock Alert
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Min Stock Level */}
                          <td className="py-3.5 px-4 text-center font-semibold text-slate-600">
                            {item.minStockLevel || 10} {item.unit || 'kg'}
                          </td>

                          {/* Storage Condition & HSN */}
                          <td className="py-3.5 px-4 text-slate-600">
                            <div className="font-medium">{item.storageCondition || 'Cool & Dry'}</div>
                            {item.hsnCode && (
                              <span className="text-[10px] text-slate-400 font-mono">HSN: {item.hsnCode}</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditItem(item)}
                                className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit Raw Material"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Raw Material"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── MODAL: CREATE / EDIT CATEGORY ────────────────────────────── */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50 to-white">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-rose-600 text-white rounded-xl shadow-xs">
                  <Layers className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    {editingCategory ? 'Edit Raw Material Category' : 'Create Raw Material Category'}
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Define category details and its associated sub-categories
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Pulses & Legumes, Grains & Millets, Spices"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category Code (Prefix)
                </label>
                <input
                  type="text"
                  value={catCode}
                  onChange={(e) => setCatCode(e.target.value.toUpperCase())}
                  placeholder="e.g. RMC-PLS, RMC-GRN, RMC-SPC"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white uppercase"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Used as SKU prefix when generating raw material item codes
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Brief description of this raw material category..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>

              {/* Sub-Categories Tag Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sub-Categories
                </label>
                <div className="flex gap-2 mb-2.5">
                  <input
                    type="text"
                    value={subCatInput}
                    onChange={(e) => setSubCatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubTag();
                      }
                    }}
                    placeholder="Type sub-category and press Enter..."
                    className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubTag}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-all"
                  >
                    + Add
                  </button>
                </div>

                {/* Tag Pills */}
                <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  {catSubCategories.length === 0 ? (
                    <span className="text-xs text-slate-400 italic">No sub-categories added yet.</span>
                  ) : (
                    catSubCategories.map((sub, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-800 shadow-2xs"
                      >
                        {sub}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubTag(sub)}
                          className="text-slate-400 hover:text-rose-600 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catSubmitting}
                  className="px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-xl shadow-md shadow-rose-200 transition-all flex items-center gap-2"
                >
                  {catSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    editingCategory ? 'Update Category' : 'Create Category'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CREATE / EDIT PRODUCT / ITEM ──────────────────────── */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-slate-900 text-white rounded-xl shadow-xs">
                  <Package className="w-5 h-5 text-rose-400" />
                </span>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    {editingItem ? 'Edit Raw Material Product' : 'Add Raw Material Product'}
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Assign category, subcategory, specifications, unit costs and stock levels
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowItemModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveItem} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Category & Subcategory Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={itemForm.categoryId}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      const cat = categories.find(c => c._id === newCatId);
                      setItemForm({
                        ...itemForm,
                        categoryId: newCatId,
                        subCategory: cat?.subCategories?.[0] || ''
                      });
                    }}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                  >
                    <option value="">Select Category...</option>
                    {categories.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Sub-Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowInlineNewSub(!showInlineNewSub)}
                      className="text-[11px] font-bold text-rose-600 hover:underline"
                    >
                      {showInlineNewSub ? 'Select Existing' : '+ Add New'}
                    </button>
                  </div>

                  {showInlineNewSub ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSubInlineInput}
                        onChange={(e) => setNewSubInlineInput(e.target.value)}
                        placeholder="New sub-category..."
                        className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newSubInlineInput.trim()) {
                            setItemForm({ ...itemForm, subCategory: newSubInlineInput.trim() });
                            setShowInlineNewSub(false);
                          }
                        }}
                        className="px-3 py-2 text-xs font-bold bg-slate-800 text-white rounded-xl"
                      >
                        Set
                      </button>
                    </div>
                  ) : (
                    <select
                      value={itemForm.subCategory}
                      onChange={(e) => setItemForm({ ...itemForm, subCategory: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">None / General</option>
                      {activeCategoryForModal?.subCategories?.map((sub, sIdx) => (
                        <option key={sIdx} value={sub}>{sub}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Product Name & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Product / Item Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={itemForm.name}
                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    placeholder="e.g. Urad Dal Flour (Grade A), Cumin Seeds"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    value={itemForm.sku}
                    onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value.toUpperCase() })}
                    placeholder="Auto or Custom"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* Units, Cost & Stock Levels */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    UOM (Unit)
                  </label>
                  <select
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="kg">kg (Kilogram)</option>
                    <option value="g">g (Gram)</option>
                    <option value="L">L (Liter)</option>
                    <option value="ml">ml (Milliliter)</option>
                    <option value="pcs">pcs (Pieces)</option>
                    <option value="bags">bags</option>
                    <option value="boxes">boxes</option>
                    <option value="quintal">quintal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cost / Unit (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={itemForm.costPerUnit}
                    onChange={(e) => setItemForm({ ...itemForm, costPerUnit: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={itemForm.currentStock}
                    onChange={(e) => setItemForm({ ...itemForm, currentStock: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Min Stock Alert
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={itemForm.minStockLevel}
                    onChange={(e) => setItemForm({ ...itemForm, minStockLevel: e.target.value })}
                    placeholder="10"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl font-bold text-amber-700"
                  />
                </div>
              </div>

              {/* Taxation & Storage */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    value={itemForm.hsnCode}
                    onChange={(e) => setItemForm({ ...itemForm, hsnCode: e.target.value })}
                    placeholder="e.g. 1106, 0904, 3923"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    GST Rate (%)
                  </label>
                  <select
                    value={itemForm.gstPercent}
                    onChange={(e) => setItemForm({ ...itemForm, gstPercent: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="0">0% (Exempt)</option>
                    <option value="5">5% (Standard Food Goods)</option>
                    <option value="12">12%</option>
                    <option value="18">18% (Packaging / Materials)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Storage Conditions
                  </label>
                  <input
                    type="text"
                    value={itemForm.storageCondition}
                    onChange={(e) => setItemForm({ ...itemForm, storageCondition: e.target.value })}
                    placeholder="e.g. Cool & Dry Silo, <12% humidity"
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Specifications / QC Grade */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Specifications & QC Parameters
                </label>
                <textarea
                  rows={2}
                  value={itemForm.specifications}
                  onChange={(e) => setItemForm({ ...itemForm, specifications: e.target.value })}
                  placeholder="e.g. Moisture max 10.5%, Protein min 24%, 120 mesh Sortex cleaned..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Internal / R&D Notes
                </label>
                <input
                  type="text"
                  value={itemForm.notes}
                  onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                  placeholder="Vendor preferences, batch testing notes, supplier contact..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={itemSubmitting}
                  className="px-5 py-2.5 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {itemSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    editingItem ? 'Update Raw Material' : 'Add Raw Material Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: BULK UPLOAD ───────────────────────────────────────── */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full my-8 overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <Upload className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    Bulk Upload Raw Materials & Categories
                  </h3>
                  <p className="text-slate-500 text-xs">
                    Upload multiple raw material categories, sub-categories, and products at once via CSV
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {/* Step 1: Download Template */}
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                    <FileSpreadsheet className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Need a CSV template?</h4>
                    <p className="text-xs text-slate-600">
                      Download our pre-formatted template with all columns (Category, Sub-Category, Item, SKU, Cost, Stock).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50 shadow-2xs transition-all shrink-0 flex items-center gap-1.5"
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
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {bulkError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              {/* Success Result Summary */}
              {bulkResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-black text-sm text-emerald-800">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>{bulkResult.message}</span>
                  </div>
                  {bulkResult.summary && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-200 text-xs">
                      <div>
                        <span className="text-slate-500 block">Categories Created:</span>
                        <span className="font-bold text-emerald-800">{bulkResult.summary.categoriesCreated}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Products Created:</span>
                        <span className="font-bold text-emerald-800">{bulkResult.summary.itemsCreated}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Products Updated:</span>
                        <span className="font-bold text-emerald-800">{bulkResult.summary.itemsUpdated}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Live Preview Table */}
              {bulkPreviewRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Preview First {bulkPreviewRows.length} Rows:
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      Will automatically create missing categories & sub-categories
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-600 sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Sub-Category</th>
                          <th className="py-2 px-3">Item Name</th>
                          <th className="py-2 px-3">SKU</th>
                          <th className="py-2 px-3">UOM</th>
                          <th className="py-2 px-3 text-right">Cost</th>
                          <th className="py-2 px-3 text-right">Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {bulkPreviewRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-semibold text-slate-900">
                              {row.categoryname || row.category || '—'}
                            </td>
                            <td className="py-1.5 px-3 text-slate-600">
                              {row.subcategory || row['sub category'] || '—'}
                            </td>
                            <td className="py-1.5 px-3 font-bold text-slate-800">
                              {row.itemname || row.name || '—'}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-slate-600">
                              {row.sku || row.itemcode || '—'}
                            </td>
                            <td className="py-1.5 px-3 text-slate-600">
                              {row.unit || 'kg'}
                            </td>
                            <td className="py-1.5 px-3 text-right font-semibold">
                              ₹{row.costperunit || row.cost || 0}
                            </td>
                            <td className="py-1.5 px-3 text-right font-semibold">
                              {row.currentstock || row.stock || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Upload Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleExecuteBulkUpload}
                  disabled={!bulkFile || bulkUploading}
                  className="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
                >
                  {bulkUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing Import...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" /> Confirm & Import Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
