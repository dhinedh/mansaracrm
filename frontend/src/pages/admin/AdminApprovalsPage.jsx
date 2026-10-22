// src/pages/admin/AdminApprovalsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  CheckCircle2, XCircle, Clock, AlertCircle, 
  DollarSign, FileText, ShoppingBag, Check, X, ArrowRight 
} from 'lucide-react';

export default function AdminApprovalsPage() {
  const [activeTab, setActiveTab] = useState('margins'); // 'margins', 'quotations', 'amendments'
  const [approvalsData, setApprovalsData] = useState(null);
  const [loading, setLoading] = useState(true);

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
                      {q.status === 'PENDING_APPROVAL' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleReviewQuote(q._id, 'APPROVED')}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold rounded-lg cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewQuote(q._id, 'REJECTED')}
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
    </div>
  );
}
