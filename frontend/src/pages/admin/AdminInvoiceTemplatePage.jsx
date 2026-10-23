// src/pages/admin/AdminInvoiceTemplatePage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FileText,
  SlidersHorizontal,
  Save,
  RotateCcw,
  Building2,
  MapPin,
  Receipt,
  CreditCard,
  FileCheck,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  Hash
} from 'lucide-react';
import { Link } from 'react-router-dom';

const OFFICIAL_DEFAULTS = {
  companyName: 'Mansara Foods Pvt. Ltd.',
  logoBase64: '',
  gstNumber: '27AABCM1234F1Z5',
  address: 'Flat No. B4, No.13, Balaji Nagar 1st street extn, Noombal',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600077',
  phone: '+91-88388 87064',
  email: 'contact@mansarafoods.com',
  invoicePrefix: 'MF-INV',
  nextSequenceNumber: 11,
  placeOfSupply: 'Tamil Nadu (33)',
  invoiceTerms: '1. Payment within 15 days from delivery.\n2. Interest @ 2% per month on overdue payment.\n3. Goods once sold cannot be returned unless transit damage is reported upon receipt.',
  bankDetails: {
    bankName: '',
    accountNo: '',
    ifscCode: '',
    branch: '',
    accountType: 'Current'
  },
  signatoryTitle: 'Authorised Signatory',
  signatoryName: 'Mansara Foods Pvt. Ltd.'
};

export default function AdminInvoiceTemplatePage() {
  const [activeTab, setActiveTab] = useState('branding'); // branding | address | tax_numbering | bank | terms
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form State
  const [companyName, setCompanyName] = useState(OFFICIAL_DEFAULTS.companyName);
  const [logoBase64, setLogoBase64] = useState('');
  const [gstNumber, setGstNumber] = useState(OFFICIAL_DEFAULTS.gstNumber);
  const [address, setAddress] = useState(OFFICIAL_DEFAULTS.address);
  const [city, setCity] = useState(OFFICIAL_DEFAULTS.city);
  const [state, setState] = useState(OFFICIAL_DEFAULTS.state);
  const [pincode, setPincode] = useState(OFFICIAL_DEFAULTS.pincode);
  const [phone, setPhone] = useState(OFFICIAL_DEFAULTS.phone);
  const [email, setEmail] = useState(OFFICIAL_DEFAULTS.email);
  const [invoicePrefix, setInvoicePrefix] = useState(OFFICIAL_DEFAULTS.invoicePrefix);
  const [nextSequenceNumber, setNextSequenceNumber] = useState(OFFICIAL_DEFAULTS.nextSequenceNumber);
  const [placeOfSupply, setPlaceOfSupply] = useState(OFFICIAL_DEFAULTS.placeOfSupply);
  const [invoiceTerms, setInvoiceTerms] = useState(OFFICIAL_DEFAULTS.invoiceTerms);
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branch, setBranch] = useState('');
  const [accountType, setAccountType] = useState('Current');
  const [signatoryTitle, setSignatoryTitle] = useState(OFFICIAL_DEFAULTS.signatoryTitle);
  const [signatoryName, setSignatoryName] = useState(OFFICIAL_DEFAULTS.signatoryName);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
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
        if (s.city !== undefined) setCity(s.city || '');
        if (s.state !== undefined) setState(s.state || 'Tamil Nadu');
        if (s.pincode !== undefined) setPincode(s.pincode || '600077');
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
      console.error('Failed to load settings:', err);
      setMessage({ text: 'Failed to load existing invoice template settings.', type: 'error' });
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

  const handleResetDefaults = () => {
    if (!window.confirm('Reset all fields to official Mansara Foods registered office defaults?')) return;
    setCompanyName(OFFICIAL_DEFAULTS.companyName);
    setAddress(OFFICIAL_DEFAULTS.address);
    setCity(OFFICIAL_DEFAULTS.city);
    setState(OFFICIAL_DEFAULTS.state);
    setPincode(OFFICIAL_DEFAULTS.pincode);
    setPhone(OFFICIAL_DEFAULTS.phone);
    setEmail(OFFICIAL_DEFAULTS.email);
    setGstNumber(OFFICIAL_DEFAULTS.gstNumber);
    setInvoicePrefix(OFFICIAL_DEFAULTS.invoicePrefix);
    setPlaceOfSupply(OFFICIAL_DEFAULTS.placeOfSupply);
    setInvoiceTerms(OFFICIAL_DEFAULTS.invoiceTerms);
    setSignatoryTitle(OFFICIAL_DEFAULTS.signatoryTitle);
    setSignatoryName(OFFICIAL_DEFAULTS.signatoryName);
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
        setMessage({ text: 'Invoice template configuration saved successfully! All generated invoices will reflect these details.', type: 'success' });
      }
    } catch (err) {
      console.error('Save error:', err);
      setMessage({ text: err.response?.data?.message || 'Failed to update invoice configuration.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Address line preview builder
  const addrParts = [];
  if (address) addrParts.push(address.trim().replace(/,\s*$/, ''));
  if (city && !address?.includes(city)) addrParts.push(city.trim());
  if (state && !address?.includes(state)) {
    if (pincode && !address?.includes(pincode)) {
      addrParts.push(`${state.trim()} - ${pincode.trim()}`);
    } else {
      addrParts.push(state.trim());
    }
  } else if (pincode && !address?.includes(pincode)) {
    addrParts.push(pincode.trim());
  }
  const formattedAddressPreview = addrParts.join(', ') + (addrParts.length ? '. India.' : '');
  const formattedInvoiceNoPreview = `${invoicePrefix || 'MF-INV'}-${String(nextSequenceNumber || 1).padStart(5, '0')}`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
            <Link to="/admin/invoice-ledger" className="hover:text-slate-600 transition-colors">Admin Ledger</Link>
            <span>/</span>
            <span className="text-slate-600 font-bold">Invoice Template Studio</span>
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
            <SlidersHorizontal className="w-5 h-5 text-rose-600" />
            <span>Invoice Template & Company Profile</span>
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Configure company branding, registered office address, GST, and default invoice rules that reflect across all bills and PDFs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
            title="Reset to official Mansara Foods registered office in Chennai"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-white" />
            <span>{saving ? 'Saving Changes…' : 'Save Template'}</span>
          </button>
        </div>
      </div>

      {/* Alert / Feedback message */}
      {message.text && (
        <div className={`p-4 rounded-2xl flex items-center space-x-3 text-xs font-semibold ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Grid: Left Editor & Right Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── Left Editor Form (7 cols) ── */}
        <div className="lg:col-span-7 bg-white border border-slate-150 rounded-3xl shadow-sm overflow-hidden flex flex-col">
          {/* Subtabs Header */}
          <div className="flex border-b border-slate-200 bg-slate-50/60 overflow-x-auto text-xs font-bold text-slate-500">
            <button
              onClick={() => setActiveTab('branding')}
              className={`px-4 py-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'branding' ? 'border-rose-600 text-rose-700 bg-white' : 'border-transparent hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Branding</span>
            </button>
            <button
              onClick={() => setActiveTab('address')}
              className={`px-4 py-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'address' ? 'border-rose-600 text-rose-700 bg-white' : 'border-transparent hover:text-slate-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Address & Contact</span>
            </button>
            <button
              onClick={() => setActiveTab('tax_numbering')}
              className={`px-4 py-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'tax_numbering' ? 'border-rose-600 text-rose-700 bg-white' : 'border-transparent hover:text-slate-800'
              }`}
            >
              <Hash className="w-4 h-4" />
              <span>GST & Numbering</span>
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`px-4 py-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'bank' ? 'border-rose-600 text-rose-700 bg-white' : 'border-transparent hover:text-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Bank Details</span>
            </button>
            <button
              onClick={() => setActiveTab('terms')}
              className={`px-4 py-3 border-b-2 flex items-center space-x-1.5 whitespace-nowrap transition-all cursor-pointer ${
                activeTab === 'terms' ? 'border-rose-600 text-rose-700 bg-white' : 'border-transparent hover:text-slate-800'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Terms & Signatory</span>
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-5">
            {/* 1. BRANDING TAB */}
            {activeTab === 'branding' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Legal Name *</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    placeholder="e.g. Mansara Foods Pvt. Ltd."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">This official name will be printed at the top of every generated Tax Invoice & Delivery agreement.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Logo</label>
                  <div className="flex items-center space-x-4 border border-dashed border-slate-250 p-4 rounded-2xl bg-slate-50/50">
                    <div className="h-16 w-32 border border-slate-200 rounded-xl bg-white flex items-center justify-center p-2 overflow-hidden shadow-xs">
                      {logoBase64 ? (
                        <img src={logoBase64} alt="Company Logo" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase text-center">Mansara Foods Default</span>
                      )}
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[11px] rounded-lg shadow-xs cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5 text-rose-600" />
                        <span>Upload Custom Logo</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                      {logoBase64 && (
                        <button
                          type="button"
                          onClick={() => setLogoBase64('')}
                          className="block text-[10px] text-rose-600 hover:underline font-semibold"
                        >
                          Remove custom logo & use default
                        </button>
                      )}
                      <p className="text-[10px] text-slate-400">PNG or JPG up to 3MB. Recommended size: 300x120px transparent background.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ADDRESS & CONTACT TAB */}
            {activeTab === 'address' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Registered Office & Operations Address *</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="e.g. Flat No. B4, No.13, Balaji Nagar 1st street extn, Noombal"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Chennai"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Tamil Nadu"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">PIN Code</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 600077"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Official Contact Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91-88388 87064"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Official Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. contact@mansarafoods.com"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. GST & NUMBERING TAB */}
            {activeTab === 'tax_numbering' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN Number *</label>
                    <input
                      type="text"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. 27AABCM1234F1Z5"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold uppercase font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Place of Supply (POS)</label>
                    <input
                      type="text"
                      value={placeOfSupply}
                      onChange={(e) => setPlaceOfSupply(e.target.value)}
                      placeholder="e.g. Tamil Nadu (33)"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">Invoice Numbering Scheme</span>
                    <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                      Sequential
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Series Prefix</label>
                      <input
                        type="text"
                        value={invoicePrefix}
                        onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase())}
                        placeholder="e.g. MF-INV"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Next Sequence Counter</label>
                      <input
                        type="number"
                        min="1"
                        value={nextSequenceNumber}
                        onChange={(e) => setNextSequenceNumber(e.target.value)}
                        placeholder="e.g. 11"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/80">
                    <span className="text-slate-500">Next Generated Invoice Will Be:</span>
                    <span className="font-mono font-black text-rose-700 bg-white px-2 py-0.5 rounded border border-slate-250">
                      {formattedInvoiceNoPreview}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. BANK DETAILS TAB */}
            {activeTab === 'bank' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      placeholder="e.g. 50200012345678"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                      placeholder="e.g. HDFC0001234"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name</label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="e.g. Noombal Branch"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Account Type</label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold"
                    >
                      <option value="Current">Current</option>
                      <option value="Savings">Savings</option>
                      <option value="CC/OD">Cash Credit / OD</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 5. TERMS & SIGNATORY TAB */}
            {activeTab === 'terms' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Signatory Title</label>
                    <input
                      type="text"
                      value={signatoryTitle}
                      onChange={(e) => setSignatoryTitle(e.target.value)}
                      placeholder="e.g. Authorised Signatory"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Signatory / Entity Name</label>
                    <input
                      type="text"
                      value={signatoryName}
                      onChange={(e) => setSignatoryName(e.target.value)}
                      placeholder="e.g. Mansara Foods Pvt. Ltd."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Standard Terms & Conditions (One rule per line)</label>
                  <textarea
                    rows={4}
                    value={invoiceTerms}
                    onChange={(e) => setInvoiceTerms(e.target.value)}
                    placeholder="1. Payment within 15 days...&#10;2. Interest @ 2%...&#10;3. Goods once sold..."
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-medium font-sans leading-relaxed"
                  />
                </div>
              </div>
            )}

            {/* Save Button Row */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Settings save to database singleton and update all PDF generators immediately.</span>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-white" />
                <span>{saving ? 'Saving...' : 'Save Template Configuration'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* ── Right Side: Live A4 Invoice Simulation Card (5 cols) ── */}
        <div className="lg:col-span-5 sticky top-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
            <span className="flex items-center space-x-1.5">
              <Eye className="w-4 h-4 text-rose-600" />
              <span>Live A4 Invoice Preview</span>
            </span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-black uppercase">
              Realtime Sync
            </span>
          </div>

          {/* Exact Simulated A4 Invoice Container */}
          <div className="bg-white border-2 border-slate-250 rounded-2xl p-5 shadow-xl text-[10.5px] font-sans space-y-3">
            {/* Header Row */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div className="flex items-start space-x-3 max-w-[62%]">
                <div className="w-16 h-12 flex items-center justify-center shrink-0 border border-slate-150 rounded-lg p-1 bg-slate-50">
                  {logoBase64 ? (
                    <img src={logoBase64} alt="Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <div className="text-[9px] font-black text-amber-500 uppercase leading-none text-center">MANSARA FOODS</div>
                  )}
                </div>
                <div className="leading-tight">
                  <h4 className="text-[13px] font-black text-[#D6295A] uppercase tracking-tight">{companyName || 'Mansara Foods Pvt. Ltd.'}</h4>
                  <p className="text-[9.5px] text-slate-600 mt-0.5 leading-snug">{formattedAddressPreview}</p>
                  <p className="text-[9px] text-slate-700 font-bold mt-0.5">Phone : {phone || '+91-88388 87064'}</p>
                  <p className="text-[9px] font-bold text-slate-900 mt-0.5">GST No. {gstNumber || '27AABCM1234F1Z5'}</p>
                </div>
              </div>

              {/* Meta Right Cell */}
              <div className="text-right border-l border-slate-200 pl-3">
                <span className="text-[9px] font-black bg-[#D6295A] text-white px-2 py-0.5 rounded uppercase">TAX INVOICE</span>
                <p className="text-[11px] font-black font-mono text-slate-900 mt-1">{formattedInvoiceNoPreview}</p>
                <p className="text-[9px] text-slate-400">Date : {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</p>
                <p className="text-[9px] text-slate-400">Due : {new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</p>
                <p className="text-[9px] text-slate-700 font-bold mt-1">POS : {placeOfSupply}</p>
              </div>
            </div>

            {/* Bill To & Ship To preview */}
            <div className="grid grid-cols-2 gap-3 text-[9.5px] border-b border-slate-200 pb-2.5">
              <div className="border-r border-slate-100 pr-2">
                <div className="bg-[#D6295A] text-white text-[8px] font-black px-1.5 py-0.5 uppercase mb-1 rounded-xs">Bill To</div>
                <p className="font-bold text-slate-800">A3 EXPRESS CARGO</p>
                <p className="text-slate-500 text-[8.5px]">Chennai Warehouse Hub, Tamil Nadu</p>
                <p className="text-slate-600 font-semibold text-[8.5px]">GSTIN: 33AAAAA0000A1Z5</p>
              </div>
              <div>
                <div className="bg-[#D6295A] text-white text-[8px] font-black px-1.5 py-0.5 uppercase mb-1 rounded-xs">Ship To</div>
                <p className="font-bold text-slate-800">A3 EXPRESS CARGO</p>
                <p className="text-slate-500 text-[8.5px]">Chennai Warehouse Hub, Tamil Nadu</p>
              </div>
            </div>

            {/* Simulated Line Items Table */}
            <div className="bg-slate-50/70 rounded-xl border border-slate-200 overflow-hidden text-[9px]">
              <div className="grid grid-cols-12 bg-[#D6295A] text-white font-bold p-1.5 uppercase tracking-wide text-[8px]">
                <div className="col-span-1 text-center">S.No</div>
                <div className="col-span-5">Product Pack</div>
                <div className="col-span-2 text-center">Net Wt</div>
                <div className="col-span-2 text-right">Rate</div>
                <div className="col-span-2 text-right pr-1">Total</div>
              </div>
              <div className="grid grid-cols-12 p-1.5 font-medium text-slate-700 border-b border-slate-150">
                <div className="col-span-1 text-center text-slate-400">1</div>
                <div className="col-span-5 font-bold text-slate-800">Urad Health Mix (Classic)</div>
                <div className="col-span-2 text-center">250g</div>
                <div className="col-span-2 text-right">₹150.00</div>
                <div className="col-span-2 text-right font-bold text-slate-900 pr-1">₹3,600.00</div>
              </div>
              <div className="grid grid-cols-12 p-1.5 font-medium text-slate-700">
                <div className="col-span-1 text-center text-slate-400">2</div>
                <div className="col-span-5 font-bold text-slate-800">Moringa Millet Noodles</div>
                <div className="col-span-2 text-center">180g</div>
                <div className="col-span-2 text-right">₹95.00</div>
                <div className="col-span-2 text-right font-bold text-slate-900 pr-1">₹2,280.00</div>
              </div>
            </div>

            {/* Totals Preview */}
            <div className="flex justify-end pt-1">
              <div className="w-56 text-[9.5px] space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">₹5,880.00</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>CGST (2.5%) + SGST (2.5%):</span>
                  <span className="font-semibold">₹294.00</span>
                </div>
                <div className="flex justify-between bg-[#D6295A] text-white p-1 rounded font-bold text-[10px]">
                  <span>Amount Payable:</span>
                  <span>₹6,174.00</span>
                </div>
              </div>
            </div>

            {/* Bank & Terms */}
            <div className="grid grid-cols-2 gap-2 text-[8px] border-t border-slate-200 pt-2">
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-150 space-y-0.5">
                <p className="font-black text-slate-800 uppercase">Bank Coordinates</p>
                <p className="font-bold text-slate-900">{bankName || 'HDFC Bank Ltd.'}</p>
                <p>A/C: {accountNo || '50200012345678'}</p>
                <p>IFSC: {ifscCode || 'HDFC0001234'}</p>
                <p>Branch: {branch || 'Chennai Central'} ({accountType})</p>
              </div>
              <div className="bg-slate-50 p-2 rounded-lg border border-slate-150 flex flex-col justify-between">
                <div>
                  <p className="font-black text-slate-800 uppercase">Terms & Conditions</p>
                  <p className="text-slate-600 line-clamp-2 mt-0.5">{invoiceTerms.split('\n')[0]}</p>
                </div>
                <div className="text-right mt-1 pt-1 border-t border-slate-200">
                  <p className="font-bold text-[#D6295A] text-[8.5px]">For {signatoryName || companyName}</p>
                  <p className="text-[7.5px] text-slate-500">{signatoryTitle}</p>
                </div>
              </div>
            </div>

            {/* Footer Strip */}
            <div className="text-[7.5px] text-center text-slate-400 border-t border-slate-150 pt-2">
              Regd. Office &amp; Operations : {formattedAddressPreview} | CIN- U10790TN2026PTC188398 | Email: {email}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
