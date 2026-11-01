// src/pages/sales/SalesDarPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Calendar, CheckCircle2, ShoppingBag, 
  DollarSign, MapPin, Download, RefreshCw, Award 
} from 'lucide-react';

export default function SalesDarPage() {
  const [darDate, setDarDate] = useState(new Date().toISOString().split('T')[0]);
  const [darData, setDarData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDar = async (date) => {
    setLoading(true);
    try {
      const res = await axios.get(`/field-sales/dar?date=${date}`);
      if (res.data?.success) {
        setDarData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching DAR report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDar(darDate);
  }, [darDate]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Daily Activity Report (DAR)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Module 29: Daily audit of visits completed, orders booked, sales value & collections
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={darDate}
            onChange={(e) => setDarDate(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono shadow-xs"
          />
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Print DAR</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Visits Completed</span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {darData?.visitsCompleted || 0}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Total visits logged: {darData?.totalVisits || 0}</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Sales Orders Booked</span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            ₹{(darData?.salesValue || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Across {darData?.ordersBookedCount || 0} order bookings</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Collections</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            ₹{(darData?.collections || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-emerald-700/80 mt-0.5">Cash / UPI receipts reconciled</p>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Follow-Ups Status</span>
          <div className="text-2xl font-black text-cyan-600 mt-1">
            {darData?.followUpsCompleted || 0} / {darData?.followUpsScheduled || 0}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Tasks completed today</p>
        </div>
      </div>

      {/* Detailed Visit Audit Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
            Day's Activity Breakdown
          </h3>
          <span className="text-xs text-amber-700 font-mono font-semibold">Date: {darDate}</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Visitor Name</th>
              <th className="px-4 py-3">Purpose</th>
              <th className="px-4 py-3">Outcome & Discussions</th>
              <th className="px-4 py-3">Collections</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {!darData?.visitDetails || darData.visitDetails.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                  No activity logged for this date.
                </td>
              </tr>
            ) : (
              darData.visitDetails.map((v, i) => (
                <tr key={v._id || i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-500">
                    {new Date(v.checkInTime || v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{v.visitorName}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                      {v.purpose}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-sm truncate text-slate-600">
                    {v.outcome || v.remarks || 'Routine visit'}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                    ₹{(v.paymentsCollected || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      v.checkOutTime ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {v.checkOutTime ? 'Checked Out' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
