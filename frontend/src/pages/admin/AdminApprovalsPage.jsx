// src/pages/admin/AdminApprovalsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, XCircle, Clock, AlertCircle, 
  DollarSign, FileText, ShoppingBag, Check, X, ArrowRight,
  Download, Printer
} from 'lucide-react';
import WhatsAppShareModal from '../../components/WhatsAppShareModal';
import {
  buildQuotationHtml,
  triggerPrintQuotation,
  downloadQuotationHtml,
  formatQuotationWhatsAppText
} from '../../utils/quotationHelper';

export default function AdminApprovalsPage() {
  const [activeTab, setActiveTab] = useState('margins'); // 'margins', 'quotations', 'amendments'
  const [approvalsData, setApprovalsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [activeQuotationData, setActiveQuotationData] = useState(null);

  const handleDownloadQuotation = (q) => {
    const htmlContent = buildQuotationHtml(q);
    const fileName = `Quotation_${(q.quotationNo || 'Mansara').replace(/[^a-zA-Z0-9_-]/g, '_')}.html`;
    downloadQuotationHtml(htmlContent, fileName);
    triggerPrintQuotation(htmlContent);
  };

  const handleShareWhatsApp = (q) => {
    setActiveQuotationData(q);
    const text = formatQuotationWhatsAppText(q);
    const phone = q.customerPhone || '';
    setWhatsAppPhone(phone);
    setWhatsAppMessage(text);
    setShowWhatsAppModal(true);
  };

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/field-sales/admin/approvals');
      if (res.data?.success) {
        setApprovalsData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  // Margin Approval / Rejection
  const handleReviewMargin = async (id, status, marginPercent) => {
    try {
      const res = await axios.put(`/field-sales/admin/approvals/margins/${id}`, {
        status,
        marginPercent
      });
      if (res.data?.success) {
        alert(status === 'APPROVED' ? 'Margin approved!' : 'Margin rejected');
        fetchApprovals();
      }
    } catch (err) {
      alert('Action failed');
    }
  };

  // Quotation Approval / Rejection
  const handleReviewQuote = async (id, status) => {
    const remarks = prompt(`Enter remarks for ${status.toLowerCase()}:`) || '';
    try {
      const res = await axios.put(`/field-sales/admin/approvals/quotations/${id}`, {
        status,
        adminRemarks: remarks
      });
      if (res.data?.success) {
        alert(`Quotation ${status.toLowerCase()}!`);
        fetchApprovals();
      }
    } catch (err) {
      alert('Action failed');
    }
  };

  // Amendment Review
  const handleReviewAmendment = async (id, status) => {
    const remarks = prompt(`Enter decision remarks for ${status.toLowerCase()}:`) || '';
    try {
      const res = await axios.put(`/field-sales/admin/approvals/amendments/${id}`, {
        status,
        adminRemarks: remarks
      });
      if (res.data?.success) {
        alert(`Request ${status.toLowerCase()}!`);
        fetchApprovals();
      }
    } catch (err) {
      alert('Action failed');
    }
  };

  const margins = approvalsData?.margins || [];
  const quotations = approvalsData?.quotations || [];
  const amendments = approvalsData?.amendments || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          Field Sales Approvals Hub
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Consolidated decision matrix for customer margins, commercial quotations, and order amendments/returns
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('margins')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'margins' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Customer Margin Requests ({margins.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('quotations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'quotations' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Quotations Review ({quotations.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('amendments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'amendments' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Amendments & Returns ({amendments.length})
        </button>
      </div>

      {/* Tab 1: Margins */}
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

      {/* Tab 2: Quotations */}
      {activeTab === 'quotations' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Quote No</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Executive</th>
                <th className="px-4 py-3">Total Value</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {quotations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                    No quotations submitted yet.
                  </td>
                </tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{q.quotationNo}</td>
                    <td className="px-4 py-3 font-semibold text-slate-700">{q.customerName}</td>
                    <td className="px-4 py-3 text-slate-500">{q.salespersonId?.name || 'Sales Officer'}</td>
                    <td className="px-4 py-3 font-black text-rose-600 text-sm">
                      ₹{(q.grandTotal || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        q.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                        q.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(q)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                          title="Share on WhatsApp"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.825zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.981-1.306A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadQuotation(q)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition cursor-pointer"
                          title="Download &amp; Print Quotation"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {q.status === 'PENDING_APPROVAL' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleReviewQuote(q._id, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-lg cursor-pointer text-xs"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewQuote(q._id, 'REJECTED')}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-lg cursor-pointer text-xs"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Amendments & Returns */}
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
