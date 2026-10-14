// src/pages/admin/PriceSimulatorPage.jsx
// Mansara Foods B2B Price & Margin Simulator
// Pure, Direct Workflow:
// 1. Select Product Name
// 2. Enter Quantity & Unit Type
// 3. Set Margin Percentage (%) -> Wholesale Price = MRP - (MRP * Margin% / 100)
// 4. Generate Quotation & Export Excel

import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import {
  Calculator,
  Percent,
  TrendingUp,
  Package,
  Printer,
  Copy,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  Info,
  CheckCircle2,
  FileText,
  Boxes,
  ArrowRight,
  Store
} from 'lucide-react';

export default function PriceSimulatorPage() {
  // ─── DATA FETCHING ──────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  // ─── USER INPUTS: PRODUCT, QUANTITY, UNIT & MARGIN ─────────────────────────
  const [simulationItems, setSimulationItems] = useState([]);
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState(200);
  const [quantityUnitToAdd, setQuantityUnitToAdd] = useState('PCS');
  const [marginPctToAdd, setMarginPctToAdd] = useState(20); // Default 20% margin from MRP

  // ─── QUOTATION MODAL ────────────────────────────────────────────────────────
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState('');
  const [customClientName, setCustomClientName] = useState('');
  const [quotationNotes, setQuotationNotes] = useState('');
  const [quotationRefNumber, setQuotationRefNumber] = useState('');
  const quotationRef = useRef(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage.text) {
      const timer = setTimeout(() => setToastMessage({ text: '', type: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Initial Data Fetching
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prodRes, dealerRes] = await Promise.all([
        axios.get('/products?limit=100').catch(() => ({ data: { data: [] } })),
        axios.get('/dealers').catch(() => ({ data: { data: [] } }))
      ]);

      setProducts(prodRes.data.data || []);
      setDealers(dealerRes.data.data || []);
      setSimulationItems([]); // Clean slate: Zero mock data
    } catch (err) {
      console.error('Failed to load simulator data:', err);
      setToastMessage({ text: 'Failed to load catalog products', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ─── PRODUCT ADD / REMOVE HANDLERS ──────────────────────────────────────────
  const handleAddSelectedProduct = () => {
    if (!selectedProductIdToAdd) return;
    const prod = products.find(p => (p.id || p._id) === selectedProductIdToAdd);
    if (!prod) return;

    if (simulationItems.some(i => i.productId === (prod.id || prod._id))) {
      setToastMessage({ text: 'Product is already in the list. You can update its quantity or margin directly in the table.', type: 'error' });
      return;
    }

    const mrp = parseFloat(prod.originalPrice || prod.mrp || prod.price || 0);
    const safeQty = Math.max(1, parseFloat(quantityToAdd) || 1);
    const safeMargin = Math.max(0, Math.min(99, parseFloat(marginPctToAdd) || 0));

    const newItem = {
      id: 'sim-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      productId: prod.id || prod._id,
      name: prod.name,
      sku: prod.sku || 'SKU-' + Math.floor(100 + Math.random() * 900),
      quantity: safeQty,
      quantityUnit: quantityUnitToAdd,
      cartonSize: prod.cartonSize || 24,
      mrp: mrp,
      marginPct: safeMargin,
      gstPercent: parseFloat(prod.gstPercent || 5)
    };

    setSimulationItems(prev => [...prev, newItem]);
    setSelectedProductIdToAdd('');
    setToastMessage({ text: `Added "${prod.name}" (${safeQty} ${quantityUnitToAdd}) with ${safeMargin}% margin!`, type: 'success' });
  };

  const handleAddCustomCommodity = () => {
    const safeQty = Math.max(1, parseFloat(quantityToAdd) || 100);
    const safeMargin = Math.max(0, Math.min(99, parseFloat(marginPctToAdd) || 20));

    const newItem = {
      id: 'sim-' + Date.now(),
      productId: null,
      name: 'Custom Commodity / Grain / Dal',
      sku: 'BULK-COMMODITY',
      quantity: safeQty,
      quantityUnit: quantityUnitToAdd,
      cartonSize: 24,
      mrp: 100,
      marginPct: safeMargin,
      gstPercent: 5
    };

    setSimulationItems(prev => [...prev, newItem]);
    setToastMessage({ text: `Added Custom Commodity (${safeQty} ${quantityUnitToAdd})`, type: 'success' });
  };

  const handleRemoveItem = (id) => {
    setSimulationItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateItem = (id, field, value) => {
    setSimulationItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Apply a margin % to all current items
  const handleApplyMarginToAll = (margin) => {
    setMarginPctToAdd(margin);
    setSimulationItems(prev =>
      prev.map(item => ({
        ...item,
        marginPct: margin
      }))
    );
    setToastMessage({ text: `Applied ${margin}% margin to all products!`, type: 'success' });
  };

  // ─── CALCULATION ENGINE: MRP - (MRP * MARGIN% / 100) ────────────────────────
  const calculationSummary = useMemo(() => {
    let totalPieces = 0;
    let totalCartons = 0;
    let totalMrpValue = 0;
    let totalWholesaleRevenue = 0;
    let totalMarginDiscount = 0;

    const items = simulationItems.map(item => {
      const pacSize = Math.max(1, parseInt(item.cartonSize, 10) || 24);
      const rawQty = Math.max(1, parseFloat(item.quantity) || 1);
      const isBulkCarton = item.quantityUnit === 'Cartons' || item.quantityUnit === 'Boxes';
      const pieces = isBulkCarton ? rawQty * pacSize : rawQty;
      const cartons = isBulkCarton ? rawQty : Math.ceil(pieces / pacSize);

      const mrp = Math.max(0, parseFloat(item.mrp) || 0);
      const marginPct = Math.max(0, Math.min(99, parseFloat(item.marginPct) || 0));

      // Actual user calculation: Reduce margin percentage from MRP
      const marginDiscountPerUnit = Math.round((mrp * (marginPct / 100)) * 100) / 100;
      const wholesalePricePerUnit = Math.max(0, Math.round((mrp - marginDiscountPerUnit) * 100) / 100);
      const cartonPrice = Math.round((wholesalePricePerUnit * pacSize) * 100) / 100;

      const lineMrpValue = Math.round((mrp * pieces) * 100) / 100;
      const lineWholesaleTotal = Math.round((wholesalePricePerUnit * pieces) * 100) / 100;
      const lineMarginDiscountTotal = Math.round((marginDiscountPerUnit * pieces) * 100) / 100;

      totalPieces += pieces;
      totalCartons += cartons;
      totalMrpValue += lineMrpValue;
      totalWholesaleRevenue += lineWholesaleTotal;
      totalMarginDiscount += lineMarginDiscountTotal;

      return {
        ...item,
        pacSize,
        pieces,
        cartons,
        mrp,
        marginPct,
        marginDiscountPerUnit,
        wholesalePricePerUnit,
        cartonPrice,
        lineMrpValue,
        lineWholesaleTotal,
        lineMarginDiscountTotal
      };
    });

    const averageMarginPct = totalMrpValue > 0 ? Math.round((totalMarginDiscount / totalMrpValue) * 1000) / 10 : 0;

    return {
      totalPieces,
      totalCartons,
      totalMrpValue: Math.round(totalMrpValue * 100) / 100,
      totalWholesaleRevenue: Math.round(totalWholesaleRevenue * 100) / 100,
      totalMarginDiscount: Math.round(totalMarginDiscount * 100) / 100,
      averageMarginPct,
      items
    };
  }, [simulationItems]);

  // ─── STEP 8: EXCEL EXPORT ───────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (!calculationSummary.items || calculationSummary.items.length === 0) {
      setToastMessage({ text: 'Please add at least one product before exporting', type: 'error' });
      return;
    }

    const { items, totalPieces, totalCartons, totalMrpValue, totalWholesaleRevenue, totalMarginDiscount, averageMarginPct } = calculationSummary;

    const headers = [
      'Product Name',
      'SKU',
      'Order Qty',
      'Unit Type',
      'Total Units (Pcs)',
      'Total Cartons',
      'Pack Size (pcs/ctn)',
      'Catalog MRP (₹)',
      'Margin Percentage (%)',
      'Margin Discount / Unit (₹)',
      'Wholesale Price / Unit (₹)',
      'Wholesale Carton Price (₹)',
      'Total MRP Value (₹)',
      'Total Margin Discount (₹)',
      'Total Wholesale Amount (₹)'
    ];

    const rows = items.map(item => [
      `"${item.name.replace(/"/g, '""')}"`,
      item.sku,
      item.quantity,
      item.quantityUnit,
      item.pieces,
      item.cartons,
      item.pacSize,
      item.mrp.toFixed(2),
      item.marginPct + '%',
      item.marginDiscountPerUnit.toFixed(2),
      item.wholesalePricePerUnit.toFixed(2),
      item.cartonPrice.toFixed(2),
      item.lineMrpValue.toFixed(2),
      item.lineMarginDiscountTotal.toFixed(2),
      item.lineWholesaleTotal.toFixed(2)
    ]);

    const summaryRows = [
      [],
      ['--- CONSIGNMENT FINANCIAL TOTALS ---', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Total Order Units', totalPieces],
      ['Total Cartons Count', totalCartons],
      ['Total MRP Value (₹)', totalMrpValue.toFixed(2)],
      ['Total Margin Discount Provided (₹)', totalMarginDiscount.toFixed(2)],
      ['Average Margin Discount (%)', averageMarginPct + '%'],
      ['Grand Total Wholesale Payable (₹)', totalWholesaleRevenue.toFixed(2)]
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
      ...summaryRows.map(r => r.join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Mansara_Wholesale_Price_Quote_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage({ text: 'Wholesale prices successfully exported to Excel (.csv)!', type: 'success' });
  };

  // ─── STEP 8: QUOTATION MODAL HANDLERS ───────────────────────────────────────
  const handleOpenQuotation = () => {
    if (!calculationSummary.items || calculationSummary.items.length === 0) {
      setToastMessage({ text: 'Please add at least one product before generating a quotation', type: 'error' });
      return;
    }
    setQuotationRefNumber(`MF-QTN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setShowQuotationModal(true);
  };

  const handlePrintQuotation = () => {
    window.print();
  };

  const handleCopyQuotationText = () => {
    const textLines = [
      '====================================================',
      'MANSARA FOODS PVT. LTD. - WHOLESALE PRICE QUOTATION',
      `Quotation Ref: ${quotationRefNumber}`,
      `Date: ${new Date().toLocaleDateString('en-IN')}`,
      `Customer / Client: ${selectedDealer?.companyName || customClientName || 'Valued Trade Partner'}`,
      '----------------------------------------------------',
      ...calculationSummary.items.map(
        i => `${i.name} (Qty: ${i.pieces.toLocaleString()} pcs / ${i.cartons} ctn) | MRP: ₹${i.mrp.toFixed(2)} | Margin: ${i.marginPct}% | Wholesale Rate: ₹${i.wholesalePricePerUnit.toFixed(2)}/pc = ₹${i.lineWholesaleTotal.toLocaleString('en-IN')}`
      ),
      '----------------------------------------------------',
      `Total MRP Value: ₹${calculationSummary.totalMrpValue.toLocaleString('en-IN')}`,
      `Total Margin Discount: -₹${calculationSummary.totalMarginDiscount.toLocaleString('en-IN')} (${calculationSummary.averageMarginPct}%)`,
      `Grand Total Wholesale Payable: ₹${calculationSummary.totalWholesaleRevenue.toLocaleString('en-IN')}`,
      '----------------------------------------------------',
      quotationNotes ? `Notes: ${quotationNotes}` : '',
      '===================================================='
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(textLines).then(() => {
      setToastMessage({ text: 'Quotation text copied to clipboard!', type: 'success' });
    });
  };

  const selectedDealer = useMemo(() => {
    return dealers.find(d => (d.id || d._id) === selectedDealerId) || null;
  }, [dealers, selectedDealerId]);

  const MARGIN_PRESET_PILLS = [10, 15, 20, 25, 30, 35, 40, 50];

  return (
    <div className="space-y-6 pb-24 font-sans text-slate-800 animate-fade-in max-w-7xl mx-auto">
      {/* ─── TOAST NOTIFICATION ────────────────────────────────────────────── */}
      {toastMessage.text && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold animate-slide-in-right ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* ─── HEADER & WORKFLOW BAR ─────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-7 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide uppercase bg-rose-50 text-rose-700 border border-rose-200">
                <Calculator className="w-3.5 h-3.5 text-rose-600" />
                Price & Margin Simulator
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                MRP Margin Discount Engine
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              Product Price & Margin Calculator
            </h1>
            <p className="text-slate-500 text-xs lg:text-sm font-medium max-w-2xl leading-relaxed">
              Select product name, enter required quantity, and set the margin percentage to reduce the price directly from MRP.
            </p>
          </div>

          {/* Quick Action Triggers */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={fetchInitialData}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition cursor-pointer"
              title="Reset simulation"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={calculationSummary.items.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-xs shadow-md shadow-emerald-700/20 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            <button
              type="button"
              onClick={handleOpenQuotation}
              disabled={calculationSummary.items.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-black text-xs shadow-md transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Generate Quotation</span>
            </button>
          </div>
        </div>

        {/* ─── 3 INPUTS WORKFLOW STRIP ─── */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-600">
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[10px] font-black uppercase">
              How it works:
            </span>
            <span className="flex items-center gap-1.5 text-slate-900 font-bold">
              1. Product Name &rarr; 2. Quantity &rarr; 3. Margin % = Wholesale Price (MRP &minus; Margin%)
            </span>
          </div>

          {/* Quick Apply Margin Presets to All Items */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400">Preset Margin:</span>
            <div className="flex items-center gap-1">
              {MARGIN_PRESET_PILLS.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => handleApplyMarginToAll(pill)}
                  className={`px-2 py-1 text-[11px] font-black rounded-lg border transition-all cursor-pointer ${
                    marginPctToAdd === pill
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
                  }`}
                  title={`Apply ${pill}% margin discount to all products`}
                >
                  {pill}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── STEP 1, 2 & 3: PRODUCT, QUANTITY & MARGIN INPUT BAR ──────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-7 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Select Product &bull; Enter Quantity &bull; Set Margin %</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              The discounted wholesale price is automatically computed by reducing the target margin percentage from the product&apos;s catalog MRP.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddCustomCommodity}
            className="text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl border border-rose-200 transition cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Custom Commodity (Dal/Grain)</span>
          </button>
        </div>

        {/* Input Bar */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Input 1: Product Name */}
            <div className="md:col-span-5 space-y-1">
              <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider">
                1. Select Product Name
              </label>
              <select
                value={selectedProductIdToAdd}
                onChange={(e) => setSelectedProductIdToAdd(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
              >
                <option value="">-- Choose a Catalog Product --</option>
                {products.map(p => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.name} (MRP: ₹{p.originalPrice || p.mrp || p.price || 0}) • {p.cartonSize || 24} pcs/ctn
                  </option>
                ))}
              </select>
            </div>

            {/* Input 2: Quantity & Quantity Type */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider">
                2. Enter Quantity & Type
              </label>
              <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-xs overflow-hidden">
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={quantityToAdd}
                  onChange={(e) => setQuantityToAdd(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-24 py-2 px-3 text-center font-black text-xs text-slate-900 focus:outline-none"
                  title="Order Quantity"
                />
                <select
                  value={quantityUnitToAdd}
                  onChange={(e) => setQuantityUnitToAdd(e.target.value)}
                  className="bg-slate-100 hover:bg-slate-200 text-[11px] font-black text-slate-800 py-2 px-3 border-l border-slate-300 focus:outline-none cursor-pointer"
                  title="Quantity Type / Unit"
                >
                  <option value="PCS">Pcs</option>
                  <option value="Cartons">Cartons</option>
                  <option value="Packets">Packets</option>
                  <option value="Boxes">Boxes</option>
                  <option value="Kilograms">Kg</option>
                </select>
              </div>
            </div>

            {/* Input 3: Margin Percentage (%) */}
            <div className="md:col-span-3 space-y-1">
              <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider">
                3. Margin Percentage (%)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-xs overflow-hidden flex-1">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    step="0.5"
                    placeholder="Margin %"
                    value={marginPctToAdd}
                    onChange={(e) => setMarginPctToAdd(Math.max(0, Math.min(99, parseFloat(e.target.value) || 0)))}
                    className="w-full py-2 px-3 text-center font-black text-xs text-rose-700 focus:outline-none"
                  />
                  <span className="pr-3 text-xs font-black text-slate-400">%</span>
                </div>

                <button
                  type="button"
                  disabled={!selectedProductIdToAdd}
                  onClick={handleAddSelectedProduct}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Real-Time Live Calculation Preview */}
          {selectedProductIdToAdd && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/70 text-xs font-bold">
              {(() => {
                const prod = products.find(p => (p.id || p._id) === selectedProductIdToAdd);
                if (!prod) return null;
                const mrp = parseFloat(prod.originalPrice || prod.mrp || prod.price || 0);
                const discount = (mrp * (marginPctToAdd / 100));
                const price = mrp - discount;
                const pac = prod.cartonSize || 24;
                const totalUnits = (quantityUnitToAdd === 'Cartons' || quantityUnitToAdd === 'Boxes') ? quantityToAdd * pac : quantityToAdd;

                return (
                  <>
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-500" />
                      <span>
                        Catalog MRP: <strong className="text-slate-900 font-extrabold">₹{mrp.toFixed(2)}</strong> &bull; Margin Discount: <strong className="text-rose-600 font-extrabold">{marginPctToAdd}% (-₹{discount.toFixed(2)})</strong>
                      </span>
                    </span>
                    <span className="text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                      Suggested Wholesale Price: <strong className="font-black text-sm">₹{price.toFixed(2)} / pc</strong> (Carton: ₹{(price * pac).toFixed(2)})
                    </span>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* ─── SIMULATION PRODUCTS TABLE ─── */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600">
              <tr>
                <th className="py-3 px-4">Product Name & SKU</th>
                <th className="py-3 px-3 text-center">Pack Specs</th>
                <th className="py-3 px-4 text-center bg-rose-50/50 text-rose-900">Order Quantity</th>
                <th className="py-3 px-4 text-right">Catalog MRP</th>
                <th className="py-3 px-4 text-center bg-amber-50/50 text-amber-900">Margin %</th>
                <th className="py-3 px-3 text-right">Margin Discount</th>
                <th className="py-3 px-4 text-right bg-emerald-100/70 text-emerald-950 font-black">
                  Final Wholesale Price
                </th>
                <th className="py-3 px-3 text-right">Carton Rate</th>
                <th className="py-3 px-4 text-right">Line Total Amount</th>
                <th className="py-3 px-3 text-center">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {calculationSummary.items.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center bg-slate-50/50">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-slate-500">
                      <Package className="w-8 h-8 text-slate-300" />
                      <p className="font-bold text-xs text-slate-700">No products added yet</p>
                      <p className="text-[11px] text-slate-400">
                        Select a product above, enter the quantity and margin percentage to calculate discounted prices.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                calculationSummary.items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Product Name */}
                    <td className="py-3.5 px-4">
                      <p className="font-extrabold text-slate-900 text-xs leading-snug">{item.name}</p>
                      <span className="font-mono text-[10px] text-slate-400">{item.sku}</span>
                    </td>

                    {/* Pack Specs */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {item.pacSize} pcs/ctn
                      </span>
                    </td>

                    {/* Quantity & Unit Switch */}
                    <td className="py-3.5 px-4 text-center bg-rose-50/20">
                      <div className="inline-flex flex-col items-center gap-1">
                        <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, 'quantity', Math.max(1, parseFloat(e.target.value) || 1))}
                            className="w-20 py-1.5 px-2 text-center font-black text-xs text-slate-900 focus:outline-none"
                          />
                          <select
                            value={item.quantityUnit}
                            onChange={(e) => handleUpdateItem(item.id, 'quantityUnit', e.target.value)}
                            className="bg-slate-100 hover:bg-slate-200 text-[10px] font-black text-slate-800 py-1.5 px-2 border-l border-slate-300 focus:outline-none cursor-pointer"
                          >
                            <option value="PCS">Pcs</option>
                            <option value="Cartons">Cartons</option>
                            <option value="Packets">Packets</option>
                            <option value="Boxes">Boxes</option>
                            <option value="Kilograms">Kg</option>
                          </select>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono font-bold">
                          = {item.pieces.toLocaleString()} units ({item.cartons} ctn)
                        </span>
                      </div>
                    </td>

                    {/* MRP (Editable if needed) */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <span className="text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.mrp}
                          onChange={(e) => handleUpdateItem(item.id, 'mrp', Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-20 py-1 px-2 text-right font-black text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </td>

                    {/* Margin % (User Input to reduce price) */}
                    <td className="py-3.5 px-4 text-center bg-amber-50/20">
                      <div className="inline-flex items-center justify-center border border-amber-300 rounded-xl overflow-hidden bg-white shadow-xs">
                        <input
                          type="number"
                          min="0"
                          max="99"
                          step="0.5"
                          value={item.marginPct}
                          onChange={(e) => handleUpdateItem(item.id, 'marginPct', Math.max(0, Math.min(99, parseFloat(e.target.value) || 0)))}
                          className="w-16 py-1.5 px-2 text-center font-black text-xs text-rose-700 focus:outline-none"
                        />
                        <span className="pr-2 text-xs font-black text-slate-400">%</span>
                      </div>
                    </td>

                    {/* Margin Discount Amount per unit */}
                    <td className="py-3.5 px-3 text-right text-rose-600 font-bold">
                      -₹{item.marginDiscountPerUnit.toFixed(2)}
                    </td>

                    {/* Calculated Final Wholesale Price (MRP - Margin%) */}
                    <td className="py-3.5 px-4 text-right bg-emerald-50/50">
                      <span className="text-sm font-black text-emerald-700">
                        ₹{item.wholesalePricePerUnit.toFixed(2)}
                      </span>
                      <span className="block text-[9px] text-slate-400">/ unit</span>
                    </td>

                    {/* Carton Rate */}
                    <td className="py-3.5 px-3 text-right font-bold text-slate-800">
                      ₹{item.cartonPrice.toFixed(2)}
                    </td>

                    {/* Total Line Amount */}
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      ₹{Math.round(item.lineWholesaleTotal).toLocaleString('en-IN')}
                    </td>

                    {/* Remove Action */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Remove product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ─── FINANCIAL SUMMARY CARDS ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Card 1: Total Wholesale Payable */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Total Wholesale Payable
            </span>
            <p className="text-2xl font-black tracking-tight text-white">
              ₹{calculationSummary.totalWholesaleRevenue.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] font-medium text-slate-400 block pt-1">
              Final discounted wholesale consignment amount
            </span>
          </div>

          {/* Card 2: Total Margin Discount Given */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white p-5 rounded-2xl shadow-sm space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100">
              Total Margin Discount (Saved)
            </span>
            <p className="text-2xl font-black tracking-tight">
              -₹{calculationSummary.totalMarginDiscount.toLocaleString('en-IN')}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-100 pt-1">
              <span>{calculationSummary.averageMarginPct}% Average Margin from MRP</span>
            </div>
          </div>

          {/* Card 3: Total Catalog MRP Value */}
          <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Total Catalog MRP Value
            </span>
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              ₹{calculationSummary.totalMrpValue.toLocaleString('en-IN')}
            </p>
            <span className="text-[11px] font-medium text-slate-500 block pt-1">
              Combined retail price before margin discount
            </span>
          </div>

          {/* Card 4: Order Consignment Volume */}
          <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">
              Total Order Volume
            </span>
            <p className="text-2xl font-black text-rose-950 tracking-tight">
              {calculationSummary.totalPieces.toLocaleString()} Units
            </p>
            <span className="text-[11px] font-medium text-rose-700 block pt-1">
              {calculationSummary.totalCartons} Cartons across {calculationSummary.items.length} Products
            </span>
          </div>
        </div>
      </div>

      {/* ─── ACTION DECK: EXPORT EXCEL & GENERATE QUOTATION ────────────────── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-7 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Export & Official Quotation Actions
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Download the pricing sheet in Excel format or generate an official printable quotation for clients.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* Export to Excel Card */}
          <button
            type="button"
            disabled={calculationSummary.items.length === 0}
            onClick={handleExportExcel}
            className="flex items-start gap-4 p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-40 transition-all text-left cursor-pointer group shadow-xs"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-sm text-emerald-950 group-hover:text-emerald-800">
                Export to Excel (.CSV)
              </h3>
              <p className="text-xs text-emerald-800 font-medium mt-1 leading-relaxed">
                Downloads full structured spreadsheet with products, MRP, margin percentages, and final wholesale prices.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 mt-2">
                Download Spreadsheet &rarr;
              </span>
            </div>
          </button>

          {/* Generate Quotation Card */}
          <button
            type="button"
            disabled={calculationSummary.items.length === 0}
            onClick={handleOpenQuotation}
            className="flex items-start gap-4 p-5 rounded-2xl border-2 border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white transition-all text-left cursor-pointer group shadow-md"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">
                Generate Formal Quotation
              </h3>
              <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
                Opens official Mansara Foods B2B quotation document with client selector, itemized wholesale rates, and print view.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-400 mt-2">
                View & Print Official Quote &rarr;
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ─── PRINTABLE FORMAL QUOTATION MODAL ──────────────────────────────── */}
      {showQuotationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 lg:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Official Wholesale Price Quotation</h3>
                <p className="text-xs text-slate-400">Mansara Foods Pvt. Ltd. Official B2B Consignment Quote</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyQuotationText}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                  title="Copy Text Summary"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handlePrintQuotation}
                  className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Quote</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuotationModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 ml-1 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Recipient Customization Bar */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Select Registered Dealer (Optional)</label>
                <select
                  value={selectedDealerId}
                  onChange={(e) => {
                    setSelectedDealerId(e.target.value);
                    if (e.target.value) {
                      const d = dealers.find(dl => (dl.id || dl._id) === e.target.value);
                      if (d) setCustomClientName(d.companyName || d.name);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800"
                >
                  <option value="">-- Choose Existing Dealer --</option>
                  {dealers.map(d => (
                    <option key={d.id || d._id} value={d.id || d._id}>
                      {d.companyName || d.name} ({d.city || 'TN'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Customer / Client Name</label>
                <input
                  type="text"
                  placeholder="e.g. Metro Supermarkets / Global Mart"
                  value={customClientName}
                  onChange={(e) => setCustomClientName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Printable Document Sheet Content */}
            <div ref={quotationRef} className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50 space-y-6 font-sans text-xs">
              {/* Company Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <h4 className="text-xl font-black text-rose-700 tracking-tight">MANSARA FOODS PVT. LTD.</h4>
                  <p className="text-[11px] text-slate-600 font-medium mt-0.5">Manufacturers of Pure & Enriched Traditional Foods</p>
                  <p className="text-[10px] text-slate-400 mt-1">Tamil Nadu, India</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Quotation Ref</span>
                  <span className="font-mono font-black text-slate-900">{quotationRefNumber}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Date: {new Date().toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Client & Consignment Scope */}
              <div className="grid grid-cols-2 gap-4 p-3.5 bg-white rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Quotation Prepared For:</span>
                  <p className="font-black text-slate-900 text-sm">
                    {selectedDealer?.companyName || customClientName || 'Valued Trade Partner / Prospect Store'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {selectedDealer?.city || 'Tamil Nadu'} • {selectedDealer?.phone || 'B2B Trade Channel'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Order Consignment Scope</span>
                  <p className="font-bold text-slate-900">
                    {calculationSummary.totalPieces.toLocaleString()} units ({calculationSummary.totalCartons} Cartons)
                  </p>
                  <p className="text-[11px] text-emerald-700 font-extrabold">
                    {calculationSummary.items.length} Product SKUs &bull; Avg Margin: {calculationSummary.averageMarginPct}%
                  </p>
                </div>
              </div>

              {/* Item Pricing Table */}
              <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden bg-white">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-black uppercase text-slate-600">
                  <tr>
                    <th className="py-2.5 px-3">Description & Pack</th>
                    <th className="py-2.5 px-3 text-center">Order Qty</th>
                    <th className="py-2.5 px-3 text-right">MRP</th>
                    <th className="py-2.5 px-3 text-center">Margin %</th>
                    <th className="py-2.5 px-3 text-right">Wholesale Rate</th>
                    <th className="py-2.5 px-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {calculationSummary.items.map(item => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku} • {item.pacSize} pcs/carton</p>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-black text-slate-800">{item.pieces.toLocaleString()} pcs</span>
                        <span className="block text-[9px] text-slate-400 font-medium">({item.cartons} ctn)</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-600">₹{item.mrp.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-rose-600">{item.marginPct}%</td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-700">₹{item.wholesalePricePerUnit.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900">
                        ₹{item.lineWholesaleTotal.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Financial Totals Table */}
              <div className="flex justify-end">
                <div className="w-72 space-y-1.5 p-3.5 bg-white rounded-xl border border-slate-200 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total MRP Value:</span>
                    <strong className="text-slate-900">₹{calculationSummary.totalMrpValue.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between text-rose-600">
                    <span>Margin Discount ({calculationSummary.averageMarginPct}%):</span>
                    <strong>-₹{calculationSummary.totalMarginDiscount.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="flex justify-between text-slate-900 font-black text-sm pt-2 border-t border-slate-200">
                    <span>Grand Total Payable:</span>
                    <span className="text-emerald-700">₹{calculationSummary.totalWholesaleRevenue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-900 uppercase text-[10px] block">Terms & Commercial Conditions:</span>
                <p>{quotationNotes || 'Payment: 30 days net from invoice date. Delivery: Ex-Warehouse.'}</p>
                <p className="text-[10px] text-slate-400">Validity: This quote is valid for 15 days from date of issuance.</p>
              </div>

              {/* Signatory footer */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-[10px] text-slate-400">
                <div>
                  <p>Computer generated quote by Mansara Foods CRM.</p>
                  <p>Authorized Signatory - Commercial Sales Division</p>
                </div>
                <div className="text-right">
                  <div className="h-8 border-b border-slate-300 w-36 mb-1"></div>
                  <span>Authorized Signature & Stamp</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowQuotationModal(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handlePrintQuotation}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Quotation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
