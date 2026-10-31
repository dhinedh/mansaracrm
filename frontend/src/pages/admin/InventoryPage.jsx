// src/pages/admin/InventoryPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  Trash2,
  Calculator,
  Sliders,
  Sparkles,
  Scale,
  BarChart3,
  BarChart2,
  TrendingUp,
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend
} from 'recharts';
import { convertAllUnits, formatVal, normalizeUnitKey, DEFAULT_CONVERSION_RATES } from '../../utils/unitConverter';

export default function InventoryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);

  const handleTriggerPO = (stockGroup) => {
    const minQty = stockGroup.minQuantity || 50;
    const currentQty = stockGroup.totalQuantity || 0;
    const suggestedQty = Math.max(minQty * 2 - currentQty, minQty);
    navigate('/admin/procurement', {
      state: {
        autoCreatePO: true,
        itemName: stockGroup.itemName,
        suggestedQty,
        unit: stockGroup.unit || 'Cartons'
      }
    });
  };
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Custom Conversion Rates State & Settings Toggle
  const [customConversionRates, setCustomConversionRates] = useState(DEFAULT_CONVERSION_RATES);
  const [showCustomRatesAccordion, setShowCustomRatesAccordion] = useState(false);



  // State to track expanded Stock Item rows for Multi-Batch view
  const [expandedStockRows, setExpandedStockRows] = useState({});

  // Modals
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showFGModal, setShowFGModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Sales & Movement Report Modal State
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportItem, setSelectedReportItem] = useState(null); // null = overall inventory
  const [reportPeriod, setReportPeriod] = useState('day'); // 'day' | 'week' | 'month'
  const [reportRange, setReportRange] = useState('7d'); // '7d'|'14d'|'30d' or '4w'|'8w'|'12w' or '3m'|'6m'|'12m'
  const [reportChartType, setReportChartType] = useState('area'); // 'area' | 'bar'
  const [reportMetric, setReportMetric] = useState('quantity'); // 'quantity' | 'revenue'
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

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
    packetsPerCarton: '24',
    storageLocation: 'Finished Goods Warehouse, Rack B',
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  });

  // Edit Stock State
  const [editItem, setEditItem] = useState(null);
  const [editUnit, setEditUnit] = useState('Cartons');
  const [editQty, setEditQty] = useState('');
  const [editMinQty, setEditMinQty] = useState('');
  const [editLocation, setEditLocation] = useState('');
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

  // Open Add Stock Modal
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

  // 2. Submit Issue to Operations
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
          packetsPerCarton: '24',
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

  // 4. Edit Stock Quantity & Threshold
  const openEditModal = (item) => {
    setEditItem(item);
    const initialUnit = (!item.unit || item.unit.toLowerCase() === 'kg') ? 'Cartons' : item.unit;
    setEditUnit(initialUnit);
    setEditQty(String(item.quantity !== undefined && item.quantity !== null ? item.quantity : 0));
    setEditMinQty(String(item.minQuantity || 50));
    setEditLocation(item.storageLocation || 'Warehouse 1, Rack A');
    setShowEditModal(true);
  };

  const handleEditUnitChange = (newUnit) => {
    if (!newUnit || normalizeUnitKey(newUnit) === normalizeUnitKey(editUnit)) return;
    const currentQtyNum = parseFloat(editQty);
    if (!isNaN(currentQtyNum) && currentQtyNum > 0) {
      // Live convert currently entered quantity from previous unit into the newly selected unit
      const conv = convertAllUnits(currentQtyNum, editUnit, customConversionRates);
      const targetKey = normalizeUnitKey(newUnit);
      const convertedVal = conv.conversions[targetKey] !== undefined ? conv.conversions[targetKey] : currentQtyNum;
      setEditQty(String(convertedVal));
    }
    setEditUnit(newUnit);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    setEditSaving(true);
    try {
      const baseItemUnit = (!editItem.unit || editItem.unit.toLowerCase() === 'kg') ? 'Cartons' : editItem.unit;
      // Convert the user's entered quantity in editUnit to the base unit for database storage
      const conv = convertAllUnits(parseFloat(editQty) || 0, editUnit, customConversionRates);
      const baseKey = normalizeUnitKey(baseItemUnit);
      const finalQuantityInBaseUnit = Math.round(conv.conversions[baseKey] !== undefined ? conv.conversions[baseKey] : conv.conversions.cartons);

      await axios.put('/inventory/company/update', {
        productId: editItem.productId || editItem.id,
        id: editItem.id || editItem._id,
        stockId: editItem.stockId,
        quantity: finalQuantityInBaseUnit,
        minQuantity: parseInt(editMinQty),
        storageLocation: editLocation,
        unit: baseItemUnit
      });
      setMessage({
        text: `Stock count for "${editItem.itemName || editItem.product?.name}" updated to ${editQty} ${editUnit} (= ${finalQuantityInBaseUnit} ${baseItemUnit})!`,
        type: 'success'
      });
      setShowEditModal(false);
      setEditItem(null);
      fetchStocks();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update stock', type: 'error' });
    } finally {
      setEditSaving(false);
    }
  };

  // Export CSV Report with Multi-Unit Conversions
  const handleExportCSV = () => {
    if (stocks.length === 0) return;
    const headers = [
      'Stock ID',
      'Batch ID',
      'Item Name',
      'Qty Entered',
      'Unit Entered',
      'Converted Cartons (CTN)',
      'Converted Numbers (Units)',
      'Converted Packets (Pkts)',
      'Converted Boxes',
      'Converted Weight (kg)',
      'Storage Location',
      'Mfg Date',
      'Expiry Date',
      'Status'
    ];
    const rows = stocks.map(s => {
      const conv = convertAllUnits(s.quantity, s.unit, customConversionRates);
      return [
        s.stockId || 'N/A',
        s.batchId || 'N/A',
        `"${s.itemName || s.product?.name || ''}"`,
        s.quantity,
        s.unit || 'Cartons',
        conv.conversions.cartons,
        conv.conversions.numbers,
        conv.conversions.packets,
        conv.conversions.boxes,
        conv.conversions.kg,
        `"${s.storageLocation || ''}"`,
        new Date(s.mfgDate || s.createdAt).toLocaleDateString(),
        s.expiryDate ? new Date(s.expiryDate).toLocaleDateString() : 'N/A',
        s.status || 'Available'
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Report_MultiUnit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ── SALES & MOVEMENT REPORT HANDLERS ──────────────────────────────────────
  const fetchSalesReport = async (item = selectedReportItem, period = reportPeriod, range = reportRange) => {
    setReportLoading(true);
    try {
      const params = {
        period,
        range
      };
      if (item) {
        if (item.stockId) params.stockId = item.stockId;
        if (item.itemName) params.itemName = item.itemName;
        if (item.batchId) params.batchId = item.batchId;
      }
      const res = await axios.get('/inventory/sales-report', { params });
      if (res.data?.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch sales report:', err);
    } finally {
      setReportLoading(false);
    }
  };

  const handleOpenReport = (item = null) => {
    setSelectedReportItem(item);
    setShowReportModal(true);
    // Default range depending on current period
    const defaultRange = reportPeriod === 'day' ? '7d' : reportPeriod === 'week' ? '8w' : '6m';
    setReportRange(defaultRange);
    fetchSalesReport(item, reportPeriod, defaultRange);
  };

  const handlePeriodChange = (newPeriod) => {
    setReportPeriod(newPeriod);
    const newRange = newPeriod === 'day' ? '7d' : newPeriod === 'week' ? '8w' : '6m';
    setReportRange(newRange);
    fetchSalesReport(selectedReportItem, newPeriod, newRange);
  };

  const handleRangeChange = (newRange) => {
    setReportRange(newRange);
    fetchSalesReport(selectedReportItem, reportPeriod, newRange);
  };

  const handleExportReportCSV = () => {
    if (!reportData || !reportData.timeline || reportData.timeline.length === 0) return;
    const headers = ['Period / Date', 'Quantity Sold/Issued', 'Unit', 'Revenue (₹)', 'Transactions Count'];
    const rows = reportData.timeline.map(t => [
      `"${t.label || t.date || ''}"`,
      t.quantity || 0,
      reportData.unit || 'Cartons',
      t.revenue || 0,
      t.ordersCount || 1
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sales_Report_${reportPeriod}_${reportRange}_${new Date().toISOString().split('T')[0]}.csv`);
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
          unit: (!item.unit || item.unit.toLowerCase() === 'kg') ? 'Cartons' : item.unit,
          minQuantity: item.minQuantity || 50,
          totalQuantity: 0,
          batches: []
        };
      }

      map[itemKey].totalQuantity += Number(item.quantity) || 0;
      map[itemKey].batches.push(item);
    });

    return Object.values(map).map(group => {
      const converted = convertAllUnits(group.totalQuantity, group.unit, customConversionRates);
      return {
        ...group,
        converted
      };
    });
  }, [stocks, search, filterLowStock, customConversionRates]);

  // Overall Total Multi-Unit Aggregations for Stats KPI Card
  const grandConverted = useMemo(() => {
    let totalPackets = 0;
    stocks.forEach(s => {
      const c = convertAllUnits(s.quantity, s.unit, customConversionRates);
      totalPackets += c.basePackets;
    });
    return convertAllUnits(totalPackets, 'Packets', customConversionRates);
  }, [stocks, customConversionRates]);

  const lowStockCount = stocks.filter(s => s.quantity <= (s.minQuantity || 10)).length;
  const totalBatchesCount = stocks.length;

  // Multi-Unit Live Conversion Preview Component
  const MultiUnitConversionCard = ({ quantity, unit, customRates = customConversionRates, title = "Multi-Unit Auto Conversion (Live Reflecting)", onSelectUnit = null, activeUnit = null }) => {
    const result = convertAllUnits(quantity, unit, customRates);
    const { formatted } = result;

    const unitTiles = [
      { id: 'Cartons', label: 'Cartons', val: formatted.cartons, color: 'text-rose-400', activeRing: 'ring-2 ring-rose-400 bg-rose-950/70 border-rose-500' },
      { id: 'Units', label: 'Units (Pcs)', val: formatted.numbers, color: 'text-amber-400', activeRing: 'ring-2 ring-amber-400 bg-amber-950/70 border-amber-500' },
      { id: 'Packets', label: 'Packets', val: formatted.packets, color: 'text-emerald-400', activeRing: 'ring-2 ring-emerald-400 bg-emerald-950/70 border-emerald-500' },
      { id: 'Boxes', label: 'Boxes', val: formatted.boxes, color: 'text-indigo-400', activeRing: 'ring-2 ring-indigo-400 bg-indigo-950/70 border-indigo-500' },
      { id: 'kg', label: 'Kilograms', val: formatted.kg, color: 'text-cyan-400', activeRing: 'ring-2 ring-cyan-400 bg-cyan-950/70 border-cyan-500' },
    ];

    return (
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 p-3.5 rounded-2xl text-white space-y-2 border border-slate-700/80 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
          <span className="font-black text-[11px] uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-rose-400 animate-pulse" />
            {title}
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
            Input: {formatVal(Number(quantity) || 0)} {unit}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5 text-center">
          {unitTiles.map(tile => {
            const isSelected = activeUnit && normalizeUnitKey(activeUnit) === normalizeUnitKey(tile.id);
            return (
              <button
                key={tile.id}
                type="button"
                onClick={() => onSelectUnit && onSelectUnit(tile.id)}
                className={`bg-slate-800/90 p-2 rounded-xl border border-slate-700/60 flex flex-col justify-center transition-all ${
                  onSelectUnit ? 'cursor-pointer hover:bg-slate-700 hover:scale-[1.02]' : ''
                } ${isSelected ? tile.activeRing : ''}`}
                title={onSelectUnit ? `Click to edit quantity in ${tile.label}` : undefined}
              >
                <span className="block text-[8px] uppercase font-black tracking-wider text-slate-400 flex items-center justify-center gap-1">
                  <span>{tile.label}</span>
                  {isSelected && <span className="text-rose-400 font-bold">✓</span>}
                </span>
                <span className={`text-xs font-black ${tile.color} mt-0.5`}>{tile.val}</span>
              </button>
            );
          })}
        </div>
        {onSelectUnit && (
          <p className="text-[9px] text-slate-400 text-center font-medium">
            💡 Click any unit tile above to switch and edit directly in that unit
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
        <div className="space-y-1 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 sm:p-2 bg-rose-500/20 rounded-xl border border-rose-500/30 shrink-0">
              <Warehouse className="w-5 h-5 sm:w-7 sm:h-7 text-rose-400" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-black tracking-tight leading-snug">
                Central Stock & Batch Hub
              </h1>
              <p className="text-[11px] text-slate-300 sm:hidden">
                Multi-unit auto-conversion & batch traceability
              </p>
            </div>
          </div>
          <p className="hidden sm:block text-xs text-slate-300">
            Multi-Unit Measurement Auto-Conversion Engine: Add stock in any unit (Cartons, Numbers, Packets, Boxes, kg) and auto-reflect conversions across all connected modules.
          </p>
        </div>

        {/* Action Buttons: 2x2 Grid on Mobile, Flex on Desktop */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => handleOpenAddStockModal()}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">+ Add Stock</span>
          </button>

          <button
            onClick={() => setShowIssueModal(true)}
            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4 shrink-0" />
            <span className="truncate">Issue Ops</span>
          </button>

          <button
            onClick={() => setShowFGModal(true)}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Boxes className="w-4 h-4 shrink-0" />
            <span className="truncate">+ FG Goods</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 shadow-sm transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="truncate">Export CSV</span>
          </button>

          <button
            onClick={() => handleOpenReport(null)}
            className="col-span-2 sm:col-span-1 px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 active:from-indigo-900 active:to-indigo-950 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer"
            title="Open Interactive Sales & Velocity Report (Day / Week / Month Wise)"
          >
            <BarChart3 className="w-4 h-4 shrink-0 text-indigo-200" />
            <span className="truncate">Sales Report</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar: 2x2 Grid on Mobile, 4 Cols on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Stock Items</p>
          <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{groupedStockItems.length}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1">
            <Tag className="w-3 h-3 text-indigo-500" />
            Active Batches
          </p>
          <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{totalBatchesCount}</p>
        </div>

        <div className={`bg-white border rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col justify-between ${lowStockCount > 0 ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'}`}>
          <p className="text-[10px] font-black uppercase tracking-wider text-rose-600 flex items-center gap-1">
            {lowStockCount > 0 && <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />}
            Low Stock Alerts
          </p>
          <p className={`text-xl sm:text-2xl font-black mt-1 ${lowStockCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{lowStockCount}</p>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-amber-50 border border-rose-200 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-black uppercase tracking-wider text-rose-800 flex items-center gap-1">
            <Calculator className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="truncate">Converted Stock</span>
          </p>
          <p className="text-lg sm:text-xl font-black text-slate-900 mt-1 truncate">{grandConverted.formatted.cartons}</p>
          <p className="text-[9px] sm:text-[10px] font-mono text-slate-600 mt-0.5 font-bold truncate">
            = {grandConverted.formatted.kg} • {grandConverted.formatted.packets}
          </p>
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

      {/* Search Bar & Controls */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-between items-stretch sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Stock ID, Batch, Item, Location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-400 text-xs font-bold text-slate-700"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterLowStock(!filterLowStock)}
              className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center space-x-1.5 ${
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
      </div>

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
          <>
            {/* Mobile View (< md): Native app-style responsive cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {groupedStockItems.map(stockGroup => {
                const isExpanded = !!expandedStockRows[stockGroup.stockKey];
                const isLow = stockGroup.totalQuantity <= (stockGroup.minQuantity || 10);
                const conv = stockGroup.converted;

                return (
                  <div key={stockGroup.stockKey} className={`p-4 space-y-3 transition-colors ${isLow ? 'bg-rose-50/30' : 'bg-white'}`}>
                    {/* Header Row: Stock ID & Status Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200">
                          {stockGroup.stockId}
                        </span>
                        {stockGroup.category && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                            {stockGroup.category}
                          </span>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 shrink-0 ${
                        isLow ? 'bg-rose-600 text-white shadow-xs animate-pulse' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {isLow && <AlertTriangle className="w-3 h-3" />}
                        {isLow ? 'LOW STOCK' : 'HEALTHY'}
                      </span>
                    </div>

                    {/* Item Name & Stock Count */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-slate-900 text-base leading-snug break-words">{stockGroup.itemName}</h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          Min Threshold: <span className="font-bold text-slate-600">{stockGroup.minQuantity} {stockGroup.unit}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-lg font-black ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                          {stockGroup.totalQuantity} {stockGroup.unit}
                        </span>
                      </div>
                    </div>

                    {/* Converted Units Pill */}
                    {conv && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[10px] font-mono text-slate-600 font-bold flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-rose-600 font-black">≈</span>
                        <span>{conv.formatted.kg}</span>
                        <span>•</span>
                        <span>{conv.formatted.packets}</span>
                        <span>•</span>
                        <span>{conv.formatted.boxes}</span>
                      </div>
                    )}

                    {/* Action Row & Batches Toggle */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => toggleExpandRow(stockGroup.stockKey)}
                        className="inline-flex items-center gap-1.5 text-xs font-black text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 active:bg-rose-100 transition cursor-pointer"
                      >
                        <Tag className="w-3.5 h-3.5 text-rose-500" />
                        <span>{stockGroup.batches.length} Batch{stockGroup.batches.length > 1 ? 'es' : ''}</span>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenReport(stockGroup)}
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 shadow-xs transition inline-flex items-center gap-1 cursor-pointer"
                          title="View Sales & Movement Visual Report"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span className="hidden xs:inline">Report</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenAddStockModal(stockGroup)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-xl shadow-xs transition inline-flex items-center gap-1 cursor-pointer"
                          title="Add batch"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Batch</span>
                        </button>

                        {isLow && (
                          <button
                            type="button"
                            onClick={() => handleTriggerPO(stockGroup)}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer inline-flex items-center gap-1"
                            title="Auto-Generate Purchase Order"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>PO</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Expandable Batches Cards Drawer */}
                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-dashed border-slate-200 space-y-2">
                        <div className="text-xs font-black text-slate-700 flex items-center justify-between">
                          <span className="flex items-center gap-1 text-slate-800">
                            <Tag className="w-3.5 h-3.5 text-rose-600" />
                            Batches Breakdown ({stockGroup.batches.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenAddStockModal(stockGroup)}
                            className="text-rose-600 font-bold hover:underline flex items-center gap-0.5 text-xs cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Batch
                          </button>
                        </div>

                        <div className="space-y-2">
                          {stockGroup.batches.map((batchItem, bIdx) => {
                            const isExpiring = batchItem.expiryDate && (new Date(batchItem.expiryDate) - Date.now()) < 30 * 24 * 60 * 60 * 1000;
                            const batchUnit = (!batchItem.unit || batchItem.unit.toLowerCase() === 'kg') ? 'Cartons' : batchItem.unit;
                            const batchConv = convertAllUnits(batchItem.quantity, batchUnit, customConversionRates);

                            return (
                              <div
                                key={batchItem.id || batchItem._id || bIdx}
                                className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs space-y-2"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono font-black text-rose-700 text-xs">
                                    {batchItem.batchId || `BATCH-${bIdx + 1}`}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                      batchItem.status === 'In Production' ? 'bg-purple-100 text-purple-800' :
                                      batchItem.status === 'In Inspection' ? 'bg-blue-100 text-blue-800' :
                                      'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {batchItem.status || 'AVAILABLE'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReport({ ...stockGroup, ...batchItem })}
                                      className="p-1.5 text-indigo-600 hover:text-indigo-800 bg-white border border-indigo-200 rounded-lg cursor-pointer"
                                      title="View Batch Report"
                                    >
                                      <BarChart3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openEditModal(batchItem)}
                                      className="p-1.5 text-slate-600 hover:text-rose-600 bg-white border border-slate-200 rounded-lg cursor-pointer"
                                      title="Edit Batch"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="flex items-baseline justify-between">
                                  <div className="font-black text-slate-900 text-sm">
                                    {batchItem.quantity} {batchUnit}
                                  </div>
                                  <div className="text-[11px] font-medium text-slate-600 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                    <span className="truncate max-w-[140px]">{batchItem.storageLocation || 'Warehouse 1'}</span>
                                  </div>
                                </div>

                                <div className="text-[10px] font-mono text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200 font-bold">
                                  = {batchConv.formatted.kg} • {batchConv.formatted.packets} • {batchConv.formatted.boxes}
                                </div>

                                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                                  <span>Mfg: {new Date(batchItem.mfgDate || batchItem.createdAt).toLocaleDateString()}</span>
                                  {batchItem.expiryDate && (
                                    <span className={isExpiring ? 'text-rose-600 font-bold' : ''}>
                                      Exp: {new Date(batchItem.expiryDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop View (md+): Full Wide Multi-Batch Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-slate-900 text-white font-black uppercase tracking-wider text-[10px]">
                    <th className="p-4 w-10"></th>
                    <th className="p-4">Stock ID</th>
                    <th className="p-4">Item Name</th>
                    <th className="p-4 text-center">Total Stock Count</th>
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
                    const conv = stockGroup.converted;

                    let displayPrimaryText = `${stockGroup.totalQuantity} ${stockGroup.unit}`;

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
                            <div className="inline-flex flex-col items-center">
                              <span className={`text-base font-black ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                                {displayPrimaryText}
                              </span>
                              {conv && (
                                <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 mt-1 font-bold">
                                  = {conv.formatted.kg} • {conv.formatted.packets} • {conv.formatted.boxes}
                                </span>
                              )}
                            </div>
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

                          <td className="p-4 text-center space-x-1 whitespace-nowrap">
                            <button
                              onClick={() => handleOpenReport(stockGroup)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 shadow-xs transition inline-flex items-center space-x-1 cursor-pointer"
                              title="View Sales & Velocity Report (Day / Week / Month)"
                            >
                              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Report</span>
                            </button>

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
                                onClick={() => handleTriggerPO(stockGroup)}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer inline-flex items-center space-x-1"
                                title="Auto-Generate Purchase Order to Vendor"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Reorder PO</span>
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
                                        <th className="p-3">Stock Count & Multi-Unit Breakdown</th>
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
                                        const batchUnit = (!batchItem.unit || batchItem.unit.toLowerCase() === 'kg') ? 'Cartons' : batchItem.unit;
                                        const batchConv = convertAllUnits(batchItem.quantity, batchUnit, customConversionRates);

                                        return (
                                          <tr key={batchItem.id || batchItem._id || bIdx} className="hover:bg-slate-50">
                                            <td className="p-3 font-mono font-black text-rose-700 text-xs">
                                              {batchItem.batchId || `BATCH-${bIdx + 1}`}
                                            </td>
                                            <td className="p-3 font-bold text-slate-900">
                                              <div>{batchItem.quantity} {batchUnit}</div>
                                              <div className="text-[10px] text-slate-500 font-mono font-medium mt-0.5">
                                                = {batchConv.formatted.kg} | {batchConv.formatted.numbers} | {batchConv.formatted.packets} | {batchConv.formatted.boxes}
                                              </div>
                                            </td>
                                            <td className="p-3 text-slate-600">
                                              {batchItem.packagingBreakdown || 'Direct Stock Batch'}
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
                                              <div className="flex items-center justify-center gap-1">
                                                <button
                                                  onClick={() => handleOpenReport({ ...stockGroup, ...batchItem })}
                                                  className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg border border-indigo-200 cursor-pointer inline-flex items-center"
                                                  title="View Batch Movement Report"
                                                >
                                                  <BarChart3 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  onClick={() => openEditModal(batchItem)}
                                                  className="p-1 text-slate-600 hover:text-rose-600 cursor-pointer"
                                                  title="Edit Batch Count & Location"
                                                >
                                                  <Edit3 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
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
          </>
        )}
      </div>

      {/* ── MODAL 1: ADD NEW STOCK & MULTIPLE BATCHES ── */}
      {showAddStockModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 my-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-rose-600 shrink-0" />
                <span>Manual Stock Entry & Multi-Batch Assignment</span>
              </h3>
              <button onClick={() => setShowAddStockModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">✕</button>
            </div>

            <form onSubmit={handleAddStockSubmit} className="space-y-4 text-xs">
              {/* Row 1: Stock ID & Item Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Measurement (Cartons / Numbers / kg) *</label>
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

              {/* LIVE MULTI-UNIT AUTO-CONVERSION PREVIEW CARD */}
              <MultiUnitConversionCard
                quantity={addStockData.batches.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0)}
                unit={addStockData.unit}
                customRates={customConversionRates}
                title="Total Stock Live Multi-Unit Auto Conversion Preview"
              />

              {/* Optional Custom Conversion Ratios Collapsible Accordion */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowCustomRatesAccordion(!showCustomRatesAccordion)}
                  className="w-full bg-slate-50 p-2.5 text-left font-bold text-slate-700 text-xs flex justify-between items-center cursor-pointer hover:bg-slate-100"
                >
                  <span className="flex items-center gap-1.5 text-slate-800">
                    <Sliders className="w-3.5 h-3.5 text-rose-600" />
                    Custom Conversion Ratios (Optional Ratio Tuning)
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showCustomRatesAccordion ? 'rotate-180' : ''}`} />
                </button>

                {showCustomRatesAccordion && (
                  <div className="p-3 bg-white grid grid-cols-3 gap-2 text-xs border-t">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Packets per Carton</label>
                      <input
                        type="number"
                        value={customConversionRates.packetsPerCarton}
                        onChange={e => setCustomConversionRates({ ...customConversionRates, packetsPerCarton: Number(e.target.value) || 24 })}
                        className="w-full p-1.5 border rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Packets per Box</label>
                      <input
                        type="number"
                        value={customConversionRates.packetsPerBox}
                        onChange={e => setCustomConversionRates({ ...customConversionRates, packetsPerBox: Number(e.target.value) || 12 })}
                        className="w-full p-1.5 border rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Weight per Packet (kg)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={customConversionRates.kgPerPacket}
                        onChange={e => setCustomConversionRates({ ...customConversionRates, kgPerPacket: Number(e.target.value) || 0.25 })}
                        className="w-full p-1.5 border rounded-lg font-bold"
                      />
                    </div>
                  </div>
                )}
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

                {addStockData.batches.map((batch, bIdx) => {
                  const bConv = convertAllUnits(batch.quantity, addStockData.unit, customConversionRates);

                  return (
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
                          {batch.quantity > 0 && (
                            <p className="text-[10px] font-mono text-slate-500 mt-1 font-bold">
                              = {bConv.formatted.cartons} | {bConv.formatted.numbers} | {bConv.formatted.packets} | {bConv.formatted.boxes} | {bConv.formatted.kg}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                  );
                })}
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
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 my-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-600 shrink-0" />
                <span>Issue Stock to Operations</span>
              </h3>
              <button onClick={() => setShowIssueModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">✕</button>
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
                  {stocks.map(s => {
                    const sConv = convertAllUnits(s.quantity, s.unit, customConversionRates);
                    return (
                      <option key={s.id || s._id} value={s.id || s.stockId}>
                        {s.itemName || s.product?.name} ({s.batchId}) - Count: {s.quantity} {s.unit || 'Cartons'} ({sConv.formatted.packets})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {/* LIVE CONVERSION PREVIEW FOR ISSUED QUANTITY */}
              {issueQuantity > 0 && (
                <MultiUnitConversionCard
                  quantity={issueQuantity}
                  unit="Cartons"
                  customRates={customConversionRates}
                  title="Issued Stock Multi-Unit Conversion Breakdown"
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50 p-3 rounded-2xl border border-amber-200">
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
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 my-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Create Finished Goods Batch ID</span>
              </h3>
              <button onClick={() => setShowFGModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer p-1">✕</button>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-50 p-3 rounded-2xl border border-emerald-200">
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
                    placeholder="24"
                    value={fgData.packetsPerCarton}
                    onChange={e => setFgData({ ...fgData, packetsPerCarton: e.target.value })}
                    className="w-full p-2 bg-white border border-emerald-300 rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* LIVE MULTI-UNIT CONVERSION PREVIEW */}
              {fgData.cartonsCount > 0 && (
                <MultiUnitConversionCard
                  quantity={fgData.cartonsCount}
                  unit="Cartons"
                  customRates={{
                    ...customConversionRates,
                    packetsPerCarton: Number(fgData.packetsPerCarton) || 24
                  }}
                  title="Finished Goods Multi-Unit Converted Preview"
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      {/* ── MODAL 4: EDIT STOCK COUNT & MULTI-UNIT QUANTITY TYPE ── */}
      {showEditModal && editItem && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 my-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm">Edit Stock Count & Location</h3>
                  <p className="text-[10px] text-slate-400">Choose quantity unit to edit in & update warehouse location</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              {/* Product & Batch Info Bar */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="font-black text-slate-900 text-xs">{editItem.itemName || editItem.product?.name}</p>
                  <span className="text-[10px] font-mono font-bold text-slate-500">
                    Batch: {editItem.batchId || editItem.stockId}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Baseline Stock</span>
                  <span className="text-xs font-black text-rose-600">
                    {editItem.quantity} {editItem.unit || 'Cartons'}
                  </span>
                </div>
              </div>

              {/* Quantity Type (Unit) Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-rose-600" />
                    <span>Quantity Type to Edit:</span>
                  </label>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    Active: {editUnit}
                  </span>
                </div>

                {/* 5 Segmented Unit Pill Buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                  {[
                    { id: 'Cartons', label: 'Cartons (CTN)', short: 'Cartons' },
                    { id: 'Units', label: 'Units (PCS)', short: 'Units' },
                    { id: 'Packets', label: 'Packets (Pkts)', short: 'Packets' },
                    { id: 'Boxes', label: 'Boxes', short: 'Boxes' },
                    { id: 'kg', label: 'Kilograms (kg)', short: 'Kilograms' },
                  ].map(u => {
                    const isSelected = normalizeUnitKey(editUnit) === normalizeUnitKey(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleEditUnitChange(u.id)}
                        className={`py-2 px-1 rounded-xl text-[10px] font-black transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-900/20'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                        }`}
                        title={`Switch input to ${u.label}`}
                      >
                        {u.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stock Count Input in the selected unit */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-700">
                    Stock Count ({editUnit})
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Type count in {editUnit}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    required
                    value={editQty}
                    onChange={e => setEditQty(e.target.value)}
                    className="w-full p-2.5 pr-24 bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 transition"
                    placeholder={`Enter quantity in ${editUnit}...`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-200 text-slate-700 font-mono">
                      {editUnit}
                    </span>
                  </div>
                </div>
              </div>

              {/* Updated Live Multi-Unit Conversion Preview */}
              {parseFloat(editQty) > 0 && (
                <MultiUnitConversionCard
                  quantity={editQty}
                  unit={editUnit}
                  customRates={customConversionRates}
                  title="Updated Multi-Unit Conversion Preview"
                  onSelectUnit={handleEditUnitChange}
                  activeUnit={editUnit}
                />
              )}

              {/* Storage / Warehouse Location */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Storage / Warehouse Location</span>
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  placeholder="e.g. Warehouse 1, Rack B"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500 transition"
                />
              </div>

              {/* Minimum Threshold Limit */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-slate-700">
                    Minimum Alert Threshold Limit ({editItem.unit || 'Cartons'})
                  </label>
                  <span className="text-[10px] font-bold text-rose-500">
                    Alerts when &le; {editMinQty} {editItem.unit || 'Cartons'}
                  </span>
                </div>
                <input
                  type="number"
                  required
                  value={editMinQty}
                  onChange={e => setEditMinQty(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-rose-600 focus:bg-white focus:ring-2 focus:ring-rose-500 transition"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer shadow-md transition flex items-center gap-2"
                >
                  {editSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SALES & MOVEMENT REPORT MODAL ─────────────────────────────────── */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-t-3xl flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-600/30 border border-indigo-400/40 rounded-xl text-indigo-300">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                      Sales & Movement Report
                      {selectedReportItem?.stockId && (
                        <span className="text-xs font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-lg border border-indigo-400/30">
                          {selectedReportItem.stockId}
                        </span>
                      )}
                    </h2>
                    <p className="text-xs text-indigo-200 font-medium mt-0.5">
                      {selectedReportItem
                        ? `${selectedReportItem.itemName || 'Stock Item'} ${selectedReportItem.batchId ? `• Batch ${selectedReportItem.batchId}` : ''}`
                        : 'Overall Inventory Movement & Outflow Analytics'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-5 flex-1">
              {/* Period Selector Tabs & Controls Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                {/* Period Selector: Day / Week / Month */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
                  {[
                    { id: 'day', label: 'Day Wise' },
                    { id: 'week', label: 'Week Wise' },
                    { id: 'month', label: 'Month Wise' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => handlePeriodChange(tab.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                        reportPeriod === tab.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Range Selector & Chart View Toggles */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Range Selector */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
                    <span className="text-[10px] text-slate-400 font-black uppercase px-1">Range:</span>
                    {reportPeriod === 'day' && (
                      <>
                        {['7d', '14d', '30d'].map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => handleRangeChange(r)}
                            className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                              reportRange === r ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {r === '7d' ? '7 Days' : r === '14d' ? '14 Days' : '30 Days'}
                          </button>
                        ))}
                      </>
                    )}
                    {reportPeriod === 'week' && (
                      <>
                        {['4w', '8w', '12w'].map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => handleRangeChange(r)}
                            className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                              reportRange === r ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {r === '4w' ? '4 Weeks' : r === '8w' ? '8 Weeks' : '12 Weeks'}
                          </button>
                        ))}
                      </>
                    )}
                    {reportPeriod === 'month' && (
                      <>
                        {['3m', '6m', '12m'].map(r => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => handleRangeChange(r)}
                            className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                              reportRange === r ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {r === '3m' ? '3 Months' : r === '6m' ? '6 Months' : '12 Months'}
                          </button>
                        ))}
                      </>
                    )}
                  </div>

                  {/* Chart Metric Toggle: Quantity vs Revenue */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setReportMetric('quantity')}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                        reportMetric === 'quantity' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Units ({reportData?.unit || 'Cartons'})
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportMetric('revenue')}
                      className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                        reportMetric === 'revenue' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Revenue (₹)
                    </button>
                  </div>

                  {/* Chart Type Toggle: Area vs Bar */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setReportChartType('area')}
                      className={`p-1 rounded-md cursor-pointer ${
                        reportChartType === 'area' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                      title="Area Trend"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportChartType('bar')}
                      className={`p-1 rounded-md cursor-pointer ${
                        reportChartType === 'bar' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                      title="Bar Breakdown"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* KPI Summary Cards */}
              {reportData?.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-3 shadow-xs">
                    <p className="text-[10px] font-black uppercase tracking-wider text-indigo-700">Total Outflow / Sales</p>
                    <p className="text-xl font-black text-slate-900 mt-1">
                      {reportData.summary.totalQuantity?.toLocaleString()}{' '}
                      <span className="text-xs font-bold text-slate-600">{reportData.unit || 'Cartons'}</span>
                    </p>
                    <p className="text-[10px] text-indigo-600 font-bold mt-0.5">
                      {reportData.summary.totalOrders || 0} Transactions
                    </p>
                  </div>

                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3 shadow-xs">
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Total Revenue / Value</p>
                    <p className="text-xl font-black text-emerald-900 mt-1">
                      ₹{reportData.summary.totalRevenue?.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                      Avg ₹{Math.round((reportData.summary.totalRevenue || 0) / Math.max(1, reportData.summary.totalQuantity || 1))}/unit
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-xs">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Period Average</p>
                    <p className="text-xl font-black text-slate-900 mt-1">
                      {reportData.summary.avgQuantity?.toLocaleString()}{' '}
                      <span className="text-xs font-bold text-slate-600">{reportData.unit || 'Cartons'}</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">Per {reportPeriod}</p>
                  </div>

                  <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-3 shadow-xs">
                    <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Peak Period</p>
                    <p className="text-sm font-black text-amber-900 mt-2 truncate">
                      {reportData.summary.peakPeriod || 'N/A'}
                    </p>
                    <p className="text-[10px] text-amber-600 font-bold mt-0.5">Highest Movement</p>
                  </div>
                </div>
              )}

              {/* Visual Chart Representation */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Visual Velocity Timeline ({reportPeriod === 'day' ? 'Daily' : reportPeriod === 'week' ? 'Weekly' : 'Monthly'})
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">
                    Showing: {reportMetric === 'quantity' ? `Quantity (${reportData?.unit || 'Cartons'})` : 'Revenue (₹ INR)'}
                  </span>
                </div>

                {reportLoading ? (
                  <div className="h-64 flex flex-col items-center justify-center space-y-2 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                    <p className="text-xs font-bold">Loading visual trend data...</p>
                  </div>
                ) : !reportData?.timeline || reportData.timeline.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <BarChart3 className="w-8 h-8 text-slate-300 mb-1" />
                    <p className="text-xs font-bold">No sales data recorded for this selection.</p>
                  </div>
                ) : (
                  <div className="h-64 sm:h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      {reportChartType === 'area' ? (
                        <AreaChart
                          data={reportData.timeline}
                          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                        >
                          <defs>
                            <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="5%"
                                stopColor={reportMetric === 'quantity' ? '#6366f1' : '#10b981'}
                                stopOpacity={0.4}
                              />
                              <stop
                                offset="95%"
                                stopColor={reportMetric === 'quantity' ? '#6366f1' : '#10b981'}
                                stopOpacity={0.0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis
                            dataKey="label"
                            stroke="#94a3b8"
                            fontSize={10}
                            tickLine={false}
                            axisLine={{ stroke: '#e2e8f0' }}
                          />
                          <YAxis
                            stroke="#94a3b8"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={val => (reportMetric === 'revenue' ? `₹${val}` : val)}
                          />
                          <ChartTooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const dataPoint = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-700 space-y-1">
                                    <p className="font-black text-indigo-300 border-b border-slate-800 pb-1">{label}</p>
                                    <p className="font-bold flex justify-between gap-4">
                                      <span className="text-slate-400">Quantity:</span>
                                      <span className="font-mono text-white">{dataPoint.quantity} {reportData.unit || 'Cartons'}</span>
                                    </p>
                                    <p className="font-bold flex justify-between gap-4">
                                      <span className="text-slate-400">Revenue:</span>
                                      <span className="font-mono text-emerald-400">₹{dataPoint.revenue?.toLocaleString()}</span>
                                    </p>
                                    {dataPoint.ordersCount && (
                                      <p className="font-bold flex justify-between gap-4 text-[10px] text-slate-400">
                                        <span>Orders:</span>
                                        <span>{dataPoint.ordersCount}</span>
                                      </p>
                                    )}
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey={reportMetric}
                            stroke={reportMetric === 'quantity' ? '#4f46e5' : '#059669'}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorMetric)"
                            activeDot={{ r: 6, fill: reportMetric === 'quantity' ? '#4f46e5' : '#059669' }}
                          />
                        </AreaChart>
                      ) : (
                        <BarChart
                          data={reportData.timeline}
                          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                          <XAxis
                            dataKey="label"
                            stroke="#94a3b8"
                            fontSize={10}
                            tickLine={false}
                            axisLine={{ stroke: '#e2e8f0' }}
                          />
                          <YAxis
                            stroke="#94a3b8"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={val => (reportMetric === 'revenue' ? `₹${val}` : val)}
                          />
                          <ChartTooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                const dataPoint = payload[0].payload;
                                return (
                                  <div className="bg-slate-900 text-white p-2.5 rounded-xl text-xs shadow-xl border border-slate-700 space-y-1">
                                    <p className="font-black text-indigo-300 border-b border-slate-800 pb-1">{label}</p>
                                    <p className="font-bold flex justify-between gap-4">
                                      <span className="text-slate-400">Quantity:</span>
                                      <span className="font-mono text-white">{dataPoint.quantity} {reportData.unit || 'Cartons'}</span>
                                    </p>
                                    <p className="font-bold flex justify-between gap-4">
                                      <span className="text-slate-400">Revenue:</span>
                                      <span className="font-mono text-emerald-400">₹{dataPoint.revenue?.toLocaleString()}</span>
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar
                            dataKey={reportMetric}
                            fill={reportMetric === 'quantity' ? '#6366f1' : '#10b981'}
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Tabular Breakdown of Time Periods */}
              {reportData?.timeline && reportData.timeline.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                      Detailed Timeline Breakdown ({reportPeriod.toUpperCase()} WISE)
                    </span>
                    <button
                      type="button"
                      onClick={handleExportReportCSV}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto max-h-48">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[9px] sticky top-0">
                          <th className="p-2.5">Timeline Period</th>
                          <th className="p-2.5 text-center">Volume ({reportData.unit || 'Cartons'})</th>
                          <th className="p-2.5 text-center">Revenue (₹)</th>
                          <th className="p-2.5 text-center">Avg Price / Unit</th>
                          <th className="p-2.5 text-center">Orders Count</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                        {reportData.timeline.map((point, pIdx) => {
                          const avgP = point.quantity > 0 ? Math.round(point.revenue / point.quantity) : 0;
                          return (
                            <tr key={pIdx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold text-slate-900">{point.label || point.date}</td>
                              <td className="p-2.5 text-center font-mono font-bold text-indigo-700">
                                {point.quantity} {reportData.unit || 'Cartons'}
                              </td>
                              <td className="p-2.5 text-center font-mono font-bold text-emerald-700">
                                ₹{point.revenue?.toLocaleString()}
                              </td>
                              <td className="p-2.5 text-center font-mono text-slate-600">
                                ₹{avgP}
                              </td>
                              <td className="p-2.5 text-center text-slate-600">
                                {point.ordersCount || 1}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-3xl flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Switch freely between Day, Week, and Month wise breakdowns.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportReportCSV}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Report CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
