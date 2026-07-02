// src/pages/admin/EcomSettingsPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Settings, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Globe,
  Truck,
  Share2,
  Shield
} from 'lucide-react';

export default function EcomSettingsPage() {
  const [settings, setSettings] = useState({
    website_name: 'MANSARA Foods',
    contact_email: 'contact@mansarafoods.com',
    phone_number: '',
    address: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    whatsapp_number: '',
    freeShippingThreshold: 500,
    defaultShippingCharge: 50,
    enableB2cStall: true,
    enableFieldSales: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('store'); // store, shipping, social, licensing
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/ecom/settings');
      if (res.data.success && res.data.settings) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to load store settings', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleNumericChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await axios.put('/ecom/settings', settings);
      if (res.data.success) {
        setSettings(res.data.settings);
        setMessage({ text: 'Settings updated successfully!', type: 'success' });
        // Force header update by dispatching storage event or reloading page
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to update settings', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-rose-600" />
            Store Settings
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Configure retail business information, shipping charge conditions, and socials.</p>
        </div>
        <button
          onClick={fetchSettings}
          className="inline-flex items-center space-x-1.5 text-xs bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Message feedback */}
      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
            : 'bg-rose-50 text-rose-800 border border-rose-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {message.text}
          <button onClick={() => setMessage({ text: '', type: '' })} className="ml-auto text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex gap-1 border-b border-slate-200 pb-1">
        {[
          { key: 'store', label: 'General Storefront', icon: Globe },
          { key: 'shipping', label: 'Shipping Charges', icon: Truck },
          { key: 'social', label: 'Social & WhatsApp', icon: Share2 },
          { key: 'licensing', label: 'Module Packages', icon: Shield }
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === tab.key 
                ? 'bg-rose-600 text-white shadow-md' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Form */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-slate-150 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6 text-xs">
          
          {/* Tab 1: General Info */}
          {activeTab === 'store' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-xs border-b pb-2 uppercase tracking-wide">Business Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Website Name *</label>
                  <input
                    type="text"
                    name="website_name"
                    required
                    value={settings.website_name}
                    onChange={handleInputChange}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Official Contact Email *</label>
                  <input
                    type="email"
                    name="contact_email"
                    required
                    value={settings.contact_email}
                    onChange={handleInputChange}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Business Support Hotline</label>
                  <input
                    type="text"
                    name="phone_number"
                    value={settings.phone_number}
                    onChange={handleInputChange}
                    placeholder="e.g. +91 98388 87064"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-500 font-bold mb-1">Registered Store Address</label>
                <textarea
                  name="address"
                  value={settings.address}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Official office or warehouse address..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                ></textarea>
              </div>
            </div>
          )}

          {/* Tab 2: Shipping Settings */}
          {activeTab === 'shipping' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-xs border-b pb-2 uppercase tracking-wide">Shipping & Courier Fees</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Free Shipping Threshold (₹) *</label>
                  <input
                    type="number"
                    name="freeShippingThreshold"
                    required
                    value={settings.freeShippingThreshold}
                    onChange={handleNumericChange}
                    placeholder="e.g. 500 (Set to 0 to disable)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold text-rose-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Orders with a subtotal exceeding this amount receive free delivery.</p>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Default Flat Shipping Charge (₹) *</label>
                  <input
                    type="number"
                    name="defaultShippingCharge"
                    required
                    value={settings.defaultShippingCharge}
                    onChange={handleNumericChange}
                    placeholder="e.g. 50"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Standard courier charge applied if order is below threshold.</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Social & WhatsApp */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800 text-xs border-b pb-2 uppercase tracking-wide">Social Networks & Contacts</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">WhatsApp Customer Support Number</label>
                  <input
                    type="text"
                    name="whatsapp_number"
                    value={settings.whatsapp_number || ''}
                    onChange={handleInputChange}
                    placeholder="e.g. 919838887064"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none text-emerald-600 font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Include country code without special characters (e.g. 91 for India).</p>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Facebook Fanpage URL</label>
                  <input
                    type="text"
                    name="facebook_url"
                    value={settings.facebook_url || ''}
                    onChange={handleInputChange}
                    placeholder="https://facebook.com/mansarafoods"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none text-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Instagram Feed URL</label>
                  <input
                    type="text"
                    name="instagram_url"
                    value={settings.instagram_url || ''}
                    onChange={handleInputChange}
                    placeholder="https://instagram.com/mansarafoods"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none text-pink-600"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Twitter / X Profile URL</label>
                  <input
                    type="text"
                    name="twitter_url"
                    value={settings.twitter_url || ''}
                    onChange={handleInputChange}
                    placeholder="https://twitter.com/mansarafoods"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Module Packages & Licensing */}
          {activeTab === 'licensing' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 text-xs border-b pb-2 uppercase tracking-wide">Software Module Packages</h3>
                <p className="text-slate-500 text-[10px] mt-1.5">
                  Manage active licensing packages for the distribution tenant. Toggling off modules dynamically disables client access and hides corresponding pages from the system dashboard & sidebar navigation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stall Card */}
                <div className={`p-5 rounded-2xl border transition-all duration-200 ${
                  settings.enableB2cStall 
                    ? 'bg-rose-50/30 border-rose-100' 
                    : 'bg-slate-50/50 border-slate-100'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <strong className="text-[13px] font-bold text-slate-800">B2C Stall Module</strong>
                      <p className="text-[10px] text-slate-400">High-speed cashier terminal, manual override pricing, event budgeting, and P&L statement report generation.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        name="enableB2cStall"
                        checked={!!settings.enableB2cStall} 
                        onChange={handleCheckboxChange}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-rose-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                    </label>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-slate-400">License Status:</span>
                    <span className={`font-black uppercase tracking-wider ${settings.enableB2cStall ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`}>
                      {settings.enableB2cStall ? 'Licensed & Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Field Sales Card */}
                <div className={`p-5 rounded-2xl border transition-all duration-200 ${
                  settings.enableFieldSales 
                    ? 'bg-emerald-50/20 border-emerald-100' 
                    : 'bg-slate-50/50 border-slate-100'
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <strong className="text-[13px] font-bold text-slate-800">Field Sales & Store Visits</strong>
                      <p className="text-[10px] text-slate-400">GPS verified store check-in/out, live partial delivery fulfillment logging, and on-site invoice revision requests.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        name="enableFieldSales"
                        checked={!!settings.enableFieldSales} 
                        onChange={handleCheckboxChange}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-emerald-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-slate-400">License Status:</span>
                    <span className={`font-black uppercase tracking-wider ${settings.enableFieldSales ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`}>
                      {settings.enableFieldSales ? 'Licensed & Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit buttons */}
          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-rose-200 transition-all cursor-pointer disabled:bg-slate-200 disabled:shadow-none text-xs"
            >
              {saving ? 'Saving Settings...' : 'Save Settings Changes'}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
