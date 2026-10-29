// src/pages/admin/PriceSimulatorPage.jsx
// Mansara Foods B2B Price & Margin Simulator
// Pure, Direct Workflow:
// 1. Select Product Name
// 2. Enter Quantity & Unit Type
// 3. Set Margin Percentage (%) -> Wholesale Price = MRP - (MRP * Margin% / 100)
// 4. Generate Quotation & Export Excel

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ChevronDown
} from 'lucide-react';

export default function PriceSimulatorPage() {
  // ─── DATA FETCHING ──────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  // ─── CUSTOMER SEARCH & SELECTION ───────────────────────────────────────────
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef(null);

  // ─── TAXATION (WITH / WITHOUT GST) & FREIGHT ────────────────────────────────
  const [gstMode, setGstMode] = useState('WITH_GST'); // 'WITH_GST' | 'WITHOUT_GST'
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
  const [quantityToAdd, setQuantityToAdd] = useState(200);
  const [quantityUnitToAdd, setQuantityUnitToAdd] = useState('PCS');
  const [marginPctToAdd, setMarginPctToAdd] = useState(20); // Default 20% margin from MRP

  // ─── QUOTATION MODAL ────────────────────────────────────────────────────────
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState('');
  const [customClientName, setCustomClientName] = useState('');
  const [quotationNotes, setQuotationNotes] = useState('');
  const [quotationRefNumber, setQuotationRefNumber] = useState('');
  const quotationRef = useRef(null);

  // Exact company & invoice settings matching the dealer invoice template
  const [companySettings, setCompanySettings] = useState({
    companyName: 'MANSARA FOODS PVT. LTD.',
    gstNumber: '33AABCM1234F1Z5',
    address: 'Flat No. B4, No.13, Balaji Nagar 1st street extn, Noombal',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600077',
    phone: '+91-88388 87064',
    email: 'contact@mansarafoods.com',
    placeOfSupply: 'Tamil Nadu (33)',
    bankDetails: {
      bankName: 'HDFC Bank Ltd.',
      accountNo: '50200012345678',
      ifscCode: 'HDFC0001234',
      branch: 'Chennai Central',
      accountType: 'Current',
      upiId: 'mansarafoods@hdfcbank'
    },
    signatoryTitle: 'Authorised Signatory',
    signatoryName: 'Mansara Foods Pvt. Ltd.',
    invoiceTerms: '1. Quotation valid for 15 days from issue date.\n2. Wholesale pricing is contingent upon order quantities and margin tiers selected.\n3. Goods once sold cannot be returned unless transit damage is reported upon receipt.'
  });

  // Convert numbers to Indian words (exact match to dealer invoice format)
  const numberToWords = (num) => {
    if (!num || isNaN(num)) return 'ZERO';
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE',
      'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
    const n = Math.round(num);
    if (n === 0) return 'ZERO';
    const convert = (n) => {
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' AND ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' LAKH' + (n % 100000 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' CRORE' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    };
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
        axios.get('/products?limit=100').catch(() => ({ data: { data: [] } })),
        axios.get('/dealers').catch(() => ({ data: { data: [] } })),
        axios.get('/stores').catch(() => ({ data: { data: [] } })),
        axios.get('/billing/settings').catch(() => ({ data: { data: null } }))
      ]);

      setProducts(prodRes.data.data || []);
      setDealers(dealerRes.data.data || []);
      setStores(storeRes.data.data || []);
      if (settingsRes.data?.success && settingsRes.data.data) {
        setCompanySettings(prev => ({ ...prev, ...settingsRes.data.data }));
      }
      setSimulationItems([]); // Clean slate: Zero mock data
    } catch (err) {
      console.error('Failed to load simulator data:', err);
      setToastMessage({ text: 'Failed to load catalog products', type: 'error' });
    } finally {
      setLoading(false);
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
    const safeQty = Math.max(1, parseFloat(quantityToAdd) || 1);
    const safeMargin = Math.max(0, Math.min(99, parseFloat(marginPctToAdd) || 0));

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
      gstPercent: parseFloat(prod.gstPercent || 5),
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
      gstPercent: 5,
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
      .map(d => ({
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
        email: d.email || ''
      }));

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
      .map(s => ({
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
        dealerId: s.dealerId || null
      }));

    return {
      dealers: matchedDealers.slice(0, 10),
      stores: matchedStores.slice(0, 10),
      totalMatches: matchedDealers.length + matchedStores.length
    };
  }, [dealers, stores, customerSearchQuery]);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomClientName(customer.companyName || customer.name);
    if (customer.type === 'DEALER') {
      setSelectedDealerId(customer.id);
    } else {
      setSelectedDealerId('');
    }
    setIsCustomerDropdownOpen(false);
    setCustomerSearchQuery('');
    setToastMessage({ text: `Selected: ${customer.companyName || customer.name} (${customer.type === 'DEALER' ? 'Dealer' : 'Store'})`, type: 'success' });
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
      email: ''
    };
    setSelectedCustomer(personCustomer);
    setCustomClientName(trimmed);
    setSelectedDealerId('');
    setIsCustomerDropdownOpen(false);
    setCustomerSearchQuery('');
    setToastMessage({ text: `Selected "${trimmed}" as Direct Client / Person`, type: 'success' });
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomClientName('');
    setSelectedDealerId('');
    setCustomerSearchQuery('');
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
        ownerName: storeForm.ownerName.trim(),
        phone: storeForm.phone.trim(),
        address: storeForm.address.trim(),
        city: storeForm.city.trim(),
        state: storeForm.state || 'Tamil Nadu',
        pincode: storeForm.pincode.trim(),
        gstNumber: storeForm.gstNumber.trim().toUpperCase(),
        dealerId: storeForm.dealerId || undefined
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
        gstNumber: newStore.gstNumber || ''
      });

      setShowRegisterStoreModal(false);
      setStoreForm({ name: '', ownerName: '', phone: '', address: '', city: '', state: 'Tamil Nadu', pincode: '', gstNumber: '', dealerId: '' });
      setToastMessage({ text: `Store "${newStore.name}" registered & selected!`, type: 'success' });
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
        email: email
      });

      setShowRegisterDealerModal(false);
      setDealerForm({ companyName: '', name: '', phone: '', email: '', address: '', city: '', state: 'Tamil Nadu', pincode: '', gstNumber: '', defaultMargin: 10 });
      setToastMessage({ text: `Dealer "${newDealer.companyName}" registered & selected!`, type: 'success' });
    } catch (err) {
      console.error('Failed to register dealer:', err);
      const errMsg = err.response?.data?.message || 'Failed to register dealer';
      setToastMessage({ text: errMsg, type: 'error' });
    } finally {
      setSubmittingReg(false);
    }
  };

  // ─── CALCULATION ENGINE: MRP - (MRP * MARGIN% / 100) ────────────────────────
  const calculationSummary = useMemo(() => {
    let totalPieces = 0;
    let totalCartons = 0;
    let totalMrpValue = 0;
    let totalWholesaleRevenue = 0;
    let totalMarginDiscount = 0;

    const items = simulationItems.map(item => {
      const pacSize = Math.max(1, parseInt(item.cartonSize, 10) || 24);
      const rawQty = Math.max(1, parseFloat(item.quantity) || 1);
      const isBulkCarton = item.quantityUnit === 'Cartons' || item.quantityUnit === 'Boxes';
      const pieces = isBulkCarton ? rawQty * pacSize : rawQty;
      const cartons = isBulkCarton ? rawQty : parseFloat((pieces / pacSize).toFixed(2));

      const mrp = Math.max(0, parseFloat(item.mrp) || 0);
      const marginPct = Math.max(0, Math.min(99, parseFloat(item.marginPct) || 0));

      // Actual user calculation: Reduce margin percentage from MRP
      const marginDiscountPerUnit = Math.round((mrp * (marginPct / 100)) * 100) / 100;
      const wholesalePricePerUnit = Math.max(0, Math.round((mrp - marginDiscountPerUnit) * 100) / 100);
      const cartonPrice = Math.round((wholesalePricePerUnit * pacSize) * 100) / 100;

      const lineMrpValue = Math.round((mrp * pieces) * 100) / 100;
      const lineWholesaleTotal = Math.round((wholesalePricePerUnit * pieces) * 100) / 100;
      const lineMarginDiscountTotal = Math.round((marginDiscountPerUnit * pieces) * 100) / 100;

      totalPieces += pieces;
      totalCartons += cartons;
      totalMrpValue += lineMrpValue;
      totalWholesaleRevenue += lineWholesaleTotal;
      totalMarginDiscount += lineMarginDiscountTotal;

      return {
        ...item,
        pacSize,
        pieces,
        cartons,
        mrp,
        marginPct,
        marginDiscountPerUnit,
        wholesalePricePerUnit,
        cartonPrice,
        lineMrpValue,
        lineWholesaleTotal,
        lineMarginDiscountTotal
      };
    });

    const averageMarginPct = totalMrpValue > 0 ? Math.round((totalMarginDiscount / totalMrpValue) * 1000) / 10 : 0;
    
    // 1. Total MRP: totalMrpValue
    // 2. Margin: totalMarginDiscount
    // 3. Sub(total) without GST: subtotalWithoutGst
    const subtotalWithoutGst = Math.max(0, Math.round(totalWholesaleRevenue * 100) / 100);
    
    // 4. GST Percentage: gstRate & totalGstAmount
    const isWithGst = gstMode === 'WITH_GST';
    const currentGstRate = isWithGst ? Math.max(0, parseFloat(gstRate) || 0) : 0;
    const totalGstAmount = isWithGst ? Math.round((subtotalWithoutGst * (currentGstRate / 100)) * 100) / 100 : 0;
    
    // 5. Shipping Charges: parsedShipping
    const parsedShipping = Math.max(0, parseFloat(shippingCharges) || 0);
    
    // 6. Grand Total: grandTotal
    const grandTotal = Math.round((subtotalWithoutGst + totalGstAmount + parsedShipping) * 100) / 100;

    return {
      totalPieces,
      totalCartons,
      totalMrpValue: Math.round(totalMrpValue * 100) / 100,
      totalMarginDiscount: Math.round(totalMarginDiscount * 100) / 100,
      averageMarginPct,
      subtotalWithoutGst,
      isWithGst,
      gstMode,
      gstRate: currentGstRate,
      totalGstAmount,
      shippingCharges: parsedShipping,
      grandTotal,
      totalWholesaleRevenue: Math.round(totalWholesaleRevenue * 100) / 100,
      items
    };
  }, [simulationItems, gstMode, gstRate, shippingCharges]);

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
      'Catalog MRP (₹)',
      'Margin Percentage (%)',
      'Margin Discount / Unit (₹)',
      'Wholesale Price / Unit (₹)',
      'Wholesale Carton Price (₹)',
      'Total MRP Value (₹)',
      'Total Margin Discount (₹)',
      'Total Wholesale Amount (₹)'
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
      item.wholesalePricePerUnit.toFixed(2),
      item.cartonPrice.toFixed(2),
      item.lineMrpValue.toFixed(2),
      item.lineMarginDiscountTotal.toFixed(2),
      item.lineWholesaleTotal.toFixed(2)
    ]);

    const activeCustomerName = selectedCustomer?.companyName || selectedCustomer?.name || customClientName || 'Valued Trade Partner';
    const activeCustomerType = selectedCustomer?.type ? ` (${selectedCustomer.type})` : '';

    const summaryRows = [
      [],
      ['--- CUSTOMER & CONSIGNMENT SUMMARY ---', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Customer / Partner', `${activeCustomerName}${activeCustomerType}`],
      ['Total Order Units', totalPieces],
      ['Total Cartons Count', totalCartons],
      ['1. Total MRP (₹)', totalMrpValue.toFixed(2)],
      ['2. Margin (₹)', `-${totalMarginDiscount.toFixed(2)} (${averageMarginPct}%)`],
      ['3. Sub(total) without GST (₹)', subtotalWithoutGst.toFixed(2)],
      ['4. GST Status & Amount (₹)', isWithGst ? `${currentGstRate}% (+₹${totalGstAmount.toFixed(2)})` : 'Without GST (₹0.00)'],
      ['5. Shipping Charges (₹)', currentShipping.toFixed(2)],
      ['6. Grand Total (₹)', grandTotal.toFixed(2)]
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
  const handleOpenQuotation = () => {
    if (!calculationSummary.items || calculationSummary.items.length === 0) {
      setToastMessage({ text: 'Please add at least one product before generating an invoice', type: 'error' });
      return;
    }
    const prefix = companySettings.invoicePrefix || 'MF-INV';
    const yrMonth = `${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    setQuotationRefNumber(`${prefix}-${yrMonth}-${Math.floor(1000 + Math.random() * 9000)}`);
    setShowQuotationModal(true);
  };

  const handleGenerateQuotation = () => {
    const shipToName = selectedCustomer?.companyName || selectedCustomer?.name || customClientName || 'Valued Dealer';
    const shipToAddr = selectedCustomer?.address || '';
    const shipToCity = selectedCustomer?.city || '';
    const shipToState = selectedCustomer?.state || '';
    const shipToPin = selectedCustomer?.pincode || '';
    const shipToGst = selectedCustomer?.gstNumber || 'N/A';
    const shipToPhone = selectedCustomer?.phone || '';

    const billerName = companySettings.companyName || companySettings.name || 'MANSARA FOODS PVT. LTD.';
    const billerAddress = companySettings.address || 'Flat No. B4, No.13, Balaji Nagar 1st street extn, Noombal';
    const billerCity = companySettings.city || 'Chennai';
    const billerState = companySettings.state || 'Tamil Nadu';
    const billerPin = companySettings.pincode || '600077';
    const billerGst = companySettings.gstNumber || '27AABCM1234F1Z5';
    const billerPhone = companySettings.phone || '+91-88388 87064';
    const placeOfSupply = companySettings.placeOfSupply || 'Tamil Nadu (33)';
    const bd = companySettings.bankDetails || {};
    const signatoryTitle = companySettings.signatoryTitle || 'Authorised Signatory';
    const signatoryName = companySettings.signatoryName || 'Mansara Foods Pvt. Ltd.';

    // Clean address formatting without repeating state or city (exact dealer invoice logic)
    const addrParts = [];
    if (billerAddress) addrParts.push(billerAddress.trim().replace(/,\s*$/, ''));
    if (billerCity && !billerAddress?.includes(billerCity)) addrParts.push(billerCity.trim());
    if (billerState && !billerAddress?.includes(billerState)) {
      if (billerPin && !billerAddress?.includes(billerPin)) {
        addrParts.push(`${billerState.trim()} - ${billerPin.trim()}`);
      } else {
        addrParts.push(billerState.trim());
      }
    } else if (billerPin && !billerAddress?.includes(billerPin)) {
      addrParts.push(billerPin.trim());
    }
    const formattedBillerAddress = addrParts.join(', ') + (addrParts.length ? '. India.' : '');

    const invDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
    const dueDate = new Date(Date.now() + 15 * 86400000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });

    let logoHtml = '';
    const activeLogo = companySettings.logoBase64 || companySettings.logoUrl;
    if (activeLogo) {
      const src = activeLogo.startsWith('data:') || activeLogo.startsWith('http')
        ? activeLogo
        : (activeLogo.startsWith('/') ? `${window.location.origin}${activeLogo}` : `data:image/png;base64,${activeLogo}`);
      logoHtml = `<img src="${src}" style="max-height:65px;max-width:180px;object-fit:contain;" alt="${billerName}" />`;
    } else {
      logoHtml = `<img src="${window.location.origin}/logo.png" style="max-height:65px;max-width:180px;object-fit:contain;" onerror="this.style.display='none'" alt="${billerName}" />`;
    }

    const isGstEnabled = calculationSummary.isWithGst;
    const currentGstRate = calculationSummary.gstRate || 0;

    // Exact Mansara Dealer Format: S.NO | HSN | ITEM | NET WT (G) | RATE (RS.) | PAC | WT/ CTN (KG) | CTNS | TOT. QTY | TOTAL NT WT (KG) | PRICE
    const itemsRows = calculationSummary.items.map((item, idx) => {
      const productName = item.name || 'Product';
      const hsn = item.hsnCode || '1901';
      const netWtG = parseWeightG(item.netWeightG);
      const pac = item.pacSize || 24;
      const wtPerCtn = item.wtPerCartonKg || ((netWtG * pac) / 1000).toFixed(2);
      const ctns = parseFloat((item.pieces / pac).toFixed(2));
      const totQty = item.pieces || 0;
      const totalNtWtKg = ((totQty * netWtG) / 1000).toFixed(2);
      const rate = item.wholesalePricePerUnit || 0;
      const lineSubtotal = rate * totQty;
      const lineGst = isGstEnabled ? (lineSubtotal * (parseFloat(item.gstPercent || currentGstRate) / 100)) : 0;
      const lineTotal = lineSubtotal + lineGst;

      return `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td style="text-align:center;">${hsn}</td>
          <td style="text-align:left;padding-left:6px;">${productName}</td>
          <td style="text-align:center;">${netWtG}</td>
          <td style="text-align:right;padding-right:6px;">${rate.toFixed(1)}</td>
          <td style="text-align:center;">${pac}</td>
          <td style="text-align:center;">${wtPerCtn}</td>
          <td style="text-align:center;">${ctns}</td>
          <td style="text-align:center;">${totQty}</td>
          <td style="text-align:center;">${totalNtWtKg}</td>
          <td style="text-align:right;font-weight:600;padding-right:6px;">${lineTotal.toFixed(2)}</td>
        </tr>`;
    }).join('');

    // Empty rows for spacing (exact dealer invoice count)
    const emptyRowsCount = Math.max(0, 9 - calculationSummary.items.length);
    const emptyRows = Array(emptyRowsCount).fill(0).map(() =>
      `<tr><td colspan="11" style="height:22px;border-bottom:1px solid #eee;">&nbsp;</td></tr>`).join('');

    const subtotal = calculationSummary.subtotalWithoutGst || 0;
    const totalGst = calculationSummary.totalGstAmount || 0;
    const cgst = isGstEnabled ? (totalGst / 2) : 0;
    const sgst = isGstEnabled ? (totalGst / 2) : 0;
    const shipping = calculationSummary.shippingCharges || 0;
    const originalTotal = subtotal + (isGstEnabled ? (cgst + sgst) : 0) + shipping;
    const discount = 0;
    const grandRounded = Math.round(calculationSummary.grandTotal);

    // Terms formatting matching dealer invoice
    const rawTerms = companySettings.invoiceTerms;
    const terms = rawTerms
      ? rawTerms.split('\n').filter(Boolean).map((t, i) => `${i + 1}. ${t.replace(/^\d+\.\s*/, '')}`).join('<br>')
      : `1. Payment within 15 days.<br>2. Interest @ 2% per month on delay.<br>3. Claims if any must be reported at delivery.`;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice ${quotationRefNumber}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    color: #1a1a1a;
    background: #fff;
    padding: 20px 24px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page {
    size: A4 portrait;
    margin: 10mm;
  }
  @media print {
    body { padding: 0 !important; margin: 0 !important; }
    .outer { max-width: 100% !important; border: 1.5px solid #ccc !important; }
  }
  .outer { max-width: 820px; margin: auto; border: 1.5px solid #ccc; background: #fff; }
  .header-row { display: flex; align-items: stretch; border-bottom: 1.5px solid #ccc; }
  .logo-cell { width: 220px; padding: 12px 14px; border-right: 1.5px solid #ccc; display: flex; align-items: center; justify-content: center; }
  .company-cell { flex: 1; padding: 10px 14px; border-right: 1.5px solid #ccc; }
  .inv-meta-cell { width: 220px; padding: 10px 14px; text-align: right; }
  .company-name { font-size: 15px; font-weight: 900; color: #D6295A; text-transform: uppercase; margin-bottom: 3px; line-height: 1.2; }
  .company-addr { font-size: 9.5px; color: #333; line-height: 1.5; }
  .gst-row { font-size: 10px; font-weight: 700; color: #1a1a1a; margin-top: 4px; display: inline-block; }
  .inv-title { font-size: 13px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; text-align: right; text-transform: uppercase; }
  .meta-line { font-size: 10px; color: #333; display: flex; justify-content: space-between; margin-bottom: 2px; }
  .meta-line strong { color: #1a1a1a; font-weight: 700; }

  .bill-ship-row { display: flex; border-bottom: 1.5px solid #ccc; }
  .bill-cell { flex: 1; padding: 8px 14px; border-right: 1.5px solid #ccc; }
  .ship-cell { flex: 1; padding: 8px 14px; }
  .section-hdr { font-size: 9px; font-weight: 900; text-transform: uppercase; background: #D6295A; color: #fff; padding: 3px 8px; margin-bottom: 6px; letter-spacing: 0.5px; }
  .bill-name { font-size: 12px; font-weight: 700; margin-bottom: 3px; color: #1a1a1a; }
  .bill-addr { font-size: 9.5px; color: #333; line-height: 1.5; }
  .gstin-line { font-size: 9.5px; font-weight: 700; margin-top: 3px; color: #1a1a1a; }

  .items-table { width: 100%; border-collapse: collapse; border-bottom: 1.5px solid #ccc; }
  .items-table th {
    background: #D6295A; color: #fff; font-size: 8.5px; font-weight: 700;
    text-transform: uppercase; padding: 6px 3px; text-align: center;
    border-right: 1px solid rgba(255,255,255,0.3);
    letter-spacing: 0.3px; vertical-align: middle; line-height: 1.2;
  }
  .items-table th:last-child { border-right: none; }
  .items-table td { padding: 5px 4px; border-bottom: 1px solid #eee; font-size: 10px; color: #1a1a1a; }

  .footer-row { display: flex; border-bottom: 1.5px solid #ccc; }
  .words-cell { flex: 1; padding: 10px 14px; border-right: 1.5px solid #ccc; }
  .words-label { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #1a1a1a; margin-bottom: 4px; letter-spacing: 0.3px; }
  .words-text { font-size: 10px; font-weight: 700; color: #1a1a1a; text-transform: uppercase; line-height: 1.4; }

  .totals-table { width: 100%; border-collapse: collapse; }
  .totals-table td { padding: 3px 10px; font-size: 10px; }
  .totals-table .t-label { text-align: right; color: #333; }
  .totals-table .t-value { text-align: right; font-weight: 600; width: 85px; border-left: 1px solid #eee; }
  .totals-table .grand-row td { background: #D6295A; color: #fff; font-weight: 700; font-size: 11px; padding: 5px 10px; }

  .payment-sig-row { display: flex; border-bottom: 1.5px solid #ccc; }
  .payment-cell { flex: 1; padding: 10px 14px; border-right: 1.5px solid #ccc; }
  .pay-label { font-size: 9px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-bottom: 5px; color: #1a1a1a; }
  .bank-table td { font-size: 9.5px; padding: 1.5px 0; }
  .bank-table td:first-child { font-weight: 700; padding-right: 8px; width: 80px; }
  .terms-sig-cell { width: 280px; padding: 10px 14px; display: flex; flex-direction: column; justify-content: space-between; }
  .terms-label { font-size: 9px; font-weight: 900; text-decoration: underline; margin-bottom: 3px; color: #1a1a1a; }
  .terms-text { font-size: 9.5px; color: #333; line-height: 1.6; }
  .sig-section { text-align: right; margin-top: 10px; }
  .sig-company { font-size: 10px; font-weight: 700; font-style: italic; color: #D6295A; }
  .sig-name { font-size: 10px; font-style: italic; color: #333; margin-top: 22px; margin-bottom: 2px; }
  .sig-title { font-size: 9px; color: #555; }
  .sig-line { font-size: 9px; font-weight: 700; text-decoration: underline; margin-top: 2px; color: #1a1a1a; }
  .footer-strip { padding: 6px 14px; text-align: center; font-size: 8.5px; color: #555; background: #f9f9f9; line-height: 1.5; }
</style>
</head>
<body>
<div class="outer">

  <!-- ── Header ───────────────────────────────────────────────────────── -->
  <div class="header-row">
    <div class="logo-cell">
      ${logoHtml}
    </div>
    <div class="company-cell">
      <div class="company-name">${billerName}</div>
      <div class="company-addr">
        ${formattedBillerAddress}<br>
        Phone : ${billerPhone}<br>
        <span class="gst-row">GST No. ${billerGst}</span>
      </div>
    </div>
    <div class="inv-meta-cell">
      <div class="inv-title">TAX INVOICE</div>
      <div class="meta-line"><span>Invoice #</span><strong>${quotationRefNumber}</strong></div>
      <div class="meta-line"><span>Invoice Date :</span><strong>${invDate}</strong></div>
      <div class="meta-line"><span>Due Date :</span><strong>${dueDate}</strong></div>
      <div class="meta-line" style="margin-top:6px;">
        <span>Place of Supply :</span><strong>${placeOfSupply}</strong>
      </div>
    </div>
  </div>

  <!-- ── Bill To / Ship To ─────────────────────────────────────────────── -->
  <div class="bill-ship-row">
    <div class="bill-cell">
      <div class="section-hdr">BILL TO</div>
      <div class="bill-name">${shipToName}</div>
      <div class="bill-addr">
        ${[shipToAddr, shipToCity, shipToState, shipToPin].filter(Boolean).join(', ')}<br>
        ${shipToPhone ? 'PH. ' + shipToPhone : ''}
      </div>
      ${shipToGst && shipToGst !== 'N/A' ? `<div class="gstin-line">GSTIN: ${shipToGst}</div>` : ''}
    </div>
    <div class="ship-cell">
      <div class="section-hdr">SHIP TO</div>
      <div class="bill-name">${shipToName}</div>
      <div class="bill-addr">
        ${[shipToAddr, shipToCity, shipToState, shipToPin].filter(Boolean).join(', ')}<br>
        ${shipToPhone ? 'PH. ' + shipToPhone : ''}
      </div>
    </div>
  </div>

  <!-- ── Items Table (Exact Dealer Invoice 11-column format) ───────────── -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:4%;">S.NO</th>
        <th style="width:6%;">HSN</th>
        <th style="width:28%;text-align:left;padding-left:6px;">ITEM</th>
        <th style="width:7%;">NET WT<br>(G)</th>
        <th style="width:8%;text-align:right;padding-right:6px;">RATE<br>(RS.)</th>
        <th style="width:5%;">PAC</th>
        <th style="width:8%;">WT/ CTN<br>(KG)</th>
        <th style="width:6%;">CTNS</th>
        <th style="width:7%;">TOT.<br>QTY</th>
        <th style="width:9%;">TOTAL NT<br>WT (KG)</th>
        <th style="width:12%;text-align:right;padding-right:6px;">PRICE</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
      ${emptyRows}
    </tbody>
  </table>

  <!-- ── Totals & Words ────────────────────────────────────────────────── -->
  <div class="footer-row">
    <div class="words-cell">
      <div class="words-label">TOTAL AMOUNT IN WORDS:</div>
      <div class="words-text">${numberToWords(grandRounded)}</div>
    </div>
    <div style="width:260px;border-left:1.5px solid #ccc;">
      <table class="totals-table">
        <tr><td class="t-label">Sub Total<br><span style="font-size:8px;color:#777;">(Without Tax)</span></td><td class="t-value">${subtotal.toFixed(2)}</td></tr>
        ${isGstEnabled ? `
        <tr><td class="t-label">CGST (${(currentGstRate / 2).toFixed(1).replace(/\.0$/, '')}%)</td><td class="t-value">${cgst.toFixed(2)}</td></tr>
        <tr><td class="t-label">SGST (${(currentGstRate / 2).toFixed(1).replace(/\.0$/, '')}%)</td><td class="t-value">${sgst.toFixed(2)}</td></tr>
        ` : `<tr><td class="t-label">GST</td><td class="t-value">0.00</td></tr>`}
        ${shipping > 0 ? `<tr><td class="t-label">Shipping</td><td class="t-value">${shipping.toFixed(2)}</td></tr>` : ''}
        <tr><td class="t-label">Original Amount</td><td class="t-value">${originalTotal.toFixed(2)}</td></tr>
        ${discount > 0 ? `<tr><td class="t-label" style="color:#d97706;">Discount</td><td class="t-value" style="color:#d97706;">- ${discount.toFixed(2)}</td></tr>` : ''}
        <tr class="grand-row"><td class="t-label" style="color:#fff;">Amount To be Paid</td><td class="t-value" style="color:#fff;border-left:1px solid rgba(255,255,255,0.3);">${grandRounded}</td></tr>
      </table>
    </div>
  </div>

  <!-- ── Payment / Signature / Terms ──────────────────────────────────── -->
  <div class="payment-sig-row">
    <div class="payment-cell">
      <div class="pay-label">MODE OF PAYMENT (DETAILS):</div>
      ${bd.bankName || bd.accountNo ? `
      <div style="font-weight:700;font-size:10px;text-decoration:underline;margin-bottom:4px;">Account Details</div>
      <table class="bank-table">
        ${billerName ? `<tr><td colspan="2" style="font-weight:700;padding-bottom:2px;">${billerName}</td></tr>` : ''}
        ${bd.accountNo ? `<tr><td>A/C No.</td><td>${bd.accountNo}</td></tr>` : ''}
        ${bd.ifscCode  ? `<tr><td>IFSC Code :</td><td style="font-weight:700;">${bd.ifscCode}</td></tr>` : ''}
        ${bd.bankName  ? `<tr><td>Bank :</td><td>${bd.bankName}${bd.branch ? ', ' + bd.branch : ''}</td></tr>` : ''}
        ${bd.accountType ? `<tr><td>Type :</td><td>${bd.accountType}</td></tr>` : ''}
        ${bd.upiId ? `<tr><td>UPI ID:</td><td>${bd.upiId}</td></tr>` : ''}
      </table>` : '<div style="font-size:10px;color:#666;font-style:italic;">Contact for payment details</div>'}
    </div>
    <div class="terms-sig-cell">
      <div>
        <div class="terms-label">Terms &amp; Conditions:</div>
        <div class="terms-text">${terms}</div>
      </div>
      <div class="sig-section">
        <div class="sig-company">For ${billerName}..</div>
        <div class="sig-name">${signatoryName}</div>
        <div class="sig-title">${signatoryTitle}</div>
        <div class="sig-line">Authorized signature</div>
      </div>
    </div>
  </div>

  <!-- ── Footer Strip ──────────────────────────────────────────────────── -->
  <div class="footer-strip">
    Regd. Office &amp; Operations : Flat No. B4, No.13, Balaji Nagar 1<sup>st</sup> street extn, Noombal, Chennai – 600077, Tamil Nadu, India Ph: +91-88388 87064. |
    CIN- U10790TN2026PTC188398 | Email: contact@mansarafoods.com | Website: www.mansarafoods.com
  </div>
</div>

<script>
  window.addEventListener('load', function() {
    setTimeout(function() {
      try {
        window.focus();
        window.print();
      } catch (e) {
        console.error(e);
      }
    }, 400);
  });
</script>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setToastMessage({ text: 'Tax Invoice generated in exact dealer invoice format!', type: 'success' });
  };

  const handleCopyQuotationText = () => {
    const activeCustomerName = selectedCustomer?.companyName || selectedCustomer?.name || customClientName || 'Valued Trade Partner';
    const textLines = [
      '====================================================',
      'MANSARA FOODS PVT. LTD. - WHOLESALE PRICE QUOTATION',
      `Quotation Ref: ${quotationRefNumber}`,
      `Date: ${new Date().toLocaleDateString('en-IN')}`,
      `Customer / Client: ${activeCustomerName}${selectedCustomer?.type ? ` [${selectedCustomer.type}]` : ''}`,
      selectedCustomer?.phone ? `Contact: ${selectedCustomer.phone}` : '',
      selectedCustomer?.gstNumber ? `GSTIN: ${selectedCustomer.gstNumber}` : '',
      '----------------------------------------------------',
      ...calculationSummary.items.map(
        i => `${i.name} (Qty: ${i.pieces.toLocaleString()} pcs / ${i.cartons} ctn) | MRP: ₹${i.mrp.toFixed(2)} | Margin: ${i.marginPct}% | Wholesale Rate: ₹${i.wholesalePricePerUnit.toFixed(2)}/pc = ₹${i.lineWholesaleTotal.toLocaleString('en-IN')}`
      ),
      '----------------------------------------------------',
      `1. Total MRP: ₹${calculationSummary.totalMrpValue.toLocaleString('en-IN')}`,
      `2. Margin: -₹${calculationSummary.totalMarginDiscount.toLocaleString('en-IN')} (${calculationSummary.averageMarginPct}%)`,
      `3. Sub(total) without GST: ₹${calculationSummary.subtotalWithoutGst.toLocaleString('en-IN')}`,
      `4. GST: ${calculationSummary.isWithGst ? `${calculationSummary.gstRate}% (+₹${calculationSummary.totalGstAmount.toLocaleString('en-IN')})` : 'Without GST (0%)'}`,
      `5. Shipping Charges: ₹${calculationSummary.shippingCharges.toLocaleString('en-IN')}`,
      `6. Grand Total: ₹${calculationSummary.grandTotal.toLocaleString('en-IN')}`,
      '===================================================='
    ].filter(Boolean).join('\n');

    navigator.clipboard.writeText(textLines).then(() => {
      setToastMessage({ text: 'Quotation text copied to clipboard!', type: 'success' });
    });
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

      {/* ─── CUSTOMER / TRADE PARTNER SELECTION & GST CONFIGURATION ──────── */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 shadow-xs space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-3 sm:pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Store className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Customer / Trade Partner</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Select existing Dealer, Retail Store, or Walk-in Person, or quickly register new ones.
            </p>
          </div>

          <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={fetchInitialData}
              className="flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-[11px] sm:text-xs shadow-xs transition cursor-pointer"
              title="Reset simulator"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={() => setShowRegisterStoreModal(true)}
              className="flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] sm:text-xs transition cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>+ Store</span>
            </button>
            <button
              type="button"
              onClick={() => setShowRegisterDealerModal(true)}
              className="flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-[11px] sm:text-xs transition cursor-pointer shadow-xs whitespace-nowrap"
            >
              <Building2 className="w-3.5 h-3.5 text-rose-600" />
              <span>+ Dealer</span>
            </button>
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
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 max-h-80 overflow-y-auto divide-y divide-slate-100">
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
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
                              Dealer
                            </span>
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
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Store
                            </span>
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
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Wholesale price auto-computes by reducing the target margin percentage from catalog MRP.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddCustomCommodity}
            className="text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl border border-rose-200 transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Custom Commodity (Dal/Grain)</span>
          </button>
        </div>

        {/* Input Bar */}
        <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* Input 1: Product Name */}
            <div className="md:col-span-5 space-y-1">
              <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider">
                1. Select Product Name
              </label>
              <select
                value={selectedProductIdToAdd}
                onChange={(e) => setSelectedProductIdToAdd(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 sm:py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-xs"
              >
                <option value="">-- Choose a Catalog Product --</option>
                {products.map(p => (
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
                  min="1"
                  placeholder="Qty"
                  value={quantityToAdd}
                  onChange={(e) => setQuantityToAdd(Math.max(1, parseFloat(e.target.value) || 1))}
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
                <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider">
                  3. Margin % (Discount)
                </label>
                {/* Mobile Quick Chips */}
                <div className="flex items-center gap-1 sm:hidden">
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
                const discount = (mrp * (marginPctToAdd / 100));
                const price = mrp - discount;
                const pac = prod.cartonSize || 24;

                return (
                  <>
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span>
                        Catalog MRP: <strong className="text-slate-900 font-extrabold">₹{mrp.toFixed(2)}</strong> &bull; Margin Discount: <strong className="text-rose-600 font-extrabold">{marginPctToAdd}% (-₹{discount.toFixed(2)})</strong>
                      </span>
                    </span>
                    <span className="text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-block">
                      Wholesale: <strong className="font-black text-xs sm:text-sm">₹{price.toFixed(2)} / pc</strong> <span className="text-[11px] font-medium text-emerald-600">(Carton: ₹{(price * pac).toFixed(2)})</span>
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
                <th className="py-2.5 px-1 text-center bg-amber-50/50 text-amber-900">Margin / Price</th>
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
                        <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs w-full max-w-[102px] focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-400">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, 'quantity', Math.max(1, parseFloat(e.target.value) || 1))}
                            className="w-0 flex-1 min-w-0 py-1 px-1.5 text-center font-black text-xs text-slate-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                        {/* Calculated Wholesale Price */}
                        <span className="text-[11px] sm:text-xs font-black text-emerald-700 leading-tight">
                          ₹{item.wholesalePricePerUnit.toFixed(2)}
                          <span className="block text-[8px] text-slate-400 font-normal">/ pc</span>
                        </span>
                        <span className="text-[8px] text-rose-500 font-bold">
                          -₹{item.marginDiscountPerUnit.toFixed(2)}
                        </span>
                      </div>
                    </td>

                    {/* Column 4: Line Total Column */}
                    <td className="py-2.5 px-2 text-right">
                      <div className="flex flex-col items-end justify-between h-full gap-2">
                        <div className="text-right">
                          <span className="block text-[11px] sm:text-xs font-black text-slate-900 leading-tight">
                            ₹{Math.round(item.lineWholesaleTotal).toLocaleString('en-IN')}
                          </span>
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
                  Final Wholesale Price
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
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(item.id, 'quantity', Math.max(1, parseFloat(e.target.value) || 1))}
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

                    {/* Calculated Final Wholesale Price (MRP - Margin%) */}
                    <td className="py-3.5 px-4 text-right bg-emerald-50/50">
                      <span className="text-sm font-black text-emerald-700">
                        ₹{item.wholesalePricePerUnit.toFixed(2)}
                      </span>
                      <span className="block text-[9px] text-slate-400">/ unit</span>
                    </td>

                    {/* Carton Rate */}
                    <td className="py-3.5 px-3 text-right font-bold text-slate-800">
                      ₹{item.cartonPrice.toFixed(2)}
                    </td>

                    {/* Total Line Amount */}
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      ₹{Math.round(item.lineWholesaleTotal).toLocaleString('en-IN')}
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
          </table>
        </div>

        {/* ─── TAX & SHIPPING SETTINGS ─── */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full md:w-auto">
            {/* With or Without GST Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
              <span className="text-[11px] sm:text-xs font-bold text-slate-700">Taxation:</span>
              <div className="grid grid-cols-2 sm:flex items-center bg-slate-200/80 p-0.5 rounded-xl w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setGstMode('WITH_GST')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                    gstMode === 'WITH_GST'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  With GST
                </button>
                <button
                  type="button"
                  onClick={() => setGstMode('WITHOUT_GST')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                    gstMode === 'WITHOUT_GST'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Without GST
                </button>
              </div>
            </div>

            {gstMode === 'WITH_GST' && (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 animate-fade-in w-full sm:w-auto">
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
            )}

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
            {gstMode === 'WITH_GST' ? 'Taxes & freight auto-calculate in totals' : 'Net wholesale prices (GST excluded)'}
          </div>
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

        <div>
          {/* Generate Quotation Card */}
          <button
            type="button"
            disabled={calculationSummary.items.length === 0}
            onClick={handleOpenQuotation}
            className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 border-slate-800 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white transition-all text-left cursor-pointer group shadow-md active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white/10 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Printer className="w-5 h-5 sm:w-6 sm:h-6 text-rose-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-xs sm:text-base text-white">
                  Generate Formal Quotation
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-300 font-medium mt-0.5 sm:mt-1 leading-relaxed">
                  Opens official quotation document with selected store/dealer, itemized wholesale rates, and print view.
                </p>
              </div>
            </div>
            <span className="shrink-0 inline-flex items-center justify-center gap-1.5 text-xs sm:text-sm font-black text-rose-400 bg-white/10 hover:bg-white/15 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition">
              <FileText className="w-4 h-4" />
              <span>Generate Quotation &rarr;</span>
            </span>
          </button>
        </div>
      </div>

      {/* ─── STICKY MOBILE QUICK ACTION BAR (when products added) ─────────── */}
      {calculationSummary.items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2.5 shadow-[0_-4px_25px_rgba(0,0,0,0.12)] flex items-center justify-between gap-3 animate-slide-in-up">
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

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenQuotation}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" />
              <span>Generate Quote</span>
            </button>
          </div>
        </div>
      )}

      {/* ─── PRINTABLE FORMAL QUOTATION MODAL ──────────────────────────────── */}
      {showQuotationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-2.5 sm:p-5 overflow-hidden">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[94vh] sm:max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-zoom-in">
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
                  onClick={handleGenerateQuotation}
                  className="py-1.5 sm:py-2 px-3 sm:px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
                  <span className="hidden sm:inline">Generate Quotation</span>
                  <span className="sm:hidden">Generate</span>
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
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Quotation Ref</span>
                    <span className="font-mono font-black text-slate-900">{quotationRefNumber}</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Date: {new Date().toLocaleDateString('en-IN')}</p>
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
                        <th className="py-2.5 px-1 sm:px-1.5 text-center">Margin / Rate</th>
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

                          {/* Column 3: Margin % & Wholesale Price Rate */}
                          <td className="py-2.5 px-1 sm:px-1.5 text-center">
                            <span className="font-black text-emerald-700 text-[11px] sm:text-xs leading-tight block">
                              ₹{item.wholesalePricePerUnit.toFixed(2)}
                              <span className="text-[8px] text-slate-400 font-normal"> / pc</span>
                            </span>
                            <span className="text-[9px] text-rose-600 font-extrabold block mt-0.5">
                              {item.marginPct}% Margin
                            </span>
                            <span className="text-[8px] text-slate-400 block font-mono">
                              (-₹{item.marginDiscountPerUnit.toFixed(2)})
                            </span>
                          </td>

                          {/* Column 4: Line Total */}
                          <td className="py-2.5 px-2 sm:px-2.5 text-right">
                            <span className="font-black text-slate-900 text-xs sm:text-sm block leading-tight">
                              ₹{item.lineWholesaleTotal.toLocaleString('en-IN')}
                            </span>
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
                          <th className="py-2.5 px-3 text-right">Wholesale Rate</th>
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
                            <td className="py-2.5 px-3 text-right font-black text-emerald-700">₹{item.wholesalePricePerUnit.toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-900">
                              ₹{item.lineWholesaleTotal.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Totals Table */}
                <div className="flex justify-end">
                  <div className="w-full sm:w-80 space-y-2 p-3.5 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 text-xs shadow-xs">
                    {/* 1. Total MRP */}
                    <div className="flex justify-between text-slate-600">
                      <span className="font-medium">Total MRP:</span>
                      <strong className="text-slate-900 font-bold">₹{calculationSummary.totalMrpValue.toLocaleString('en-IN')}</strong>
                    </div>

                    {/* 2. Margin */}
                    <div className="flex justify-between text-amber-700">
                      <span className="font-medium">Margin ({calculationSummary.averageMarginPct}%):</span>
                      <strong className="font-bold">-₹{calculationSummary.totalMarginDiscount.toLocaleString('en-IN')}</strong>
                    </div>

                    {/* 3. Sub(total) without GST */}
                    <div className="flex justify-between text-slate-700 pt-1.5 border-t border-slate-200">
                      <span className="font-medium">Sub(total) without GST:</span>
                      <strong className="text-slate-900 font-bold">₹{calculationSummary.subtotalWithoutGst.toLocaleString('en-IN')}</strong>
                    </div>

                    {/* 4. GST Percentage or Without GST */}
                    <div className="flex justify-between text-slate-600">
                      <span className="font-medium">
                        {calculationSummary.isWithGst ? `GST Percentage (${calculationSummary.gstRate}%):` : 'Tax Status:'}
                      </span>
                      <strong className="text-slate-900 font-bold">
                        {calculationSummary.isWithGst
                          ? `+₹${calculationSummary.totalGstAmount.toLocaleString('en-IN')}`
                          : 'Without GST (0%)'}
                      </strong>
                    </div>

                    {/* 5. Shipping Charges */}
                    <div className="flex justify-between text-slate-600">
                      <span className="font-medium">Shipping Charges:</span>
                      <strong className="text-slate-900 font-bold">{calculationSummary.shippingCharges > 0 ? `+₹${calculationSummary.shippingCharges.toLocaleString('en-IN')}` : '₹0'}</strong>
                    </div>

                    {/* 6. Grand Total */}
                    <div className="flex justify-between text-slate-900 font-black text-sm pt-2.5 border-t border-slate-200">
                      <span>Grand Total:</span>
                      <span className="text-emerald-700 font-black text-base">₹{calculationSummary.grandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pinned Modal Footer */}
            <div className="px-4 sm:px-6 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="text-xs text-slate-500 font-medium hidden sm:block truncate pr-2">
                Quotation Ref: <span className="font-mono font-bold text-slate-800">{quotationRefNumber}</span> • Payable: <span className="font-bold text-emerald-700">₹{calculationSummary.grandTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowQuotationModal(false)}
                  className="flex-1 sm:flex-initial px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 transition cursor-pointer text-center"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleGenerateQuotation}
                  className="flex-1 sm:flex-initial px-4 sm:px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  <FileText className="w-4 h-4 text-rose-400" />
                  <span>Generate Quotation</span>
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
    </div>
  );
}
