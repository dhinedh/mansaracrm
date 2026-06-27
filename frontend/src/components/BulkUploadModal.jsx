// src/components/BulkUploadModal.jsx
import React, { useState, useRef, useCallback } from 'react';
import {
  X, Upload, Download, FileText, CheckCircle2,
  AlertTriangle, SkipForward, Loader2, Package, Info
} from 'lucide-react';

const CRM_API = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const getToken = () => localStorage.getItem('crm-token') || '';

const CSV_TEMPLATE_HEADERS = [
  'name', 'sku', 'description', 'price', 'mrp', 'gstPercent',
  'hsnCode', 'categoryId', 'unit', 'minOrderQty', 'initialStock',
  'weight', 'offerPrice', 'isFeatured', 'isNewArrival', 'isOffer',
  'ingredients', 'howToUse', 'storage'
];

const CSV_SAMPLE_ROW = [
  'Ragi Porridge Mix 100g', 'MNS-RPM-001', 'Healthy ragi based porridge', '149', '199',
  '5', '1901', 'CATEGORY_ID_HERE', 'PCS', '1', '50',
  '100g', '', 'false', 'true', 'false',
  'Ragi, Jaggery, Cardamom', 'Add 2 tbsp to 200ml warm water', 'Store in cool dry place'
];

function downloadTemplate() {
  const rows = [CSV_TEMPLATE_HEADERS.join(','), CSV_SAMPLE_ROW.join(',')];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mansara_products_bulk_upload_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const STATUS_META = {
  created: { label: 'Created', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  skipped: { label: 'Skipped', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: SkipForward },
  error:   { label: 'Error',   color: 'bg-rose-50 text-rose-700 border-rose-200',     icon: AlertTriangle },
};

export default function BulkUploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null); // { summary, results }
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const fileInputRef = useRef();

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!f.name.endsWith('.csv')) {
      setError('Please select a .csv file.');
      return;
    }
    setFile(f);
    setResult(null);
    setError('');
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  }, [handleFile]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    setResult(null);

    const form = new FormData();
    form.append('file', file);

    try {
      const res = await fetch(`${CRM_API}/products/bulk-upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Upload failed.');
      } else {
        setResult(data);
        if (data.summary?.created > 0 && onSuccess) onSuccess();
      }
    } catch (err) {
      setError('Network error. Please check the server is running.');
    } finally {
      setUploading(false);
    }
  };

  const filteredResults = result?.results?.filter(r =>
    filterStatus === 'all' || r.status === filterStatus
  ) || [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <Upload className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-black text-slate-800">Bulk Upload Products</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Upload a CSV file to create multiple products at once</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Template Download */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-xs text-blue-700">
              <span className="font-bold">Required columns:</span> name, sku, price, gstPercent, categoryId (or category name).<br />
              <span className="font-semibold">Optional:</span> description, mrp, unit, minOrderQty, initialStock, weight, offerPrice, isFeatured, isNewArrival, isOffer, ingredients, howToUse, storage.
            </div>
            <button
              onClick={downloadTemplate}
              className="flex-shrink-0 inline-flex items-center gap-1.5 bg-white border border-blue-200 text-blue-700 text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template
            </button>
          </div>

          {/* ── Drop Zone ── */}
          {!result && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                dragOver
                  ? 'border-blue-400 bg-blue-50'
                  : file
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
              }`}
            >
              {file ? (
                <>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-800 text-sm">{file.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB • Click to change</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-600 text-sm">Drop CSV file here</p>
                    <p className="text-xs text-slate-400 mt-0.5">or click to browse — max 10MB</p>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold px-4 py-3 rounded-xl">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ── Results ── */}
          {result && (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Total Rows', value: result.summary.total, color: 'bg-slate-50 text-slate-700 border-slate-200' },
                  { label: 'Created', value: result.summary.created, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  { label: 'Skipped', value: result.summary.skipped, color: 'bg-amber-50 text-amber-700 border-amber-200' },
                  { label: 'Errors', value: result.summary.errors, color: 'bg-rose-50 text-rose-700 border-rose-200' },
                ].map(card => (
                  <div key={card.label} className={`border rounded-xl px-3 py-3 text-center ${card.color}`}>
                    <div className="text-xl font-black">{card.value}</div>
                    <div className="text-[11px] font-semibold mt-0.5 opacity-80">{card.label}</div>
                  </div>
                ))}
              </div>

              {/* Filter tabs */}
              <div className="flex gap-2">
                {['all', 'created', 'skipped', 'error'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer capitalize ${
                      filterStatus === s
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {s === 'all' ? `All (${result.results.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${result.results.filter(r => r.status === s).length})`}
                  </button>
                ))}
              </div>

              {/* Results Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-4 py-2.5 text-left w-10">Row</th>
                      <th className="px-4 py-2.5 text-left">SKU</th>
                      <th className="px-4 py-2.5 text-left">Name</th>
                      <th className="px-4 py-2.5 text-left">Status</th>
                      <th className="px-4 py-2.5 text-left">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredResults.map((r) => {
                      const meta = STATUS_META[r.status] || STATUS_META.error;
                      const Icon = meta.icon;
                      return (
                        <tr key={r.row} className="hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 text-slate-400 font-mono">{r.row}</td>
                          <td className="px-4 py-2.5 font-mono font-semibold text-slate-700">{r.sku}</td>
                          <td className="px-4 py-2.5 text-slate-600 max-w-[160px] truncate">{r.name}</td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${meta.color}`}>
                              <Icon className="w-3 h-3" />
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 max-w-[200px]">{r.message}</td>
                        </tr>
                      );
                    })}
                    {filteredResults.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-[11px]">
                          No rows match the selected filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Upload Another */}
              <button
                onClick={() => { setResult(null); setFile(null); setError(''); setFilterStatus('all'); }}
                className="text-xs text-blue-600 hover:underline cursor-pointer font-semibold"
              >
                ← Upload another file
              </button>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {!result && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              {uploading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
              ) : (
                <><Package className="w-3.5 h-3.5" /> Upload & Create Products</>
              )}
            </button>
          </div>
        )}
        {result && (
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs font-bold bg-slate-800 text-white hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
