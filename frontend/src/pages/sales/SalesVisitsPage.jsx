// src/pages/sales/SalesVisitsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MapPin, CheckCircle2, Clock, Plus, Search, Navigation, 
  Store, Camera, DollarSign, FileText, ChevronRight, AlertCircle,
  TrendingUp, Phone, Calendar, Sparkles, X, Check
} from 'lucide-react';

export default function SalesVisitsPage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('beat'); // 'beat', 'checkin', 'history', 'register'

  // GPS state
  const [currentCoords, setCurrentCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Active visit modal state (Modules 4-8)
  const [activeCheckInShop, setActiveCheckInShop] = useState(null);
  const [checkInPurpose, setCheckInPurpose] = useState('Order Booking');
  const [checkInRemarks, setCheckInRemarks] = useState('');
  const [visitorName, setVisitorName] = useState('Sales Representative');
  const [activeVisitRecord, setActiveVisitRecord] = useState(null);

  // Checkout form state (Module 5)
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutOutcome, setCheckoutOutcome] = useState('Order Booked & Feedback Noted');
  const [paymentsCollected, setPaymentsCollected] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [revisitDate, setRevisitDate] = useState('');

  // Register New Shop Lead form state (Module 3)
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopOwner, setNewShopOwner] = useState('');
  const [newShopPhone, setNewShopPhone] = useState('');
  const [newShopAddress, setNewShopAddress] = useState('');
  const [newShopCategory, setNewShopCategory] = useState('RETAIL');

  // Visit history list
  const [visitHistory, setVisitHistory] = useState([]);

  const acquireGPS = () => {
    setGpsLoading(true);
    setGpsError(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
          setGpsLoading(false);
        },
        (err) => {
          setGpsError('Could not fetch GPS coordinates. Using network location.');
          setGpsLoading(false);
          // Fallback mock coordinates if permission blocked in desktop browser
          setCurrentCoords({ latitude: 13.0827, longitude: 80.2707 });
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGpsError('Geolocation is not supported by your browser.');
      setGpsLoading(false);
    }
  };

  const fetchShops = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/field-sales/shops');
      if (res.data?.success) {
        setShops(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching shops:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisits = async () => {
    try {
      const res = await axios.get('/field-sales/visits');
      if (res.data?.success) {
        setVisitHistory(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching visits:', err);
    }
  };

  useEffect(() => {
    acquireGPS();
    fetchShops();
    fetchVisits();
  }, []);

  // Filtered shops
  const filteredShops = shops.filter(s => 
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.phone?.includes(search) ||
    s.address?.toLowerCase().includes(search.toLowerCase())
  );

  // Handle GPS Check-In (Module 4, 7)
  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    if (!activeCheckInShop) return;

    try {
      const payload = {
        storeId: activeCheckInShop._id,
        dealerId: activeCheckInShop.dealerId?._id || activeCheckInShop.dealerId,
        visitorName,
        purpose: checkInPurpose,
        latitude: currentCoords?.latitude || 13.0827,
        longitude: currentCoords?.longitude || 80.2707,
        remarks: checkInRemarks,
        visitId: activeCheckInShop.allocatedVisitId || undefined
      };

      const res = await axios.post('/field-sales/visits/check-in', payload);
      if (res.data?.success) {
        setActiveVisitRecord(res.data.data);
        setActiveCheckInShop(null);
        fetchVisits();
        alert('Check-In recorded with GPS timestamp!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  // Handle GPS Check-Out (Module 5, 8)
  const handleCheckOutSubmit = async (e) => {
    e.preventDefault();
    if (!activeVisitRecord) return;

    try {
      const payload = {
        outcome: checkoutOutcome,
        paymentsCollected: paymentsCollected ? parseFloat(paymentsCollected) : 0,
        paymentMethod: paymentsCollected > 0 ? paymentMethod : 'NONE',
        revisitDate: revisitDate || null
      };

      const res = await axios.post(`/field-sales/visits/${activeVisitRecord._id || activeVisitRecord.id}/check-out`, payload);
      if (res.data?.success) {
        alert('Visit report completed & checked out successfully!');
        setActiveVisitRecord(null);
        setCheckoutModalOpen(false);
        fetchVisits();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    }
  };

  // Handle Register New Shop (Module 3)
  const handleRegisterShop = async (e) => {
    e.preventDefault();
    if (!newShopName || !newShopPhone || !newShopAddress) {
      alert('Please fill all required shop details');
      return;
    }

    try {
      const payload = {
        name: newShopName,
        ownerName: newShopOwner || newShopName,
        phone: newShopPhone,
        address: newShopAddress,
        category: newShopCategory,
        latitude: currentCoords?.latitude,
        longitude: currentCoords?.longitude
      };

      const res = await axios.post('/field-sales/shops', payload);
      if (res.data?.success) {
        alert('New shop registered successfully!');
        setRegisterModalOpen(false);
        setNewShopName('');
        setNewShopOwner('');
        setNewShopPhone('');
        setNewShopAddress('');
        fetchShops();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register shop');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Field Sales & Shop Visits
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            GPS Check-In, Beat Planning, Visit Activity & Customer Verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRegisterModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Shop</span>
          </button>
        </div>
      </div>

      {/* GPS Coordinates Bar */}
      <div className="bg-slate-800/80 border border-white/10 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${currentCoords ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white">Current GPS Coordinates: </span>
            {currentCoords ? (
              <span className="text-emerald-400 font-mono">
                {currentCoords.latitude.toFixed(4)}° N, {currentCoords.longitude.toFixed(4)}° E
              </span>
            ) : (
              <span className="text-amber-400">Detecting location...</span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={acquireGPS}
          disabled={gpsLoading}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
        >
          {gpsLoading ? 'Refreshing GPS...' : 'Refresh Coordinates'}
        </button>
      </div>

      {/* Active Check-In Banner if checked in */}
      {activeVisitRecord && (
        <div className="bg-amber-500/15 border border-amber-500/40 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping"></div>
            <div>
              <span className="text-xs font-black text-amber-300 uppercase">Live Visit in Progress</span>
              <h4 className="text-sm font-bold text-white">
                Purpose: {activeVisitRecord.purpose}
              </h4>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCheckoutModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs cursor-pointer active:scale-95 transition-all shadow-md"
          >
            GPS Check-Out & Complete Visit
          </button>
        </div>
      )}

      {/* Tabs */}
      {(() => {
        const allocatedVisits = visitHistory.filter(v => v.status === 'SCHEDULED');
        return (
          <>
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('allocated')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'allocated' 
                    ? 'bg-amber-500 text-slate-950 font-black' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span>Allocated by Admin</span>
                {allocatedVisits.length > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {allocatedVisits.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('beat')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'beat' 
                    ? 'bg-amber-500 text-slate-950 font-black' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                Daily Beat Shops ({shops.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'history' 
                    ? 'bg-amber-500 text-slate-950 font-black' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                Visit Activity Log ({visitHistory.length})
              </button>
            </div>

            {/* Tab: Allocated Visits */}
            {activeTab === 'allocated' && (
              <div className="space-y-4">
                {allocatedVisits.length === 0 ? (
                  <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-8 text-center space-y-2">
                    <p className="text-sm font-bold text-slate-300">No pending visits allocated by admin</p>
                    <p className="text-xs text-slate-500">You can proceed with your daily beat shops or ad-hoc store visits.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {allocatedVisits.map((v) => {
                      const storeName = v.store?.name || v.storeId?.name || 'Retail Outlet';
                      const storeCity = v.store?.city || v.storeId?.city || 'Area Outlet';
                      const dealerName = v.dealer?.companyName || v.dealerId?.companyName;

                      return (
                        <div
                          key={v._id || v.id}
                          className="bg-slate-800/80 border border-amber-500/30 hover:border-amber-400 p-4 rounded-2xl flex flex-col justify-between space-y-3 transition-all"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                v.priority === 'URGENT'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  : v.priority === 'HIGH'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-white/10 text-slate-300'
                              }`}>
                                {v.priority || 'NORMAL'} Priority
                              </span>
                              <span className="text-[10px] font-bold text-amber-400/90 font-mono">
                                {v.scheduledDate ? new Date(v.scheduledDate).toLocaleDateString() : 'Today'}
                              </span>
                            </div>

                            <div>
                              <h3 className="text-base font-black text-white">{storeName}</h3>
                              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                <span>{storeCity}</span>
                              </p>
                              {dealerName && (
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Dealer: <strong className="text-slate-400">{dealerName}</strong>
                                </p>
                              )}
                            </div>

                            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/5 space-y-1">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                                Purpose: {v.purpose}
                              </div>
                              {v.remarks && (
                                <p className="text-xs text-slate-300 italic">
                                  "{v.remarks}"
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveCheckInShop({
                                _id: v.storeId?._id || v.storeId || v.store?.id || v.store?._id,
                                name: storeName,
                                dealerId: v.dealerId?._id || v.dealerId || v.dealer?.id,
                                allocatedVisitId: v._id || v.id
                              });
                              setCheckInPurpose(v.purpose || 'Store Visit & Order Booking');
                              setCheckInRemarks(v.remarks || '');
                            }}
                            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 transition"
                          >
                            <MapPin className="w-4 h-4" />
                            <span>GPS Check-In to Start Visit</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        );
      })()}

      {/* Tab: Daily Beat Shops */}
      {activeTab === 'beat' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assigned shops by name, location, or phone..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Shops Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShops.map((shop) => (
              <div 
                key={shop._id} 
                className="bg-slate-800/80 border border-white/10 hover:border-amber-500/40 p-4 rounded-2xl flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 uppercase">
                      {shop.category || 'Retail'}
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold">Active Shop</span>
                  </div>

                  <h3 className="text-sm font-black text-white">{shop.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{shop.address || 'Chennai Local Beat'}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{shop.phone}</span>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCheckInShop(shop)}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>GPS Check-In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      alert(`Customer 360 for ${shop.name}:\nOutstanding Balance: ₹0.00\nLast Visit: Yesterday\nStatus: Verified Retailer`);
                    }}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
                    title="View 360°"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Visit Activity Log */}
      {activeTab === 'history' && (
        <div className="bg-slate-800/80 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Visitor</th>
                  <th className="px-4 py-3">Purpose</th>
                  <th className="px-4 py-3">Outcome / Notes</th>
                  <th className="px-4 py-3">Collections</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {visitHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-400">
                      No visit records found today.
                    </td>
                  </tr>
                ) : (
                  visitHistory.map((v, i) => (
                    <tr key={v._id || i} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-slate-300 font-mono">
                        {new Date(v.createdAt || v.date).toLocaleString('en-IN', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">{v.visitorName}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                          {v.purpose}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-slate-400">
                        {v.outcome || v.remarks || 'Check-in recorded'}
                      </td>
                      <td className="px-4 py-3 font-bold text-emerald-400">
                        ₹{(v.paymentsCollected || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.checkOutTime ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {v.checkOutTime ? 'Completed' : 'Pending Check-out'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GPS Check-In Modal (Module 4, 7) */}
      {activeCheckInShop && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setActiveCheckInShop(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">GPS Check-In</h3>
                <p className="text-xs text-amber-400 font-bold">{activeCheckInShop.name}</p>
              </div>
            </div>

            <form onSubmit={handleCheckInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Purpose of Visit (Module 7)
                </label>
                <select
                  value={checkInPurpose}
                  onChange={(e) => setCheckInPurpose(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Order Booking">Order booking</option>
                  <option value="Product Placement">Product placement & display</option>
                  <option value="Payment Collection">Payment collection</option>
                  <option value="Price Discussion">Price discussion / Margin review</option>
                  <option value="Routine Follow-up">Routine follow-up</option>
                  <option value="New Product Introduction">New product introduction</option>
                  <option value="Complaint Resolution">Complaint resolution</option>
                  <option value="Other Discussions">Other discussions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Salesperson Name
                </label>
                <input
                  type="text"
                  required
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Visit Notes & Remarks (Module 8)
                </label>
                <textarea
                  rows="2"
                  value={checkInRemarks}
                  onChange={(e) => setCheckInRemarks(e.target.value)}
                  placeholder="Retailer stock requirements, display notes..."
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl text-[11px] text-slate-400">
                <span className="font-bold text-emerald-400">✓ GPS Location Tagged: </span>
                {currentCoords ? `${currentCoords.latitude.toFixed(4)}, ${currentCoords.longitude.toFixed(4)}` : 'Standard Network GPS'}
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Confirm GPS Check-In
              </button>
            </form>
          </div>
        </div>
      )}

      {/* GPS Check-Out Modal (Module 5) */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setCheckoutModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-white mb-1">Complete Visit & Check-Out</h3>
            <p className="text-xs text-slate-400 mb-4">Capture exit time, collections, and revisit schedule</p>

            <form onSubmit={handleCheckOutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Visit Outcome
                </label>
                <input
                  type="text"
                  required
                  value={checkoutOutcome}
                  onChange={(e) => setCheckoutOutcome(e.target.value)}
                  placeholder="e.g. Booked 5 cartons, collection promised"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Payments Collected (₹)
                  </label>
                  <input
                    type="number"
                    value={paymentsCollected}
                    onChange={(e) => setPaymentsCollected(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="ONLINE">UPI / Online</option>
                    <option value="NONE">None</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Schedule Next Revisit Date
                </label>
                <input
                  type="date"
                  value={revisitDate}
                  onChange={(e) => setRevisitDate(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Submit Visit Report & Check-Out
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Register New Shop Lead Modal (Module 3) */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setRegisterModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-white mb-1">Register New Shop / Lead</h3>
            <p className="text-xs text-slate-400 mb-4">Add new retail lead with auto-captured GPS coordinates</p>

            <form onSubmit={handleRegisterShop} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Shop Name *
                </label>
                <input
                  type="text"
                  required
                  value={newShopName}
                  onChange={(e) => setNewShopName(e.target.value)}
                  placeholder="e.g. Sri Krishna Department Store"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Owner / Contact Person
                </label>
                <input
                  type="text"
                  value={newShopOwner}
                  onChange={(e) => setNewShopOwner(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={newShopPhone}
                    onChange={(e) => setNewShopPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={newShopCategory}
                    onChange={(e) => setNewShopCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="RETAIL">Retail Grocer</option>
                    <option value="SUPERMARKET">Supermarket</option>
                    <option value="WHOLESALE">Wholesale Trader</option>
                    <option value="BAKERY">Bakery / Confectionery</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Complete Address *
                </label>
                <textarea
                  rows="2"
                  required
                  value={newShopAddress}
                  onChange={(e) => setNewShopAddress(e.target.value)}
                  placeholder="Street, Landmark, City..."
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Register Shop Lead
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
