// src/pages/admin/ProcurementPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import {
  FileText,
  Plus,
  Search,
  Building2,
  Package,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  CreditCard,
  Layers,
  ArrowRight,
  TrendingDown,
  FileCheck,
  DollarSign,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Calendar,
  User,
  Hash,
  Download,
  Filter,
  RefreshCw,
  Send,
  Trash2,
  MessageSquare,
  Share2
} from 'lucide-react';

// ── Type-to-Searchable & Creatable Item Select Component ────────────────────────
function ItemTypeSearchSelect({ value, onChange, masterItems = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  // Extract item names from master database items
  const existingNames = (masterItems || [])
    .map(i => i.itemName || i.name)
    .filter(Boolean);

  const allOptions = Array.from(new Set(existingNames));

  const filtered = allOptions.filter(opt =>
    opt.toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const exactMatch = allOptions.some(
    opt => opt.toLowerCase() === (searchTerm || '').trim().toLowerCase()
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOption = (optName) => {
    const matchedMaster = masterItems.find(m => (m.itemName || m.name) === optName);
    onChange(optName, matchedMaster?.category);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleAddCustom = () => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    onChange(trimmed);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <label className="block font-bold text-slate-700 mb-1">Item / Material Name *</label>

      <div
        onClick={() => setIsOpen(true)}
        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-rose-500 shadow-sm"
      >
        <input
          type="text"
          required
          placeholder="Type to search or add new item..."
          value={isOpen ? searchTerm : (value || '')}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-transparent font-bold text-slate-800 outline-none placeholder:text-slate-400 placeholder:font-normal text-xs"
        />
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-56 overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-100 text-xs">
          {filtered.length > 0 ? (
            filtered.map((opt, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectOption(opt)}
                className={`p-2.5 hover:bg-rose-50 hover:text-rose-700 rounded-xl cursor-pointer font-bold flex justify-between items-center transition-colors ${
                  value === opt ? 'bg-rose-50 text-rose-700' : 'text-slate-700'
                }`}
              >
                <span>{opt}</span>
                <span className="text-[10px] text-slate-400 font-normal">Database Item</span>
              </div>
            ))
          ) : (
            <div className="p-2 text-slate-400 text-[11px] italic text-center">No existing matching items in database</div>
          )}

          {searchTerm.trim() && !exactMatch && (
            <div
              onClick={handleAddCustom}
              className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl cursor-pointer font-black flex items-center space-x-2 transition-colors border border-emerald-200 mt-1"
            >
              <Plus className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>+ Add "{searchTerm.trim()}" to Master Database</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState('pr'); // 'pr' | 'po' | 'grn' | 'archive'

  // Data States
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [goodsReceiptNotes, setGoodsReceiptNotes] = useState([]);
  const [archiveDocs, setArchiveDocs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Modal States
  const [showCreatePRModal, setShowCreatePRModal] = useState(false);
  const [showAddQuoteModal, setShowAddQuoteModal] = useState(false);
  const [showCreateGRNModal, setShowCreateGRNModal] = useState(false);
  const [showViewPOModal, setShowViewPOModal] = useState(false);
  const [showViewPRModal, setShowViewPRModal] = useState(false);
  const [showSendWhatsAppModal, setShowSendWhatsAppModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Selected State
  const [selectedPR, setSelectedPR] = useState(null);
  const [selectedPO, setSelectedPO] = useState(null);
  const [selectedGRN, setSelectedGRN] = useState(null);

  // WhatsApp RFQ State
  const [selectedVendorsForWhatsApp, setSelectedVendorsForWhatsApp] = useState([]);
  const [customWhatsAppMsg, setCustomWhatsAppMsg] = useState('');

  // PR Multi-item Form State
  const [prItems, setPrItems] = useState([
    { itemName: '', category: 'Raw Materials', requiredQuantity: 100, unit: 'kg', targetDeliveryDate: '' }
  ]);
  const [prNotes, setPrNotes] = useState('');

  // Multi-Vendor Proforma Invoices Form State
  const [vendorInvoiceEntries, setVendorInvoiceEntries] = useState([
    {
      vendorId: '',
      vendorInvoiceNumber: '',
      itemizedPrices: {},
      paymentTerms: 'Net 30 Days',
      leadTimeDays: 3,
      notes: ''
    }
  ]);

  // Quick Vendor Creation State
  const [showQuickVendorModal, setShowQuickVendorModal] = useState(false);
  const [quickVendorTargetIndex, setQuickVendorTargetIndex] = useState(0);
  const [quickVendorData, setQuickVendorData] = useState({
    legalName: '',
    primaryContactPerson: '',
    phone: '',
    email: '',
    officeAddress: 'Main Factory Unit',
    supplyCategory: 'Raw Materials'
  });

  // GRN Form State
  const [grnInvoiceNumber, setGrnInvoiceNumber] = useState('');
  const [grnChallanNumber, setGrnChallanNumber] = useState('');
  const [grnItems, setGrnItems] = useState([]);
  const [grnInspectedBy, setGrnInspectedBy] = useState('Quality Inspector Lead');
  const [grnPaymentStatus, setGrnPaymentStatus] = useState('PENDING_PAYMENT');
  const [grnPaymentRef, setGrnPaymentRef] = useState('');
  const [grnPaymentMode, setGrnPaymentMode] = useState('NEFT / Bank Transfer');

  // Payment Form State
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentMode, setPaymentMode] = useState('NEFT / Bank Transfer');

  useEffect(() => {
    fetchAllProcurementData();
  }, []);

  const fetchAllProcurementData = async () => {
    setLoading(true);
    try {
      const [prRes, poRes, grnRes, archiveRes, vendorRes, invRes] = await Promise.all([
        axios.get('/procurement/purchase-requests'),
        axios.get('/procurement/purchase-orders'),
        axios.get('/procurement/grn'),
        axios.get('/procurement/document-archive'),
        axios.get('/vendors'),
        axios.get('/inventory/company')
      ]);

      if (prRes.data.success) setPurchaseRequests(prRes.data.data);
      if (poRes.data.success) setPurchaseOrders(poRes.data.data);
      if (grnRes.data.success) setGoodsReceiptNotes(grnRes.data.data);
      if (archiveRes.data.success) setArchiveDocs(archiveRes.data.data);
      if (vendorRes.data.success) setVendors(vendorRes.data.data);
      if (invRes.data.success) setInventories(invRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch procurement data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Multi-item row helpers for PR
  const handleAddPRItemRow = () => {
    setPrItems(prev => [
      ...prev,
      { itemName: '', category: 'Raw Materials', requiredQuantity: 100, unit: 'kg', targetDeliveryDate: '' }
    ]);
  };

  const handleRemovePRItemRow = (index) => {
    if (prItems.length === 1) return;
    setPrItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdatePRItemRow = (index, field, value) => {
    setPrItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Open WhatsApp RFQ Broadcast Modal
  const handleOpenWhatsAppModal = (pr) => {
    setSelectedPR(pr);
    setSelectedVendorsForWhatsApp(vendors.map(v => v.id));

    const itemsSummary = (pr.items || [])
      .map((item, i) => `${i + 1}. *${item.itemName}* (${item.category}) — ${item.requiredQuantity} ${item.unit}`)
      .join('\n');

    const msg = `*MANSARA FOODS - PURCHASE REQUEST FOR QUOTATION*\nPR Ref: *${pr.prNumber}*\n\nDear Supplier,\nWe request your best price quotation and lead time for the following items:\n\n${itemsSummary}\n\nNotes: ${pr.notes || 'N/A'}\n\nPlease reply with your unit price quotation and lead time. Thank you!`;

    setCustomWhatsAppMsg(msg);
    setShowSendWhatsAppModal(true);
  };

  // Send WhatsApp Broadcast
  const handleSendWhatsAppBroadcast = () => {
    if (selectedVendorsForWhatsApp.length === 0) {
      setMessage({ text: 'Please select at least one vendor to send the WhatsApp message.', type: 'error' });
      return;
    }

    const selectedVendorObjs = vendors.filter(v => selectedVendorsForWhatsApp.includes(v.id));

    selectedVendorObjs.forEach(v => {
      if (v.phone) {
        let cleanPhone = v.phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;
        const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(customWhatsAppMsg)}`;
        window.open(url, '_blank');
      }
    });

    setMessage({ text: `WhatsApp RFQ sent to ${selectedVendorObjs.length} vendor(s) successfully!`, type: 'success' });
    setShowSendWhatsAppModal(false);
  };

  // ── 1. CREATE PR ─────────────────────────────────────────────────────────────
  const handleCreatePR = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    try {
      const res = await axios.post('/procurement/purchase-requests', {
        items: prItems,
        notes: prNotes
      });

      if (res.data.success) {
        setMessage({ text: `Purchase Request ${res.data.data.prNumber} raised successfully!`, type: 'success' });
        setShowCreatePRModal(false);
        setPrItems([{ itemName: '', category: 'Raw Materials', requiredQuantity: 100, unit: 'kg' }]);
        setPrNotes('');
        fetchAllProcurementData();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to create PR.', type: 'error' });
    }
  };

  // Multi-Vendor Invoice Row Helpers
  const handleAddVendorInvoiceEntryRow = () => {
    if (!selectedPR) return;
    const initialPrices = {};
    (selectedPR.items || []).forEach(item => {
      initialPrices[item.itemName] = '';
    });

    setVendorInvoiceEntries(prev => [
      ...prev,
      {
        vendorId: '',
        vendorInvoiceNumber: `PINV-${selectedPR.prNumber.slice(-5)}-${(selectedPR.quotes?.length || 0) + prev.length + 1}`,
        itemizedPrices: initialPrices,
        paymentTerms: 'Net 30 Days',
        leadTimeDays: 3,
        notes: ''
      }
    ]);
  };

  const handleRemoveVendorInvoiceEntryRow = (index) => {
    if (vendorInvoiceEntries.length === 1) return;
    setVendorInvoiceEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateVendorInvoiceEntryField = (index, field, value) => {
    setVendorInvoiceEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleUpdateVendorItemizedPrice = (entryIndex, itemName, price) => {
    setVendorInvoiceEntries(prev => {
      const updated = [...prev];
      const updatedPrices = { ...(updated[entryIndex].itemizedPrices || {}), [itemName]: price };
      updated[entryIndex] = { ...updated[entryIndex], itemizedPrices: updatedPrices };
      return updated;
    });
  };

  // Open Vendor Proforma Invoice Modal
  const handleOpenAddQuoteModal = async (pr) => {
    setSelectedPR(pr);

    // Refresh vendor directory list
    try {
      const vRes = await axios.get('/vendors');
      if (vRes.data.success) {
        setVendors(vRes.data.data);
      }
    } catch (err) {
      console.error('Failed to refresh vendors:', err);
    }

    const initialPrices = {};
    (pr.items || []).forEach(item => {
      initialPrices[item.itemName] = '';
    });

    setVendorInvoiceEntries([
      {
        vendorId: '',
        vendorInvoiceNumber: `PINV-${pr.prNumber.slice(-5)}-${(pr.quotes?.length || 0) + 1}`,
        itemizedPrices: initialPrices,
        paymentTerms: 'Net 30 Days',
        leadTimeDays: 3,
        notes: ''
      }
    ]);
    setShowAddQuoteModal(true);
  };

  // Create Quick Vendor Handler
  const handleCreateQuickVendor = async (e) => {
    e.preventDefault();
    if (!quickVendorData.legalName || !quickVendorData.primaryContactPerson || !quickVendorData.phone || !quickVendorData.email) {
      setMessage({ text: 'Please fill in all required vendor fields.', type: 'error' });
      return;
    }

    try {
      const res = await axios.post('/vendors', quickVendorData);
      if (res.data.success) {
        const newVendor = res.data.data;
        setMessage({ text: `Vendor ${newVendor.legalName} registered & selected successfully!`, type: 'success' });
        
        // Refresh vendors list
        const vRes = await axios.get('/vendors');
        if (vRes.data.success) {
          setVendors(vRes.data.data);
        }

        // Auto-assign to entry row
        handleUpdateVendorInvoiceEntryField(quickVendorTargetIndex, 'vendorId', newVendor.id);
        setShowQuickVendorModal(false);
        setQuickVendorData({
          legalName: '',
          primaryContactPerson: '',
          phone: '',
          email: '',
          officeAddress: 'Main Factory Unit',
          supplyCategory: 'Raw Materials'
        });
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to register vendor.', type: 'error' });
    }
  };

  // ── 2. ADD VENDOR PROFORMA INVOICES (SINGLE OR MULTIPLE) ──────────────────────
  const handleAddQuote = async (e) => {
    e.preventDefault();
    if (!selectedPR) return;

    // Check if vendor is selected for all entries
    const invalidEntry = vendorInvoiceEntries.find(entry => !entry.vendorId);
    if (invalidEntry) {
      setMessage({ text: 'Please select a vendor for all invoice entries.', type: 'error' });
      return;
    }

    const invoicesPayload = vendorInvoiceEntries.map(entry => ({
      vendorId: entry.vendorId,
      vendorInvoiceNumber: entry.vendorInvoiceNumber,
      itemizedPrices: Object.entries(entry.itemizedPrices || {}).map(([itemName, price]) => ({
        itemName,
        unitPrice: Number(price) || 0
      })),
      paymentTerms: entry.paymentTerms,
      leadTimeDays: Number(entry.leadTimeDays) || 3,
      notes: entry.notes
    }));

    try {
      const res = await axios.post(`/procurement/purchase-requests/${selectedPR.id}/add-quote`, {
        invoices: invoicesPayload
      });

      if (res.data.success) {
        setMessage({ text: `${invoicesPayload.length} Vendor Proforma Invoice(s) recorded for PR #${selectedPR.prNumber}!`, type: 'success' });
        setShowAddQuoteModal(false);
        setVendorInvoiceEntries([]);
        fetchAllProcurementData();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to add vendor invoices.', type: 'error' });
    }
  };

  // ── 3. GENERATE PO FROM SELECTED VENDOR INVOICE ─────────────────────────────────
  const handleGeneratePO = async (pr, quote) => {
    try {
      const res = await axios.post(`/procurement/purchase-requests/${pr.id}/generate-po`, {
        selectedVendorId: quote.vendorId,
        vendorInvoiceNumber: quote.vendorInvoiceNumber,
        paymentTerms: quote.paymentTerms || 'Net 30 Days'
      });

      if (res.data.success) {
        setMessage({ text: `Purchase Order ${res.data.data.poNumber} generated from Vendor Invoice #${quote.vendorInvoiceNumber || 'N/A'}!`, type: 'success' });
        setActiveTab('po');
        fetchAllProcurementData();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to generate PO.', type: 'error' });
    }
  };

  // ── 4. OPEN GRN MODAL FOR PO ─────────────────────────────────────────────────
  const handleOpenGRNModal = (po) => {
    setSelectedPO(po);
    setGrnInvoiceNumber(`INV-${Date.now().toString().slice(-4)}`);
    setGrnChallanNumber(`CH-${Date.now().toString().slice(-4)}`);

    const initialItems = (po.items || []).map((item, idx) => ({
      itemName: item.itemName,
      category: item.category || 'Raw Materials',
      orderedQuantity: item.orderedQuantity,
      receivedQuantity: item.orderedQuantity,
      acceptedQuantity: item.orderedQuantity,
      rejectedQuantity: 0,
      unitPrice: item.unitPrice,
      unit: item.unit || 'kg',
      batchId: `BATCH-RM-${Date.now().toString().slice(-4)}-${idx + 1}`,
      qualityStatus: 'PASS',
      qualityNotes: 'Quality verified - FSSAI compliant'
    }));

    setGrnItems(initialItems);
    setGrnPaymentStatus('PENDING_PAYMENT');
    setGrnPaymentRef(`NEFT-${Date.now().toString().slice(-6)}`);
    setGrnPaymentMode('NEFT / Bank Transfer');
    setShowCreateGRNModal(true);
  };

  // ── 5. SUBMIT GRN ────────────────────────────────────────────────────────────
  const handleSubmitGRN = async (e, overrideStatus = null) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedPO) return;

    const finalPaymentStatus = overrideStatus || grnPaymentStatus;

    try {
      const res = await axios.post(`/procurement/purchase-orders/${selectedPO.id}/create-grn`, {
        invoiceNumber: grnInvoiceNumber,
        challanNumber: grnChallanNumber,
        items: grnItems,
        inspectedBy: grnInspectedBy,
        paymentStatus: finalPaymentStatus,
        paymentReference: grnPaymentRef,
        paymentMode: grnPaymentMode
      });

      if (res.data.success) {
        const isPaidMsg = finalPaymentStatus === 'PAID' ? ' & Payment Marked as PAID' : '';
        setMessage({ text: `GRN ${res.data.data.grnNumber} generated! Raw material inventory updated with Batch IDs${isPaidMsg}.`, type: 'success' });
        setShowCreateGRNModal(false);
        setActiveTab(finalPaymentStatus === 'PAID' ? 'payment' : 'grn');
        fetchAllProcurementData();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to generate GRN.', type: 'error' });
    }
  };

  // ── 6. PROCESS PAYMENT CLEARANCE ──────────────────────────────────────────────
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!selectedGRN) return;

    try {
      const res = await axios.put(`/procurement/grn/${selectedGRN.id}/payment`, {
        paymentStatus: 'PAID',
        paidAmount: paidAmount || selectedGRN.totalAcceptedAmount,
        paymentReference: paymentRef || `NEFT-${Date.now().toString().slice(-6)}`,
        paymentMode: 'NEFT / Bank Transfer'
      });

      if (res.data.success) {
        setMessage({ text: `Accounts clearance completed for GRN #${selectedGRN.grnNumber}! Marked as PAID.`, type: 'success' });
        setShowPaymentModal(false);
        fetchAllProcurementData();
      }
    } catch (err) {
      setMessage({ text: 'Failed to process payment clearance.', type: 'error' });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Header Bar ── */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
              End-to-End Supply Chain ERP
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-rose-500" />
            Procurement & Purchase Order Management
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Complete procurement lifecycle: Purchase Requests (PR) ➔ Vendor Quotations ➔ System Purchase Orders (PO) ➔ Goods Receipt Note (GRN) & Batch ID Assignment ➔ Document Archiving & Accounts Payment Clearance.
          </p>
        </div>

        <button
          onClick={() => setShowCreatePRModal(true)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-xs flex items-center space-x-2 shadow-lg cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Raise Purchase Request (PR)</span>
        </button>
      </div>

      {/* ── Operational 5-Step Process Pipeline Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm text-[11px] font-bold text-center">
        <button
          onClick={() => setActiveTab('pr')}
          className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'pr' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="text-[10px] text-rose-400 font-mono">STEP 1</span>
          <span>1. Purchase Request (PR)</span>
        </button>
        <button
          onClick={() => setActiveTab('po')}
          className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'po' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="text-[10px] text-indigo-400 font-mono">STEP 2</span>
          <span>2. Purchase Orders (PO)</span>
        </button>
        <button
          onClick={() => setActiveTab('grn')}
          className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'grn' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="text-[10px] text-emerald-400 font-mono">STEP 3</span>
          <span>3. Material Receipt & GRN</span>
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'archive' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="text-[10px] text-amber-400 font-mono">STEP 4</span>
          <span>4. Document Archive</span>
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeTab === 'payment' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="text-[10px] text-teal-400 font-mono">STEP 5</span>
          <span>5. Payment Clearance</span>
        </button>
      </div>

      {/* ── Notification Banner ── */}
      {message.text && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in ${
          message.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })} className="hover:opacity-75">✕</button>
        </div>
      )}

      {/* ── TAB 1: PURCHASE REQUESTS & VENDOR QUOTATION SELECTION ── */}
      {activeTab === 'pr' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-600" />
                Purchase Requests & Quotations (Step 1)
              </h3>
              <p className="text-xs text-slate-500">Raise requests for raw materials, gather competitive vendor quotes, and select the winning offer.</p>
            </div>
            <button
              onClick={() => setShowCreatePRModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 cursor-pointer"
            >
              + Raise New PR
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchaseRequests.map(pr => (
              <div key={pr.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-100 uppercase tracking-wider">
                      {pr.prNumber}
                    </span>
                    <h4 className="font-black text-slate-800 text-sm pt-1">
                      Purchase Request ({pr.items?.length || 0} {pr.items?.length === 1 ? 'Item' : 'Items'})
                    </h4>
                    <span className="text-[10px] text-slate-400 block font-medium">Requested By: {pr.requestedBy} • {new Date(pr.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                    pr.status === 'PO_CREATED' ? 'bg-emerald-100 text-emerald-800' :
                    pr.status === 'QUOTES_RECEIVED' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {pr.status}
                  </span>
                </div>

                {/* Items Table */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 border-b">
                      <tr>
                        <th className="py-2 px-3">Item / Material</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3 text-right">Required Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {pr.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-100/50">
                          <td className="py-2 px-3 font-bold text-slate-800">{item.itemName}</td>
                          <td className="py-2 px-3 text-slate-500">{item.category || 'Raw Materials'}</td>
                          <td className="py-2 px-3 text-right font-black text-rose-700">{item.requiredQuantity} {item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Actions: Download PR & Send to Vendors via WhatsApp */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => { setSelectedPR(pr); setShowViewPRModal(true); }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-xl flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Download / Print PR</span>
                  </button>

                  <button
                    onClick={() => handleOpenWhatsAppModal(pr)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl flex items-center space-x-1.5 shadow-sm cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send via WhatsApp</span>
                  </button>
                </div>

                {/* Vendor Proforma Invoices & Quotations Summary Matrix */}
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <div>
                      <h5 className="text-[11px] font-black text-slate-800 uppercase flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        Vendor Proforma Invoices ({pr.quotes?.length || 0})
                      </h5>
                      <span className="text-[10px] text-slate-400 font-medium">Compare quotes & choose winning invoice for PO</span>
                    </div>

                    {pr.status !== 'PO_CREATED' && (
                      <button
                        onClick={() => handleOpenAddQuoteModal(pr)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded-xl flex items-center space-x-1 shadow-sm cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Enter Vendor Invoice</span>
                      </button>
                    )}
                  </div>

                  {pr.quotes && pr.quotes.length > 0 ? (
                    <div className="space-y-2.5">
                      {pr.quotes.map((q, idx) => {
                        const isAccepted = q.status === 'ACCEPTED' || pr.selectedInvoiceNumber === q.vendorInvoiceNumber;
                        const isLowest = pr.quotes.length > 1 && q.totalQuoteAmount === Math.min(...pr.quotes.map(x => x.totalQuoteAmount));

                        return (
                          <div
                            key={idx}
                            className={`p-3.5 rounded-2xl border transition-all text-xs space-y-2 ${
                              isAccepted
                                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20'
                                : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-black text-slate-900 text-xs">{q.vendorName}</span>
                                  {isLowest && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-emerald-200">
                                      ★ Lowest Quote
                                    </span>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-slate-500 block">
                                  Invoice #{q.vendorInvoiceNumber || 'N/A'} • Terms: {q.paymentTerms || 'Net 30'} • Lead Time: {q.leadTimeDays || 3} days
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="font-black text-slate-900 text-sm block font-mono">
                                  ₹{q.totalQuoteAmount?.toLocaleString()}
                                </span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  isAccepted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {isAccepted ? 'PO GENERATED' : q.status || 'PENDING'}
                                </span>
                              </div>
                            </div>

                            {/* Itemized Price Breakdown */}
                            {q.itemizedPrices && q.itemizedPrices.length > 0 && (
                              <div className="bg-white/80 p-2 rounded-xl border border-slate-200/80 text-[11px] space-y-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase block">Itemized Pricing Breakdown:</span>
                                <div className="grid grid-cols-1 gap-1 divide-y divide-slate-100">
                                  {q.itemizedPrices.map((ip, i) => (
                                    <div key={i} className="flex justify-between pt-0.5 font-medium">
                                      <span className="text-slate-700">{ip.itemName}</span>
                                      <span className="font-bold text-slate-900 font-mono">
                                        ₹{ip.unitPrice}/unit (Total: ₹{ip.totalPrice?.toLocaleString()})
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Action: Select this Invoice to Generate PO */}
                            {pr.status !== 'PO_CREATED' && !isAccepted && (
                              <div className="flex justify-end pt-1">
                                <button
                                  onClick={() => handleGeneratePO(pr, q)}
                                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-xl flex items-center space-x-1.5 shadow-sm cursor-pointer"
                                >
                                  <FileCheck className="w-3.5 h-3.5" />
                                  <span>Select This Invoice & Generate PO</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-xs text-slate-400 space-y-1">
                      <p className="font-medium">No vendor proforma invoices recorded yet for PR #{pr.prNumber}.</p>
                      <p className="text-[10px]">Click "+ Enter Vendor Invoice" above to log incoming quotes from suppliers.</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 2: PURCHASE ORDERS (PO) ── */}
      {activeTab === 'po' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                Purchase Orders Directory (Step 2)
              </h3>
              <p className="text-xs text-slate-500">Formal POs generated for suppliers. Export PDF or create Material Goods Receipt Note (GRN) upon delivery.</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Vendor Name</th>
                  <th className="py-3 px-4">Items & Qty</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {purchaseOrders.map(po => (
                  <tr key={po.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700">{po.poNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{po.vendorName}</td>
                    <td className="py-3 px-4">
                      {po.items?.map(i => `${i.itemName} (${i.orderedQuantity} ${i.unit})`).join(', ')}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">₹{po.totalAmount}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        po.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                        po.status === 'PARTIALLY_DELIVERED' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => { setSelectedPO(po); setShowViewPOModal(true); }}
                        className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] cursor-pointer"
                      >
                        Print / View PO
                      </button>
                      {po.status !== 'DELIVERED' && (
                        <button
                          onClick={() => handleOpenGRNModal(po)}
                          className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer"
                        >
                          Receive Goods (GRN)
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: GOODS RECEIPT NOTE (GRN) & BATCH ID ENTRY ── */}
      {activeTab === 'grn' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Goods Receipt Notes (GRN), Batch IDs & Stock Updates (Step 3)
              </h3>
              <p className="text-xs text-slate-500">Material inspection, accepted vs rejected quantities, Batch ID assignment, and automatic inventory stock entry.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goodsReceiptNotes.map(grn => (
              <div key={grn.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start border-b pb-3">
                  <div>
                    <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100 font-mono">
                      {grn.grnNumber}
                    </span>
                    <h4 className="font-black text-slate-800 text-sm pt-1">
                      {grn.vendorName}
                    </h4>
                    <span className="text-[10px] text-slate-400 block font-mono">Invoice #{grn.invoiceNumber || 'N/A'} • Challan #{grn.challanNumber || 'N/A'}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    grn.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {grn.paymentStatus}
                  </span>
                </div>

                {/* Items & Batch Info */}
                <div className="space-y-2 text-xs">
                  {grn.items?.map((i, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>{i.itemName}</span>
                        <span className="text-emerald-700">{i.acceptedQuantity} {i.unit} Accepted</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Batch ID: <strong className="font-mono text-slate-800">{i.batchId}</strong></span>
                        <span>QA: <strong className="text-emerald-600">{i.qualityStatus}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Accepted Value</span>
                    <span className="font-black text-slate-900 text-sm">₹{grn.totalAcceptedAmount}</span>
                  </div>
                  {grn.paymentStatus !== 'PAID' && (
                    <button
                      onClick={() => { setSelectedGRN(grn); setPaidAmount(grn.totalAcceptedAmount); setShowPaymentModal(true); }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Clear Accounts Payment
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: DOCUMENT ARCHIVE & AUDIT TRACEABILITY ── */}
      {activeTab === 'archive' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                Procurement Document Archive & Audit Vault (Step 4)
              </h3>
              <p className="text-xs text-slate-500">Centralized system archive storing signed MOUs, Purchase Orders, Goods Receipt Notes, and Invoices for full auditability.</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b text-[10px] font-black uppercase text-slate-400">
                <tr>
                  <th className="py-3 px-4">Doc Type</th>
                  <th className="py-3 px-4">Reference ID</th>
                  <th className="py-3 px-4">Title / Description</th>
                  <th className="py-3 px-4">Vendor Name</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {archiveDocs.map(doc => (
                  <tr key={doc.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        doc.type === 'AGREEMENT_MOU' ? 'bg-indigo-100 text-indigo-800' :
                        doc.type === 'PURCHASE_ORDER' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{doc.referenceNumber}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{doc.title}</td>
                    <td className="py-3 px-4 text-slate-700">{doc.vendorName}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(doc.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                        {doc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: ACCOUNTS PAYMENT CLEARANCE ── */}
      {activeTab === 'payment' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-teal-600" />
                Accounts & Vendor Payment Clearance (Step 5)
              </h3>
              <p className="text-xs text-slate-500">Accounts clearance for delivered goods notes (GRN), invoice matching, payment reference entry, and ledger settlement.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goodsReceiptNotes.map(grn => (
              <div key={grn.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start border-b pb-3">
                  <div>
                    <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100 font-mono">
                      {grn.grnNumber}
                    </span>
                    <h4 className="font-black text-slate-800 text-sm pt-1">
                      {grn.vendorName}
                    </h4>
                    <span className="text-[10px] text-slate-400 block font-mono">Invoice #{grn.invoiceNumber || 'N/A'} • Total: ₹{grn.totalAcceptedAmount?.toLocaleString()}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    grn.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {grn.paymentStatus}
                  </span>
                </div>

                <div className="space-y-1 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Paid Amount:</span>
                    <span className="font-bold text-slate-900 font-mono">₹{(grn.paidAmount || (grn.paymentStatus === 'PAID' ? grn.totalAcceptedAmount : 0))?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Reference:</span>
                    <span className="font-bold text-slate-900 font-mono">{grn.paymentReference || 'Pending Clearance'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span className="font-bold text-slate-800">{grn.paymentMode || 'NEFT / Bank Transfer'}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  {grn.paymentStatus !== 'PAID' ? (
                    <button
                      onClick={() => { setSelectedGRN(grn); setPaidAmount(grn.totalAcceptedAmount); setShowPaymentModal(true); }}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                    >
                      Clear Accounts Payment
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                      ✓ Settlement Complete
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CREATE PR MODAL (Supports Multi-item 10+ Raw Materials) ── */}
      {showCreatePRModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col my-auto">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-rose-400">Procurement Requisition</span>
                <h3 className="font-black text-base flex items-center gap-2">
                  <Package className="w-5 h-5 text-rose-500" />
                  Raise Purchase Request (PR) — Multiple Items
                </h3>
              </div>
              <button onClick={() => setShowCreatePRModal(false)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreatePR} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-black text-slate-800 uppercase text-xs">Requested Raw Materials / Items ({prItems.length})</h4>
                  <button
                    type="button"
                    onClick={handleAddPRItemRow}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Item Row</span>
                  </button>
                </div>

                {prItems.map((item, idx) => (
                  <div key={idx} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 relative group">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-rose-700 text-xs">Item #{idx + 1}</span>
                      {prItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePRItemRow(idx)}
                          className="text-rose-600 hover:bg-rose-100 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Remove Item Row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <ItemTypeSearchSelect
                        value={item.itemName}
                        masterItems={inventories}
                        onChange={(name, category) => {
                          handleUpdatePRItemRow(idx, 'itemName', name);
                          if (category) handleUpdatePRItemRow(idx, 'category', category);
                        }}
                      />

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Category</label>
                        <select
                          value={item.category}
                          onChange={(e) => handleUpdatePRItemRow(idx, 'category', e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                        >
                          <option value="Raw Materials">Raw Materials</option>
                          <option value="Packaging Materials">Packaging Materials</option>
                          <option value="Equipment">Equipment</option>
                          <option value="Services">Services</option>
                          <option value="Logistics">Logistics</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Required Quantity *</label>
                        <input
                          type="number"
                          required
                          value={item.requiredQuantity}
                          onChange={(e) => handleUpdatePRItemRow(idx, 'requiredQuantity', e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Unit</label>
                        <input
                          type="text"
                          placeholder="e.g. kg, grams, liters, pcs, bags"
                          value={item.unit}
                          onChange={(e) => handleUpdatePRItemRow(idx, 'unit', e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddPRItemRow}
                  className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-900 font-bold rounded-2xl flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Add Another Item Row</span>
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Internal Notes / Requirements</label>
                <textarea
                  rows={2}
                  value={prNotes}
                  onChange={(e) => setPrNotes(e.target.value)}
                  placeholder="Specify quality grades, FSSAI compliance, or target lead times..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowCreatePRModal(false)} className="px-4 py-2 border rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg cursor-pointer">Submit Purchase Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ENTER VENDOR PROFORMA INVOICES (SUPPORTS MULTIPLE VENDOR INVOICES AT ONCE) ── */}
      {showAddQuoteModal && selectedPR && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col my-auto">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-400">Multi-Vendor Quotations / Invoices</span>
                <h3 className="font-black text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  Enter Vendor Proforma Invoices for PR #{selectedPR.prNumber}
                </h3>
              </div>
              <button onClick={() => setShowAddQuoteModal(false)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleAddQuote} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="font-black text-slate-800 uppercase text-xs">
                  Supplier Invoice Entries ({vendorInvoiceEntries.length})
                </h4>
                <button
                  type="button"
                  onClick={handleAddVendorInvoiceEntryRow}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Another Vendor Invoice</span>
                </button>
              </div>

              {vendorInvoiceEntries.map((entry, entryIdx) => {
                const totalAmount = Object.entries(entry.itemizedPrices || {}).reduce((sum, [name, price]) => {
                  const reqItem = selectedPR.items?.find(i => i.itemName === name);
                  return sum + (Number(price) || 0) * (Number(reqItem?.requiredQuantity) || 0);
                }, 0);

                return (
                  <div key={entryIdx} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 relative">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <span className="font-black text-amber-700 uppercase text-xs">Vendor Invoice Entry #{entryIdx + 1}</span>
                      {vendorInvoiceEntries.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveVendorInvoiceEntryRow(entryIdx)}
                          className="text-rose-600 hover:bg-rose-100 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Remove Invoice Entry"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-bold text-slate-700">Select Vendor *</label>
                          <button
                            type="button"
                            onClick={() => {
                              setQuickVendorTargetIndex(entryIdx);
                              setShowQuickVendorModal(true);
                            }}
                            className="text-[10px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                          >
                            + Add New Vendor
                          </button>
                        </div>
                        <select
                          required
                          value={entry.vendorId}
                          onChange={(e) => handleUpdateVendorInvoiceEntryField(entryIdx, 'vendorId', e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="">-- Choose Vendor --</option>
                          {vendors.map(v => (
                            <option key={v.id} value={v.id}>{v.legalName} ({v.supplyCategory})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Vendor Invoice / Quote # *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. PINV-2026-9812 / QUO-102"
                          value={entry.vendorInvoiceNumber}
                          onChange={(e) => handleUpdateVendorInvoiceEntryField(entryIdx, 'vendorInvoiceNumber', e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                        />
                      </div>
                    </div>

                    {/* Itemized Pricing Breakdown for PR items */}
                    <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-700 text-[11px] block">Itemized Unit Price Breakdown:</span>

                      <div className="space-y-2">
                        {selectedPR.items?.map((item, itemIdx) => {
                          const unitPrice = entry.itemizedPrices?.[item.itemName] || '';
                          const lineTotal = (Number(unitPrice) || 0) * (Number(item.requiredQuantity) || 0);

                          return (
                            <div key={itemIdx} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <div>
                                <span className="font-bold text-slate-800 block">{item.itemName}</span>
                                <span className="text-[10px] text-slate-400">Qty: {item.requiredQuantity} {item.unit}</span>
                              </div>

                              <div className="flex items-center space-x-2">
                                <div className="relative">
                                  <span className="absolute left-2 top-1.5 text-slate-400 font-bold text-[10px]">₹</span>
                                  <input
                                    type="number"
                                    required
                                    placeholder="Unit Price"
                                    value={unitPrice}
                                    onChange={(e) => handleUpdateVendorItemizedPrice(entryIdx, item.itemName, e.target.value)}
                                    className="w-24 pl-5 pr-2 py-1 bg-white border rounded font-bold text-right text-xs"
                                  />
                                </div>
                                <span className="text-[10px] text-slate-400">/ {item.unit}</span>
                                <span className="font-black text-emerald-700 font-mono text-xs min-w-[60px] text-right">
                                  ₹{lineTotal.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-600">Total Invoice Value:</span>
                        <span className="font-black text-slate-900 font-mono text-xs">₹{totalAmount.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Payment Terms</label>
                        <select
                          value={entry.paymentTerms}
                          onChange={(e) => handleUpdateVendorInvoiceEntryField(entryIdx, 'paymentTerms', e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                        >
                          <option value="Net 30 Days">Net 30 Days</option>
                          <option value="Net 15 Days">Net 15 Days</option>
                          <option value="50% Advance, 50% Delivery">50% Advance, 50% Delivery</option>
                          <option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
                          <option value="100% Advance">100% Advance</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Lead Time (Days)</label>
                        <input
                          type="number"
                          value={entry.leadTimeDays}
                          onChange={(e) => handleUpdateVendorInvoiceEntryField(entryIdx, 'leadTimeDays', e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddVendorInvoiceEntryRow}
                className="w-full py-2.5 border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/40 text-amber-900 font-bold rounded-2xl flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-600" />
                <span>Add Another Vendor Invoice / Quote</span>
              </button>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowAddQuoteModal(false)} className="px-4 py-2 border rounded-xl font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg cursor-pointer">
                  Submit All Vendor Invoices ({vendorInvoiceEntries.length})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── QUICK REGISTER NEW VENDOR MODAL ── */}
      {showQuickVendorModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 my-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-rose-600">Quick Registration</span>
                <h3 className="font-black text-slate-900 text-base">Register New Vendor / Supplier</h3>
              </div>
              <button onClick={() => setShowQuickVendorModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateQuickVendor} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Vendor / Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sri Lakshmi Agro Traders"
                  value={quickVendorData.legalName}
                  onChange={(e) => setQuickVendorData({ ...quickVendorData, legalName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={quickVendorData.primaryContactPerson}
                    onChange={(e) => setQuickVendorData({ ...quickVendorData, primaryContactPerson: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 9876543210"
                    value={quickVendorData.phone}
                    onChange={(e) => setQuickVendorData({ ...quickVendorData, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="vendor@gmail.com"
                    value={quickVendorData.email}
                    onChange={(e) => setQuickVendorData({ ...quickVendorData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Supply Category</label>
                  <select
                    value={quickVendorData.supplyCategory}
                    onChange={(e) => setQuickVendorData({ ...quickVendorData, supplyCategory: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  >
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Packaging Materials">Packaging Materials</option>
                    <option value="Equipment & Machinery">Equipment & Machinery</option>
                    <option value="Logistics">Logistics</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Factory / Office Address</label>
                <input
                  type="text"
                  placeholder="e.g. Plot 45, Industrial Estate, Salem"
                  value={quickVendorData.officeAddress}
                  onChange={(e) => setQuickVendorData({ ...quickVendorData, officeAddress: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowQuickVendorModal(false)} className="px-4 py-2 border rounded-xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg">Save & Select Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE GRN & BATCH ID MODAL ── */}
      {showCreateGRNModal && selectedPO && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 my-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">Create Goods Receipt Note (GRN) & Assign Batch IDs</h3>
              <button onClick={() => setShowCreateGRNModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSubmitGRN} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vendor Invoice # *</label>
                  <input
                    type="text"
                    required
                    value={grnInvoiceNumber}
                    onChange={(e) => setGrnInvoiceNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Delivery Challan #</label>
                  <input
                    type="text"
                    value={grnChallanNumber}
                    onChange={(e) => setGrnChallanNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono"
                  />
                </div>
              </div>

              {grnItems.map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <span className="font-black text-slate-800 block text-xs">{item.itemName} ({item.orderedQuantity} {item.unit} Ordered)</span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Accepted Qty *</label>
                      <input
                        type="number"
                        required
                        value={item.acceptedQuantity}
                        onChange={(e) => {
                          const updated = [...grnItems];
                          updated[idx].acceptedQuantity = Number(e.target.value);
                          setGrnItems(updated);
                        }}
                        className="w-full p-2 bg-white border rounded-xl font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">Batch ID *</label>
                      <input
                        type="text"
                        required
                        value={item.batchId}
                        onChange={(e) => {
                          const updated = [...grnItems];
                          updated[idx].batchId = e.target.value;
                          setGrnItems(updated);
                        }}
                        className="w-full p-2 bg-white border rounded-xl font-mono text-xs uppercase"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-600 mb-1">QA Check</label>
                      <select
                        value={item.qualityStatus}
                        onChange={(e) => {
                          const updated = [...grnItems];
                          updated[idx].qualityStatus = e.target.value;
                          setGrnItems(updated);
                        }}
                        className="w-full p-2 bg-white border rounded-xl font-bold"
                      >
                        <option value="PASS">PASS</option>
                        <option value="FAIL">FAIL</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {/* Payment Clearance Option Section */}
              <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-black text-amber-900 uppercase text-xs flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    Immediate Payment Clearance (Optional)
                  </span>
                  <select
                    value={grnPaymentStatus}
                    onChange={(e) => setGrnPaymentStatus(e.target.value)}
                    className="p-1.5 bg-white border border-amber-300 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    <option value="PENDING_PAYMENT">Pending Payment (Credit)</option>
                    <option value="PAID">Mark Payment as PAID Immediately</option>
                  </select>
                </div>

                {grnPaymentStatus === 'PAID' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1 border-t border-amber-200/80">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Payment Reference / UTR # *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. NEFT-98124012 / GPay-881"
                        value={grnPaymentRef}
                        onChange={(e) => setGrnPaymentRef(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Payment Mode</label>
                      <select
                        value={grnPaymentMode}
                        onChange={(e) => setGrnPaymentMode(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold cursor-pointer"
                      >
                        <option value="NEFT / Bank Transfer">NEFT / Bank Transfer</option>
                        <option value="UPI / GPay / PhonePe">UPI / GPay / PhonePe</option>
                        <option value="Cheque / DD">Cheque / DD</option>
                        <option value="Cash">Cash</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setShowCreateGRNModal(false)} className="px-4 py-2 border rounded-xl font-bold cursor-pointer">Cancel</button>
                <button
                  type="button"
                  onClick={(e) => handleSubmitGRN(e, 'PAID')}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md cursor-pointer flex items-center space-x-1.5"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Confirm GRN & Clear Payment (Paid)</span>
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Confirm GRN & Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PAYMENT CLEARANCE MODAL ── */}
      {showPaymentModal && selectedGRN && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">Accounts Payment Clearance</h3>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Vendor & GRN Ref</span>
                <span className="font-bold text-slate-900">{selectedGRN.vendorName} — GRN #{selectedGRN.grnNumber}</span>
                <span className="block text-emerald-700 font-black text-sm pt-1">Total Due: ₹{selectedGRN.totalAcceptedAmount}</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Paid Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Reference / UTR Number</label>
                <input
                  type="text"
                  placeholder="e.g. NEFT-2026-98765432"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="px-4 py-2 border rounded-xl">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-lg">Confirm Payment Clearance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PRINT / DOWNLOAD PR DOCUMENT MODAL ── */}
      {showViewPRModal && selectedPR && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-6 my-auto">
            {/* Printable Container */}
            <div id="printable-pr-document" className="space-y-6 p-6 border-2 border-slate-800 rounded-2xl bg-white">
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
                <div>
                  <h2 className="text-xl font-black text-rose-600 tracking-tight">MANSARA FOODS PRIVATE LIMITED</h2>
                  <p className="text-xs text-slate-500 font-medium">Spices, Food Products & Raw Material Procurement Division</p>
                  <p className="text-[10px] text-slate-400">GSTIN: 33AAAAA0000A1Z5 • FSSAI Lic: 12421000000000</p>
                </div>
                <div className="text-right">
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-rose-200 block mb-1">
                    PURCHASE REQUEST
                  </span>
                  <span className="text-sm font-black font-mono text-slate-900">{selectedPR.prNumber}</span>
                  <span className="text-[11px] text-slate-500 block">Date: {new Date(selectedPR.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs font-medium border">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Requested By</span>
                  <span className="font-bold text-slate-900">{selectedPR.requestedBy}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="font-bold text-slate-900">{selectedPR.status}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h4 className="font-black text-slate-800 text-xs uppercase">Requested Materials & Quantities ({selectedPR.items?.length || 0})</h4>
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-800 text-white text-[10px] font-black uppercase">
                    <tr>
                      <th className="py-2.5 px-3 border-r border-slate-700">#</th>
                      <th className="py-2.5 px-3 border-r border-slate-700">Item / Material Description</th>
                      <th className="py-2.5 px-3 border-r border-slate-700">Category</th>
                      <th className="py-2.5 px-3 text-right">Required Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {selectedPR.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 border-r font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 border-r font-bold text-slate-900">{item.itemName}</td>
                        <td className="py-2.5 px-3 border-r text-slate-600">{item.category || 'Raw Materials'}</td>
                        <td className="py-2.5 px-3 text-right font-black text-rose-700">{item.requiredQuantity} {item.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedPR.notes && (
                <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 text-xs space-y-1">
                  <span className="font-black text-amber-800 uppercase text-[10px] block">Special Instructions / Quality Specifications:</span>
                  <p className="text-slate-700">{selectedPR.notes}</p>
                </div>
              )}

              <div className="pt-8 flex justify-between items-end border-t border-slate-300 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-mono">Generated electronically by Mansara Foods ERP</p>
                </div>
                <div className="text-center space-y-8">
                  <div className="border-b border-slate-400 w-48 font-bold"></div>
                  <span className="text-[10px] uppercase font-black text-slate-600 block">Authorized Procurement Signatory</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button onClick={() => setShowViewPRModal(false)} className="px-4 py-2 border rounded-xl text-xs font-bold cursor-pointer">Close</button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-lg cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SEND PR TO VENDORS VIA WHATSAPP CHATBOT MODAL ── */}
      {showSendWhatsAppModal && selectedPR && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-xl w-full p-6 space-y-4 my-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <span className="text-[10px] font-black text-emerald-600 uppercase">WhatsApp RFQ Broadcast</span>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                  Send PR #{selectedPR.prNumber} to Vendors via WhatsApp
                </h3>
              </div>
              <button onClick={() => setShowSendWhatsAppModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Vendor Selection with Checkboxes (Single or Multiple) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="font-black text-slate-800 uppercase text-xs">
                    Select Vendors ({selectedVendorsForWhatsApp.length} / {vendors.length} Selected)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedVendorsForWhatsApp.length === vendors.length) {
                        setSelectedVendorsForWhatsApp([]);
                      } else {
                        setSelectedVendorsForWhatsApp(vendors.map(v => v.id));
                      }
                    }}
                    className="text-emerald-700 font-bold text-xs hover:underline cursor-pointer"
                  >
                    {selectedVendorsForWhatsApp.length === vendors.length ? 'Deselect All' : 'Select All Vendors'}
                  </button>
                </div>

                <div className="max-h-44 overflow-y-auto bg-slate-50 border border-slate-200 rounded-2xl p-2 space-y-1.5 divide-y divide-slate-100">
                  {vendors.map(v => {
                    const isChecked = selectedVendorsForWhatsApp.includes(v.id);
                    return (
                      <label key={v.id} className="flex items-center justify-between p-2 hover:bg-slate-100/70 rounded-xl cursor-pointer">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setSelectedVendorsForWhatsApp(prev => prev.filter(id => id !== v.id));
                              } else {
                                setSelectedVendorsForWhatsApp(prev => [...prev, v.id]);
                              }
                            }}
                            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{v.legalName}</span>
                            <span className="text-[10px] text-slate-500 font-medium">Category: {v.supplyCategory} • Phone: {v.phone || 'N/A'}</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          {v.tradeName || 'Registered'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* WhatsApp Message Text Customizer */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">WhatsApp RFQ Message Preview</label>
                <textarea
                  rows={6}
                  value={customWhatsAppMsg}
                  onChange={(e) => setCustomWhatsAppMsg(e.target.value)}
                  className="w-full p-3 bg-slate-900 text-emerald-300 font-mono text-xs border border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setShowSendWhatsAppModal(false)} className="px-4 py-2 border rounded-xl font-bold cursor-pointer">Cancel</button>
                <button
                  type="button"
                  onClick={handleSendWhatsAppBroadcast}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg flex items-center space-x-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send via WhatsApp Chatbot ({selectedVendorsForWhatsApp.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
