// src/pages/admin/AdminApprovalsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, XCircle, Clock, AlertCircle, 
  DollarSign, FileText, ShoppingBag, Check, X, ArrowRight,
  Download, Printer, Edit3, Eye, Search, Filter, Store, Building2, User,
  Calendar, Hash, Sparkles, MessageSquare
} from 'lucide-react';
import WhatsAppShareModal from '../../components/WhatsAppShareModal';
import {
  buildQuotationHtml,
  triggerPrintQuotation,
  downloadQuotationHtml,
  downloadQuotationPdf,
  formatQuotationWhatsAppText
} from '../../utils/quotationHelper';

export default function AdminApprovalsPage() {
  const [activeTab, setActiveTab] = useState('quotations'); // Default to requested quotations / invoice requests tab
  const [approvalsData, setApprovalsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  // WhatsApp modal state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [activeQuotationData, setActiveQuotationData] = useState(null);

  // Search and filter for quotations
  const [quoteSearch, setQuoteSearch] = useState('');
  const [quoteStatusFilter, setQuoteStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'

  // Action Modals State
  const [approvalModal, setApprovalModal] = useState({
    isOpen: false,
    quotation: null,
    reason: '',
    isSubmitting: false
  });

  const [rejectionModal, setRejectionModal] = useState({
    isOpen: false,
    quotation: null,
    reason: '',
    isSubmitting: false
  });

  const [editModal, setEditModal] = useState({
    isOpen: false,
    quotation: null,
    items: [],
    shippingCharges: 0,
    adminRemarks: '',
    isSubmitting: false
  });

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage.text) {
      const timer = setTimeout(() => setToastMessage({ text: '', type: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/field-sales/admin/approvals');
      if (res.data?.success) {
        setApprovalsData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching approvals:', err);
      setToastMessage({ text: 'Failed to load approvals queue', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  // Format Helper: Converts Quotation No to expected Invoice No
  const getDerivedInvoiceNo = (quotationNo = '') => {
    if (!quotationNo) return 'INV-' + Date.now().toString().slice(-6);
    if (quotationNo.includes('QN')) return quotationNo.replace(/QN/g, 'INV');
    if (quotationNo.includes('qn')) return quotationNo.replace(/qn/g, 'inv');
    if (quotationNo.includes('QTN')) return quotationNo.replace(/QTN/g, 'INV');
    if (quotationNo.includes('qtn')) return quotationNo.replace(/qtn/g, 'inv');
    if (quotationNo.startsWith('QN-')) return quotationNo.replace('QN-', 'INV-');
    if (quotationNo.startsWith('QTN-')) return quotationNo.replace('QTN-', 'INV-');
    if (quotationNo.startsWith('QT-')) return quotationNo.replace('QT-', 'INV-');
    return `INV-${quotationNo}`;
  };

  // Format Helper: Formatted Date & Time
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return (
      d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }) +
      ', ' +
      d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    );
  };

  // ─── ACTION HANDLERS: APPROVE / REJECT / EDIT ───────────────────────────────
  const openApproveModal = (quote) => {
    setApprovalModal({
      isOpen: true,
      quotation: quote,
      reason: 'Approved commercial wholesale terms. Converted to official invoice.',
      isSubmitting: false
    });
  };

  const submitApproveModal = async (e) => {
    e.preventDefault();
    if (!approvalModal.quotation) return;
    if (!approvalModal.reason.trim()) {
      setToastMessage({ text: 'Please enter approval reason/remarks to note', type: 'error' });
      return;
    }

    setApprovalModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      const quoteId = approvalModal.quotation._id || approvalModal.quotation.id;
      const res = await axios.put(`/field-sales/admin/approvals/quotations/${quoteId}`, {
        status: 'APPROVED',
        adminRemarks: approvalModal.reason.trim()
      });

      if (res.data?.success) {
        setToastMessage({
          text: res.data.message || 'Quotation approved and official Invoice generated!',
          type: 'success'
        });
        setApprovalModal({ isOpen: false, quotation: null, reason: '', isSubmitting: false });
        fetchApprovals();
      }
    } catch (err) {
      console.error('Failed to approve quotation:', err);
      const errMsg = err.response?.data?.message || 'Failed to approve quotation';
      setToastMessage({ text: errMsg, type: 'error' });
      setApprovalModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const openRejectModal = (quote) => {
    setRejectionModal({
      isOpen: true,
      quotation: quote,
      reason: '',
      isSubmitting: false
    });
  };

  const submitRejectModal = async (e) => {
    e.preventDefault();
    if (!rejectionModal.quotation) return;
    if (!rejectionModal.reason.trim()) {
      setToastMessage({ text: 'Please enter rejection reason/remarks to note', type: 'error' });
      return;
    }

    setRejectionModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      const quoteId = rejectionModal.quotation._id || rejectionModal.quotation.id;
      const res = await axios.put(`/field-sales/admin/approvals/quotations/${quoteId}`, {
        status: 'REJECTED',
        adminRemarks: rejectionModal.reason.trim()
      });

      if (res.data?.success) {
        setToastMessage({
          text: 'Quotation rejected with reason noted.',
          type: 'success'
        });
        setRejectionModal({ isOpen: false, quotation: null, reason: '', isSubmitting: false });
        fetchApprovals();
      }
    } catch (err) {
      console.error('Failed to reject quotation:', err);
      const errMsg = err.response?.data?.message || 'Failed to reject quotation';
      setToastMessage({ text: errMsg, type: 'error' });
      setRejectionModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const openEditModal = (quote) => {
    const clonedItems = (quote.items || []).map(item => ({
      productId: item.productId,
      productName: item.productName || 'Product',
      quantity: parseInt(item.quantity || item.pieces) || 1,
      mrp: parseFloat(item.mrp || item.unitPrice || 0),
      unitPrice: parseFloat(item.unitPrice || 0),
      discountPercent: parseFloat(item.discountPercent || item.marginPct || 0),
      taxPercent: parseFloat(item.taxPercent || 5),
      totalPrice: parseFloat(item.totalPrice || (parseInt(item.quantity || item.pieces || 1) * parseFloat(item.unitPrice || 0)))
    }));

    setEditModal({
      isOpen: true,
      quotation: quote,
      items: clonedItems,
      shippingCharges: parseFloat(quote.shippingCharges || 0),
      adminRemarks: quote.adminRemarks ? `Updated: ${quote.adminRemarks}` : '',
      isSubmitting: false
    });
  };

  const handleEditItemChange = (index, field, value) => {
    setEditModal(prev => {
      const updatedItems = [...prev.items];
      const item = { ...updatedItems[index] };
      const parsedVal = Math.max(0, parseFloat(value) || 0);

      if (field === 'quantity') {
        item.quantity = Math.max(1, parseInt(value, 10) || 1);
        item.pieces = item.quantity;
        item.totalPrice = Math.round(item.quantity * item.unitPrice * 100) / 100;
      } else if (field === 'unitPrice') {
        item.unitPrice = parsedVal;
        item.totalPrice = Math.round(item.quantity * parsedVal * 100) / 100;
        if (item.mrp > 0) {
          item.discountPercent = Math.max(0, Math.round(((item.mrp - parsedVal) / item.mrp) * 1000) / 10);
        }
      } else if (field === 'discountPercent') {
        const margin = Math.min(99, parsedVal);
        item.discountPercent = margin;
        if (item.mrp > 0) {
          const discountAmt = Math.round((item.mrp * (margin / 100)) * 100) / 100;
          item.unitPrice = Math.max(0, Math.round((item.mrp - discountAmt) * 100) / 100);
          item.totalPrice = Math.round(item.quantity * item.unitPrice * 100) / 100;
        }
      }

      updatedItems[index] = item;
      return { ...prev, items: updatedItems };
    });
  };

  const submitEditModal = async (e) => {
    e.preventDefault();
    if (!editModal.quotation) return;
    if (!editModal.adminRemarks.trim()) {
      setToastMessage({ text: 'Please enter reason for editing quotation', type: 'error' });
      return;
    }

    setEditModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      const quoteId = editModal.quotation._id || editModal.quotation.id;
      let calculatedSubtotal = 0;
      for (const it of editModal.items) {
        calculatedSubtotal += (it.totalPrice || 0);
      }
      const calcTax = calculatedSubtotal * 0.05;
      const calcGrand = calculatedSubtotal + calcTax + parseFloat(editModal.shippingCharges || 0);

      const res = await axios.put(`/field-sales/admin/approvals/quotations/${quoteId}/edit`, {
        items: editModal.items,
        subtotal: calculatedSubtotal,
        taxTotal: calcTax,
        shippingCharges: editModal.shippingCharges,
        grandTotal: calcGrand,
        adminRemarks: editModal.adminRemarks.trim()
      });

      if (res.data?.success) {
        setToastMessage({
          text: 'Quotation updated and edit reason recorded successfully!',
          type: 'success'
        });
        setEditModal({ isOpen: false, quotation: null, items: [], shippingCharges: 0, adminRemarks: '', isSubmitting: false });
        fetchApprovals();
      }
    } catch (err) {
      console.error('Failed to update quotation:', err);
      const errMsg = err.response?.data?.message || 'Failed to update quotation';
      setToastMessage({ text: errMsg, type: 'error' });
      setEditModal(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // Document & Sharing Handlers
  const handleDownloadQuotationDoc = async (q) => {
    const isApproved = q.status === 'APPROVED';
    const invoiceNo = q.invoiceNo || (isApproved ? getDerivedInvoiceNo(q.quotationNo) : undefined);
    const enriched = {
      ...q,
      isInvoice: isApproved,
      invoiceNo
    };
    try {
      await downloadQuotationPdf(enriched);
    } catch (err) {
      const htmlContent = buildQuotationHtml(enriched);
      const prefix = isApproved ? 'Invoice' : 'Quotation';
      const num = isApproved ? invoiceNo : q.quotationNo;
      const fileName = `${prefix}_${(num || 'Mansara').replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
      downloadQuotationHtml(htmlContent, fileName);
      triggerPrintQuotation(htmlContent);
    }
  };

  const handleShareWhatsApp = (q) => {
    const isApproved = q.status === 'APPROVED';
    const invoiceNo = q.invoiceNo || (isApproved ? getDerivedInvoiceNo(q.quotationNo) : undefined);
    const enriched = {
      ...q,
      isInvoice: isApproved,
      invoiceNo
    };
    setActiveQuotationData(enriched);
    const text = formatQuotationWhatsAppText(enriched);
    const phone = q.customerPhone || '';
    setWhatsAppPhone(phone);
    setWhatsAppMessage(text);
    setShowWhatsAppModal(true);
  };

  // Margin Approval / Rejection Handlers
  const handleReviewMargin = async (id, status, marginPercent) => {
    const remarks = prompt(`Enter reason / remarks for ${status.toLowerCase()}:`) || '';
    try {
      const res = await axios.put(`/field-sales/admin/approvals/margins/${id}`, {
        status,
        marginPercent,
        adminRemarks: remarks
      });
      if (res.data?.success) {
        setToastMessage({ text: status === 'APPROVED' ? 'Margin approved!' : 'Margin rejected', type: 'success' });
        fetchApprovals();
      }
    } catch (err) {
      setToastMessage({ text: 'Action failed', type: 'error' });
    }
  };

  // Amendment Review Handler
  const handleReviewAmendment = async (id, status) => {
    const remarks = prompt(`Enter decision reason / remarks for ${status.toLowerCase()}:`) || '';
    try {
      const res = await axios.put(`/field-sales/admin/approvals/amendments/${id}`, {
        status,
        adminRemarks: remarks
      });
      if (res.data?.success) {
        setToastMessage({ text: `Request ${status.toLowerCase()}!`, type: 'success' });
        fetchApprovals();
      }
    } catch (err) {
      setToastMessage({ text: 'Action failed', type: 'error' });
    }
  };

  const margins = approvalsData?.margins || [];
  const quotations = approvalsData?.quotations || [];
  const amendments = approvalsData?.amendments || [];

  const pendingQuotationsCount = useMemo(() => {
    return quotations.filter(q => q.status === 'PENDING_APPROVAL').length;
  }, [quotations]);

  // Filtered quotations based on search query and status filter
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      // Status filter
      if (quoteStatusFilter === 'PENDING' && q.status !== 'PENDING_APPROVAL') return false;
      if (quoteStatusFilter === 'APPROVED' && q.status !== 'APPROVED') return false;
      if (quoteStatusFilter === 'REJECTED' && q.status !== 'REJECTED') return false;

      // Text search
      if (!quoteSearch.trim()) return true;
      const query = quoteSearch.toLowerCase();
      const qNo = (q.quotationNo || '').toLowerCase();
      const invNo = (q.invoiceNo || '').toLowerCase();
      const custName = (q.customerName || '').toLowerCase();
      const salesName = (q.salespersonId?.name || '').toLowerCase();
      const phone = (q.customerPhone || '').toLowerCase();
      const remarks = (q.adminRemarks || '').toLowerCase();

      return (
        qNo.includes(query) ||
        invNo.includes(query) ||
        custName.includes(query) ||
        salesName.includes(query) ||
        phone.includes(query) ||
        remarks.includes(query)
      );
    });
  }, [quotations, quoteSearch, quoteStatusFilter]);

  return (
    <div className="space-y-6 pb-20 font-sans text-slate-800">
      {/* ─── TOAST NOTIFICATION ────────────────────────────────────────────── */}
      {toastMessage.text && (
        <div
          className={`fixed top-4 right-4 sm:top-5 sm:right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold animate-slide-in-right max-w-[90vw] ${
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
          <span className="truncate">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-rose-600" />
            <span>Admin Approvals & Invoice Request Hub</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review requested quotations, audit reasons, and approve to generate official Tax Invoices.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            {pendingQuotationsCount} Pending Invoicing Requests
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('quotations')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'quotations' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Requested Quotations / Invoices ({quotations.length})</span>
          {pendingQuotationsCount > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'quotations' ? 'bg-white text-rose-700' : 'bg-rose-600 text-white'
            }`}>
              {pendingQuotationsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('margins')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'margins' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Margin Requests ({margins.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('amendments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'amendments' ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Amendments & Returns ({amendments.length})</span>
        </button>
      </div>

      {/* ─── TAB: REQUESTED QUOTATIONS & INVOICES ───────────────────────────── */}
      {activeTab === 'quotations' && (
        <div className="space-y-4">
          {/* Controls: Search & Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quoteSearch}
                onChange={(e) => setQuoteSearch(e.target.value)}
                placeholder="Search quote #, invoice #, customer, salesperson..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 focus:bg-white"
              />
              {quoteSearch && (
                <button
                  type="button"
                  onClick={() => setQuoteSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-slate-400 font-bold mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              {[
                { label: 'All', value: 'ALL' },
                { label: `Pending (${pendingQuotationsCount})`, value: 'PENDING' },
                { label: 'Approved (Invoices)', value: 'APPROVED' },
                { label: 'Rejected', value: 'REJECTED' }
              ].map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setQuoteStatusFilter(f.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                    quoteStatusFilter === f.value
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quotations / Invoice Requests Table */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Quotation Number</th>
                    <th className="px-4 py-3.5">To Whom</th>
                    <th className="px-4 py-3.5">Time</th>
                    <th className="px-4 py-3.5">By Whom</th>
                    <th className="px-4 py-3.5">Cost of Quotation</th>
                    <th className="px-4 py-3.5">Status &amp; Reason Noted</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredQuotations.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-12 text-center text-slate-400 space-y-2">
                        <FileText className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="font-bold text-slate-600">No quotation requests found</p>
                        <p className="text-[11px] text-slate-400">
                          {quoteSearch || quoteStatusFilter !== 'ALL'
                            ? 'Try adjusting your search query or status filter.'
                            : 'Save quotations as draft from the Price Simulator or Field Sales app to queue invoice requests.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredQuotations.map((q) => {
                      const isApproved = q.status === 'APPROVED';
                      const isPending = q.status === 'PENDING_APPROVAL';
                      const isRejected = q.status === 'REJECTED';
                      const itemsCount = q.items?.length || 0;
                      const totalUnits = (q.items || []).reduce((acc, it) => acc + (it.pieces || it.quantity || 0), 0);

                      return (
                        <tr key={q._id || q.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* 1. Quotation Number */}
                          <td className="px-4 py-3.5 align-top">
                            {isApproved ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-lg text-xs">
                                    {q.invoiceNo || getDerivedInvoiceNo(q.quotationNo)}
                                  </span>
                                  <span className="text-[10px] bg-emerald-600 text-white font-black px-1.5 py-0.2 rounded uppercase">
                                    Invoice
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono">
                                  From Quote: <span className="text-slate-600 font-semibold">{q.quotationNo}</span>
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg text-xs">
                                    {q.quotationNo}
                                  </span>
                                  <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.2 rounded uppercase">
                                    Quotation
                                  </span>
                                </div>
                                <p className="text-[10px] text-amber-700 font-semibold">
                                  *Pending Admin Invoice Generation
                                </p>
                              </div>
                            )}
                          </td>

                          {/* 2. To Whom */}
                          <td className="px-4 py-3.5 align-top">
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              {q.customerType === 'DEALER' || q.dealerId ? (
                                <Building2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              ) : (
                                <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              )}
                              <span>{q.customerName || 'Valued Trade Customer'}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 space-y-0.5">
                              {q.customerPhone && <p className="font-mono">📞 {q.customerPhone}</p>}
                              {q.customerAddress && <p className="text-slate-400 truncate max-w-xs">{q.customerAddress}</p>}
                              {q.customerId?.name && q.customerId.name !== q.customerName && (
                                <p className="text-[10px] text-slate-400">Store: {q.customerId.name}</p>
                              )}
                            </div>
                          </td>

                          {/* 3. Time */}
                          <td className="px-4 py-3.5 align-top">
                            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{formatDateTime(q.createdAt)}</span>
                            </div>
                            {q.approvedAt && (
                              <p className="text-[10px] text-emerald-700 mt-0.5 font-medium">
                                Approved: {formatDateTime(q.approvedAt)}
                              </p>
                            )}
                            {q.rejectedAt && (
                              <p className="text-[10px] text-rose-700 mt-0.5 font-medium">
                                Rejected: {formatDateTime(q.rejectedAt)}
                              </p>
                            )}
                          </td>

                          {/* 4. By Whom */}
                          <td className="px-4 py-3.5 align-top">
                            <div className="flex items-center gap-1.5 font-bold text-slate-800">
                              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{q.salespersonId?.name || 'Admin / Operations'}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              {q.salespersonId?.email || 'HQ Field Sales'}
                            </p>
                          </td>

                          {/* 5. Cost of Quotation */}
                          <td className="px-4 py-3.5 align-top">
                            <span className="font-mono font-black text-slate-900 text-sm block">
                              ₹{(q.grandTotal || 0).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                              {itemsCount} {itemsCount === 1 ? 'item' : 'items'} ({totalUnits} pcs)
                            </span>
                            {q.taxTotal > 0 && (
                              <span className="text-[9.5px] text-slate-400 font-mono block">
                                GST: ₹{Math.round(q.taxTotal).toLocaleString('en-IN')}
                              </span>
                            )}
                          </td>

                          {/* 6. Status & Reason Noted */}
                          <td className="px-4 py-3.5 align-top max-w-xs">
                            <div className="space-y-1.5">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                isApproved ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                isRejected ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                                'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {isApproved && <Check className="w-3 h-3" />}
                                {isRejected && <X className="w-3 h-3" />}
                                {isPending && <Clock className="w-3 h-3" />}
                                <span>{isApproved ? 'Approved & Invoiced' : isRejected ? 'Rejected' : 'Pending Approval'}</span>
                              </span>

                              {/* Reason Noted Display */}
                              {q.adminRemarks ? (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-[10px] text-slate-700">
                                  <span className="font-bold text-slate-500 block uppercase text-[9px] tracking-wider mb-0.5">
                                    Audit Reason / Remarks:
                                  </span>
                                  <p className="italic font-medium text-slate-800">“{q.adminRemarks}”</p>
                                  {(q.approvedBy?.name || q.rejectedBy?.name) && (
                                    <p className="text-[9px] text-slate-400 mt-1">
                                      By: {q.approvedBy?.name || q.rejectedBy?.name}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-[10px] text-slate-400 italic">No remarks recorded yet</p>
                              )}
                            </div>
                          </td>

                          {/* 7. Actions: Approve / Reject / Edit / Print / Share */}
                          <td className="px-4 py-3.5 text-right align-top">
                            <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1.5">
                              {/* WhatsApp Share */}
                              <button
                                type="button"
                                onClick={() => handleShareWhatsApp(q)}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer shadow-2xs"
                                title="Share on WhatsApp"
                              >
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.825zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.981-1.306A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                                </svg>
                              </button>

                              {/* Print / Download Document */}
                              <button
                                type="button"
                                onClick={() => handleDownloadQuotationDoc(q)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition cursor-pointer shadow-2xs"
                                title={isApproved ? "Print Official Tax Invoice" : "Print Price Quotation"}
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Button (Available on all quotes) */}
                              <button
                                type="button"
                                onClick={() => openEditModal(q)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-lg cursor-pointer text-xs flex items-center gap-1 transition"
                                title="Edit items, rates, quantities, and record reason"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Edit</span>
                              </button>

                              {/* Approve Button (for pending or rejected) */}
                              {q.status !== 'APPROVED' && (
                                <button
                                  type="button"
                                  onClick={() => openApproveModal(q)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer text-xs flex items-center gap-1 shadow-sm transition active:scale-95"
                                  title="Approve and generate official Invoice"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve</span>
                                </button>
                              )}

                              {/* Reject Button (for pending) */}
                              {q.status === 'PENDING_APPROVAL' && (
                                <button
                                  type="button"
                                  onClick={() => openRejectModal(q)}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg cursor-pointer text-xs flex items-center gap-1 transition"
                                  title="Reject quotation with reason"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Reject</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 1: MARGINS ─────────────────────────────────────────────────── */}
      {activeTab === 'margins' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Store / Dealer</th>
                <th className="px-4 py-3">Sales Executive</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Requested Margin</th>
                <th className="px-4 py-3">Submission Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {margins.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                    No margin requests in queue.
                  </td>
                </tr>
              ) : (
                margins.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-800">{m.store?.name || m.dealer?.companyName || 'Store Request'}</span>
                      <p className="text-[10px] text-slate-400">{m.store?.address || 'Retail Customer'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-700">{m.salesperson?.name || 'Field Sales Rep'}</span>
                      <p className="text-[10px] text-slate-400 font-mono">{m.salesperson?.email || 'Field Staff'}</p>
                      {m.remarks && <p className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">“{m.remarks}”</p>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {m.product?.name || 'All Catalog Products'}
                    </td>
                    <td className="px-4 py-3 font-mono font-black text-rose-600 text-sm">
                      {m.marginPercent}%
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleReviewMargin(m._id, 'APPROVED', m.marginPercent)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-lg cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewMargin(m._id, 'REJECTED')}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── TAB 3: AMENDMENTS & RETURNS ────────────────────────────────────── */}
      {activeTab === 'amendments' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Reference No</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Salesperson</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {amendments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                    No order amendments or return requests.
                  </td>
                </tr>
              ) : (
                amendments.map((a) => (
                  <tr key={a._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{a.referenceNo}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{a.requestType}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-500">{a.reason}</td>
                    <td className="px-4 py-3 text-slate-500">{a.salespersonId?.name || 'Sales Officer'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        a.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                        a.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleReviewAmendment(a._id, 'APPROVED')}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-lg cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewAmendment(a._id, 'REJECTED')}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── MODAL: APPROVE QUOTATION & GENERATE INVOICE ───────────────────── */}
      {approvalModal.isOpen && approvalModal.quotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Approve Quotation &amp; Generate Invoice</h3>
                  <p className="text-xs text-slate-500">Official conversion from Quotation to Invoice</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovalModal({ isOpen: false, quotation: null, reason: '', isSubmitting: false })}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Invoicing Conversion Info Banner */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between items-center pb-2 border-b border-emerald-200/60">
                <span className="text-emerald-800 font-semibold">Current Quotation Ref:</span>
                <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-emerald-300">
                  {approvalModal.quotation.quotationNo}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-emerald-900 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Generated Invoice Number:</span>
                </span>
                <span className="font-mono font-black text-emerald-800 bg-emerald-200/80 px-2.5 py-1 rounded text-xs shadow-2xs">
                  {getDerivedInvoiceNo(approvalModal.quotation.quotationNo)}
                </span>
              </div>
              <p className="text-[10px] text-emerald-700 italic pt-1">
                Notice: Before approving, it was strictly identified as a Quotation in all places. Upon confirmation, it is converted into this official Invoice number.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Customer</span>
                <p className="font-bold text-slate-800 truncate">{approvalModal.quotation.customerName}</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Payable</span>
                <p className="font-mono font-black text-emerald-700 text-sm">
                  ₹{(approvalModal.quotation.grandTotal || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <form onSubmit={submitApproveModal} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Approval Reason / Audit Remarks <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows="3"
                  value={approvalModal.reason}
                  onChange={(e) => setApprovalModal(prev => ({ ...prev, reason: e.target.value }))}
                  required
                  placeholder="Note the reason for approval (e.g. Approved wholesale margin per dealer agreement)..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-slate-50 focus:bg-white text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApprovalModal({ isOpen: false, quotation: null, reason: '', isSubmitting: false })}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={approvalModal.isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{approvalModal.isSubmitting ? 'Generating Invoice...' : 'Confirm & Generate Invoice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: REJECT QUOTATION ───────────────────────────────────────── */}
      {rejectionModal.isOpen && rejectionModal.quotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
                  <X className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Reject Quotation Request</h3>
                  <p className="text-xs text-slate-500">Record reason for decision audit</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectionModal({ isOpen: false, quotation: null, reason: '', isSubmitting: false })}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p>Quotation: <span className="font-mono font-bold text-slate-800">{rejectionModal.quotation.quotationNo}</span></p>
              <p>Customer: <span className="font-bold text-slate-800">{rejectionModal.quotation.customerName}</span></p>
              <p>Total: <span className="font-mono font-black text-rose-600">₹{(rejectionModal.quotation.grandTotal || 0).toLocaleString('en-IN')}</span></p>
            </div>

            <form onSubmit={submitRejectModal} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Reason for Rejection <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows="3"
                  value={rejectionModal.reason}
                  onChange={(e) => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))}
                  required
                  placeholder="Specify why this quotation is rejected (e.g. margin too high, credit limit exceeded)..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 focus:bg-white text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectionModal({ isOpen: false, quotation: null, reason: '', isSubmitting: false })}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejectionModal.isSubmitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-600/20 disabled:opacity-50 active:scale-95"
                >
                  <X className="w-4 h-4" />
                  <span>{rejectionModal.isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDIT QUOTATION ─────────────────────────────────────────── */}
      {editModal.isOpen && editModal.quotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Edit Quotation Items &amp; Pricing</h3>
                  <p className="text-xs text-slate-500">
                    Ref: <span className="font-mono font-bold text-slate-800">{editModal.quotation.quotationNo}</span> • For: {editModal.quotation.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModal({ isOpen: false, quotation: null, items: [], shippingCharges: 0, adminRemarks: '', isSubmitting: false })}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editable Items Table */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">Order Line Items</span>
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-600">
                    <tr>
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5 w-24 text-center">Qty (Units)</th>
                      <th className="p-2.5 w-28 text-center">Rate / Unit (₹)</th>
                      <th className="p-2.5 w-20 text-center">Margin %</th>
                      <th className="p-2.5 w-28 text-right">Line Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {editModal.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60">
                        <td className="p-2.5">
                          <p className="font-bold text-slate-800 truncate max-w-[180px]">{item.productName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">MRP: ₹{item.mrp?.toFixed(2)}</p>
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleEditItemChange(idx, 'quantity', e.target.value)}
                            className="w-18 p-1 text-center font-bold border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.unitPrice}
                            onChange={(e) => handleEditItemChange(idx, 'unitPrice', e.target.value)}
                            className="w-20 p-1 text-center font-bold border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none font-mono"
                          />
                        </td>
                        <td className="p-2.5 text-center font-mono text-xs text-slate-600">
                          {item.discountPercent || 0}%
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-800">
                          ₹{(item.totalPrice || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Subtotal, Shipping, Grand Total Calculation Preview */}
            {(() => {
              const subtotal = editModal.items.reduce((acc, it) => acc + (it.totalPrice || 0), 0);
              const gst = subtotal * 0.05;
              const grand = subtotal + gst + parseFloat(editModal.shippingCharges || 0);
              return (
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (5%):</span>
                    <span className="font-mono font-bold">₹{Math.round(gst).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Shipping Charges (₹):</span>
                    <input
                      type="number"
                      min="0"
                      value={editModal.shippingCharges}
                      onChange={(e) => setEditModal(prev => ({ ...prev, shippingCharges: parseFloat(e.target.value) || 0 }))}
                      className="w-24 p-1 text-right font-bold border border-slate-200 rounded-lg text-xs focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-2">
                    <span>Updated Grand Total:</span>
                    <span className="font-mono text-rose-700">₹{Math.round(grand).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              );
            })()}

            <form onSubmit={submitEditModal} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Reason for Edit / Modification <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows="2"
                  value={editModal.adminRemarks}
                  onChange={(e) => setEditModal(prev => ({ ...prev, adminRemarks: e.target.value }))}
                  required
                  placeholder="Record why this quotation was edited (e.g. Quantity reduced per store owner call)..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 focus:bg-white text-xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, quotation: null, items: [], shippingCharges: 0, adminRemarks: '', isSubmitting: false })}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editModal.isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{editModal.isSubmitting ? 'Saving...' : 'Save Quotation Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── WHATSAPP SHARE MODAL ─────────────────────────────────────────── */}
      <WhatsAppShareModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        defaultPhone={whatsAppPhone}
        defaultMessage={whatsAppMessage}
        quotationData={activeQuotationData}
      />
    </div>
  );
}
