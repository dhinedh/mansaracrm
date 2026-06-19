// src/pages/dealer/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import {
  User, Building, Phone, MapPin, Upload, Image as ImageIcon, Trash2,
  CreditCard, FileText, Eye, CheckCircle, ChevronDown, ChevronUp
} from 'lucide-react';

export default function ProfilePage() {
  const { user, fetchCurrentUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showPreview, setShowPreview] = useState(false);

  // Profile fields
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [logoBase64, setLogoBase64] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('');

  // Bank details
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [branch, setBranch] = useState('');
  const [accountType, setAccountType] = useState('Current');

  // Invoice terms
  const [invoiceTerms, setInvoiceTerms] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCompanyName(user.dealer?.companyName || '');
      setPhone(user.dealer?.phone || '');
      setAddress(user.dealer?.address || '');
      setCity(user.dealer?.city || '');
      setState(user.dealer?.state || '');
      setPincode(user.dealer?.pincode || '');
      setLogoBase64(user.dealer?.logoBase64 || '');
      setInvoicePrefix(user.dealer?.invoicePrefix || '');
      // Bank Details
      const bd = user.dealer?.bankDetails || {};
      setBankName(bd.bankName || '');
      setAccountNo(bd.accountNo || '');
      setIfscCode(bd.ifscCode || '');
      setBranch(bd.branch || '');
      setAccountType(bd.accountType || 'Current');
      // Invoice Terms
      setInvoiceTerms(user.dealer?.invoiceTerms || '');
    }
  }, [user]);

  // Handle Logo Upload
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setLogoBase64(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => setLogoBase64('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    try {
      await axios.put('/dealers/profile/update', {
        name,
        companyName,
        phone,
        address,
        city,
        state,
        pincode,
        logoBase64,
        bankDetails: { bankName, accountNo, ifscCode, branch, accountType },
        invoiceTerms,
        invoicePrefix
      });
      setMessage({ text: '✓ Billing profile and invoice template updated successfully!', type: 'success' });
      await fetchCurrentUser();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update billing profile.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const hasBankDetails = bankName || accountNo || ifscCode;
  const effectiveTerms = invoiceTerms ||
    '1. Goods once sold will not be taken back.\n2. Interest at 18% p.a. will be charged for delayed payments after due date.';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Billing Profile &amp; Invoice Template</h2>
        <p className="text-slate-500 text-xs mt-0.5">
          Configure your distributor billing identity, invoice logo, bank payment details, and custom terms — all of which appear on your printed invoices.
        </p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
            : 'bg-rose-50 text-rose-800 border border-rose-100'
        }`}>
          {message.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Live Preview Toggle */}
      <button
        type="button"
        onClick={() => setShowPreview(v => !v)}
        className="flex items-center space-x-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 px-4 py-2.5 rounded-xl hover:bg-rose-100 transition-all cursor-pointer"
      >
        <Eye className="w-4 h-4" />
        <span>{showPreview ? 'Hide' : 'Preview'} Invoice Template</span>
        {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {/* ─── Live Invoice Preview ─────────────────────────────────────── */}
      {showPreview && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center space-x-2">
            <Eye className="w-3 h-3" />
            <span>Invoice Template Preview — This is how your invoice header and footer will look</span>
          </div>
          <div className="p-6 font-sans text-xs text-slate-700">
            {/* Invoice header */}
            <div className="flex justify-between items-start mb-4 pb-4 border-b-2 border-rose-600">
              <div className="flex flex-col space-y-1">
                {logoBase64 ? (
                  <img src={logoBase64} alt="Logo" className="h-12 w-auto object-contain mb-1" />
                ) : (
                  <div className="text-xl font-black text-rose-600 uppercase tracking-wide">
                    {companyName || 'Your Company Name'}
                  </div>
                )}
                <div className="text-[10px] text-rose-800 space-y-0.5">
                  <div><span className="font-bold">GSTIN:</span> {user?.dealer?.gstNumber || 'N/A'}</div>
                  <div><span className="font-bold">Tel:</span> {phone || 'Phone Number'}</div>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-black text-rose-600 tracking-widest">TAX INVOICE</h2>
                <div className="text-[10px] text-slate-600 mt-1 space-y-0.5">
                  <div><span className="font-bold text-rose-800">Invoice No:</span> {invoicePrefix ? `${invoicePrefix}-00001` : 'MF-INV-00001'}</div>
                  <div><span className="font-bold text-rose-800">Date:</span> {new Date().toLocaleDateString('en-IN')}</div>
                </div>
              </div>
            </div>

            {/* Billed By / To */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <div className="text-[9px] font-black uppercase text-rose-600 tracking-wider border-b border-dashed border-rose-200 pb-1 mb-1.5">Billed By (Distributor)</div>
                <div className="font-bold text-slate-800">{companyName || 'Your Company Name'}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{address || '123, Sample Street'}</div>
                <div className="text-[10px] text-slate-500">{[city, state, pincode].filter(Boolean).join(', ') || 'City, State - 600001'}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  <span className="font-bold text-rose-800">GSTIN:</span> {user?.dealer?.gstNumber || 'N/A'}
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <div className="text-[9px] font-black uppercase text-rose-600 tracking-wider border-b border-dashed border-rose-200 pb-1 mb-1.5">Billed To (Customer Store)</div>
                <div className="font-bold text-slate-800">Customer Store Name</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Store Address, City</div>
                <div className="text-[10px] text-slate-500">GSTIN: 29XXXXX1234X1Z5</div>
              </div>
            </div>

            {/* Sample Items Row */}
            <table className="w-full border-collapse mb-4 text-[10px]">
              <thead>
                <tr className="bg-rose-600 text-white">
                  <th className="p-2 text-center">#</th>
                  <th className="p-2 text-left">Product Details</th>
                  <th className="p-2 text-center">Qty</th>
                  <th className="p-2 text-right">Base Price</th>
                  <th className="p-2 text-center">Margin</th>
                  <th className="p-2 text-right">SP</th>
                  <th className="p-2 text-center">GST%</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="p-2 text-center text-rose-600">1</td>
                  <td className="p-2">
                    <div className="font-bold">Sample Product Name</div>
                    <div className="text-[9px] text-rose-700">SKU: PROD-001 | HSN: 1901</div>
                  </td>
                  <td className="p-2 text-center font-bold">10 PCS</td>
                  <td className="p-2 text-right">₹100.00</td>
                  <td className="p-2 text-center text-rose-600 font-bold">10%</td>
                  <td className="p-2 text-right font-bold">₹110.00</td>
                  <td className="p-2 text-center">5%</td>
                  <td className="p-2 text-right font-black text-rose-700">₹1,155.00</td>
                </tr>
              </tbody>
            </table>

            {/* Footer: Bank + Terms */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-slate-100">
              <div>
                {hasBankDetails ? (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <div className="text-[9px] font-black uppercase text-rose-600 tracking-wider border-b border-dashed border-rose-200 pb-1 mb-1.5">Bank Details for Payment</div>
                    <table className="w-full text-[10px] text-slate-700">
                      {bankName && <tr><td className="font-bold text-rose-800 pr-2 py-0.5">Bank Name:</td><td>{bankName}</td></tr>}
                      {accountNo && <tr><td className="font-bold text-rose-800 pr-2 py-0.5">Account No:</td><td className="font-black">{accountNo}</td></tr>}
                      {ifscCode && <tr><td className="font-bold text-rose-800 pr-2 py-0.5">IFSC Code:</td><td className="font-black">{ifscCode}</td></tr>}
                      {branch && <tr><td className="font-bold text-rose-800 pr-2 py-0.5">Branch:</td><td>{branch}</td></tr>}
                      {accountType && <tr><td className="font-bold text-rose-800 pr-2 py-0.5">Acc. Type:</td><td>{accountType}</td></tr>}
                    </table>
                  </div>
                ) : (
                  <div className="h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center p-3 text-center">
                    <div>
                      <CreditCard className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                      <p className="text-[9px] text-slate-400 font-medium">Fill bank details below to show payment info on invoice</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 border-l-2 border-rose-500 pl-3 py-2 pr-2 rounded-r-xl">
                <div className="text-[9px] font-black uppercase text-rose-600 tracking-wider mb-1">Terms &amp; Conditions</div>
                <div className="text-[10px] text-slate-600 leading-relaxed whitespace-pre-line">
                  {effectiveTerms}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Form ───────────────────────────────────────────────── */}
      <form onSubmit={handleUpdateProfile} className="space-y-6">
        
        {/* Row 1: Logo + Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Logo Upload */}
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Custom Invoice Logo
            </h3>
            <div className="aspect-[3/1.5] w-full bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group">
              {logoBase64 ? (
                <>
                  <img src={logoBase64} alt="Custom Logo" className="object-contain w-full h-full p-2" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <label className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </label>
                    <button type="button" onClick={handleRemoveLogo}
                      className="p-2 bg-rose-600 hover:bg-rose-700 rounded-lg text-white cursor-pointer transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <label className="flex flex-col items-center justify-center space-y-1.5 cursor-pointer text-slate-400 hover:text-slate-500 py-6 w-full h-full">
                  <ImageIcon className="w-8 h-8 stroke-[1.5]" />
                  <span className="text-[10px] font-bold">Upload Logo</span>
                  <span className="text-[9px] text-slate-400">PNG / JPG up to 2MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
              )}
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Your logo appears in the top-left of every invoice header. If empty, company name is shown as text.
            </p>
          </div>

          {/* Basic Info */}
          <div className="md:col-span-2 bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-2">
              <Building className="w-3.5 h-3.5 text-rose-600" />
              <span>Distributor Identity</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-500 font-bold">Authorized Partner Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" required value={name} onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-slate-500 font-bold">Billing Company Name *</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none font-bold" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-slate-500 font-bold">Billing Phone / Contact *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" required value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-slate-400 font-bold">GSTIN Registration (Admin Managed)</label>
                <input type="text" disabled value={user?.dealer?.gstNumber || 'Not Registered'}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed font-semibold" />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-500 font-bold">Invoice Number Prefix (e.g. RK-INV)</label>
                <input type="text" maxLength={12} placeholder="e.g. RK-INV" value={invoicePrefix}
                  onChange={e => setInvoicePrefix(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none uppercase" />
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <label className="block text-slate-500 font-bold">Official Billing Address *</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-4" />
                <textarea required rows="2" value={address} onChange={e => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              {[['City', city, setCity], ['State', state, setState], ['Pincode', pincode, setPincode]].map(([label, val, setter]) => (
                <div key={label} className="space-y-1">
                  <label className="block text-slate-500 font-bold">{label}</label>
                  <input type="text" value={val} onChange={e => setter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Bank Details + Invoice Terms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Bank Details */}
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-2">
              <CreditCard className="w-3.5 h-3.5 text-rose-600" />
              <span>Bank Details for Invoice Payment</span>
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed -mt-2">
              These details print on every invoice footer, making it easy for customers to make payments directly.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-500 font-bold">Bank Name</label>
                <input type="text" placeholder="e.g. State Bank of India" value={bankName} onChange={e => setBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-500 font-bold">Account Number</label>
                <input type="text" placeholder="e.g. 1234567890" value={accountNo} onChange={e => setAccountNo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none font-mono" />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-500 font-bold">IFSC Code</label>
                <input type="text" placeholder="e.g. SBIN0001234" value={ifscCode}
                  onChange={e => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none font-mono uppercase" />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-500 font-bold">Branch</label>
                <input type="text" placeholder="e.g. Anna Nagar Branch" value={branch} onChange={e => setBranch(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="block text-slate-500 font-bold">Account Type</label>
                <select value={accountType} onChange={e => setAccountType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none">
                  <option value="Current">Current Account</option>
                  <option value="Savings">Savings Account</option>
                  <option value="OD">Overdraft (OD)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Invoice Terms */}
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center space-x-2">
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>Custom Invoice Terms &amp; Conditions</span>
            </h3>
            <p className="text-[10px] text-slate-400 leading-relaxed -mt-2">
              Enter your custom T&amp;C text below. These replace the default terms on all your invoices. Each line will appear as a separate point.
            </p>
            <textarea
              rows="8"
              placeholder={`1. Goods once sold will not be taken back.\n2. Interest at 18% p.a. will be charged for delayed payments after due date.\n3. All disputes subject to local jurisdiction.`}
              value={invoiceTerms}
              onChange={e => setInvoiceTerms(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none text-xs resize-none leading-relaxed"
            />
            <p className="text-[9px] text-slate-400">
              Leave blank to use default terms. Use new lines to separate each clause.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button type="submit" disabled={loading}
            className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-8 py-3 rounded-xl shadow-lg shadow-rose-100 transition-all cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed">
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Profile Changes...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Save All Changes &amp; Update Invoice Template</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
