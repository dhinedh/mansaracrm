// src/components/WhatsAppShareModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, Check, ExternalLink, Phone, FileText, Download, 
  Printer, Loader2, Sparkles, Send, Share2, Info
} from 'lucide-react';
import { 
  cleanPhoneNumber, 
  normalizeQuotationData, 
  shareQuotationPdf, 
  downloadQuotationPdf,
  buildQuotationHtml,
  triggerPrintQuotation
} from '../utils/quotationHelper';

export default function WhatsAppShareModal({ 
  isOpen, 
  onClose, 
  quotationData, 
  defaultPhone = '', 
  defaultMessage = '' 
}) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareSuccessNotice, setShareSuccessNotice] = useState(null);

  const normalized = quotationData ? normalizeQuotationData(quotationData) : null;
  const isInvoice = Boolean(normalized?.isApprovedInvoice);
  const docTypeLabel = isInvoice ? 'Tax Invoice' : 'Quotation';
  const filePrefix = isInvoice ? 'Invoice' : 'Quotation';
  const refNo = normalized?.refNo || (isInvoice ? 'INV-Mansara' : 'QT-Mansara');
  const customerName = normalized?.customer?.name || 'Customer';
  const grandTotal = normalized?.grandTotal ? `₹${normalized.grandTotal.toLocaleString('en-IN')}` : '';

  useEffect(() => {
    if (isOpen) {
      const initialPhone = defaultPhone || normalized?.customer?.phone || '';
      setPhoneNumber(initialPhone);
      setCustomNote(
        isInvoice
          ? 'Please find attached our official tax invoice. Kindly review the PDF document.'
          : 'Please find attached our official price quotation. Kindly review the PDF document.'
      );
      setShareSuccessNotice(null);
      setLoading(false);
    }
  }, [isOpen, defaultPhone, normalized?.customer?.phone, isInvoice]);

  if (!isOpen) return null;

  const handleSharePdf = async () => {
    if (!quotationData) {
      alert(`${docTypeLabel} data not available to generate PDF`);
      return;
    }
    setLoading(true);
    setShareSuccessNotice(null);

    try {
      const result = await shareQuotationPdf(quotationData, phoneNumber, customNote);

      if (result.success) {
        if (result.method === 'web-share') {
          // Native mobile/supported desktop share opened with PDF file attached
          setTimeout(() => {
            onClose();
          }, 800);
        } else {
          // Desktop fallback: PDF downloaded + WhatsApp opened
          setShareSuccessNotice({
            type: 'desktop-guide',
            fileName: result.fileName || `${filePrefix}_${refNo}.pdf`
          });
        }
      }
    } catch (err) {
      console.error('Error sharing PDF on WhatsApp:', err);
      alert('Failed to generate or share PDF. Please try the "Download PDF" button.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!quotationData) return;
    setLoading(true);
    try {
      await downloadQuotationPdf(quotationData);
    } catch (err) {
      console.error('Download PDF error:', err);
      alert('Could not download PDF.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!quotationData) return;
    const html = buildQuotationHtml(quotationData);
    triggerPrintQuotation(html);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.825zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.981-1.306A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  Share {docTypeLabel} on WhatsApp
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                  {isInvoice ? 'Tax Invoice' : 'PDF Format'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {isInvoice
                  ? 'Send authentic Tax Invoice PDF directly to recipient or choose any contact'
                  : 'Send authentic PDF document directly to recipient or choose any contact'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PDF File Preview Badge Card */}
        <div className="bg-gradient-to-r from-rose-50/70 via-amber-50/50 to-emerald-50/40 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex flex-col items-center justify-center shadow-md shadow-rose-600/20 shrink-0">
              <FileText className="w-5 h-5 stroke-[2.5]" />
              <span className="text-[8px] font-black uppercase tracking-tighter">PDF</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs sm:text-sm font-black text-slate-900 truncate block">
                {filePrefix}_{refNo}.pdf
              </span>
              <p className="text-[11px] text-slate-600 truncate mt-0.5">
                Prepared for: <strong className="text-slate-800">{customerName}</strong>
                {grandTotal && <span className="ml-2 font-mono text-emerald-700 font-bold">• {grandTotal}</span>}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-slate-500">
                  A4 Commercial Letterhead &bull; Tax Breakdown &bull; Bank RTGS/UPI
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading}
              className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition shadow-xs cursor-pointer active:scale-95"
              title="Download PDF"
            >
              <Download className="w-4 h-4 text-rose-600" />
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={loading}
              className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition shadow-xs cursor-pointer active:scale-95"
              title="Preview / Print"
            >
              <Printer className="w-4 h-4 text-slate-700" />
            </button>
          </div>
        </div>

        {/* Recipient Phone Input */}
        <div className="space-y-1.5 shrink-0">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Recipient WhatsApp Number (Optional)
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400 flex items-center pointer-events-none">
              <Phone className="w-4 h-4" />
            </span>
            <input
              type="tel"
              placeholder="e.g. 9345991492 (or with country code +91)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>
          <p className="text-[10px] text-slate-500">
            {phoneNumber 
              ? 'WhatsApp chat will open directly with this recipient.' 
              : 'Leave blank to select any contact, customer or group directly inside WhatsApp.'}
          </p>
        </div>

        {/* Accompanying Message / Cover Note */}
        <div className="space-y-1.5 shrink-0">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Cover Note to Recipient
          </label>
          <textarea
            rows={2}
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder={`Add brief note to accompany the ${docTypeLabel.toLowerCase()}...`}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white resize-none"
          />
        </div>

        {/* Desktop Step-by-Step Guide Banner (shown when browser opens WhatsApp Web) */}
        {shareSuccessNotice?.type === 'desktop-guide' && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5 animate-fade-in">
            <div className="flex items-center gap-2 text-emerald-800 font-black text-xs">
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              <span>{docTypeLabel} PDF Downloaded &amp; WhatsApp Opened!</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              <strong>{shareSuccessNotice.fileName}</strong> was downloaded to your device. In WhatsApp, click the 📎 (Paperclip/Attach) icon &rarr; <strong>Document</strong> &rarr; select the downloaded PDF to send.
            </p>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-2 order-2 sm:order-1">
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading}
              className="flex-1 sm:flex-none px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 cursor-pointer text-xs transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-rose-600" />
              <span>Download {isInvoice ? 'Invoice' : 'PDF'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-3.5 py-2.5 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer text-xs transition"
            >
              Cancel
            </button>
          </div>

          <button
            type="button"
            onClick={handleSharePdf}
            disabled={loading}
            className="order-1 sm:order-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer text-xs sm:text-sm transition active:scale-95 disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing PDF...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.825zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.981-1.306A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                </svg>
                <span>Share {isInvoice ? 'Invoice' : 'PDF'} on WhatsApp</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
