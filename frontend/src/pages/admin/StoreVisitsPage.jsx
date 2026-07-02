// src/pages/admin/StoreVisitsPage.jsx
import React, { useState, useEffect } from 'react';
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
  FileEdit
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function StoreVisitsPage() {
  const { user } = useAuthStore();
  const [dealers, setDealers] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Selection states
  const [selectedDealerId, setSelectedDealerId] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  
  // Visit Status
  const [activeVisit, setActiveVisit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState('pending'); // pending, adjust, checkout

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

  useEffect(() => {
    fetchDealers();
    fetchProducts();
    // Check if there is an active visit stored in localStorage
    const savedVisit = localStorage.getItem('mansara_active_visit');
    if (savedVisit) {
      const parsed = JSON.parse(savedVisit);
      setActiveVisit(parsed);
      setSelectedStoreId(parsed.storeId);
      setSelectedDealerId(parsed.dealerId);
    }
  }, []);

  useEffect(() => {
    if (selectedDealerId) {
      fetchStores(selectedDealerId);
    } else {
      setStores([]);
    }
  }, [selectedDealerId]);

  useEffect(() => {
    if (activeVisit) {
      fetchOpenInvoices();
    } else {
      setOpenInvoices([]);
    }
  }, [activeVisit]);

  const fetchDealers = async () => {
    try {
      const res = await axios.get('/dealers');
      setDealers(res.data.data.filter(d => d.approvalStatus === 'APPROVED'));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStores = async (dealerId) => {
    try {
      const res = await axios.get(`/stores?dealerId=${dealerId}`);
      setStores(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/products');
      setProducts(res.data.data.filter(p => p.isActive));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOpenInvoices = async () => {
    if (!selectedStoreId) return;
    try {
      setInvoicesLoading(true);
      const res = await axios.get(`/billing?storeId=${selectedStoreId}&status=OPEN`);
      setOpenInvoices(res.data.data);
      // Reset inputs
      setDeliveryInputs({});
    } catch (err) {
      console.error(err);
    } finally {
      setInvoicesLoading(false);
    }
  };

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
          
          const res = await axios.post('/crm/visits/check-in', {
            dealerId: selectedDealerId,
            storeId: selectedStoreId,
            visitorName: user?.name || 'Sales Representative',
            purpose: 'Store Visit & Inventory Fulfillment Check',
            latitude,
            longitude
          });

          const visitData = res.data.data;
          setActiveVisit(visitData);
          localStorage.setItem('mansara_active_visit', JSON.stringify(visitData));
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

  // Delivery Input Handlers
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

  const handleConfirmFulfillment = async (invoiceId) => {
    const inputs = deliveryInputs[invoiceId] || {};
    const itemsToFulfill = Object.entries(inputs)
      .map(([productId, quantity]) => ({ productId, quantity }))
      .filter(item => item.quantity > 0);

    if (itemsToFulfill.length === 0) {
      alert('Please enter delivery quantities greater than 0.');
      return;
    }

    try {
      setLoading(true);
      await axios.post(`/billing/${invoiceId}/fulfill`, { items: itemsToFulfill });
      alert('Delivery recorded successfully!');
      fetchOpenInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Fulfillment request failed');
    } finally {
      setLoading(false);
    }
  };

  // Bill Adjustments Handlers
  const startAdjusting = (invoice) => {
    setAdjustingInvoice(invoice);
    setAdjustedItems(invoice.items.map(item => ({
      productId: item.productId,
      productName: item.product?.name || 'Product',
      quantity: item.quantity,
      marginPct: item.marginPct,
      unit: item.unit
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
      await axios.put(`/billing/${adjustingInvoice.id}/adjust`, {
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

  // Checkout Visit
  const handleCheckOut = async () => {
    if (!checkoutOutcome.trim()) {
      alert('Please enter outcome notes of your visit.');
      return;
    }

    // Verify if there are still pending items
    const hasPending = openInvoices.some(inv => 
      inv.items.some(item => (item.fulfilledQuantity || 0) < item.quantity)
    );

    if (hasPending && !window.confirm('Some items from previous bills are still pending/unfulfilled. Do you still want to checkout of this visit?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.post(`/crm/visits/${activeVisit.id}/check-out`, {
        outcome: checkoutOutcome
      });

      alert('Checked out successfully!');
      setActiveVisit(null);
      setCheckoutOutcome('');
      localStorage.removeItem('mansara_active_visit');
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  // UI Helpers
  const getVisitedStoreName = () => {
    const storeObj = stores.find(s => s.id === selectedStoreId);
    return storeObj ? storeObj.name : 'Selected Store';
  };

  const getDealerName = () => {
    const dealerObj = dealers.find(d => d.id === selectedDealerId);
    return dealerObj ? dealerObj.companyName : 'Selected Dealer';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Truck className="w-7 h-7 text-rose-500" />
          Field Sales & Store Visits
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Verify visits with GPS Check-Ins, fulfill pending deliveries, and adjust store bills in real-time.
        </p>
      </div>

      {/* Geolocation/Check-in Status Panel */}
      {!activeVisit ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-4 flex-1 w-full">
            <h3 className="font-bold text-slate-800 text-base">Select Target Outlet</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Dealer</label>
                <select
                  value={selectedDealerId}
                  onChange={(e) => { setSelectedDealerId(e.target.value); setSelectedStoreId(''); }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="">Select B2B Dealer...</option>
                  {dealers.map(d => (
                    <option key={d.id} value={d.id}>{d.companyName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Store / Outlet</label>
                <select
                  value={selectedStoreId}
                  disabled={!selectedDealerId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">Select Store Outlet...</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {locationError && (
              <div className="bg-red-50 text-red-700 p-3.5 rounded-xl border border-red-100 flex items-center gap-2.5 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{locationError}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleCheckIn}
            disabled={locationLoading || !selectedStoreId}
            className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm transition active:scale-95 whitespace-nowrap self-stretch md:self-end"
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
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-10">
            <MapPin className="w-40 h-40" />
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
                <span className="text-[10px] uppercase font-black bg-white/20 px-2 py-0.5 rounded tracking-wider">Active Store Visit</span>
              </div>
              <h2 className="text-xl font-black">{getVisitedStoreName()}</h2>
              <p className="text-xs text-white/80 font-medium">Dealer: {getDealerName()}</p>
              
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-white/90">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Checked In: {new Date(activeVisit.checkInTime).toLocaleTimeString()}</span>
                <span className="flex items-center gap-1.5"><Map className="w-3.5 h-3.5" /> Coordinates: {activeVisit.latitude?.toFixed(4)}, {activeVisit.longitude?.toFixed(4)}</span>
              </div>
            </div>

            <button
              onClick={() => { setActiveTab('checkout'); }}
              className="bg-white text-rose-600 hover:bg-rose-50 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95"
            >
              Finish Visit & Checkout
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {activeVisit && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation Tabs (Left Sidebar) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm h-fit space-y-1">
            <button
              onClick={() => { setAdjustingInvoice(null); setActiveTab('pending'); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${
                activeTab === 'pending'
                  ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-100/50'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Truck className="w-4.5 h-4.5" />
              Pending Deliveries
            </button>

            <button
              onClick={() => {
                if (openInvoices.length > 0) {
                  startAdjusting(openInvoices[0]);
                } else {
                  alert('No open invoices found for this store to adjust.');
                }
              }}
              disabled={openInvoices.length === 0}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${
                activeTab === 'adjust'
                  ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-100/50'
                  : 'text-slate-600 hover:bg-slate-50 disabled:opacity-50'
              }`}
            >
              <FileEdit className="w-4.5 h-4.5" />
              Adjust Bills / Requests
            </button>

            <button
              onClick={() => setActiveTab('checkout')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${
                activeTab === 'checkout'
                  ? 'bg-rose-50 text-rose-700 shadow-sm border border-rose-100/50'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckCircle className="w-4.5 h-4.5" />
              Check-Out Notes
            </button>
          </div>

          {/* Tab Panels (Right Side) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Panel 1: Pending Deliveries */}
            {activeTab === 'pending' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="font-black text-slate-800 text-lg">Inventory Deliveries & Fulfillments</h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Select open bills from previous orders and record the quantities delivered today.
                  </p>
                </div>

                {invoicesLoading ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                    <p className="text-slate-500 text-xs mt-2">Fetching open bills...</p>
                  </div>
                ) : openInvoices.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold">All bills fully fulfilled! No open items pending.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {openInvoices.map((inv) => {
                      const hasOpenItems = inv.items.some(i => (i.fulfilledQuantity || 0) < i.quantity);
                      if (!hasOpenItems) return null;

                      return (
                        <div key={inv.id} className="border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm bg-slate-50/30">
                          <div className="flex justify-between items-start flex-wrap gap-2">
                            <div>
                              <span className="bg-slate-200 text-slate-800 text-[10px] font-black px-2 py-0.5 rounded tracking-wide uppercase">
                                Invoice: {inv.invoiceNo}
                              </span>
                              <div className="text-slate-500 text-xs mt-1">
                                Order Date: {new Date(inv.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-rose-500 font-extrabold text-sm block">₹{inv.totalAmount?.toLocaleString()}</span>
                              <button
                                onClick={() => startAdjusting(inv)}
                                className="text-[10px] font-bold text-rose-500 hover:text-rose-600 underline mt-1 block"
                              >
                                Modify Items on this Invoice
                              </button>
                            </div>
                          </div>

                          {/* Items Table */}
                          <div className="border border-slate-100 rounded-lg bg-white overflow-hidden text-xs">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                                  <th className="p-3">Product Name</th>
                                  <th className="p-3 text-center">Billed Qty</th>
                                  <th className="p-3 text-center">Prev Fulfilled</th>
                                  <th className="p-3 text-center text-rose-500 font-bold">Pending Qty</th>
                                  <th className="p-3 text-center w-28">Deliver Today</th>
                                </tr>
                              </thead>
                              <tbody>
                                {inv.items.map((item) => {
                                  const pendingQty = item.quantity - (item.fulfilledQuantity || 0);
                                  if (pendingQty <= 0) return null;

                                  return (
                                    <tr key={item.productId} className="border-b border-slate-50 hover:bg-slate-50/40">
                                      <td className="p-3 font-semibold text-slate-700">{item.product?.name}</td>
                                      <td className="p-3 text-center text-slate-500">{item.quantity}</td>
                                      <td className="p-3 text-center text-slate-500">{item.fulfilledQuantity || 0}</td>
                                      <td className="p-3 text-center text-rose-500 font-bold">{pendingQty}</td>
                                      <td className="p-3 text-center">
                                        <input
                                          type="number"
                                          min="0"
                                          max={pendingQty}
                                          value={deliveryInputs[inv.id]?.[item.productId] || ''}
                                          onChange={(e) => handleDeliveryQtyChange(inv.id, item.productId, e.target.value)}
                                          placeholder="0"
                                          className="w-16 px-2 py-1 text-center border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                                        />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          <div className="text-right">
                            <button
                              onClick={() => handleConfirmFulfillment(inv.id)}
                              disabled={loading}
                              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
                            >
                              Confirm Delivered Quantities
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Panel 2: Live Adjustments / Request revisions */}
            {activeTab === 'adjust' && adjustingInvoice && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <h3 className="font-black text-slate-800 text-lg">Adjust Invoice: {adjustingInvoice.invoiceNo}</h3>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Add/remove products or edit billed quantities directly on the store's open invoice.
                    </p>
                  </div>
                  <button 
                    onClick={() => { setAdjustingInvoice(null); setAdjustedItems([]); setActiveTab('pending'); }}
                    className="text-xs text-rose-500 font-bold hover:underline"
                  >
                    Back to Deliveries
                  </button>
                </div>

                {/* Add product to adjustment */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Add New Product Request</h4>
                  <div className="flex gap-3">
                    <select
                      id="adj-prod-select"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          addProductToAdjustment(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
                    >
                      <option value="">Choose product to append...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (MRP: ₹{p.mrp})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Adjusted items table */}
                <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                        <th className="p-3">Product Name</th>
                        <th className="p-3 text-center">Billed Quantity</th>
                        <th className="p-3 text-center">Margin %</th>
                        <th className="p-3 text-center w-24">Unit</th>
                        <th className="p-3 text-center">Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adjustedItems.map((item) => (
                        <tr key={item.productId} className="border-b border-slate-50 hover:bg-slate-50/40">
                          <td className="p-3 font-semibold text-slate-700">{item.productName}</td>
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                              <button 
                                onClick={() => updateAdjustedQty(item.productId, -1)}
                                className="p-1 hover:bg-slate-100 text-slate-600 rounded"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-bold w-4 text-center">{item.quantity}</span>
                              <button 
                                onClick={() => updateAdjustedQty(item.productId, 1)}
                                className="p-1 hover:bg-slate-100 text-slate-600 rounded"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <input 
                              type="number"
                              value={item.marginPct}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setAdjustedItems(prev => prev.map(i => i.productId === item.productId ? { ...i, marginPct: val } : i));
                              }}
                              className="w-12 px-1.5 py-1 border border-slate-200 rounded text-center font-bold text-xs"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <select
                              value={item.unit}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAdjustedItems(prev => prev.map(i => i.productId === item.productId ? { ...i, unit: val } : i));
                              }}
                              className="px-2 py-1 border border-slate-200 rounded bg-white text-xs"
                            >
                              <option value="PCS">PCS</option>
                              <option value="CTN">CTN (Cartons)</option>
                            </select>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => removeProductFromAdjustment(item.productId)}
                              className="text-rose-500 hover:text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => { setAdjustingInvoice(null); setAdjustedItems([]); setActiveTab('pending'); }}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAdjustment}
                    disabled={loading}
                    className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs py-2 px-5 rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Invoice Changes
                  </button>
                </div>
              </div>
            )}

            {/* Panel 3: Checkout notes */}
            {activeTab === 'checkout' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="font-black text-slate-800 text-lg">Check-Out of Store Visit</h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Mandatory visit wrap-up. Input the results, outcomes, or notes from today's physical check-in.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Visit Outcome Notes</label>
                    <textarea
                      rows="4"
                      value={checkoutOutcome}
                      onChange={(e) => setCheckoutOutcome(e.target.value)}
                      placeholder="e.g. Delivered 5 pieces of Porridge mix. Store requested 10 more boxes next week. Stall operator is doing well, customer traffic is high."
                      required
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                    ></textarea>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-slate-100">
                    <button
                      onClick={handleCheckOut}
                      disabled={loading}
                      className="bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Verify Coordinates & Check-Out
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
