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
  XCircle,
  SlidersHorizontal,
  Upload,
  Image,
  CreditCard,
  Hash,
  Save,
  Pencil
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

function InvoiceConfigModal({ isOpen, onClose, onSettingsUpdated }) {
  const [activeConfigTab, setActiveConfigTab] = useState('branding'); // branding | address | numbering | bank | terms
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form State
  const [companyName, setCompanyName] = useState('Mansara Foods Pvt. Ltd.');
  const [logoBase64, setLogoBase64] = useState('');
  const [gstNumber, setGstNumber] = useState('27AABCM1234F1Z5');
  const [address, setAddress] = useState('Mumbai, Maharashtra, India');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Tamil Nadu');
  const [pincode, setPincode] = useState('600077');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('info@mansarafoods.com');
  const [invoicePrefix, setInvoicePrefix] = useState('MF-INV');
  const [nextSequenceNumber, setNextSequenceNumber] = useState(38);
  const [placeOfSupply, setPlaceOfSupply] = useState('Tamil Nadu (33)');
  const [invoiceTerms, setInvoiceTerms] = useState('1. Payment within 15 days.\n2. Interest @ 2% per month on delay.\n3. Claims if any must be reported at delivery.');
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branch, setBranch] = useState('');
  const [accountType, setAccountType] = useState('Current');
  const [signatoryTitle, setSignatoryTitle] = useState('Authorised Signatory');
  const [signatoryName, setSignatoryName] = useState('Mansara Foods Pvt. Ltd.');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await axios.get('/billing/settings');
      if (res.data.success && res.data.data) {
        const s = res.data.data;
        if (s.companyName) setCompanyName(s.companyName);
        if (s.logoBase64) setLogoBase64(s.logoBase64);
        if (s.gstNumber) setGstNumber(s.gstNumber);
        if (s.address) setAddress(s.address);
        if (s.city) setCity(s.city || '');
        if (s.state) setState(s.state || 'Tamil Nadu');
        if (s.pincode) setPincode(s.pincode || '600077');
        if (s.phone) setPhone(s.phone);
        if (s.email) setEmail(s.email);
        if (s.invoicePrefix) setInvoicePrefix(s.invoicePrefix);
        if (s.nextSequenceNumber !== undefined) setNextSequenceNumber(s.nextSequenceNumber);
        if (s.placeOfSupply) setPlaceOfSupply(s.placeOfSupply);
        if (s.invoiceTerms) setInvoiceTerms(s.invoiceTerms);
        if (s.bankDetails) {
          setBankName(s.bankDetails.bankName || '');
          setAccountNo(s.bankDetails.accountNo || '');
          setIfscCode(s.bankDetails.ifscCode || '');
          setBranch(s.bankDetails.branch || '');
          setAccountType(s.bankDetails.accountType || 'Current');
        }
        if (s.signatoryTitle) setSignatoryTitle(s.signatoryTitle);
        if (s.signatoryName) setSignatoryName(s.signatoryName);
      }
    } catch (err) {
      console.error('Failed to load invoice settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('Logo file size must be less than 3MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setLogoBase64(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const payload = {
        companyName,
        logoBase64,
        gstNumber,
        address,
        city,
        state,
        pincode,
        phone,
        email,
        invoicePrefix,
        nextSequenceNumber: parseInt(nextSequenceNumber, 10) || 1,
        placeOfSupply,
        invoiceTerms,
        bankDetails: {
          bankName,
          accountNo,
          ifscCode,
          branch,
          accountType
        },
        signatoryTitle,
        signatoryName
      };

      const res = await axios.put('/billing/settings', payload);
      if (res.data.success) {
        setMessage({ text: 'Invoice configuration saved successfully!', type: 'success' });
        if (onSettingsUpdated) onSettingsUpdated();
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to update invoice settings:', err);
      setMessage({ text: err.response?.data?.message || 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const formattedInvoiceNoPreview = `${invoicePrefix || 'MF-INV'}-${String(nextSequenceNumber || 1).padStart(5, '0')}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-rose-600/30 border border-rose-500/40 rounded-2xl">
              <SlidersHorizontal className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Invoice Configuration &amp; Branding</h3>
              <p className="text-xs text-slate-400">Configure company logo, numbering format, bank info, tax details &amp; terms</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* LEFT: Config Tabs & Form */}
          <div className="w-full md:w-7/12 flex flex-col border-r border-slate-150 bg-slate-50/50">
            {/* Nav Tabs */}
            <div className="flex border-b border-slate-200 bg-white px-2 overflow-x-auto">
              {[
                { id: 'branding', label: 'Branding & Logo', Icon: Image },
                { id: 'address', label: 'Address & Tax', Icon: Building2 },
                { id: 'numbering', label: 'Numbering', Icon: Hash },
                { id: 'bank', label: 'Bank Details', Icon: CreditCard },
                { id: 'terms', label: 'Terms & Sign', Icon: FileText }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveConfigTab(t.id)}
                  className={`py-3 px-3.5 text-xs font-bold transition-all flex items-center space-x-1.5 border-b-2 whitespace-nowrap cursor-pointer ${
                    activeConfigTab === t.id
                      ? 'border-rose-600 text-rose-700 bg-rose-50/30'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <t.Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            {/* Form Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {message.text && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                  message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                  <span>{message.text}</span>
                </div>
              )}

              {loading ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin mb-2 text-rose-600" />
                  <p className="text-xs font-medium">Loading configuration settings…</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: BRANDING & LOGO */}
                  {activeConfigTab === 'branding' && (
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                        <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">Company Logo</label>
                        <div className="flex items-center space-x-4">
                          <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center p-2 relative overflow-hidden group">
                            {logoBase64 ? (
                              <img src={logoBase64} alt="Company Logo" className="w-full h-full object-contain" />
                            ) : (
                              <div className="text-center">
                                <Image className="w-8 h-8 text-slate-300 mx-auto" />
                                <span className="text-[9px] text-slate-400 font-bold block mt-1">No Logo</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="cursor-pointer inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition-all">
                              <Upload className="w-3.5 h-3.5 text-rose-400" />
                              <span>Upload Logo Image</span>
                              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                            </label>
                            {logoBase64 && (
                              <button
                                type="button"
                                onClick={() => setLogoBase64('')}
                                className="block text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                              >
                                Remove Logo
                              </button>
                            )}
                            <p className="text-[10px] text-slate-400 font-medium">PNG, JPG or WebP (Max 3MB). Appears at top left of invoices.</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Company / Business Name *</label>
                          <input
                            type="text"
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder="e.g. Mansara Foods Pvt. Ltd."
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                            <input
                              type="text"
                              value={phone}
                              onChange={e => setPhone(e.target.value)}
                              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                              placeholder="+91 98765 43210"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Contact Email</label>
                            <input
                              type="email"
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                              placeholder="info@mansarafoods.com"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: ADDRESS & TAX */}
                  {activeConfigTab === 'address' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN / Tax Registration No. *</label>
                        <input
                          type="text"
                          value={gstNumber}
                          onChange={e => setGstNumber(e.target.value.toUpperCase())}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-rose-500"
                          placeholder="e.g. 27AABCM1234F1Z5"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Street Address</label>
                        <textarea
                          rows={2}
                          value={address}
                          onChange={e => setAddress(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          placeholder="Full office address"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                          <input
                            type="text"
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder="e.g. Chennai"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                          <input
                            type="text"
                            value={state}
                            onChange={e => setState(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder="e.g. Tamil Nadu"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
                          <input
                            type="text"
                            value={pincode}
                            onChange={e => setPincode(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder="600077"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Place of Supply</label>
                        <input
                          type="text"
                          value={placeOfSupply}
                          onChange={e => setPlaceOfSupply(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          placeholder="e.g. Tamil Nadu (33)"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 3: NUMBERING & FORMAT */}
                  {activeConfigTab === 'numbering' && (
                    <div className="space-y-4">
                      <div className="bg-rose-50/50 border border-rose-150 p-4 rounded-2xl flex items-center space-x-3">
                        <div className="p-2 bg-rose-600 text-white rounded-xl shadow-sm">
                          <Hash className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-rose-900 uppercase">Live Format Preview</h4>
                          <p className="text-sm font-black font-mono text-rose-700 mt-0.5">{formattedInvoiceNoPreview}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Prefix</label>
                          <input
                            type="text"
                            value={invoicePrefix}
                            onChange={e => setInvoicePrefix(e.target.value.toUpperCase())}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder="e.g. MF-INV"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block">Prefix added before invoice counter</span>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Next Sequence Number</label>
                          <input
                            type="number"
                            value={nextSequenceNumber}
                            onChange={e => setNextSequenceNumber(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder="e.g. 38"
                          />
                          <span className="text-[10px] text-slate-400 mt-1 block">Number for next generated invoice</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: BANK DETAILS */}
                  {activeConfigTab === 'bank' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={bankName}
                          onChange={e => setBankName(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          placeholder="e.g. HDFC Bank Ltd."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
                          <input
                            type="text"
                            value={accountNo}
                            onChange={e => setAccountNo(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder="50200012345678"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                          <input
                            type="text"
                            value={ifscCode}
                            onChange={e => setIfscCode(e.target.value.toUpperCase())}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder="HDFC0001234"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name</label>
                          <input
                            type="text"
                            value={branch}
                            onChange={e => setBranch(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder="e.g. Anna Nagar Branch"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Account Type</label>
                          <select
                            value={accountType}
                            onChange={e => setAccountType(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          >
                            <option value="Current">Current Account</option>
                            <option value="Savings">Savings Account</option>
                            <option value="CC/OD">CC / Overdraft</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: TERMS & SIGNATORY */}
                  {activeConfigTab === 'terms' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Terms &amp; Conditions (One per line)</label>
                        <textarea
                          rows={4}
                          value={invoiceTerms}
                          onChange={e => setInvoiceTerms(e.target.value)}
                          className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          placeholder="1. Payment within 15 days&#10;2. Interest @ 2% per month on delay..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Authorised Signatory Name</label>
                          <input
                            type="text"
                            value={signatoryName}
                            onChange={e => setSignatoryName(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder="e.g. Mansara Foods Pvt. Ltd."
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Signatory Title</label>
                          <input
                            type="text"
                            value={signatoryTitle}
                            onChange={e => setSignatoryTitle(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                            placeholder="Authorised Signatory"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT: Live Interactive Preview Card */}
          <div className="w-full md:w-5/12 bg-slate-100 p-5 overflow-y-auto flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center space-x-1">
                  <Eye className="w-3 h-3 text-rose-600" />
                  <span>Live Print Preview</span>
                </span>
                <span className="text-[9px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  Real-time rendering
                </span>
              </div>

              {/* A4 Mini Simulated Card */}
              <div className="bg-white border border-slate-250 rounded-2xl p-4 shadow-lg text-[10px] space-y-3 font-sans">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div className="max-w-[55%]">
                    {logoBase64 ? (
                      <img src={logoBase64} alt="Logo" className="h-9 w-auto object-contain mb-1.5" />
                    ) : (
                      <div className="text-sm font-black text-rose-600 uppercase tracking-tight mb-1">{companyName || 'Mansara Foods'}</div>
                    )}
                    <div className="text-[9px] text-slate-600 leading-tight">
                      <p className="font-bold text-slate-800">{companyName}</p>
                      <p>{address}{city ? `, ${city}` : ''}</p>
                      <p>{state} - {pincode}</p>
                      <p className="font-bold text-slate-900 mt-0.5">GSTIN: {gstNumber || '27AABCM1234F1Z5'}</p>
                    </div>
                  </div>
                  <div className="text-right border-l border-slate-100 pl-3">
                    <span className="text-[9px] font-black bg-rose-600 text-white px-2 py-0.5 rounded uppercase">TAX INVOICE</span>
                    <p className="text-[11px] font-black font-mono text-slate-900 mt-1">{formattedInvoiceNoPreview}</p>
                    <p className="text-[9px] text-slate-400">Date: {new Date().toLocaleDateString('en-IN')}</p>
                    <p className="text-[9px] text-slate-500 font-bold mt-1">POS: {placeOfSupply}</p>
                  </div>
                </div>

                {/* Items Dummy Snippet */}
                <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                  <div className="flex justify-between font-bold text-[9px] text-slate-500 uppercase border-b border-slate-200 pb-1 mb-1">
                    <span>Item</span>
                    <span>Qty</span>
                    <span>Amount</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-800 text-[9.5px]">
                    <span>Sample Product Pack</span>
                    <span>10 CTN</span>
                    <span>₹4,384.80</span>
                  </div>
                </div>

                {/* Bank & Terms Preview */}
                <div className="grid grid-cols-2 gap-2 text-[8.5px] border-t border-slate-200 pt-2">
                  <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-150">
                    <p className="font-black text-slate-700 uppercase mb-0.5">Bank Details</p>
                    <p className="font-bold text-slate-900">{bankName || 'Bank Name'}</p>
                    <p>A/C: {accountNo || 'XXXXXXXX1234'}</p>
                    <p>IFSC: {ifscCode || 'HDFC0001234'}</p>
                  </div>
                  <div className="bg-slate-50/80 p-2 rounded-lg border border-slate-150 flex flex-col justify-between">
                    <div>
                      <p className="font-black text-slate-700 uppercase mb-0.5">Terms</p>
                      <p className="text-[8px] text-slate-600 truncate">{invoiceTerms.split('\n')[0] || 'Standard Invoice Terms'}</p>
                    </div>
                    <div className="text-right mt-1 pt-1 border-t border-slate-200">
                      <p className="font-bold text-rose-600 text-[8px]">For {signatoryName || companyName}</p>
                      <p className="text-[7.5px] text-slate-500">{signatoryTitle}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl border border-slate-250 transition-all cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                className="flex-1 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold py-2.5 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer text-xs flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Configuration</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditInvoiceModal({ isOpen, invoice, onClose, onInvoiceUpdated }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [invoiceNo, setInvoiceNo] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState('GENERATED');
  const [notes, setNotes] = useState('');
  const [isGstEnabled, setIsGstEnabled] = useState(true);
  const [shippingCharges, setShippingCharges] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);

  useEffect(() => {
    if (invoice && isOpen) {
      setInvoiceNo(invoice.invoiceNo || '');
      setCreatedAt(invoice.createdAt ? new Date(invoice.createdAt).toISOString().split('T')[0] : '');
      setDueDate(invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '');
      setStatus(invoice.status || 'GENERATED');
      setNotes(invoice.notes || '');
      setIsGstEnabled(invoice.isGstEnabled !== false);
      setShippingCharges(invoice.shippingCharges || 0);
      setTotalDiscount(invoice.totalDiscount || 0);
      setError('');
    }
  }, [invoice, isOpen]);

  if (!isOpen || !invoice) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!invoiceNo.trim()) {
      setError('Invoice number cannot be empty.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await axios.put(`/billing/${invoice.id}`, {
        invoiceNo: invoiceNo.trim(),
        createdAt: createdAt ? new Date(createdAt).toISOString() : undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        status,
        notes,
        isGstEnabled,
        shippingCharges: parseFloat(shippingCharges) || 0,
        totalDiscount: parseFloat(totalDiscount) || 0
      });

      if (res.data.success) {
        if (onInvoiceUpdated) onInvoiceUpdated();
        onClose();
      }
    } catch (err) {
      console.error('Update invoice error:', err);
      setError(err.response?.data?.message || 'Failed to update invoice details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden my-8 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-600/30 border border-rose-500/40 rounded-xl">
              <Pencil className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight uppercase">Edit Invoice Details</h3>
              <p className="text-[10px] text-slate-400 font-mono">ID: {invoice.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Invoice Number *</label>
              <input
                type="text"
                value={invoiceNo}
                onChange={e => setInvoiceNo(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="e.g. MF-INV-00008"
                required
              />
              <span className="text-[9px] text-slate-400 mt-0.5 block">e.g. Change MF-INV-00037 to MF-INV-00008</span>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="GENERATED">GENERATED</option>
                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
                <option value="PAID">PAID</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Invoice Date</label>
              <input
                type="date"
                value={createdAt}
                onChange={e => setCreatedAt(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Shipping (₹)</label>
              <input
                type="number"
                step="0.01"
                value={shippingCharges}
                onChange={e => setShippingCharges(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Discount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={totalDiscount}
                onChange={e => setTotalDiscount(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div className="flex flex-col justify-end pb-1">
              <label className="flex items-center space-x-2 cursor-pointer font-bold text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={isGstEnabled}
                  onChange={e => setIsGstEnabled(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <span>Enable GST</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Notes / Remarks</label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Internal remarks or payment reference..."
            />
          </div>

          <div className="pt-3 flex items-center space-x-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl transition-all cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl shadow-lg transition-all cursor-pointer text-xs flex items-center justify-center space-x-1.5 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating…</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Invoice</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminInvoiceLedger() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'transfers'

  // ── Invoice State ─────────────────────────────────────────────────────────
  const [invoices, setInvoices] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
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
  const [transfersLoading, setTransfersLoading] = useState(false);
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

  const [showConfigModal, setShowConfigModal] = useState(false);

  // ── KPI Summary ───────────────────────────────────────────────────────────
  const totalBilled = filteredInvoices.reduce((a, c) => a + (c.totalAmount || 0), 0);
  const totalCollected = filteredInvoices.filter(i => i.status === 'CLOSED' || i.status === 'PAID').reduce((a, c) => a + (c.totalAmount || 0), 0);
  const totalOutstanding = filteredInvoices.filter(i => i.status === 'OPEN').reduce((a, c) => a + (c.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Admin Ledger</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Master ledger for all invoices and stock transfer shipments across all dealer partners.
          </p>
        </div>
        <button
          onClick={() => setShowConfigModal(true)}
          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer self-start sm:self-auto"
        >
          <SlidersHorizontal className="w-4 h-4 text-white" />
          <span>Configure Invoice</span>
        </button>
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
                              {inv.invoiceType === 'ADVANCE' && (
                                <span className="text-[8px] font-black text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded uppercase">Advance</span>
                              )}
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
                            <button onClick={() => { setEditingInvoice(inv); setShowEditModal(true); }}
                              className="p-1.5 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-slate-800 cursor-pointer transition-colors" title="Edit Invoice Details">
                              <Pencil className="w-3.5 h-3.5 text-slate-600" />
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
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                  {selectedInvoice.invoiceType === 'ADVANCE' ? 'GST Advance Invoice Breakdown' : 'GST Tax Invoice Breakdown'}
                </h3>
                <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{selectedInvoice.invoiceNo}</span>
                <div className="flex items-center gap-2 mt-1.5">
                  <ChannelBadge channel={selectedInvoice.channel || 'B2B'} />
                  {selectedInvoice.invoiceType === 'ADVANCE' && (
                    <span className="text-[8px] font-black text-rose-700 bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded uppercase">Advance</span>
                  )}
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
                <button onClick={() => { setEditingInvoice(selectedInvoice); setShowDetailModal(false); setShowEditModal(true); }}
                  className="inline-flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer">
                  <Pencil className="w-3.5 h-3.5 text-slate-600" /><span>Edit Invoice</span>
                </button>
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

      {/* Invoice Configuration Modal */}
      <InvoiceConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onSettingsUpdated={fetchInvoices}
      />

      {/* Edit Invoice Modal */}
      <EditInvoiceModal
        isOpen={showEditModal}
        invoice={editingInvoice}
        onClose={() => setShowEditModal(false)}
        onInvoiceUpdated={fetchInvoices}
      />
    </div>
  );
}
