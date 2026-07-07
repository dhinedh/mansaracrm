// src/pages/admin/RetailStoresPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Store,
  Search,
  Filter,
  Phone,
  MapPin,
  ShieldCheck,
  Layers,
  Calendar,
  Clock,
  User,
  ChevronDown,
  X,
  BarChart3,
  FileText,
  RefreshCw,
  Building2,
  Tag,
  TrendingUp,
  IndianRupee,
  Package
} from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color = 'rose' }) {
  const colors = {
    rose:    { bg: 'bg-rose-50',    icon: 'text-rose-600',    val: 'text-rose-700' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', val: 'text-emerald-700' },
    blue:    { bg: 'bg-blue-50',    icon: 'text-blue-600',    val: 'text-blue-700' },
    amber:   { bg: 'bg-amber-50',   icon: 'text-amber-600',   val: 'text-amber-700' },
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RetailStoresPage() {
  const [dealers, setDealers] = useState([]);
  const [allStores, setAllStores] = useState([]);   // all stores from selected/all dealers
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Filters
  const [filterDealer, setFilterDealer] = useState('');
  const [filterClassification, setFilterClassification] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // History modal
  const [historyStore, setHistoryStore] = useState(null);
  const [historyVisits, setHistoryVisits] = useState([]);
  const [historyInvoices, setHistoryInvoices] = useState([]);
  const [historyTab, setHistoryTab] = useState('visits');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    fetchDealers();
  }, []);

  useEffect(() => {
    fetchStores();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDealer]);

  const fetchDealers = async () => {
    try {
      const res = await axios.get('/dealers');
      setDealers(res.data.data || []);
    } catch (err) {
      console.error('Failed to load dealers', err);
    }
  };

  const fetchStores = async () => {
    setLoading(true);
    try {
      if (filterDealer) {
        // Fetch stores for specific dealer
        const res = await axios.get(`/stores?dealerId=${filterDealer}`);
        setAllStores(res.data.data || []);
      } else {
        // Fetch stores for ALL dealers
        const res = await axios.get('/dealers');
        const dealerList = res.data.data || [];
        const storeFetches = await Promise.all(
          dealerList.map(d =>
            axios.get(`/stores?dealerId=${d.id}`).then(r => (r.data.data || []).map(s => ({
              ...s,
              dealerName: d.name || d.firmName || 'Unknown Dealer',
              dealerCity: d.city || ''
            }))).catch(() => [])
          )
        );
        setAllStores(storeFetches.flat());
      }
    } catch (err) {
      console.error('Failed to load stores', err);
      setMessage({ text: 'Failed to load store data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const openHistoryModal = async (store) => {
    setHistoryStore(store);
    setShowHistoryModal(true);
    setHistoryLoading(true);
    setHistoryTab('visits');
    try {
      const [visitsRes, invoicesRes] = await Promise.all([
        axios.get('/field-sales/visits'),
        axios.get('/billing')
      ]);
      const storeIdStr = store.id?.toString();
      setHistoryVisits((visitsRes.data.data || []).filter(v => v.storeId?.toString() === storeIdStr));
      setHistoryInvoices((invoicesRes.data.data || []).filter(i => i.storeId?.toString() === storeIdStr));
    } catch (err) {
      console.error('Failed to load store history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setHistoryStore(null);
    setHistoryVisits([]);
    setHistoryInvoices([]);
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
  }, [allStores, filterClassification, filterZone, searchQuery]);

  const stats = useMemo(() => ({
    total: allStores.length,
    retail: allStores.filter(s => s.classification !== 'KIRANA').length,
    kirana: allStores.filter(s => s.classification === 'KIRANA').length,
    withRevisit: allStores.filter(s => s.revisitDate).length,
  }), [allStores]);

  const selectedDealerName = useMemo(() => {
    if (!filterDealer) return 'All Dealers';
    const d = dealers.find(d => d.id === filterDealer);
    return d ? (d.name || d.firmName || 'Selected Dealer') : 'Selected Dealer';
  }, [filterDealer, dealers]);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Retail Store Directory</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            All dealer-registered B2C outlet stores — Retail &amp; Kirana
          </p>
        </div>
        <button
          onClick={fetchStores}
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-rose-100 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Alert */}
      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
          {message.text}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Outlets" value={stats.total} icon={Store} color="rose" />
        <StatCard label="Retail" value={stats.retail} sub="Standard retail shops" icon={Building2} color="emerald" />
        <StatCard label="Kirana" value={stats.kirana} sub="Grocery / Kirana stores" icon={Package} color="amber" />
        <StatCard label="With Revisit" value={stats.withRevisit} sub="Scheduled revisit dates" icon={Calendar} color="blue" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by store name, city, phone, GST…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl text-xs focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dealer Filter */}
          <div className="relative min-w-[200px]">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterDealer}
              onChange={e => setFilterDealer(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl text-xs focus:outline-none appearance-none font-semibold text-slate-700"
            >
              <option value="">All Dealers</option>
              {dealers.map(d => (
                <option key={d.id} value={d.id}>{d.name || d.firmName}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Classification Filter */}
          <div className="relative min-w-[160px]">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterClassification}
              onChange={e => setFilterClassification(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl text-xs focus:outline-none appearance-none font-semibold text-slate-700"
            >
              <option value="">All Types</option>
              <option value="RETAIL">Retail</option>
              <option value="KIRANA">Kirana</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Zone Filter */}
          {zones.length > 0 && (
            <div className="relative min-w-[160px]">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterZone}
                onChange={e => setFilterZone(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl text-xs focus:outline-none appearance-none font-semibold text-slate-700"
              >
                <option value="">All Zones</option>
                {zones.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          )}
        </div>

        {/* Active filter indicators */}
        {(filterDealer || filterClassification || filterZone || searchQuery) && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active filters:</span>
            {filterDealer && (
              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-100">
                Dealer: {selectedDealerName}
                <button onClick={() => setFilterDealer('')}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {filterClassification && (
              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-100">
                Type: {filterClassification}
                <button onClick={() => setFilterClassification('')}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {filterZone && (
              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-100">
                Zone: {filterZone}
                <button onClick={() => setFilterZone('')}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-100">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')}><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 font-semibold">
          Showing <span className="text-slate-800 font-black">{filteredStores.length}</span> of <span className="text-slate-800 font-black">{allStores.length}</span> stores
          {filterDealer ? ` · ${selectedDealerName}` : ' · All Dealers'}
        </p>
      </div>

      {/* Stores Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 font-bold text-sm">No stores found</p>
          <p className="text-slate-400 text-xs mt-1">
            {allStores.length === 0
              ? 'No retail stores have been registered yet. Dealers can add their stores from the "My Shop" section.'
              : 'No stores match your current filters. Try adjusting the search or filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredStores.map((store) => (
            <div
              key={store.id}
              className="bg-white border border-slate-150 rounded-2xl shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${store.classification === 'KIRANA' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-xs leading-tight">{store.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <ClassificationBadge type={store.classification} />
                      {store.zone && (
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{store.zone}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dealer Badge */}
              {store.dealerName && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 flex items-center gap-2">
                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className="text-[10px] text-slate-600 font-semibold">
                    Dealer: <strong className="text-slate-800">{store.dealerName}</strong>
                    {store.dealerCity ? ` · ${store.dealerCity}` : ''}
                  </span>
                </div>
              )}

              {/* Store Details */}
              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                {store.gstNumber && (
                  <p className="flex items-center space-x-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>GSTIN: <strong className="text-slate-800">{store.gstNumber}</strong></span>
                  </p>
                )}
                {store.phone && (
                  <p className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{store.phone}</span>
                  </p>
                )}
                <p className="flex items-start space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {store.address}{store.city ? `, ${store.city}` : ''}
                    {store.state ? `, ${store.state}` : ''}
                    {store.pincode ? ` - ${store.pincode}` : ''}
                  </span>
                </p>
                {store.revisitDate && (
                  <p className="flex items-center space-x-2 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100 w-fit text-[10px]">
                    <Calendar className="w-3 h-3 text-rose-500 shrink-0" />
                    <span>Revisit: {new Date(store.revisitDate).toLocaleDateString('en-IN')}</span>
                  </p>
                )}
                <p className="flex items-center space-x-2 border-t border-slate-100 pt-2">
                  <IndianRupee className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>
                    Margin: <strong className="text-rose-700">
                      {store.marginPercent !== null && store.marginPercent !== undefined ? `${store.marginPercent}%` : 'Default (10%)'}
                    </strong>
                  </span>
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => openHistoryModal(store)}
                className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-[11px] transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                View Store History
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Store History Modal */}
      {showHistoryModal && historyStore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-3xl w-full rounded-2xl shadow-2xl overflow-hidden animate-zoom-in my-8 max-h-[88vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-rose-50 shrink-0">
              <div>
                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-0.5">
                  Store Profile &amp; Visit Logs
                </span>
                <h3 className="font-black text-slate-800 text-base">
                  🏪 {historyStore.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <ClassificationBadge type={historyStore.classification} />
                  {historyStore.zone && (
                    <span className="text-[9px] text-slate-500 font-semibold">{historyStore.zone}</span>
                  )}
                  {historyStore.dealerName && (
                    <span className="text-[9px] text-slate-500 font-semibold">· {historyStore.dealerName}</span>
                  )}
                </div>
              </div>
              <button
                onClick={closeHistoryModal}
                className="text-slate-400 hover:text-slate-700 p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 px-6 bg-slate-50/50 shrink-0">
              <button
                onClick={() => setHistoryTab('visits')}
                className={`py-3 px-4 text-xs font-black tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                  historyTab === 'visits' ? 'border-rose-600 text-rose-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Visits ({historyVisits.length})
              </button>
              <button
                onClick={() => setHistoryTab('invoices')}
                className={`py-3 px-4 text-xs font-black tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                  historyTab === 'invoices' ? 'border-rose-600 text-rose-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Invoices ({historyInvoices.length})
              </button>
              <button
                onClick={() => setHistoryTab('info')}
                className={`py-3 px-4 text-xs font-black tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                  historyTab === 'info' ? 'border-rose-600 text-rose-700' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Store Info
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 text-xs">
              {historyLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
                </div>
              ) : historyTab === 'visits' ? (
                historyVisits.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-medium">
                    No visit logs recorded for this store yet.
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
                          <strong className="text-slate-800">Outcome:</strong> {v.outcome || 'No outcome logged'}
                        </p>
                        {(v.paymentsCollected > 0 || v.revisitDate || v.newInvoiceId) && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px]">
                            {v.paymentsCollected > 0 && (
                              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-1.5 rounded-lg font-bold">
                                💰 Collected: ₹{Number(v.paymentsCollected).toLocaleString('en-IN')} ({v.paymentMethod})
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
              ) : historyTab === 'invoices' ? (
                historyInvoices.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-medium">
                    No invoices created for this store yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Totals Summary */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-rose-600 font-bold uppercase">Total Billed</p>
                        <p className="text-lg font-black text-rose-700">
                          ₹{historyInvoices.reduce((s, i) => s + (parseFloat(i.totalAmount) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-amber-600 font-bold uppercase">Discounts</p>
                        <p className="text-lg font-black text-amber-700">
                          ₹{historyInvoices.reduce((s, i) => s + (parseFloat(i.totalDiscount) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                        <p className="text-[10px] text-emerald-600 font-bold uppercase">Invoices</p>
                        <p className="text-lg font-black text-emerald-700">{historyInvoices.length}</p>
                      </div>
                    </div>

                    {historyInvoices.map((inv, i) => (
                      <div key={inv.id || i} className="flex justify-between items-center border border-slate-100 rounded-xl p-3 bg-white hover:bg-slate-50 transition">
                        <div>
                          <strong className="text-slate-800 block text-xs">{inv.invoiceNo}</strong>
                          <span className="text-[10px] text-slate-400">{new Date(inv.createdAt).toLocaleDateString('en-IN')}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase ${
                            inv.status === 'CLOSED' || inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'
                          }`}>
                            {inv.status}
                          </span>
                          {inv.totalDiscount > 0 && (
                            <span className="text-[10px] text-rose-600 font-bold">-₹{inv.totalDiscount}</span>
                          )}
                          <strong className="text-rose-700 text-xs font-black">₹{parseFloat(inv.totalAmount || 0).toFixed(2)}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Store Info Tab */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-4 space-y-1">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Store Name</p>
                      <p className="font-bold text-slate-800">{historyStore.name}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 space-y-1">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Classification</p>
                      <ClassificationBadge type={historyStore.classification} />
                    </div>
                    {historyStore.gstNumber && (
                      <div className="bg-slate-50 rounded-xl p-4 space-y-1">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">GST Number</p>
                        <p className="font-bold text-slate-800 font-mono">{historyStore.gstNumber}</p>
                      </div>
                    )}
                    {historyStore.phone && (
                      <div className="bg-slate-50 rounded-xl p-4 space-y-1">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Phone</p>
                        <p className="font-bold text-slate-800">{historyStore.phone}</p>
                      </div>
                    )}
                    {historyStore.zone && (
                      <div className="bg-slate-50 rounded-xl p-4 space-y-1">
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Zone</p>
                        <p className="font-bold text-slate-800">{historyStore.zone}</p>
                      </div>
                    )}
                    <div className="bg-slate-50 rounded-xl p-4 space-y-1">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Store Margin</p>
                      <p className="font-bold text-rose-700">
                        {historyStore.marginPercent !== null && historyStore.marginPercent !== undefined
                          ? `${historyStore.marginPercent}%`
                          : 'Default (10%)'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-1">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Full Address</p>
                    <p className="font-semibold text-slate-800">
                      {historyStore.address}
                      {historyStore.city ? `, ${historyStore.city}` : ''}
                      {historyStore.state ? `, ${historyStore.state}` : ''}
                      {historyStore.pincode ? ` - ${historyStore.pincode}` : ''}
                    </p>
                  </div>
                  {historyStore.revisitDate && (
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-rose-500 shrink-0" />
                      <div>
                        <p className="text-[10px] text-rose-500 font-black uppercase tracking-wider">Next Scheduled Revisit</p>
                        <p className="font-bold text-rose-800">{new Date(historyStore.revisitDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                  )}
                  {historyStore.dealerName && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
                      <User className="w-5 h-5 text-blue-500 shrink-0" />
                      <div>
                        <p className="text-[10px] text-blue-500 font-black uppercase tracking-wider">Registered By Dealer</p>
                        <p className="font-bold text-blue-800">{historyStore.dealerName}{historyStore.dealerCity ? ` · ${historyStore.dealerCity}` : ''}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50 shrink-0">
              <button
                onClick={closeHistoryModal}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-6 rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
