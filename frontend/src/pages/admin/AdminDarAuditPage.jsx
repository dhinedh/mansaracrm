// src/pages/admin/AdminDarAuditPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, Clock, CheckCircle2, AlertCircle, Search, 
  Download, DollarSign, Store, User, Filter, ArrowUpRight,
  TrendingUp, MapPin, Eye, X
} from 'lucide-react';

export default function AdminDarAuditPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVisit, setSelectedVisit] = useState(null);

  const fetchDarAudit = async (date) => {
    setLoading(true);
    try {
      const res = await axios.get(`/field-sales/admin/dar-audit?date=${date}`);
      if (res.data?.success) {
        setAuditData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching DAR audit:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDarAudit(selectedDate);
  }, [selectedDate]);

  const visits = auditData?.visits || [];

  const filteredVisits = visits.filter(v => {
    const repName = v.salespersonId?.name || v.visitorName || '';
    const outcome = v.outcome || '';
    const purpose = v.purpose || '';
    const q = search.toLowerCase();
    return repName.toLowerCase().includes(q) || outcome.toLowerCase().includes(q) || purpose.toLowerCase().includes(q);
  });

  const handleExportCSV = () => {
    if (!filteredVisits.length) return;
    const headers = ['Executive', 'Date', 'Check-In', 'Check-Out', 'Purpose', 'Outcome', 'Order Value (INR)', 'Payment Collected (INR)', 'Payment Method'];
    const rows = filteredVisits.map(v => [
      `"${v.salespersonId?.name || v.visitorName || 'Sales Rep'}"`,
      `"${selectedDate}"`,
      `"${v.checkInTime ? new Date(v.checkInTime).toLocaleTimeString() : 'N/A'}"`,
      `"${v.checkOutTime ? new Date(v.checkOutTime).toLocaleTimeString() : 'In Progress'}"`,
      `"${v.purpose || ''}"`,
      `"${(v.outcome || '').replace(/"/g, '""')}"`,
      v.orderValue || 0,
      v.paymentsCollected || 0,
      `"${v.paymentMethod || 'NONE'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DAR_Audit_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Daily Activity Report (DAR) Audit
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review field visit logs, verify daily shift hours, check-in timestamps, and spot cash reconciliations
          </p>
        </div>

        {/* Date Selector & Export */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!filteredVisits.length}
            className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Field Visits</span>
            <Store className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2">
            {auditData?.totalVisits || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Logged check-ins today</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Completed Visits</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {auditData?.completedVisits || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {auditData?.totalVisits ? Math.round((auditData.completedVisits / auditData.totalVisits) * 100) : 0}% completion rate
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Spot Orders Value</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">
            ₹{(auditData?.totalSalesValue || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Booked during visits</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Cash / UPI Collections</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            ₹{(auditData?.totalCollections || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Reconciled payment receipts</p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by executive name, visit purpose, or outcome..."
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 shadow-sm"
        />
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800">
            Shift Visits Breakdown for {selectedDate}
          </h3>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            {filteredVisits.length} Records Found
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Loading activity report for {selectedDate}...
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No visits or DAR activity logged on this date.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Sales Executive</th>
                  <th className="px-4 py-3">Check-In / Out</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Outcome</th>
                  <th className="px-4 py-3">Order Value</th>
                  <th className="px-4 py-3">Collected</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredVisits.map((v) => {
                  const rep = v.salespersonId?.name || v.visitorName || 'Sales Executive';
                  const isCompleted = v.checkOutTime != null;
                  return (
                    <tr key={v._id || v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {rep.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">{rep}</span>
                            <span className="text-[10px] text-slate-400">{v.salespersonId?.phone || 'Mobile N/A'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px]">
                        <div>
                          <span className="text-slate-700 font-bold">
                            In: {v.checkInTime ? new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className={isCompleted ? 'text-emerald-600 font-medium' : 'text-amber-500 font-medium'}>
                            Out: {isCompleted ? new Date(v.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress'}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-600">
                        {v.purpose || 'Retail Store Visit'}
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-700 line-clamp-1 max-w-[200px]" title={v.outcome}>
                          {v.outcome || 'Pending Checkout'}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        {v.orderValue ? `₹${parseFloat(v.orderValue).toLocaleString('en-IN')}` : '—'}
                      </td>

                      <td className="px-4 py-3 font-mono">
                        {v.paymentsCollected ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            ₹{parseFloat(v.paymentsCollected).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedVisit(v)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer transition-all inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visit Detail Modal */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedVisit(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-slate-800 mb-1">
              Field Visit Audit Details
            </h3>
            <p className="text-xs text-slate-400 mb-4 font-mono">
              Visit ID: {selectedVisit._id || selectedVisit.id}
            </p>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Executive</span>
                  <p className="font-black text-slate-800">{selectedVisit.salespersonId?.name || selectedVisit.visitorName}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Date</span>
                  <p className="font-semibold text-slate-700">{selectedDate}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Check-In</span>
                  <p className="font-mono text-slate-700">{selectedVisit.checkInTime ? new Date(selectedVisit.checkInTime).toLocaleTimeString() : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Check-Out</span>
                  <p className="font-mono text-slate-700">{selectedVisit.checkOutTime ? new Date(selectedVisit.checkOutTime).toLocaleTimeString() : 'In Progress'}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Purpose of Visit</span>
                <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                  {selectedVisit.purpose || 'Retail sales pitch and order booking'}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Outcome & Discussion Notes</span>
                <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium whitespace-pre-wrap">
                  {selectedVisit.outcome || 'Pending checkout'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Booked Order Value</span>
                  <p className="font-mono font-black text-slate-800 text-sm mt-0.5">
                    ₹{(selectedVisit.orderValue || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Payment Collected</span>
                  <p className="font-mono font-black text-emerald-600 text-sm mt-0.5">
                    ₹{(selectedVisit.paymentsCollected || 0).toLocaleString('en-IN')} ({selectedVisit.paymentMethod || 'NONE'})
                  </p>
                </div>
              </div>

              {selectedVisit.latitude && selectedVisit.longitude && (
                <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px] pt-2 border-t border-slate-100">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span>GPS: {selectedVisit.latitude.toFixed(5)}, {selectedVisit.longitude.toFixed(5)}</span>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedVisit(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
