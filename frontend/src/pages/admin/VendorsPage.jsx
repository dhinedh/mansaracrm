// src/pages/admin/VendorsPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { getStoredVendorCategories, getFlatCategoryOptions } from '../../utils/vendorCategoriesStore';
import {
  Building2,
  Plus,
  Search,
  FileText,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Edit3,
  Trash2,
  Eye,
  Filter,
  Briefcase,
  ShieldCheck,
  Package,
  Layers,
  ChevronRight,
  ChevronDown,
  Sparkles,
  AlertCircle,
  Printer,
  PenTool,
  Save,
  RotateCcw
} from 'lucide-react';

const DEFAULT_COMPANY_TYPES = [
  'Private Ltd',
  'Proprietorship',
  'Partnership',
  'LLP',
  'Public Ltd',
  'Other'
];

const DEFAULT_SUPPLY_CATEGORIES = [
  'Raw Materials (Spices, Grains, Oils)',
  'Packaging Materials (Pouches, Boxes, Tape)',
  'Labeling & Printing (Nutritional Labels, Barcodes)',
  'Equipment & Machinery',
  'Logistics & Transportation',
  'Services & Maintenance',
  'Other'
];

const DEFAULT_AGREEMENT_TERMS = [
  'Quality Assurance & Standards: The Supplier agrees that all goods, raw materials, packaging materials, and services supplied shall strictly adhere to FSSAI standards, ISO benchmarks, and Mansara Foods quality specifications.',
  'Delivery & Timelines: Deliveries must be completed as per Purchase Orders issued by the Company. Any delay exceeding 48 hours without prior notice may incur penalty charges as per company procurement rules.',
  'Invoicing & Payment Terms: Invoices must clearly mention GSTIN and Purchase Order numbers. Payments will be disbursed directly into the registered bank account within the agreed billing cycle upon quality verification.',
  'Confidentiality & Compliance: Both parties agree to maintain strict confidentiality regarding pricing structures, proprietary recipes, trade secrets, and operational workflows.',
  'Term & Termination: This MOU is effective for 12 months from the date of signing and automatically renews unless terminated by either party with a 30-day written notice.'
];

// ── Vendor Category & Sub-Category Picker Component ──────────────────────────
function VendorCategorySubCategoryPicker({
  mainCategory,
  subCategories = [],
  onMainCategoryChange,
  onSubCategoriesChange
}) {
  const masterCategories = getStoredVendorCategories();
  const [customInput, setCustomInput] = useState('');

  const matchedMaster = masterCategories.find(c => c.name === mainCategory);
  const availableSubCategories = matchedMaster?.subCategories || [];

  const handleToggleSub = (subName) => {
    if (subCategories.includes(subName)) {
      onSubCategoriesChange(subCategories.filter(s => s !== subName));
    } else {
      onSubCategoriesChange([...subCategories, subName]);
    }
  };

  const handleRemoveSub = (subName) => {
    onSubCategoriesChange(subCategories.filter(s => s !== subName));
  };

  const handleAddCustomSub = (e) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!subCategories.includes(trimmed)) {
      onSubCategoriesChange([...subCategories, trimmed]);
    }
    setCustomInput('');
  };

  return (
    <div className="space-y-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200 text-xs">
      {/* Main Category Selection */}
      <div>
        <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
          <span>Main Supply Category *</span>
          <span className="text-[10px] text-slate-400 font-normal">Select Main Category Stream</span>
        </label>
        <select
          value={mainCategory}
          onChange={(e) => {
            const newCat = e.target.value;
            onMainCategoryChange(newCat);
            const matched = masterCategories.find(c => c.name === newCat);
            if (matched?.subCategories) {
              onSubCategoriesChange([...matched.subCategories]);
            } else {
              onSubCategoriesChange([]);
            }
          }}
          className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none shadow-sm"
        >
          {masterCategories.map(cat => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sub-Categories Selection */}
      <div className="space-y-2">
        <label className="block text-slate-700 font-bold flex items-center justify-between">
          <span>Sub-Categories ({subCategories.length} Selected)</span>
          <span className="text-[10px] text-slate-400 font-normal">Click tag to add or click ✕ to remove</span>
        </label>

        {/* Selected Active Sub-Category Chips (with ✕ remove button) */}
        {subCategories.length > 0 ? (
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Active Vendor Sub-Categories:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {subCategories.map((sub, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs rounded-xl shadow-xs"
                >
                  <span>{sub}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSub(sub)}
                    className="text-rose-400 hover:text-rose-700 font-black text-xs cursor-pointer hover:scale-110 transition-transform"
                    title={`Remove "${sub}" from vendor`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl text-amber-800 text-[11px] font-medium italic">
            No sub-categories currently selected for this vendor. Click available tags below to add.
          </div>
        )}

        {/* Available Sub-Categories Checklist Chips */}
        {availableSubCategories.length > 0 && (
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-bold text-slate-500 block">
              Available under "{mainCategory}":
            </span>
            <div className="flex flex-wrap gap-1.5">
              {availableSubCategories.map((sub, idx) => {
                const isSelected = subCategories.includes(sub);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleToggleSub(sub)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {sub}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Add Custom Sub-Category */}
        <div className="pt-2 flex gap-2">
          <input
            type="text"
            placeholder="Type custom sub-category name..."
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-400 font-medium"
          />
          <button
            type="button"
            onClick={handleAddCustomSub}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            + Add Custom
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Searchable & Creatable Combobox Component ─────────────────────────────────
function SearchableCreatableSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Search or type new category...',
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customOptions, setCustomOptions] = useState([]);
  const wrapperRef = useRef(null);

  // Combine default options with any custom created ones
  const allOptions = Array.from(new Set([...options, ...customOptions]));

  // Filter options based on search term
  const filteredOptions = allOptions.filter(opt =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if search term exact match exists
  const exactMatchExists = allOptions.some(
    opt => opt.toLowerCase() === searchTerm.trim().toLowerCase()
  );

  // Handle clicking outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOption = (opt) => {
    onChange(opt);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleAddCustom = () => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;
    setCustomOptions(prev => [...prev, trimmed]);
    onChange(trimmed);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && <label className="block text-slate-700 font-bold mb-1">{label}</label>}
      
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold flex items-center justify-between cursor-pointer focus-within:ring-2 focus-within:ring-rose-500 focus-within:bg-white transition-all shadow-sm"
      >
        <div className="flex items-center space-x-2 truncate">
          <Layers className="w-4 h-4 text-rose-600 shrink-0" />
          <span className={value ? "text-slate-800" : "text-slate-400 font-medium"}>
            {value || placeholder}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in text-xs">
          {/* Search Input Box */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Type to search or add new category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none text-xs font-semibold focus:outline-none text-slate-800 placeholder-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-slate-400 hover:text-slate-600 font-bold px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-52 overflow-y-auto divide-y divide-slate-50">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt}
                  onClick={() => handleSelectOption(opt)}
                  className={`px-4 py-2.5 hover:bg-rose-50 hover:text-rose-700 cursor-pointer flex items-center justify-between font-bold transition-colors ${
                    value === opt ? "bg-rose-50 text-rose-700" : "text-slate-700"
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {value === opt && <CheckCircle2 className="w-3.5 h-3.5 text-rose-600 shrink-0 ml-2" />}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-slate-400 font-semibold italic text-[11px]">
                No matching supply category found in database
              </div>
            )}

            {/* Add New Custom Category Button */}
            {searchTerm.trim().length > 0 && !exactMatchExists && (
              <button
                type="button"
                onClick={handleAddCustom}
                className="w-full px-4 py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-black flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add "{searchTerm.trim()}" to Categories</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyTypeFilter, setCompanyTypeFilter] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Agreement Form & Customization State
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('Authorized Signatory');
  const [signatureText, setSignatureText] = useState('');
  const [isEditingAgreement, setIsEditingAgreement] = useState(false);
  const [customPreamble, setCustomPreamble] = useState('');
  const [customTerms, setCustomTerms] = useState([]);

  // Dynamic Categories accumulated from master categories store + default list + backend records
  const masterCategoryOptions = getFlatCategoryOptions();
  const dynamicSupplyCategories = Array.from(new Set([
    ...masterCategoryOptions,
    ...DEFAULT_SUPPLY_CATEGORIES,
    ...vendors.map(v => v.supplyCategory).filter(Boolean)
  ]));

  // Registration Form State
  const [formData, setFormData] = useState({
    legalName: '',
    tradeName: '',
    companyType: 'Proprietorship',
    primaryContactPerson: '',
    phone: '',
    email: '',
    officeAddress: '',
    gstin: '',
    pan: '',
    bankAccount: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    supplyCategory: 'Raw Materials',
    subCategories: [],
    status: 'ACTIVE',
    notes: ''
  });

  useEffect(() => {
    fetchVendors();
  }, [search, categoryFilter, statusFilter, companyTypeFilter]);

  const fetchVendors = async () => {
    try {
      const res = await axios.get('/vendors', {
        params: {
          search: search || undefined,
          supplyCategory: categoryFilter || undefined,
          status: statusFilter || undefined,
          companyType: companyTypeFilter || undefined
        }
      });
      setVendors(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch vendors', err);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      legalName: '',
      tradeName: '',
      companyType: 'Proprietorship',
      primaryContactPerson: '',
      phone: '',
      email: '',
      officeAddress: '',
      gstin: '',
      pan: '',
      bankAccount: '',
      ifscCode: '',
      bankName: '',
      branchName: '',
      supplyCategory: 'Raw Materials',
      subCategories: [],
      status: 'ACTIVE',
      notes: ''
    });
    setCurrentStep(1);
  };

  const submitFinalVendorRegistration = async (e) => {
    if (e) e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!formData.legalName || !formData.primaryContactPerson || !formData.phone || !formData.email || !formData.officeAddress || !formData.supplyCategory) {
      setMessage({ text: 'Please fill in all required fields (Legal Name, Contact Person, Phone, Email, Address, Supply Category).', type: 'error' });
      return;
    }

    try {
      const payload = {
        legalName: formData.legalName,
        tradeName: formData.tradeName || formData.legalName,
        companyType: formData.companyType,
        primaryContactPerson: formData.primaryContactPerson,
        phone: formData.phone,
        email: formData.email,
        officeAddress: formData.officeAddress,
        gstin: formData.gstin,
        pan: formData.pan,
        bankDetails: {
          accountNumber: formData.bankAccount,
          ifscCode: formData.ifscCode,
          bankName: formData.bankName,
          branchName: formData.branchName
        },
        supplyCategory: formData.supplyCategory,
        subCategories: formData.subCategories,
        status: formData.status,
        notes: formData.notes
      };

      const res = await axios.post('/vendors', payload);
      if (res.data.success) {
        setMessage({ text: 'Vendor registered and onboarded successfully!', type: 'success' });
        setShowAddModal(false);
        resetForm();
        fetchVendors();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to register vendor.', type: 'error' });
    }
  };

  const handleOpenEdit = (vendor) => {
    setSelectedVendor(vendor);
    setFormData({
      legalName: vendor.legalName || '',
      tradeName: vendor.tradeName || '',
      companyType: vendor.companyType || 'Proprietorship',
      primaryContactPerson: vendor.primaryContactPerson || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      officeAddress: vendor.officeAddress || '',
      gstin: vendor.gstin || '',
      pan: vendor.pan || '',
      bankAccount: vendor.bankDetails?.accountNumber || '',
      ifscCode: vendor.bankDetails?.ifscCode || '',
      bankName: vendor.bankDetails?.bankName || '',
      branchName: vendor.bankDetails?.branchName || '',
      supplyCategory: vendor.supplyCategory || 'Raw Materials',
      subCategories: Array.isArray(vendor.subCategories) ? vendor.subCategories : [],
      status: vendor.status || 'ACTIVE',
      notes: vendor.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateVendor = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    try {
      const payload = {
        legalName: formData.legalName,
        tradeName: formData.tradeName,
        companyType: formData.companyType,
        primaryContactPerson: formData.primaryContactPerson,
        phone: formData.phone,
        email: formData.email,
        officeAddress: formData.officeAddress,
        gstin: formData.gstin,
        pan: formData.pan,
        bankDetails: {
          accountNumber: formData.bankAccount,
          ifscCode: formData.ifscCode,
          bankName: formData.bankName,
          branchName: formData.branchName
        },
        supplyCategory: formData.supplyCategory,
        subCategories: formData.subCategories,
        status: formData.status,
        notes: formData.notes
      };

      const res = await axios.put(`/vendors/${selectedVendor.id}`, payload);
      if (res.data.success) {
        setMessage({ text: 'Vendor details updated successfully!', type: 'success' });
        setShowEditModal(false);
        fetchVendors();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update vendor.', type: 'error' });
    }
  };

  const handleDeleteVendor = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove vendor "${name}"?`)) return;
    try {
      await axios.delete(`/vendors/${id}`);
      setMessage({ text: 'Vendor removed successfully.', type: 'success' });
      fetchVendors();
    } catch (err) {
      setMessage({ text: 'Failed to delete vendor record.', type: 'error' });
    }
  };

  const handleOpenAgreementModal = async (vendor) => {
    setSelectedVendor(vendor);
    setSignerName(vendor.agreementDetails?.signerName || vendor.primaryContactPerson || '');
    setSignerTitle(vendor.agreementDetails?.signerTitle || 'Authorized Signatory');
    setSignatureText(vendor.agreementDetails?.signatureData || vendor.primaryContactPerson || '');
    setCustomPreamble(vendor.agreementDetails?.customPreamble || '');
    setCustomTerms(
      vendor.agreementDetails?.customTerms && vendor.agreementDetails.customTerms.length > 0
        ? vendor.agreementDetails.customTerms
        : DEFAULT_AGREEMENT_TERMS
    );
    setIsEditingAgreement(false);
    setShowAgreementModal(true);

    if (!vendor.agreementStatus || vendor.agreementStatus === 'NOT_GENERATED') {
      try {
        const res = await axios.post(`/vendors/${vendor.id}/generate-agreement`);
        if (res.data.success) {
          setSelectedVendor(res.data.data);
          fetchVendors();
        }
      } catch (err) {
        console.error('Failed to generate agreement:', err);
      }
    }
  };

  const handleSaveAgreementTerms = async () => {
    if (!selectedVendor) return;
    try {
      const res = await axios.post(`/vendors/${selectedVendor.id}/update-agreement-terms`, {
        customPreamble,
        customTerms
      });
      if (res.data.success) {
        setSelectedVendor(res.data.data);
        setIsEditingAgreement(false);
        setMessage({ text: 'Vendor agreement terms & legal clauses updated successfully!', type: 'success' });
        fetchVendors();
      }
    } catch (err) {
      setMessage({ text: 'Failed to update agreement terms.', type: 'error' });
    }
  };

  const handleAddTermClause = () => {
    setCustomTerms(prev => [...prev, 'New Custom Clause: Specify terms, SLA, warranty, freight, or quality agreement...']);
  };

  const handleUpdateTermClause = (index, value) => {
    setCustomTerms(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleDeleteTermClause = (index) => {
    setCustomTerms(prev => prev.filter((_, i) => i !== index));
  };

  const handleResetDefaultTerms = () => {
    setCustomPreamble('');
    setCustomTerms(DEFAULT_AGREEMENT_TERMS);
  };

  const handleSignAgreement = async (method) => {
    if (!selectedVendor) return;
    try {
      const res = await axios.post(`/vendors/${selectedVendor.id}/sign-agreement`, {
        signingMethod: method,
        signerName: signerName || selectedVendor.primaryContactPerson,
        signerTitle: signerTitle || 'Authorized Signatory',
        signatureData: signatureText || selectedVendor.primaryContactPerson
      });
      if (res.data.success) {
        setSelectedVendor(res.data.data);
        setMessage({ 
          text: `Vendor Agreement / MOU successfully signed (${method === 'DIGITAL' ? 'Digital Signature' : 'Physical MOU'})! Vendor status set to Active.`, 
          type: 'success' 
        });
        fetchVendors();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to record agreement signature.', type: 'error' });
    }
  };

  // Metrics calculations
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(v => v.status === 'ACTIVE').length;
  const pendingVendors = vendors.filter(v => v.status === 'PENDING_APPROVAL').length;
  const categoriesCount = new Set(vendors.map(v => v.supplyCategory)).size;

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
              Supply Chain Portal
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-rose-500" />
            Vendor Onboarding & Management
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Streamlined vendor registration capturing business details, contact information, tax & statutory records, and dynamic supply categories.
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg hover:shadow-rose-500/20 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Register New Vendor</span>
        </button>
      </div>

      {/* ── System Alerts ── */}
      {message.text && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ text: '', type: '' })} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* ── Metrics Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Vendors</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-slate-700" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{totalVendors}</p>
          <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Registered in System</span>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">Active Suppliers</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{activeVendors}</p>
          <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Verified & Active</span>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">Pending Approval</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{pendingVendors}</p>
          <span className="text-[10px] text-amber-600 font-semibold mt-1 block">Onboarding Stage</span>
        </div>

        <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Supply Categories</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-indigo-700 mt-2">{categoriesCount}</p>
          <span className="text-[10px] text-indigo-600 font-semibold mt-1 block">Active Categories</span>
        </div>
      </div>

      {/* ── Filters & Search Bar ── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search vendor by name, GSTIN, phone, contact person..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Supply Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">All Supply Categories</option>
              {dynamicSupplyCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Company Type Filter */}
            <select
              value={companyTypeFilter}
              onChange={(e) => setCompanyTypeFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">All Company Types</option>
              {DEFAULT_COMPANY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Vendors Directory Table ── */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-rose-600" />
            Vendor Directory ({vendors.length})
          </h2>
        </div>

        {vendors.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-600">No vendors found matching criteria</p>
            <p className="text-xs text-slate-400">Click "Register New Vendor" to onboard your first supplier.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Vendor & Business Details</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Statutory & Tax Details</th>
                  <th className="py-3.5 px-4">Supply Category</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Legal & Business Name */}
                    <td className="py-4 px-5">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm">{vendor.legalName}</span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                            {vendor.companyType}
                          </span>
                        </div>
                        {vendor.tradeName && vendor.tradeName !== vendor.legalName && (
                          <span className="text-[10px] text-slate-400 block font-medium">Trade: {vendor.tradeName}</span>
                        )}
                      </div>
                    </td>

                    {/* Contact Person & Address */}
                    <td className="py-4 px-4">
                      <div className="space-y-1 text-slate-600">
                        <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          <span>{vendor.primaryContactPerson}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{vendor.phone}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-2 truncate max-w-[200px]">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{vendor.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Tax & Statutory Details */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        {vendor.gstin ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            GSTIN: {vendor.gstin}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 block">No GSTIN recorded</span>
                        )}
                        {vendor.pan && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 ml-1">
                            PAN: {vendor.pan}
                          </span>
                        )}
                        {vendor.bankDetails?.accountNumber && (
                          <div className="text-[10px] text-slate-500 flex items-center space-x-1">
                            <CreditCard className="w-3 h-3 text-slate-400" />
                            <span>Bank: A/C ending ...{vendor.bankDetails.accountNumber.slice(-4)}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                          <Layers className="w-3 h-3" />
                          <span>{vendor.supplyCategory}</span>
                        </span>
                        {vendor.subCategories && vendor.subCategories.length > 0 && (
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {vendor.subCategories.map((sub, sIdx) => (
                              <span key={sIdx} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md border border-slate-200">
                                {sub}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      {vendor.status === 'ACTIVE' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      )}
                      {vendor.status === 'PENDING_APPROVAL' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          <span>Pending</span>
                        </span>
                      )}
                      {vendor.status === 'INACTIVE' && (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="w-3 h-3" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenAgreementModal(vendor)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer ${
                            vendor.agreementStatus?.startsWith('SIGNED')
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                              : vendor.agreementStatus === 'GENERATED'
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300'
                              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                          }`}
                          title="Generate / View Vendor Agreement & MOU"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>
                            {vendor.agreementStatus === 'SIGNED_DIGITALLY' ? 'MOU Signed (Digital)' :
                             vendor.agreementStatus === 'SIGNED_PHYSICALLY' ? 'MOU Signed (Physical)' :
                             vendor.agreementStatus === 'GENERATED' ? 'View MOU' : 'Generate MOU'}
                          </span>
                        </button>
                        <button
                          onClick={() => { setSelectedVendor(vendor); setShowDetailModal(true); }}
                          className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
                          title="View Vendor Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(vendor)}
                          className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer"
                          title="Edit Vendor"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteVendor(vendor.id, vendor.legalName)}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                          title="Delete Vendor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── REGISTER VENDOR MODAL (Structured 4-Step Onboarding Process) ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Step {currentStep} of 4</span>
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-rose-500" />
                  Vendor Registration Onboarding
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Step Wizard Bar */}
            <div className="grid grid-cols-4 bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-center">
              <button
                onClick={() => setCurrentStep(1)}
                className={`py-3 px-2 flex items-center justify-center space-x-1 border-b-2 transition-all ${
                  currentStep === 1 ? 'border-rose-600 text-rose-700 bg-white' : 'border-transparent text-slate-500'
                }`}
              >
                <span>1. Business</span>
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                className={`py-3 px-2 flex items-center justify-center space-x-1 border-b-2 transition-all ${
                  currentStep === 2 ? 'border-rose-600 text-rose-700 bg-white' : 'border-transparent text-slate-500'
                }`}
              >
                <span>2. Contact</span>
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className={`py-3 px-2 flex items-center justify-center space-x-1 border-b-2 transition-all ${
                  currentStep === 3 ? 'border-rose-600 text-rose-700 bg-white' : 'border-transparent text-slate-500'
                }`}
              >
                <span>3. Tax & Bank</span>
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className={`py-3 px-2 flex items-center justify-center space-x-1 border-b-2 transition-all ${
                  currentStep === 4 ? 'border-rose-600 text-rose-700 bg-white' : 'border-transparent text-slate-500'
                }`}
              >
                <span>4. Category</span>
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={(e) => e.preventDefault()} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              {/* STEP 1: Business Details */}
              <div className={currentStep === 1 ? "space-y-4 animate-fade-in" : "hidden"}>
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                  <Building2 className="w-4 h-4 text-rose-600" />
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs">1. Business Details</h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Vendor Legal Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Spices Private Limited"
                      value={formData.legalName}
                      onChange={(e) => handleInputChange('legalName', e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Trade Name / Brand Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Foods (Optional if same as Legal Name)"
                      value={formData.tradeName}
                      onChange={(e) => handleInputChange('tradeName', e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Company Type *</label>
                    <select
                      value={formData.companyType}
                      onChange={(e) => handleInputChange('companyType', e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-rose-500"
                    >
                      {DEFAULT_COMPANY_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* STEP 2: Contact Information */}
              <div className={currentStep === 2 ? "space-y-4 animate-fade-in" : "hidden"}>
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                  <Phone className="w-4 h-4 text-rose-600" />
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs">2. Contact Information</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Primary Contact Person *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={formData.primaryContactPerson}
                      onChange={(e) => handleInputChange('primaryContactPerson', e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. vendor@acmefoods.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">Registered Office Address *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Full street address, city, state, pincode..."
                      value={formData.officeAddress}
                      onChange={(e) => handleInputChange('officeAddress', e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 3: Tax & Statutory Details */}
              <div className={currentStep === 3 ? "space-y-4 animate-fade-in" : "hidden"}>
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                  <CreditCard className="w-4 h-4 text-rose-600" />
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs">3. Tax & Statutory Details</h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">GSTIN Number</label>
                    <input
                      type="text"
                      placeholder="22AAAAA0000A1Z5"
                      value={formData.gstin}
                      onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">PAN Number</label>
                    <input
                      type="text"
                      placeholder="ABCDE1234F"
                      value={formData.pan}
                      onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase())}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold focus:ring-2 focus:ring-rose-500"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2 border-t border-slate-100 pt-3">
                    <span className="block text-[11px] font-black uppercase text-indigo-600 mb-2">Bank Account Information</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Account Number</label>
                        <input
                          type="text"
                          placeholder="Bank Account Number"
                          value={formData.bankAccount}
                          onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">IFSC Code</label>
                        <input
                          type="text"
                          placeholder="SBIN0001234"
                          value={formData.ifscCode}
                          onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase())}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Bank Name</label>
                        <input
                          type="text"
                          placeholder="State Bank of India"
                          value={formData.bankName}
                          onChange={(e) => handleInputChange('bankName', e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-semibold mb-1">Branch Name</label>
                        <input
                          type="text"
                          placeholder="Main Branch"
                          value={formData.branchName}
                          onChange={(e) => handleInputChange('branchName', e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* STEP 4: Supply Category & Status */}
              <div className={currentStep === 4 ? "space-y-4 animate-fade-in" : "hidden"}>
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                  <Layers className="w-4 h-4 text-rose-600" />
                  <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs">4. Supply Category & Status</h4>
                </div>

                <div className="space-y-4">
                  <VendorCategorySubCategoryPicker
                    mainCategory={formData.supplyCategory}
                    subCategories={formData.subCategories}
                    onMainCategoryChange={(cat) => handleInputChange('supplyCategory', cat)}
                    onSubCategoriesChange={(subs) => handleInputChange('subCategories', subs)}
                  />

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Onboarding Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="ACTIVE">Active Supplier</option>
                      <option value="PENDING_APPROVAL">Pending Approval</option>
                      <option value="INACTIVE">Inactive / Suspended</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Internal Notes / Remarks</label>
                    <textarea
                      rows={2}
                      placeholder="Add internal onboarding comments, payment terms, or compliance notes..."
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setCurrentStep(prev => Math.max(1, prev - 1)); }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Back
                  </button>
                ) : (
                  <div></div>
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setCurrentStep(prev => Math.min(4, prev + 1)); }}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={submitFinalVendorRegistration}
                    className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-600/20 cursor-pointer"
                  >
                    Submit Vendor Registration
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT VENDOR MODAL ── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-black flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-rose-500" />
                Edit Vendor Profile ({formData.legalName})
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdateVendor} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.legalName}
                    onChange={(e) => handleInputChange('legalName', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trade Name</label>
                  <input
                    type="text"
                    value={formData.tradeName}
                    onChange={(e) => handleInputChange('tradeName', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company Type</label>
                  <select
                    value={formData.companyType}
                    onChange={(e) => handleInputChange('companyType', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  >
                    {DEFAULT_COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Primary Contact *</label>
                  <input
                    type="text"
                    required
                    value={formData.primaryContactPerson}
                    onChange={(e) => handleInputChange('primaryContactPerson', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Registered Office Address *</label>
                  <textarea
                    rows={2}
                    required
                    value={formData.officeAddress}
                    onChange={(e) => handleInputChange('officeAddress', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => handleInputChange('gstin', e.target.value.toUpperCase())}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={formData.pan}
                    onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase())}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono uppercase"
                  />
                </div>
                <div className="col-span-2">
                  <VendorCategorySubCategoryPicker
                    mainCategory={formData.supplyCategory}
                    subCategories={formData.subCategories}
                    onMainCategoryChange={(cat) => handleInputChange('supplyCategory', cat)}
                    onSubCategoriesChange={(subs) => handleInputChange('subCategories', subs)}
                  />
                </div>
                <div className="col-span-2 md:col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                  >
                    <option value="ACTIVE">Active Supplier</option>
                    <option value="PENDING_APPROVAL">Pending Approval</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-xl border">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DETAIL PROFILE MODAL ── */}
      {showDetailModal && selectedVendor && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-rose-400">Vendor Master Record</span>
                <h3 className="text-lg font-black">{selectedVendor.legalName}</h3>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Trade Name</span>
                  <span className="font-bold text-slate-800">{selectedVendor.tradeName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Company Type</span>
                  <span className="font-bold text-slate-800">{selectedVendor.companyType}</span>
                </div>
                <div className="col-span-2 space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Main Category &amp; Sub-Categories</span>
                    <button
                      onClick={() => { setShowDetailModal(false); handleOpenEdit(selectedVendor); }}
                      className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      ✎ Edit Categories
                    </button>
                  </div>
                  <p className="font-black text-rose-700 text-xs">{selectedVendor.supplyCategory}</p>
                  
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedVendor.subCategories && selectedVendor.subCategories.length > 0 ? (
                      selectedVendor.subCategories.map((sub, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl shadow-xs">
                          <span>{sub}</span>
                          <button
                            type="button"
                            onClick={async () => {
                              const updatedSub = selectedVendor.subCategories.filter(s => s !== sub);
                              try {
                                const res = await axios.put(`/vendors/${selectedVendor.id}`, { subCategories: updatedSub });
                                if (res.data.success) {
                                  setSelectedVendor(res.data.data);
                                  fetchVendors();
                                }
                              } catch (err) { console.error(err); }
                            }}
                            className="text-rose-400 hover:text-rose-700 font-black text-xs ml-1 cursor-pointer"
                            title={`Remove "${sub}" from vendor`}
                          >
                            ✕
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No sub-categories assigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Status</span>
                  <span className="font-bold text-emerald-700">{selectedVendor.status}</span>
                </div>
              </div>

              {/* Quality & Performance Scorecard */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 rounded-2xl text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Quality &amp; Performance Scorecard
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    Grade A Supplier
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-xs">
                    <span className="text-[9px] font-bold text-slate-300 block uppercase">Quality Pass</span>
                    <span className="text-sm font-black text-emerald-400">98.4%</span>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-xs">
                    <span className="text-[9px] font-bold text-slate-300 block uppercase">On-Time Delivery</span>
                    <span className="text-sm font-black text-amber-400">96.0%</span>
                  </div>
                  <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-xs">
                    <span className="text-[9px] font-bold text-slate-300 block uppercase">Defect Rate</span>
                    <span className="text-sm font-black text-rose-400 font-mono">1.6%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b pb-1">Contact Details</h4>
                <p><strong>Contact Person:</strong> {selectedVendor.primaryContactPerson}</p>
                <p><strong>Phone:</strong> {selectedVendor.phone}</p>
                <p><strong>Email:</strong> {selectedVendor.email}</p>
                <p><strong>Office Address:</strong> {selectedVendor.officeAddress}</p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b pb-1">Tax & Statutory Info</h4>
                <p><strong>GSTIN:</strong> {selectedVendor.gstin || 'Not Provided'}</p>
                <p><strong>PAN:</strong> {selectedVendor.pan || 'Not Provided'}</p>
              </div>

              {selectedVendor.bankDetails && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b pb-1">Bank Information</h4>
                  <p><strong>Account Number:</strong> {selectedVendor.bankDetails.accountNumber || 'N/A'}</p>
                  <p><strong>IFSC Code:</strong> {selectedVendor.bankDetails.ifscCode || 'N/A'}</p>
                  <p><strong>Bank & Branch:</strong> {selectedVendor.bankDetails.bankName || ''} {selectedVendor.bankDetails.branchName ? `(${selectedVendor.bankDetails.branchName})` : ''}</p>
                </div>
              )}

              {selectedVendor.notes && (
                <div className="space-y-1 bg-amber-50 p-3 rounded-xl border border-amber-100 text-amber-900">
                  <span className="text-[10px] font-bold uppercase">Internal Notes:</span>
                  <p>{selectedVendor.notes}</p>
                </div>
              )}

              {/* Agreement / MOU Section */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-black text-slate-800 uppercase tracking-wider text-xs">Agreement / MOU Status</h4>
                  </div>
                  {selectedVendor.agreementStatus === 'SIGNED_DIGITALLY' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      ✓ Digitally Signed & Verified
                    </span>
                  )}
                  {selectedVendor.agreementStatus === 'SIGNED_PHYSICALLY' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-300">
                      ✓ Physical Copy Signed
                    </span>
                  )}
                  {selectedVendor.agreementStatus === 'GENERATED' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                      Pending Signature
                    </span>
                  )}
                  {(!selectedVendor.agreementStatus || selectedVendor.agreementStatus === 'NOT_GENERATED') && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-200 text-slate-700">
                      Not Generated
                    </span>
                  )}
                </div>

                {selectedVendor.agreementDetails?.agreementNumber && (
                  <div className="text-[11px] space-y-1 text-slate-600">
                    <p><strong>Agreement Ref:</strong> <span className="font-mono text-slate-900">{selectedVendor.agreementDetails.agreementNumber}</span></p>
                    {selectedVendor.agreementDetails.signedAt && (
                      <p><strong>Signed By:</strong> {selectedVendor.agreementDetails.signerName} ({selectedVendor.agreementDetails.signerTitle}) on {new Date(selectedVendor.agreementDetails.signedAt).toLocaleDateString()}</p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => { setShowDetailModal(false); handleOpenAgreementModal(selectedVendor); }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-rose-400" />
                  <span>
                    {selectedVendor.agreementStatus?.startsWith('SIGNED') ? 'View / Print Vendor Agreement (MOU)' : 'Generate & Sign Vendor Agreement (MOU)'}
                  </span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t flex justify-end">
              <button onClick={() => setShowDetailModal(false)} className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── VENDOR AGREEMENT / MOU GENERATOR & SIGNER MODAL ── */}
      {showAgreementModal && selectedVendor && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden flex flex-col my-auto">
            {/* Header Controls */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between print:hidden">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase text-rose-400">Legal Document & Compliance Portal</span>
                <h3 className="text-base font-black flex items-center gap-2">
                  <FileText className="w-5 h-5 text-rose-500" />
                  Vendor Supply Agreement & Memorandum of Understanding (MOU)
                </h3>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEditingAgreement(!isEditingAgreement)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    isEditingAgreement 
                      ? 'bg-rose-600 text-white hover:bg-rose-700' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{isEditingAgreement ? 'Close Editor' : 'Edit Agreement Text'}</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
                  title="Print or Save as PDF"
                >
                  <Printer className="w-4 h-4 text-amber-400" />
                  <span>Print MOU</span>
                </button>
                <button onClick={() => setShowAgreementModal(false)} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer">✕</button>
              </div>
            </div>

            {/* AGREEMENT EDITING MODE */}
            {isEditingAgreement ? (
              <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs bg-slate-50">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between text-amber-900 font-sans">
                  <div className="space-y-0.5">
                    <span className="font-bold block text-sm">Agreement Content & Terms Customizer</span>
                    <p className="text-[11px] text-amber-700">Modify legal clauses, add custom SLAs, penalty terms, or edit preamble text for this vendor.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetDefaultTerms}
                    className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] flex items-center space-x-1 border border-amber-300 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Default Terms</span>
                  </button>
                </div>

                {/* Custom Preamble */}
                <div className="space-y-1 bg-white p-4 rounded-2xl border border-slate-200">
                  <label className="block text-slate-800 font-bold text-xs">Agreement Preamble / Introductory Remarks</label>
                  <textarea
                    rows={2}
                    value={customPreamble}
                    onChange={(e) => setCustomPreamble(e.target.value)}
                    placeholder="Enter custom introductory preamble (Optional - leaves standard introduction if empty)..."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-sans"
                  />
                </div>

                {/* Custom Terms & Clauses List */}
                <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs">Terms & Conditions Clauses ({customTerms.length})</h4>
                    <button
                      type="button"
                      onClick={handleAddTermClause}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Clause</span>
                    </button>
                  </div>

                  <div className="space-y-3 pt-2">
                    {customTerms.map((term, index) => (
                      <div key={index} className="flex items-start space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-500 text-xs pt-2 w-6 text-center">{index + 1}.</span>
                        <textarea
                          rows={3}
                          value={term}
                          onChange={(e) => handleUpdateTermClause(index, e.target.value)}
                          className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl font-sans text-xs focus:ring-2 focus:ring-rose-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteTermClause(index)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer mt-1"
                          title="Delete Clause"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveAgreementTerms}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center space-x-2 shadow-lg cursor-pointer"
                  >
                    <Save className="w-4 h-4 text-emerald-400" />
                    <span>Save Agreement Content Changes</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Agreement Document Viewport (Preview Mode) */
              <div className="p-8 overflow-y-auto flex-1 space-y-6 text-xs text-slate-800 font-serif leading-relaxed bg-white">
                {/* Document Header */}
                <div className="border-b-2 border-slate-900 pb-6 text-center space-y-2">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-sans font-bold">
                    <ShieldCheck className="w-4 h-4 text-rose-600" />
                    <span>MANSARA FOODS B2B SUPPLY CHAIN LEGAL AGREEMENT</span>
                  </div>
                  <h2 className="text-xl font-sans font-black text-slate-900 uppercase tracking-wide pt-2">
                    MEMORANDUM OF UNDERSTANDING & VENDOR SUPPLY AGREEMENT
                  </h2>
                  <div className="flex justify-between items-center text-[11px] font-sans text-slate-500 pt-3">
                    <span><strong>Agreement Ref:</strong> <span className="font-mono font-bold text-slate-900">{selectedVendor.agreementDetails?.agreementNumber || `MOU-MF-2026-${Date.now().toString().slice(-6)}`}</span></span>
                    <span><strong>Effective Date:</strong> {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>

                {/* 1. PARTIES */}
                <div className="space-y-2 font-sans">
                  <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs border-l-4 border-rose-600 pl-2">1. PARTIES TO THE AGREEMENT</h4>
                  <p className="text-slate-700 leading-relaxed">
                    {customPreamble || (
                      <>
                        This Agreement is entered into on this day between <strong>MANSARA FOODS PRIVATE LIMITED</strong>, having its corporate procurement division (hereinafter referred to as <strong>"Company"</strong>), and:
                      </>
                    )}
                  </p>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                    <div><strong>Vendor Legal Name:</strong> {selectedVendor.legalName}</div>
                    <div><strong>Trade / Brand Name:</strong> {selectedVendor.tradeName || selectedVendor.legalName}</div>
                    <div><strong>Company Type:</strong> {selectedVendor.companyType}</div>
                    <div><strong>Primary Contact Person:</strong> {selectedVendor.primaryContactPerson}</div>
                    <div><strong>Phone & Email:</strong> {selectedVendor.phone} | {selectedVendor.email}</div>
                    <div><strong>Nature of Supply:</strong> {selectedVendor.supplyCategory}</div>
                    <div className="col-span-2"><strong>Registered Office Address:</strong> {selectedVendor.officeAddress}</div>
                  </div>
                </div>

                {/* 2. STATUTORY & TAX DETAILS */}
                <div className="space-y-2 font-sans">
                  <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs border-l-4 border-rose-600 pl-2">2. STATUTORY & BANKING REGISTRATION</h4>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                    <div><strong>GSTIN Number:</strong> {selectedVendor.gstin || 'Not Provided / Exempt'}</div>
                    <div><strong>PAN Number:</strong> {selectedVendor.pan || 'Not Provided'}</div>
                    <div><strong>Bank Account Number:</strong> {selectedVendor.bankDetails?.accountNumber || 'N/A'}</div>
                    <div><strong>IFSC Code & Bank:</strong> {selectedVendor.bankDetails?.ifscCode || 'N/A'} ({selectedVendor.bankDetails?.bankName || 'N/A'})</div>
                  </div>
                </div>

                {/* 3. TERMS & CONDITIONS */}
                <div className="space-y-3 font-sans text-slate-700 leading-relaxed">
                  <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs border-l-4 border-rose-600 pl-2">3. TERMS & CONDITIONS OF SUPPLY</h4>
                  <ol className="list-decimal list-inside space-y-2.5 text-[11px]">
                    {customTerms.map((term, i) => (
                      <li key={i} className="leading-relaxed bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">{term}</li>
                    ))}
                  </ol>
                </div>

                {/* 4. SIGNATURE SECTION */}
                <div className="border-t-2 border-slate-200 pt-6 font-sans space-y-4">
                  <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs">4. EXECUTION & SIGNATURES</h4>

                  {selectedVendor.agreementStatus?.startsWith('SIGNED') ? (
                    <div className="bg-emerald-50 border-2 border-emerald-200 p-5 rounded-2xl space-y-3">
                      <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <span>AGREEMENT OFFICIALLY SIGNED & VERIFIED</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-xs text-slate-700 pt-2 border-t border-emerald-200">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Authorized Signatory Name</span>
                          <span className="font-bold text-slate-900">{selectedVendor.agreementDetails?.signerName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Title / Designation</span>
                          <span className="font-bold text-slate-900">{selectedVendor.agreementDetails?.signerTitle}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Signing Method</span>
                          <span className="font-bold text-emerald-700">{selectedVendor.agreementDetails?.signingMethod} SIGNATURE</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Signed Date & Timestamp</span>
                          <span className="font-bold text-slate-900">{new Date(selectedVendor.agreementDetails?.signedAt).toLocaleString()}</span>
                        </div>
                      </div>
                      {selectedVendor.agreementDetails?.signatureData && (
                        <div className="pt-2">
                          <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Digital Verification Stamp</span>
                          <div className="p-3 bg-white border border-emerald-300 rounded-xl font-mono text-emerald-900 font-bold italic tracking-wider text-sm flex items-center justify-between">
                            <span>Signed: "{selectedVendor.agreementDetails.signatureData}"</span>
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">VERIFIED DIGITAL STAMP</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4 print:hidden">
                      <div className="flex items-center space-x-2 text-slate-800 font-bold">
                        <PenTool className="w-4 h-4 text-rose-600" />
                        <span>Sign Vendor Agreement (Digital or Physical)</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Signer Name *</label>
                          <input
                            type="text"
                            value={signerName}
                            onChange={(e) => setSignerName(e.target.value)}
                            placeholder="Full Name of Signatory"
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-700 font-bold mb-1">Signer Title / Designation *</label>
                          <input
                            type="text"
                            value={signerTitle}
                            onChange={(e) => setSignerTitle(e.target.value)}
                            placeholder="e.g. Managing Director / Partner"
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                          />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-slate-700 font-bold mb-1">Digital Signature Box (Type Name or Draw Signature) *</label>
                          <input
                            type="text"
                            value={signatureText}
                            onChange={(e) => setSignatureText(e.target.value)}
                            placeholder="Type full legal name to generate digital signature stamp..."
                            className="w-full p-3 bg-white border border-slate-300 rounded-xl font-mono text-rose-900 font-bold text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-3 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleSignAgreement('PHYSICAL')}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          Mark as Signed Physical Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSignAgreement('DIGITAL')}
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Sign Agreement Digitally</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t flex justify-between items-center print:hidden">
              <span className="text-[11px] text-slate-500 font-sans">Mansara Foods Procurement & Compliance Engine</span>
              <button onClick={() => setShowAgreementModal(false)} className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
