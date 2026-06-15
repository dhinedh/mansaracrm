// src/pages/dealer/InvoicesHistoryPage.jsx
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
  Lock
} from 'lucide-react';

export default function InvoicesHistoryPage() {
  const location = useLocation();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, type: null, invoiceId: null, invoiceNo: '' });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/billing');
      const invoiceData = res.data.data || [];
      setInvoices(invoiceData);

      // Auto-open if redirected with an invoiceId in state
      if (location.state?.invoiceId) {
        const found = invoiceData.find(inv => inv.id === location.state.invoiceId);
        if (found) {
          setSelectedInvoice(found);
          setShowDetailModal(true);
        }
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Print / PDF ────────────────────────────────────────────────────────────
  const triggerClientSidePrint = (invoice) => {
    const itemsRows = invoice.items.map((item, idx) => {
      const qty = parseInt(item.quantity);
      const unitPrice = parseFloat(item.unitPrice);
      const margin = parseFloat(item.marginPct);
      const sellingPrice = parseFloat(item.sellingPrice || (unitPrice * (1 + margin / 100)));
      const gstPct = parseFloat(item.gstPercent || item.product?.gstPercent || 5);
      const lineTotal = parseFloat(item.lineTotal);
      return `
        <tr>
          <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #F5EFE6;color:#61220F;">${idx + 1}</td>
          <td style="padding:10px 8px;border-bottom:1px solid #F5EFE6;">
            <div style="font-weight:600;color:#36302E;">${item.product?.name || 'Product'}</div>
            <div style="font-size:10px;color:#812F16;font-weight:500;">SKU: ${item.product?.sku || 'N/A'}</div>
          </td>
          <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #F5EFE6;font-weight:600;">${qty} ${item.product?.unit || 'PCS'}</td>
          <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #F5EFE6;">₹${unitPrice.toFixed(2)}</td>
          <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #F5EFE6;color:#B84A26;font-weight:600;">${margin}%</td>
          <td style="text-align:right;padding:10px 8px;border-bottom:1px solid #F5EFE6;font-weight:700;color:#61220F;">₹${lineTotal.toFixed(2)}</td>
        </tr>`;
    }).join('');

    const dateStr = new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const pw = window.open('', '_blank');
    pw.document.write(`<!DOCTYPE html><html><head><title>Invoice - ${invoice.invoiceNo}</title>
      <style>body{font-family:sans-serif;margin:40px;font-size:12px;color:#36302E;}
      table{width:100%;border-collapse:collapse;}th{background:#B84A26;color:#fff;padding:10px 8px;text-align:left;font-size:10px;text-transform:uppercase;}
      .grand{background:#B84A26;color:#fff;font-weight:700;}</style></head><body>
      <div style="max-width:800px;margin:auto;">
        <h2 style="color:#B84A26;margin:0 0 4px;">TAX INVOICE</h2>
        <p style="margin:0 0 2px;"><strong>Invoice No:</strong> ${invoice.invoiceNo}</p>
        <p style="margin:0 0 16px;"><strong>Date:</strong> ${dateStr} &nbsp;|&nbsp; <strong>Status:</strong> ${invoice.status}</p>
        <table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Base Price</th><th>Margin</th><th>Total</th></tr></thead>
        <tbody>${itemsRows}</tbody></table>
        <table style="width:45%;margin-left:55%;margin-top:12px;border:1px solid #EBE3D5;">
          <tr><td style="padding:7px 12px;">Subtotal</td><td style="text-align:right;padding:7px 12px;font-weight:600;">₹${parseFloat(invoice.subtotal).toFixed(2)}</td></tr>
          <tr><td style="padding:7px 12px;">GST Total</td><td style="text-align:right;padding:7px 12px;">₹${parseFloat(invoice.totalGst).toFixed(2)}</td></tr>
          <tr class="grand"><td style="padding:9px 12px;color:#fff;">Grand Total</td><td style="text-align:right;padding:9px 12px;color:#fff;">₹${parseFloat(invoice.totalAmount).toFixed(2)}</td></tr>
        </table>
      </div>
      <script>window.onload=function(){window.print();}</script></body></html>`);
    pw.document.close();
  };

  const handleDownloadPdf = async (invoice) => {
    try {
      const response = await axios.get(`/billing/${invoice.id}/pdf`, { responseType: 'blob' });
      const contentType = response.headers['content-type'] || '';

      if (contentType.includes('text/html')) {
        // Puppeteer unavailable — backend sent printable HTML fallback
        const htmlBlob = new Blob([response.data], { type: 'text/html' });
        window.open(URL.createObjectURL(htmlBlob), '_blank');
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

  // ─── Close Invoice ───────────────────────────────────────────────────────────
  const handleCloseInvoice = async (invoiceId) => {
    setConfirmModal({ open: false, type: null, invoiceId: null, invoiceNo: '' });
    setActionLoading(true);
    try {
      await axios.patch(`/billing/${invoiceId}/close`);
      setShowDetailModal(false);
      await fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close invoice. Ensure you have sufficient stock.');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Delete Invoice ──────────────────────────────────────────────────────────
  const handleDeleteInvoice = async (invoiceId) => {
    setConfirmModal({ open: false, type: null, invoiceId: null, invoiceNo: '' });
    setActionLoading(true);
    try {
      await axios.delete(`/billing/${invoiceId}`);
      setShowDetailModal(false);
      await fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  const openDetails = (inv) => {
    setSelectedInvoice(inv);
    setShowDetailModal(true);
  };

  const openConfirm = (type, inv) => {
    setConfirmModal({ open: true, type, invoiceId: inv.id, invoiceNo: inv.invoiceNo });
  };

  // ─── Status Badge ────────────────────────────────────────────────────────────
  const StatusBadge = ({ inv, clickable = true }) => {
    const base = 'text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase transition-all select-none';
    if (inv.status === 'CLOSED') {
      return (
        <span className={`${base} bg-emerald-50 text-emerald-700 flex items-center space-x-1`}>
          <Lock className="w-2.5 h-2.5" />
          <span>CLOSED</span>
        </span>
      );
    }
    if (inv.status === 'OPEN' && clickable) {
      return (
        <span
          onClick={() => openConfirm('close', inv)}
          title="Click to Close Invoice & Deduct Stock"
          className={`${base} bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 cursor-pointer ring-1 ring-blue-200`}
        >
          OPEN ↗
        </span>
      );
    }
    return (
      <span className={`${base} bg-blue-50 text-blue-700`}>OPEN</span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Invoice Ledger</h2>
        <p className="text-slate-500 text-xs mt-0.5">
          Manage your invoices — delete while <span className="font-bold text-blue-600">OPEN</span>, or click the status badge to close &amp; deduct stock.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px]">
        <div className="flex items-center space-x-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          <span className="font-bold text-blue-700">OPEN — No stock deducted yet. Can be deleted.</span>
        </div>
        <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
          <Lock className="w-2.5 h-2.5 text-emerald-600" />
          <span className="font-bold text-emerald-700">CLOSED — Stock deducted. Invoice locked.</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
          <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="font-bold text-slate-400 text-sm">No invoices generated yet.</p>
          <p className="text-slate-400 text-xs mt-1">Create an invoice from the Billing Cart.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-4">Invoice No / Date</th>
                  <th className="p-4">Retail Outlet Store</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Subtotal</th>
                  <th className="p-4 text-right">GST Total</th>
                  <th className="p-4 text-right">Invoice Amount</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                    {/* Invoice No / Date */}
                    <td className="p-4">
                      <div>
                        <div className="flex items-center flex-wrap gap-1">
                          <span className="font-black text-slate-800 text-xs">{inv.invoiceNo}</span>
                          {inv.isCredit && (
                            <span className="text-[8px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase tracking-wide">
                              Credit
                            </span>
                          )}
                          {inv.isCredit && inv.status === 'OPEN' && new Date(inv.createdAt) <= (() => { const d = new Date(); d.setDate(d.getDate() - 15); return d; })() && (
                            <span className="text-[8px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wide animate-pulse">
                              ⚠️ Overdue
                            </span>
                          )}
                        </div>
                        <span className="block text-[9px] text-slate-400 font-medium mt-0.5">
                          {new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </td>

                    {/* Store */}
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Store className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span className="font-bold text-slate-700">{inv.store?.name || 'B2B Warehouse Direct'}</span>
                      </div>
                    </td>

                    {/* Status — clickable for OPEN */}
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <StatusBadge inv={inv} clickable />
                      </div>
                    </td>

                    <td className="p-4 text-right font-medium text-slate-600">₹{parseFloat(inv.subtotal).toFixed(2)}</td>
                    <td className="p-4 text-right font-medium text-slate-500">₹{parseFloat(inv.totalGst).toFixed(2)}</td>
                    <td className="p-4 text-right font-black text-rose-600">₹{parseFloat(inv.totalAmount).toFixed(2)}</td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => openDetails(inv)}
                          className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-800 flex items-center cursor-pointer transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(inv)}
                          className="p-1.5 hover:bg-rose-50 border border-rose-100 rounded-lg text-rose-600 flex items-center cursor-pointer transition-colors"
                          title="Print PDF Invoice"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {inv.status === 'OPEN' && (
                          <>
                            <button
                              onClick={() => openConfirm('close', inv)}
                              className="p-1.5 hover:bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600 flex items-center cursor-pointer transition-colors"
                              title="Close & Deduct Stock"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openConfirm('delete', inv)}
                              className="p-1.5 hover:bg-rose-50 border border-rose-100 rounded-lg text-rose-600 flex items-center cursor-pointer transition-colors"
                              title="Delete Invoice"
                            >
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

      {/* ─── Invoice Details Modal ──────────────────────────────────────── */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">GST Tax Invoice Breakdown</h3>
                <span className="text-[10px] text-slate-400 block font-bold mt-0.5">Bill: {selectedInvoice.invoiceNo}</span>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 border border-slate-100 rounded-xl">
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Outlet Details</span>
                  {selectedInvoice.store ? (
                    <>
                      <p className="font-bold text-slate-800 text-xs">{selectedInvoice.store.name}</p>
                      <p className="text-slate-500">{selectedInvoice.store.address}</p>
                      <p className="text-slate-500">GST: <strong className="text-slate-700">{selectedInvoice.store.gstNumber || 'N/A'}</strong></p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-rose-600 text-xs">B2B Warehouse Direct</p>
                      <p className="text-slate-500">{selectedInvoice.dealer?.address}</p>
                    </>
                  )}
                </div>
                <div className="space-y-1.5">
                  <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Invoice Info</span>
                  <p className="flex items-center space-x-1.5 text-slate-600">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}</span>
                  </p>
                  <p className="flex items-center space-x-1.5 text-slate-600">
                    <FileText className="w-3.5 h-3.5" />
                    <span>
                      Status:{' '}
                      <strong
                        onClick={() => selectedInvoice.status === 'OPEN' && openConfirm('close', selectedInvoice)}
                        className={`uppercase transition-all ${
                          selectedInvoice.status === 'CLOSED'
                            ? 'text-emerald-600'
                            : 'text-blue-600 hover:underline cursor-pointer'
                        }`}
                        title={selectedInvoice.status === 'OPEN' ? 'Click to Close Invoice & Deduct Stock' : undefined}
                      >
                        {selectedInvoice.status}
                      </strong>
                    </span>
                  </p>
                  {selectedInvoice.isCredit && (
                    <div className="mt-2 p-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-800 font-bold text-[10px]">
                      Credit Terms: 15 Days
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-2">
                <span className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Items Breakdown</span>
                <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
                  <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 p-3 text-[9px] font-black uppercase tracking-wider text-slate-400">
                    <div className="col-span-5">Product SKU</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-center">Margin</div>
                    <div className="col-span-3 text-right">Line Total</div>
                  </div>
                  {selectedInvoice.items?.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 items-center p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/20">
                      <div className="col-span-5 font-bold text-slate-800">
                        {item.product?.name}
                        <span className="block text-[9px] font-black text-rose-600">SKU: {item.product?.sku}</span>
                      </div>
                      <div className="col-span-2 text-center font-bold text-slate-700">{item.quantity} {item.product?.unit}</div>
                      <div className="col-span-2 text-center font-bold text-slate-700">{parseFloat(item.marginPct)}%</div>
                      <div className="col-span-3 text-right font-bold text-slate-800">₹{parseFloat(item.lineTotal).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="text-[10px] bg-slate-50/50 border border-slate-100 p-3 rounded-xl text-slate-500">
                  <strong>Invoice Memo:</strong> {selectedInvoice.notes}
                </div>
              )}

              {/* Totals */}
              <div className="flex flex-col items-end pt-4 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center w-48 text-[11px] text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-700">₹{parseFloat(selectedInvoice.subtotal).toFixed(2)}</span>
                </div>
                {selectedInvoice.isGstEnabled !== false ? (
                  <>
                    <div className="flex justify-between items-center w-48 text-[11px] text-slate-500">
                      <span>CGST:</span>
                      <span className="font-bold text-slate-700">₹{(selectedInvoice.cgst !== undefined ? parseFloat(selectedInvoice.cgst) : parseFloat(selectedInvoice.totalGst) / 2).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center w-48 text-[11px] text-slate-500">
                      <span>SGST:</span>
                      <span className="font-bold text-slate-700">₹{(selectedInvoice.sgst !== undefined ? parseFloat(selectedInvoice.sgst) : parseFloat(selectedInvoice.totalGst) / 2).toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center w-48 text-[11px] text-slate-500">
                    <span>GST:</span>
                    <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[9px] uppercase font-black">Disabled</span>
                  </div>
                )}
                {selectedInvoice.shippingCharges && parseFloat(selectedInvoice.shippingCharges) > 0 && (
                  <div className="flex justify-between items-center w-48 text-[11px] text-slate-500">
                    <span>Shipping:</span>
                    <span className="font-bold text-slate-700">₹{parseFloat(selectedInvoice.shippingCharges).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center w-48 text-xs font-black text-slate-800 border-t border-slate-100 pt-2">
                  <span>Grand Total:</span>
                  <span className="text-rose-600">₹{parseFloat(selectedInvoice.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-6 border-t border-slate-100 flex justify-between items-center gap-3">
              <div className="flex items-center space-x-2">
                {selectedInvoice.status === 'OPEN' && (
                  <>
                    <button
                      onClick={() => openConfirm('close', selectedInvoice)}
                      disabled={actionLoading}
                      className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Close &amp; Deduct Stock</span>
                    </button>
                    <button
                      onClick={() => openConfirm('delete', selectedInvoice)}
                      disabled={actionLoading}
                      className="inline-flex items-center space-x-2 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Invoice</span>
                    </button>
                  </>
                )}
                {selectedInvoice.status === 'CLOSED' && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg flex items-center space-x-1">
                    <Lock className="w-3 h-3" />
                    <span>Invoice Closed — Stock Deducted</span>
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDownloadPdf(selectedInvoice)}
                className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Print PDF Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirmation Modal ─────────────────────────────────────────── */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
            <div className={`p-6 border-b ${confirmModal.type === 'close' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
              <div className="flex items-center space-x-3">
                {confirmModal.type === 'close' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                )}
                <div>
                  <h3 className="font-black text-slate-800 text-sm">
                    {confirmModal.type === 'close' ? 'Close Invoice & Deduct Stock' : 'Delete Invoice'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">{confirmModal.invoiceNo}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4 text-xs text-slate-600">
              {confirmModal.type === 'close' ? (
                <p>
                  Closing this invoice will <strong className="text-slate-800">deduct the SKU quantities from your stock list</strong> and lock the invoice as <strong className="text-emerald-700">CLOSED</strong>.
                  <br /><br />
                  This action <strong>cannot be undone</strong>. Make sure you have sufficient stock before proceeding.
                </p>
              ) : (
                <p>
                  Are you sure you want to <strong className="text-rose-700">permanently delete</strong> this invoice?
                  <br /><br />
                  Since the invoice is still <strong className="text-blue-700">OPEN</strong>, no stock has been deducted. Deleting will remove this invoice record entirely.
                </p>
              )}
            </div>
            <div className="p-6 border-t border-slate-100 flex space-x-3">
              <button
                onClick={() => setConfirmModal({ open: false, type: null, invoiceId: null, invoiceNo: '' })}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl transition-all cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmModal.type === 'close' ? handleCloseInvoice(confirmModal.invoiceId) : handleDeleteInvoice(confirmModal.invoiceId)}
                disabled={actionLoading}
                className={`flex-1 font-bold py-2.5 rounded-xl shadow-lg transition-all cursor-pointer text-xs text-white disabled:opacity-50 ${
                  confirmModal.type === 'close'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'
                }`}
              >
                {actionLoading
                  ? 'Processing...'
                  : confirmModal.type === 'close'
                    ? 'Yes, Close & Deduct Stock'
                    : 'Yes, Delete Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
