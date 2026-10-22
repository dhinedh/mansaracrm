// src/pages/admin/StoreVisitsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  MapPin, 
  Map, 
  User, 
  Store as StoreIcon, 
  Clock, 
  FileText, 
  CheckCircle, 
  Plus, 
  Minus,
  Edit,
  Trash2,
  AlertTriangle,
  Loader2,
  HelpCircle,
  Truck,
  FileEdit,
  DollarSign,
  PlusCircle,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Navigation,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Phone,
  UserCheck,
  ShoppingBag,
  Eye,
  Check,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function StoreVisitsPage() {
  const { user } = useAuthStore();

  // Master Data
  const [dealers, setDealers] = useState([]);
  const [stores, setStores] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [salesTeam, setSalesTeam] = useState([]);

  // Today's Visits Board State
  const [todayVisits, setTodayVisits] = useState([]);
  const [todayStats, setTodayStats] = useState({
    totalScheduled: 0,
    completedCount: 0,
    inProgressCount: 0,
    pendingCount: 0,
    cancelledCount: 0,
    todayOrderValue: 0,
    todayCollections: 0
  });
  const [visitsLoading, setVisitsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedRepFilter, setSelectedRepFilter] = useState('ALL');
  const [selectedStatusTab, setSelectedStatusTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Allocation Modal State
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [allocationSubmitting, setAllocationSubmitting] = useState(false);
  const [allocationForm, setAllocationForm] = useState({
    salespersonId: '',
    dealerId: '',
    storeId: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    purpose: 'Order Booking & Stock Audit',
    priority: 'NORMAL',
    remarks: ''
  });

  // Visit Dossier Modal State
  const [selectedVisitDossier, setSelectedVisitDossier] = useState(null);

  // Spot Billing & Direct Check-in Collapsible State
  const [isSpotBillingOpen, setIsSpotBillingOpen] = useState(false);

  // Spot Check-in Selection states
  const [selectedDealerId, setSelectedDealerId] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  
  // Active Spot Visit Status
  const [activeVisit, setActiveVisit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Active Tab for Spot Visit Mode (pending, new-bill, adjust, checkout)
  const [activeTab, setActiveTab] = useState('pending');

  // Open invoices data for the visited store
  const [openInvoices, setOpenInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  // Delivery state (invoiceId -> productId -> quantityToFulfill)
  const [deliveryInputs, setDeliveryInputs] = useState({});

  // Adjustment state (active invoice to adjust, and its modified items)
  const [adjustingInvoice, setAdjustingInvoice] = useState(null);
  const [adjustedItems, setAdjustedItems] = useState([]);

  // Checkout outcome
  const [checkoutOutcome, setCheckoutOutcome] = useState('');

  // New Bill Generation States
  const [billQuantities, setBillQuantities] = useState({});
  const [billMargins, setBillMargins] = useState({});
  const [billNotes, setBillNotes] = useState('');
  const [billShipping, setBillShipping] = useState('');
  const [billDiscount, setBillDiscount] = useState('');
  const [billIsGst, setBillIsGst] = useState(true);
  const [generatedInvoiceId, setGeneratedInvoiceId] = useState(null);
  const [billSuccess, setBillSuccess] = useState('');

  // Payment Collection States
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  
  // Revisit Date State
  const [revisitDate, setRevisitDate] = useState('');

  // Initialize
  useEffect(() => {
    fetchDealers();
    fetchAllStores();
    fetchProducts();
    fetchSalesTeam();
    fetchTodayVisits(selectedDate);

    // Check if there is an active spot visit stored in localStorage
    const savedVisit = localStorage.getItem('mansara_active_visit');
    if (savedVisit) {
      try {
        const parsed = JSON.parse(savedVisit);
        setActiveVisit(parsed);
        setSelectedStoreId(parsed.storeId);
        setSelectedDealerId(parsed.dealerId);
        setIsSpotBillingOpen(true);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Watch for dealer selection in spot check-in panel
  useEffect(() => {
    if (selectedDealerId) {
      fetchStores(selectedDealerId);
    } else {
      setStores([]);
    }
  }, [selectedDealerId]);

  // Watch for active spot visit
  useEffect(() => {
    if (activeVisit) {
      fetchOpenInvoices();
    } else {
      setOpenInvoices([]);
    }
  }, [activeVisit]);

  // Refetch visits when date, rep filter, or status tab changes
  useEffect(() => {
    fetchTodayVisits(selectedDate);
  }, [selectedDate, selectedRepFilter, selectedStatusTab]);

  // ==========================================
  // DATA FETCHING FUNCTIONS
  // ==========================================

  const fetchDealers = async () => {
    try {
      const res = await axios.get('/dealers');
      setDealers(res.data.data.filter(d => d.approvalStatus === 'APPROVED'));
    } catch (err) {
      console.error('Error fetching dealers:', err);
    }
  };

  const fetchAllStores = async () => {
    try {
      const res = await axios.get('/stores');
      setAllStores(res.data.data || []);
    } catch (err) {
      console.error('Error fetching all stores:', err);
    }
  };

  const fetchStores = async (dealerId) => {
    try {
      const res = await axios.get(`/stores?dealerId=${dealerId}`);
      setStores(res.data.data || []);
    } catch (err) {
      console.error('Error fetching stores:', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/products');
      setProducts(res.data.data.filter(p => p.isActive));
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  const fetchSalesTeam = async () => {
    try {
      const res = await axios.get('/field-sales/admin/team');
      if (res.data?.success) {
        setSalesTeam(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching sales team:', err);
    }
  };

  const fetchTodayVisits = async (targetDate) => {
    setVisitsLoading(true);
    try {
      const params = new URLSearchParams();
      if (targetDate) params.append('date', targetDate);
      if (selectedRepFilter && selectedRepFilter !== 'ALL') params.append('salespersonId', selectedRepFilter);
      if (selectedStatusTab && selectedStatusTab !== 'ALL') params.append('status', selectedStatusTab);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await axios.get(`/field-sales/admin/visits/today?${params.toString()}`);
      if (res.data?.success) {
        setTodayVisits(res.data.data.visits || []);
        if (res.data.data.stats) {
          setTodayStats(res.data.data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching today visits:', err);
    } finally {
      setVisitsLoading(false);
    }
  };

  const fetchOpenInvoices = async () => {
    if (!selectedStoreId) return;
    try {
      setInvoicesLoading(true);
      const res = await axios.get(`/billing?storeId=${selectedStoreId}&status=OPEN`);
      setOpenInvoices(res.data.data || []);
      setDeliveryInputs({});
    } catch (err) {
      console.error(err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  // ==========================================
  // ALLOCATION HANDLERS
  // ==========================================

  const handleOpenAllocateModal = (prefillStore = null) => {
    setAllocationForm({
      salespersonId: salesTeam[0]?.user?._id || '',
      dealerId: prefillStore?.dealerId?._id || prefillStore?.dealerId || '',
      storeId: prefillStore?._id || prefillStore?.id || '',
      scheduledDate: selectedDate || new Date().toISOString().split('T')[0],
      purpose: 'Order Booking & Stock Audit',
      priority: 'NORMAL',
      remarks: ''
    });
    setIsAllocateModalOpen(true);
  };

  const handleAllocateSubmit = async (e) => {
    e.preventDefault();
    if (!allocationForm.salespersonId) {
      alert('Please select a salesperson to assign.');
      return;
    }
    if (!allocationForm.storeId) {
      alert('Please select a store / outlet.');
      return;
    }

    setAllocationSubmitting(true);
    try {
      const res = await axios.post('/field-sales/admin/visits/allocate', allocationForm);
      if (res.data?.success) {
        alert(res.data.message || 'Store visit successfully allocated!');
        setIsAllocateModalOpen(false);
        fetchTodayVisits(selectedDate);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to allocate store visit');
    } finally {
      setAllocationSubmitting(false);
    }
  };

  const handleUpdateVisitStatus = async (visitId, newStatus) => {
    try {
      const res = await axios.put(`/field-sales/admin/visits/${visitId}/status`, { status: newStatus });
      if (res.data?.success) {
        fetchTodayVisits(selectedDate);
        if (selectedVisitDossier && selectedVisitDossier._id === visitId) {
          setSelectedVisitDossier(res.data.data);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update visit status');
    }
  };

  // Stores available in allocation modal
  const allocationStoreOptions = useMemo(() => {
    if (!allocationForm.dealerId) return allStores;
    return allStores.filter(s => {
      const dId = s.dealerId?._id || s.dealerId;
      return dId === allocationForm.dealerId;
    });
  }, [allStores, allocationForm.dealerId]);

  // Filtered visits on client side for search
  const filteredVisits = useMemo(() => {
    if (!searchQuery.trim()) return todayVisits;
    const q = searchQuery.toLowerCase().trim();
    return todayVisits.filter(v => {
      const storeName = v.storeId?.name?.toLowerCase() || '';
      const repName = v.salespersonId?.name?.toLowerCase() || '';
      const dealerName = v.dealerId?.companyName?.toLowerCase() || '';
      const purpose = v.purpose?.toLowerCase() || '';
      const city = v.storeId?.city?.toLowerCase() || '';
      return storeName.includes(q) || repName.includes(q) || dealerName.includes(q) || purpose.includes(q) || city.includes(q);
    });
  }, [todayVisits, searchQuery]);

  // Quick Date Jump
  const handleQuickDate = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const dateStr = d.toISOString().split('T')[0];
    setSelectedDate(dateStr);
  };

  // ==========================================
  // SPOT BILLING & DIRECT CHECK-IN HANDLERS
  // ==========================================

  const handleCheckIn = () => {
    if (!selectedStoreId) {
      alert('Please select a store outlet first.');
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const res = await axios.post('/field-sales/visits/check-in', {
            dealerId: selectedDealerId,
            storeId: selectedStoreId,
            visitorName: user?.name || 'Super Admin',
            purpose: 'Store Visit & Inventory Fulfillment Check',
            latitude,
            longitude
          });

          const visitData = res.data.data;
          setActiveVisit(visitData);
          localStorage.setItem('mansara_active_visit', JSON.stringify(visitData));
          fetchTodayVisits(selectedDate);
        } catch (err) {
          alert(err.response?.data?.message || 'Check-in failed');
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationError('Failed to retrieve location. GPS permission is required for Store Visit Check-In.');
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleDeliveryQtyChange = (invoiceId, productId, val) => {
    const qty = parseInt(val) || 0;
    setDeliveryInputs(prev => ({
      ...prev,
      [invoiceId]: {
        ...(prev[invoiceId] || {}),
        [productId]: qty
      }
    }));
  };

  const handleFulfillDelivery = async (invoiceId) => {
    const inputsForInvoice = deliveryInputs[invoiceId] || {};
    const items = Object.entries(inputsForInvoice)
      .map(([productId, quantity]) => ({ productId, quantity }))
      .filter(item => item.quantity > 0);

    if (items.length === 0) {
      alert('Please specify quantity greater than 0 to deliver.');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`/field-sales/invoices/${invoiceId}/fulfill`, { items });
      alert('Products fulfilled and delivered successfully!');
      fetchOpenInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to fulfill items');
    } finally {
      setLoading(false);
    }
  };

  const startAdjustingInvoice = (invoice) => {
    setAdjustingInvoice(invoice);
    setAdjustedItems(invoice.items.map(i => ({
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      marginPct: i.marginPct,
      unit: i.unit || 'PCS'
    })));
    setActiveTab('adjust');
  };

  const updateAdjustedQty = (productId, delta) => {
    setAdjustedItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const updateAdjustedMargin = (productId, newMargin) => {
    setAdjustedItems(prev => prev.map(item => {
      if (item.productId === productId) {
        return { ...item, marginPct: parseFloat(newMargin) || 0 };
      }
      return item;
    }));
  };

  const addProductToAdjustment = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (adjustedItems.some(i => i.productId === productId)) {
      updateAdjustedQty(productId, 1);
      return;
    }

    setAdjustedItems(prev => [...prev, {
      productId,
      productName: product.name,
      quantity: 1,
      marginPct: 10,
      unit: 'PCS'
    }]);
  };

  const removeProductFromAdjustment = (productId) => {
    setAdjustedItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleSaveAdjustment = async () => {
    if (adjustedItems.length === 0) {
      alert('Invoice must contain at least one product.');
      return;
    }

    try {
      setLoading(true);
      await axios.put(`/field-sales/invoices/${adjustingInvoice.id}/adjust`, {
        items: adjustedItems
      });
      alert('Invoice adjusted successfully!');
      setAdjustingInvoice(null);
      setAdjustedItems([]);
      setActiveTab('pending');
      fetchOpenInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to adjust invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewBill = async (e) => {
    e.preventDefault();
    setLoading(true);
    setBillSuccess('');
    try {
      const items = Object.entries(billQuantities)
        .map(([productId, quantity]) => {
          const qty = parseInt(quantity) || 0;
          const margin = parseFloat(billMargins[productId]) || 10;
          return { productId, quantity: qty, marginPct: margin };
        })
        .filter(item => item.quantity > 0);

      if (items.length === 0) {
        alert('Please specify quantity greater than 0 for at least one product.');
        setLoading(false);
        return;
      }

      const storeObj = stores.find(s => s.id === selectedStoreId);
      const res = await axios.post('/billing', {
        storeId: selectedStoreId,
        storeName: storeObj ? storeObj.name : 'Store',
        items,
        notes: billNotes,
        shippingCharges: parseFloat(billShipping) || 0,
        totalDiscount: parseFloat(billDiscount) || 0,
        isGstEnabled: billIsGst,
        isCredit: true
      });

      if (res.data.success) {
        setGeneratedInvoiceId(res.data.data.id || res.data.data._id);
        setBillSuccess(`Invoice ${res.data.data.invoiceNo} generated successfully! It is linked to this visit and remains pending (OPEN) until payments are collected.`);
        fetchOpenInvoices();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!checkoutOutcome.trim()) {
      alert('Please enter outcome notes of your visit.');
      return;
    }

    const hasPending = openInvoices.some(inv => 
      inv.items.some(item => (item.fulfilledQuantity || 0) < item.quantity)
    );

    if (hasPending && !window.confirm('Some items from previous bills are still pending/unfulfilled. Do you still want to checkout of this visit?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.post(`/field-sales/visits/${activeVisit.id}/check-out`, {
        outcome: checkoutOutcome,
        paymentsCollected: parseFloat(paymentAmount) || 0,
        paymentMethod: paymentAmount && parseFloat(paymentAmount) > 0 ? paymentMethod : 'NONE',
        revisitDate: revisitDate || null,
        newInvoiceId: generatedInvoiceId || null
      });

      alert('Checked out successfully!');
      setActiveVisit(null);
      setCheckoutOutcome('');
      setPaymentAmount('');
      setPaymentMethod('CASH');
      setRevisitDate('');
      setGeneratedInvoiceId(null);
      setBillQuantities({});
      setBillSuccess('');
      localStorage.removeItem('mansara_active_visit');
      fetchTodayVisits(selectedDate);
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const getVisitedStoreName = () => {
    const storeObj = stores.find(s => s.id === selectedStoreId) || allStores.find(s => s.id === selectedStoreId || s._id === selectedStoreId);
    return storeObj ? storeObj.name : 'Selected Store';
  };

  const getDealerName = () => {
    const dealerObj = dealers.find(d => d.id === selectedDealerId || d._id === selectedDealerId);
    return dealerObj ? dealerObj.companyName : 'Selected Dealer';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* 1. TOP HEADER & PRIMARY ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Field Sales & Store Visits
              </h1>
              <p className="text-slate-500 text-xs mt-0.5 font-medium">
                Allocate store visits to sales personnel, track today's live visits, verify GPS check-ins, and inspect field performance.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenAllocateModal()}
            className="bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-rose-500/20 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Allocate Store Visit</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSpotBillingOpen(!isSpotBillingOpen)}
            className={`font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer border transition-all ${
              isSpotBillingOpen || activeVisit
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <MapPin className="w-4 h-4 text-rose-500" />
            <span>{activeVisit ? 'Live Visit In Progress' : 'Direct Spot Check-In / Billing'}</span>
            {isSpotBillingOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => fetchTodayVisits(selectedDate)}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl cursor-pointer transition active:scale-95"
            title="Refresh Feed"
          >
            <RefreshCw className={`w-4 h-4 ${visitsLoading ? 'animate-spin text-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. LIVE TODAY'S OPERATIONAL KPI METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* Total Scheduled */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Visits</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {todayStats.totalScheduled}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">For selected date</span>
        </div>

        {/* In-Progress (GPS Verified) */}
        <div className="bg-white border border-amber-200/80 rounded-2xl p-4 shadow-2xs hover:border-amber-300 transition-all bg-gradient-to-b from-amber-50/30 to-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">In Progress</span>
            <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-amber-100 text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
              <Navigation className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600 tracking-tight">
            {todayStats.inProgressCount}
          </div>
          <span className="text-[11px] text-amber-600/80 font-medium">Checked-in on field</span>
        </div>

        {/* Completed */}
        <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-2xs hover:border-emerald-300 transition-all bg-gradient-to-b from-emerald-50/30 to-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Completed</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 tracking-tight">
            {todayStats.completedCount}
          </div>
          <span className="text-[11px] text-emerald-600/80 font-medium">Wrapped & reported</span>
        </div>

        {/* Pending Scheduled */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Scheduled</span>
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-600">
              <Clock3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-800 tracking-tight">
            {todayStats.pendingCount}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Awaiting arrival</span>
        </div>

        {/* Today's Orders Booked */}
        <div className="bg-white border border-rose-200/80 rounded-2xl p-4 shadow-2xs hover:border-rose-300 transition-all bg-gradient-to-b from-rose-50/20 to-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Booked Orders</span>
            <div className="p-1.5 rounded-lg bg-rose-100 text-rose-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-rose-600 tracking-tight">
            ₹{todayStats.todayOrderValue.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-rose-600/80 font-medium">Primary & secondary</span>
        </div>

        {/* Collections */}
        <div className="bg-white border border-emerald-200/80 rounded-2xl p-4 shadow-2xs hover:border-emerald-300 transition-all bg-gradient-to-b from-emerald-50/20 to-white">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Collections</span>
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-black text-emerald-600 tracking-tight">
            ₹{todayStats.todayCollections.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-600/80 font-medium">Cash & online cleared</span>
        </div>

      </div>

      {/* 3. OPTIONAL DIRECT SPOT CHECK-IN / BILLING ACCORDION */}
      {isSpotBillingOpen && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 transition-all space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-500" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Direct Desktop Spot Check-In & Billing Simulation</h3>
                <p className="text-slate-500 text-xs">Simulate direct visits and immediate invoice generation from Admin portal.</p>
              </div>
            </div>
            <button
              onClick={() => setIsSpotBillingOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
            >
              Hide Panel
            </button>
          </div>

          {!activeVisit ? (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-3 flex-1 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Select Dealer</label>
                    <select
                      value={selectedDealerId}
                      onChange={(e) => { setSelectedDealerId(e.target.value); setSelectedStoreId(''); }}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    >
                      <option value="">Select B2B Dealer...</option>
                      {dealers.map(d => (
                        <option key={d.id || d._id} value={d.id || d._id}>{d.companyName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Select Store / Outlet</label>
                    <select
                      value={selectedStoreId}
                      disabled={!selectedDealerId}
                      onChange={(e) => setSelectedStoreId(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">Select Store Outlet...</option>
                      {stores.map(s => (
                        <option key={s.id || s._id} value={s.id || s._id}>{s.name} ({s.city || 'No Area'})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {locationError && (
                  <div className="bg-red-50 text-red-700 p-2.5 rounded-xl border border-red-100 flex items-center gap-2 text-xs font-medium">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{locationError}</span>
                  </div>
                )}
              </div>

              <button
                onClick={handleCheckIn}
                disabled={locationLoading || !selectedStoreId}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition active:scale-95 whitespace-nowrap self-stretch md:self-end cursor-pointer"
              >
                {locationLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
                Verify & Check-In
              </button>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-xl p-4 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
                  <span className="text-[10px] uppercase font-black bg-white/20 px-2 py-0.5 rounded tracking-wider">Active Spot Visit</span>
                </div>
                <h2 className="text-lg font-black">{getVisitedStoreName()}</h2>
                <p className="text-xs text-white/80 font-medium">Dealer: {getDealerName()}</p>
                <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-white/90">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> In: {new Date(activeVisit.checkInTime).toLocaleTimeString()}</span>
                  <span className="flex items-center gap-1"><Map className="w-3.5 h-3.5" /> Coordinates: {activeVisit.latitude?.toFixed(4)}, {activeVisit.longitude?.toFixed(4)}</span>
                </div>
              </div>

              <button
                onClick={() => { setActiveTab('checkout'); }}
                className="bg-white text-rose-600 hover:bg-rose-50 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
              >
                Finish Visit & Checkout
              </button>
            </div>
          )}

          {/* Active Spot Visit Tabs & Content */}
          {activeVisit && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 pt-2">
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs h-fit space-y-1">
                <button
                  onClick={() => { setAdjustingInvoice(null); setActiveTab('pending'); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                    activeTab === 'pending'
                      ? 'bg-rose-50 text-rose-700 border border-rose-100 font-black'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  Pending Deliveries ({openInvoices.length})
                </button>

                <button
                  onClick={() => { setAdjustingInvoice(null); setActiveTab('new-bill'); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                    activeTab === 'new-bill'
                      ? 'bg-rose-50 text-rose-700 border border-rose-100 font-black'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  Create New Bill
                </button>

                <button
                  onClick={() => { setActiveTab('checkout'); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                    activeTab === 'checkout'
                      ? 'bg-rose-50 text-rose-700 border border-rose-100 font-black'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Checkout & Payment
                </button>
              </div>

              <div className="lg:col-span-3">
                {activeTab === 'pending' && (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                    <h4 className="font-bold text-slate-800 text-sm">Pending Deliveries for {getVisitedStoreName()}</h4>
                    {openInvoices.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4 text-center">No open invoices or pending deliveries for this outlet.</p>
                    ) : (
                      <div className="space-y-3">
                        {openInvoices.map(inv => (
                          <div key={inv.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-800">Invoice #{inv.invoiceNo}</span>
                              <span className="font-bold text-rose-600">₹{inv.totalAmount?.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="space-y-2">
                              {inv.items.map(item => (
                                <div key={item.productId} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-lg">
                                  <span>{item.productName} ({item.quantity} {item.unit || 'PCS'})</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-slate-400">Fulfilled: {item.fulfilledQuantity || 0}</span>
                                    <input
                                      type="number"
                                      min="0"
                                      max={item.quantity - (item.fulfilledQuantity || 0)}
                                      placeholder="Qty"
                                      value={deliveryInputs[inv.id]?.[item.productId] || ''}
                                      onChange={(e) => handleDeliveryQtyChange(inv.id, item.productId, e.target.value)}
                                      className="w-16 px-2 py-1 border border-slate-200 rounded text-center text-xs"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => handleFulfillDelivery(inv.id)}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-1.5 rounded-lg text-xs font-bold cursor-pointer transition"
                            >
                              Deliver Selected Items
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'new-bill' && (
                  <form onSubmit={handleCreateNewBill} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                    <h4 className="font-bold text-slate-800 text-sm">Generate Spot Bill</h4>
                    {billSuccess && (
                      <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-medium border border-emerald-100">
                        {billSuccess}
                      </div>
                    )}
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {products.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{p.name}</span>
                            <span className="text-slate-400 ml-2">MRP: ₹{p.mrp}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              placeholder="Qty"
                              value={billQuantities[p.id] || ''}
                              onChange={(e) => setBillQuantities(prev => ({ ...prev, [p.id]: e.target.value }))}
                              className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-center text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2 rounded-xl text-xs font-bold cursor-pointer transition"
                    >
                      {loading ? 'Creating...' : 'Generate Bill for Store'}
                    </button>
                  </form>
                )}

                {activeTab === 'checkout' && (
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                    <h4 className="font-bold text-slate-800 text-sm">Wrap-Up & Check-Out</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Collection Amount (₹)</label>
                        <input
                          type="number"
                          placeholder="e.g. 5000"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="CASH">Cash</option>
                          <option value="ONLINE">Online / UPI</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-xs">Visit Outcome Notes</label>
                      <textarea
                        rows="3"
                        value={checkoutOutcome}
                        onChange={(e) => setCheckoutOutcome(e.target.value)}
                        placeholder="Details of delivery, shop keeper interaction, stock status..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                      ></textarea>
                    </div>
                    <button
                      onClick={handleCheckOut}
                      disabled={loading}
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl text-xs font-bold cursor-pointer transition"
                    >
                      {loading ? 'Processing Checkout...' : 'Confirm Checkout & Close Visit'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TODAY'S VISITS FEED: CONTROLS & FILTER TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
        
        {/* Row 1: Date Navigator & Rep Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Date Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-rose-500" />
              Visit Date:
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleQuickDate(-1)}
                className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition"
              >
                Yesterday
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(0)}
                className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer transition ${
                  selectedDate === new Date().toISOString().split('T')[0]
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate(1)}
                className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition"
              >
                Tomorrow
              </button>
            </div>
          </div>

          {/* Rep Filter & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-slate-400" />
              <select
                value={selectedRepFilter}
                onChange={(e) => setSelectedRepFilter(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="ALL">All Sales Executives ({salesTeam.length})</option>
                {salesTeam.map(item => (
                  <option key={item.user?._id} value={item.user?._id}>
                    {item.user?.name} {item.profile?.employeeCode ? `(${item.profile.employeeCode})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search store, rep, dealer, city..."
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs w-52 sm:w-64 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          </div>

        </div>

        {/* Row 2: Status Tabs */}
        <div className="flex items-center gap-1.5 border-t border-slate-100 pt-3 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: 'All Scheduled', count: todayStats.totalScheduled },
            { id: 'SCHEDULED', label: 'Awaiting Arrival', count: todayStats.pendingCount },
            { id: 'IN_PROGRESS', label: 'In Progress (GPS)', count: todayStats.inProgressCount },
            { id: 'COMPLETED', label: 'Completed', count: todayStats.completedCount },
            { id: 'CANCELLED', label: 'Missed / Cancelled', count: todayStats.cancelledCount }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatusTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                selectedStatusTab === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                selectedStatusTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

      </div>

      {/* 5. TODAY'S VISITS FEED TABLE / BOARD */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        {visitsLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading today's field sales visits...</p>
          </div>
        ) : filteredVisits.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
              <StoreIcon className="w-7 h-7" />
            </div>
            <h3 className="font-black text-slate-800 text-base">No store visits found for this selection</h3>
            <p className="text-slate-500 text-xs max-w-md mx-auto">
              There are no allocated store visits matching this date and status filter. Click below to assign visits to your field sales team.
            </p>
            <button
              type="button"
              onClick={() => handleOpenAllocateModal()}
              className="mt-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 transition"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Allocate Visit to Salesperson</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4">Store / Outlet</th>
                  <th className="py-3.5 px-4">Assigned Executive</th>
                  <th className="py-3.5 px-4">Timing & Status</th>
                  <th className="py-3.5 px-4">Purpose & Priority</th>
                  <th className="py-3.5 px-4">GPS Verification</th>
                  <th className="py-3.5 px-4 text-right">Commercials</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVisits.map((visit) => {
                  const store = visit.storeId;
                  const rep = visit.salespersonId;
                  const dealer = visit.dealerId;
                  const isLive = visit.status === 'IN_PROGRESS' || (visit.checkInTime && !visit.checkOutTime);
                  const isDone = visit.status === 'COMPLETED' || (visit.checkOutTime && visit.outcome);
                  const isScheduled = visit.status === 'SCHEDULED' && !visit.checkInTime;

                  return (
                    <tr key={visit._id || visit.id} className="hover:bg-slate-50/60 transition-colors">
                      
                      {/* Outlet Info */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <StoreIcon className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                          <span>{store?.name || 'Retail Outlet'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {store?.city || store?.address || 'Area unassigned'}
                        </div>
                        {dealer?.companyName && (
                          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            Dealer: {dealer.companyName}
                          </span>
                        )}
                      </td>

                      {/* Assigned Executive */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>{rep?.name || visit.visitorName || 'Unassigned Rep'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {visit.salespersonProfile?.employeeCode ? (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/50">
                              {visit.salespersonProfile.employeeCode}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Field Exec</span>
                          )}
                          {rep?.phone && (
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                              <Phone className="w-2.5 h-2.5" /> {rep.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Timings & Status */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {isLive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                              IN PROGRESS
                            </span>
                          ) : isDone ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <Check className="w-3 h-3" />
                              COMPLETED
                            </span>
                          ) : visit.status === 'CANCELLED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-800">
                              CANCELLED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200/60">
                              <Clock className="w-3 h-3" />
                              SCHEDULED
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                          {visit.checkInTime && (
                            <div>In: <strong className="text-slate-700">{new Date(visit.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></div>
                          )}
                          {visit.checkOutTime && (
                            <div>Out: <strong className="text-slate-700">{new Date(visit.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></div>
                          )}
                        </div>
                      </td>

                      {/* Purpose & Priority */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                            visit.priority === 'URGENT' 
                              ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                              : visit.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {visit.priority || 'NORMAL'}
                          </span>
                        </div>
                        <div className="font-semibold text-slate-800 text-xs mt-1">
                          {visit.purpose}
                        </div>
                        {visit.remarks && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs" title={visit.remarks}>
                            "{visit.remarks}"
                          </div>
                        )}
                      </td>

                      {/* GPS Verification */}
                      <td className="py-3 px-4">
                        {visit.latitude && visit.longitude ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              GPS Verified
                            </span>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {visit.latitude.toFixed(4)}°, {visit.longitude.toFixed(4)}°
                            </div>
                            <a
                              href={`https://www.google.com/maps?q=${visit.latitude},${visit.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-rose-600 hover:text-rose-700 font-bold inline-flex items-center gap-0.5 mt-0.5"
                            >
                              View on Map <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Pending check-in
                          </span>
                        )}
                      </td>

                      {/* Commercial Output */}
                      <td className="py-3 px-4 text-right">
                        <div>
                          <span className="text-[11px] text-slate-400">Order: </span>
                          <span className="font-bold text-slate-800">
                            {visit.orderValue > 0 ? `₹${visit.orderValue.toLocaleString('en-IN')}` : '₹0'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-slate-400">Collected: </span>
                          <span className="font-bold text-emerald-600">
                            {visit.paymentsCollected > 0 ? `₹${visit.paymentsCollected.toLocaleString('en-IN')}` : '₹0'}
                          </span>
                        </div>
                        {visit.paymentMethod && visit.paymentMethod !== 'NONE' && (
                          <span className="text-[10px] font-bold text-slate-500 uppercase">
                            ({visit.paymentMethod})
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedVisitDossier(visit)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition"
                            title="View Complete Visit Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Details</span>
                          </button>

                          {visit.status === 'SCHEDULED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateVisitStatus(visit._id || visit.id, 'CANCELLED')}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] cursor-pointer transition"
                              title="Cancel Visit"
                            >
                              Cancel
                            </button>
                          )}

                          {visit.status === 'IN_PROGRESS' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateVisitStatus(visit._id || visit.id, 'COMPLETED')}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] cursor-pointer transition"
                              title="Mark Completed"
                            >
                              Complete
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* 6. ALLOCATION MODAL: ASSIGN STORE VISIT TO SALESPERSON   */}
      {/* ======================================================== */}
      {isAllocateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-sm">
                  <Truck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">Allocate Store Visit</h3>
                  <p className="text-slate-500 text-xs">Assign target retail outlet visit to a sales executive.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAllocateModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAllocateSubmit} className="space-y-4">
              
              {/* Field 1: Salesperson */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Assigned Sales Executive <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={allocationForm.salespersonId}
                  onChange={(e) => setAllocationForm(prev => ({ ...prev, salespersonId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="">Select Sales Representative...</option>
                  {salesTeam.map(item => (
                    <option key={item.user?._id} value={item.user?._id}>
                      {item.user?.name} {item.profile?.employeeCode ? `[${item.profile.employeeCode}]` : ''} - {item.profile?.designation || 'Field Exec'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 2 & 3: Dealer & Store Outlet */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Filter By Dealer (Optional)
                  </label>
                  <select
                    value={allocationForm.dealerId}
                    onChange={(e) => setAllocationForm(prev => ({ ...prev, dealerId: e.target.value, storeId: '' }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    <option value="">All Approved Dealers...</option>
                    {dealers.map(d => (
                      <option key={d.id || d._id} value={d.id || d._id}>{d.companyName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Target Store / Outlet <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={allocationForm.storeId}
                    onChange={(e) => setAllocationForm(prev => ({ ...prev, storeId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    <option value="">Select Target Store...</option>
                    {allocationStoreOptions.map(s => (
                      <option key={s.id || s._id} value={s.id || s._id}>
                        {s.name} ({s.city || 'Tamil Nadu'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 4 & 5: Scheduled Date & Purpose */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Scheduled Visit Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={allocationForm.scheduledDate}
                    onChange={(e) => setAllocationForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Visit Purpose <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={allocationForm.purpose}
                    onChange={(e) => setAllocationForm(prev => ({ ...prev, purpose: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  >
                    <option value="Order Booking & Stock Audit">Order Booking & Stock Audit</option>
                    <option value="Payment Collection & Reconciliation">Payment Collection & Reconciliation</option>
                    <option value="New Product Sampling & Launch">New Product Sampling & Launch</option>
                    <option value="Routine Beat Route Visit">Routine Beat Route Visit</option>
                    <option value="Customer Relationship & Feedback">Customer Relationship & Feedback</option>
                    <option value="Dispute & Return Resolution">Dispute & Return Resolution</option>
                  </select>
                </div>
              </div>

              {/* Field 6: Priority */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Visit Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'NORMAL', label: 'Normal', color: 'border-slate-300 text-slate-700' },
                    { id: 'HIGH', label: 'High Priority', color: 'border-amber-400 text-amber-700 bg-amber-50/50' },
                    { id: 'URGENT', label: 'Urgent', color: 'border-rose-400 text-rose-700 bg-rose-50/50' }
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setAllocationForm(prev => ({ ...prev, priority: p.id }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                        allocationForm.priority === p.id 
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs font-black' 
                          : p.color
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 7: Instructions / Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Special Instructions / Admin Remarks
                </label>
                <textarea
                  rows="3"
                  value={allocationForm.remarks}
                  onChange={(e) => setAllocationForm(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="e.g. Verify stock levels of Peanut Candies, collect overdue payment of ₹8,000, and introduce newly launched roasted snacks SKU."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                ></textarea>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAllocateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={allocationSubmitting}
                  className="bg-gradient-to-r from-rose-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-rose-500/20 active:scale-95 transition"
                >
                  {allocationSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Allocating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Allocate Visit</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 7. VISIT DOSSIER MODAL: COMPLETE VISIT AUDIT BREAKDOWN    */}
      {/* ======================================================== */}
      {selectedVisitDossier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            
            {/* Dossier Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                  Store Visit Dossier #{(selectedVisitDossier._id || selectedVisitDossier.id)?.slice(-6).toUpperCase()}
                </span>
                <h3 className="font-black text-slate-900 text-lg">
                  {selectedVisitDossier.storeId?.name || 'Retail Outlet'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVisitDossier(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dossier Body */}
            <div className="space-y-4 text-xs">
              
              {/* Executive & Outlet Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Assigned Executive</span>
                  <div className="font-black text-slate-900 text-sm mt-0.5">
                    {selectedVisitDossier.salespersonId?.name || selectedVisitDossier.visitorName}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {selectedVisitDossier.salespersonProfile?.employeeCode && (
                      <span className="font-bold text-amber-700 mr-2">[{selectedVisitDossier.salespersonProfile.employeeCode}]</span>
                    )}
                    {selectedVisitDossier.salespersonId?.phone || 'No phone'}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Outlet Location</span>
                  <div className="font-black text-slate-900 text-sm mt-0.5">
                    {selectedVisitDossier.storeId?.city || 'Tamil Nadu'}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Dealer: <strong className="text-slate-700">{selectedVisitDossier.dealerId?.companyName || 'Direct'}</strong>
                  </div>
                </div>
              </div>

              {/* Lifecycle & Verification Status */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Lifecycle & GPS Verification
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Status</span>
                    <div className="font-black text-slate-800 text-xs mt-1">
                      {selectedVisitDossier.status || 'SCHEDULED'}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Scheduled Date</span>
                    <div className="font-bold text-slate-800 text-xs mt-1">
                      {selectedVisitDossier.scheduledDate ? new Date(selectedVisitDossier.scheduledDate).toLocaleDateString() : 'Today'}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Check-In Time</span>
                    <div className="font-bold text-slate-800 text-xs mt-1">
                      {selectedVisitDossier.checkInTime ? new Date(selectedVisitDossier.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Check-Out Time</span>
                    <div className="font-bold text-slate-800 text-xs mt-1">
                      {selectedVisitDossier.checkOutTime ? new Date(selectedVisitDossier.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </div>
                  </div>
                </div>

                {selectedVisitDossier.latitude && selectedVisitDossier.longitude && (
                  <div className="bg-emerald-50/60 border border-emerald-200/60 p-3 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="font-mono text-emerald-800 text-xs">
                        GPS Check-In: {selectedVisitDossier.latitude.toFixed(5)}° N, {selectedVisitDossier.longitude.toFixed(5)}° E
                      </span>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${selectedVisitDossier.latitude},${selectedVisitDossier.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:text-emerald-900 font-bold text-xs inline-flex items-center gap-1"
                    >
                      Open in Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Purpose & Outcome */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-2xl p-4 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Admin Instructions</span>
                  <p className="text-slate-700 font-medium">
                    {selectedVisitDossier.remarks || 'No special instructions specified.'}
                  </p>
                </div>
                <div className="border border-slate-200 rounded-2xl p-4 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Field Outcome Notes</span>
                  <p className="text-slate-700 font-medium">
                    {selectedVisitDossier.outcome || 'Visit pending completion by salesperson.'}
                  </p>
                </div>
              </div>

              {/* Financial Output */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-4 text-white flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Order Value Booked</span>
                  <div className="text-xl font-black text-white">
                    ₹{(selectedVisitDossier.orderValue || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Payments Collected</span>
                  <div className="text-xl font-black text-emerald-400">
                    ₹{(selectedVisitDossier.paymentsCollected || 0).toLocaleString('en-IN')}
                  </div>
                  {selectedVisitDossier.paymentMethod && (
                    <span className="text-[10px] text-slate-300 uppercase">
                      ({selectedVisitDossier.paymentMethod})
                    </span>
                  )}
                </div>
              </div>

            </div>

            {/* Dossier Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedVisitDossier(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
