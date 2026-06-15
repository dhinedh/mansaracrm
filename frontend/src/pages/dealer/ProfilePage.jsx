// src/pages/dealer/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { User, Building, Phone, MapPin, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, fetchCurrentUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Fields
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [logoBase64, setLogoBase64] = useState('');

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
    }
  }, [user]);

  // Handle Logo Upload (base64)
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoBase64('');
  };

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
        logoBase64
      });
      
      setMessage({ text: 'Billing profile and invoice template updated successfully!', type: 'success' });
      await fetchCurrentUser();
    } catch (err) {
      console.error(err);
      setMessage({ text: err.response?.data?.message || 'Failed to update billing profile.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Billing Profile & Invoice Template</h2>
        <p className="text-slate-500 text-xs">Configure your distributor billing identity, custom invoice logo, and template layout settings.</p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
            : 'bg-rose-50 text-rose-800 border border-rose-100'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: Logo & Branding Preview */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm text-center space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider text-left border-b border-slate-100 pb-2">Custom Invoice Logo</h3>
            
            <div className="aspect-[3/1.5] w-full bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group">
              {logoBase64 ? (
                <>
                  <img src={logoBase64} alt="Custom Logo" className="object-contain w-full h-full p-2" />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    <label className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="p-2 bg-rose-600 hover:bg-rose-700 rounded-lg text-white cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <label className="flex flex-col items-center justify-center space-y-1.5 cursor-pointer text-slate-405 hover:text-slate-500 py-6 w-full h-full">
                  <ImageIcon className="w-8 h-8 stroke-[1.5]" />
                  <span className="text-[10px] font-bold">Upload Logo (Base64)</span>
                  <span className="text-[9px] text-slate-400">PNG / JPG up to 2MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                </label>
              )}
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed text-left">
              * Uploading a logo enables your custom retail invoice template layout. If left empty, invoices will display your company name as text branding.
            </p>
          </div>
        </div>

        {/* Right Column: Billing Information Form */}
        <div className="md:col-span-2 bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-6">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Distributor Profile Settings</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* User details */}
            <div className="space-y-1">
              <label className="block text-slate-500 font-bold">Authorized Partner Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            {/* Company Name */}
            <div className="space-y-1">
              <label className="block text-slate-500 font-bold">Billing Company Name *</label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none font-bold"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="block text-slate-500 font-bold">Billing Phone / Contact *</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none"
                />
              </div>
            </div>
            
            {/* GST is read-only for dealers to prevent falsifying tax registration */}
            <div className="space-y-1">
              <label className="block text-slate-400 font-bold">GSTIN Registration (Admin Managed)</label>
              <input
                type="text"
                disabled
                value={user?.dealer?.gstNumber || 'Not Registered'}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed font-semibold"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1 text-xs">
            <label className="block text-slate-500 font-bold">Official Billing Address *</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-4" />
              <textarea
                required
                rows="2"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none"
              ></textarea>
            </div>
          </div>

          {/* City State Pincode */}
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <label className="block text-slate-500 font-bold">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-500 font-bold">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-500 font-bold">Pincode</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-rose-100 transition-all cursor-pointer disabled:bg-slate-200"
            >
              {loading ? 'Saving Profile Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
