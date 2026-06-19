// src/pages/admin/DealersPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  MapPin, 
  FileText, 
  Phone, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Power,
  ShieldCheck,
  Building2,
  CreditCard,
  Clock,
  Package,
  Store,
  Activity,
  User,
  KeyRound,
  Eye,
  EyeOff,
  Tag,
  X,
  IndianRupee
} from 'lucide-react';
import ZoneSelectionMap from '../../components/ZoneSelectionMap';

export default function DealersPage() {
  const location = useLocation();
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Detail Modal states
  const [selectedDealerId, setSelectedDealerId] = useState(null);
  const [dealerDetail, setDealerDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'stores' | 'inventory'

  // Change Password states (inside detail modal)
  const [pwNew, setPwNew] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [pwShowNew, setPwShowNew] = useState(false);
  const [pwShowConfirm, setPwShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState({ text: '', type: '' });

  // Edit Profile States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editGstNumber, setEditGstNumber] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editPincode, setEditPincode] = useState('');
  const [editZones, setEditZones] = useState([]);
  const [editZoneInput, setEditZoneInput] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDealerType, setEditDealerType] = useState('RETAIL');
  const [editDealerCategory, setEditDealerCategory] = useState('STARTER');
  const [editCreditLimit, setEditCreditLimit] = useState('');
  const [editInitialDeposit, setEditInitialDeposit] = useState('');
  const [editCategories, setEditCategories] = useState([]);
  const [editNotes, setEditNotes] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [zoneConflicts, setZoneConflicts] = useState([]);
  const [editZoneConflicts, setEditZoneConflicts] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [showEditMap, setShowEditMap] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [zones, setZones] = useState([]);         // multi-zone array
  const [zoneInput, setZoneInput] = useState(''); // zone tag input buffer
  const [area, setArea] = useState('');
  const [phone, setPhone] = useState('');
  const [dealerType, setDealerType] = useState('RETAIL');
  const [dealerCategory, setDealerCategory] = useState('STARTER');
  const [initialDeposit, setInitialDeposit] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [pincodeSuggestions, setPincodeSuggestions] = useState([]);

  // Check conflicts for registration modal
  useEffect(() => {
    if (zones.length === 0) {
      setZoneConflicts([]);
      return;
    }
    const checkConflicts = async () => {
      try {
        const queryParams = zones.map(z => `zones[]=${encodeURIComponent(z)}`).join('&');
        const res = await axios.get(`/dealers/zone-check?${queryParams}`);
        setZoneConflicts(res.data.conflicts || []);
      } catch (err) {
        console.error('Zone conflict check error:', err);
      }
    };
    const debounce = setTimeout(checkConflicts, 400);
    return () => clearTimeout(debounce);
  }, [zones]);

  // Check conflicts for edit modal
  useEffect(() => {
    if (editZones.length === 0) {
      setEditZoneConflicts([]);
      return;
    }
    const checkConflicts = async () => {
      try {
        const queryParams = editZones.map(z => `zones[]=${encodeURIComponent(z)}`).join('&');
        const res = await axios.get(`/dealers/zone-check?${queryParams}`);
        const otherConflicts = (res.data.conflicts || []).filter(c => c.dealerId !== dealerDetail?.id);
        setEditZoneConflicts(otherConflicts);
      } catch (err) {
        console.error('Zone conflict check error:', err);
      }
    };
    const debounce = setTimeout(checkConflicts, 400);
    return () => clearTimeout(debounce);
  }, [editZones, dealerDetail]);

  const downloadAgreement = async (dealerId, companyName) => {
    try {
      const response = await axios.get(`/billing/agreement/${dealerId}`, { responseType: 'blob' });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `Agreement_${companyName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to download agreement:', err);
      alert('Failed to download agreement PDF.');
    }
  };

  const startEditing = () => {
    setEditName(dealerDetail.user?.name || '');
    setEditCompanyName(dealerDetail.companyName || '');
    setEditGstNumber(dealerDetail.gstNumber || '');
    setEditAddress(dealerDetail.address || '');
    setEditCity(dealerDetail.city || '');
    setEditState(dealerDetail.state || '');
    setEditPincode(dealerDetail.pincode || '');
    setEditZones(dealerDetail.zones || []);
    setEditZoneInput('');
    setEditArea(dealerDetail.area || '');
    setEditPhone(dealerDetail.phone || '');
    setEditDealerType(dealerDetail.dealerType || 'RETAIL');
    setEditDealerCategory(dealerDetail.dealerCategory || 'STARTER');
    setEditCreditLimit(dealerDetail.creditLimit || '');
    setEditInitialDeposit(dealerDetail.initialDeposit || '');
    setEditCategories(dealerDetail.categories || []);
    setEditNotes(dealerDetail.notes || '');
    setEditError('');
    setIsEditingProfile(true);
    fetchCategories();
  };

  const handleUpdateDealer = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');

    if (editZoneConflicts.length > 0) {
      const conflictMsg = editZoneConflicts.map(c => `- Zone "${c.zones.join(', ')}" is already assigned to active dealer "${c.companyName}"`).join('\n');
      const proceed = window.confirm(`⚠️ Warning: Zone Assignment Conflicts Detected!\n\n${conflictMsg}\n\nDo you still want to save these profile changes?`);
      if (!proceed) {
        setEditLoading(false);
        return;
      }
    }

    try {
      const res = await axios.put(`/dealers/${dealerDetail.id}`, {
        name: editName,
        companyName: editCompanyName,
        gstNumber: editGstNumber,
        address: editAddress,
        city: editCity,
        state: editState,
        pincode: editPincode,
        zones: editZones,
        area: editArea,
        phone: editPhone,
        dealerType: editDealerType,
        dealerCategory: editDealerCategory,
        creditLimit: editCreditLimit ? parseFloat(editCreditLimit) : null,
        initialDeposit: editInitialDeposit ? parseFloat(editInitialDeposit) : 0,
        categories: editCategories,
        notes: editNotes
      });
      if (res.data.success) {
        setDealerDetail(res.data.data);
        setIsEditingProfile(false);
        fetchDealers(); // refresh main directory list
      } else {
        setEditError(res.data.message || 'Failed to update dealer');
      }
    } catch (err) {
      console.error(err);
      setEditError(err.response?.data?.message || 'Failed to update dealer details');
    } finally {
      setEditLoading(false);
    }
  };

  const addEditZone = (val) => {
    const trimmed = val.trim();
    if (trimmed && !editZones.includes(trimmed)) {
      setEditZones(prev => [...prev, trimmed]);
    }
    setEditZoneInput('');
  };

  const removeEditZone = (z) => setEditZones(prev => prev.filter(x => x !== z));

  const toggleEditCategory = (id) => {
    setEditCategories(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const fetchDealerDetail = async (id) => {
    setDetailLoading(true);
    setSelectedDealerId(id);
    setShowDetailModal(true);
    setActiveTab('profile');
    try {
      const res = await axios.get(`/dealers/${id}`);
      setDealerDetail(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };



  useEffect(() => {
    fetchDealers();
  }, [search, statusFilter]);

  useEffect(() => {
    if (location.state?.dealerId) {
      fetchDealerDetail(location.state.dealerId);
    }
  }, [location.state]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/products/categories');
      setCategoryList(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories', err);
    }
  };

  const openAddModal = () => {
    fetchCategories();
    setShowAddModal(true);
  };

  const fetchDealers = async () => {
    try {
      const res = await axios.get('/dealers', {
        params: { search, status: statusFilter }
      });
      setDealers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess(false);
    setSubmitting(true);

    if (zoneConflicts.length > 0) {
      const conflictMsg = zoneConflicts.map(c => `- Zone "${c.zones.join(', ')}" is already assigned to active dealer "${c.companyName}"`).join('\n');
      const proceed = window.confirm(`⚠️ Warning: Zone Assignment Conflicts Detected!\n\n${conflictMsg}\n\nDo you still want to proceed with this registration?`);
      if (!proceed) {
        setSubmitting(false);
        return;
      }
    }

    try {
      await axios.post('/auth/register-dealer', {
        email, password, name, companyName, gstNumber, address, city, state, pincode,
        zones,     // send zones array
        area, phone, dealerType, dealerCategory,
        initialDeposit: initialDeposit ? parseFloat(initialDeposit) : 0,
        categories: selectedCategories
      });
      
      setFormSuccess(true);
      fetchDealers();
      setTimeout(() => {
        setShowAddModal(false);
        setFormSuccess(false);
        resetForm();
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to register dealer. Please try again.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id, status) => {
    try {
      await axios.patch(`/dealers/${id}/approve`, { status });
      fetchDealers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (id, currentActive) => {
    try {
      await axios.patch(`/dealers/${id}/toggle-active`, { isActive: !currentActive });
      fetchDealers();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setEmail(''); setPassword(''); setName(''); setCompanyName(''); setGstNumber('');
    setAddress(''); setCity(''); setState(''); setPincode(''); setZones([]); setZoneInput(''); setArea('');
    setPhone(''); setDealerType('RETAIL'); setDealerCategory('STARTER'); setInitialDeposit(''); setSelectedCategories([]);
    setFormError(''); setFormSuccess(false); setSubmitting(false);
    setPincodeSuggestions([]);
    setShowMap(false);
    setShowEditMap(false);
  };

  const handlePincodeChange = async (val) => {
    setPincode(val);
    if (val.length === 6) {
      try {
        const res = await axios.get(`/dealers/pincode-lookup/${val}`);
        if (res.data.success) {
          const { district, state: st, suggestedZones } = res.data.data;
          setCity(district || '');
          setState(st || '');
          setPincodeSuggestions(suggestedZones || []);
        } else {
          setPincodeSuggestions([]);
        }
      } catch (err) {
        console.error('Failed pincode lookup', err);
        setPincodeSuggestions([]);
      }
    } else {
      setPincodeSuggestions([]);
    }
  };

  // Zone tag helpers
  const addZone = (val) => {
    const trimmed = val.trim();
    if (trimmed && !zones.includes(trimmed)) {
      setZones(prev => [...prev, trimmed]);
    }
    setZoneInput('');
  };

  const removeZone = (z) => setZones(prev => prev.filter(x => x !== z));

  const toggleCategory = (id) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Partner Dealers Directory</h2>
          <p className="text-slate-500 text-xs">Manage verification pipeline, add details, and toggle dealer status.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Register Dealer</span>
        </button>
      </div>

      {/* Filter and search controls */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 border border-slate-150 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company, dealer name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none transition-all font-semibold text-slate-600 cursor-pointer"
        >
          <option value="">All Verification Status</option>
          <option value="PENDING">Pending Approval</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
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
          {dealers.map((dealer) => (
            <div 
              key={dealer.id} 
              onClick={() => fetchDealerDetail(dealer.id)}
              className="bg-white border border-slate-150 rounded-2xl shadow-sm p-6 space-y-4 hover:shadow-md hover:border-rose-300 hover:scale-[1.01] transition-all cursor-pointer relative overflow-hidden group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Building2 className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="truncate max-w-[180px]">{dealer.companyName}</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">Type: {dealer.dealerType}</p>
                  {dealer.dealerCategory && (
                    <span className={`inline-block mt-1 text-[9px] font-black px-2 py-0.5 rounded-full ${
                      dealer.dealerCategory === 'SUPER' ? 'bg-purple-100 text-purple-700' :
                      dealer.dealerCategory === 'PREMIUM' ? 'bg-amber-100 text-amber-700' :
                      dealer.dealerCategory === 'GROWTH' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      ⭐ {dealer.dealerCategory}
                    </span>
                  )}
                </div>
                
                {/* Status Badges */}
                <div className="flex flex-col items-end space-y-1">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                    dealer.approvalStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                    dealer.approvalStatus === 'REJECTED' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {dealer.approvalStatus}
                  </span>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                    dealer.user?.isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {dealer.user?.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Contacts */}
              <div className="space-y-2 border-y border-slate-100 py-3 text-xs text-slate-600">
                <p className="flex items-center space-x-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>GST: <strong className="text-slate-800">{dealer.gstNumber || 'N/A'}</strong></span>
                </p>
                <p className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{dealer.phone}</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{dealer.user?.email}</span>
                </p>
                <p className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{dealer.address}, {dealer.city}</span>
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                {dealer.approvalStatus === 'PENDING' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApprove(dealer.id, 'APPROVED'); }}
                      className="inline-flex items-center space-x-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-emerald-100"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApprove(dealer.id, 'REJECTED'); }}
                      className="inline-flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border border-rose-100"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
                
                {dealer.approvalStatus === 'APPROVED' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleActive(dealer.id, dealer.user?.isActive); }}
                    className={`inline-flex items-center space-x-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border ${
                      dealer.user?.isActive 
                        ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        : 'bg-rose-600 border-rose-600 text-white hover:bg-rose-700'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{dealer.user?.isActive ? 'Deactivate' : 'Activate'}</span>
                  </button>
                )}

                <span className="text-[10px] font-bold text-rose-600 group-hover:underline ml-auto flex items-center space-x-1">
                  <span>View Profile</span>
                  <span>→</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Dealer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Register New Dealer Partner</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">All fields marked * are required</p>
              </div>
              <button 
                onClick={() => { setShowAddModal(false); resetForm(); }} 
                className="text-slate-400 hover:text-slate-600 font-bold text-xs px-3 py-1.5 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition-all"
              >
                ✕ Close
              </button>
            </div>

            {/* Error Banner - shown prominently inside modal */}
            {formError && (
              <div className="mx-6 mt-4 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3">
                <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-white text-[10px] font-black">!</span>
                </div>
                <div>
                  <p className="text-rose-800 font-bold text-xs">Registration Failed</p>
                  <p className="text-rose-700 text-[11px] mt-0.5">{formError}</p>
                  {formError.toLowerCase().includes('email') && (
                    <p className="text-rose-600 text-[10px] mt-1 font-medium">💡 Tip: Use a different email address that hasn't been registered yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* Success Banner */}
            {formSuccess && (
              <div className="mx-6 mt-4 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-3">
                <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-[10px] font-black">✓</span>
                </div>
                <p className="text-emerald-800 font-bold text-xs">Dealer registered successfully! Awaiting approval.</p>
              </div>
            )}
            
            <form onSubmit={handleRegister} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Company / Firm Name *</label>
                  <input type="text" required value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">GST Number (optional)</label>
                  <input type="text" value={gstNumber} onChange={e => setGstNumber(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Dealer Name *</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Phone Number *</label>
                  <input type="text" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Email ID *</label>
                  <input 
                    type="email" 
                    required 
                    autoComplete="off" 
                    value={email} 
                    onChange={e => { setEmail(e.target.value); if (formError) setFormError(''); }} 
                    className={`w-full p-2.5 bg-slate-50 border focus:bg-white rounded-xl focus:outline-none transition-all ${
                      formError && formError.toLowerCase().includes('email') 
                        ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500' 
                        : 'border-slate-200 focus:border-rose-500'
                    }`}
                    placeholder="dealer@example.com"
                  />
                  {formError && formError.toLowerCase().includes('email') && (
                    <p className="text-rose-600 text-[10px] mt-1 font-semibold">⚠ This email is already taken</p>
                  )}
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Password *</label>
                  <input type="password" required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" placeholder="Min. 6 characters" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Dealer Type</label>
                  <select value={dealerType} onChange={e => setDealerType(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer">
                    <option value="RETAIL">Retail</option>
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                    <option value="SUPER_DISTRIBUTOR">Super Distributor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Dealer Tier / Category *</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {['STARTER', 'GROWTH', 'PREMIUM', 'SUPER'].map(tier => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => setDealerCategory(tier)}
                        className={`py-2 rounded-xl text-[11px] font-black border transition-all ${
                          dealerCategory === tier
                            ? tier === 'SUPER' ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                              : tier === 'PREMIUM' ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                              : tier === 'GROWTH' ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                              : 'bg-slate-600 text-white border-slate-600 shadow-sm'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-rose-300'
                        }`}
                      >
                        {tier === 'SUPER' ? '⭐ SUPER' : tier === 'PREMIUM' ? '🥇 PREMIUM' : tier === 'GROWTH' ? '📈 GROWTH' : '🌱 STARTER'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1 flex items-center space-x-1">
                    <IndianRupee className="w-3 h-3" />
                    <span>Initial Deposit (₹)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={initialDeposit}
                    onChange={e => setInitialDeposit(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Zones Tag Builder */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-slate-500 font-bold">Zones / Territories (add multiple)</label>
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-100 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl transition-all"
                  >
                    {showMap ? '🗺️ Hide Interactive Map' : '🗺️ Use Interactive Map'}
                  </button>
                </div>

                {showMap && (
                  <div className="mb-3 animate-fade-in">
                    <ZoneSelectionMap
                      selectedZones={zones}
                      onToggleZone={z => zones.includes(z) ? removeZone(z) : addZone(z)}
                      zoneConflicts={zoneConflicts}
                    />
                  </div>
                )}

                <div className="border border-slate-200 rounded-xl bg-slate-50 p-2.5 min-h-[42px] flex flex-wrap gap-1.5 items-center focus-within:border-rose-500 focus-within:bg-white transition-all">
                  {zones.map(z => (
                    <span key={z} className="inline-flex items-center space-x-1 bg-rose-100 text-rose-700 font-bold text-[10px] px-2.5 py-1 rounded-lg">
                      <span>{z}</span>
                      <button type="button" onClick={() => removeZone(z)} className="text-rose-500 hover:text-rose-700 ml-0.5">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={zoneInput}
                    onChange={e => setZoneInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addZone(zoneInput); }
                    }}
                    onBlur={() => { if (zoneInput.trim()) addZone(zoneInput); }}
                    placeholder={zones.length === 0 ? 'Type zone name, press Enter or comma to add...' : 'Add another zone...'}
                    className="flex-1 min-w-[140px] bg-transparent text-xs focus:outline-none text-slate-700 placeholder-slate-400"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">e.g. North, South, East · Press Enter or comma to add each zone</p>
              </div>

              {zoneConflicts.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl space-y-1">
                  <p className="font-bold text-[10px] flex items-center gap-1">
                    <span>⚠️ Warning: Zone Assignment Conflict</span>
                  </p>
                  <ul className="list-disc pl-4 text-[10px]">
                    {zoneConflicts.map((c, idx) => (
                      <li key={idx}>
                        Zone <strong>{c.zones.join(', ')}</strong> is already assigned to active dealer <strong>{c.companyName}</strong>.
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {pincodeSuggestions.length > 0 && (
                <div className="bg-rose-50/20 border border-rose-100/50 p-3.5 rounded-xl space-y-2">
                  <span className="block text-[10px] font-black uppercase text-rose-600 tracking-wider">Quick Add Suggested Zones:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {pincodeSuggestions.map(sz => {
                      const isAdded = zones.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          disabled={isAdded}
                          onClick={() => addZone(sz)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
                            isAdded
                              ? 'bg-slate-200 text-slate-400 border-slate-200 cursor-not-allowed'
                              : 'bg-white text-rose-600 border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 cursor-pointer'
                          }`}
                        >
                          + {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category Multi-select */}
              <div>
                <label className="block text-slate-500 font-bold mb-2">Dealer Categories (select applicable)</label>
                {categoryList.length === 0 ? (
                  <p className="text-slate-400 text-[11px] italic">No categories found. Create categories in the Products section first.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categoryList.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          selectedCategories.includes(cat.id)
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-rose-400 hover:text-rose-600'
                        }`}
                      >
                        {selectedCategories.includes(cat.id) && '✓ '}{cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Street Address *</label>
                <textarea required value={address} onChange={e => setAddress(e.target.value)} rows="2" className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"></textarea>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">City</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">State</label>
                  <input type="text" value={state} onChange={e => setState(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Pincode</label>
                  <input type="text" value={pincode} onChange={e => handlePincodeChange(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={submitting || formSuccess}
                  className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg transition-all text-xs flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : formSuccess ? (
                    <span>✓ Registered Successfully!</span>
                  ) : (
                    <span>Register Partner Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dealer Detail Profile Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-4xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center space-x-2.5">
                  <Building2 className="w-5 h-5 text-rose-600 shrink-0" />
                  <h3 className="font-black text-slate-800 text-lg tracking-tight">
                    {dealerDetail ? dealerDetail.companyName : 'Loading Dealer details...'}
                  </h3>
                  {dealerDetail && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      dealerDetail.approvalStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      dealerDetail.approvalStatus === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 
                      'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {dealerDetail.approvalStatus}
                    </span>
                  )}
                </div>
                {dealerDetail && (
                  <p className="text-[11px] text-slate-500 font-medium flex items-center space-x-2">
                    <span>Type: <strong className="text-slate-700">{dealerDetail.dealerType}</strong></span>
                    <span className="text-slate-300">•</span>
                    <span>Zone: <strong className="text-slate-700">{dealerDetail.zone || 'N/A'}</strong></span>
                    <span className="text-slate-300">•</span>
                    <span>Status: <strong className={dealerDetail.user?.isActive ? 'text-indigo-600' : 'text-slate-500'}>
                      {dealerDetail.user?.isActive ? 'Active' : 'Inactive'}
                    </strong></span>
                  </p>
                )}
              </div>
              <button 
                onClick={() => { 
                  setShowDetailModal(false); 
                  setDealerDetail(null); 
                  setPwNew(''); 
                  setPwConfirm(''); 
                  setPwMessage({ text: '', type: '' }); 
                  setIsEditingProfile(false);
                  setEditError('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600"></div>
                <p className="text-slate-500 text-xs font-semibold">Fetching complete profile...</p>
              </div>
            ) : dealerDetail ? (
              <>
                {/* Modal Tabs Bar */}
                <div className="flex border-b border-slate-100 bg-slate-50/50 px-6">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold border-b-2 -mb-px transition-all ${
                      activeTab === 'profile'
                        ? 'border-rose-600 text-rose-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Dealer Profile</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('stores')}
                    className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold border-b-2 -mb-px transition-all ${
                      activeTab === 'stores'
                        ? 'border-rose-600 text-rose-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>Outlets / Stores ({dealerDetail.stores?.length || 0})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold border-b-2 -mb-px transition-all ${
                      activeTab === 'inventory'
                        ? 'border-rose-600 text-rose-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Inventory Stock ({dealerDetail.inventory?.length || 0})</span>
                  </button>
                </div>

                {/* Modal Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Tab 1: Profile Info */}
                  {activeTab === 'profile' && (
                    <div className="space-y-6 text-xs animate-fade-in">
                      {isEditingProfile ? (
                        <form onSubmit={handleUpdateDealer} className="space-y-4 bg-slate-50 border border-slate-200/60 rounded-xl p-5">
                          <h4 className="font-black text-slate-800 text-xs flex items-center space-x-2 border-b border-slate-200/60 pb-2">
                            <Building2 className="w-4 h-4 text-rose-600" />
                            <span>EDIT DEALER PROFILE DETAILS</span>
                          </h4>

                          {editError && (
                            <div className="px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg font-semibold mb-2">
                              {editError}
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-slate-500 font-bold mb-1">Company / Firm Name *</label>
                              <input type="text" required value={editCompanyName} onChange={e => setEditCompanyName(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none" />
                            </div>
                            <div>
                              <label className="block text-slate-500 font-bold mb-1">GST Number</label>
                              <input type="text" value={editGstNumber} onChange={e => setEditGstNumber(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none" />
                            </div>
                            <div>
                              <label className="block text-slate-500 font-bold mb-1">Dealer Contact Name *</label>
                              <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none" />
                            </div>
                            <div>
                              <label className="block text-slate-500 font-bold mb-1">Phone Number *</label>
                              <input type="text" required value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none" />
                            </div>
                            <div>
                              <label className="block text-slate-500 font-bold mb-1">Dealer Type</label>
                              <select value={editDealerType} onChange={e => setEditDealerType(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer">
                                <option value="RETAIL">Retail</option>
                                <option value="WHOLESALE">Wholesale</option>
                                <option value="DISTRIBUTOR">Distributor</option>
                                <option value="SUPER_DISTRIBUTOR">Super Distributor</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-slate-500 font-bold mb-1">Dealer Tier / Category *</label>
                              <select value={editDealerCategory} onChange={e => setEditDealerCategory(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer">
                                <option value="STARTER">Starter</option>
                                <option value="GROWTH">Growth</option>
                                <option value="PREMIUM">Premium</option>
                                <option value="SUPER">Super</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-slate-500 font-bold mb-1">Credit Limit (₹)</label>
                              <input type="number" min="0" step="0.01" value={editCreditLimit} onChange={e => setEditCreditLimit(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none" placeholder="e.g. 50000" />
                            </div>
                            <div>
                              <label className="block text-slate-500 font-bold mb-1">Initial Deposit (₹)</label>
                              <input type="number" min="0" step="0.01" value={editInitialDeposit} onChange={e => setEditInitialDeposit(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none" />
                            </div>
                          </div>

                          {/* Zones Tag Builder */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <label className="block text-slate-500 font-bold">Zones / Territories (add multiple)</label>
                              <button
                                type="button"
                                onClick={() => setShowEditMap(!showEditMap)}
                                className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-100 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl transition-all"
                              >
                                {showEditMap ? '🗺️ Hide Interactive Map' : '🗺️ Use Interactive Map'}
                              </button>
                            </div>

                            {showEditMap && (
                              <div className="mb-3 animate-fade-in">
                                <ZoneSelectionMap
                                  selectedZones={editZones}
                                  onToggleZone={z => editZones.includes(z) ? removeEditZone(z) : addEditZone(z)}
                                  zoneConflicts={editZoneConflicts}
                                />
                              </div>
                            )}

                            <div className="border border-slate-200 rounded-xl bg-white p-2.5 min-h-[42px] flex flex-wrap gap-1.5 items-center focus-within:border-rose-500 transition-all">
                              {editZones.map(z => (
                                <span key={z} className="inline-flex items-center space-x-1 bg-rose-100 text-rose-700 font-bold text-[10px] px-2.5 py-1 rounded-lg">
                                  <span>{z}</span>
                                  <button type="button" onClick={() => removeEditZone(z)} className="text-rose-500 hover:text-rose-700 ml-0.5">
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </span>
                              ))}
                              <input
                                type="text"
                                value={editZoneInput}
                                onChange={e => setEditZoneInput(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addEditZone(editZoneInput); }
                                }}
                                onBlur={() => { if (editZoneInput.trim()) addEditZone(editZoneInput); }}
                                placeholder={editZones.length === 0 ? "Type zone name, press Enter..." : "Add zone..."}
                                className="flex-1 min-w-[140px] bg-transparent text-xs focus:outline-none text-slate-700 placeholder-slate-400"
                              />
                            </div>
                          </div>

                          {editZoneConflicts.length > 0 && (
                            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl space-y-1">
                              <p className="font-bold text-[10px] flex items-center gap-1">
                                <span>⚠️ Warning: Zone Assignment Conflict</span>
                              </p>
                              <ul className="list-disc pl-4 text-[10px]">
                                {editZoneConflicts.map((c, idx) => (
                                  <li key={idx}>
                                    Zone <strong>{c.zones.join(', ')}</strong> is already assigned to active dealer <strong>{c.companyName}</strong>.
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Category Multi-select */}
                          <div>
                            <label className="block text-slate-500 font-bold mb-2">Dealer Product Categories</label>
                            <div className="flex flex-wrap gap-2">
                              {categoryList.map(cat => (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => toggleEditCategory(cat.id)}
                                  className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                                    editCategories.includes(cat.id)
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                      : 'bg-white text-slate-600 border-slate-200 hover:border-rose-400 hover:text-rose-600'
                                  }`}
                                >
                                  {editCategories.includes(cat.id) && '✓ '}{cat.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Street Address *</label>
                            <textarea required value={editAddress} onChange={e => setEditAddress(e.target.value)} rows="2" className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none"></textarea>
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-slate-500 font-bold mb-1">City</label>
                              <input type="text" value={editCity} onChange={e => setEditCity(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none" />
                            </div>
                            <div>
                              <label className="block text-slate-500 font-bold mb-1">State</label>
                              <input type="text" value={editState} onChange={e => setEditState(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none" />
                            </div>
                            <div>
                              <label className="block text-slate-500 font-bold mb-1">Pincode</label>
                              <input type="text" value={editPincode} onChange={e => setEditPincode(e.target.value)} className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none" />
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-500 font-bold mb-1">Admin Remarks / Notes</label>
                            <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows="2" className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none" placeholder="Add notes..."></textarea>
                          </div>

                          <div className="flex space-x-3 pt-4">
                            <button
                              type="submit"
                              disabled={editLoading}
                              className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
                            >
                              {editLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingProfile(false)}
                              className="px-6 bg-white border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-xl transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex justify-end mb-4 gap-3">
                            {dealerDetail.approvalStatus === 'APPROVED' && (
                              <button
                                type="button"
                                onClick={() => downloadAgreement(dealerDetail.id, dealerDetail.companyName)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl shadow-md text-xs uppercase tracking-wide flex items-center space-x-1.5 cursor-pointer"
                              >
                                <FileText className="w-4 h-4" />
                                <span>Download Agreement PDF</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={startEditing}
                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl shadow-md text-xs uppercase tracking-wide flex items-center space-x-1.5"
                            >
                              <span>Edit Profile Details</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Box 1: Owner & Contact details */}
                            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 space-y-4">
                              <h4 className="font-black text-slate-800 text-xs flex items-center space-x-2 border-b border-slate-200/60 pb-2">
                                <User className="w-4 h-4 text-rose-600" />
                                <span>PRIMARY CONTACT DETAILS</span>
                              </h4>
                              <div className="grid grid-cols-3 gap-y-3">
                                <span className="text-slate-400 font-medium">Full Name</span>
                                <span className="col-span-2 text-slate-800 font-semibold">{dealerDetail.user?.name || 'N/A'}</span>

                                <span className="text-slate-400 font-medium">Email Address</span>
                                <span className="col-span-2 text-slate-800 font-semibold truncate">{dealerDetail.user?.email || 'N/A'}</span>

                                <span className="text-slate-400 font-medium">Phone Number</span>
                                <span className="col-span-2 text-slate-800 font-semibold">{dealerDetail.phone || 'N/A'}</span>
                                
                                <span className="text-slate-400 font-medium">Last Login</span>
                                <span className="col-span-2 text-slate-800 font-semibold">
                                  {dealerDetail.user?.lastLogin ? new Date(dealerDetail.user.lastLogin).toLocaleString() : 'Never logged in'}
                                </span>
                              </div>
                            </div>

                            {/* Box 2: Billing & Location details */}
                            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 space-y-4">
                              <h4 className="font-black text-slate-800 text-xs flex items-center space-x-2 border-b border-slate-200/60 pb-2">
                                <MapPin className="w-4 h-4 text-rose-600" />
                                <span>OFFICE / BILLING ADDRESS</span>
                              </h4>
                              <div className="grid grid-cols-3 gap-y-3">
                                <span className="text-slate-400 font-medium">Street Address</span>
                                <span className="col-span-2 text-slate-800 font-semibold">{dealerDetail.address || 'N/A'}</span>

                                <span className="text-slate-400 font-medium">City / Town</span>
                                <span className="col-span-2 text-slate-800 font-semibold">{dealerDetail.city || 'N/A'}</span>

                                <span className="text-slate-400 font-medium">State / Region</span>
                                <span className="col-span-2 text-slate-800 font-semibold">{dealerDetail.state || 'N/A'}</span>

                                <span className="text-slate-400 font-medium">Pincode</span>
                                <span className="col-span-2 text-slate-800 font-semibold">{dealerDetail.pincode || 'N/A'}</span>
                                
                                <span className="text-slate-400 font-medium">Area / Landmark</span>
                                <span className="col-span-2 text-slate-800 font-semibold">{dealerDetail.area || 'N/A'}</span>

                                <span className="text-slate-400 font-medium">Zones</span>
                                <span className="col-span-2">
                                  {dealerDetail.zones && dealerDetail.zones.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {dealerDetail.zones.map(z => (
                                        <span key={z} className="text-[10px] font-bold px-2.5 py-1 bg-rose-50 text-rose-700 rounded-lg border border-rose-100">{z}</span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-500 font-semibold">No zones assigned</span>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Box 3: Financial Details */}
                            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 space-y-4">
                              <h4 className="font-black text-slate-800 text-xs flex items-center space-x-2 border-b border-slate-200/60 pb-2">
                                <CreditCard className="w-4 h-4 text-rose-600" />
                                <span>FINANCIAL & GST INFO</span>
                              </h4>
                              <div className="grid grid-cols-3 gap-y-3">
                                <span className="text-slate-400 font-medium">GST Identification</span>
                                <span className="col-span-2 text-slate-800 font-semibold">{dealerDetail.gstNumber || 'N/A'}</span>

                                <span className="text-slate-400 font-medium">Dealer Tier</span>
                                <span className="col-span-2">
                                  {dealerDetail.dealerCategory ? (
                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
                                      dealerDetail.dealerCategory === 'SUPER' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                      dealerDetail.dealerCategory === 'PREMIUM' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                      dealerDetail.dealerCategory === 'GROWTH' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                      'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}>
                                      {dealerDetail.dealerCategory === 'SUPER' ? '⭐ SUPER' : dealerDetail.dealerCategory === 'PREMIUM' ? '🥇 PREMIUM' : dealerDetail.dealerCategory === 'GROWTH' ? '📈 GROWTH' : '🌱 STARTER'}
                                    </span>
                                  ) : <span className="text-slate-500 font-semibold">Not assigned</span>}
                                </span>

                                <span className="text-slate-400 font-medium">Initial Deposit</span>
                                <span className="col-span-2 text-slate-800 font-semibold">
                                  {dealerDetail.initialDeposit !== undefined && dealerDetail.initialDeposit !== null
                                    ? `₹${Number(dealerDetail.initialDeposit).toLocaleString('en-IN')}`
                                    : '₹0'}
                                </span>

                                <span className="text-slate-400 font-medium">Credit Limit</span>
                                <span className="col-span-2 text-slate-800 font-semibold">
                                  {dealerDetail.creditLimit !== undefined && dealerDetail.creditLimit !== null
                                    ? `₹${Number(dealerDetail.creditLimit).toLocaleString('en-IN')}` 
                                    : 'No Credit Limit Set'}
                                </span>

                                <span className="text-slate-400 font-medium">Categories</span>
                                <span className="col-span-2">
                                  {dealerDetail.categoryDetails && dealerDetail.categoryDetails.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {dealerDetail.categoryDetails.map(cat => (
                                        <span key={cat.id} className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">{cat.name}</span>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-500 font-semibold">No categories assigned</span>
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Box 4: Metadata / System Log */}
                            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 space-y-4">
                              <h4 className="font-black text-slate-800 text-xs flex items-center space-x-2 border-b border-slate-200/60 pb-2">
                                <Clock className="w-4 h-4 text-rose-600" />
                                <span>VERIFICATION LOGS</span>
                              </h4>
                              <div className="grid grid-cols-3 gap-y-3">
                                <span className="text-slate-400 font-medium">Registered on</span>
                                <span className="col-span-2 text-slate-800 font-semibold">
                                  {dealerDetail.createdAt ? new Date(dealerDetail.createdAt).toLocaleDateString() : 'N/A'}
                                </span>

                                <span className="text-slate-400 font-medium">Approved on</span>
                                <span className="col-span-2 text-slate-800 font-semibold">
                                  {dealerDetail.approvedAt ? new Date(dealerDetail.approvedAt).toLocaleString() : 'N/A'}
                                </span>

                                <span className="text-slate-400 font-medium">Approver User ID</span>
                                <span className="col-span-2 text-slate-800 font-semibold truncate">{dealerDetail.approvedBy || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Notes Section */}
                          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 space-y-2">
                            <h4 className="font-black text-slate-800 text-xs border-b border-slate-200/60 pb-2">ADMIN NOTES / REMARKS</h4>
                            <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                              {dealerDetail.notes || 'No administrative notes added to this profile yet.'}
                            </p>
                          </div>

                          {/* Change Password Section */}
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-4">
                            <h4 className="font-black text-slate-800 text-xs flex items-center space-x-2 border-b border-amber-200 pb-2">
                              <KeyRound className="w-4 h-4 text-amber-600" />
                              <span>RESET DEALER PASSWORD</span>
                            </h4>
                            <p className="text-[10px] text-amber-700 font-medium">
                              Set a new login password for <strong>{dealerDetail.companyName}</strong>. The dealer will be notified via their account.
                            </p>

                            {pwMessage.text && (
                              <div className={`px-3 py-2.5 rounded-lg text-[11px] font-semibold flex items-center space-x-2 ${
                                pwMessage.type === 'success'
                                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                                  : 'bg-rose-50 border border-rose-200 text-rose-800'
                              }`}>
                                <span>{pwMessage.type === 'success' ? '✓' : '!'}</span>
                                <span>{pwMessage.text}</span>
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">New Password</label>
                                <div className="relative">
                                  <input
                                    type={pwShowNew ? 'text' : 'password'}
                                    value={pwNew}
                                    onChange={e => { setPwNew(e.target.value); setPwMessage({ text: '', type: '' }); }}
                                    placeholder="Min. 6 characters"
                                    className="w-full pr-9 pl-3 py-2 text-xs bg-white border border-amber-200 focus:border-amber-400 rounded-lg focus:outline-none transition-all"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setPwShowNew(v => !v)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                  >
                                    {pwShowNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                                {/* Strength bar */}
                                {pwNew.length > 0 && (
                                  <div className="mt-1.5 flex space-x-1">
                                    {[1,2,3,4].map(i => (
                                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                                        pwNew.length >= i * 3
                                          ? i <= 1 ? 'bg-rose-400'
                                            : i <= 2 ? 'bg-amber-400'
                                            : i <= 3 ? 'bg-blue-400'
                                            : 'bg-emerald-500'
                                          : 'bg-slate-200'
                                      }`} />
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">Confirm Password</label>
                                <div className="relative">
                                  <input
                                    type={pwShowConfirm ? 'text' : 'password'}
                                    value={pwConfirm}
                                    onChange={e => { setPwConfirm(e.target.value); setPwMessage({ text: '', type: '' }); }}
                                    placeholder="Re-enter password"
                                    className={`w-full pr-9 pl-3 py-2 text-xs border rounded-lg focus:outline-none transition-all ${
                                      pwConfirm.length > 0 && pwNew !== pwConfirm
                                        ? 'border-rose-300 bg-rose-50/30 focus:border-rose-400'
                                        : 'bg-white border-amber-200 focus:border-amber-400'
                                    }`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setPwShowConfirm(v => !v)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                  >
                                    {pwShowConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                                {pwConfirm.length > 0 && pwNew !== pwConfirm && (
                                  <p className="text-[10px] text-rose-600 font-semibold mt-1">⚠ Passwords do not match</p>
                                )}
                                {pwConfirm.length > 0 && pwNew === pwConfirm && pwNew.length >= 6 && (
                                  <p className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Passwords match</p>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={!pwNew || !pwConfirm || pwNew !== pwConfirm || pwNew.length < 6 || pwLoading}
                              onClick={async () => {
                                setPwLoading(true);
                                setPwMessage({ text: '', type: '' });
                                try {
                                  const res = await axios.patch(`/dealers/${dealerDetail.id}/change-password`, { newPassword: pwNew });
                                  setPwMessage({ text: res.data.message || 'Password updated successfully!', type: 'success' });
                                  setPwNew('');
                                  setPwConfirm('');
                                } catch (err) {
                                  setPwMessage({ text: err.response?.data?.message || 'Failed to update password.', type: 'error' });
                                } finally {
                                  setPwLoading(false);
                                }
                              }}
                              className="w-full flex items-center justify-center space-x-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 disabled:cursor-not-allowed text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm"
                            >
                              {pwLoading ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  <span>Updating Password...</span>
                                </>
                              ) : (
                                <>
                                  <KeyRound className="w-3.5 h-3.5" />
                                  <span>Update Password</span>
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Registered Stores */}
                  {activeTab === 'stores' && (
                    <div className="space-y-4 text-xs animate-fade-in">
                      {(!dealerDetail.stores || dealerDetail.stores.length === 0) ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <Store className="w-10 h-10 text-slate-300" />
                          <p className="font-semibold text-xs">No registered outlets found for this dealer partner.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {dealerDetail.stores.map((store) => (
                            <div key={store.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 relative overflow-hidden shadow-sm">
                              <div className="flex justify-between items-start">
                                <h5 className="font-black text-slate-800 text-xs flex items-center space-x-1.5">
                                  <Store className="w-4 h-4 text-rose-600 shrink-0" />
                                  <span>{store.name}</span>
                                </h5>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  store.isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {store.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <div className="space-y-1.5 text-slate-600 text-[11px] border-t border-slate-100 pt-2.5">
                                <p className="flex items-center space-x-2">
                                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>GST: <strong className="text-slate-800">{store.gstNumber || 'N/A'}</strong></span>
                                </p>
                                <p className="flex items-center space-x-2">
                                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{store.phone || 'N/A'}</span>
                                </p>
                                <p className="flex items-center space-x-2">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{store.address}, {store.city}, {store.state} - {store.pincode}</span>
                                </p>
                                {store.zone && (
                                  <p className="text-[10px] text-slate-400 mt-1">Zone: {store.zone}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: Current Inventory Stock */}
                  {activeTab === 'inventory' && (
                    <div className="space-y-4 text-xs animate-fade-in">
                      {(!dealerDetail.inventory || dealerDetail.inventory.length === 0) ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                          <Package className="w-10 h-10 text-slate-300" />
                          <p className="font-semibold text-xs">No inventory stock allocated to this dealer partner.</p>
                        </div>
                      ) : (
                        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                                  <th className="p-3 px-4">Product Name</th>
                                  <th className="p-3">SKU</th>
                                  <th className="p-3 text-right">In-Stock Quantity</th>
                                  <th className="p-3 text-right">Unit Price</th>
                                  <th className="p-3 text-right">Total Est. Value</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700">
                                {dealerDetail.inventory.map((inv) => {
                                  const prod = inv.product || {};
                                  const totalValue = (inv.quantity || 0) * (prod.price || 0);
                                  return (
                                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="p-3 px-4 font-bold text-slate-800">
                                        {prod.name || 'Unknown Product'}
                                      </td>
                                      <td className="p-3 font-mono text-[10px] text-slate-500">
                                        {prod.sku || 'N/A'}
                                      </td>
                                      <td className="p-3 text-right font-black text-slate-800">
                                        {inv.quantity} <span className="text-[10px] text-slate-400 font-normal">{prod.unit || 'PCS'}</span>
                                      </td>
                                      <td className="p-3 text-right font-semibold">
                                        ₹{(prod.price || 0).toLocaleString('en-IN')}
                                      </td>
                                      <td className="p-3 text-right font-black text-rose-600">
                                        ₹{totalValue.toLocaleString('en-IN')}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </>
            ) : (
              <div className="flex-1 p-12 text-center text-slate-400 text-xs font-semibold">
                Failed to load dealer profile.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
