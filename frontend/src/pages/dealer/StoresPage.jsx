// src/pages/dealer/StoresPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Store, 
  Trash2, 
  Edit3, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Layers,
  Calendar,
  Clock,
  User
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function StoresPage() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentStore, setCurrentStore] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  const { user } = useAuthStore();
  const dealerZones = user?.dealer?.zones || [];

  // Form states
  const [name, setName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [zone, setZone] = useState('');
  const [phone, setPhone] = useState('');
  const [marginPercent, setMarginPercent] = useState('');
  const [classification, setClassification] = useState('RETAIL');
  const [revisitDate, setRevisitDate] = useState('');
  const [pincodeSuggestions, setPincodeSuggestions] = useState([]);

  // History Modal States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyStore, setHistoryStore] = useState(null);
  const [historyVisits, setHistoryVisits] = useState([]);
  const [historyInvoices, setHistoryInvoices] = useState([]);
  const [historyTab, setHistoryTab] = useState('visits');
  const [historyLoading, setHistoryLoading] = useState(false);

  const handlePincodeChange = async (val) => {
    setPincode(val);
    if (val.length === 6) {
      try {
        const res = await axios.get(`/dealers/pincode-lookup/${val}`);
        if (res.data.success) {
          const { district, state: st, suggestedZones } = res.data.data;
          setCity(district || '');
          setState(st || '');
          if (suggestedZones && suggestedZones.length > 0) {
            setZone(suggestedZones[0]);
            setPincodeSuggestions(suggestedZones);
          } else {
            setPincodeSuggestions([]);
          }
        }
      } catch (err) {
        console.error('Failed pincode lookup', err);
      }
    } else {
      setPincodeSuggestions([]);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await axios.get('/stores');
      setStores(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStore = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    try {
      await axios.post('/stores', {
        name, gstNumber, address, city, state, pincode, zone, phone, marginPercent, classification, revisitDate: revisitDate || null
      });
      setMessage({ text: 'Outlet added successfully!', type: 'success' });
      fetchStores();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to add outlet', type: 'error' });
    }
  };

  const handleEditStore = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    try {
      await axios.put(`/stores/${currentStore.id}`, {
        name, gstNumber, address, city, state, pincode, zone, phone, marginPercent, classification, revisitDate: revisitDate || null
      });
      setMessage({ text: 'Outlet details updated successfully!', type: 'success' });
      fetchStores();
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update details', type: 'error' });
    }
  };

  const handleDeleteStore = async (id) => {
    if (!window.confirm('Are you sure you want to delete this retail store outlet?')) return;
    try {
      await axios.delete(`/stores/${id}`);
      fetchStores();
      setMessage({ text: 'Outlet deleted successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (s) => {
    setCurrentStore(s);
    setName(s.name);
    setGstNumber(s.gstNumber || '');
    setAddress(s.address);
    setCity(s.city || '');
    setState(s.state || '');
    setPincode(s.pincode || '');
    setZone(s.zone || '');
    setPhone(s.phone || '');
    setMarginPercent(s.marginPercent !== null && s.marginPercent !== undefined ? s.marginPercent : '');
    setClassification(s.classification || 'RETAIL');
    setRevisitDate(s.revisitDate ? new Date(s.revisitDate).toISOString().split('T')[0] : '');
    setPincodeSuggestions(s.zone ? [s.zone] : []);
    setShowEditModal(true);
  };

  const openHistoryModal = async (s) => {
    setHistoryStore(s);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    try {
      const visitsRes = await axios.get('/field-sales/visits');
      const filteredVisits = (visitsRes.data.data || []).filter(v => v.storeId?.toString() === s.id?.toString());
      setHistoryVisits(filteredVisits);

      const invoicesRes = await axios.get('/billing');
      const filteredInvoices = (invoicesRes.data.data || []).filter(i => i.storeId?.toString() === s.id?.toString());
      setHistoryInvoices(filteredInvoices);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const resetForm = () => {
    setName(''); setGstNumber(''); setAddress(''); setCity(''); setState('');
    setPincode(''); setZone(''); setPhone(''); setMarginPercent(''); 
    setClassification('RETAIL'); setRevisitDate(''); setCurrentStore(null);
    setPincodeSuggestions([]);
  };

  const availableZones = [...new Set([...dealerZones, ...pincodeSuggestions])];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Retail Outlets Directory</h2>
          <p className="text-slate-500 text-xs">Add and manage multiple customer shops or locations to generate invoices.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Shop / Store</span>
        </button>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div key={store.id} className="bg-white border border-slate-150 rounded-2xl shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs">{store.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] font-black text-slate-400 uppercase">Outlet</span>
                      <span className={`text-[8px] font-black px-1 rounded uppercase ${
                        store.classification === 'KIRANA' ? 'bg-amber-50 text-amber-800 border border-amber-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                      }`}>
                        {store.classification || 'RETAIL'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(store)}
                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteStore(store.id)}
                    className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Details card */}
              <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <p className="flex items-center space-x-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>GSTIN: <strong className="text-slate-800">{store.gstNumber || 'N/A'}</strong></span>
                </p>
                {store.phone && (
                  <p className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{store.phone}</span>
                  </p>
                )}
                <p className="flex items-start space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{store.address}, {store.city || ''} {store.pincode ? `- ${store.pincode}` : ''}</span>
                </p>
                {store.zone && (
                  <p className="flex items-center space-x-2">
                    <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Zone: <strong className="text-slate-700">{store.zone}</strong></span>
                  </p>
                )}
                {store.revisitDate && (
                  <p className="flex items-center space-x-2 text-rose-650 font-bold bg-rose-50/50 px-2 py-0.5 rounded-lg border border-rose-100/30 w-fit">
                    <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Revisit: {new Date(store.revisitDate).toLocaleDateString('en-IN')}</span>
                  </p>
                )}
                <p className="flex items-center space-x-2 border-t border-slate-100 pt-2.5">
                  <span className="font-extrabold text-rose-650">Store Margin:</span>
                  <span className="font-bold text-slate-850">{store.marginPercent !== null && store.marginPercent !== undefined ? `${store.marginPercent}%` : 'Default (10%)'}</span>
                </p>
                
                <div className="grid grid-cols-2 gap-2 mt-3 pt-1">
                  <button
                    onClick={() => navigate('/dealer/cart', { state: { storeId: store.id } })}
                    className="inline-flex items-center justify-center gap-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl text-[11px] transition-colors cursor-pointer shadow-sm shadow-rose-100"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Build Invoice</span>
                  </button>
                  <button
                    onClick={() => openHistoryModal(store)}
                    className="inline-flex items-center justify-center gap-1 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-[11px] transition-colors cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>View History</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Store Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Register Outlet Shop</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">Close</button>
            </div>
            
            <form onSubmit={handleAddStore} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Shop / Outlet Name *</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">GST Number (optional)</label>
                  <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Contact Number (optional)</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Store Zone / Area (optional)</label>
                  {availableZones.length > 0 ? (
                    <div className="space-y-1">
                      <select
                        value={zone}
                        onChange={e => setZone(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold text-slate-700 text-xs"
                      >
                        <option value="">-- Select Zone --</option>
                        {availableZones.map(z => (
                          <option key={z} value={z}>{z}</option>
                        ))}
                      </select>
                      {pincodeSuggestions.length > 0 && (
                        <p className="text-[9px] text-rose-600 font-bold mt-1">
                          ✓ Suggested zones loaded from pincode lookup
                        </p>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={zone}
                      onChange={e => setZone(e.target.value)}
                      placeholder="Enter zone manually"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Store Margin (%) (10% default)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="10% default if left blank"
                    value={marginPercent}
                    onChange={e => setMarginPercent(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Store Classification *</label>
                  <select
                    value={classification}
                    onChange={e => setClassification(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold text-slate-700 text-xs bg-white text-slate-750"
                  >
                    <option value="RETAIL">RETAIL</option>
                    <option value="KIRANA">KIRANA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Next Revisit Date (optional)</label>
                  <input
                    type="date"
                    value={revisitDate}
                    onChange={e => setRevisitDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Street Address *</label>
                <textarea required value={address} onChange={e => setAddress(e.target.value)} rows="2" className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"></textarea>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Pincode *</label>
                  <input type="text" required maxLength={6} placeholder="6-digit PIN" value={pincode} onChange={e => handlePincodeChange(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">City</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">State</label>
                  <input type="text" value={state} onChange={e => setState(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-xs">
                  Create Outlet Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Store Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Edit Outlet Details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">Close</button>
            </div>
            
            <form onSubmit={handleEditStore} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Shop / Outlet Name *</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">GST Number (optional)</label>
                  <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Contact Number (optional)</label>
                  <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Store Zone / Area (optional)</label>
                  {availableZones.length > 0 ? (
                    <div className="space-y-1">
                      <select
                        value={zone}
                        onChange={e => setZone(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold text-slate-700 text-xs"
                      >
                        <option value="">-- Select Zone --</option>
                        {availableZones.map(z => (
                          <option key={z} value={z}>{z}</option>
                        ))}
                      </select>
                      {pincodeSuggestions.length > 0 && (
                        <p className="text-[9px] text-rose-600 font-bold mt-1">
                          ✓ Suggested zones loaded from pincode lookup
                        </p>
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={zone}
                      onChange={e => setZone(e.target.value)}
                      placeholder="Enter zone manually"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Store Margin (%) (10% default)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="10% default if left blank"
                    value={marginPercent}
                    onChange={e => setMarginPercent(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Store Classification *</label>
                  <select
                    value={classification}
                    onChange={e => setClassification(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold text-slate-700 text-xs bg-white text-slate-750"
                  >
                    <option value="RETAIL">RETAIL</option>
                    <option value="KIRANA">KIRANA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Next Revisit Date (optional)</label>
                  <input
                    type="date"
                    value={revisitDate}
                    onChange={e => setRevisitDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Street Address *</label>
                <textarea required value={address} onChange={e => setAddress(e.target.value)} rows="2" className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"></textarea>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Pincode *</label>
                  <input type="text" required maxLength={6} placeholder="6-digit PIN" value={pincode} onChange={e => handlePincodeChange(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">City</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">State</label>
                  <input type="text" value={state} onChange={e => setState(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-xs">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Store History Modal */}
      {showHistoryModal && historyStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-3xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">Store profile & logs</span>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                  🏪 {historyStore.name} ({historyStore.classification || 'RETAIL'})
                </h3>
              </div>
              <button 
                onClick={() => { setShowHistoryModal(false); setHistoryStore(null); }} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setHistoryTab('visits')}
                className={`py-3 px-4 text-xs font-black tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                  historyTab === 'visits' ? 'border-rose-600 text-rose-700' : 'border-transparent text-slate-550'
                }`}
              >
                Visits History ({historyVisits.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryTab('invoices')}
                className={`py-3 px-4 text-xs font-black tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                  historyTab === 'invoices' ? 'border-rose-600 text-rose-700' : 'border-transparent text-slate-550'
                }`}
              >
                Billing History ({historyInvoices.length})
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-xs">
              {historyLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                </div>
              ) : historyTab === 'visits' ? (
                // Visits tab
                historyVisits.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-medium">
                    No visit logs recorded for this store outlet yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historyVisits.map((v, i) => (
                      <div key={v.id || i} className="border border-slate-100 rounded-xl p-4 bg-slate-50/40 space-y-2">
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span className="font-bold flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            Visitor: {v.visitorName}
                          </span>
                          <span className="font-mono">{new Date(v.checkInTime || v.date).toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-slate-700 font-medium">
                          <strong className="text-slate-800">Purpose:</strong> {v.purpose}
                        </p>
                        <p className="text-slate-700">
                          <strong className="text-slate-800">Outcome Notes:</strong> {v.outcome || 'No outcome logged'}
                        </p>
                        
                        {(v.paymentsCollected > 0 || v.revisitDate || v.newInvoiceId) && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px]">
                            {v.paymentsCollected > 0 && (
                              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-1.5 rounded-lg font-bold">
                                💰 Collected: ₹{v.paymentsCollected.toLocaleString()} ({v.paymentMethod})
                              </div>
                            )}
                            {v.newInvoiceId && (
                              <div className="bg-blue-50 border border-blue-100 text-blue-800 p-1.5 rounded-lg font-bold">
                                📄 New Invoice Linked
                              </div>
                            )}
                            {v.revisitDate && (
                              <div className="bg-rose-50 border border-rose-100 text-rose-800 p-1.5 rounded-lg font-bold">
                                📅 Revisit: {new Date(v.revisitDate).toLocaleDateString('en-IN')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // Invoices tab
                historyInvoices.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-medium">
                    No billing tax invoices created for this store outlet yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyInvoices.map((inv, i) => (
                      <div key={inv.id || i} className="flex justify-between items-center border border-slate-100 rounded-xl p-3 bg-white hover:bg-slate-50 transition">
                        <div>
                          <strong className="text-slate-800 block text-xs">{inv.invoiceNo}</strong>
                          <span className="text-[10px] text-slate-400">{new Date(inv.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                            inv.status === 'CLOSED' || inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'
                          }`}>
                            {inv.status}
                          </span>
                          {inv.totalDiscount > 0 && (
                            <span className="text-[10px] text-red-650 font-bold">Discount: -₹{inv.totalDiscount}</span>
                          )}
                          <strong className="text-rose-650 text-xs font-black">₹{parseFloat(inv.totalAmount || 0).toFixed(2)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button 
                type="button"
                onClick={() => { setShowHistoryModal(false); setHistoryStore(null); }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-5 rounded-xl text-xs transition cursor-pointer"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
