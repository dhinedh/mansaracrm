// src/pages/admin/BulkUploadPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Clock,
  ArrowRight,
  RefreshCw,
  X,
  Store,
  Package,
  ShoppingCart,
  Users
} from 'lucide-react';

const MODULES = [
  { id: 'STORES', label: 'Shops & Outlets', icon: Store, desc: 'Import retail stores, kirana shops, and locations' },
  { id: 'PRODUCTS', label: 'Products & Stock', icon: Package, desc: 'Import SKUs, MRPs, carton sizes, and opening stock' },
  { id: 'ORDERS', label: 'Orders & Bookings', icon: ShoppingCart, desc: 'Import store orders and line item demands' },
  { id: 'CUSTOMERS', label: 'Customers & Leads', icon: Users, desc: 'Import customer contacts, cities, and sales leads' }
];

export default function BulkUploadPage() {
  const [activeModule, setActiveModule] = useState('STORES');
  const [selectedFile, setSelectedFile] = useState(null);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [committing, setCommitting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get('/bulk-upload/history');
      if (res.data?.success) {
        setHistory(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load bulk upload history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDownloadTemplate = async (format = 'xlsx') => {
    try {
      const response = await axios.get(`/bulk-upload/template/${activeModule.toLowerCase()}?format=${format}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeModule.toLowerCase()}_sample_template.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Failed to download sample template');
    }
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
      alert('Only Excel (.xlsx, .xls) and CSV (.csv) files are supported.');
      return;
    }
    setSelectedFile(file);
    setValidationResult(null);
    setImportResult(null);
    setMessage({ text: '', type: '' });
  };

  const handleValidateFile = async () => {
    if (!selectedFile) return;
    setValidating(true);
    setMessage({ text: '', type: '' });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('module', activeModule);

      const res = await axios.post('/bulk-upload/validate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setValidationResult(res.data.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'File validation failed');
    } finally {
      setValidating(false);
    }
  };

  const handleCommitImport = async (importOnlyValid = true) => {
    if (!validationResult) return;
    setCommitting(true);
    try {
      const rowsToImport = validationResult.results
        .filter(r => (importOnlyValid ? r.isValid : true))
        .map(r => r.data);

      if (rowsToImport.length === 0) {
        alert('No valid rows available to import.');
        setCommitting(false);
        return;
      }

      const res = await axios.post('/bulk-upload/commit', {
        module: activeModule,
        filename: validationResult.filename,
        rows: rowsToImport
      });

      if (res.data?.success) {
        setImportResult(res.data.data);
        setMessage({
          text: `Successfully imported ${res.data.data.successCount} record(s) into ${activeModule}!`,
          type: 'success'
        });
        if (activeModule.toUpperCase() === 'PRODUCTS' || activeModule.toUpperCase() === 'STOCK') {
          try {
            localStorage.setItem('crm_products_updated', Date.now().toString());
            window.dispatchEvent(new Event('crm_products_updated'));
          } catch (e) {}
        }
        setSelectedFile(null);
        setValidationResult(null);
        fetchHistory();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to import data');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <span className="text-xs font-black uppercase tracking-widest text-rose-500 block">
          Data Management &amp; Migration
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
          <UploadCloud className="w-7 h-7 text-rose-600" />
          Bulk Data Upload Center
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          Import bulk shops, stocks, products, and customer records via Excel (.xlsx) and CSV with real-time validation.
        </p>
      </div>

      {/* Global Alert Notification */}
      {message.text && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            message.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Module Selector Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {MODULES.map(m => {
          const Icon = m.icon;
          const isActive = activeModule === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                setActiveModule(m.id);
                setSelectedFile(null);
                setValidationResult(null);
                setImportResult(null);
              }}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${
                isActive ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <h3 className={`font-bold text-xs ${isActive ? 'text-rose-900' : 'text-slate-800'}`}>{m.label}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{m.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Upload & Sample Template Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Step 1: Download Sample Template for {activeModule}
            </h3>
            <p className="text-xs text-slate-500">
              Format your data according to the official columns to ensure zero validation errors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadTemplate('xlsx')}
              className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Excel (.xlsx)
            </button>
            <button
              onClick={() => handleDownloadTemplate('csv')}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              CSV (.csv)
            </button>
          </div>
        </div>

        {/* Step 2: Drag and Drop Upload Zone */}
        <div>
          <h3 className="font-bold text-slate-900 text-sm mb-2">
            Step 2: Upload Excel / CSV File
          </h3>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100/60 transition-colors"
          >
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
              id="bulk-file-input"
              className="hidden"
            />
            <label htmlFor="bulk-file-input" className="cursor-pointer flex flex-col items-center">
              <UploadCloud className="w-12 h-12 text-rose-500 mb-2" />
              <span className="font-bold text-slate-800 text-sm">
                {selectedFile ? selectedFile.name : 'Click to browse or drag and drop file here'}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                {selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB · Ready for validation`
                  : 'Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv) up to 10MB'}
              </span>
            </label>
          </div>

          {selectedFile && !validationResult && (
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setSelectedFile(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={handleValidateFile}
                disabled={validating}
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer shadow-xs disabled:opacity-50"
              >
                {validating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Validating Rows...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Validate Data
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ─── Validation Results & Preview Table ─── */}
      {validationResult && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase text-rose-500 block">
                Validation Summary
              </span>
              <h3 className="font-bold text-slate-900 text-base">
                File: {validationResult.filename}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                Total: {validationResult.totalRows} rows
              </span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                Valid: {validationResult.validCount}
              </span>
              {validationResult.errorCount > 0 && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-800">
                  Errors: {validationResult.errorCount}
                </span>
              )}
            </div>
          </div>

          {/* Validation Feedback Warning */}
          {validationResult.errorCount > 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Errors found in {validationResult.errorCount} row(s).</span>
                <p className="mt-0.5 text-[11px]">
                  You can proceed by importing only the {validationResult.validCount} valid row(s), or correct the spreadsheet and re-upload.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold">All {validationResult.totalRows} row(s) are valid and ready for final import!</span>
            </div>
          )}

          {/* Row Preview Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-96">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase sticky top-0">
                <tr>
                  <th className="py-2.5 px-3 text-center">Row</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-4">Record Preview</th>
                  <th className="py-2.5 px-4">Validation Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {validationResult.results?.map((res, i) => (
                  <tr key={i} className={res.isValid ? 'hover:bg-slate-50' : 'bg-red-50/20 hover:bg-red-50/40'}>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">
                      {res.rowNumber}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {res.isValid ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                          <XCircle className="w-2.5 h-2.5" />
                          Error
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800">
                      <span className="font-bold block">
                        {res.data.name || res.data.title || res.raw['Shop Name*'] || res.raw['Product Name*'] || 'Item'}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {res.data.phone || res.data.sku || res.raw['Phone*'] || res.raw['SKU*'] || ''}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      {res.errors && res.errors.length > 0 ? (
                        <ul className="text-red-700 text-[11px] font-medium list-disc pl-4 space-y-0.5">
                          {res.errors.map((err, ei) => (
                            <li key={ei}>{err}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-emerald-700 text-[11px] font-medium">Passed all checks</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              onClick={() => {
                setValidationResult(null);
                setSelectedFile(null);
              }}
              className="text-slate-500 hover:text-slate-700 font-bold text-xs cursor-pointer"
            >
              Cancel &amp; Re-upload
            </button>

            <div className="flex items-center gap-2">
              {validationResult.validCount > 0 && (
                <button
                  onClick={() => handleCommitImport(true)}
                  disabled={committing}
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {committing ? 'Importing Records...' : `Confirm & Import ${validationResult.validCount} Valid Records`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Recent Bulk Upload History ─── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Recent Bulk Import History
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Audit log of all batch upload jobs.</p>
          </div>
          <button onClick={fetchHistory} className="text-slate-400 hover:text-slate-600 p-1">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loadingHistory ? (
          <p className="text-xs text-slate-400 py-6 text-center">Loading import history...</p>
        ) : history.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No batch imports recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((item) => (
              <div key={item._id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800">{item.filename}</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="uppercase font-semibold">{item.module}</span>
                    <span>·</span>
                    <span>{new Date(item.createdAt).toLocaleString('en-IN')}</span>
                    <span>·</span>
                    <span>By {item.uploadedBy?.name || 'Admin'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg font-bold text-[10px]">
                    +{item.successCount} imported
                  </span>
                  {item.failedCount > 0 && (
                    <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-lg font-bold text-[10px]">
                      {item.failedCount} failed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
