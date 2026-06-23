// src/components/BulkUploadModule.jsx
import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertTriangle, X, Trash2, ArrowRight, Download, Filter } from 'lucide-react';

export default function BulkUploadModule({ 
  schema, // { title, fields: [{ name, label, required, type }], sampleRows: [[]] }
  onUpload, // async (validData) => { ... }
  onClose,
  templateName = "template.csv"
}) {
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsedRows, setParsedRows] = useState([]); // [{ raw: {}, parsed: {}, errors: [], isValid: true }]
  const [step, setStep] = useState(1); // 1: upload, 2: preview
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'VALID' | 'ERROR'
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  // Helper to trigger template file download
  const downloadTemplate = () => {
    const headers = schema.fields.map(f => f.name).join(',');
    const sampleData = schema.sampleRows 
      ? schema.sampleRows.map(row => row.join(',')).join('\n')
      : schema.fields.map(f => f.type === 'number' ? '100' : 'Sample').join(',');
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + sampleData;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", templateName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Simple CSV parser
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];
    
    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      // Handle simple quotes inside CSV
      let cells = [];
      let currentCell = '';
      let insideQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"' || char === "'") {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          cells.push(currentCell.trim().replace(/^["']|["']$/g, ''));
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      cells.push(currentCell.trim().replace(/^["']|["']$/g, ''));
      
      // Map to object
      const rowObj = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cells[idx] !== undefined ? cells[idx] : '';
      });
      rows.push(rowObj);
    }
    
    return rows;
  };

  const processFile = (fileObj) => {
    if (!fileObj.name.endsWith('.csv')) {
      alert('Please upload a valid CSV file.');
      return;
    }
    setFile(fileObj);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const rows = parseCSV(text);
      validateRows(rows);
    };
    reader.readAsText(fileObj);
  };

  // Schema-based validation logic
  const validateRows = (rawRows) => {
    const validated = rawRows.map((raw, idx) => {
      const errors = [];
      const parsed = {};
      
      schema.fields.forEach(field => {
        const rawValue = raw[field.name];
        
        // Required validation
        if (field.required && (rawValue === undefined || rawValue === null || rawValue === '')) {
          errors.push(`'${field.label}' is a required field`);
          return;
        }
        
        // Type validation
        if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
          if (field.type === 'number') {
            const num = Number(rawValue);
            if (isNaN(num)) {
              errors.push(`'${field.label}' must be a number (got: "${rawValue}")`);
            } else {
              parsed[field.name] = num;
            }
          } else if (field.type === 'boolean') {
            const val = rawValue.toLowerCase();
            if (val === 'true' || val === 'yes' || val === '1') {
              parsed[field.name] = true;
            } else if (val === 'false' || val === 'no' || val === '0') {
              parsed[field.name] = false;
            } else {
              errors.push(`'${field.label}' must be a boolean (yes/no)`);
            }
          } else {
            parsed[field.name] = String(rawValue);
          }
        } else {
          parsed[field.name] = field.type === 'number' ? 0 : field.type === 'boolean' ? false : '';
        }
      });
      
      return {
        rowNumber: idx + 2, // 1-based, skipping header
        raw,
        parsed,
        errors,
        isValid: errors.length === 0
      };
    });
    
    setParsedRows(validated);
    setStep(2);
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setStep(1);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    const validItems = parsedRows.filter(r => r.isValid).map(r => r.parsed);
    if (validItems.length === 0) {
      alert('No valid rows found to upload.');
      return;
    }
    
    setUploading(true);
    try {
      await onUpload(validItems);
      setUploadResult({
        success: true,
        count: validItems.length
      });
    } catch (err) {
      setUploadResult({
        success: false,
        message: err.message || 'Failed to bulk import data.'
      });
    } finally {
      setUploading(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const errorCount = parsedRows.length - validCount;
  
  const filteredRows = parsedRows.filter(row => {
    if (filterType === 'VALID') return row.isValid;
    if (filterType === 'ERROR') return !row.isValid;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white max-w-4xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-rose-50/50">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-rose-600" />
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
              {schema.title || "Bulk Import Utility"}
            </h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 font-bold bg-white p-1 rounded-lg border border-slate-200 hover:shadow transition-all cursor-pointer text-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {uploadResult ? (
          /* Result view */
          <div className="p-12 text-center space-y-6 flex-1 flex flex-col justify-center items-center">
            {uploadResult.success ? (
              <>
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-slate-800">Bulk Import Completed!</h4>
                  <p className="text-slate-500 text-xs">
                    Successfully imported <strong>{uploadResult.count}</strong> record(s) into the system.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-bold text-slate-800">Import Failed</h4>
                  <p className="text-rose-600 text-xs font-semibold">{uploadResult.message}</p>
                </div>
              </>
            )}
            <button
              onClick={uploadResult.success ? onClose : handleReset}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all text-xs cursor-pointer"
            >
              {uploadResult.success ? "Finish & Close" : "Try Again"}
            </button>
          </div>
        ) : step === 1 ? (
          /* Upload View */
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Guide & Template download */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 border border-slate-150 rounded-xl">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">Instructions</span>
                <p className="text-slate-650 text-slate-600 text-xs">
                  Prepare your spreadsheet with columns matching our template headers. Upload only <code>.csv</code> format files.
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center space-x-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs shadow-sm hover:shadow transition-all shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Download CSV Template</span>
              </button>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 transition-all cursor-pointer ${
                dragActive 
                  ? 'border-rose-500 bg-rose-50/20' 
                  : 'border-slate-300 hover:border-rose-400 hover:bg-slate-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center shadow-sm">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-800 text-sm">Drag and drop your CSV file here</p>
                <p className="text-slate-400 text-xs">or click to browse local files (under 10MB)</p>
              </div>
            </div>
          </div>
        ) : (
          /* Preview View */
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-slate-50/30">
            {/* Filter / Summary Toolbar */}
            <div className="p-4 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center bg-slate-100 rounded-xl p-0.5 text-xs font-semibold">
                  <button
                    onClick={() => setFilterType('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filterType === 'ALL' ? 'bg-white text-slate-800 shadow-sm font-bold' : 'text-slate-550 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({parsedRows.length})
                  </button>
                  <button
                    onClick={() => setFilterType('VALID')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filterType === 'VALID' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-slate-500 hover:text-emerald-600'
                    }`}
                  >
                    Valid ({validCount})
                  </button>
                  <button
                    onClick={() => setFilterType('ERROR')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      filterType === 'ERROR' ? 'bg-white text-rose-700 shadow-sm font-bold' : 'text-slate-500 hover:text-rose-600'
                    }`}
                  >
                    Errors ({errorCount})
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center space-x-1 text-slate-650 hover:text-slate-800 font-bold bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl text-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Clear Upload</span>
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={uploading || validCount === 0}
                  className="inline-flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-rose-200 hover:shadow-lg transition-all cursor-pointer"
                >
                  <span>{uploading ? 'Importing...' : `Import ${validCount} Valid Row(s)`}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Error alerts if any */}
            {errorCount > 0 && (
              <div className="bg-rose-50 border-b border-rose-100 px-5 py-3 text-rose-800 text-xs flex items-center space-x-2 font-medium shrink-0 animate-pulse">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>We found {errorCount} rows with errors. Invalid rows will be skipped during the final import.</span>
              </div>
            )}

            {/* Data Grid Preview */}
            <div className="flex-1 overflow-auto p-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black uppercase text-slate-400">
                      <th className="p-3 w-16 text-center">Row</th>
                      <th className="p-3 w-28 text-center">Status</th>
                      {schema.fields.map(f => (
                        <th key={f.name} className="p-3">{f.label}</th>
                      ))}
                      <th className="p-3">Validation Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-650">
                    {filteredRows.map((row, idx) => (
                      <tr key={idx} className={`hover:bg-slate-50/50 transition-colors ${!row.isValid ? 'bg-rose-50/10' : ''}`}>
                        <td className="p-3 font-mono font-bold text-center text-slate-450">{row.rowNumber}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            row.isValid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {row.isValid ? 'VALID' : 'ERROR'}
                          </span>
                        </td>
                        {schema.fields.map(f => (
                          <td key={f.name} className="p-3 font-medium">
                            <span className={row.errors.some(e => e.includes(f.label)) ? 'text-rose-600 font-bold' : ''}>
                              {row.raw[f.name] !== undefined ? row.raw[f.name] : '-'}
                            </span>
                          </td>
                        ))}
                        <td className="p-3 text-rose-600 font-semibold italic text-[11px]">
                          {row.errors.length > 0 ? (
                            <ul className="list-disc pl-4 space-y-0.5">
                              {row.errors.map((err, errIdx) => (
                                <li key={errIdx}>{err}</li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-emerald-600 not-italic">✓ Ready</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
