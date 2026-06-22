// src/pages/admin/AdminInvoiceLedger.jsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Receipt,
  Download,
  Eye,
  Store,
  Calendar,
  X,
  FileText,
  Check,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Search,
  Building2,
  Filter,
  Truck,
  Package,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  Clock,
  XCircle
} from 'lucide-react';

// ── Sub-components defined OUTSIDE main component to prevent Vite TDZ issues ─
function StatusBadge({ inv, onClose }) {
  const base = 'text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase select-none flex items-center space-x-1';
  if (inv.status === 'CLOSED') return (
    <span className={`${base} bg-emerald-50 text-emerald-700`}><Lock className="w-2.5 h-2.5" /><span>CLOSED</span></span>
  );
  if (inv.status === 'OPEN') return (
    <span
      onClick={() => onClose(inv)}
      title="Click to Close Invoice & Deduct Stock"
      className={`${base} bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer ring-1 ring-blue-200`}
    >OPEN ↗</span>
  );
  return <span className={`${base} bg-slate-50 text-slate-700`}>{inv.status}</span>;
}

function ChannelBadge({ channel }) {
  if (channel === 'B2B') return (
    <span className="text-[8px] font-black text-violet-700 bg-violet-50 border border-violet-100 px-1.5 py-0.5 rounded uppercase tracking-wide">B2B</span>
  );
  if (channel === 'WEBSITE' || channel === 'E_COMMERCE') return (
    <span className="text-[8px] font-black text-sky-700 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded uppercase tracking-wide">{channel}</span>
  );
  return (
    <span className="text-[8px] font-black text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded uppercase tracking-wide">RETAIL</span>
  );
}

const TRANSFER_STATUS_CFG = {
  PENDING:     { cls: 'bg-amber-50 text-amber-700 ring-amber-200',   Icon: Clock,         label: 'PENDING' },
  IN_TRANSIT:  { cls: 'bg-indigo-50 text-indigo-700 ring-indigo-200 animate-pulse', Icon: Truck, label: 'IN TRANSIT' },
  DELIVERED:   { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200', Icon: BadgeCheck, label: 'DELIVERED' },
  DISCREPANCY: { cls: 'bg-orange-50 text-orange-700 ring-orange-200', Icon: AlertTriangle, label: 'DISCREPANCY' },
  CANCELLED:   { cls: 'bg-rose-50 text-rose-700 ring-rose-200',      Icon: XCircle,       label: 'CANCELLED' },
};

function TransferStatusBadge({ status }) {
  const c = TRANSFER_STATUS_CFG[status] || TRANSFER_STATUS_CFG.PENDING;
  const { Icon } = c;
  return (
    <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase flex items-center space-x-1 ring-1 ${c.cls}`}>
      <Icon className="w-2.5 h-2.5" /><span>{c.label}</span>
    </span>
  );
}

export default function AdminInvoiceLedger() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'transfers'

  // ── Invoice State ─────────────────────────────────────────────────────────
  const [invoices, setInvoices] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null, invoiceId: null, invoiceNo: '' });

  // Invoice Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDealer, setSelectedDealer] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ── Transfer Log State ────────────────────────────────────────────────────
  const [transfers, setTransfers] = useState([]);
  const [transfersLoading, setTransfersLoading] = useState(true);
  const [expandedTransfer, setExpandedTransfer] = useState(null);
  const [txStatusLoading, setTxStatusLoading] = useState(null); // transferId being updated
  const [txDealer, setTxDealer] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [txSearch, setTxSearch] = useState('');

  useEffect(() => {
    if (location.state?.activeTab) setActiveTab(location.state.activeTab);
    fetchInvoices();
    fetchDealers();
    fetchTransfers();
  }, []);

  // ── Data Fetchers ─────────────────────────────────────────────────────────
  const fetchDealers = async () => {
    try {
      const res = await axios.get('/dealers');
      setDealers(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const res = await axios.get('/billing');
      setInvoices(res.data.data || []);
    } catch (err) { console.error(err); } finally { setInvoicesLoading(false); }
  };

  const fetchTransfers = async () => {
    setTransfersLoading(true);
    try {
      const res = await axios.get('/inventory/transfers');
      setTransfers(res.data.data || []);
    } catch (err) { console.error(err); } finally { setTransfersLoading(false); }
  };

  // ── Invoice Actions ───────────────────────────────────────────────────────
  const handleDownloadPdf = async (invoice) => {
    try {
      const response = await axios.get(`/billing/${invoice.id}/pdf`, { responseType: 'blob' });
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('text/html')) {
        window.open(URL.createObjectURL(new Blob([response.data], { type: 'text/html' })), '_blank');
      } else {
        const fileURL = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = fileURL;
        link.setAttribute('download', `Invoice_${invoice.invoiceNo}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.warn('PDF download failed:', err);
      alert('Could not download invoice. Please try again.');
    }
  };

  const handleCloseInvoice = async (invoiceId) => {
    setConfirmModal({ open: false, type: null, invoiceId: null, invoiceNo: '' });
    setActionLoading(true);
    try {
      await axios.patch(`/billing/${invoiceId}/close`);
      setShowDetailModal(false);
      await fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close invoice. Ensure dealer has sufficient stock.');
    } finally { setActionLoading(false); }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    setConfirmModal({ open: false, type: null, invoiceId: null, invoiceNo: '' });
    setActionLoading(true);
    try {
      await axios.delete(`/billing/${invoiceId}`);
      setShowDetailModal(false);
      await fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete invoice.');
    } finally { setActionLoading(false); }
  };

  // ── Transfer Actions ──────────────────────────────────────────────────────
  const handleUpdateTransferStatus = async (transferId, newStatus) => {
    setTxStatusLoading(transferId);
    try {
      await axios.patch(`/inventory/transfers/${transferId}/status`, { status: newStatus });
      await fetchTransfers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update transfer status.');
    } finally { setTxStatusLoading(null); }
  };

  // ── Filter Logic ──────────────────────────────────────────────────────────
  const filteredInvoices = invoices.filter(inv => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      inv.invoiceNo.toLowerCase().includes(term) ||
      (inv.dealer?.companyName || '').toLowerCase().includes(term) ||
      (inv.store?.name || '').toLowerCase().includes(term);
    const matchesDealer = !selectedDealer || inv.dealerId === selectedDealer;
    const matchesStatus = !selectedStatus || inv.status === selectedStatus;
    const matchesChannel = !selectedChannel || (inv.channel || 'B2B') === selectedChannel;
    const invDate = new Date(inv.createdAt);
    const matchesStart = !startDate || invDate >= new Date(startDate + 'T00:00:00');
    const matchesEnd = !endDate || invDate <= new Date(endDate + 'T23:59:59');
    return matchesSearch && matchesDealer && matchesStatus && matchesChannel && matchesStart && matchesEnd;
  });

  const filteredTransfers = transfers.filter(tx => {
    const term = txSearch.toLowerCase();
    const matchesSearch =
      (tx.transferNo || '').toLowerCase().includes(term) ||
      (tx.dealer?.companyName || '').toLowerCase().includes(term) ||
      (tx.invoice?.invoiceNo || '').toLowerCase().includes(term);
    const matchesDealer = !txDealer || tx.dealerId === txDealer;
    const matchesStatus = !txStatus || tx.status === txStatus;
    return matchesSearch && matchesDealer && matchesStatus;
  });

  // ── KPI Summary ───────────────────────────────────────────────────────────
  const totalBilled = filteredInvoices.reduce((a, c) => a + (c.totalAmount || 0), 0);
  const totalCollected = filteredInvoices.filter(i => i.status === 'CLOSED' || i.status === 'PAID').reduce((a, c) => a + (c.totalAmount || 0), 0);
  const totalOutstanding = filteredInvoices.filter(i => i.status === 'OPEN').reduce((a, c) => a + (c.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Admin Ledger</h2>
        <p className="text-slate-500 text-xs mt-0.5">
          Master ledger for all invoices and stock transfer shipments across all dealer partners.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`py-3 px-6 text-xs font-black tracking-wider uppercase border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'invoices'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Invoice Ledger</span>
          <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-1.5 py-0.5 rounded-full">
            {invoices.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`py-3 px-6 text-xs font-black tracking-wider uppercase border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTab === 'transfers'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Transfer Log</span>
          <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-1.5 py-0.5 rounded-full">
            {transfers.length}
          </span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* INVOICE LEDGER TAB                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'invoices' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Billed</p>
              <p className="text-2xl font-black text-slate-800 mt-1">₹{totalBilled.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              <span className="text-[10px] text-slate-400 font-semibold">{filteredInvoices.length} Invoices</span>
            </div>
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Collected</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">₹{totalCollected.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              <span className="text-[10px] text-slate-400 font-semibold">Closed Invoices</span>
            </div>
            <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Outstanding Receivable</p>
              <p className="text-2xl font-black text-amber-600 mt-1">₹{totalOutstanding.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              <span className="text-[10px] text-slate-400 font-semibold">Open Invoices</span>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-slate-800 border-b border-slate-100 pb-2">
              <Filter className="w-4 h-4 text-rose-600" />
              <span className="text-xs font-bold uppercase tracking-wider">Search & Filter Invoices</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search no., dealer, store…"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none transition-all"
                />
              </div>
              <select value={selectedDealer} onChange={e => setSelectedDealer(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none font-semibold text-slate-600 cursor-pointer">
                <option value="">All Dealers</option>
                {dealers.map(d => <option key={d.id} value={d.id}>{d.companyName}</option>)}
              </select>
              <select value={selectedChannel} onChange={e => setSelectedChannel(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none font-semibold text-slate-600 cursor-pointer">
                <option value="">All Channels</option>
                <option value="B2B">B2B</option>
                <option value="WEBSITE">Website</option>
                <option value="E_COMMERCE">E-Commerce</option>
              </select>
              <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none font-semibold text-slate-600 cursor-pointer">
                <option value="">All Statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
                <option value="GENERATED">GENERATED</option>
              </select>
              <div className="flex gap-2">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="flex-1 px-2 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none text-slate-600 cursor-pointer font-semibold" title="Start Date" />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  className="flex-1 px-2 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none text-slate-600 cursor-pointer font-semibold" title="End Date" />
              </div>
            </div>
          </div>

          {/* Invoices Table */}
          {invoicesLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
              <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="font-bold text-slate-400 text-sm">No invoices found matching current filters.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="p-4">Invoice No / Date</th>
                      <th className="p-4">Channel</th>
                      <th className="p-4">Dealer Partner</th>
                      <th className="p-4">Retail Store / Outlet</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Subtotal</th>
                      <th className="p-4 text-right">GST</th>
                      <th className="p-4 text-right">Total Amount</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map(inv => (
                      <tr key={inv.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div>
                            <div className="flex items-center flex-wrap gap-1">
                              <span className="font-black text-slate-800 text-xs font-mono">{inv.invoiceNo}</span>
                              {inv.isCredit && (
                                <span className="text-[8px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase">Credit</span>
                              )}
                            </div>
                            <span className="block text-[9px] text-slate-400 font-medium mt-0.5">
                              {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <ChannelBadge channel={inv.channel || 'B2B'} />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-bold text-slate-800">{inv.dealer?.companyName || 'Unknown Dealer'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <Store className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="font-bold text-slate-700">{inv.store?.name || '—'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center">
                            <StatusBadge inv={inv} onClose={(inv) => setConfirmModal({ open: true, type: 'close', invoiceId: inv.id, invoiceNo: inv.invoiceNo })} />
                          </div>
                        </td>
                        <td className="p-4 text-right font-medium text-slate-600">₹{parseFloat(inv.subtotal).toFixed(2)}</td>
                        <td className="p-4 text-right font-medium text-slate-500">₹{parseFloat(inv.totalGst).toFixed(2)}</td>
                        <td className="p-4 text-right font-black text-rose-600">₹{parseFloat(inv.totalAmount).toFixed(2)}</td>
                        <td className="p-4">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button onClick={() => { setSelectedInvoice(inv); setShowDetailModal(true); }}
                              className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-800 cursor-pointer transition-colors" title="View Details">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDownloadPdf(inv)}
                              className="p-1.5 hover:bg-rose-50 border border-rose-100 rounded-lg text-rose-600 cursor-pointer transition-colors" title="Print PDF Invoice">
                              <Download className="w-3.5 h-3.5" />
                            </button>
                            {inv.status === 'OPEN' && (
                              <>
                                <button onClick={() => setConfirmModal({ open: true, type: 'close', invoiceId: inv.id, invoiceNo: inv.invoiceNo })}
                                  className="p-1.5 hover:bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 cursor-pointer transition-colors" title="Close & Deduct Stock">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setConfirmModal({ open: true, type: 'delete', invoiceId: inv.id, invoiceNo: inv.invoiceNo })}
                                  className="p-1.5 hover:bg-rose-50 border border-rose-100 rounded-lg text-rose-600 cursor-pointer transition-colors" title="Delete Invoice">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TRANSFER LOG TAB                                                         */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'transfers' && (
        <>
          {/* Transfer KPI mini-bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Transfers', value: transfers.length, cls: 'text-slate-800' },
              { label: 'In Transit', value: transfers.filter(t => t.status === 'IN_TRANSIT').length, cls: 'text-indigo-600' },
              { label: 'Delivered', value: transfers.filter(t => t.status === 'DELIVERED').length, cls: 'text-emerald-600' },
              { label: 'Pending', value: transfers.filter(t => t.status === 'PENDING').length, cls: 'text-amber-600' },
            ].map(k => (
              <div key={k.label} className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{k.label}</p>
                <p className={`text-2xl font-black mt-1 ${k.cls}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Transfer Filters */}
          <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2 text-slate-800">
                <Filter className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold uppercase tracking-wider">Filter Transfer Log</span>
              </div>
              <button onClick={fetchTransfers}
                className="flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search transfer no, dealer, invoice…"
                  value={txSearch} onChange={e => setTxSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none transition-all" />
              </div>
              <select value={txDealer} onChange={e => setTxDealer(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none font-semibold text-slate-600 cursor-pointer">
                <option value="">All Dealers</option>
                {dealers.map(d => <option key={d.id} value={d.id}>{d.companyName}</option>)}
              </select>
              <select value={txStatus} onChange={e => setTxStatus(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none font-semibold text-slate-600 cursor-pointer">
                <option value="">All Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="IN_TRANSIT">IN TRANSIT</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="DISCREPANCY">DISCREPANCY</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          {/* Transfer List */}
          {transfersLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
            </div>
          ) : filteredTransfers.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
              <Truck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="font-bold text-slate-400 text-sm">No transfers found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransfers.map(tx => (
                <div key={tx.id}
                  className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all ${
                    tx.status === 'IN_TRANSIT' ? 'border-indigo-200' :
                    tx.status === 'DISCREPANCY' ? 'border-orange-200' :
                    tx.status === 'DELIVERED' ? 'border-emerald-100' : 'border-slate-150'
                  }`}
                >
                  {/* Transfer Row Header */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Left: Transfer info */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-slate-800 text-xs font-mono">{tx.transferNo}</span>
                        <TransferStatusBadge status={tx.status} />
                        {tx.invoice?.invoiceNo && (
                          <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-full pl-2.5 pr-1.5 py-0.5 text-[9px] font-bold text-indigo-600">
                            <span>Invoice: {tx.invoice.invoiceNo}</span>
                            <button
                              onClick={() => { setSelectedInvoice(tx.invoice); setShowDetailModal(true); }}
                              className="p-0.5 hover:bg-indigo-100 rounded transition-colors cursor-pointer text-indigo-600"
                              title="View Invoice Details"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(tx.invoice)}
                              className="p-0.5 hover:bg-indigo-100 rounded transition-colors cursor-pointer text-indigo-600"
                              title="Download PDF"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-semibold">
                        <span className="flex items-center space-x-1">
                          <Building2 className="w-3 h-3" />
                          <span>{tx.dealer?.companyName || 'Unknown Dealer'}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Package className="w-3 h-3" />
                          <span>{tx.items?.length || 0} SKUs</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>Created: {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </span>
                        {tx.deliveredAt && (
                          <span className="flex items-center space-x-1 text-emerald-600">
                            <BadgeCheck className="w-3 h-3" />
                            <span>Delivered: {new Date(tx.deliveredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Admin Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {tx.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateTransferStatus(tx.id, 'IN_TRANSIT')}
                            disabled={txStatusLoading === tx.id}
                            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-lg shadow-indigo-100 transition-all cursor-pointer disabled:opacity-50"
                          >
                            <Truck className="w-3 h-3" />
                            <span>{txStatusLoading === tx.id ? 'Updating…' : 'Mark In Transit'}</span>
                          </button>
                          <button
                            onClick={() => handleUpdateTransferStatus(tx.id, 'CANCELLED')}
                            disabled={txStatusLoading === tx.id}
                            className="flex items-center space-x-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        </>
                      )}
                      {tx.status === 'IN_TRANSIT' && (
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl animate-pulse">
                          Awaiting dealer confirmation…
                        </span>
                      )}
                      {(tx.status === 'DELIVERED' || tx.status === 'DISCREPANCY') && (
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 ${
                          tx.status === 'DELIVERED'
                            ? 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                            : 'text-orange-700 bg-orange-50 border border-orange-100'
                        }`}>
                          {tx.status === 'DELIVERED' ? <BadgeCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                          <span>{tx.status === 'DELIVERED' ? 'Confirmed Delivered' : 'Discrepancy Reported'}</span>
                        </span>
                      )}
                      {/* Expand / Collapse Items */}
                      <button
                        onClick={() => setExpandedTransfer(expandedTransfer === tx.id ? null : tx.id)}
                        className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-pointer transition-colors"
                        title={expandedTransfer === tx.id ? 'Collapse' : 'View Items'}
                      >
                        {expandedTransfer === tx.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Items Panel */}
                  {expandedTransfer === tx.id && (
                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Shipped Items</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {tx.items?.map(item => (
                          <div key={item.id} className="bg-white border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="font-bold text-slate-700 text-xs truncate">{item.product?.name}</p>
                              <p className="text-[9px] font-bold text-rose-600">SKU: {item.product?.sku}</p>
                            </div>
                            <div className="flex flex-col items-end shrink-0 ml-3">
                              <span className="font-black text-slate-800 text-xs bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                                {item.quantity} {item.product?.unit || 'PCS'}
                              </span>
                              {item.hasDiscrepancy && (
                                <span className="text-[9px] font-bold text-orange-600 mt-0.5">
                                  Received: {item.receivedQuantity}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {tx.notes && (
                        <p className="text-[10px] text-slate-500 bg-white border border-slate-100 p-2.5 rounded-xl">
                          <strong>Notes:</strong> {tx.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ─── Invoice Details Modal ──────────────────────────────────────────── */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">GST Tax Invoice Breakdown</h3>
                <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{selectedInvoice.invoiceNo}</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <ChannelBadge channel={selectedInvoice.channel || 'B2B'} />
                  {selectedInvoice.isCredit && (
                    <span className="text-[8px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase">Credit</span>
                  )}
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 border border-slate-100 rounded-xl">
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Dealer & Outlet Info</span>
                  <p className="font-bold text-slate-800">Distributor: {selectedInvoice.dealer?.companyName}</p>
                  <p className="text-slate-500 font-medium">Billed To: {selectedInvoice.store ? selectedInvoice.store.name : 'B2B Warehouse Direct'}</p>
                  {selectedInvoice.store && <p className="text-slate-400">Store GST: {selectedInvoice.store.gstNumber || 'N/A'}</p>}
                </div>
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Invoice Info</span>
                  <p className="flex items-center space-x-1.5 text-slate-600">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Date: {new Date(selectedInvoice.createdAt).toLocaleDateString('en-IN')}</span>
                  </p>
                  <p className="flex items-center space-x-1.5 text-slate-600">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Status: <strong className={`uppercase ${selectedInvoice.status === 'CLOSED' ? 'text-emerald-600' : 'text-blue-600'}`}>{selectedInvoice.status}</strong></span>
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Items Breakdown</span>
                <div className="border border-slate-150 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 p-3 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    <div className="col-span-5">Product / SKU</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-center">Margin</div>
                    <div className="col-span-3 text-right">Line Total</div>
                  </div>
                  {selectedInvoice.items?.map(item => (
                    <div key={item.id} className="grid grid-cols-12 items-center p-3 border-b border-slate-100 last:border-0">
                      <div className="col-span-5 font-bold text-slate-800">
                        {item.product?.name}
                        <span className="block text-[9px] font-black text-rose-600">SKU: {item.product?.sku}</span>
                      </div>
                      <div className="col-span-2 text-center font-bold text-slate-700">{item.quantity} {item.unit || item.product?.unit || 'PCS'}</div>
                      <div className="col-span-2 text-center font-bold text-slate-700">{parseFloat(item.marginPct)}%</div>
                      <div className="col-span-3 text-right font-bold text-slate-800">₹{parseFloat(item.lineTotal).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end pt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between w-48 text-[11px] text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-700">₹{parseFloat(selectedInvoice.subtotal).toFixed(2)}</span>
                </div>
                {selectedInvoice.isGstEnabled !== false ? (
                  <>
                    <div className="flex justify-between w-48 text-[11px] text-slate-500">
                      <span>CGST:</span>
                      <span className="font-bold text-slate-700">₹{((selectedInvoice.cgst !== undefined ? parseFloat(selectedInvoice.cgst) : parseFloat(selectedInvoice.totalGst) / 2) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between w-48 text-[11px] text-slate-500">
                      <span>SGST:</span>
                      <span className="font-bold text-slate-700">₹{((selectedInvoice.sgst !== undefined ? parseFloat(selectedInvoice.sgst) : parseFloat(selectedInvoice.totalGst) / 2) || 0).toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between w-48 text-[11px] text-slate-500">
                    <span>GST:</span>
                    <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[9px] uppercase">Disabled</span>
                  </div>
                )}
                {selectedInvoice.shippingCharges && parseFloat(selectedInvoice.shippingCharges) > 0 && (
                  <div className="flex justify-between w-48 text-[11px] text-slate-500">
                    <span>Shipping:</span>
                    <span className="font-bold text-slate-700">₹{parseFloat(selectedInvoice.shippingCharges).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between w-48 text-xs font-black text-slate-800 border-t border-slate-100 pt-2">
                  <span>Grand Total:</span>
                  <span className="text-rose-600">₹{parseFloat(selectedInvoice.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-between items-center gap-3">
              <div className="flex items-center space-x-2">
                {selectedInvoice.status === 'OPEN' && (
                  <>
                    <button onClick={() => setConfirmModal({ open: true, type: 'close', invoiceId: selectedInvoice.id, invoiceNo: selectedInvoice.invoiceNo })}
                      disabled={actionLoading}
                      className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50">
                      <Check className="w-4 h-4" /><span>Close & Deduct Stock</span>
                    </button>
                    <button onClick={() => setConfirmModal({ open: true, type: 'delete', invoiceId: selectedInvoice.id, invoiceNo: selectedInvoice.invoiceNo })}
                      disabled={actionLoading}
                      className="inline-flex items-center space-x-2 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50">
                      <Trash2 className="w-4 h-4" /><span>Delete Invoice</span>
                    </button>
                  </>
                )}
                {selectedInvoice.status === 'CLOSED' && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg flex items-center space-x-1">
                    <Lock className="w-3 h-3" /><span>Invoice Closed — Stock Deducted</span>
                  </span>
                )}
              </div>
              <button onClick={() => handleDownloadPdf(selectedInvoice)}
                className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer">
                <Download className="w-4 h-4" /><span>Print PDF Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirm Action Modal ───────────────────────────────────────────── */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden">
            <div className={`p-6 border-b ${confirmModal.type === 'close' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
              <div className="flex items-center space-x-3">
                {confirmModal.type === 'close'
                  ? <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  : <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />}
                <div>
                  <h3 className="font-black text-slate-800 text-sm">
                    {confirmModal.type === 'close' ? 'Close Invoice & Deduct Stock' : 'Delete Invoice'}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5">{confirmModal.invoiceNo}</p>
                </div>
              </div>
            </div>
            <div className="p-6 text-xs text-slate-600">
              {confirmModal.type === 'close' ? (
                <p>Closing this invoice will <strong className="text-slate-800">deduct the SKU quantities from dealer stock</strong> and lock the invoice as <strong className="text-emerald-700">CLOSED</strong>.<br /><br />This action <strong>cannot be undone</strong>.</p>
              ) : (
                <p>Are you sure you want to <strong className="text-rose-700">permanently delete</strong> this OPEN invoice? No stock has been deducted yet.</p>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex space-x-3">
              <button onClick={() => setConfirmModal({ open: false, type: null, invoiceId: null, invoiceNo: '' })}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl transition-all cursor-pointer text-xs">
                Cancel
              </button>
              <button
                onClick={() => confirmModal.type === 'close' ? handleCloseInvoice(confirmModal.invoiceId) : handleDeleteInvoice(confirmModal.invoiceId)}
                disabled={actionLoading}
                className={`flex-1 font-bold py-2.5 rounded-xl shadow-lg transition-all cursor-pointer text-xs text-white disabled:opacity-50 ${
                  confirmModal.type === 'close' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}>
                {actionLoading ? 'Processing…' : confirmModal.type === 'close' ? 'Yes, Close & Deduct Stock' : 'Yes, Delete Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
