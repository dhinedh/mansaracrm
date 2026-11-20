// src/pages/admin/AuditHistoryPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  History,
  Search,
  Filter,
  Calendar,
  User,
  ShieldCheck,
  Eye,
  FileSpreadsheet,
  RefreshCw,
  X,
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import * as XLSX from 'xlsx';

const MODULES = [
  'ALL',
  'Store',
  'FieldSalesOrder',
  'StoreStock',
  'Product',
  'Dealer',
  'Margin',
  'MarketingEvent',
  'Invoice'
];

const ACTIONS = [
  'ALL',
  'CREATE',
  'UPDATE',
  'DELETE',
  'STATUS_CHANGE',
  'STOCK_ADJUSTMENT',
  'LOCATION_MATCH',
  'LOCATION_VERIFIED',
  'BULK_UPLOAD'
];

export default function AuditHistoryPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [stats, setStats] = useState({ totalLogs: 0, todayLogs: 0, moduleBreakdown: [] });

  // Filters
  const [filterModule, setFilterModule] = useState('ALL');
  const [filterAction, setFilterAction] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Log Diff Modal
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDiffModal, setShowDiffModal] = useState(false);

  useEffect(() => {
    fetchLogs(1);
    fetchStats();
  }, [filterModule, filterAction, startDate, endDate]);

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25'
      });
      if (filterModule !== 'ALL') params.append('entity', filterModule);
      if (filterAction !== 'ALL') params.append('action', filterAction);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await axios.get(`/audit/logs?${params.toString()}`);
      if (res.data?.success) {
        setLogs(res.data.data.logs || []);
        setPagination(res.data.data.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('/audit/stats');
      if (res.data?.success) {
        setStats(res.data.data || { totalLogs: 0, todayLogs: 0, moduleBreakdown: [] });
      }
    } catch (err) {
      console.error('Failed to load audit stats', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const openDiffViewer = (log) => {
    setSelectedLog(log);
    setShowDiffModal(true);
  };

  const exportToExcel = () => {
    if (!logs.length) return;
    const exportRows = logs.map(l => ({
      'Date & Time': new Date(l.createdAt).toLocaleString('en-IN'),
      'Modified By': `${l.userName} (${l.userRole})`,
      'Action': l.action,
      'Module / Entity': l.entity,
      'Record Title / ID': l.recordTitle || l.entityId,
      'Change Details': l.details,
      'IP Address': l.ipAddress
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit Trail');
    XLSX.writeFile(wb, `Mansara_CRM_Audit_Trail_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'UPDATE':
      case 'STOCK_ADJUSTMENT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DELETE':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'STATUS_CHANGE':
      case 'LOCATION_MATCH':
      case 'LOCATION_VERIFIED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-rose-500 block">
            Security &amp; Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <History className="w-7 h-7 text-rose-600" />
            CRM History &amp; Audit Trail
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Tamper-proof record of all manual updates to shops, orders, stocks, customer profiles, and invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs shadow-2xs transition-all cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Log (.xlsx)
          </button>
          <button
            onClick={() => fetchLogs(pagination.page)}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Audit Entries</span>
          <p className="text-2xl font-black text-slate-800 mt-1">{stats.totalLogs.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Modifications Today</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{stats.todayLogs.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm col-span-2">
          <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">Top Active Modules</span>
          <div className="flex flex-wrap gap-2">
            {stats.moduleBreakdown?.map((m, i) => (
              <span key={i} className="text-xs bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg font-semibold text-slate-700">
                {m.entity}: <strong className="text-slate-900">{m.count}</strong>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Module Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
              Module Name
            </label>
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              {MODULES.map(m => (
                <option key={m} value={m}>{m === 'ALL' ? 'All CRM Modules' : m}</option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
              Action Type
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              {ACTIONS.map(a => (
                <option key={a} value={a}>{a === 'ALL' ? 'All Action Types' : a}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
            />
          </div>

          {/* Search Query */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
              Search Record / Title
            </label>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Title, ID, change note..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-700"
              />
            </form>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 text-[10px] font-black uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date &amp; Time</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Module &amp; Record</th>
                <th className="py-3 px-4">Modified By</th>
                <th className="py-3 px-4">Change Summary</th>
                <th className="py-3 px-4 text-center">Audit Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-slate-400">
                    <div className="inline-block animate-spin w-6 h-6 border-3 border-rose-600 border-t-transparent rounded-full mb-2" />
                    <p className="text-xs">Loading audit trail...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-slate-400 space-y-2">
                    <History className="w-10 h-10 text-slate-300 mx-auto mb-1" />
                    <p className="font-bold text-slate-700 text-xs">No audit logs matching filters</p>
                    <p className="text-[11px]">All manual CRM changes will be logged here automatically.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block">
                        {new Date(log.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        {new Date(log.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Module & Record */}
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                        {log.entity}
                      </span>
                      <span className="font-bold text-slate-800 text-xs line-clamp-1">
                        {log.recordTitle || `ID: ${log.entityId}`}
                      </span>
                    </td>

                    {/* User */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-black text-[10px]">
                          {log.userName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block text-xs">{log.userName}</span>
                          <span className="text-[9px] text-slate-400 block uppercase font-semibold">{log.userRole}</span>
                        </div>
                      </div>
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      <p className="line-clamp-2 max-w-sm">{log.details || 'Record data modified'}</p>
                    </td>

                    {/* Diff button */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {log.oldValues || log.newValues ? (
                        <button
                          onClick={() => openDiffViewer(log)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-100 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          View Diff
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-mono">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <span>
            Page <strong className="text-slate-900 font-bold">{pagination.page}</strong> of{' '}
            <strong className="text-slate-900 font-bold">{pagination.totalPages}</strong> (
            {pagination.total} total audit records)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 font-bold cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => fetchLogs(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 font-bold cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ─── Field Diff Viewer Modal ─── */}
      {showDiffModal && selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 my-8">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-rose-500 block">
                  Audit Snapshot Diff
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {selectedLog.entity} · {selectedLog.recordTitle}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Action: <strong className="text-slate-800">{selectedLog.action}</strong> by{' '}
                  <strong className="text-slate-800">{selectedLog.userName}</strong> on{' '}
                  {new Date(selectedLog.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
              <button onClick={() => setShowDiffModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Side-by-Side Diff */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              {/* Previous State */}
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block mb-1">
                  1. Previous Value
                </span>
                <div className="bg-red-50/50 border border-red-100 rounded-xl p-3 max-h-80 overflow-y-auto font-mono text-[11px] text-red-900 whitespace-pre-wrap">
                  {selectedLog.oldValues
                    ? JSON.stringify(selectedLog.oldValues, null, 2)
                    : '(Initial Creation / No previous values)'}
                </div>
              </div>

              {/* Updated State */}
              <div>
                <span className="font-bold text-emerald-700 uppercase text-[10px] block mb-1">
                  2. Updated Value
                </span>
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 max-h-80 overflow-y-auto font-mono text-[11px] text-emerald-900 whitespace-pre-wrap">
                  {selectedLog.newValues
                    ? JSON.stringify(selectedLog.newValues, null, 2)
                    : '(Record Deleted)'}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-[11px] text-slate-400">
              <span>Client IP: {selectedLog.ipAddress || '127.0.0.1'}</span>
              <button
                onClick={() => setShowDiffModal(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
