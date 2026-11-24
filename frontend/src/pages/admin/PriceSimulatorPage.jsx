// src/pages/admin/PriceSimulatorPage.jsx
// Mansara Foods B2B Price & Margin Simulator
// Pure, Direct Workflow:
// 1. Select Product Name
// 2. Enter Quantity & Unit Type
// 3. Set Margin Percentage (%) -> Wholesale Price = MRP - (MRP * Margin% / 100)
// 4. Generate Quotation & Export Excel

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Calculator,
  Percent,
  TrendingUp,
  Package,
  Printer,
  Copy,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  Info,
  CheckCircle2,
  FileText,
  Boxes,
  ArrowRight,
  Store,
  Search,
  Building2,
  User,
  UserPlus,
  ChevronDown,
  CreditCard,
  Download,
  Share2,
  Loader2,
  Receipt,
  PenLine
} from 'lucide-react';
import WhatsAppShareModal from '../../components/WhatsAppShareModal';
import {
  buildQuotationHtml,
  triggerPrintQuotation,
  downloadQuotationHtml,
  downloadQuotationPdf,
  formatQuotationWhatsAppText,
  getStandardQuotationRef,
  ensureQuotationRef,
  ensure4DigitQuotationNo,
  ensure5DigitQuotationNo
} from '../../utils/quotationHelper';

export default function PriceSimulatorPage({ isSalesPerson: isSalesPersonProp } = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const isSalesPerson = Boolean(
    isSalesPersonProp ||
    location?.pathname?.includes('/sales')
  );

  // ─── DATA FETCHING ──────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });
  const [savingDraft, setSavingDraft] = useState(false);
  const [submittedQuotation, setSubmittedQuotation] = useState(null);

  // ─── CUSTOMER SEARCH & SELECTION ───────────────────────────────────────────
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef(null);

  // ─── TAXATION (WITH / WITHOUT GST) & FREIGHT ────────────────────────────────
  const [gstMode, setGstMode] = useState('WITH_GST'); // 'WITH_GST' | 'WITHOUT_GST'
  const isWithGst = gstMode === 'WITH_GST';
  const [rateMode, setRateMode] = useState('INCLUDE_TAX'); // 'INCLUDE_TAX' (Rate Include Tax) | 'EXCLUDE_TAX' (Rate Exclude Tax)
  const [gstRate, setGstRate] = useState(5); // Default 5% GST for food items
  const [shippingCharges, setShippingCharges] = useState(0);

  // ─── QUICK REGISTRATION MODALS ──────────────────────────────────────────────
  const [showRegisterStoreModal, setShowRegisterStoreModal] = useState(false);
  const [showRegisterDealerModal, setShowRegisterDealerModal] = useState(false);
  const [submittingReg, setSubmittingReg] = useState(false);

  const [storeForm, setStoreForm] = useState({
    name: '',
    ownerName: '',
    phone: '',
    address: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    gstNumber: '',
    dealerId: ''
  });

  const [dealerForm, setDealerForm] = useState({
    companyName: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    gstNumber: '',
    defaultMargin: 10
  });

  // ─── USER INPUTS: PRODUCT, QUANTITY, UNIT & MARGIN ─────────────────────────
  const [simulationItems, setSimulationItems] = useState([]);
  const [selectedProductIdToAdd, setSelectedProductIdToAdd] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState(0);
  const [quantityUnitToAdd, setQuantityUnitToAdd] = useState('PCS');
  const [marginPctToAdd, setMarginPctToAdd] = useState(20); // Default 20% margin from MRP
  const [refreshingProducts, setRefreshingProducts] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({
    name: '',
    sku: '',
    mrp: '',
    cartonSize: 24,
    gstPercent: 5,
    weight: 100
  });
  const [savingQuickProduct, setSavingQuickProduct] = useState(false);

  // ─── QUOTATION MODAL ────────────────────────────────────────────────────────
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState('');
  const [customClientName, setCustomClientName] = useState('');
  const [quotationNotes, setQuotationNotes] = useState('');
  const [quotationRefNumber, setQuotationRefNumber] = useState('');
  const quotationRef = useRef(null);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [whatsAppMessage, setWhatsAppMessage] = useState('');
  const [activeQuotationData, setActiveQuotationData] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Exact company & invoice settings matching the dealer invoice template
  const [companySettings, setCompanySettings] = useState({
    companyName: 'MANSARA FOODS PVT. LTD.',
    gstNumber: '33AAUCM3644B1ZJ',
    address: 'Flat No. B4, No.13, Balaji Nagar 1st street extn, Noombal',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600077',
    phone: '+91-88388 87064',
    email: 'contact@mansarafoods.com',
    placeOfSupply: 'Tamil Nadu (33)',
    bankDetails: {
      bankName: 'HDFC Bank Ltd.',
      accountNo: '50200117036854',
      ifscCode: 'HDFC0001947',
      branch: 'Iyyapanthangal Branch',
      accountType: 'Current',
      upiId: 'vyapar.175693710434@hdfcbank'
    },
    signatoryTitle: 'Authorised Signatory',
    signatoryName: 'Mansara Foods Pvt. Ltd.',
    invoiceTerms: '1. Quotation valid for 15 days from issue date.\n2. Wholesale pricing is contingent upon order quantities and margin tiers selected.\n3. Goods once sold cannot be returned unless transit damage is reported upon receipt.'
  });

  // Helper to format invoice number according to template prefix & sequence
  const formatInvoiceNumber = (prefix = 'MF/INV/25-26', seqNumber = 10) => {
    const p = (prefix || 'MF/INV/25-26').trim();
    const numStr = String(seqNumber || 1).padStart(4, '0');
    if (p.endsWith('/') || p.endsWith('-')) {
      return `${p}${numStr}`;
    }
    const sep = p.includes('/') ? '/' : '-';
    return `${p}${sep}${numStr}`;
  };

  // Convert numbers to Indian words (exact match to dealer invoice format)
  const numberToWords = (num) => {
    if (!num || isNaN(num)) return 'ZERO RUPEES ONLY';
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
      'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    const n = Math.round(num);
    if (n === 0) return 'ZERO RUPEES ONLY';
    const convert = (n) => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' AND ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' LAKH' + (n % 100000 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' CRORE' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    };
    return convert(n).trim() + ' RUPEES ONLY';
  };

  // Safe parser for net weight in grams (handles "100g", "1 kg", numbers)
  const parseWeightG = (wt) => {
    if (!wt) return 250;
    if (typeof wt === 'number') return wt;
    const str = String(wt).toLowerCase().replace(/\s+/g, '');
    const num = parseFloat(str);
    if (isNaN(num)) return 250;
    if (str.includes('kg') || str.includes('kilogram')) {
      return num * 1000;
    }
    return num;
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage.text) {
      const timer = setTimeout(() => setToastMessage({ text: '', type: '' }), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Click outside to close customer dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initial Data Fetching
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prodRes, dealerRes, storeRes, settingsRes] = await Promise.all([
        axios.get('/products?limit=5000&status=all').catch(() => ({ data: { data: [] } })),
        axios.get('/dealers').catch(() => ({ data: { data: [] } })),
        axios.get('/stores').catch(() => ({ data: { data: [] } })),
        axios.get('/billing/settings').catch(() => ({ data: { data: null } }))
      ]);

      const activeProds = (prodRes.data?.data || []).filter(p => p.isActive !== false);
      setProducts(activeProds);
      setDealers(dealerRes.data?.data || []);
      setStores(storeRes.data?.data || []);
      if (settingsRes.data?.success && settingsRes.data.data) {
        const s = { ...settingsRes.data.data };
        if (!s.gstNumber || s.gstNumber === '27AABCM1234F1Z5' || s.gstNumber === '33AABCM1234F1Z5') {
          s.gstNumber = '33AAUCM3644B1ZJ';
        }
        setCompanySettings(prev => ({ ...prev, ...s }));

        const prefix = s.invoicePrefix || 'MF/INV/25-26';
        const nextQuote = s.nextQuotationNo || getStandardQuotationRef(s.quotationPrefix || prefix, s.nextQuotationNumber || 14);
        setQuotationRefNumber(nextQuote);
      } else {
        setQuotationRefNumber(getStandardQuotationRef('MF/INV/25-26', 14));
      }
      setSimulationItems([]); // Clean slate: Zero mock data
    } catch (err) {
      console.error('Failed to load simulator data:', err);
      setToastMessage({ text: 'Failed to load catalog products', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Dedicated product catalog sync (preserves active simulation items and customer choices)
  const fetchProductsOnly = async (silent = false) => {
    if (!silent) setRefreshingProducts(true);
    try {
      const res = await axios.get('/products?limit=5000&status=all');
      if (res.data?.success && Array.isArray(res.data.data)) {
        const activeProds = res.data.data.filter(p => p.isActive !== false);
        setProducts(activeProds);
        if (!silent) {
          setToastMessage({ text: `Product catalog synced! (${activeProds.length} products available)`, type: 'success' });
        }
      }
    } catch (e) {
      if (!silent) setToastMessage({ text: 'Failed to sync product catalog', type: 'error' });
    } finally {
      if (!silent) setRefreshingProducts(false);
    }
  };

  // Real-time catalog sync: auto-refreshes when tab gains focus, window becomes visible, or storage event fires
  useEffect(() => {
    const handleFocus = () => fetchProductsOnly(true);
    const handleStorage = (e) => {
      if (!e || e.key === 'crm_products_updated') {
        fetchProductsOnly(true);
      }
    };
    const handleCustomEvent = () => fetchProductsOnly(true);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('crm_products_updated', handleCustomEvent);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchProductsOnly(true);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('crm_products_updated', handleCustomEvent);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Sync products whenever user navigates back to Price Simulator route
  useEffect(() => {
    fetchProductsOnly(true);
  }, [location.key]);

  // Quick Add Product Handler
  const handleQuickAddProduct = async (e) => {
    e.preventDefault();
    if (!quickAddForm.name.trim()) {
      setToastMessage({ text: 'Product name is required', type: 'error' });
      return;
    }
    const cleanMrp = parseFloat(quickAddForm.mrp) || 0;
    if (cleanMrp <= 0) {
      setToastMessage({ text: 'Please enter a valid MRP greater than 0', type: 'error' });
      return;
    }
    const cleanSku = quickAddForm.sku.trim() || ('MF-' + quickAddForm.name.trim().substring(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X') + '-' + Date.now().toString().slice(-4));

    setSavingQuickProduct(true);
    try {
      const formData = new FormData();
      formData.append('name', quickAddForm.name.trim());
      formData.append('sku', cleanSku);
      formData.append('price', cleanMrp);
      formData.append('mrp', cleanMrp);
      formData.append('cartonSize', quickAddForm.cartonSize || 24);
      formData.append('pacQuantity', quickAddForm.cartonSize || 24);
      formData.append('gstPercent', quickAddForm.gstPercent !== undefined ? quickAddForm.gstPercent : 5);
      formData.append('weight', String(quickAddForm.weight || 100));
      formData.append('unit', 'PCS');

      const res = await axios.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success && res.data.data) {
        const created = res.data.data;
        const newId = created.id || created._id;

        try {
          localStorage.setItem('crm_products_updated', Date.now().toString());
          window.dispatchEvent(new Event('crm_products_updated'));
        } catch (_) {}

        await fetchProductsOnly(true);
        setSelectedProductIdToAdd(newId);
        setShowQuickAddModal(false);
        setQuickAddForm({
          name: '',
          sku: '',
          mrp: '',
          cartonSize: 24,
          gstPercent: 5,
          weight: 100
        });
        setToastMessage({ text: `Product "${created.name}" created and selected!`, type: 'success' });
      } else {
        setToastMessage({ text: res.data?.message || 'Failed to create product', type: 'error' });
      }
    } catch (err) {
      console.error('Error creating product from Price Simulator:', err);
      setToastMessage({ text: err.response?.data?.message || 'Failed to add product to catalog', type: 'error' });
    } finally {
      setSavingQuickProduct(false);
    }
  };

  // ─── PRODUCT ADD / REMOVE HANDLERS ──────────────────────────────────────────
  const handleAddSelectedProduct = () => {
    if (!selectedProductIdToAdd) return;
    const prod = products.find(p => (p.id || p._id) === selectedProductIdToAdd);
    if (!prod) return;

    if (simulationItems.some(i => i.productId === (prod.id || prod._id))) {
      setToastMessage({ text: 'Product is already in the list. You can update its quantity or margin directly in the table.', type: 'error' });
      return;
    }

    const mrp = parseFloat(prod.originalPrice || prod.mrp || prod.price || 0);
    const safeQty = Math.max(0, parseFloat(quantityToAdd) || 0);
    const safeMargin = Math.max(0, Math.min(99, parseFloat(marginPctToAdd) || 0));
    const activeGstPct = parseFloat(gstRate !== undefined ? gstRate : (prod.gstPercent || 5));

    const newItem = {
      id: 'sim-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      productId: prod.id || prod._id,
      name: prod.name,
      sku: prod.sku || 'SKU-' + Math.floor(100 + Math.random() * 900),
      quantity: safeQty,
      quantityUnit: quantityUnitToAdd,
      cartonSize: prod.cartonSize || 24,
      mrp: mrp,
      marginPct: safeMargin,
      gstPercent: activeGstPct,
      hsnCode: prod.hsnCode || '1901',
      netWeightG: parseWeightG(prod.weight || prod.netWeightG),
      wtPerCartonKg: prod.wtPerCartonKg || null
    };

    setSimulationItems(prev => [...prev, newItem]);
    setSelectedProductIdToAdd('');
    setToastMessage({ text: `Added "${prod.name}" (${safeQty} ${quantityUnitToAdd}) with ${safeMargin}% margin!`, type: 'success' });
  };

  const handleAddCustomCommodity = () => {
    const safeQty = Math.max(1, parseFloat(quantityToAdd) || 100);
    const safeMargin = Math.max(0, Math.min(99, parseFloat(marginPctToAdd) || 20));

    const newItem = {
      id: 'sim-' + Date.now(),
      productId: null,
      name: 'Custom Commodity / Grain / Dal',
      sku: 'BULK-COMMODITY',
      quantity: safeQty,
      quantityUnit: quantityUnitToAdd,
      cartonSize: 24,
      mrp: 100,
      marginPct: safeMargin,
      gstPercent: parseFloat(gstRate !== undefined ? gstRate : 5),
      hsnCode: '1901',
      netWeightG: 1000,
      wtPerCartonKg: null
    };

    setSimulationItems(prev => [...prev, newItem]);
    setToastMessage({ text: `Added Custom Commodity (${safeQty} ${quantityUnitToAdd})`, type: 'success' });
  };

  const handleRemoveItem = (id) => {
    setSimulationItems(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateItem = (id, field, value) => {
    setSimulationItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };
  // ─── FILTER OUT ALREADY SELECTED PRODUCTS FROM CATALOG DROPDOWN ────────────
  const availableProducts = useMemo(() => {
    const selectedIds = new Set(
      simulationItems
        .map(i => i.productId)
        .filter(Boolean)
        .map(id => String(id))
    );
    const selectedNames = new Set(
      simulationItems
        .map(i => (i.name || '').trim().toLowerCase())
        .filter(Boolean)
    );
    return products.filter(p => {
      const pId = String(p.id || p._id || '');
      const pName = (p.name || '').trim().toLowerCase();
      if (selectedIds.has(pId)) return false;
      if (pName && selectedNames.has(pName)) return false;
      return true;
    });
  }, [products, simulationItems]);

  useEffect(() => {
    if (selectedProductIdToAdd) {
      const isAvailable = availableProducts.some(p => String(p.id || p._id) === String(selectedProductIdToAdd));
      if (!isAvailable) {
        setSelectedProductIdToAdd('');
      }
    }
  }, [availableProducts, selectedProductIdToAdd]);

  // ─── FILTERED CUSTOMERS (DEALERS, STORES, PERSON) ───────────────────────────
  const filteredCustomers = useMemo(() => {
    const q = customerSearchQuery.trim().toLowerCase();

    const matchedDealers = dealers
      .filter(d => {
        if (!q) return true;
        const name = (d.companyName || d.name || '').toLowerCase();
        const contact = (d.name || '').toLowerCase();
        const phone = (d.phone || '').toLowerCase();
        const city = (d.city || '').toLowerCase();
        const gst = (d.gstNumber || '').toLowerCase();
        return name.includes(q) || contact.includes(q) || phone.includes(q) || city.includes(q) || gst.includes(q);
      })
      .map(d => {
        const dMargin = d.defaultMargin !== undefined && d.defaultMargin !== null && d.defaultMargin !== ''
          ? Number(d.defaultMargin)
          : (d.margin !== undefined && d.margin !== null ? Number(d.margin) : 10);
        return {
          type: 'DEALER',
          id: d.id || d._id,
          name: d.name || d.companyName,
          companyName: d.companyName || d.name,
          phone: d.phone || '',
          address: d.address || '',
          city: d.city || '',
          state: d.state || 'Tamil Nadu',
          pincode: d.pincode || '',
          gstNumber: d.gstNumber || '',
          email: d.email || '',
          defaultMargin: dMargin,
          allocatedMargin: dMargin
        };
      });

    const matchedStores = stores
      .filter(s => {
        if (!q) return true;
        const name = (s.name || '').toLowerCase();
        const owner = (s.ownerName || '').toLowerCase();
        const phone = (s.phone || s.ownerPhone || '').toLowerCase();
        const city = (s.city || '').toLowerCase();
        const gst = (s.gstNumber || '').toLowerCase();
        return name.includes(q) || owner.includes(q) || phone.includes(q) || city.includes(q) || gst.includes(q);
      })
      .map(s => {
        let storeAllocatedMargin = null;
        if (s.marginPercent !== undefined && s.marginPercent !== null && s.marginPercent !== '') {
          storeAllocatedMargin = Number(s.marginPercent);
        } else if (s.defaultMargin !== undefined && s.defaultMargin !== null && s.defaultMargin !== '') {
          storeAllocatedMargin = Number(s.defaultMargin);
        } else if (s.margin !== undefined && s.margin !== null && s.margin !== '') {
          storeAllocatedMargin = Number(s.margin);
        } else if (s.dealerId) {
          const linkedId = s.dealerId?.id || s.dealerId?._id || s.dealerId;
          const parentDealer = dealers.find(d => (d.id || d._id) === linkedId);
          if (parentDealer && parentDealer.defaultMargin !== undefined) {
            storeAllocatedMargin = Number(parentDealer.defaultMargin);
          }
        }
        const finalMargin = storeAllocatedMargin !== null && !isNaN(storeAllocatedMargin) ? storeAllocatedMargin : 20;

        return {
          type: 'STORE',
          id: s.id || s._id,
          name: s.name,
          companyName: s.name,
          ownerName: s.ownerName || '',
          phone: s.phone || s.ownerPhone || '',
          address: s.address || '',
          city: s.city || '',
          state: s.state || 'Tamil Nadu',
          pincode: s.pincode || '',
          gstNumber: s.gstNumber || '',
          dealerId: s.dealerId || null,
          marginPercent: s.marginPercent,
          defaultMargin: finalMargin,
          allocatedMargin: finalMargin
        };
      });

    return {
      dealers: matchedDealers.slice(0, 10),
      stores: matchedStores.slice(0, 10),
      totalMatches: matchedDealers.length + matchedStores.length
    };
  }, [dealers, stores, customerSearchQuery]);

  const handleSelectCustomer = (customer) => {
    let allocatedMargin = null;

    if (customer.allocatedMargin !== undefined && customer.allocatedMargin !== null && !isNaN(customer.allocatedMargin)) {
      allocatedMargin = Number(customer.allocatedMargin);
    } else if (customer.type === 'DEALER') {
      if (customer.defaultMargin !== undefined && customer.defaultMargin !== null && !isNaN(customer.defaultMargin)) {
        allocatedMargin = Number(customer.defaultMargin);
      } else {
        const foundDealer = dealers.find(d => (d.id || d._id) === customer.id);
        if (foundDealer && (foundDealer.defaultMargin !== undefined || foundDealer.margin !== undefined)) {
          allocatedMargin = Number(foundDealer.defaultMargin ?? foundDealer.margin);
        } else {
          allocatedMargin = 10;
        }
      }
    } else if (customer.type === 'STORE') {
      if (customer.marginPercent !== undefined && customer.marginPercent !== null && customer.marginPercent !== '') {
        allocatedMargin = Number(customer.marginPercent);
      } else if (customer.defaultMargin !== undefined && customer.defaultMargin !== null && customer.defaultMargin !== '') {
        allocatedMargin = Number(customer.defaultMargin);
      } else {
        const foundStore = stores.find(s => (s.id || s._id) === customer.id);
        const linkedDealerId = foundStore?.dealerId?.id || foundStore?.dealerId?._id || foundStore?.dealerId || customer.dealerId;
        if (linkedDealerId) {
          const parentDealer = dealers.find(d => (d.id || d._id) === linkedDealerId);
          if (parentDealer && parentDealer.defaultMargin !== undefined) {
            allocatedMargin = Number(parentDealer.defaultMargin);
          }
        }
        if (allocatedMargin === null) {
          allocatedMargin = 20;
        }
      }
    }

    const customerWithMargin = {
      ...customer,
      allocatedMargin: allocatedMargin !== null ? allocatedMargin : undefined
    };

    setSelectedCustomer(customerWithMargin);
    setCustomClientName(customer.companyName || customer.name);
    if (customer.type === 'DEALER') {
      setSelectedDealerId(customer.id);
    } else {
      setSelectedDealerId('');
    }

    if (allocatedMargin !== null && !isNaN(allocatedMargin)) {
      setMarginPctToAdd(allocatedMargin);

      // Automatically sync any existing calculation items to this customer's allocated margin
      setSimulationItems(prev => {
        if (!prev || prev.length === 0) return prev;
        return prev.map(item => ({
          ...item,
          marginPct: allocatedMargin
        }));
      });
    }

    setIsCustomerDropdownOpen(false);
    setCustomerSearchQuery('');
    setToastMessage({
      text: `Selected: ${customer.companyName || customer.name} (${customer.type === 'DEALER' ? 'Dealer' : 'Store'}) • Allocated Margin: ${allocatedMargin !== null ? allocatedMargin : 0}% applied automatically`,
      type: 'success'
    });
  };

  const handleSelectPerson = (personName) => {
    const trimmed = (personName || customerSearchQuery).trim();
    if (!trimmed) return;
    const personCustomer = {
      type: 'PERSON',
      id: null,
      name: trimmed,
      companyName: trimmed,
      phone: '',
      address: '',
      city: '',
      state: 'Tamil Nadu',
      pincode: '',
      gstNumber: '',
      email: '',
      allocatedMargin: 20
    };
    setSelectedCustomer(personCustomer);
    setCustomClientName(trimmed);
    setSelectedDealerId('');
    setMarginPctToAdd(20);
    setIsCustomerDropdownOpen(false);
    setCustomerSearchQuery('');
    setToastMessage({ text: `Selected "${trimmed}" as Direct Client / Person`, type: 'success' });
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomClientName('');
    setSelectedDealerId('');
    setCustomerSearchQuery('');
    setMarginPctToAdd(20);
  };

  // ─── QUICK REGISTRATION: STORE ──────────────────────────────────────────────
  const handleRegisterStoreSubmit = async (e) => {
    e.preventDefault();
    if (!storeForm.name.trim() || !storeForm.address.trim()) {
      setToastMessage({ text: 'Store Name and Address are required', type: 'error' });
      return;
    }

    setSubmittingReg(true);
    try {
      const res = await axios.post('/stores', {
        name: storeForm.name.trim(),
        ownerName: storeForm.ownerName.trim() || undefined,
        phone: storeForm.phone.trim() || undefined,
        address: storeForm.address.trim(),
        city: storeForm.city.trim() || undefined,
        state: storeForm.state || 'Tamil Nadu',
        pincode: storeForm.pincode.trim() || undefined,
        gstNumber: storeForm.gstNumber.trim().toUpperCase() || undefined,
        dealerId: (storeForm.dealerId && storeForm.dealerId !== '') ? storeForm.dealerId : undefined
      });

      const newStore = res.data?.data || {
        id: 'store-' + Date.now(),
        name: storeForm.name.trim(),
        ownerName: storeForm.ownerName.trim(),
        phone: storeForm.phone.trim(),
        address: storeForm.address.trim(),
        city: storeForm.city.trim(),
        gstNumber: storeForm.gstNumber.trim().toUpperCase()
      };

      setStores(prev => [newStore, ...prev]);
      handleSelectCustomer({
        type: 'STORE',
        id: newStore.id || newStore._id,
        name: newStore.name,
        companyName: newStore.name,
        ownerName: newStore.ownerName || '',
        phone: newStore.phone || '',
        address: newStore.address || '',
        city: newStore.city || '',
        gstNumber: newStore.gstNumber || '',
        dealerId: storeForm.dealerId || undefined
      });

      setShowRegisterStoreModal(false);
      setStoreForm({ name: '', ownerName: '', phone: '', address: '', city: '', state: 'Tamil Nadu', pincode: '', gstNumber: '', dealerId: '' });
      setToastMessage({ text: `Store "${newStore.name}" registered! Welcome WhatsApp dispatched.`, type: 'success' });
    } catch (err) {
      console.error('Failed to register store:', err);
      const errMsg = err.response?.data?.message || 'Failed to register store';
      setToastMessage({ text: errMsg, type: 'error' });
    } finally {
      setSubmittingReg(false);
    }
  };

  // ─── QUICK REGISTRATION: DEALER ─────────────────────────────────────────────
  const handleRegisterDealerSubmit = async (e) => {
    e.preventDefault();
    if (!dealerForm.companyName.trim() || !dealerForm.name.trim() || !dealerForm.phone.trim() || !dealerForm.address.trim()) {
      setToastMessage({ text: 'Company Name, Contact Person, Phone, and Address are required', type: 'error' });
      return;
    }

    setSubmittingReg(true);
    try {
      const email = dealerForm.email.trim() || `dealer_${Date.now()}@mansaradealer.com`;
      const res = await axios.post('/auth/register-dealer', {
        name: dealerForm.name.trim(),
        companyName: dealerForm.companyName.trim(),
        email: email,
        phone: dealerForm.phone.trim(),
        address: dealerForm.address.trim(),
        city: dealerForm.city.trim(),
        state: dealerForm.state || 'Tamil Nadu',
        pincode: dealerForm.pincode.trim(),
        gstNumber: dealerForm.gstNumber.trim().toUpperCase(),
        defaultMargin: parseFloat(dealerForm.defaultMargin) || 10,
        dealerType: 'RETAIL',
        dealerCategory: 'STARTER'
      });

      const newDealer = res.data?.data || {
        id: 'dealer-' + Date.now(),
        name: dealerForm.name.trim(),
        companyName: dealerForm.companyName.trim(),
        phone: dealerForm.phone.trim(),
        address: dealerForm.address.trim(),
        city: dealerForm.city.trim(),
        gstNumber: dealerForm.gstNumber.trim().toUpperCase(),
        email: email
      };

      const registeredMargin = parseFloat(dealerForm.defaultMargin) || 10;
      setDealers(prev => [newDealer, ...prev]);
      handleSelectCustomer({
        type: 'DEALER',
        id: newDealer.id || newDealer._id,
        name: newDealer.name || newDealer.companyName,
        companyName: newDealer.companyName || newDealer.name,
        phone: newDealer.phone || '',
        address: newDealer.address || '',
        city: newDealer.city || '',
        gstNumber: newDealer.gstNumber || '',
        email: email,
        defaultMargin: registeredMargin,
        allocatedMargin: registeredMargin
      });

      setShowRegisterDealerModal(false);
      setDealerForm({ companyName: '', name: '', phone: '', email: '', address: '', city: '', state: 'Tamil Nadu', pincode: '', gstNumber: '', defaultMargin: 10 });
      setToastMessage({ text: `Dealer "${newDealer.companyName}" registered! Credentials dispatched via WhatsApp & Email.`, type: 'success' });
    } catch (err) {
      console.error('Failed to register dealer:', err);
      const errMsg = err.response?.data?.message || 'Failed to register dealer';
      setToastMessage({ text: errMsg, type: 'error' });
    } finally {
      setSubmittingReg(false);
    }
  };

  // ─── CALCULATION ENGINE: MRP, MARGIN & GST CALCULATION LOGIC ────────────────
  // 1. MRP is always considered GST-inclusive
  // 2. Margin amount based on MRP: MRP * (marginPct / 100)
  // 3. Final Selling Price = MRP - Margin Amount
  // Rate Include Tax: Display final selling price directly (no GST deduction from displayed rate)
  // Rate Exclude Tax = Final Selling Price / (1 + GST Percentage / 100)
  // GST Amount = Final Selling Price - Rate Exclude Tax
  // Important: Both rate modes represent the same final selling price!
  const calculationSummary = useMemo(() => {
    let totalPieces = 0;
    let totalCartons = 0;
    let totalMrpValue = 0;
    let totalFinalSellingRevenue = 0;
    let totalTaxableRevenue = 0;
    let totalMarginDiscount = 0;
    let totalGstAmount = 0;

    const isWithGst = gstMode === 'WITH_GST';
    const currentGstRate = isWithGst ? Math.max(0, parseFloat(gstRate) || 0) : 0;

    const items = simulationItems.map(item => {
      const pacSize = Math.max(1, parseInt(item.cartonSize, 10) || 24);
      const rawQty = Math.max(0, parseFloat(item.quantity) || 0);
      const isBulkCarton = item.quantityUnit === 'Cartons' || item.quantityUnit === 'Boxes';
      const pieces = isBulkCarton ? rawQty * pacSize : rawQty;
      const cartons = isBulkCarton ? rawQty : parseFloat((pieces / pacSize).toFixed(2));

      // 1. MRP is always considered GST-inclusive
      const mrp = Math.max(0, parseFloat(item.mrp) || 0);
      const marginPct = Math.max(0, Math.min(99, parseFloat(item.marginPct) || 0));
      // Active GST percentage: use user-selected currentGstRate from simulator so 18%, 12%, 5%, 0% calculate consistently
      const itemGstPct = isWithGst ? (currentGstRate !== undefined ? currentGstRate : (parseFloat(item.gstPercent) || 5)) : 0;

      let marginDiscountPerUnit = 0;
      let sellingPriceBeforeGst = 0;
      let finalSellingPrice = 0;
      let rateExcludeTax = 0;
      let unitGstAmount = 0;
      let displayedRate = 0;

      // 1. Margin Amount = MRP * Margin %
      marginDiscountPerUnit = Math.round((mrp * (marginPct / 100)) * 100) / 100;
      // 2. Price after margin deduction
      const priceAfterMargin = Math.max(0, Math.round((mrp - marginDiscountPerUnit) * 100) / 100);

      // 3. Tax & Rate calculations based on Rate Mode:
      // EXCLUDE_TAX: priceAfterMargin is the TAXABLE BASE RATE without GST. GST is added ON TOP.
      // INCLUDE_TAX: priceAfterMargin is the ALL-INCLUSIVE SELLING PRICE. GST is back-calculated.
      if (rateMode === 'EXCLUDE_TAX') {
        rateExcludeTax = priceAfterMargin;
        unitGstAmount = isWithGst && itemGstPct > 0
          ? Math.round((rateExcludeTax * (itemGstPct / 100)) * 100) / 100
          : 0;
        finalSellingPrice = Math.round((rateExcludeTax + unitGstAmount) * 100) / 100;
        displayedRate = rateExcludeTax;
      } else {
        finalSellingPrice = priceAfterMargin;
        rateExcludeTax = isWithGst && itemGstPct > 0
          ? Math.round((finalSellingPrice / (1 + itemGstPct / 100)) * 10000) / 10000
          : finalSellingPrice;
        unitGstAmount = Math.max(0, Math.round((finalSellingPrice - rateExcludeTax) * 10000) / 10000);
        displayedRate = finalSellingPrice;
      }
      sellingPriceBeforeGst = rateExcludeTax;

      const cartonPrice = Math.round((displayedRate * pacSize) * 100) / 100;
      const finalCartonPrice = Math.round((finalSellingPrice * pacSize) * 100) / 100;

      // Line totals:
      const lineMrpValue = Math.round((mrp * pieces) * 100) / 100;
      const lineMarginDiscountTotal = Math.round((marginDiscountPerUnit * pieces) * 100) / 100;
      const lineTaxableSubtotal = Math.round((rateExcludeTax * pieces) * 100) / 100;

      let lineFinalSellingTotal = 0;
      let lineGstTotal = 0;

      if (rateMode === 'EXCLUDE_TAX') {
        lineGstTotal = isWithGst && itemGstPct > 0 ? Math.round((lineTaxableSubtotal * (itemGstPct / 100)) * 100) / 100 : 0;
        lineFinalSellingTotal = Math.round((lineTaxableSubtotal + lineGstTotal) * 100) / 100;
      } else {
        lineFinalSellingTotal = Math.round((finalSellingPrice * pieces) * 100) / 100;
        lineGstTotal = Math.round((lineFinalSellingTotal - lineTaxableSubtotal) * 100) / 100;
      }
      const lineSellingBeforeGstTotal = lineTaxableSubtotal;

      totalPieces += pieces;
      totalCartons += cartons;
      totalMrpValue += lineMrpValue;
      totalMarginDiscount += lineMarginDiscountTotal;
      totalFinalSellingRevenue += lineFinalSellingTotal;
      totalTaxableRevenue += lineTaxableSubtotal;
      totalGstAmount += lineGstTotal;

      return {
        ...item,
        pacSize,
        pieces,
        cartons,
        mrp,
        marginPct,
        marginDiscountPerUnit,
        sellingPriceBeforeGst,
        priceAfterMarginReduction: sellingPriceBeforeGst,
        finalSellingPrice,
        rateExcludeTax,
        unitGstAmount,
        displayedRate,
        wholesalePricePerUnit: displayedRate,
        cartonPrice,
        finalCartonPrice,
        lineMrpValue,
        lineWholesaleTotal: lineTaxableSubtotal,
        lineFinalSellingTotal,
        lineSellingBeforeGstTotal,
        lineTaxableSubtotal,
        lineGstTotal,
        lineMarginDiscountTotal,
        gstPercent: itemGstPct
      };
    });

    const averageMarginPct = totalMrpValue > 0 ? Math.round((totalMarginDiscount / totalMrpValue) * 1000) / 10 : 0;
    const subtotalWithoutGst = Math.round(totalTaxableRevenue * 100) / 100; // Taxable Subtotal
    const calculatedGst = Math.round(totalGstAmount * 100) / 100;
    const parsedShipping = Math.max(0, parseFloat(shippingCharges) || 0);
    // Grand Total: Taxable Subtotal + Total GST + Shipping (dynamically reflects selected GST rate)
    const grandTotal = Math.round((subtotalWithoutGst + calculatedGst + parsedShipping) * 100) / 100;

    return {
      totalPieces,
      totalCartons,
      totalMrpValue: Math.round(totalMrpValue * 100) / 100,
      totalMarginDiscount: Math.round(totalMarginDiscount * 100) / 100,
      averageMarginPct,
      subtotalWithoutGst,
      subtotalTaxable: subtotalWithoutGst,
      isWithGst,
      gstMode,
      rateMode,
      gstRate: currentGstRate,
      totalGstAmount: calculatedGst,
      shippingCharges: parsedShipping,
      grandTotal,
      totalWholesaleRevenue: Math.round((subtotalWithoutGst + calculatedGst) * 100) / 100,
      totalFinalSellingRevenue: Math.round((subtotalWithoutGst + calculatedGst) * 100) / 100,
      items
    };
  }, [simulationItems, gstMode, gstRate, rateMode, shippingCharges]);

  // ─── STEP 8: EXCEL EXPORT ───────────────────────────────────────────────────
  const handleExportExcel = () => {
    if (!calculationSummary.items || calculationSummary.items.length === 0) {
      setToastMessage({ text: 'Please add at least one product before exporting', type: 'error' });
      return;
    }

    const { items, totalPieces, totalCartons, totalMrpValue, totalMarginDiscount, averageMarginPct, subtotalWithoutGst, gstRate: currentGstRate, totalGstAmount, shippingCharges: currentShipping, grandTotal, isWithGst } = calculationSummary;

    const headers = [
      'Product Name',
      'SKU',
      'Order Qty',
      'Unit Type',
      'Total Units (Pcs)',
      'Total Cartons',
      'Pack Size (pcs/ctn)',
      'Original MRP (₹)',
      'Margin Percentage (%)',
      'Margin Discount / Unit (₹)',
      'Price after Margin Reduction (₹)',
      'Final Selling Price (₹)',
      'Rate Excl. Tax (₹)',
      `Displayed Rate [${rateMode === 'EXCLUDE_TAX' ? 'Excl. Tax' : 'Incl. Tax'}] (₹)`,
      'GST %',
      'GST Amount / Unit (₹)',
      'Wholesale Carton Price (₹)',
      'Total MRP Value (₹)',
      'Total Margin Discount (₹)',
      'Line Total Amount (₹)'
    ];

    const rows = items.map(item => [
      `"${item.name.replace(/"/g, '""')}"`,
      item.sku,
      item.quantity,
      item.quantityUnit,
      item.pieces,
      item.cartons,
      item.pacSize,
      item.mrp.toFixed(2),
      item.marginPct + '%',
      item.marginDiscountPerUnit.toFixed(2),
      (item.sellingPriceBeforeGst || item.rateExcludeTax || 0).toFixed(2),
      item.finalSellingPrice.toFixed(2),
      item.rateExcludeTax.toFixed(2),
      item.displayedRate.toFixed(2),
      (item.gstPercent || 0) + '%',
      item.unitGstAmount.toFixed(2),
      item.cartonPrice.toFixed(2),
      item.lineMrpValue.toFixed(2),
      item.lineMarginDiscountTotal.toFixed(2),
      item.lineFinalSellingTotal.toFixed(2)
    ]);

    const activeCustomerName = selectedCustomer?.companyName || selectedCustomer?.name || customClientName || 'Valued Trade Partner';
    const activeCustomerType = selectedCustomer?.type ? ` (${selectedCustomer.type})` : '';
    const rateModeDisplay = rateMode === 'EXCLUDE_TAX' ? 'Rate Exclude Tax' : 'Rate Include Tax';

    const summaryRows = [
      [],
      ['--- CUSTOMER & CONSIGNMENT SUMMARY ---', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Customer / Partner', `${activeCustomerName}${activeCustomerType}`],
      ['Invoice Rate Mode', rateModeDisplay],
      ['Total Order Units', totalPieces],
      ['Total Cartons Count', totalCartons],
      ['1. Total MRP (₹)', totalMrpValue.toFixed(2)],
      ['2. Margin Discount (₹)', `-${totalMarginDiscount.toFixed(2)} (${averageMarginPct}%)`],
      ['3. Price After Margin Reduction (Taxable Subtotal) (₹)', subtotalWithoutGst.toFixed(2)],
      ['4. GST Status & Amount (₹)', isWithGst ? `${currentGstRate}% (+₹${totalGstAmount.toFixed(2)})` : 'Without GST (₹0.00)'],
      ['5. Shipping Charges (₹)', currentShipping.toFixed(2)],
      ['6. Grand Total (Final Payable) (₹)', grandTotal.toFixed(2)]
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(',')),
      ...summaryRows.map(r => r.join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Mansara_Wholesale_Price_Quote_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToastMessage({ text: 'Wholesale prices successfully exported to Excel (.csv)!', type: 'success' });
  };

  // ─── STEP 8: QUOTATION MODAL HANDLERS ───────────────────────────────────────
  const handleOpenQuotation = async () => {
    if (!calculationSummary.items || calculationSummary.items.length === 0) {
      setToastMessage({ text: 'Please add at least one product before generating an invoice', type: 'error' });
      return;
    }
    let currentSettings = companySettings;
    try {
      const res = await axios.get('/billing/settings');
      if (res.data?.success && res.data.data) {
        currentSettings = { ...companySettings, ...res.data.data };
        setCompanySettings(currentSettings);
      }
    } catch (e) {
      console.warn('Could not refresh billing settings:', e);
    }

    const rawPrefix = currentSettings.invoicePrefix || 'MF/INV/25-26';
    const nextSeq = currentSettings.nextQuotationNumber || currentSettings.nextSequenceNumber || 14;
    const standardRef = quotationRefNumber || currentSettings.nextQuotationNo || getStandardQuotationRef(currentSettings.quotationPrefix || rawPrefix, nextSeq);
    setQuotationRefNumber(standardRef);
    setShowQuotationModal(true);
  };

  // ─── STEP 8B: AUTOMATIC CONTINUOUS SEQUENCE ADVANCE (ON DOWNLOAD, SHARE, SAVE) ────
  const advanceSequence = async () => {
    try {
      const currentPrefix = (companySettings.invoicePrefix || 'MF/INV/25-26').trim();
      const match = quotationRefNumber?.match(/(\d+)(?!.*\d)/);
      const currentSeq = match 
        ? parseInt(match[1], 10) 
        : (companySettings.nextQuotationNumber !== undefined ? parseInt(companySettings.nextQuotationNumber, 10) : 14);

      const res = await axios.post('/billing/advance-sequence', {
        currentSequenceNumber: currentSeq,
        prefix: currentPrefix
      });

      if (res.data?.success) {
        const nextSeq = res.data.nextQuotationNumber || res.data.nextSequenceNumber;
        setCompanySettings(prev => ({
          ...prev,
          nextQuotationNumber: nextSeq,
          nextQuotationNo: res.data.quotationNo || res.data.formattedNumber
        }));
        const quoteRef = res.data.quotationNo || res.data.formattedNumber || getStandardQuotationRef(currentPrefix, nextSeq);
        setQuotationRefNumber(quoteRef);
        return quoteRef;
      }
    } catch (e) {
      console.warn('Failed to advance sequence on backend, advancing locally:', e);
      const currentPrefix = (companySettings.invoicePrefix || 'MF/INV/25-26').trim();
      const match = quotationRefNumber?.match(/(\d+)(?!.*\d)/);
      const currentSeq = match ? parseInt(match[1], 10) : (companySettings.nextQuotationNumber || 14);
      const nextSeq = currentSeq + 1;
      setCompanySettings(prev => ({ ...prev, nextQuotationNumber: nextSeq }));
      const quoteRef = getStandardQuotationRef(currentPrefix, nextSeq);
      setQuotationRefNumber(quoteRef);
      return quoteRef;
    }
  };

  const handleGenerateQuotation = async () => {
    // Dismiss quotation modal so parent UI remains unlocked and fully interactive
    setShowQuotationModal(false);
    const payload = getQuotationPayload();
    try {
      const saved = await submitQuotationForAdminApproval('Print Quotation');
      const finalPayload = saved ? { ...payload, quotationRefNumber: saved.quotationNo } : payload;
      const htmlContent = buildQuotationHtml(finalPayload);
      triggerPrintQuotation(htmlContent);
      setToastMessage({ text: `Price quotation ${saved?.quotationNo || finalPayload.quotationRefNumber} sent to print & submitted to Admin for approval!`, type: 'success' });
    } catch (e) {
      const htmlContent = buildQuotationHtml(payload);
      triggerPrintQuotation(htmlContent);
    }
  };

  const handleCopyQuotationText = () => {
    const activeCustomerName = selectedCustomer?.companyName || selectedCustomer?.name || customClientName || 'Valued Trade Partner';
    const rateModeLabel = rateMode === 'EXCLUDE_TAX' ? 'Rate Exclude Tax' : 'Rate Include Tax';

    const seq = companySettings.nextQuotationNumber || 14;
    const currentQuoteRef = ensureQuotationRef(quotationRefNumber || companySettings.nextQuotationNo || getStandardQuotationRef(companySettings.invoicePrefix, seq), companySettings.invoicePrefix, seq);

    const textLines = [
      '====================================================',
      'MANSARA FOODS PVT. LTD. - WHOLESALE PRICE QUOTATION',
      `Quotation Ref: ${currentQuoteRef}`,
      `Date: ${new Date().toLocaleDateString('en-IN')}`,
      `Customer / Client: ${activeCustomerName}${selectedCustomer?.type ? ` [${selectedCustomer.type}]` : ''}`,
      selectedCustomer?.phone ? `Contact: ${selectedCustomer.phone}` : '',
      selectedCustomer?.gstNumber ? `GSTIN: ${selectedCustomer.gstNumber}` : '',
      `Rate Mode: ${rateModeLabel}`,
      '----------------------------------------------------',
      ...calculationSummary.items.map(i => {
        return `${i.name} (Qty: ${i.pieces.toLocaleString()} pcs / ${i.cartons} ctn) | MRP: ₹${i.mrp.toFixed(2)} | Margin: ${i.marginPct}% (-₹${i.marginDiscountPerUnit.toFixed(2)}) | Rate: ₹${i.displayedRate.toFixed(2)}/pc = ₹${i.lineFinalSellingTotal.toLocaleString('en-IN')}`;
      }),
      '----------------------------------------------------',
      `1. Total MRP: ₹${calculationSummary.totalMrpValue.toLocaleString('en-IN')}`,
      `2. Margin Deduction: -₹${calculationSummary.totalMarginDiscount.toLocaleString('en-IN')} (${calculationSummary.averageMarginPct}%)`,
      `3. Taxable Subtotal (Without Tax): ₹${calculationSummary.subtotalWithoutGst.toLocaleString('en-IN')}`,
      `4. GST: ${calculationSummary.isWithGst ? `${calculationSummary.gstRate}% (+₹${calculationSummary.totalGstAmount.toLocaleString('en-IN')})` : 'Without GST (0%)'}`,
      `5. Shipping Charges: ₹${calculationSummary.shippingCharges.toLocaleString('en-IN')}`,
      `6. Grand Total (Final Payable Amount): ₹${calculationSummary.grandTotal.toLocaleString('en-IN')}`,
      '===================================================='
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(textLines).then(async () => {
      try {
        await submitQuotationForAdminApproval('Copy Text');
      } catch (e) {}
      setToastMessage({ text: `Quotation text copied to clipboard & submitted to Admin for approval!`, type: 'success' });
    });
  };

  const handleQuotationRefChange = async (val) => {
    const formatted = ensureQuotationRef(
      val,
      companySettings.quotationPrefix || companySettings.invoicePrefix || 'MF/INV/25-26',
      companySettings.nextQuotationNumber || 14
    );
    setQuotationRefNumber(formatted);
    const match = formatted.match(/(\d+)(?!.*\d)/);
    if (match) {
      const seqNum = parseInt(match[1], 10);
      if (!isNaN(seqNum) && seqNum > 0) {
        setCompanySettings(prev => ({
          ...prev,
          nextQuotationNumber: seqNum,
          nextQuotationNo: formatted
        }));
        try {
          const res = await axios.post('/billing/set-quotation-sequence', { 
            sequenceNumber: seqNum,
            prefix: companySettings.invoicePrefix || 'MF/INV/25-26'
          });
          if (res.data?.success) {
            setToastMessage({
              text: `Quotation sequence set to ${formatted}. Quotations will continue in sequence from this number.`,
              type: 'info'
            });
          }
        } catch (err) {
          console.warn('Failed to sync quotation sequence setting to backend:', err);
        }
      }
    }
  };

  const getQuotationPayload = () => {
    const prefix = companySettings.invoicePrefix || 'MF/INV/25-26';
    const seq = companySettings.nextQuotationNumber || 14;
    const resolvedRef = ensureQuotationRef(quotationRefNumber || companySettings.nextQuotationNo || getStandardQuotationRef(prefix, seq), prefix, seq);
    return {
      calculationSummary,
      rateMode,
      selectedCustomer,
      customClientName,
      companySettings,
      quotationRefNumber: resolvedRef,
      quotationNotes
    };
  };

  const submitQuotationForAdminApproval = async (actionSource = 'Save and Draft') => {
    if (!calculationSummary.items || calculationSummary.items.length === 0) {
      return null;
    }
    const activeCustomerName = selectedCustomer?.companyName || selectedCustomer?.name || customClientName || 'Valued Trade Partner';
    const rawPrefix = companySettings.invoicePrefix || 'MF/INV/25-26';
    const seq = companySettings.nextQuotationNumber || 14;
    const quoteNo = ensureQuotationRef(quotationRefNumber || companySettings.nextQuotationNo || getStandardQuotationRef(rawPrefix, seq), rawPrefix, seq);

    const payload = {
      ...(submittedQuotation?._id && { id: submittedQuotation._id, quotationId: submittedQuotation._id }),
      quotationNo: quoteNo,
      customerId: selectedCustomer?.type === 'STORE' ? (selectedCustomer.id || selectedCustomer._id) : undefined,
      dealerId: selectedCustomer?.type === 'DEALER' ? (selectedCustomer.id || selectedCustomer._id) : undefined,
      customerName: activeCustomerName,
      customerPhone: selectedCustomer?.phone || '',
      customerAddress: selectedCustomer?.address || '',
      customerType: selectedCustomer?.type || 'PROSPECT',
      rateMode: calculationSummary.rateMode,
      items: calculationSummary.items.map(it => ({
        productId: it.productId,
        productName: it.name,
        quantity: it.pieces,
        pieces: it.pieces,
        cartons: it.cartons,
        mrp: it.mrp,
        marginPct: it.marginPct,
        finalSellingPrice: it.finalSellingPrice,
        rateExcludeTax: it.rateExcludeTax,
        unitGstAmount: it.unitGstAmount,
        displayedRate: it.displayedRate,
        unitPrice: it.displayedRate,
        discountPercent: it.marginPct,
        taxPercent: it.gstPercent || calculationSummary.gstRate,
        taxAmount: it.lineGstTotal,
        totalPrice: it.lineFinalSellingTotal
      })),
      rawItems: calculationSummary.items,
      subtotal: calculationSummary.subtotalWithoutGst,
      discountTotal: calculationSummary.totalMarginDiscount,
      taxTotal: calculationSummary.totalGstAmount,
      shippingCharges: calculationSummary.shippingCharges,
      grandTotal: calculationSummary.grandTotal,
      isWithGst: calculationSummary.isWithGst,
      status: 'PENDING_APPROVAL',
      specialTerms: quotationNotes ? `${quotationNotes}\n[Action: ${actionSource}]` : `[Action: ${actionSource}]`
    };

    const res = await axios.post('/field-sales/quotations', payload);
    if (res.data?.success) {
      const saved = res.data.data;
      setSubmittedQuotation(saved);
      if (res.data.nextQuotationNo) {
        setQuotationRefNumber(res.data.nextQuotationNo);
      }
      if (res.data.nextQuotationNumber) {
        setCompanySettings(prev => ({
          ...prev,
          nextQuotationNumber: res.data.nextQuotationNumber,
          nextQuotationNo: res.data.nextQuotationNo
        }));
      }
      return saved;
    }
    return null;
  };

  const handleSaveQuotationDraft = async () => {
    if (!calculationSummary.items || calculationSummary.items.length === 0) {
      setToastMessage({ text: 'Please add at least one product before saving quotation', type: 'error' });
      return;
    }

    setSavingDraft(true);
    try {
      const saved = await submitQuotationForAdminApproval('Save and Draft');
      if (saved) {
        setShowQuotationModal(false);
        setToastMessage({
          text: `Quotation "${saved.quotationNo}" saved & submitted to Admin for approval!`,
          type: 'success'
        });
      }
    } catch (err) {
      console.error('Failed to submit quotation for approval:', err);
      const errMsg = err.response?.data?.message || 'Failed to submit quotation for approval';
      setToastMessage({ text: errMsg, type: 'error' });
    } finally {
      setSavingDraft(false);
    }
  };

  const handleDownloadQuotation = async () => {
    if (!calculationSummary.items || calculationSummary.items.length === 0) {
      setToastMessage({ text: 'Please add at least one product before downloading quotation', type: 'error' });
      return;
    }
    const payload = getQuotationPayload();
    setDownloadingPdf(true);
    setToastMessage({ text: `Submitting Quotation & generating PDF...`, type: 'info' });
    try {
      const saved = await submitQuotationForAdminApproval('Download Quotation');
      const finalPayload = saved ? { ...payload, quotationRefNumber: saved.quotationNo } : payload;
      await downloadQuotationPdf(finalPayload);
      setToastMessage({ text: `Quotation ${saved?.quotationNo || finalPayload.quotationRefNumber} downloaded & submitted to Admin for approval!`, type: 'success' });
    } catch (err) {
      console.error('Error downloading quotation PDF, falling back to print dialog:', err);
      const htmlContent = buildQuotationHtml(payload);
      triggerPrintQuotation(htmlContent);
      setToastMessage({ text: `Quotation sent to print & submitted to Admin for approval!`, type: 'info' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleOpenWhatsAppShare = async () => {
    if (!calculationSummary.items || calculationSummary.items.length === 0) {
      setToastMessage({ text: 'Please add at least one product before sharing', type: 'error' });
      return;
    }
    const payload = getQuotationPayload();
    try {
      const saved = await submitQuotationForAdminApproval('Share via WhatsApp');
      const finalPayload = saved ? { ...payload, quotationRefNumber: saved.quotationNo } : payload;
      setActiveQuotationData(finalPayload);
      const text = formatQuotationWhatsAppText(finalPayload);
      const phone = selectedCustomer?.phone || '';
      setWhatsAppPhone(phone);
      setWhatsAppMessage(text);
      setShowWhatsAppModal(true);
      if (saved) {
        setToastMessage({
          text: `Quotation "${saved.quotationNo}" submitted to Admin for approval & opened for WhatsApp!`,
          type: 'success'
        });
      }
    } catch (err) {
      console.warn('Could not auto-submit quotation for approval on WhatsApp open:', err);
      setActiveQuotationData(payload);
      const text = formatQuotationWhatsAppText(payload);
      const phone = selectedCustomer?.phone || '';
      setWhatsAppPhone(phone);
      setWhatsAppMessage(text);
      setShowWhatsAppModal(true);
    }
  };

  const selectedDealer = useMemo(() => {
    return dealers.find(d => (d.id || d._id) === selectedDealerId) || null;
  }, [dealers, selectedDealerId]);



  return (
    <div className="space-y-4 sm:space-y-6 px-2.5 sm:px-4 lg:px-0 pb-32 sm:pb-24 font-sans text-slate-800 max-w-7xl mx-auto">
      {/* ─── TOAST NOTIFICATION ────────────────────────────────────────────── */}
      {toastMessage.text && (
        <div
          className={`fixed top-4 right-4 sm:top-5 sm:right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold animate-slide-in-right max-w-[90vw] ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span className="truncate">{toastMessage.text}</span>
        </div>
      )}

      {/* ─── DRAFT SAVED CONFIRMATION BANNER ─────────────────────────────────── */}
      {submittedQuotation && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 border border-emerald-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="font-black text-sm text-emerald-950 flex items-center gap-2">
                <span>Quotation Submitted for Admin Approval:</span>
                <span className="font-mono bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-md">{submittedQuotation.quotationNo}</span>
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Successfully submitted to Admin Approvals. Before approval, this remains strictly as a Quotation; upon approval by Admin, official Tax Invoice will be generated.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            <button
              type="button"
              onClick={() => navigate('/admin/sales-approvals', { state: { quotationNo: submittedQuotation.quotationNo, activeTab: 'quotations' } })}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer flex items-center gap-1.5 transition active:scale-95"
            >
              <span>Go to Admin Approvals</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSubmittedQuotation(null)}
              className="p-1.5 text-emerald-600 hover:text-emerald-900 rounded-lg hover:bg-emerald-200/50 cursor-pointer"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── CUSTOMER / TRADE PARTNER SELECTION & GST CONFIGURATION ──────── */}
      <div className={`${isSalesPerson ? 'relative' : 'sticky top-0 z-30'} bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 shadow-md space-y-3 sm:space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-slate-100 pb-2.5 sm:pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Store className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Customer / Trade Partner</span>
            </h2>
          </div>
        </div>

        {/* Customer Search Box & Selected Customer Display */}
        <div className="space-y-2">
          <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider">
            Search Customer (Dealer, Store, or Person)
          </label>

          {selectedCustomer ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl">
              <div className="flex items-start sm:items-center gap-3">
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-base sm:text-lg shrink-0 ${
                  selectedCustomer.type === 'DEALER'
                    ? 'bg-rose-600 text-white'
                    : selectedCustomer.type === 'STORE'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                }`}>
                  {selectedCustomer.type === 'DEALER' ? (
                    <Building2 className="w-5 h-5" />
                  ) : selectedCustomer.type === 'STORE' ? (
                    <Store className="w-5 h-5" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="font-black text-slate-900 text-xs sm:text-sm truncate">
                      {selectedCustomer.companyName || selectedCustomer.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
                      selectedCustomer.type === 'DEALER'
                        ? 'bg-rose-100 text-rose-700'
                        : selectedCustomer.type === 'STORE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {selectedCustomer.type === 'DEALER' ? 'Dealer' : selectedCustomer.type === 'STORE' ? 'Retail Store' : 'Walk-in'}
                    </span>
                    {selectedCustomer.allocatedMargin !== undefined && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 shadow-2xs">
                        <span>Allocated Margin:</span>
                        <span className="text-rose-700">{selectedCustomer.allocatedMargin}%</span>
                      </span>
                    )}
                    {selectedCustomer.gstNumber && (
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold bg-white text-slate-600 border border-slate-200 px-1.5 py-0.5 rounded-md">
                        GST: {selectedCustomer.gstNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                    {selectedCustomer.name && selectedCustomer.name !== selectedCustomer.companyName && (
                      <span className="text-slate-700 font-bold">Contact: {selectedCustomer.name}</span>
                    )}
                    {selectedCustomer.phone && <span>📞 {selectedCustomer.phone}</span>}
                    {selectedCustomer.city && <span>📍 {selectedCustomer.city}</span>}
                    {selectedCustomer.address && <span className="truncate max-w-[200px] sm:max-w-none">• {selectedCustomer.address}</span>}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearchQuery('');
                    setIsCustomerDropdownOpen(true);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer shadow-xs"
                >
                  Change Customer
                </button>
                <button
                  type="button"
                  onClick={handleClearCustomer}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
                  title="Remove customer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative" ref={customerDropdownRef}>
              <div className="flex items-center border border-slate-300 rounded-xl sm:rounded-2xl bg-white shadow-xs focus-within:ring-2 focus-within:ring-rose-500 focus-within:border-rose-500 overflow-hidden">
                <div className="pl-3.5 text-slate-400 shrink-0">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => {
                    setCustomerSearchQuery(e.target.value);
                    setIsCustomerDropdownOpen(true);
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  placeholder="Search dealer, store, phone, city, GST or type customer name..."
                  className="w-full py-2.5 sm:py-3 px-2.5 sm:px-3 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none"
                />
                {customerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCustomerSearchQuery('')}
                    className="pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

                {/* Autocomplete Dropdown */}
                {isCustomerDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {/* Add as Custom Person if search query entered */}
                    {customerSearchQuery.trim() && (
                      <div
                        onClick={() => handleSelectPerson(customerSearchQuery)}
                        className="p-3 hover:bg-indigo-50/70 transition cursor-pointer flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900">
                              Use &ldquo;{customerSearchQuery}&rdquo; as Customer / Person Name
                            </p>
                            <p className="text-[10px] text-indigo-600 font-medium">Direct individual client or walk-in prospect</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-100 text-indigo-700">
                          Person
                        </span>
                      </div>
                    )}

                    {/* Matching Dealers */}
                    {filteredCustomers.dealers.length > 0 && (
                      <div className="p-2 space-y-1">
                        <span className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-rose-500 block">
                          Registered Dealers ({filteredCustomers.dealers.length})
                        </span>
                        {filteredCustomers.dealers.map(d => (
                          <div
                            key={d.id}
                            onClick={() => handleSelectCustomer(d)}
                            className="p-2 rounded-xl hover:bg-rose-50/60 transition cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                                <Building2 className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{d.companyName}</p>
                                <p className="text-[10px] text-slate-400">
                                  {d.name && d.name !== d.companyName && `${d.name} • `}
                                  {d.city || 'Tamil Nadu'} {d.phone && `• ${d.phone}`} {d.gstNumber && `• GST: ${d.gstNumber}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {d.allocatedMargin !== undefined && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                                  {d.allocatedMargin}% Margin
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
                                Dealer
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Matching Stores */}
                    {filteredCustomers.stores.length > 0 && (
                      <div className="p-2 space-y-1">
                        <span className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                          Retail Outlet Stores ({filteredCustomers.stores.length})
                        </span>
                        {filteredCustomers.stores.map(s => (
                          <div
                            key={s.id}
                            onClick={() => handleSelectCustomer(s)}
                            className="p-2 rounded-xl hover:bg-emerald-50/60 transition cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                <Store className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{s.name}</p>
                                <p className="text-[10px] text-slate-400">
                                  {s.ownerName && `Owner: ${s.ownerName} • `}
                                  {s.city || 'Tamil Nadu'} {s.phone && `• ${s.phone}`} {s.gstNumber && `• GST: ${s.gstNumber}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {s.allocatedMargin !== undefined && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-50 text-amber-800 border border-amber-200">
                                  {s.allocatedMargin}% Margin
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Store
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Not Found in Directory footer */}
                    <div className="p-3 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-[11px] font-bold text-slate-500">
                        {filteredCustomers.totalMatches === 0 && !customerSearchQuery
                          ? 'Choose from catalog or register new:'
                          : filteredCustomers.totalMatches === 0
                          ? 'Store or dealer not found?'
                          : 'Not listed in directory?'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setShowRegisterStoreModal(true);
                            setIsCustomerDropdownOpen(false);
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Register Store</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowRegisterDealerModal(true);
                            setIsCustomerDropdownOpen(false);
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <Building2 className="w-3 h-3" />
                          <span>Register Dealer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      {/* ─── STEP 1, 2 & 3: PRODUCT, QUANTITY & MARGIN INPUT BAR ──────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 shadow-xs space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-3 sm:pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calculator className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Select Product &bull; Enter Qty &bull; Set Margin %</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              MRP is GST-inclusive. Margin is deducted from MRP to get Final Selling Price.
            </p>
          </div>

          {/* Rate Mode Toggle Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Rate Mode:</span>
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setRateMode('INCLUDE_TAX')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  rateMode === 'INCLUDE_TAX'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Rate Include Tax: Display Final Selling Price directly. Do not deduct GST from displayed rate."
              >
                <span>Rate Include Tax</span>
                {rateMode === 'INCLUDE_TAX' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
              <button
                type="button"
                onClick={() => setRateMode('EXCLUDE_TAX')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
                  rateMode === 'EXCLUDE_TAX'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Rate Exclude Tax: Taxable rate without GST"
              >
                <span>Rate Exclude Tax</span>
                {rateMode === 'EXCLUDE_TAX' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
              </button>
            </div>
          </div>
        </div>

        {/* Input Bar */}
        <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Input 1: Product Name */}
            <div className="md:col-span-5 space-y-1">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider">
                  1. Select Product Name ({availableProducts.length} Available)
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fetchProductsOnly(false)}
                    disabled={refreshingProducts}
                    title="Sync / refresh product list from database"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 hover:text-rose-700 bg-white hover:bg-rose-50 px-2 py-0.5 rounded-lg border border-slate-200 transition cursor-pointer disabled:opacity-50 shadow-2xs"
                  >
                    <RefreshCw className={`w-2.5 h-2.5 ${refreshingProducts ? 'animate-spin text-rose-600' : ''}`} />
                    <span>{refreshingProducts ? 'Syncing...' : 'Sync'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQuickAddModal(true)}
                    title="Quickly add a new product to catalog"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200 transition cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>New Product</span>
                  </button>
                </div>
              </div>
              <select
                value={selectedProductIdToAdd}
                onChange={(e) => setSelectedProductIdToAdd(e.target.value)}
                disabled={availableProducts.length === 0}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 sm:py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">
                  {availableProducts.length === 0
                    ? '-- All Catalog Products Already Added --'
                    : '-- Choose a Catalog Product --'}
                </option>
                {availableProducts.map(p => (
                  <option key={p.id || p._id} value={p.id || p._id}>
                    {p.name} (MRP: ₹{p.originalPrice || p.mrp || p.price || 0}) • {p.cartonSize || 24} pcs/ctn
                  </option>
                ))}
              </select>
            </div>

            {/* Input 2: Quantity & Quantity Type */}
            <div className="md:col-span-4 space-y-1">
              <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider">
                2. Enter Quantity & Type
              </label>
              <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-xs overflow-hidden">
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={quantityToAdd === '' ? '' : quantityToAdd}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setQuantityToAdd('');
                    } else {
                      const num = parseInt(val, 10);
                      setQuantityToAdd(isNaN(num) ? '' : Math.max(0, num));
                    }
                  }}
                  onBlur={() => {
                    if (quantityToAdd === '' || isNaN(quantityToAdd)) {
                      setQuantityToAdd(0);
                    }
                  }}
                  className="flex-1 min-w-0 py-2.5 sm:py-2 px-3 text-center font-black text-xs sm:text-sm text-slate-900 focus:outline-none"
                  title="Order Quantity"
                />
                <select
                  value={quantityUnitToAdd}
                  onChange={(e) => setQuantityUnitToAdd(e.target.value)}
                  className="bg-slate-100 hover:bg-slate-200 text-[11px] font-black text-slate-800 py-2.5 sm:py-2 px-3 border-l border-slate-300 focus:outline-none cursor-pointer shrink-0"
                  title="Quantity Type / Unit"
                >
                  <option value="PCS">Pcs</option>
                  <option value="Cartons">Cartons</option>
                  <option value="Packets">Packets</option>
                  <option value="Boxes">Boxes</option>
                  <option value="Kilograms">Kg</option>
                </select>
              </div>
            </div>

            {/* Input 3: Margin Percentage (%) */}
            <div className="md:col-span-3 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider">
                    3. Margin % (Discount)
                  </label>
                  {selectedCustomer?.allocatedMargin !== undefined && (
                    <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-md">
                      Allocated: {selectedCustomer.allocatedMargin}%
                    </span>
                  )}
                </div>
                {/* Quick Chips */}
                <div className="flex items-center gap-1">
                  {[10, 15, 20, 25].map(pct => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setMarginPctToAdd(pct)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                        marginPctToAdd === pct ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-xs overflow-hidden flex-1">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    step="0.5"
                    placeholder="Margin %"
                    value={marginPctToAdd}
                    onChange={(e) => setMarginPctToAdd(Math.max(0, Math.min(99, parseFloat(e.target.value) || 0)))}
                    className="w-full py-2.5 sm:py-2 px-3 text-center font-black text-xs sm:text-sm text-rose-700 focus:outline-none"
                  />
                  <span className="pr-3 text-xs font-black text-slate-400">%</span>
                </div>

                {/* Desktop Add Button */}
                <button
                  type="button"
                  disabled={!selectedProductIdToAdd}
                  onClick={handleAddSelectedProduct}
                  className="hidden md:flex px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs transition items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Full-Width Add Button for Mobile Devices */}
          <div className="md:hidden pt-1">
            <button
              type="button"
              disabled={!selectedProductIdToAdd}
              onClick={handleAddSelectedProduct}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-black text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 text-rose-400" />
              <span>Add Product to Calculation</span>
            </button>
          </div>

          {/* Real-Time Live Calculation Preview */}
          {selectedProductIdToAdd && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-slate-200/80 text-xs font-bold">
              {(() => {
                const prod = products.find(p => (p.id || p._id) === selectedProductIdToAdd);
                if (!prod) return null;
                const mrp = parseFloat(prod.originalPrice || prod.mrp || prod.price || 0);
                const pac = prod.cartonSize || 24;
                const marginPct = marginPctToAdd;
                const marginDiscount = (mrp * (marginPct / 100));
                const priceAfterMargin = Math.max(0, mrp - marginDiscount);
                const isWithGstCurrent = gstMode === 'WITH_GST';
                const gstPct = isWithGstCurrent ? Math.max(0, parseFloat(gstRate !== undefined ? gstRate : (prod.gstPercent || 5))) : 0;

                let rateExcludeTax = 0;
                let unitGst = 0;
                let finalSellingPrice = 0;
                let displayedRate = 0;

                if (rateMode === 'EXCLUDE_TAX') {
                  rateExcludeTax = priceAfterMargin;
                  unitGst = isWithGstCurrent && gstPct > 0 ? Math.round((rateExcludeTax * (gstPct / 100)) * 100) / 100 : 0;
                  finalSellingPrice = Math.round((rateExcludeTax + unitGst) * 100) / 100;
                  displayedRate = rateExcludeTax;
                } else {
                  finalSellingPrice = priceAfterMargin;
                  rateExcludeTax = isWithGstCurrent && gstPct > 0 ? Math.round((finalSellingPrice / (1 + gstPct / 100)) * 10000) / 10000 : finalSellingPrice;
                  unitGst = Math.max(0, Math.round((finalSellingPrice - rateExcludeTax) * 10000) / 10000);
                  displayedRate = finalSellingPrice;
                }

                return (
                  <>
                    <span className="text-slate-600 flex items-center gap-1.5 flex-wrap">
                      <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>
                        Catalog MRP: <strong className="text-slate-900 font-extrabold">₹{mrp.toFixed(2)}</strong> &bull; Margin ({marginPctToAdd}%): <strong className="text-rose-600 font-extrabold">-₹{marginDiscount.toFixed(2)}</strong> &bull; Taxable Base: <strong className="text-slate-900 font-extrabold">₹{rateExcludeTax.toFixed(2)}</strong> &bull; GST ({gstPct}%): <strong className="text-emerald-700 font-extrabold">+₹{unitGst.toFixed(2)}</strong>
                      </span>
                    </span>
                    <span className="text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-block">
                      {rateMode === 'EXCLUDE_TAX' ? 'Rate Excl. Tax: ' : 'Rate Incl. Tax (Selling): '}
                      <strong className="font-black text-xs sm:text-sm">₹{displayedRate.toFixed(2)} / pc</strong>
                      <span className="text-[11px] font-medium text-emerald-600 ml-1.5">
                        ({rateMode === 'EXCLUDE_TAX' ? `Final (Incl. Tax): ₹${finalSellingPrice.toFixed(2)} • ` : ''}Carton: ₹{(displayedRate * pac).toFixed(2)})
                      </span>
                    </span>
                  </>
                );
              })()}
            </div>
          )}
        </div>

        {/* ─── MOBILE VIEW: 4-COLUMN COMPACT TABLE (Screen width < 1024px) ─── */}
        <div className="lg:hidden border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
          <table className="w-full text-left text-xs table-fixed">
            <colgroup>
              <col className="w-[31%]" />
              <col className="w-[29%]" />
              <col className="w-[19%]" />
              <col className="w-[21%]" />
            </colgroup>
            <thead className="bg-slate-100 border-b border-slate-200 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-600">
              <tr>
                <th className="py-2.5 px-2 sm:px-2.5">Description &bull; MRP &bull; Pack</th>
                <th className="py-2.5 px-1 text-center bg-rose-50/50 text-rose-900">Quantity</th>
                <th className="py-2.5 px-1 text-center bg-amber-50/50 text-amber-900">
                  {rateMode === 'EXCLUDE_TAX' ? 'Margin / Rate (Excl)' : 'Margin / Rate (Incl)'}
                </th>
                <th className="py-2.5 px-2 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {calculationSummary.items.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-10 text-center bg-slate-50/50 px-4">
                    <div className="flex flex-col items-center justify-center gap-1.5 max-w-xs mx-auto text-slate-500">
                      <Package className="w-7 h-7 text-slate-300" />
                      <p className="font-bold text-xs text-slate-700">No products added yet</p>
                      <p className="text-[10px] text-slate-400">
                        Select product above, set quantity and margin % to simulate prices.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                calculationSummary.items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors align-top">
                    {/* Column 1: Description, MRP, Packs in Same Column */}
                    <td className="py-2.5 px-2 sm:px-2.5">
                      <p className="font-extrabold text-slate-900 text-[11px] sm:text-xs leading-tight line-clamp-2">
                        {item.name}
                      </p>
                      <span className="font-mono text-[9px] text-slate-400 block mt-0.5">{item.sku}</span>
                      
                      <div className="flex flex-col gap-0.5 mt-1.5">
                        <span className="text-[10px] text-slate-600 font-bold">
                          MRP: <strong className="text-slate-900 font-black">₹{item.mrp.toFixed(2)}</strong>
                        </span>
                        <span className="inline-block text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200/80 px-1.5 py-0.5 rounded-md w-fit">
                          Pack: {item.pacSize} pcs/ctn
                        </span>
                      </div>
                    </td>

                    {/* Column 2: Adjustable Quantity Column */}
                    <td className="py-2.5 px-1 bg-rose-50/15">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs w-full min-w-[115px] max-w-[130px] focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-400">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={item.quantity === '' ? '' : item.quantity}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                handleUpdateItem(item.id, 'quantity', '');
                              } else {
                                const num = parseInt(val, 10);
                                handleUpdateItem(item.id, 'quantity', isNaN(num) ? '' : Math.max(0, num));
                              }
                            }}
                            onBlur={() => {
                              if (item.quantity === '' || isNaN(item.quantity)) {
                                handleUpdateItem(item.id, 'quantity', 0);
                              }
                            }}
                            className="w-12 flex-1 min-w-[44px] py-1 px-1.5 text-center font-black text-xs text-slate-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            title="Adjust quantity"
                          />
                          <select
                            value={item.quantityUnit}
                            onChange={(e) => handleUpdateItem(item.id, 'quantityUnit', e.target.value)}
                            className="bg-slate-100 hover:bg-slate-200 text-[9px] font-black text-slate-800 py-1 px-1 border-l border-slate-300 focus:outline-none shrink-0 cursor-pointer"
                            title="Adjust unit"
                          >
                            <option value="PCS">pcs</option>
                            <option value="Cartons">ctn</option>
                            <option value="Packets">pkt</option>
                            <option value="Boxes">box</option>
                            <option value="Kilograms">kg</option>
                          </select>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono text-center leading-tight">
                          = {item.pieces.toLocaleString()} pcs
                          <span className="block text-[8px] text-slate-400 font-medium">({item.cartons} ctn)</span>
                        </span>
                      </div>
                    </td>

                    {/* Column 3: Margin Price Column */}
                    <td className="py-2.5 px-1 text-center bg-amber-50/15">
                      <div className="flex flex-col items-center gap-1">
                        {/* Adjustable Margin % Input */}
                        <div className="flex items-center border border-amber-300 rounded-lg overflow-hidden bg-white shadow-2xs w-full max-w-[62px] focus-within:ring-2 focus-within:ring-amber-500/20 focus-within:border-amber-400">
                          <input
                            type="number"
                            min="0"
                            max="99"
                            step="0.5"
                            value={item.marginPct}
                            onChange={(e) => handleUpdateItem(item.id, 'marginPct', Math.max(0, Math.min(99, parseFloat(e.target.value) || 0)))}
                            className="w-0 flex-1 min-w-0 py-1 px-1 text-center font-black text-xs text-rose-700 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            title="Adjust margin %"
                          />
                          <span className="pr-1 text-[9px] font-black text-slate-400 shrink-0">%</span>
                        </div>
                        {/* Calculated Rate */}
                        <span className="text-[11px] sm:text-xs font-black text-emerald-700 leading-tight">
                          ₹{item.displayedRate.toFixed(2)}
                          <span className="block text-[8px] text-slate-400 font-normal">
                            {rateMode === 'EXCLUDE_TAX' ? 'excl. tax' : 'incl. tax'}
                          </span>
                        </span>
                        <span className="text-[8px] text-rose-500 font-bold">
                          -₹{item.marginDiscountPerUnit.toFixed(2)} ({item.marginPct}%)
                        </span>
                      </div>
                    </td>

                    {/* Column 4: Line Total Column */}
                    <td className="py-2.5 px-2 text-right">
                      <div className="flex flex-col items-end justify-between h-full gap-2">
                        <div className="text-right">
                          <span className="block text-[11px] sm:text-xs font-black text-slate-900 leading-tight">
                            ₹{item.lineTaxableSubtotal.toFixed(2)}
                          </span>
                          {isWithGst && item.gstPercent > 0 ? (
                            <span className="block text-[8px] text-slate-400 font-medium mt-0.5">
                              (₹{item.lineFinalSellingTotal % 1 === 0 ? Math.round(item.lineFinalSellingTotal).toLocaleString('en-IN') : item.lineFinalSellingTotal.toFixed(2)} incl. tax)
                            </span>
                          ) : (
                            <span className="block text-[8px] text-slate-400 font-medium mt-0.5">
                              no tax
                            </span>
                          )}
                          <span className="block text-[8px] sm:text-[9px] text-slate-400 font-medium mt-0.5 whitespace-nowrap">
                            ₹{item.cartonPrice.toFixed(2)}/ctn
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Remove product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {calculationSummary.items.length > 0 && (
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 text-xs">
                <tr>
                  <td colSpan="3" className="py-2.5 px-2.5 text-right font-bold uppercase text-[10px] text-slate-700">
                    Subtotal:
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <span className="text-xs sm:text-sm font-mono font-bold text-slate-900">
                      ₹{calculationSummary.subtotalWithoutGst.toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* ─── DESKTOP VIEW: SIMULATION PRODUCTS TABLE (Screen width >= 1024px) ─── */}
        <div className="hidden lg:block border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600">
              <tr>
                <th className="py-3 px-4">Product Name & SKU</th>
                <th className="py-3 px-3 text-center">Pack Specs</th>
                <th className="py-3 px-4 text-center bg-rose-50/50 text-rose-900">Order Quantity</th>
                <th className="py-3 px-4 text-right">Catalog MRP</th>
                <th className="py-3 px-4 text-center bg-amber-50/50 text-amber-900">Margin %</th>
                <th className="py-3 px-3 text-right">Margin Discount</th>
                <th className="py-3 px-4 text-right bg-emerald-100/70 text-emerald-950 font-black">
                  {rateMode === 'EXCLUDE_TAX' ? 'Rate (Excl. Tax)' : 'Rate (Incl. Tax)'}
                </th>
                <th className="py-3 px-3 text-right">Carton Rate</th>
                <th className="py-3 px-4 text-right">Line Total Amount</th>
                <th className="py-3 px-3 text-center">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {calculationSummary.items.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center bg-slate-50/50">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto text-slate-500">
                      <Package className="w-8 h-8 text-slate-300" />
                      <p className="font-bold text-xs text-slate-700">No products added yet</p>
                      <p className="text-[11px] text-slate-400">
                        Select a product above, enter the quantity and margin percentage to calculate discounted prices.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                calculationSummary.items.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Product Name */}
                    <td className="py-3.5 px-4">
                      <p className="font-extrabold text-slate-900 text-xs leading-snug">{item.name}</p>
                      <span className="font-mono text-[10px] text-slate-400">{item.sku}</span>
                    </td>

                    {/* Pack Specs */}
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {item.pacSize} pcs/ctn
                      </span>
                    </td>

                    {/* Quantity & Unit Switch */}
                    <td className="py-3.5 px-4 text-center bg-rose-50/20">
                      <div className="inline-flex flex-col items-center gap-1">
                        <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs">
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={item.quantity === '' ? '' : item.quantity}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === '') {
                                handleUpdateItem(item.id, 'quantity', '');
                              } else {
                                const num = parseInt(val, 10);
                                handleUpdateItem(item.id, 'quantity', isNaN(num) ? '' : Math.max(0, num));
                              }
                            }}
                            onBlur={() => {
                              if (item.quantity === '' || isNaN(item.quantity)) {
                                handleUpdateItem(item.id, 'quantity', 0);
                              }
                            }}
                            className="w-20 py-1.5 px-2 text-center font-black text-xs text-slate-900 focus:outline-none"
                          />
                          <select
                            value={item.quantityUnit}
                            onChange={(e) => handleUpdateItem(item.id, 'quantityUnit', e.target.value)}
                            className="bg-slate-100 hover:bg-slate-200 text-[10px] font-black text-slate-800 py-1.5 px-2 border-l border-slate-300 focus:outline-none cursor-pointer"
                          >
                            <option value="PCS">Pcs</option>
                            <option value="Cartons">Cartons</option>
                            <option value="Packets">Packets</option>
                            <option value="Boxes">Boxes</option>
                            <option value="Kilograms">Kg</option>
                          </select>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono font-bold">
                          = {item.pieces.toLocaleString()} units ({item.cartons} ctn)
                        </span>
                      </div>
                    </td>

                    {/* MRP (Editable if needed) */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <span className="text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.mrp}
                          onChange={(e) => handleUpdateItem(item.id, 'mrp', Math.max(0, parseFloat(e.target.value) || 0))}
                          className="w-20 py-1 px-2 text-right font-black text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                      </div>
                    </td>

                    {/* Margin % (User Input to reduce price) */}
                    <td className="py-3.5 px-4 text-center bg-amber-50/20">
                      <div className="inline-flex items-center justify-center border border-amber-300 rounded-xl overflow-hidden bg-white shadow-xs">
                        <input
                          type="number"
                          min="0"
                          max="99"
                          step="0.5"
                          value={item.marginPct}
                          onChange={(e) => handleUpdateItem(item.id, 'marginPct', Math.max(0, Math.min(99, parseFloat(e.target.value) || 0)))}
                          className="w-16 py-1.5 px-2 text-center font-black text-xs text-rose-700 focus:outline-none"
                        />
                        <span className="pr-2 text-xs font-black text-slate-400">%</span>
                      </div>
                    </td>

                    {/* Margin Discount Amount per unit */}
                    <td className="py-3.5 px-3 text-right text-rose-600 font-bold">
                      -₹{item.marginDiscountPerUnit.toFixed(2)}
                    </td>

                    {/* Calculated Rate (Rate Include Tax or Rate Exclude Tax) */}
                    <td className="py-3.5 px-4 text-right bg-emerald-50/50">
                      <span className="text-sm font-black text-emerald-700">
                        ₹{item.displayedRate.toFixed(2)}
                      </span>
                      <span className="block text-[9px] text-slate-500 font-semibold">
                        {rateMode === 'EXCLUDE_TAX' ? 'excl. tax / unit' : 'incl. tax / unit'}
                      </span>
                      {rateMode === 'EXCLUDE_TAX' ? (
                        <span className="block text-[8px] text-slate-400 font-mono">
                          (GST: ₹{item.unitGstAmount.toFixed(2)} → Final: ₹{item.finalSellingPrice.toFixed(2)})
                        </span>
                      ) : (
                        <span className="block text-[8px] text-emerald-800/80 font-mono">
                          (Base: ₹{item.rateExcludeTax.toFixed(2)} + GST: ₹{item.unitGstAmount.toFixed(2)})
                        </span>
                      )}
                    </td>

                    {/* Carton Rate */}
                    <td className="py-3.5 px-3 text-right font-bold text-slate-800">
                      ₹{item.cartonPrice.toFixed(2)}
                      <span className="block text-[8px] text-slate-400 font-normal">
                        {rateMode === 'EXCLUDE_TAX' ? 'excl. tax' : 'incl. tax'}
                      </span>
                    </td>

                    {/* Total Line Amount */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-xs font-black text-slate-900 block leading-tight">
                        ₹{item.lineTaxableSubtotal.toFixed(2)}
                      </span>
                      {isWithGst && item.gstPercent > 0 ? (
                        <span className="block text-[9px] text-slate-500 font-medium">
                          (₹{item.lineFinalSellingTotal % 1 === 0 ? Math.round(item.lineFinalSellingTotal).toLocaleString('en-IN') : item.lineFinalSellingTotal.toFixed(2)} incl. tax)
                        </span>
                      ) : (
                        <span className="block text-[9px] text-slate-400 font-medium">
                          no tax
                        </span>
                      )}
                    </td>

                    {/* Remove Action */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Remove product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {calculationSummary.items.length > 0 && (
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 text-xs">
                <tr>
                  <td colSpan="8" className="py-2.5 px-4 text-right font-bold text-slate-700 text-[11px]">
                    Subtotal:
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900 text-xs">
                    ₹{calculationSummary.subtotalWithoutGst.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* ─── TAX, SHIPPING SETTINGS & GRAND TOTAL ─── */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full md:w-auto">
              {/* Rate Mode Switcher */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[11px] sm:text-xs font-bold text-slate-700">Rate Mode:</span>
                <div className="inline-flex p-0.5 bg-white rounded-lg border border-slate-300 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setRateMode('INCLUDE_TAX')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-black transition cursor-pointer ${
                      rateMode === 'INCLUDE_TAX'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Display Final Selling Price directly (no GST deduction from displayed rate)"
                  >
                    Rate Incl. Tax
                  </button>
                  <button
                    type="button"
                    onClick={() => setRateMode('EXCLUDE_TAX')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-black transition cursor-pointer ${
                      rateMode === 'EXCLUDE_TAX'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Rate Excl. Tax = Base taxable rate without GST"
                  >
                    Rate Excl. Tax
                  </button>
                </div>
              </div>

              {/* GST Rate */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                <span className="text-[11px] sm:text-xs font-bold text-slate-700">GST Rate:</span>
                <div className="flex items-center gap-1">
                  {[0, 5, 12, 18].map(rate => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setGstRate(rate)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        gstRate === rate
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
                <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden w-16 sm:w-20 px-2 py-1">
                  <input
                    type="number"
                    min="0"
                    max="40"
                    step="0.5"
                    value={gstRate}
                    onChange={(e) => setGstRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full text-xs font-bold text-slate-800 text-center focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                <span className="text-[11px] sm:text-xs font-bold text-slate-700">Shipping:</span>
                <div className="flex items-center border border-slate-300 rounded-lg bg-white overflow-hidden w-28 px-2 py-1">
                  <span className="text-xs text-slate-400 font-bold mr-1">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={shippingCharges}
                    onChange={(e) => setShippingCharges(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full text-xs font-bold text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="text-left md:text-right w-full md:w-auto text-[11px] sm:text-xs text-slate-500 font-medium pt-1 md:pt-0 border-t md:border-t-0 border-slate-200/60">
              Taxes &amp; freight auto-calculate in totals
            </div>
          </div>

          {/* Grand Total & Tax Breakdown Section */}
          {calculationSummary.items.length > 0 && (
            <div className="pt-3 border-t border-slate-200/80 space-y-1.5">
              {/* Taxable & GST Breakdown above Grand Total */}
              <div className="text-xs text-slate-600 font-medium">
                Taxable: ₹{calculationSummary.subtotalWithoutGst % 1 === 0 ? calculationSummary.subtotalWithoutGst.toLocaleString('en-IN') : calculationSummary.subtotalWithoutGst.toFixed(2)} | GST ({calculationSummary.gstRate}%): ₹{calculationSummary.totalGstAmount % 1 === 0 ? calculationSummary.totalGstAmount.toLocaleString('en-IN') : calculationSummary.totalGstAmount.toFixed(2)}
                {calculationSummary.shippingCharges > 0 && (
                  <> | Shipping: ₹{calculationSummary.shippingCharges.toFixed(2)}</>
                )}
              </div>

              {/* Grand Total */}
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-700">Grand Total:</span>
                <span className="text-lg sm:text-2xl font-black font-mono text-rose-600">
                  ₹{calculationSummary.grandTotal % 1 === 0 ? calculationSummary.grandTotal.toLocaleString('en-IN') : calculationSummary.grandTotal.toFixed(2)}
                </span>
                <span className="text-[10px] font-semibold text-slate-500">
                  ({calculationSummary.isWithGst ? 'Incl. GST' : 'Excl. GST'}{calculationSummary.shippingCharges > 0 ? ' & Freight' : ''})
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── ACTION DECK: GENERATE OFFICIAL QUOTATION ─────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 shadow-xs space-y-3 sm:space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-rose-600" />
            <span>Generate Official B2B Quotation</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Create an official Mansara Foods quotation document with customer details, itemized wholesale rates, taxes, and print/PDF generation.
          </p>
        </div>

        {/* Invoice Type Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <span className="text-[11px] sm:text-xs font-black text-slate-800 uppercase tracking-wider block">Invoice Mode:</span>
              <span className="text-[10px] text-slate-500 font-medium">
                {rateMode === 'EXCLUDE_TAX' ? 'Rate Exclude Tax (Taxable rate displayed without GST)' : 'Rate Include Tax (MRP is GST-inclusive)'}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setRateMode('INCLUDE_TAX')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                rateMode === 'INCLUDE_TAX'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Rate Incl. Tax
            </button>
            <button
              type="button"
              onClick={() => setRateMode('EXCLUDE_TAX')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                rateMode === 'EXCLUDE_TAX'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Rate Excl. Tax
            </button>
          </div>
        </div>

        {/* Active Quotation Sequence Tracker Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 bg-gradient-to-r from-amber-50/60 via-rose-50/50 to-white border border-rose-200/80 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-rose-600 text-white font-black text-xs shadow-xs">
              #
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 block">Current Quotation Ref</span>
                <span className="text-[9px] font-bold text-rose-600 bg-rose-100/90 border border-rose-200 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <PenLine className="w-2.5 h-2.5" /> Edit Sequence #
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <input
                  type="text"
                  value={quotationRefNumber || ''}
                  onChange={(e) => setQuotationRefNumber(e.target.value)}
                  onBlur={(e) => handleQuotationRefChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                  placeholder="MF/QN/25-26/0014"
                  className="font-mono font-black text-rose-900 text-sm tracking-tight bg-white border border-rose-300 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs w-48 sm:w-56"
                  title="Click to edit sequence or quotation number"
                />
              </div>
            </div>
          </div>
          <div className="text-[11px] font-semibold text-slate-500 bg-white/80 border border-slate-200/60 px-3 py-1 rounded-xl">
            Auto-increments &amp; sends for <span className="font-bold text-rose-700">Admin Approval</span> upon <span className="font-bold text-slate-800">Download</span>, <span className="font-bold text-slate-800">Share</span>, or <span className="font-bold text-slate-800">Save</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Save and Draft */}
          <button
            type="button"
            disabled={calculationSummary.items.length === 0 || savingDraft}
            onClick={handleSaveQuotationDraft}
            className="flex items-center gap-3 p-4 rounded-2xl border-2 border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white transition-all cursor-pointer group shadow-md active:scale-[0.99]"
            title="Save as Draft & Submit to Admin for Approval"
          >
            <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-rose-400" />
            </div>
            <div className="min-w-0 text-left">
              <h3 className="font-black text-xs sm:text-sm text-white">
                {savingDraft ? 'Saving Draft...' : 'Save and Draft'}
              </h3>
              <p className="text-[10px] text-slate-300">Save &amp; submit for Admin Approval</p>
            </div>
          </button>

          {/* 2. Download Quotation */}
          <button
            type="button"
            disabled={calculationSummary.items.length === 0 || downloadingPdf}
            onClick={handleDownloadQuotation}
            className="flex items-center gap-3 p-4 rounded-2xl border-2 border-rose-200 bg-rose-50 hover:bg-rose-100/80 disabled:opacity-40 text-rose-900 transition-all cursor-pointer group shadow-xs active:scale-[0.99]"
            title="Download PDF & Submit to Admin for Approval"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              {downloadingPdf ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Download className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="min-w-0 text-left">
              <h3 className="font-black text-xs sm:text-sm text-rose-950">
                {downloadingPdf ? 'Downloading PDF...' : 'Download Quotation'}
              </h3>
              <p className="text-[10px] text-rose-700/80">Save PDF &amp; send for Admin Approval</p>
            </div>
          </button>

          {/* 3. Share via WhatsApp */}
          <button
            type="button"
            disabled={calculationSummary.items.length === 0}
            onClick={handleOpenWhatsAppShare}
            className="flex items-center gap-3 p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100/80 disabled:opacity-40 text-emerald-900 transition-all cursor-pointer group shadow-xs active:scale-[0.99]"
            title="Share on WhatsApp & Submit to Admin for Approval"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.825zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.981-1.306A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
              </svg>
            </div>
            <div className="min-w-0 text-left">
              <h3 className="font-black text-xs sm:text-sm text-emerald-950">Share via WhatsApp</h3>
              <p className="text-[10px] text-emerald-700/80">Send to chat &amp; send for Admin Approval</p>
            </div>
          </button>
        </div>
      </div>

      {/* ─── STICKY MOBILE QUICK ACTION BAR (when products added) ─────────── */}
      {calculationSummary.items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-[0_-4px_25px_rgba(0,0,0,0.12)] flex items-center justify-between gap-2.5 animate-slide-in-up">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block truncate">
              {calculationSummary.items.length} {calculationSummary.items.length === 1 ? 'Product' : 'Products'} ({calculationSummary.totalPieces.toLocaleString()} pcs)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-slate-900 truncate">
                ₹{calculationSummary.grandTotal.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-bold text-slate-400 shrink-0">
                {gstMode === 'WITH_GST' ? 'incl. GST' : 'net'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenWhatsAppShare}
              className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md active:scale-95 transition cursor-pointer"
              title="Share on WhatsApp"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.825zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.981-1.306A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
              </svg>
            </button>
            <button
              type="button"
              disabled={downloadingPdf}
              onClick={handleDownloadQuotation}
              className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md active:scale-95 transition cursor-pointer disabled:opacity-50"
              title="Download Quotation"
            >
              {downloadingPdf ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              disabled={calculationSummary.items.length === 0 || savingDraft}
              onClick={handleSaveQuotationDraft}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>{savingDraft ? 'Saving...' : 'Save Draft'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── PRINTABLE FORMAL QUOTATION MODAL ──────────────────────────────── */}
      {showQuotationModal && (
        <div
          onClick={() => setShowQuotationModal(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2.5 sm:p-5 overflow-hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[94vh] sm:max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-zoom-in"
          >
            {/* Pinned Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="min-w-0 flex-1 pr-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight truncate">Official Wholesale Price Quotation</h3>
                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">Mansara Foods Pvt. Ltd. Official B2B Quote</p>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyQuotationText}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                  title="Copy Text Summary"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleOpenWhatsAppShare}
                  className="py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
                  title="Share Quotation on WhatsApp"
                >
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.825zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.981-1.306A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                  </svg>
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuotationDraft}
                  disabled={savingDraft}
                  className="py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 text-xs font-bold transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                  title="Save Quotation as Draft & Submit to Admin Invoice Requests"
                >
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  <span>{savingDraft ? 'Saving Draft...' : 'Save as Draft'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerateQuotation}
                  className="py-1.5 sm:py-2 px-3 sm:px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
                  title="Open Print Dialog"
                >
                  <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                  <span className="hidden sm:inline">Print / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQuotationModal(false)}
                  className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Printable Document Sheet Content */}
            <div className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5 bg-slate-50/60">
              <div ref={quotationRef} className="border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 bg-white space-y-4 sm:space-y-6 font-sans text-xs shadow-xs">
                {/* Company Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 border-b border-slate-200 pb-3 sm:pb-4">
                  <div>
                    <h4 className="text-lg sm:text-xl font-black text-rose-700 tracking-tight">MANSARA FOODS PVT. LTD.</h4>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">Manufacturers of Pure & Enriched Traditional Foods</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Tamil Nadu, India</p>
                  </div>
                  <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">Quotation Number</span>
                    <input
                      type="text"
                      value={quotationRefNumber}
                      onChange={(e) => setQuotationRefNumber(e.target.value)}
                      onBlur={(e) => handleQuotationRefChange(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                      className="font-mono font-black text-rose-700 text-xs sm:text-sm text-left sm:text-right bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-rose-500 w-full sm:w-auto"
                      placeholder="e.g. MF/QN/25-26/0014"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Date: {new Date().toLocaleDateString('en-IN')}</p>
                  </div>
                </div>

                {/* Client & Consignment Scope */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 sm:p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Quotation Prepared For:</span>
                    <p className="font-black text-slate-900 text-xs sm:text-sm">
                      {selectedCustomer?.companyName || selectedCustomer?.name || customClientName || 'Valued Trade Partner / Prospect Store'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {selectedCustomer?.type ? `[${selectedCustomer.type}] • ` : ''}
                      {selectedCustomer?.city || selectedDealer?.city || 'Tamil Nadu'} • {selectedCustomer?.phone || selectedDealer?.phone || 'B2B Trade Channel'}
                    </p>
                    {selectedCustomer?.gstNumber && (
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5 font-bold">GSTIN: {selectedCustomer.gstNumber}</p>
                    )}
                    {selectedCustomer?.address && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{selectedCustomer.address}</p>
                    )}
                  </div>
                  <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Order Consignment Scope</span>
                    <p className="font-bold text-slate-900">
                      {calculationSummary.totalPieces.toLocaleString()} units ({calculationSummary.totalCartons} Cartons)
                    </p>
                    <p className="text-[11px] text-emerald-700 font-extrabold mt-0.5">
                      {calculationSummary.items.length} Product SKUs &bull; Avg Margin: {calculationSummary.averageMarginPct}%
                    </p>
                  </div>
                </div>

                {/* Item Pricing Table Header with Rate Mode Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200">
                  <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    Consignment Products ({calculationSummary.items.length} items &bull; {calculationSummary.totalPieces.toLocaleString()} pcs)
                  </span>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <span className="text-[10px] font-black uppercase text-slate-400">Rate Mode:</span>
                    <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setRateMode('INCLUDE_TAX')}
                        className={`px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer ${
                          rateMode === 'INCLUDE_TAX' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Rate Incl. Tax
                      </button>
                      <button
                        type="button"
                        onClick={() => setRateMode('EXCLUDE_TAX')}
                        className={`px-2 py-0.5 rounded text-[10px] font-black transition cursor-pointer ${
                          rateMode === 'EXCLUDE_TAX' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Rate Excl. Tax
                      </button>
                    </div>
                  </div>
                </div>

                {/* Item Pricing Table: Responsive 4-col for Mobile (<1024px) & 6-col for Desktop (>=1024px) */}
                <div>
                  {/* Mobile 4-Column Table (<1024px) */}
                  <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden bg-white lg:hidden table-fixed text-xs shadow-2xs">
                    <colgroup>
                      <col className="w-[38%]" />
                      <col className="w-[19%]" />
                      <col className="w-[23%]" />
                      <col className="w-[20%]" />
                    </colgroup>
                    <thead className="bg-slate-100/90 border-b border-slate-200 text-[9px] sm:text-[10px] font-black uppercase text-slate-600">
                      <tr>
                        <th className="py-2.5 px-2 sm:px-2.5">Description &bull; MRP &bull; Pack</th>
                        <th className="py-2.5 px-1 sm:px-1.5 text-center">Order Qty</th>
                        <th className="py-2.5 px-1 sm:px-1.5 text-center">
                          {rateMode === 'EXCLUDE_TAX' ? 'Rate (Excl. Tax)' : 'Rate (Incl. Tax)'}
                        </th>
                        <th className="py-2.5 px-2 sm:px-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {calculationSummary.items.map(item => (
                        <tr key={item.id} className="align-top hover:bg-slate-50/50 transition-colors">
                          {/* Column 1: Description, MRP, Pack Specs */}
                          <td className="py-2.5 px-2 sm:px-2.5">
                            <p className="font-extrabold text-slate-900 text-[11px] sm:text-xs leading-tight line-clamp-2">{item.name}</p>
                            <p className="text-[9px] text-slate-400 font-mono mt-0.5">{item.sku}</p>
                            <div className="flex flex-col gap-0.5 mt-1.5">
                              <span className="text-[10px] text-slate-600 font-bold">
                                MRP: <strong className="text-slate-900 font-black">₹{item.mrp.toFixed(2)}</strong>
                              </span>
                              <span className="text-[9px] text-slate-500 font-bold bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded w-fit">
                                Pack: {item.pacSize} pcs/ctn
                              </span>
                            </div>
                          </td>

                          {/* Column 2: Order Quantity */}
                          <td className="py-2.5 px-1 sm:px-1.5 text-center">
                            <span className="font-black text-slate-800 text-[11px] sm:text-xs block leading-tight">{item.pieces.toLocaleString()} pcs</span>
                            <span className="block text-[8px] sm:text-[9px] text-slate-400 font-medium mt-0.5">({item.cartons} ctn)</span>
                          </td>

                          {/* Column 3: Displayed Rate */}
                          <td className="py-2.5 px-1 sm:px-1.5 text-center">
                            <span className="font-black text-emerald-700 text-[11px] sm:text-xs leading-tight block">
                              ₹{item.displayedRate.toFixed(2)}
                              <span className="text-[8px] text-slate-400 font-normal"> / pc</span>
                            </span>
                            <span className="text-[8px] text-slate-500 font-medium block">
                              {rateMode === 'EXCLUDE_TAX' ? 'excl. tax' : 'incl. tax'}
                            </span>
                            <span className="text-[8px] text-rose-600 font-extrabold block mt-0.5">
                              {item.marginPct}% Margin (-₹{item.marginDiscountPerUnit.toFixed(2)})
                            </span>
                          </td>

                          {/* Column 4: Line Total */}
                          <td className="py-2.5 px-2 sm:px-2.5 text-right">
                            <span className="font-black text-slate-900 text-xs sm:text-sm block leading-tight">
                              ₹{item.lineTaxableSubtotal.toFixed(2)}
                            </span>
                            {isWithGst && item.gstPercent > 0 ? (
                              <span className="block text-[8px] sm:text-[9px] text-slate-400 font-medium mt-0.5">
                                (₹{item.lineFinalSellingTotal % 1 === 0 ? Math.round(item.lineFinalSellingTotal).toLocaleString('en-IN') : item.lineFinalSellingTotal.toFixed(2)} incl. tax)
                              </span>
                            ) : (
                              <span className="block text-[8px] sm:text-[9px] text-slate-400 font-medium mt-0.5">
                                no tax
                              </span>
                            )}
                            <span className="block text-[8px] sm:text-[9px] text-slate-400 font-medium mt-0.5">
                              ₹{item.cartonPrice.toFixed(2)}/ctn
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Desktop 6-Column Table (>=1024px) */}
                  <div className="hidden lg:block overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-2xs">
                    <table className="w-full text-left text-xs min-w-[620px]">
                      <thead className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-black uppercase text-slate-600">
                        <tr>
                          <th className="py-2.5 px-3">Description & Pack</th>
                          <th className="py-2.5 px-3 text-center">Order Qty</th>
                          <th className="py-2.5 px-3 text-right">MRP</th>
                          <th className="py-2.5 px-3 text-center">Margin %</th>
                          <th className="py-2.5 px-3 text-right">
                            {rateMode === 'EXCLUDE_TAX' ? 'Rate (Excl. Tax)' : 'Rate (Incl. Tax)'}
                          </th>
                          <th className="py-2.5 px-3 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-xs">
                        {calculationSummary.items.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-2.5 px-3">
                              <p className="font-bold text-slate-900">{item.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">SKU: {item.sku} • {item.pacSize} pcs/carton</p>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="font-black text-slate-800">{item.pieces.toLocaleString()} pcs</span>
                              <span className="block text-[9px] text-slate-400 font-medium">({item.cartons} ctn)</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-600">₹{item.mrp.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-rose-600">{item.marginPct}%</td>
                            <td className="py-2.5 px-3 text-right font-black text-emerald-700">
                              ₹{item.displayedRate.toFixed(2)}
                              <span className="block text-[8px] text-slate-400 font-normal">
                                {rateMode === 'EXCLUDE_TAX' ? 'excl. tax' : 'incl. tax'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="font-black text-slate-900 block leading-tight">
                                ₹{item.lineTaxableSubtotal.toFixed(2)}
                              </span>
                              {isWithGst && item.gstPercent > 0 ? (
                                <span className="block text-[8px] text-slate-400 font-medium">
                                  (₹{item.lineFinalSellingTotal % 1 === 0 ? Math.round(item.lineFinalSellingTotal).toLocaleString('en-IN') : item.lineFinalSellingTotal.toFixed(2)} incl. tax)
                                </span>
                              ) : (
                                <span className="block text-[8px] text-slate-400 font-medium">
                                  no tax
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Totals Table */}
                <div className="flex justify-end">
                  <div className="w-full sm:w-84 space-y-2 p-3.5 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 text-xs shadow-xs">
                    {/* 1. Total MRP */}
                    <div className="flex justify-between text-slate-600">
                      <span className="font-medium">1. Total MRP (GST-inclusive):</span>
                      <strong className="text-slate-900 font-bold">₹{calculationSummary.totalMrpValue.toLocaleString('en-IN')}</strong>
                    </div>

                    {/* 2. Margin */}
                    <div className="flex justify-between text-amber-700">
                      <span className="font-medium">2. Margin ({calculationSummary.averageMarginPct}%):</span>
                      <strong className="font-bold">-₹{calculationSummary.totalMarginDiscount.toLocaleString('en-IN')}</strong>
                    </div>

                    {/* Final Selling Price */}
                    <div className="flex justify-between text-slate-800 pt-1.5 border-t border-slate-200">
                      <span className="font-semibold">Final Selling Price:</span>
                      <strong className="text-slate-900 font-black">₹{calculationSummary.totalFinalSellingRevenue.toLocaleString('en-IN')}</strong>
                    </div>

                    {/* Rate Mode Indicator */}
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>Rate Mode:</span>
                      <span className="font-bold text-slate-700">
                        {rateMode === 'EXCLUDE_TAX' ? 'Rate Exclude Tax' : 'Rate Include Tax'}
                      </span>
                    </div>

                    {/* 3. Taxable Subtotal */}
                    <div className="flex justify-between text-slate-600">
                      <span className="font-medium">
                        3. Taxable Subtotal (Without Tax):
                      </span>
                      <strong className="text-slate-900 font-bold">₹{calculationSummary.subtotalWithoutGst.toLocaleString('en-IN')}</strong>
                    </div>

                    {/* 4. GST Amount */}
                    <div className="flex justify-between text-slate-600">
                      <span className="font-medium">
                        {calculationSummary.isWithGst ? `4. GST Amount (${calculationSummary.gstRate}%):` : '4. Tax Status:'}
                      </span>
                      <strong className="text-slate-900 font-bold">
                        {calculationSummary.isWithGst
                          ? `+₹{calculationSummary.totalGstAmount.toLocaleString('en-IN')}`
                          : 'Without GST (0%)'}
                      </strong>
                    </div>

                    {/* 5. Shipping Charges */}
                    <div className="flex justify-between text-slate-600">
                      <span className="font-medium">5. Shipping Charges:</span>
                      <strong className="text-slate-900 font-bold">{calculationSummary.shippingCharges > 0 ? `+₹${calculationSummary.shippingCharges.toLocaleString('en-IN')}` : '₹0'}</strong>
                    </div>

                    {/* 6. Grand Total */}
                    <div className="flex justify-between text-slate-900 font-black text-sm pt-2.5 border-t border-slate-200">
                      <span>6. Grand Total (Payable):</span>
                      <span className="text-emerald-700 font-black text-base">₹{calculationSummary.grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Total Amount in Words */}
                <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl">
                  <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider block">Total Amount in Words:</span>
                  <p className="font-bold text-slate-800 text-xs mt-0.5 uppercase tracking-wide">
                    {numberToWords(Math.round(calculationSummary.grandTotal))}
                  </p>
                </div>

                {/* Bank Payment Details Section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div>
                    <h5 className="font-black text-slate-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5 mb-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-rose-600" />
                      <span>Mode of Payment (Bank Details)</span>
                    </h5>
                    <div className="space-y-1 text-slate-700 text-[11px]">
                      <p><span className="text-slate-500 font-medium">Bank Name:</span> <strong className="text-slate-900">{companySettings.bankDetails?.bankName || 'HDFC Bank Ltd.'}</strong></p>
                      <p><span className="text-slate-500 font-medium">Account No:</span> <strong className="text-slate-900 font-mono">{companySettings.bankDetails?.accountNo || '50200117036854'}</strong></p>
                      <p><span className="text-slate-500 font-medium">IFSC Code:</span> <strong className="text-slate-900 font-mono">{companySettings.bankDetails?.ifscCode || 'HDFC0001947'}</strong></p>
                      <p><span className="text-slate-500 font-medium">Branch:</span> <strong className="text-slate-900">{companySettings.bankDetails?.branch || 'Iyyapanthangal Branch'}</strong></p>
                      <p><span className="text-slate-500 font-medium">Account Type:</span> <strong className="text-slate-900">{companySettings.bankDetails?.accountType || 'Current'}</strong></p>
                    </div>
                  </div>
                  <div>
                    <h5 className="font-black text-slate-900 uppercase tracking-wider text-[10px] mb-1.5">Terms &amp; Conditions</h5>
                    <p className="text-[11px] text-slate-600 whitespace-pre-line leading-relaxed">
                      {companySettings.invoiceTerms || '1. Payment within 15 days from delivery.\n2. Interest @ 2% per month on overdue payment.\n3. Goods once sold cannot be returned unless transit damage is reported upon receipt.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pinned Modal Footer */}
            <div className="px-4 sm:px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="text-xs text-slate-500 font-medium hidden sm:block truncate pr-2">
                Quotation Ref: <span className="font-mono font-bold text-slate-800">{quotationRefNumber}</span> • Payable: <span className="font-bold text-emerald-700">₹{calculationSummary.grandTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowQuotationModal(false)}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 transition cursor-pointer text-center"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleCopyQuotationText}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5"
                  title="Copy Text to Clipboard"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copy Text</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenWhatsAppShare}
                  className="px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95"
                  title="Share on WhatsApp"
                >
                  <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.275.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.825zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.981-1.306A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
                  </svg>
                  <span>Share on WhatsApp</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuotationDraft}
                  disabled={savingDraft}
                  className="px-3 sm:px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-95 disabled:opacity-50"
                  title="Save Quotation as Draft & Request Invoice Approval"
                >
                  <FileText className="w-4 h-4" />
                  <span>{savingDraft ? 'Saving Draft...' : 'Save as Draft'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleGenerateQuotation}
                  className="px-3 sm:px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
                  title="Open Print Dialog"
                >
                  <Printer className="w-4 h-4 text-rose-400" />
                  <span>Print / PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: REGISTER NEW STORE ─────────────────────────────────────── */}
      {showRegisterStoreModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-3.5 sm:space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">Register New Retail Store</h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400">Add an outlet to the directory & select immediately</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterStoreModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterStoreSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Store / Outlet Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sri Murugan Maligai Store"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Owner / Contact Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Murugan"
                    value={storeForm.ownerName}
                    onChange={(e) => setStoreForm({ ...storeForm, ownerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    value={storeForm.phone}
                    onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Shop Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12 Bazaar Main Road"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Madurai"
                    value={storeForm.city}
                    onChange={(e) => setStoreForm({ ...storeForm, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pincode</label>
                  <input
                    type="text"
                    placeholder="625001"
                    value={storeForm.pincode}
                    onChange={(e) => setStoreForm({ ...storeForm, pincode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="GST Number"
                    value={storeForm.gstNumber}
                    onChange={(e) => setStoreForm({ ...storeForm, gstNumber: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Associated Dealer (Optional)</label>
                <select
                  value={storeForm.dealerId}
                  onChange={(e) => setStoreForm({ ...storeForm, dealerId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none"
                >
                  <option value="">-- Standalone Outlet / None --</option>
                  {dealers.map(d => (
                    <option key={d.id || d._id} value={d.id || d._id}>
                      {d.companyName || d.name} ({d.city || 'TN'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterStoreModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReg}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md cursor-pointer text-xs"
                >
                  {submittingReg ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save & Select Store</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: REGISTER NEW DEALER ─────────────────────────────────────── */}
      {showRegisterDealerModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-3.5 sm:space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">Register New Wholesale Dealer</h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400">Add an official distributor to directory</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterDealerModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterDealerSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Company / Firm Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Traders"
                    value={dealerForm.companyName}
                    onChange={(e) => setDealerForm({ ...dealerForm, companyName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Contact Person Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Kumar"
                    value={dealerForm.name}
                    onChange={(e) => setDealerForm({ ...dealerForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9840123456"
                    value={dealerForm.phone}
                    onChange={(e) => setDealerForm({ ...dealerForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="dealer@example.com"
                    value={dealerForm.email}
                    onChange={(e) => setDealerForm({ ...dealerForm, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Business Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 45 Wholesale Market Road"
                  value={dealerForm.address}
                  onChange={(e) => setDealerForm({ ...dealerForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Chennai"
                    value={dealerForm.city}
                    onChange={(e) => setDealerForm({ ...dealerForm, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Pincode</label>
                  <input
                    type="text"
                    placeholder="600001"
                    value={dealerForm.pincode}
                    onChange={(e) => setDealerForm({ ...dealerForm, pincode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="33AAAAA0000A1Z5"
                    value={dealerForm.gstNumber}
                    onChange={(e) => setDealerForm({ ...dealerForm, gstNumber: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Default Margin Discount (%)</label>
                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={dealerForm.defaultMargin}
                    onChange={(e) => setDealerForm({ ...dealerForm, defaultMargin: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-transparent font-bold text-slate-900 focus:outline-none"
                  />
                  <span className="text-slate-400 font-bold ml-1">%</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterDealerModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReg}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md cursor-pointer text-xs"
                >
                  {submittingReg ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save & Select Dealer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── QUICK ADD PRODUCT MODAL ─── */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">Add New Catalog Product</h3>
                  <p className="text-[11px] text-slate-500">Instantly creates product and selects it in simulator</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAddModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickAddProduct} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Product Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mansara Idly Podi 100g"
                  value={quickAddForm.name}
                  onChange={(e) => setQuickAddForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    SKU Code
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if blank"
                    value={quickAddForm.sku}
                    onChange={(e) => setQuickAddForm(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    MRP (₹) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="100.00"
                    value={quickAddForm.mrp}
                    onChange={(e) => setQuickAddForm(prev => ({ ...prev, mrp: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Carton Pack
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quickAddForm.cartonSize}
                    onChange={(e) => setQuickAddForm(prev => ({ ...prev, cartonSize: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    Net Wt (g)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quickAddForm.weight}
                    onChange={(e) => setQuickAddForm(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    GST Rate
                  </label>
                  <select
                    value={quickAddForm.gstPercent}
                    onChange={(e) => setQuickAddForm(prev => ({ ...prev, gstPercent: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-1.5 text-xs font-bold"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuickProduct}
                  className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingQuickProduct ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save & Select</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── WHATSAPP SHARE MODAL ─────────────────────────────────────────── */}
      <WhatsAppShareModal
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        defaultPhone={whatsAppPhone}
        defaultMessage={whatsAppMessage}
        quotationData={activeQuotationData}
        onActionCompleted={async () => {
          try {
            await submitQuotationForAdminApproval('WhatsApp Shared');
          } catch (e) {}
          await advanceSequence();
        }}
      />
    </div>
  );
}
