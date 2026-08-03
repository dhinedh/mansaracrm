// src/pages/admin/DealersPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  IndianRupee,
  Trash2,
  Truck
} from 'lucide-react';
import ZoneSelectionMap from '../../components/ZoneSelectionMap';

const DEALER_FIELDS = [
  // Contact details
  { key: 'companyName', label: 'Company / Firm Name', type: 'text', section: 'contact', required: true },
  { key: 'phone', label: 'Phone Number', type: 'text', section: 'contact', required: true },
  
  // Address details
  { key: 'address', label: 'Street Address', type: 'textarea', section: 'address', required: true },
  { key: 'city', label: 'City / Town', type: 'text', section: 'address' },
  { key: 'state', label: 'State / Region', type: 'text', section: 'address' },
  { key: 'pincode', label: 'Pincode', type: 'text', section: 'address' },
  { key: 'area', label: 'Area / Landmark', type: 'text', section: 'address' },

  // Financial details
  { key: 'gstNumber', label: 'GST Identification', type: 'text', section: 'financial' },
  { key: 'dealerType', label: 'Dealer Type', type: 'select', section: 'financial', options: [
      { value: 'RETAIL', label: 'Retail' },
      { value: 'WHOLESALE', label: 'Wholesale' },
      { value: 'DISTRIBUTOR', label: 'Distributor' },
      { value: 'SUPER_DISTRIBUTOR', label: 'Super Distributor' }
    ]
  },
  { key: 'dealerCategory', label: 'Dealer Tier / Category', type: 'select', section: 'financial', options: [
      { value: 'STARTER', label: 'Starter' },
      { value: 'GROWTH', label: 'Growth' },
      { value: 'PREMIUM', label: 'Premium' },
      { value: 'SUPER', label: 'Super' }
    ]
  },
  { key: 'initialDeposit', label: 'Initial Deposit (₹)', type: 'number', section: 'financial' },
  { key: 'creditLimit', label: 'Credit Limit (₹)', type: 'number', section: 'financial' },
  { key: 'billingProfile', label: 'Billing Profile', type: 'billingProfile', section: 'financial' },
  { key: 'defaultMargin', label: 'Default Margin (%)', type: 'number', section: 'financial', defaultValue: 10 },
  
  // System / notes
  { key: 'notes', label: 'Admin Remarks / Notes', type: 'textarea', section: 'notes' },
];

export default function DealersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Proximity Map states
  const [showDirectoryMap, setShowDirectoryMap] = useState(false);
  const [mapZoneFilter, setMapZoneFilter] = useState(null);

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
  const [editForm, setEditForm] = useState({});
  const [editZoneInput, setEditZoneInput] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [zoneConflicts, setZoneConflicts] = useState([]);
  const [editZoneConflicts, setEditZoneConflicts] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [showEditMap, setShowEditMap] = useState(false);

  const handleFieldChange = (key, value) => {
    setEditForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderEditField = (field) => {
    const value = editForm[field.key] ?? '';
    
    if (field.type === 'billingProfile') {
      return (
        <div key={field.key} className="col-span-1 sm:col-span-2">
          <label className="block text-slate-500 font-bold mb-2">{field.label}</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'NORMAL', label: '📄 Normal', desc: 'Invoice on delivery' },
              { value: 'ADVANCE', label: '⚡ Advance', desc: 'Payment before dispatch' }
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleFieldChange('billingProfile', opt.value)}
                className={`py-2.5 px-3 rounded-xl text-[11px] font-black border transition-all text-left cursor-pointer ${
                  editForm.billingProfile === opt.value
                    ? opt.value === 'ADVANCE'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-700 text-white border-slate-700 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-rose-300'
                }`}
              >
                <div>{opt.label}</div>
                <div className={`text-[9px] font-medium mt-0.5 ${editForm.billingProfile === opt.value ? 'opacity-80' : 'text-slate-400'}`}>{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (field.type === 'select') {
      return (
        <div key={field.key}>
          <label className="block text-slate-500 font-bold mb-1">{field.label}</label>
          <select
            value={value}
            onChange={e => handleFieldChange(field.key, e.target.value)}
            className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer"
          >
            {field.options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === 'textarea') {
      return (
        <div key={field.key} className="col-span-1 sm:col-span-2">
          <label className="block text-slate-500 font-bold mb-1">{field.label}</label>
          <textarea
            required={field.required}
            value={value}
            onChange={e => handleFieldChange(field.key, e.target.value)}
            rows="2"
            className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none"
          />
        </div>
      );
    }

    return (
      <div key={field.key}>
        <label className="block text-slate-500 font-bold mb-1">{field.label}</label>
        <input
          type={field.type}
          required={field.required}
          value={value}
          onChange={e => handleFieldChange(field.key, e.target.value)}
          className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none"
        />
      </div>
    );
  };

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
  const [defaultMargin, setDefaultMargin] = useState(10);
  const [billingProfile, setBillingProfile] = useState('NORMAL');
  const [margins, setMargins] = useState([]);
  const [marginsLoading, setMarginsLoading] = useState(false);
  const [productsList, setProductsList] = useState([]);
  const [newMarginType, setNewMarginType] = useState('DEFAULT');
  const [newMarginStoreId, setNewMarginStoreId] = useState('');
  const [newMarginProductId, setNewMarginProductId] = useState('');
  const [newMarginCategoryId, setNewMarginCategoryId] = useState('');
  const [newMarginPercent, setNewMarginPercent] = useState('');
  const [newMarginSubmitting, setNewMarginSubmitting] = useState(false);
  const [newMarginError, setNewMarginError] = useState('');
  const [newMarginSuccess, setNewMarginSuccess] = useState('');

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
    const editZones = editForm.zones || [];
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
  }, [editForm.zones, dealerDetail]);

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
    const initialForm = {};
    DEALER_FIELDS.forEach(field => {
      initialForm[field.key] = dealerDetail[field.key] ?? field.defaultValue ?? '';
    });
    // Special nested fields/arrays
    initialForm.name = dealerDetail.user?.name || '';
    initialForm.zones = dealerDetail.zones || [];
    initialForm.categories = dealerDetail.categories || [];
    setEditForm(initialForm);
    setEditZoneInput('');
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
      const payload = {
        name: editForm.name,
        zones: editForm.zones,
        categories: editForm.categories,
      };

      DEALER_FIELDS.forEach(field => {
        let val = editForm[field.key];
        if (field.type === 'number') {
          val = val !== '' && val !== null && val !== undefined ? parseFloat(val) : null;
        }
        payload[field.key] = val;
      });

      const res = await axios.put(`/dealers/${dealerDetail.id}`, payload);
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
    if (trimmed && !(editForm.zones || []).includes(trimmed)) {
      setEditForm(prev => ({
        ...prev,
        zones: [...(prev.zones || []), trimmed]
      }));
    }
    setEditZoneInput('');
  };

  const removeEditZone = (z) => {
    setEditForm(prev => ({
      ...prev,
      zones: (prev.zones || []).filter(x => x !== z)
    }));
  };

  const toggleEditCategory = (id) => {
    setEditForm(prev => {
      const current = prev.categories || [];
      const updated = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
      return {
        ...prev,
        categories: updated
      };
    });
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

  const fetchMargins = async () => {
    if (!dealerDetail?.id) return;
    setMarginsLoading(true);
    try {
      const res = await axios.get(`/margins?dealerId=${dealerDetail.id}`);
      if (res.data.success) {
        setMargins(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch margins', err);
    } finally {
      setMarginsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/products');
      setProductsList(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  const handleDeleteMargin = async (id) => {
    if (!window.confirm('Are you sure you want to delete this margin rule?')) return;
    try {
      const res = await axios.delete(`/margins/${id}`);
      if (res.data.success) {
        fetchMargins();
      }
    } catch (err) {
      console.error('Failed to delete margin', err);
      alert(err.response?.data?.message || 'Failed to delete margin');
    }
  };

  const handleAddMargin = async (e) => {
    e.preventDefault();
    setNewMarginError('');
    setNewMarginSuccess('');
    setNewMarginSubmitting(true);

    try {
      const payload = {
        dealerId: dealerDetail.id,
        marginPercent: parseFloat(newMarginPercent),
        isDefault: newMarginType === 'DEFAULT'
      };

      if (newMarginType === 'STORE') {
        payload.storeId = newMarginStoreId;
      } else if (newMarginType === 'PRODUCT') {
        payload.productId = newMarginProductId;
      } else if (newMarginType === 'CATEGORY') {
        payload.categoryId = newMarginCategoryId;
      }

      const res = await axios.post('/margins', payload);
      if (res.data.success) {
        setNewMarginSuccess('Margin rule saved successfully!');
        setNewMarginPercent('');
        setNewMarginStoreId('');
        setNewMarginProductId('');
        setNewMarginCategoryId('');
        fetchMargins();
        setTimeout(() => setNewMarginSuccess(''), 2000);
      }
    } catch (err) {
      console.error('Failed to save margin', err);
      setNewMarginError(err.response?.data?.message || 'Failed to save margin rule');
    } finally {
      setNewMarginSubmitting(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'margins' && dealerDetail?.id) {
      fetchMargins();
      fetchProducts();
      fetchCategories();
    }
  }, [activeTab, dealerDetail]);

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
        categories: selectedCategories,
        defaultMargin: parseFloat(defaultMargin),
        billingProfile
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
    setDefaultMargin(10);
    setBillingProfile('NORMAL');
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

  const displayedDealers = dealers.filter(d => {
    if (!mapZoneFilter) return true;
    return d.zones && d.zones.includes(mapZoneFilter);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Partner Dealers Directory</h2>
          <p className="text-slate-500 text-xs">Manage verification pipeline, add details, and toggle dealer status.</p>
        </div>
        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowDirectoryMap(!showDirectoryMap)}
            className={`inline-flex items-center space-x-2 text-xs font-bold px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
              showDirectoryMap
                ? 'bg-rose-50 border-rose-200 text-rose-700 font-black shadow-sm'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{showDirectoryMap ? 'Hide Map Filter' : 'Proximity Map Filter'}</span>
          </button>
          
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Dealer</span>
          </button>
        </div>
      </div>

      {showDirectoryMap && (
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm animate-fade-in space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4.5 h-4.5 text-rose-600" />
              <span>Proximity Zone Filter</span>
            </h3>
            {mapZoneFilter && (
              <button
                type="button"
                onClick={() => setMapZoneFilter(null)}
                className="text-[10px] font-black text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg border border-rose-200 transition-all cursor-pointer"
              >
                ✕ Clear Filter ({mapZoneFilter})
              </button>
            )}
          </div>
          
          <ZoneSelectionMap
            selectedZones={mapZoneFilter ? [mapZoneFilter] : []}
            onToggleZone={(z) => setMapZoneFilter(mapZoneFilter === z ? null : z)}
            zoneConflicts={dealers.map(d => ({
              companyName: d.companyName,
              zones: d.zones || []
            }))}
          />
        </div>
      )}

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
          {displayedDealers.map((dealer) => (
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
                  <div className="flex items-center space-x-2">
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

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (dealer.user?.isActive) {
                          navigate('/admin/transfers', { state: { dealerId: dealer.id } });
                        }
                      }}
                      disabled={!dealer.user?.isActive}
                      className={`inline-flex items-center space-x-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition ${
                        dealer.user?.isActive
                          ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 cursor-pointer'
                          : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Transfer Request</span>
                    </button>
                  </div>
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
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Default Margin (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={defaultMargin}
                    onChange={e => setDefaultMargin(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-2">Billing Profile</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'NORMAL', label: '📄 Normal', desc: 'Invoice on delivery' },
                      { value: 'ADVANCE', label: '⚡ Advance', desc: 'Payment before dispatch' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setBillingProfile(opt.value)}
                        className={`py-2.5 px-3 rounded-xl text-[11px] font-black border transition-all text-left ${
                          billingProfile === opt.value
                            ? opt.value === 'ADVANCE'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-700 text-white border-slate-700 shadow-sm'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-rose-300'
                        }`}
                      >
                        <div>{opt.label}</div>
                        <div className={`text-[9px] font-medium mt-0.5 ${billingProfile === opt.value ? 'opacity-80' : 'text-slate-400'}`}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
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
                      isGrowthPartner={dealerCategory === 'GROWTH'}
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
                  <button
                    onClick={() => setActiveTab('margins')}
                    className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold border-b-2 -mb-px transition-all ${
                      activeTab === 'margins'
                        ? 'border-rose-600 text-rose-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Tag className="w-4 h-4" />
                    <span>Price Margins</span>
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

                          {/* Dynamic fields layout */}
                          <div className="space-y-4">
                            {/* Group 1: Primary Identity & Contact */}
                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                              <h5 className="font-black text-slate-700 text-[10px] uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center space-x-1.5">
                                <User className="w-3.5 h-3.5 text-rose-600" />
                                <span>Primary Contact & Company</span>
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-slate-500 font-bold mb-1">Dealer Contact Name *</label>
                                  <input
                                    type="text"
                                    required
                                    value={editForm.name || ''}
                                    onChange={e => handleFieldChange('name', e.target.value)}
                                    className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none"
                                  />
                                </div>
                                {DEALER_FIELDS.filter(f => f.section === 'contact').map(field => renderEditField(field))}
                              </div>
                            </div>

                            {/* Group 2: Office & Billing Location */}
                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                              <h5 className="font-black text-slate-700 text-[10px] uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center space-x-1.5">
                                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                                <span>Office / Billing Address</span>
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {DEALER_FIELDS.filter(f => f.section === 'address').map(field => renderEditField(field))}
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
                                      selectedZones={editForm.zones || []}
                                      onToggleZone={z => (editForm.zones || []).includes(z) ? removeEditZone(z) : addEditZone(z)}
                                      zoneConflicts={editZoneConflicts}
                                      isGrowthPartner={editForm.dealerCategory === 'GROWTH'}
                                    />
                                  </div>
                                )}

                                <div className="border border-slate-200 rounded-xl bg-white p-2.5 min-h-[42px] flex flex-wrap gap-1.5 items-center focus-within:border-rose-500 transition-all">
                                  {(editForm.zones || []).map(z => (
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
                                    placeholder={(editForm.zones || []).length === 0 ? "Type zone name, press Enter..." : "Add zone..."}
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
                            </div>

                            {/* Group 3: Financial & Dealer Configuration */}
                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                              <h5 className="font-black text-slate-700 text-[10px] uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center space-x-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-rose-600" />
                                <span>Financial & Margin Config</span>
                              </h5>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {DEALER_FIELDS.filter(f => f.section === 'financial').map(field => renderEditField(field))}
                              </div>

                              {/* Category Multi-select */}
                              <div>
                                <label className="block text-slate-500 font-bold mb-2">Dealer Product Categories</label>
                                <div className="flex flex-wrap gap-2">
                                  {categoryList.map(cat => {
                                    const isSelected = (editForm.categories || []).includes(cat.id);
                                    return (
                                      <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => toggleEditCategory(cat.id)}
                                        className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${
                                          isSelected
                                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-rose-400 hover:text-rose-600'
                                        }`}
                                      >
                                        {isSelected && '✓ '}{cat.name}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Group 4: Administrative Notes */}
                            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                              <h5 className="font-black text-slate-700 text-[10px] uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center space-x-1.5">
                                <FileText className="w-3.5 h-3.5 text-rose-600" />
                                <span>Remarks & Notes</span>
                              </h5>
                              <div className="grid grid-cols-1">
                                {DEALER_FIELDS.filter(f => f.section === 'notes').map(field => renderEditField(field))}
                              </div>
                            </div>
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
                                <span className="text-slate-400 font-medium">Dealer Contact Name</span>
                                <span className="col-span-2 text-slate-800 font-semibold">{dealerDetail.user?.name || 'N/A'}</span>

                                {DEALER_FIELDS.filter(f => f.section === 'contact').map(field => (
                                  <React.Fragment key={field.key}>
                                    <span className="text-slate-400 font-medium">{field.label}</span>
                                    <span className="col-span-2 text-slate-800 font-semibold">{dealerDetail[field.key] || 'N/A'}</span>
                                  </React.Fragment>
                                ))}

                                <span className="text-slate-400 font-medium">Email Address</span>
                                <span className="col-span-2 text-slate-800 font-semibold truncate">{dealerDetail.user?.email || 'N/A'}</span>
                                
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
                                {DEALER_FIELDS.filter(f => f.section === 'address').map(field => (
                                  <React.Fragment key={field.key}>
                                    <span className="text-slate-400 font-medium">{field.label}</span>
                                    <span className="col-span-2 text-slate-800 font-semibold">{dealerDetail[field.key] || 'N/A'}</span>
                                  </React.Fragment>
                                ))}

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
                                {DEALER_FIELDS.filter(f => f.section === 'financial').map(field => {
                                  let value = dealerDetail[field.key];
                                  
                                  if (field.key === 'billingProfile') {
                                    return (
                                      <React.Fragment key={field.key}>
                                        <span className="text-slate-400 font-medium">{field.label}</span>
                                        <span className="col-span-2">
                                          {value === 'ADVANCE' ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-200">
                                              ⚡ ADVANCE — Payment before dispatch
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                                              📄 NORMAL — Invoice on delivery
                                            </span>
                                          )}
                                        </span>
                                      </React.Fragment>
                                    );
                                  }
                                  
                                  if (field.key === 'dealerCategory') {
                                    return (
                                      <React.Fragment key={field.key}>
                                        <span className="text-slate-400 font-medium">{field.label}</span>
                                        <span className="col-span-2">
                                          {value ? (
                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${
                                              value === 'SUPER' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                              value === 'PREMIUM' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                              value === 'GROWTH' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                              'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                              {value === 'SUPER' ? '⭐ SUPER' : value === 'PREMIUM' ? '🥇 PREMIUM' : value === 'GROWTH' ? '📈 GROWTH' : '🌱 STARTER'}
                                            </span>
                                          ) : <span className="text-slate-500 font-semibold">Not assigned</span>}
                                        </span>
                                      </React.Fragment>
                                    );
                                  }

                                  if (field.type === 'number') {
                                    if (value !== undefined && value !== null && value !== '') {
                                      if (field.key === 'defaultMargin') {
                                        value = `${value}%`;
                                      } else {
                                        value = `₹${Number(value).toLocaleString('en-IN')}`;
                                      }
                                    } else {
                                      value = field.key === 'creditLimit' ? 'No Credit Limit Set' : 'N/A';
                                    }
                                  }

                                  return (
                                    <React.Fragment key={field.key}>
                                      <span className="text-slate-400 font-medium">{field.label}</span>
                                      <span className="col-span-2 text-slate-800 font-semibold">{value ?? 'N/A'}</span>
                                    </React.Fragment>
                                  );
                                })}

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

                  {/* Tab 4: Price Margins */}
                  {activeTab === 'margins' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-xs">
                      {/* Left Column: Margins List */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 space-y-4">
                          <h4 className="font-black text-slate-800 text-xs flex items-center space-x-2 border-b border-slate-200/60 pb-2">
                            <Tag className="w-4 h-4 text-rose-600" />
                            <span>DEALER MARGIN RULES</span>
                          </h4>

                          {marginsLoading ? (
                            <div className="flex items-center justify-center py-12">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-rose-600"></div>
                            </div>
                          ) : margins.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2 bg-white rounded-xl border border-dashed border-slate-200">
                              <Tag className="w-8 h-8 text-slate-300" />
                              <p className="font-semibold text-xs">No custom margin rules defined yet.</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {margins.map((rule) => {
                                let typeLabel = 'Default Fallback';
                                let targetName = 'Applies to all transactions';
                                let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';

                                if (rule.isDefault) {
                                  typeLabel = 'Default Fallback';
                                  badgeClass = 'bg-rose-50 text-rose-700 border-rose-100';
                                } else if (rule.storeId) {
                                  typeLabel = 'Store Specific';
                                  targetName = rule.store?.name || 'Unknown Store';
                                  badgeClass = 'bg-blue-50 text-blue-700 border-blue-100';
                                } else if (rule.productId) {
                                  typeLabel = 'Product Specific';
                                  targetName = rule.product?.name || 'Unknown Product';
                                  badgeClass = 'bg-amber-50 text-amber-700 border-amber-100';
                                } else if (rule.categoryId) {
                                  typeLabel = 'Category Specific';
                                  const cat = categoryList.find(c => c.id === rule.categoryId);
                                  targetName = cat?.name || 'Unknown Category';
                                  badgeClass = 'bg-purple-50 text-purple-700 border-purple-100';
                                }

                                return (
                                  <div key={rule.id} className="flex items-center justify-between p-4 bg-white border border-slate-150 rounded-2xl hover:shadow-sm transition-shadow">
                                    <div className="space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${badgeClass}`}>
                                          {typeLabel}
                                        </span>
                                        {!rule.isDefault && (
                                          <span className="font-bold text-slate-800 text-xs">{targetName}</span>
                                        )}
                                      </div>
                                      {rule.isDefault && (
                                        <p className="text-slate-400 text-[10px]">{targetName}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-4">
                                      <span className="text-sm font-black text-rose-600">{rule.marginPercent}%</span>
                                      <button
                                        onClick={() => handleDeleteMargin(rule.id)}
                                        className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 transition-colors"
                                        title="Delete Rule"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Column: Add Margin Form */}
                      <div className="space-y-4">
                        <form onSubmit={handleAddMargin} className="bg-slate-50 border border-slate-200/60 rounded-xl p-5 space-y-4">
                          <h4 className="font-black text-slate-800 text-xs flex items-center space-x-2 border-b border-slate-200/60 pb-2">
                            <Plus className="w-4 h-4 text-rose-600" />
                            <span>ADD MARGIN RULE</span>
                          </h4>

                          {newMarginError && (
                            <div className="px-3 py-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg font-semibold text-[10px]">
                              {newMarginError}
                            </div>
                          )}

                          {newMarginSuccess && (
                            <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-semibold text-[10px]">
                              {newMarginSuccess}
                            </div>
                          )}

                          <div className="space-y-3">
                            <div>
                              <label className="block text-slate-500 font-bold mb-1">Rule Type</label>
                              <select
                                value={newMarginType}
                                onChange={e => {
                                  setNewMarginType(e.target.value);
                                  setNewMarginStoreId('');
                                  setNewMarginProductId('');
                                  setNewMarginCategoryId('');
                                }}
                                className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer"
                              >
                                <option value="DEFAULT">Default Fallback</option>
                                <option value="STORE">Store Specific</option>
                                <option value="PRODUCT">Product Specific</option>
                                <option value="CATEGORY">Category Specific</option>
                              </select>
                            </div>

                            {newMarginType === 'STORE' && (
                              <div>
                                <label className="block text-slate-500 font-bold mb-1">Select Store / Outlet</label>
                                <select
                                  required
                                  value={newMarginStoreId}
                                  onChange={e => setNewMarginStoreId(e.target.value)}
                                  className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer"
                                >
                                  <option value="">-- Select Store --</option>
                                  {(dealerDetail.stores || []).map(store => (
                                    <option key={store.id} value={store.id}>{store.name}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {newMarginType === 'PRODUCT' && (
                              <div>
                                <label className="block text-slate-500 font-bold mb-1">Select Product</label>
                                <select
                                  required
                                  value={newMarginProductId}
                                  onChange={e => setNewMarginProductId(e.target.value)}
                                  className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer"
                                >
                                  <option value="">-- Select Product --</option>
                                  {productsList.map(prod => (
                                    <option key={prod.id} value={prod.id}>{prod.name} ({prod.sku})</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {newMarginType === 'CATEGORY' && (
                              <div>
                                <label className="block text-slate-500 font-bold mb-1">Select Category</label>
                                <select
                                  required
                                  value={newMarginCategoryId}
                                  onChange={e => setNewMarginCategoryId(e.target.value)}
                                  className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer"
                                >
                                  <option value="">-- Select Category --</option>
                                  {categoryList.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <div>
                              <label className="block text-slate-500 font-bold mb-1">Margin Percentage (%)</label>
                              <input
                                type="number"
                                required
                                min="0"
                                max="100"
                                step="0.01"
                                value={newMarginPercent}
                                onChange={e => setNewMarginPercent(e.target.value)}
                                placeholder="e.g. 12.5"
                                className="w-full p-2.5 bg-white border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={newMarginSubmitting}
                              className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2"
                            >
                              {newMarginSubmitting ? 'Saving Rule...' : 'Save Margin Rule'}
                            </button>
                          </div>
                        </form>
                      </div>
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
