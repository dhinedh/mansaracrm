 // src/pages/admin/RetailStoresPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Store,
  MapPin,
  Phone,
  ShieldCheck,
  Calendar,
  IndianRupee,
  Clock,
  Search,
  Filter,
  X,
  User,
  ShoppingBag,
  Package,
  Layers,
  History,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Plus,
  Navigation,
  ExternalLink,
  RefreshCw,
  TrendingDown
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

function StatCard({ label, value, sub, icon: Icon, color = 'rose' }) {
  const colors = {
    rose:    { bg: 'bg-rose-50',    icon: 'text-rose-600',    val: 'text-rose-700' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', val: 'text-emerald-700' },
    amber:   { bg: 'bg-amber-50',   icon: 'text-amber-600',   val: 'text-amber-700' },
    blue:    { bg: 'bg-blue-50',    icon: 'text-blue-600',    val: 'text-blue-700' },
  };
  const c = colors[color] || colors.rose;
  return (
    <div className="bg-white border border-slate-150 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${c.icon}`} />
      </div>
      <div>
        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-black ${c.val}`}>{value}</p>
        {sub && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ClassificationBadge({ type }) {
  if (type === 'KIRANA') {
    return (
      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase bg-amber-50 text-amber-800 border border-amber-100">
        Kirana
      </span>
    );
  }
  return (
    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-800 border border-emerald-100">
      Retail
    </span>
  );
}

function LocationStatusBadge({ status, isVerified }) {
  if (isVerified || status === 'VERIFIED') {
    return (
      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
        Verified GPS
      </span>
    );
  }
  if (status === 'COORDINATES_CAPTURED') {
    return (
      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 w-fit">
        <Navigation className="w-2.5 h-2.5 text-blue-600" />
        GPS Captured
      </span>
    );
  }
  return (
    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
      <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
      Pending GPS
    </span>
  );
}

export default function RetailStoresPage() {
  const { user } = useAuthStore();
  const isAdmin = ['ADMIN', 'B2B_MANAGER'].includes(user?.role);

  const [dealers, setDealers] = useState([]);
  const [allStores, setAllStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Filters
  const [filterDealer, setFilterDealer] = useState('');
  const [filterClassification, setFilterClassification] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterLocationStatus, setFilterLocationStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 360 Store Modal States
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyStore, setHistoryStore] = useState(null);
  const [historyTab, setHistoryTab] = useState('orders'); // 'orders' | 'stock' | 'location' | 'visits' | 'audit'
  const [historyLoading, setHistoryLoading] = useState(false);

  // Store Orders State
  const [storeOrdersData, setStoreOrdersData] = useState({ orders: [], totalOrders: 0, totalOrderValue: 0 });
  // Store Stock State
  const [storeStockData, setStoreStockData] = useState({ items: [], lowStockCount: 0, outOfStockCount: 0 });
  // Store Visits & Invoices
  const [historyVisits, setHistoryVisits] = useState([]);
  // Store Audit Trail State
  const [storeAuditLogs, setStoreAuditLogs] = useState([]);

  // Stock Adjustment Modal
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProductStock, setSelectedProductStock] = useState(null);
  const [adjustStockQty, setAdjustStockQty] = useState('');
  const [adjustStockMin, setAdjustStockMin] = useState('10');
  const [adjustStockNotes, setAdjustStockNotes] = useState('');
  const [stockUpdating, setStockUpdating] = useState(false);

  // Edit Store Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  // Add Store Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '', ownerName: '', phone: '', address: '', city: '', state: 'Tamil Nadu',
    pincode: '', zone: '', category: 'RETAIL', gstNumber: '', dealerId: '',
    latitude: '', longitude: '', marginPercent: '10'
  });
  const [addSaving, setAddSaving] = useState(false);

  // Location Matching State
  const [matchingGps, setMatchingGps] = useState(false);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  useEffect(() => {
    fetchDealers();
  }, []);

  useEffect(() => {
    fetchStores();
  }, [filterDealer]);

  const fetchDealers = async () => {
    try {
      const res = await axios.get('/dealers');
      setDealers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load dealers', err);
    }
  };

  /**
   * Fetch stores from backend.
   * FIX: Backend now accurately enriches each store with its actual assigned dealer.
   * No arbitrary fallback to 'Dealer Tamil Enterprises' or looping that causes mapping bugs.
   */
  const fetchStores = async () => {
    setLoading(true);
    try {
      const url = filterDealer ? `/stores?dealerId=${filterDealer}` : '/stores';
      const res = await axios.get(url);
      setAllStores(res.data.data || []);
    } catch (err) {
      console.error('Failed to load stores', err);
      setMessage({ text: 'Failed to load store data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Open 360 Store Modal: loads orders, stock, audit trail, and visits for this store
   */
  const openHistoryModal = async (store, initialTab = 'orders') => {
    setHistoryStore(store);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    setHistoryTab(initialTab);

    setManualLat(store.latitude ? String(store.latitude) : '');
    setManualLng(store.longitude ? String(store.longitude) : '');

    try {
      const [ordersRes, stockRes, auditRes, visitsRes] = await Promise.all([
        axios.get(`/stores/${store.id}/orders`).catch(() => ({ data: { data: { orders: [] } } })),
        axios.get(`/stores/${store.id}/stock`).catch(() => ({ data: { data: { items: [] } } })),
        axios.get(`/audit/logs/Store/${store.id}`).catch(() => ({ data: { data: [] } })),
        axios.get('/field-sales/visits').catch(() => ({ data: { data: [] } }))
      ]);

      setStoreOrdersData(ordersRes.data?.data || { orders: [] });
      setStoreStockData(stockRes.data?.data || { items: [] });
      setStoreAuditLogs(auditRes.data?.data || []);
      const storeIdStr = store.id?.toString();
      setHistoryVisits((visitsRes.data?.data || []).filter(v => v.storeId?.toString() === storeIdStr));
    } catch (err) {
      console.error('Failed to load full store 360 data', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setHistoryStore(null);
  };

  /**
   * Handle Location Matching (Requirement 7)
   */
  const handleMatchGpsCoordinates = async () => {
    if (!historyStore) return;
    setMatchingGps(true);
    try {
      let lat = parseFloat(manualLat);
      let lng = parseFloat(manualLng);

      // If user clicked auto-fetch current device coordinates
      if (isNaN(lat) || isNaN(lng)) {
        if (!navigator.geolocation) {
          alert('Geolocation is not supported by your browser');
          setMatchingGps(false);
          return;
        }
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            pos => {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              setManualLat(String(lat));
              setManualLng(String(lng));
              resolve();
            },
            err => reject(err),
            { enableHighAccuracy: true, timeout: 10000 }
          );
        });
      }

      const res = await axios.put(`/stores/${historyStore.id}/match-location`, {
        latitude: lat,
        longitude: lng
      });

      if (res.data?.success) {
        setMessage({ text: 'GPS coordinates matched successfully!', type: 'success' });
        setHistoryStore(res.data.data);
        fetchStores();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to match GPS coordinates');
    } finally {
      setMatchingGps(false);
    }
  };

  /**
   * Admin Location Verification (Requirement 7)
   */
  const handleVerifyLocation = async () => {
    if (!historyStore) return;
    try {
      const res = await axios.put(`/stores/${historyStore.id}/verify-location`);
      if (res.data?.success) {
        setMessage({ text: 'Shop location marked as VERIFIED!', type: 'success' });
        setHistoryStore(res.data.data);
        fetchStores();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify location');
    }
  };

  /**
   * Admin Stock Adjustment (Requirement 6)
   */
  const handleOpenStockModal = (productItem) => {
    setSelectedProductStock(productItem);
    setAdjustStockQty(String(productItem.currentStock || 0));
    setAdjustStockMin(String(productItem.minThreshold || 10));
    setAdjustStockNotes('');
    setShowStockModal(true);
  };

  const handleSaveStockAdjustment = async (e) => {
    e.preventDefault();
    if (!historyStore || !selectedProductStock) return;
    setStockUpdating(true);
    try {
      const res = await axios.put(`/stores/${historyStore.id}/stock`, {
        productId: selectedProductStock.productId,
        currentStock: parseInt(adjustStockQty, 10) || 0,
        minThreshold: parseInt(adjustStockMin, 10) || 10,
        notes: adjustStockNotes
      });

      if (res.data?.success) {
        setMessage({ text: 'Stock quantity updated successfully!', type: 'success' });
        setShowStockModal(false);
        // Refresh stock tab data
        const stockRes = await axios.get(`/stores/${historyStore.id}/stock`);
        setStoreStockData(stockRes.data?.data || { items: [] });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setStockUpdating(false);
    }
  };

  /**
   * Admin Edit Store (Requirement 8)
   */
  const handleOpenEditModal = (store) => {
    setEditFormData({
      id: store.id,
      name: store.name || '',
      ownerName: store.ownerName || '',
      phone: store.phone || '',
      address: store.address || '',
      manualAddress: store.manualAddress || store.address || '',
      city: store.city || '',
      state: store.state || 'Tamil Nadu',
      pincode: store.pincode || '',
      zone: store.zone || '',
      category: store.category || store.classification || 'RETAIL',
      gstNumber: store.gstNumber || '',
      dealerId: store.dealerId || store.dealer?.id || '',
      marginPercent: store.marginPercent !== null && store.marginPercent !== undefined ? String(store.marginPercent) : '10',
      latitude: store.latitude ? String(store.latitude) : '',
      longitude: store.longitude ? String(store.longitude) : '',
      isLocationVerified: !!store.isLocationVerified
    });
    setShowEditModal(true);
  };

  const handleSaveEditStore = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const res = await axios.put(`/stores/${editFormData.id}`, editFormData);
      if (res.data?.success) {
        setMessage({ text: 'Store details updated successfully!', type: 'success' });
        setShowEditModal(false);
        fetchStores();
        if (historyStore && historyStore.id === editFormData.id) {
          setHistoryStore(res.data.data);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update store details');
    } finally {
      setEditSaving(false);
    }
  };

  /**
   * Add New Store
   */
  const handleSaveAddStore = async (e) => {
    e.preventDefault();
    setAddSaving(true);
    try {
      const res = await axios.post('/stores', addFormData);
      if (res.data?.success) {
        setMessage({ text: 'New retail shop registered successfully!', type: 'success' });
        setShowAddModal(false);
        fetchStores();
        setAddFormData({
          name: '', ownerName: '', phone: '', address: '', city: '', state: 'Tamil Nadu',
          pincode: '', zone: '', category: 'RETAIL', gstNumber: '', dealerId: '',
          latitude: '', longitude: '', marginPercent: '10'
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add store');
    } finally {
      setAddSaving(false);
    }
  };

  // ─── Derived data ───────────────────────────────────────────────────────────

  const zones = useMemo(() => {
    const z = new Set(allStores.map(s => s.zone).filter(Boolean));
    return [...z].sort();
  }, [allStores]);

  const filteredStores = useMemo(() => {
    let result = allStores;
    if (filterClassification) result = result.filter(s => s.classification === filterClassification);
    if (filterZone) result = result.filter(s => s.zone === filterZone);
    if (filterLocationStatus) {
      if (filterLocationStatus === 'VERIFIED') {
        result = result.filter(s => s.isLocationVerified || s.locationStatus === 'VERIFIED');
      } else if (filterLocationStatus === 'CAPTURED') {
        result = result.filter(s => s.locationStatus === 'COORDINATES_CAPTURED' && !s.isLocationVerified);
      } else if (filterLocationStatus === 'PENDING') {
        result = result.filter(s => s.locationStatus === 'PENDING_COORDINATES' || (!s.latitude && !s.longitude));
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.gstNumber?.toLowerCase().includes(q) ||
        s.dealerName?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allStores, filterClassification, filterZone, filterLocationStatus, searchQuery]);

  const stats = useMemo(() => ({
    total: allStores.length,
    retail: allStores.filter(s => s.classification !== 'KIRANA').length,
    kirana: allStores.filter(s => s.classification === 'KIRANA').length,
    verifiedGps: allStores.filter(s => s.isLocationVerified || s.locationStatus === 'VERIFIED').length,
    pendingGps: allStores.filter(s => s.locationStatus === 'PENDING_COORDINATES' || (!s.latitude && !s.longitude)).length
  }), [allStores]);

  const selectedDealerName = useMemo(() => {
    if (!filterDealer) return 'All Distributors';
    const d = dealers.find(item => item.id === filterDealer || item._id === filterDealer);
    return d ? (d.companyName || d.name || 'Selected Distributor') : 'Selected Distributor';
  }, [filterDealer, dealers]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-rose-500 block">
            B2B Retail &amp; Outlets Network
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            Retail Stores &amp; Outlets
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Track shop-wise orders, current stocks, verified GPS addresses, and audit history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Shop
          </button>
        </div>
      </div>

      {/* Global Alert Notification */}
      {message.text && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            message.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <StatCard
          label="Total Shops"
          value={stats.total}
          icon={Store}
          color="rose"
          sub="Across all territories"
        />
        <StatCard
          label="Supermarket / Retail"
          value={stats.retail}
          icon={Store}
          color="emerald"
          sub="Modern trade"
        />
        <StatCard
          label="Kirana Stores"
          value={stats.kirana}
          icon={Store}
          color="amber"
          sub="Traditional trade"
        />
        <StatCard
          label="Verified GPS"
          value={stats.verifiedGps}
          icon={CheckCircle2}
          color="blue"
          sub="Pinpoint locations"
        />
        <StatCard
          label="Pending GPS"
          value={stats.pendingGps}
          icon={AlertTriangle}
          color="amber"
          sub="Needs visit match"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Dealer Selector */}
          <div className="relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
              Filter by Distributor / Dealer
            </label>
            <select
              value={filterDealer}
              onChange={(e) => setFilterDealer(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="">All Distributors &amp; Direct Stores</option>
              {dealers.map((d) => (
                <option key={d.id || d._id} value={d.id || d._id}>
                  {d.companyName || d.name} {d.city ? `(${d.city})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Classification Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
              Store Category
            </label>
            <select
              value={filterClassification}
              onChange={(e) => setFilterClassification(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="">All Categories</option>
              <option value="RETAIL">Retail / Supermarket</option>
              <option value="KIRANA">Kirana Store</option>
            </select>
          </div>

          {/* Location Status Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
              GPS Location Status
            </label>
            <select
              value={filterLocationStatus}
              onChange={(e) => setFilterLocationStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="">All Location Statuses</option>
              <option value="VERIFIED">Verified GPS (Approved)</option>
              <option value="CAPTURED">GPS Captured (Unverified)</option>
              <option value="PENDING">Pending GPS Coordinates</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
              Search Shops
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, city, phone, GST, distributor..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(filterDealer || filterClassification || filterZone || filterLocationStatus || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-[11px]">
            <span className="text-slate-400 font-bold uppercase text-[9px]">Active Filters:</span>
            {filterDealer && (
              <span className="bg-rose-50 text-rose-700 font-semibold px-2.5 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
                Distributor: {selectedDealerName}
                <button onClick={() => setFilterDealer('')}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {filterClassification && (
              <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                {filterClassification}
                <button onClick={() => setFilterClassification('')}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {filterLocationStatus && (
              <span className="bg-blue-50 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                GPS: {filterLocationStatus}
                <button onClick={() => setFilterLocationStatus('')}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            <button
              onClick={() => {
                setFilterDealer('');
                setFilterClassification('');
                setFilterZone('');
                setFilterLocationStatus('');
                setSearchQuery('');
              }}
              className="text-rose-600 hover:underline font-bold text-[10px] ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Store Count Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing <strong className="text-slate-800 font-bold">{filteredStores.length}</strong> of{' '}
          <strong className="text-slate-800 font-bold">{allStores.length}</strong> outlets
          {filterDealer ? ` · ${selectedDealerName}` : ' · All Outlets'}
        </span>
      </div>

      {/* Stores Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full mb-3" />
          <p className="text-xs text-slate-500 font-medium">Loading retail store records...</p>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-16 text-center space-y-3">
          <Store className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-sm">No retail stores found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query, distributor filter, or store classification.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStores.map((store) => (
            <div
              key={store.id}
              className="bg-white border border-slate-150 rounded-2xl shadow-xs p-5 space-y-4 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${store.classification === 'KIRANA' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm leading-tight">{store.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <ClassificationBadge type={store.classification} />
                        <LocationStatusBadge status={store.locationStatus} isVerified={store.isLocationVerified} />
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleOpenEditModal(store)}
                      title="Edit shop details"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Distributor / Dealer Name (Accurately mapped from DB) */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[10px] text-slate-600">
                      Distributor: <strong className="text-slate-800 font-bold">{store.dealerName || 'Direct / Head Office'}</strong>
                    </span>
                  </div>
                  {store.dealerCity && (
                    <span className="text-[9px] font-semibold text-slate-400">{store.dealerCity}</span>
                  )}
                </div>

                {/* Store Info */}
                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                  {store.phone && (
                    <p className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700">{store.phone}</span>
                    </p>
                  )}
                  <p className="flex items-start space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] line-clamp-2">
                      {store.address}{store.city ? `, ${store.city}` : ''}
                      {store.pincode ? ` - ${store.pincode}` : ''}
                    </span>
                  </p>
                  {store.latitude && store.longitude && (
                    <p className="text-[10px] text-slate-400 font-mono pl-5.5">
                      GPS: {store.latitude.toFixed(4)}, {store.longitude.toFixed(4)}
                    </p>
                  )}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                    <span className="text-slate-500 font-medium">Margin Discount:</span>
                    <strong className="text-rose-600 font-bold">
                      {store.marginPercent !== null && store.marginPercent !== undefined ? `${store.marginPercent}%` : 'Default (10%)'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons: 360 View, Orders & Stocks */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openHistoryModal(store, 'orders')}
                  className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Orders</span>
                </button>
                <button
                  onClick={() => openHistoryModal(store, 'stock')}
                  className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Stock</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── 360 Store Details Modal (Orders, Stock, Location, Visits, Audit) ─── */}
      {showHistoryModal && historyStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-lg">
                    🏪 {historyStore.name}
                  </h3>
                  <ClassificationBadge type={historyStore.classification} />
                  <LocationStatusBadge status={historyStore.locationStatus} isVerified={historyStore.isLocationVerified} />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {historyStore.address}{historyStore.city ? `, ${historyStore.city}` : ''} · Distributor:{' '}
                  <strong className="text-slate-800">{historyStore.dealerName || 'Direct / Head Office'}</strong>
                </p>
              </div>
              <button
                onClick={closeHistoryModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tab Navigation */}
            <div className="flex border-b border-slate-200 bg-white px-6 shrink-0 gap-6 text-xs font-bold overflow-x-auto">
              <button
                onClick={() => setHistoryTab('orders')}
                className={`py-3.5 border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  historyTab === 'orders'
                    ? 'border-rose-600 text-rose-600 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Order Tracking ({storeOrdersData.orders?.length || 0})
              </button>
              <button
                onClick={() => setHistoryTab('stock')}
                className={`py-3.5 border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  historyTab === 'stock'
                    ? 'border-rose-600 text-rose-600 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Package className="w-4 h-4" />
                Stock Tracking ({storeStockData.items?.length || 0})
                {storeStockData.lowStockCount > 0 && (
                  <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black">
                    {storeStockData.lowStockCount} low
                  </span>
                )}
              </button>
              <button
                onClick={() => setHistoryTab('location')}
                className={`py-3.5 border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  historyTab === 'location'
                    ? 'border-rose-600 text-rose-600 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MapPin className="w-4 h-4" />
                Address &amp; GPS Match
              </button>
              <button
                onClick={() => setHistoryTab('visits')}
                className={`py-3.5 border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  historyTab === 'visits'
                    ? 'border-rose-600 text-rose-600 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                Visit History ({historyVisits.length})
              </button>
              <button
                onClick={() => setHistoryTab('audit')}
                className={`py-3.5 border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  historyTab === 'audit'
                    ? 'border-rose-600 text-rose-600 font-black'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <History className="w-4 h-4" />
                Audit Trail ({storeAuditLogs.length})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {historyLoading ? (
                <div className="py-16 text-center">
                  <div className="inline-block animate-spin w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full mb-3" />
                  <p className="text-xs text-slate-500">Loading shop intelligence...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: SHOP-WISE ORDER TRACKING (Requirement 5) */}
                  {historyTab === 'orders' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="text-xs text-slate-600">
                          Total Orders: <strong className="text-slate-900 font-bold">{storeOrdersData.totalOrders || storeOrdersData.orders?.length || 0}</strong>
                        </span>
                        <span className="text-xs text-slate-600">
                          Total Value:{' '}
                          <strong className="text-rose-600 font-black">
                            ₹{(storeOrdersData.totalOrderValue || 0).toLocaleString('en-IN')}
                          </strong>
                        </span>
                      </div>

                      {storeOrdersData.orders?.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs">
                          <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          No orders recorded for this outlet yet.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {storeOrdersData.orders.map((ord) => (
                            <div key={ord.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-xs font-black text-slate-900">{ord.orderNumber}</span>
                                  <span className="text-[10px] text-slate-400 block">
                                    {new Date(ord.orderDate).toLocaleDateString('en-IN', {
                                      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })} · Handled by {ord.salespersonName}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-black text-emerald-700 block">
                                    ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                    {ord.status}
                                  </span>
                                </div>
                              </div>

                              {/* Products List */}
                              {ord.items && ord.items.length > 0 && (
                                <div className="bg-slate-50 rounded-lg p-2 text-xs space-y-1">
                                  {ord.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-[11px] text-slate-600">
                                      <span>{item.productName} × {item.quantity}</span>
                                      <span className="font-semibold">₹{Number(item.lineTotal || (item.unitPrice * item.quantity)).toLocaleString('en-IN')}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: SHOP-WISE STOCK TRACKING (Requirement 6) */}
                  {historyTab === 'stock' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="text-xs text-slate-600 font-medium">
                          Product-wise stock catalog for this store.
                        </span>
                        {storeStockData.lowStockCount > 0 && (
                          <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {storeStockData.lowStockCount} Products Need Replenishment
                          </span>
                        )}
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase">
                            <tr>
                              <th className="py-2.5 px-3">Product Name &amp; SKU</th>
                              <th className="py-2.5 px-3">Category</th>
                              <th className="py-2.5 px-3 text-center">Current Stock</th>
                              <th className="py-2.5 px-3 text-center">Min Threshold</th>
                              <th className="py-2.5 px-3 text-center">Health</th>
                              {isAdmin && <th className="py-2.5 px-3 text-right">Action</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {storeStockData.items?.map((item) => (
                              <tr key={item.productId} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3">
                                  <p className="font-bold text-slate-900">{item.name}</p>
                                  <p className="text-[10px] font-mono text-slate-400">{item.sku}</p>
                                </td>
                                <td className="py-2.5 px-3 text-slate-600">{item.category}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className={`font-black text-xs ${item.currentStock === 0 ? 'text-red-600' : item.isLowStock ? 'text-amber-600' : 'text-emerald-700'}`}>
                                    {item.currentStock} units
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                                  {item.minThreshold}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {item.currentStock === 0 ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-red-100 text-red-700">
                                      Out of Stock
                                    </span>
                                  ) : item.isLowStock ? (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-700">
                                      Low Stock
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-700">
                                      Optimal
                                    </span>
                                  )}
                                </td>
                                {isAdmin && (
                                  <td className="py-2.5 px-3 text-right">
                                    <button
                                      onClick={() => handleOpenStockModal(item)}
                                      className="text-rose-600 hover:text-rose-800 font-bold text-xs cursor-pointer"
                                    >
                                      Adjust Stock
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: LOCATION & GPS MATCHING (Requirement 7) */}
                  {historyTab === 'location' && (
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <h4 className="font-bold text-slate-800 text-sm">Shop Address &amp; Location Matching</h4>
                        <p className="text-xs text-slate-500">
                          Initial entry accepts manual address. Later, when GPS coordinates are available from a sales visit or device capture, match and save them below without creating duplicate records.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 font-medium block">Registered Address:</span>
                            <p className="font-bold text-slate-800 mt-0.5">{historyStore.address}</p>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium block">City &amp; Pincode:</span>
                            <p className="font-bold text-slate-800 mt-0.5">{historyStore.city || 'N/A'} - {historyStore.pincode || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-200">
                          <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                            Current GPS Coordinates
                          </label>
                          <div className="flex flex-wrap items-center gap-3">
                            <input
                              type="number"
                              step="any"
                              value={manualLat}
                              onChange={(e) => setManualLat(e.target.value)}
                              placeholder="Latitude (e.g. 13.0418)"
                              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono w-44 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                            />
                            <input
                              type="number"
                              step="any"
                              value={manualLng}
                              onChange={(e) => setManualLng(e.target.value)}
                              placeholder="Longitude (e.g. 80.2341)"
                              className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-mono w-44 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                            />
                            <button
                              type="button"
                              onClick={handleMatchGpsCoordinates}
                              disabled={matchingGps}
                              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer shadow-xs disabled:opacity-50"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                              {matchingGps ? 'Matching GPS...' : 'Capture / Save GPS'}
                            </button>
                            {isAdmin && !historyStore.isLocationVerified && historyStore.latitude && (
                              <button
                                type="button"
                                onClick={handleVerifyLocation}
                                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer shadow-xs"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approve Location
                              </button>
                            )}
                          </div>
                        </div>

                        {historyStore.latitude && historyStore.longitude && (
                          <div className="pt-2">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${historyStore.latitude},${historyStore.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              View Pinpoint on Google Maps ({historyStore.latitude.toFixed(4)}, {historyStore.longitude.toFixed(4)})
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: VISIT LOGS */}
                  {historyTab === 'visits' && (
                    <div className="space-y-3">
                      {historyVisits.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs">
                          No visits logged for this outlet yet.
                        </div>
                      ) : (
                        historyVisits.map((v, i) => (
                          <div key={i} className="border border-slate-200 rounded-xl p-3 text-xs bg-slate-50 space-y-1">
                            <div className="flex justify-between items-center font-bold text-slate-800">
                              <span>Visit on {new Date(v.createdAt).toLocaleDateString('en-IN')}</span>
                              <span className="text-[10px] text-slate-500 font-normal">{v.purpose || 'Store Visit'}</span>
                            </div>
                            <p className="text-slate-600 text-[11px]">{v.notes || 'No remarks added'}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 5: AUDIT TRAIL (Requirement 2) */}
                  {historyTab === 'audit' && (
                    <div className="space-y-3">
                      {storeAuditLogs.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs">
                          No data modification history logged for this store yet.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {storeAuditLogs.map((log) => (
                            <div key={log.id} className="border border-slate-200 rounded-xl p-3 bg-white text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800">
                                  {log.action} by <span className="text-rose-600">{log.userName}</span> ({log.userRole})
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(log.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-slate-600 text-[11px]">{log.details || 'Store record updated'}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Adjust Stock Modal (Requirement 6) ─── */}
      {showStockModal && selectedProductStock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Adjust Shop Stock</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedProductStock.name} ({selectedProductStock.sku})</p>
              </div>
              <button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStockAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Current Stock Quantity (units)*</label>
                <input
                  type="number"
                  min="0"
                  value={adjustStockQty}
                  onChange={(e) => setAdjustStockQty(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Minimum Alert Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={adjustStockMin}
                  onChange={(e) => setAdjustStockMin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Audit Notes / Reason</label>
                <textarea
                  rows="2"
                  value={adjustStockNotes}
                  onChange={(e) => setAdjustStockNotes(e.target.value)}
                  placeholder="e.g. Physical stock count adjustment by sales manager"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stockUpdating}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {stockUpdating ? 'Saving...' : 'Save Stock Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Edit Store Modal (Requirement 8) ─── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 my-8">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Shop Details</h3>
                <p className="text-xs text-slate-500">Update outlet profile, distributor mapping, and GPS coordinates.</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStore} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Shop Name*</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={editFormData.ownerName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, ownerName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Phone*</label>
                  <input
                    type="text"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assigned Distributor / Dealer</label>
                  <select
                    value={editFormData.dealerId || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, dealerId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="">Direct / Head Office (No Dealer)</option>
                    {dealers.map(d => (
                      <option key={d.id || d._id} value={d.id || d._id}>
                        {d.companyName || d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Street Address*</label>
                <textarea
                  rows="2"
                  value={editFormData.address || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City*</label>
                  <input
                    type="text"
                    value={editFormData.city || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pincode</label>
                  <input
                    type="text"
                    value={editFormData.pincode || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, pincode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Zone</label>
                  <input
                    type="text"
                    value={editFormData.zone || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, zone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={editFormData.category || 'RETAIL'}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="RETAIL">Retail / Supermarket</option>
                    <option value="KIRANA">Kirana Store</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Margin Percentage (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editFormData.marginPercent || '10'}
                    onChange={(e) => setEditFormData({ ...editFormData, marginPercent: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Latitude</label>
                  <input
                    type="text"
                    value={editFormData.latitude || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, latitude: e.target.value })}
                    placeholder="13.0418"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Longitude</label>
                  <input
                    type="text"
                    value={editFormData.longitude || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, longitude: e.target.value })}
                    placeholder="80.2341"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {editSaving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add New Store Modal ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 my-8">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Register New Retail Shop</h3>
                <p className="text-xs text-slate-500">Manual address entry supported. GPS location can be captured later.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAddStore} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Shop Name*</label>
                  <input
                    type="text"
                    value={addFormData.name}
                    onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                    required
                    placeholder="e.g. Annai Maligai Store"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={addFormData.ownerName}
                    onChange={(e) => setAddFormData({ ...addFormData, ownerName: e.target.value })}
                    placeholder="e.g. R. Murugan"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number*</label>
                  <input
                    type="text"
                    value={addFormData.phone}
                    onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                    required
                    placeholder="10 digit mobile"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Distributor / Dealer</label>
                  <select
                    value={addFormData.dealerId}
                    onChange={(e) => setAddFormData({ ...addFormData, dealerId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="">Direct Store (No Distributor)</option>
                    {dealers.map(d => (
                      <option key={d.id || d._id} value={d.id || d._id}>
                        {d.companyName || d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Shop Address*</label>
                <textarea
                  rows="2"
                  value={addFormData.address}
                  onChange={(e) => setAddFormData({ ...addFormData, address: e.target.value })}
                  required
                  placeholder="Street name, door no, landmark"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">City*</label>
                  <input
                    type="text"
                    value={addFormData.city}
                    onChange={(e) => setAddFormData({ ...addFormData, city: e.target.value })}
                    required
                    placeholder="Chennai"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Pincode</label>
                  <input
                    type="text"
                    value={addFormData.pincode}
                    onChange={(e) => setAddFormData({ ...addFormData, pincode: e.target.value })}
                    placeholder="600017"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Zone</label>
                  <input
                    type="text"
                    value={addFormData.zone}
                    onChange={(e) => setAddFormData({ ...addFormData, zone: e.target.value })}
                    placeholder="Central Zone"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Optional Latitude</label>
                  <input
                    type="text"
                    value={addFormData.latitude}
                    onChange={(e) => setAddFormData({ ...addFormData, latitude: e.target.value })}
                    placeholder="Optional (match later)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Optional Longitude</label>
                  <input
                    type="text"
                    value={addFormData.longitude}
                    onChange={(e) => setAddFormData({ ...addFormData, longitude: e.target.value })}
                    placeholder="Optional (match later)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addSaving}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {addSaving ? 'Registering...' : 'Register Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
