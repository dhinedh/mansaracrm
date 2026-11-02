// src/pages/admin/AdminDarAuditPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, Clock, CheckCircle2, AlertCircle, Search, 
  Download, DollarSign, Store, User, Filter, ArrowUpRight,
  TrendingUp, MapPin, Eye, X, FileText, Phone, Check, 
  CreditCard, ChevronRight
} from 'lucide-react';

export default function AdminDarAuditPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeView, setActiveView] = useState('visits'); // 'visits' | 'bills'
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);

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
  const bills = auditData?.bills || [];

  const filteredVisits = visits.filter(v => {
    const repName = v.salespersonId?.name || v.visitorName || '';
    const outcome = v.outcome || '';
    const purpose = v.purpose || '';
    const q = search.toLowerCase();
    return repName.toLowerCase().includes(q) || outcome.toLowerCase().includes(q) || purpose.toLowerCase().includes(q);
  });

  const filteredBills = bills.filter(b => {
    const repName = b.salesperson || '';
    const custName = b.customerName || '';
    const invNo = b.invoiceNo || '';
    const reason = b.billingReason || '';
    const q = search.toLowerCase();
    return repName.toLowerCase().includes(q) || custName.toLowerCase().includes(q) || invNo.toLowerCase().includes(q) || reason.toLowerCase().includes(q);
  });

  const handleExportCSV = () => {
    if (activeView === 'bills') {
      if (!filteredBills.length) return;
      const headers = ['Invoice No', 'Date', 'Salesperson', 'Billed To (Customer)', 'Billing Reason', 'Result Status', 'Payment Mode', 'Total Amount (INR)'];
      const rows = filteredBills.map(b => [
        `"${b.invoiceNo}"`,
        `"${new Date(b.date).toLocaleDateString()}"`,
        `"${b.salesperson}"`,
        `"${b.customerName}"`,
        `"${b.billingReason}"`,
        `"${b.resultStatus}"`,
        `"${b.paymentMethod}"`,
        b.totalAmount || 0
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Field_Bills_${selectedDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

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
            Daily Activity Report (DAR) & Field Billing Audit
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit field visits, spot billing reasons, recipient stores, and payment collection results across all sales executives
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
            disabled={activeView === 'bills' ? !filteredBills.length : !filteredVisits.length}
            className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Field Visits</span>
            <Store className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1.5">
            {auditData?.totalVisits || 0}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {auditData?.completedVisits || 0} completed
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Spot Orders</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-600 mt-1.5">
            ₹{(auditData?.totalSalesValue || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Booked in field</p>
        </div>

        {/* Bills Generated KPI */}
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Bills Issued</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1.5">
            {bills.length}
          </div>
          <p className="text-[10px] text-amber-700 font-bold mt-0.5">
            ₹{(auditData?.totalBillsAmount || bills.reduce((acc, b) => acc + (b.totalAmount || 0), 0)).toLocaleString('en-IN')} billed
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Collections</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1.5">
            ₹{(auditData?.totalCollections || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Cash / UPI receipts</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active View</span>
            <Filter className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-base sm:text-lg font-black text-slate-800 mt-1.5 capitalize">
            {activeView === 'bills' ? 'Bills Generated' : 'Visits Audit'}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Switch tabs below to inspect
          </p>
        </div>
      </div>

      {/* View Switcher & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Toggle Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setActiveView('visits')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeView === 'visits' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Store Visits ({visits.length})</span>
          </button>
          <button
            onClick={() => setActiveView('bills')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeView === 'bills' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>Bills Generated ({bills.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={activeView === 'bills' ? "Filter bills by rep, customer, invoice..." : "Filter by rep, visit purpose, outcome..."}
            className="w-full pl-11 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-xs"
          />
        </div>
      </div>

      {/* VIEW 1: BILLS GENERATED AUDIT TABLE */}
      {activeView === 'bills' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Bills Issued by Sales Team ({selectedDate})</span>
            </h3>
            <span className="text-xs font-semibold text-slate-500 font-mono">
              {filteredBills.length} Invoices Found
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Loading bills report for {selectedDate}...
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No bills or spot invoices issued on this date.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Invoice No & Date</th>
                    <th className="px-4 py-3">Salesperson</th>
                    <th className="px-4 py-3">Billed To (Customer)</th>
                    <th className="px-4 py-3">Reason for Bill</th>
                    <th className="px-4 py-3">Collection Result</th>
                    <th className="px-4 py-3 font-mono">Amount</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredBills.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-900 block">{b.invoiceNo}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(b.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{b.salesperson}</span>
                        <span className="text-[10px] text-slate-400">{b.salespersonPhone || 'Mobile N/A'}</span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{b.customerName}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[180px] block">
                          {b.customerAddress || 'Direct Store Counter'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[10px]">
                          {b.billingReason || 'Spot Sale / Direct Order'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                          b.resultStatus === 'COLLECTED' || b.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : b.resultStatus === 'PARTIALLY_COLLECTED'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {b.resultStatus === 'COLLECTED' || b.status === 'PAID' ? '● Collected / Paid' : '○ Pending Collection'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Mode: {b.paymentMethod}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono font-black text-slate-900 text-sm">
                        ₹{(b.totalAmount || 0).toLocaleString('en-IN')}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedBill(b)}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1 cursor-pointer transition-all border border-amber-200"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Audit</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: VISITS AUDIT TABLE */}
      {activeView === 'visits' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Store className="w-4 h-4 text-rose-500" />
              <span>Shift Visits Breakdown for {selectedDate}</span>
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
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-[11px] inline-flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Eye className="w-3 h-3 text-slate-500" />
                            <span>Audit</span>
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
      )}

      {/* MODAL: BILL AUDIT MODAL */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-600 tracking-wider">Field Invoice Audit</span>
                <h3 className="text-base font-black text-slate-900">{selectedBill.invoiceNo}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Issued By (Salesperson)</span>
                  <p className="font-bold text-slate-800 text-sm">{selectedBill.salesperson}</p>
                  <p className="text-[11px] text-slate-500">{selectedBill.salespersonPhone}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Date & Time</span>
                  <p className="font-mono text-slate-700">{new Date(selectedBill.date).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Billed To (Customer / Store)</span>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <p className="font-black text-slate-900 text-sm">{selectedBill.customerName}</p>
                  <p className="text-slate-600 mt-0.5">{selectedBill.customerAddress}</p>
                  {selectedBill.customerPhone && <p className="text-amber-700 font-mono mt-0.5">📞 {selectedBill.customerPhone}</p>}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Reason for Generating Bill</span>
                <p className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200 font-bold text-amber-900">
                  {selectedBill.billingReason || 'Spot Sale / Direct Order'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Result Status</span>
                  <p className="font-bold text-slate-800 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                      selectedBill.resultStatus === 'COLLECTED' || selectedBill.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {selectedBill.resultStatus === 'COLLECTED' || selectedBill.status === 'PAID' ? 'Collected / Paid' : 'Pending Payment'}
                    </span>
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Bill Value</span>
                  <p className="font-mono font-black text-amber-600 text-base mt-0.5">
                    ₹{(selectedBill.totalAmount || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VISIT AUDIT MODAL */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">DAR Shift Visit Audit</span>
                <h3 className="text-base font-black text-slate-900">{selectedVisit.salespersonId?.name || selectedVisit.visitorName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVisit(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
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
