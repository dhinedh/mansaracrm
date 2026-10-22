// src/pages/admin/AdminCollectionsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DollarSign, Search, Calendar, User, Store, 
  Building2, CheckCircle2, AlertCircle, Clock, 
  Download, Eye, X, Image as ImageIcon, CreditCard
} from 'lucide-react';

export default function AdminCollectionsPage() {
  const [activeTab, setActiveTab] = useState('collections'); // 'collections', 'commitments'
  const [collectionsData, setCollectionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedProofUrl, setSelectedProofUrl] = useState(null);

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/field-sales/admin/collections?paymentMethod=${methodFilter}`);
      if (res.data?.success) {
        setCollectionsData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching admin collections:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [methodFilter]);

  const collections = collectionsData?.collections || [];
  const commitments = collectionsData?.commitments || [];

  const filteredCollections = collections.filter(c => {
    const rep = c.salespersonId?.name || '';
    const store = c.storeId?.name || '';
    const ref = c.paymentReference || '';
    const q = search.toLowerCase();
    return !q || rep.toLowerCase().includes(q) || store.toLowerCase().includes(q) || ref.toLowerCase().includes(q);
  });

  const filteredCommitments = commitments.filter(c => {
    const rep = c.salespersonId?.name || '';
    const store = c.storeName || c.storeId?.name || '';
    const q = search.toLowerCase();
    return !q || rep.toLowerCase().includes(q) || store.toLowerCase().includes(q);
  });

  const handleExportCSV = () => {
    if (activeTab === 'collections') {
      if (!filteredCollections.length) return;
      const headers = ['Date', 'Salesperson', 'Store', 'Amount (INR)', 'Payment Mode', 'Reference No', 'Notes'];
      const rows = filteredCollections.map(c => [
        `"${new Date(c.checkInTime || c.date).toLocaleDateString()}"`,
        `"${c.salespersonId?.name || 'Sales Rep'}"`,
        `"${c.storeId?.name || 'Retail Outlet'}"`,
        c.paymentsCollected || 0,
        `"${c.paymentMethod || 'CASH'}"`,
        `"${c.paymentReference || 'N/A'}"`,
        `"${(c.remarks || c.outcome || '').replace(/"/g, '""')}"`
      ]);
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const uri = encodeURI(csv);
      const link = document.createElement('a');
      link.setAttribute('href', uri);
      link.setAttribute('download', `Sales_Collections_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      if (!filteredCommitments.length) return;
      const headers = ['Expected Date', 'Store', 'Salesperson', 'Promised Amount (INR)', 'Status', 'Customer Remarks'];
      const rows = filteredCommitments.map(c => [
        `"${new Date(c.expectedDate).toLocaleDateString()}"`,
        `"${c.storeName || c.storeId?.name || 'Store'}"`,
        `"${c.salespersonId?.name || 'Sales Rep'}"`,
        c.promisedAmount || 0,
        `"${c.status}"`,
        `"${(c.customerRemarks || '').replace(/"/g, '""')}"`
      ]);
      const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const uri = encodeURI(csv);
      const link = document.createElement('a');
      link.setAttribute('href', uri);
      link.setAttribute('download', `Payment_Commitments_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Field Collections & Payment Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reconcile on-field cash receipts, UPI transactions, cheque handovers, and track retailer payment commitments
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export {activeTab === 'collections' ? 'Collections' : 'Commitments'} CSV</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Collected</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            ₹{(collectionsData?.totalCollected || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total payments collected by reps</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Cash Collected</span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            ₹{(collectionsData?.totalCash || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting cashier handover</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">UPI / Bank Transfers</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">
            ₹{(collectionsData?.totalOnline || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Direct digital bank settlements</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Payment Commitments</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            ₹{(collectionsData?.totalCommitments || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Promised by retail stores</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('collections')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'collections' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Payment Collections Log ({filteredCollections.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('commitments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'commitments' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Outstanding Commitments Tracker ({filteredCommitments.length})
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by sales rep, retail outlet, or reference ID..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 shadow-sm"
          />
        </div>

        {activeTab === 'collections' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'CASH', 'ONLINE', 'UPI', 'CHEQUE'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethodFilter(m)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shrink-0 ${
                  methodFilter === m
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab 1: Collections Table */}
      {activeTab === 'collections' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400 text-xs">Loading collections ledger...</div>
          ) : filteredCollections.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-xs">No collections found matching criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Collection Date</th>
                    <th className="px-4 py-3">Sales Executive</th>
                    <th className="px-4 py-3">Retail Customer Store</th>
                    <th className="px-4 py-3">Amount Collected</th>
                    <th className="px-4 py-3">Payment Mode</th>
                    <th className="px-4 py-3">Reference / Txn ID</th>
                    <th className="px-4 py-3 text-right">Proof</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCollections.map((c) => {
                    const rep = c.salespersonId?.name || c.visitorName || 'Sales Rep';
                    return (
                      <tr key={c._id || c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                          {new Date(c.checkInTime || c.date).toLocaleDateString()}
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {c.checkInTime ? new Date(c.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                              {rep.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-bold text-slate-800">{rep}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-800 block">{c.storeId?.name || 'Retail Outlet'}</span>
                          <span className="text-[10px] text-slate-400">{c.storeId?.address || ''}</span>
                        </td>

                        <td className="px-4 py-3 font-mono font-black text-emerald-600 text-sm">
                          ₹{(c.paymentsCollected || 0).toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.paymentMethod === 'CASH' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {c.paymentMethod || 'CASH'}
                          </span>
                        </td>

                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                          {c.paymentReference || '—'}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {c.paymentProofUrl ? (
                            <button
                              type="button"
                              onClick={() => setSelectedProofUrl(c.paymentProofUrl)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer inline-flex items-center gap-1"
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>View</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Commitments Table */}
      {activeTab === 'commitments' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400 text-xs">Loading commitments tracker...</div>
          ) : filteredCommitments.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-xs">No payment commitments recorded.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Promised Due Date</th>
                    <th className="px-4 py-3">Retail Customer Store</th>
                    <th className="px-4 py-3">Sales Executive</th>
                    <th className="px-4 py-3">Promised Amount</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Customer Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCommitments.map((c) => {
                    const isOverdue = new Date(c.expectedDate) < new Date() && c.status === 'PENDING';
                    return (
                      <tr key={c._id || c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">
                          {new Date(c.expectedDate).toLocaleDateString()}
                          {isOverdue && (
                            <span className="text-[10px] font-bold text-rose-600 block">OVERDUE</span>
                          )}
                        </td>

                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {c.storeName || c.storeId?.name || 'Retail Outlet'}
                        </td>

                        <td className="px-4 py-3 text-slate-600 font-medium">
                          {c.salespersonId?.name || 'Sales Rep'}
                        </td>

                        <td className="px-4 py-3 font-mono font-black text-rose-600 text-sm">
                          ₹{(c.promisedAmount || 0).toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            c.status === 'FULFILLED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            isOverdue ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {isOverdue ? 'OVERDUE' : c.status}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                          {c.customerRemarks || 'Awaiting payment realization'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Photo Proof Lightbox */}
      {selectedProofUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-4 shadow-2xl relative max-w-lg w-full">
            <button
              type="button"
              onClick={() => setSelectedProofUrl(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-bold text-slate-800 mb-2">Payment Receipt Photo Proof</h3>
            <img 
              src={selectedProofUrl} 
              alt="Payment Proof" 
              className="w-full max-h-[70vh] object-contain rounded-2xl border border-slate-200" 
            />
          </div>
        </div>
      )}
    </div>
  );
}
