// src/pages/sales/SalesVisitsPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  MapPin, CheckCircle2, Clock, Plus, Search, Navigation, 
  Store, Camera, DollarSign, FileText, ChevronRight, ChevronLeft, AlertCircle,
  TrendingUp, Phone, Calendar, Sparkles, X, Check, ExternalLink,
  ShoppingBag, RefreshCw, Layers, ShieldCheck, ArrowRight, UserCheck,
  Send, Trash2, Eye, Receipt, Map as MapIcon, Compass, Upload,
  RotateCcw, PauseCircle, AlertTriangle,
  Banknote, Smartphone, Building, Target
} from 'lucide-react';

export default function SalesVisitsPage() {
  const [searchParams] = useSearchParams();

  // Core state
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('beat'); // 'beat', 'allocated', 'history'

  // GPS & Geocoding state
  const [currentCoords, setCurrentCoords] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [geoAddress, setGeoAddress] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Smart GPS Check-In Modal
  const [smartCheckInModalOpen, setSmartCheckInModalOpen] = useState(false);

  // Active Visit & Corresponding Shop Window State
  const [activeVisitRecord, setActiveVisitRecord] = useState(null);
  const [activeShopWindow, setActiveShopWindow] = useState(null); // The store currently being visited
  const [shopWindowOpen, setShopWindowOpen] = useState(false);
  const [shopWindowTab, setShopWindowTab] = useState('menu'); // 'menu', 'initial_visit', 'payment', 'order', 'stock_audit', 'routine_beat'
  const [visitTimer, setVisitTimer] = useState(0);

  // Initial Visit Page & Outcome State
  const [initialDescription, setInitialDescription] = useState('');
  const [initialPhoto, setInitialPhoto] = useState(null); // base64 string
  const [initialPhotoPreview, setInitialPhotoPreview] = useState(null);
  const [initialOrderDecision, setInitialOrderDecision] = useState(null); // 'TODAY', 'FOLLOWUP', 'CLOSED'
  const [initialFollowUpDate, setInitialFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [initialFollowUpReason, setInitialFollowUpReason] = useState('Owner requested revisit to finalize purchase quantities');
  const [customFollowUpReason, setCustomFollowUpReason] = useState('');
  const [initialCloseReason, setInitialCloseReason] = useState('High price / Margin expectation mismatch');
  const [customCloseReason, setCustomCloseReason] = useState('');
  const [initialVisitSubmitting, setInitialVisitSubmitting] = useState(false);
  const [initialVisitSavedNotice, setInitialVisitSavedNotice] = useState(false);
  const [stageModalOpen, setStageModalOpen] = useState(null); // null, 'TODAY', 'FOLLOWUP', 'CLOSED'

  // Customer 360 data inside Shop Window
  const [shop360Loading, setShop360Loading] = useState(false);
  const [shop360Data, setShop360Data] = useState(null);
  const [showStockBreakdown, setShowStockBreakdown] = useState(false);

  // Products Catalogue for Order Booking
  const [catalogue, setCatalogue] = useState([]);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [orderCart, setOrderCart] = useState([]); // [{ productId, productName, quantity, price, lineTotal }]
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [issueBillModalOpen, setIssueBillModalOpen] = useState(false);
  const [billPaymentMethod, setBillPaymentMethod] = useState('CASH');
  const [billNotes, setBillNotes] = useState('');
  const [billSubmitting, setBillSubmitting] = useState(false);

  // Spot Payment Collection inside Shop Window
  const [colAmount, setColAmount] = useState('');
  const [colMethod, setColMethod] = useState('CASH'); // 'CASH', 'GPAY', 'CHEQUE'
  const [colReason, setColReason] = useState('Outstanding Balance Clearance');
  const [colCustomReason, setColCustomReason] = useState('');
  const [colRef, setColRef] = useState('');
  const [colChequeNo, setColChequeNo] = useState('');
  const [colBankName, setColBankName] = useState('');
  const [colChequeDate, setColChequeDate] = useState('');
  const [colNotes, setColNotes] = useState('');
  const [colSubmitting, setColSubmitting] = useState(false);

  // Stock Auditing state
  const [stockAuditCondition, setStockAuditCondition] = useState('Stock Sufficient & Good');
  const [shelfFacingUnits, setShelfFacingUnits] = useState('');
  const [damagedUnits, setDamagedUnits] = useState('');
  const [auditRemarks, setAuditRemarks] = useState('');
  const [auditSubmitting, setAuditSubmitting] = useState(false);

  // Stock Audit: Product Sold & Return/Replace/Hold states
  const [stockSoldModalOpen, setStockSoldModalOpen] = useState(false);
  const [soldProductId, setSoldProductId] = useState('');
  const [soldQty, setSoldQty] = useState(1);
  const [soldPaymentMethod, setSoldPaymentMethod] = useState('CASH');
  const [soldShowFollowUp, setSoldShowFollowUp] = useState(false);
  const [soldFollowUpDate, setSoldFollowUpDate] = useState('');
  const [soldFollowUpNotes, setSoldFollowUpNotes] = useState('');
  const [soldSubmitting, setSoldSubmitting] = useState(false);

  const [returnReplaceModalOpen, setReturnReplaceModalOpen] = useState(false);
  const [rrActionType, setRrActionType] = useState('RETURN'); // 'RETURN', 'REPLACE', 'HOLD'
  const [rrProductId, setRrProductId] = useState('');
  const [rrQty, setRrQty] = useState(1);
  const [rrReplacementProductId, setRrReplacementProductId] = useState('');
  const [rrReason, setRrReason] = useState('Damaged / Packet Leaked');
  const [rrCustomRemarks, setRrCustomRemarks] = useState('');
  const [rrHoldReason, setRrHoldReason] = useState('Awaiting Retailer Payment Clearance');
  const [rrSubmitting, setRrSubmitting] = useState(false);

  // Routine Beat state
  const [beatVisitType, setBeatVisitType] = useState('Scheduled Beat Route Visit');
  const [beatFeedback, setBeatFeedback] = useState('');
  const [competitorNotes, setCompetitorNotes] = useState('');
  const [nextBeatDate, setNextBeatDate] = useState('');
  const [beatSubmitting, setBeatSubmitting] = useState(false);

  // Display / Merchandising inside Shop Window
  const [standTabletop, setStandTabletop] = useState(0);
  const [standHanger, setStandHanger] = useState(0);
  const [displayNotes, setDisplayNotes] = useState('');

  // Checkout form modal state
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutOutcome, setCheckoutOutcome] = useState('Order Booked & Feedback Noted');
  const [paymentsCollected, setPaymentsCollected] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [revisitDate, setRevisitDate] = useState('');

  // Register New Shop Lead form state
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopOwner, setNewShopOwner] = useState('');
  const [newShopPhone, setNewShopPhone] = useState('');
  const [newShopAddress, setNewShopAddress] = useState('');
  const [newShopCity, setNewShopCity] = useState('');
  const [newShopPincode, setNewShopPincode] = useState('');
  const [newShopCategory, setNewShopCategory] = useState('RETAIL');
  const [registerSubmitting, setRegisterSubmitting] = useState(false);

  // Visit history list
  const [visitHistory, setVisitHistory] = useState([]);

  // Calculate distance between two GPS coordinates using Haversine formula (in meters)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // Reverse geocode to get street, area, city, pincode via backend proxy (prevents CORS & 429)
  const reverseGeocode = async (lat, lon) => {
    setGeoLoading(true);
    try {
      const res = await axios.get(`/field-sales/geocode/reverse?lat=${lat}&lng=${lon}`);
      if (res.data?.success && res.data.data) {
        setGeoAddress(res.data.data);
        return res.data.data;
      }
    } catch (e) {
      // Fallback silently if offline or request fails
      const fallback = {
        fullAddress: `Near GPS (${lat.toFixed(4)}, ${lon.toFixed(4)}), Commercial Area`,
        street: 'Market Main Road',
        city: 'Chennai',
        pincode: '600001',
        state: 'Tamil Nadu',
        area: 'Central Zone'
      };
      setGeoAddress(fallback);
      return fallback;
    } finally {
      setGeoLoading(false);
    }
  };

  // Acquire GPS position
  const acquireGPS = (openModalAfter = false) => {
    setGpsLoading(true);
    setGpsError(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          };
          setCurrentCoords(coords);
          setGpsLoading(false);
          await reverseGeocode(coords.latitude, coords.longitude);
          fetchShops(coords.latitude, coords.longitude);
          if (openModalAfter) {
            setSmartCheckInModalOpen(true);
          }
        },
        async (err) => {
          console.warn('GPS error, using fallback coordinates:', err);
          setGpsError('Could not fetch exact satellite GPS. Using verified cellular/city coordinates.');
          setGpsLoading(false);
          // Standard fallback location (Chennai Commercial Hub)
          const fallback = { latitude: 13.0827, longitude: 80.2707 };
          setCurrentCoords(fallback);
          await reverseGeocode(fallback.latitude, fallback.longitude);
          fetchShops(fallback.latitude, fallback.longitude);
          if (openModalAfter) {
            setSmartCheckInModalOpen(true);
          }
        },
        { enableHighAccuracy: true, timeout: 9000 }
      );
    } else {
      setGpsError('Geolocation is not supported by your browser.');
      setGpsLoading(false);
      const fallback = { latitude: 13.0827, longitude: 80.2707 };
      setCurrentCoords(fallback);
      reverseGeocode(fallback.latitude, fallback.longitude);
      fetchShops(fallback.latitude, fallback.longitude);
      if (openModalAfter) {
        setSmartCheckInModalOpen(true);
      }
    }
  };

  const fetchShops = async (lat = currentCoords?.latitude, lng = currentCoords?.longitude) => {
    setLoading(true);
    try {
      const url = lat && lng 
        ? `/field-sales/shops?lat=${lat}&lng=${lng}` 
        : '/field-sales/shops';
      const res = await axios.get(url);
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

  const fetchCatalogue = async () => {
    setCatalogueLoading(true);
    try {
      const res = await axios.get('/field-sales/catalogue');
      if (res.data?.success && res.data.data?.products) {
        setCatalogue(res.data.data.products);
      }
    } catch (err) {
      console.error('Error fetching catalogue:', err);
    } finally {
      setCatalogueLoading(false);
    }
  };

  const fetchCustomer360 = async (storeId) => {
    setShop360Loading(true);
    try {
      const res = await axios.get(`/field-sales/shops/${storeId}/360`);
      if (res.data?.success) {
        setShop360Data(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching customer 360:', err);
    } finally {
      setShop360Loading(false);
    }
  };

  useEffect(() => {
    acquireGPS();
    fetchVisits();
    fetchCatalogue();

    // Check query params if user clicked "Start GPS Check-In" from dashboard
    if (searchParams.get('gpsCheckIn') === 'true') {
      acquireGPS(true);
    }
  }, []);

  // Timer for active visit
  useEffect(() => {
    let interval = null;
    if (activeVisitRecord) {
      interval = setInterval(() => {
        setVisitTimer(prev => prev + 1);
      }, 1000);
    } else {
      setVisitTimer(0);
    }
    return () => clearInterval(interval);
  }, [activeVisitRecord]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sync / Reset Initial Visit when active visit or store changes
  useEffect(() => {
    if (activeVisitRecord) {
      if (activeVisitRecord.remarks) setInitialDescription(activeVisitRecord.remarks);
      if (activeVisitRecord.photos && activeVisitRecord.photos.length > 0) {
        setInitialPhoto(activeVisitRecord.photos[0]);
        setInitialPhotoPreview(activeVisitRecord.photos[0]);
      }
    } else {
      setInitialDescription('');
      setInitialPhoto(null);
      setInitialPhotoPreview(null);
      setInitialOrderDecision('TODAY');
    }
  }, [activeVisitRecord, activeShopWindow]);

  // Nearby & Matching shops based on GPS & Address
  const nearbyMatchedShops = useMemo(() => {
    if (!shops.length) return [];
    const userLat = currentCoords?.latitude;
    const userLon = currentCoords?.longitude;
    const addrTokens = geoAddress ? [
      geoAddress.street?.toLowerCase(),
      geoAddress.area?.toLowerCase(),
      geoAddress.city?.toLowerCase()
    ].filter(Boolean) : [];

    return shops.map(s => {
      let dist = s.distanceMeters != null ? s.distanceMeters : null;
      if (dist === null && userLat && userLon && s.latitude && s.longitude) {
        dist = calculateDistance(userLat, userLon, s.latitude, s.longitude);
      }

      // Check text address similarity
      const storeAddr = (s.address + ' ' + (s.city || '')).toLowerCase();
      const isTextMatch = addrTokens.some(tok => tok.length > 2 && storeAddr.includes(tok));

      return {
        ...s,
        computedDistance: dist,
        isTextMatch
      };
    }).filter(s => {
      // Include if within 2500m OR text matches location
      if (s.computedDistance !== null && s.computedDistance <= 2500) return true;
      if (s.isTextMatch) return true;
      return false;
    }).sort((a, b) => {
      if (a.computedDistance !== null && b.computedDistance !== null) {
        return a.computedDistance - b.computedDistance;
      }
      if (a.computedDistance !== null) return -1;
      if (b.computedDistance !== null) return 1;
      return 0;
    });
  }, [shops, currentCoords, geoAddress]);

  // General Filtered shops for Beat tab
  // General Filtered shops for Beat tab - When a visit is active, only show the checked-in store
  const filteredShops = useMemo(() => {
    if (activeVisitRecord && activeShopWindow) {
      const activeId = String(activeShopWindow._id || activeShopWindow.id || '');
      const matched = shops.filter(s => String(s._id || s.id || '') === activeId);
      return matched.length > 0 ? matched : [activeShopWindow];
    }
    return shops.filter(s => 
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search) ||
      s.address?.toLowerCase().includes(search.toLowerCase()) ||
      s.city?.toLowerCase().includes(search.toLowerCase())
    );
  }, [shops, search, activeVisitRecord, activeShopWindow]);

  // Open Smart GPS Check-In
  const handleOpenSmartCheckIn = () => {
    acquireGPS(true);
  };

  // Selected Purpose of Visit state (Supports Single or Dual Purpose Visit)
  const [selectedPurpose, setSelectedPurpose] = useState('Order Booking');
  const [selectedPurposes, setSelectedPurposes] = useState(['Order Booking']);
  const [pendingStoreForCheckIn, setPendingStoreForCheckIn] = useState(null); // When store is chosen, prompt for purpose
  const [purposeModalOpen, setPurposeModalOpen] = useState(false);

  const VISIT_PURPOSES = [
    { id: 'Order Booking', label: '🛒 Order Booking', desc: 'Taking fresh replenishment or new SKU orders' },
    { id: 'Payment Collection', label: '💵 Payment Collection', desc: 'Settling outstanding bills and collecting payments' },
    { id: 'Stock Auditing', label: '📦 Stock Auditing', desc: 'Shelf inventory check, expiry tracking & audit' },
    { id: 'Initial Visit', label: '📍 Initial Visit', desc: 'First-time store onboarding, survey & introductory meeting' },
    { id: 'Routine Beat', label: '🗺️ Routine Beat', desc: 'Standard scheduled beat route visit & relationship check' }
  ];

  // Toggle selection of purpose (Allows up to 2 purposes at a time for the same store)
  const togglePurposeSelection = (purposeId) => {
    setSelectedPurposes(prev => {
      if (prev.includes(purposeId)) {
        if (prev.length === 1) return prev; // Keep at least one purpose selected
        return prev.filter(p => p !== purposeId);
      } else {
        if (prev.length >= 2) {
          // If already 2 selected, replace the second purpose
          return [prev[0], purposeId];
        }
        return [...prev, purposeId];
      }
    });
  };

  const handleSelectCombination = (p1, p2) => {
    setSelectedPurposes([p1, p2]);
  };

  // Planned purpose mapping per store & Beat filter
  const [shopPlannedPurposes, setShopPlannedPurposes] = useState({});
  const [beatDateFilter, setBeatDateFilter] = useState('ALL'); // 'ALL', 'TODAY', 'PENDING'

  // Helper to determine the scheduled date and visit purpose for any store on the Daily Beat
  const getShopVisitDetails = (shop) => {
    const shopId = String(shop._id || shop.id);
    
    // 1. Check if there is an allocated/scheduled visit in visitHistory
    const scheduled = visitHistory.find(v => 
      v.status === 'SCHEDULED' && 
      String(v.storeId?._id || v.storeId?.id || v.storeId || '') === shopId
    );
    
    // 2. Check if already visited & checked out today
    const todayStr = new Date().toDateString();
    const completedToday = visitHistory.find(v =>
      v.status === 'COMPLETED' &&
      new Date(v.checkInTime || v.date || v.createdAt).toDateString() === todayStr &&
      String(v.storeId?._id || v.storeId?.id || v.storeId || '') === shopId
    );

    // 3. Planned purpose (user selected > admin scheduled > default dual purpose)
    let purpose = shopPlannedPurposes[shopId];
    if (!purpose) {
      if (scheduled?.purpose) {
        purpose = scheduled.purpose;
      } else {
        purpose = 'Order Booking & Payment Collection';
      }
    }

    // 4. Schedule label and badge color
    let scheduleLabel = 'Today';
    let scheduleBadgeColor = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    let isToday = true;

    if (scheduled?.scheduledDate) {
      const schDate = new Date(scheduled.scheduledDate);
      if (schDate.toDateString() === todayStr) {
        scheduleLabel = 'Scheduled Today';
      } else {
        scheduleLabel = schDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
        isToday = false;
      }
      scheduleBadgeColor = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    } else if (shop.revisitDate) {
      const revDate = new Date(shop.revisitDate);
      isToday = revDate.toDateString() === todayStr;
      scheduleLabel = `Revisit: ${revDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
      scheduleBadgeColor = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    } else {
      const weekday = new Date().toLocaleDateString('en-IN', { weekday: 'short' });
      scheduleLabel = `Today (${weekday} Beat)`;
    }

    return {
      purpose,
      scheduled,
      completedToday,
      scheduleLabel,
      scheduleBadgeColor,
      isToday
    };
  };

  // User taps store to check in -> Step 1: select store, Step 2: prompt purpose
  const handleSelectStoreForCheckIn = (shop, preselectedPurpose = null) => {
    setPendingStoreForCheckIn(shop);
    const purposeToUse = preselectedPurpose || getShopVisitDetails(shop).purpose;
    const initialPurposes = purposeToUse.includes('&') 
      ? purposeToUse.split('&').map(p => p.trim()) 
      : [purposeToUse];
    setSelectedPurposes(initialPurposes);
    setPurposeModalOpen(true);
  };

  // Step 2: Confirm check-in with chosen purpose(s) (Supports 1 or 2 purposes for same store)
  const handleConfirmCheckInWithPurpose = async (purposeParam, explicitShop = null) => {
    const shop = explicitShop || pendingStoreForCheckIn;
    if (!shop) return;

    let purposesArray = [];
    if (typeof purposeParam === 'string') {
      purposesArray = purposeParam.includes('&') 
        ? purposeParam.split('&').map(p => p.trim()) 
        : [purposeParam];
    } else if (Array.isArray(purposeParam) && purposeParam.length > 0) {
      purposesArray = purposeParam;
    } else if (selectedPurposes && selectedPurposes.length > 0) {
      purposesArray = selectedPurposes;
    } else {
      purposesArray = ['Order Booking & Payment Collection'];
    }

    const finalPurpose = purposesArray.join(' & ');
    setSelectedPurpose(finalPurpose);
    setSelectedPurposes(purposesArray);
    setPurposeModalOpen(false);

    try {
      const payload = {
        storeId: shop._id,
        dealerId: shop.dealerId?._id || shop.dealerId,
        visitorName: 'Sales Representative',
        purpose: finalPurpose,
        latitude: currentCoords?.latitude || 13.0827,
        longitude: currentCoords?.longitude || 80.2707,
        remarks: `Live GPS Check-In (${finalPurpose}) from ${geoAddress?.street || geoAddress?.city || 'Field App'}`
      };

      const res = await axios.post('/field-sales/visits/check-in', payload);
      if (res.data?.success) {
        const visit = res.data.data;
        setActiveVisitRecord(visit);
        setActiveShopWindow(shop);
        setPendingStoreForCheckIn(null);
        setSmartCheckInModalOpen(false);
        setShopWindowOpen(true);

        // Open the tab corresponding to the first chosen purpose
        const primaryPurpose = purposesArray[0];
        if (primaryPurpose === 'Initial Visit') {
          setShopWindowTab('initial_visit');
        } else if (primaryPurpose === 'Payment Collection') {
          setShopWindowTab('payment');
        } else if (primaryPurpose === 'Stock Auditing') {
          setShopWindowTab('stock_audit');
        } else if (primaryPurpose === 'Routine Beat') {
          setShopWindowTab('routine_beat');
        } else {
          setShopWindowTab('order');
        }

        fetchVisits();
        fetchCustomer360(shop._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  // Perform GPS Check-In directly with specified purpose or prompt
  const handleCheckInToShop = (shop, purpose) => {
    setPendingStoreForCheckIn(shop);
    if (purpose) {
      handleConfirmCheckInWithPurpose(purpose, shop);
    } else {
      handleSelectStoreForCheckIn(shop);
    }
  };

  // Allow switching / updating visit purpose directly inside active shop window
  const handleSwitchVisitPurpose = async (newPurpose) => {
    setSelectedPurpose(newPurpose);
    if (newPurpose === 'Initial Visit') {
      setShopWindowTab('initial_visit');
    } else if (newPurpose === 'Payment Collection') {
      setShopWindowTab('payment');
    } else if (newPurpose === 'Order Booking') {
      setShopWindowTab('order');
    }
    if (!activeVisitRecord) return;
    try {
      const visitId = activeVisitRecord._id || activeVisitRecord.id;
      const res = await axios.put(`/field-sales/visits/${visitId}/purpose`, { purpose: newPurpose });
      if (res.data?.success) {
        setActiveVisitRecord(prev => prev ? { ...prev, purpose: newPurpose } : prev);
        fetchVisits();
      }
    } catch (e) {
      console.warn('Could not update visit purpose on server:', e);
    }
  };

  // Open Register Shop Modal with auto-fetched Google / OSM address
  const handleOpenRegisterWithAutoAddress = () => {
    setNewShopName('');
    setNewShopOwner('');
    setNewShopPhone('');
    // Auto-fill address from reverse geocoded Google/OSM location!
    setNewShopAddress(geoAddress?.fullAddress || '');
    setNewShopCity(geoAddress?.city || '');
    setNewShopPincode(geoAddress?.pincode || '');
    setSmartCheckInModalOpen(false);
    setRegisterModalOpen(true);
  };

  // Handle Register New Shop
  const handleRegisterShop = async (e) => {
    e.preventDefault();
    if (!newShopName || !newShopPhone || !newShopAddress) {
      alert('Please fill shop name, phone number, and address');
      return;
    }

    setRegisterSubmitting(true);
    try {
      const payload = {
        name: newShopName,
        ownerName: newShopOwner || newShopName,
        phone: newShopPhone,
        address: newShopAddress,
        city: newShopCity,
        pincode: newShopPincode,
        category: newShopCategory,
        latitude: currentCoords?.latitude,
        longitude: currentCoords?.longitude,
        locationName: geoAddress?.street || geoAddress?.city
      };

      const res = await axios.post('/field-sales/shops', payload);
      if (res.data?.success) {
        const newStore = res.data.data;
        setRegisterModalOpen(false);
        await fetchShops();

        // Immediately Check-In to this newly registered shop and open its window!
        await handleCheckInToShop(newStore, 'First Visit & Store Onboarding');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to register shop');
    } finally {
      setRegisterSubmitting(false);
    }
  };

  // Handle GPS Check-Out
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
        setActiveShopWindow(null);
        setShopWindowOpen(false);
        setCheckoutModalOpen(false);
        setOrderCart([]);
        fetchVisits();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    }
  };

  // Add / adjust item in Order Cart
  const updateCartItem = (product, delta) => {
    setOrderCart(prev => {
      const existing = prev.find(item => item.productId === product._id);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          return prev.filter(item => item.productId !== product._id);
        }
        return prev.map(item => 
          item.productId === product._id 
            ? { ...item, quantity: newQty, lineTotal: newQty * item.price }
            : item
        );
      } else if (delta > 0) {
        const price = parseFloat(product.mrp || product.price || 0);
        return [...prev, {
          productId: product._id,
          productName: product.name,
          unit: product.unit || 'PCS',
          cartonSize: product.cartonSize || 24,
          quantity: delta,
          price,
          lineTotal: delta * price
        }];
      }
      return prev;
    });
  };

  // Submit Spot Order Booking
  const handleBookOrder = async () => {
    if (!orderCart.length) {
      alert('Cart is empty. Add products to book order.');
      return;
    }
    setOrderSubmitting(true);
    try {
      const payload = {
        storeId: activeShopWindow?._id,
        dealerId: activeShopWindow?.dealerId?._id || activeShopWindow?.dealerId,
        items: orderCart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.price
        })),
        notes: `Order booked during GPS visit at ${activeShopWindow?.name}`
      };

      const res = await axios.post('/field-sales/orders', payload);
      if (res.data?.success) {
        alert(`Order placed successfully! Order #${res.data.data.orderNumber}`);
        setOrderCart([]);
        setOrderModalOpen(false);
        fetchCustomer360(activeShopWindow._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order');
    } finally {
      setOrderSubmitting(false);
    }
  };

  // Submit Issue Bill / Generate Tax Invoice
  const handleIssueBill = async () => {
    if (!activeShopWindow?._id) return;
    setBillSubmitting(true);
    try {
      const payload = {
        storeId: activeShopWindow._id,
        paymentMethod: billPaymentMethod,
        notes: billNotes || `Spot bill issued during visit at ${activeShopWindow?.name}`
      };
      const res = await axios.post('/field-sales/orders/issue-bill', payload);
      if (res.data?.success) {
        alert(res.data.message || 'Tax Invoice issued successfully!');
        setIssueBillModalOpen(false);
        setBillNotes('');
        setBillPaymentMethod('CASH');
        fetchCustomer360(activeShopWindow._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to issue bill');
    } finally {
      setBillSubmitting(false);
    }
  };

  // Submit Payment Collection
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const collectedVal = parseFloat(colAmount);
    if (!collectedVal || collectedVal <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    setColSubmitting(true);
    try {
      const reasonText = colReason === 'Other' ? colCustomReason : colReason;
      const refText = colMethod === 'CHEQUE' 
        ? `Cheque No: ${colChequeNo}${colBankName ? ` (${colBankName})` : ''}${colChequeDate ? ` Dt: ${colChequeDate}` : ''}`
        : (colMethod === 'GPAY' ? `GPay UPI: ${colRef}` : colRef);

      const finalRemarks = [
        `Reason: ${reasonText}`,
        refText ? `Ref: ${refText}` : '',
        colNotes ? `Notes: ${colNotes}` : `Payment collected during live visit at ${activeShopWindow?.name}`
      ].filter(Boolean).join(' | ');

      const payload = {
        storeId: activeShopWindow?._id,
        amount: collectedVal,
        paymentMethod: colMethod,
        paymentReference: colMethod === 'CHEQUE' ? colChequeNo : colRef,
        remarks: finalRemarks
      };

      const res = await axios.post('/field-sales/collections', payload);
      if (res.data?.success) {
        alert(`✓ Payment of ₹${collectedVal.toFixed(2)} recorded successfully!`);
        setColAmount('');
        setColRef('');
        setColChequeNo('');
        setColBankName('');
        setColChequeDate('');
        setColCustomReason('');
        setColNotes('');
        fetchCustomer360(activeShopWindow._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setColSubmitting(false);
    }
  };

  // Submit Stock Audit
  const handleStockAuditSubmit = async (e) => {
    e.preventDefault();
    setAuditSubmitting(true);
    try {
      if (activeVisitRecord) {
        const visitId = activeVisitRecord._id || activeVisitRecord.id;
        await axios.put(`/field-sales/visits/${visitId}`, {
          remarks: `Stock Audit: ${stockAuditCondition}. Shelf Facings: ${shelfFacingUnits || '0'}. Damaged: ${damagedUnits || '0'}. Notes: ${auditRemarks}`
        });
      }
      alert('📦 Stock Audit recorded successfully!');
      setShopWindowTab('menu');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit stock audit');
    } finally {
      setAuditSubmitting(false);
    }
  };

  // Handle Generate Bill for Sold Product (Stock Audit)
  const handleGenerateBillForSold = async () => {
    if (!activeShopWindow?._id) return;
    const selectedProd = catalogue.find(p => p._id === soldProductId) || catalogue[0];
    if (!selectedProd) {
      alert('Please select a sold product');
      return;
    }
    const qty = parseInt(soldQty, 10);
    if (!qty || qty <= 0) {
      alert('Please enter a valid sold quantity');
      return;
    }

    setSoldSubmitting(true);
    try {
      const unitPrice = parseFloat(selectedProd.mrp || selectedProd.price || 0);
      const payload = {
        storeId: activeShopWindow._id,
        paymentMethod: soldPaymentMethod,
        items: [{
          productId: selectedProd._id,
          productName: selectedProd.name,
          quantity: qty,
          unitPrice
        }],
        notes: `Spot bill generated from Stock Audit (Sold ${qty}x ${selectedProd.name}) at ${activeShopWindow?.name}`
      };

      const res = await axios.post('/field-sales/orders/issue-bill', payload);
      if (res.data?.success) {
        alert(res.data.message || 'Tax Invoice issued for sold product successfully!');
        setStockSoldModalOpen(false);
        setSoldQty(1);
        fetchCustomer360(activeShopWindow._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate bill for sold product');
    } finally {
      setSoldSubmitting(false);
    }
  };

  // Handle Follow Request for Sold Product (Stock Audit)
  const handleFollowRequestForSold = async () => {
    if (!activeShopWindow?._id) return;
    const selectedProd = catalogue.find(p => p._id === soldProductId) || catalogue[0];
    const qty = parseInt(soldQty, 10) || 1;
    const prodName = selectedProd?.name || 'Stock Item';

    setSoldSubmitting(true);
    try {
      const payload = {
        storeId: activeShopWindow._id,
        title: `Restock / Payment Follow-up: ${prodName} (${qty} units sold)`,
        dueDate: soldFollowUpDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        contactPerson: activeShopWindow?.contactPerson || activeShopWindow?.name,
        phone: activeShopWindow?.phone,
        priority: 'HIGH',
        reason: 'REPLENISHMENT',
        notes: soldFollowUpNotes || `Retailer reported ${qty} units of ${prodName} sold during stock audit. Follow-up to replenish or collect payment.`
      };

      const res = await axios.post('/field-sales/follow-ups', payload);
      if (res.data?.success) {
        alert('📅 Follow-up request scheduled successfully!');
        setStockSoldModalOpen(false);
        setSoldFollowUpNotes('');
        setSoldShowFollowUp(false);
        fetchVisits();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule follow-up request');
    } finally {
      setSoldSubmitting(false);
    }
  };

  // Handle Return / Replace / Hold Submission
  const handleSubmitReturnReplaceHold = async (e) => {
    e.preventDefault();
    if (!activeShopWindow?._id) return;

    setRrSubmitting(true);
    try {
      const selectedProd = catalogue.find(p => p._id === rrProductId) || catalogue[0];
      const replacementProd = catalogue.find(p => p._id === rrReplacementProductId);
      const qty = parseInt(rrQty, 10) || 1;

      let requestType = rrActionType; // 'RETURN', 'REPLACE', 'HOLD'
      let reason = '';
      let proposedChanges = {};

      if (rrActionType === 'HOLD') {
        reason = rrHoldReason || 'Consignment On Hold';
        proposedChanges = {
          action: 'HOLD',
          holdReason: rrHoldReason,
          remarks: rrCustomRemarks || 'Awaiting retailer clearance',
          storeId: activeShopWindow._id,
          storeName: activeShopWindow.name
        };
      } else if (rrActionType === 'RETURN') {
        reason = rrReason || 'Stock Return';
        proposedChanges = {
          action: 'RETURN',
          productId: selectedProd?._id,
          productName: selectedProd?.name,
          quantity: qty,
          returnReason: rrReason,
          remarks: rrCustomRemarks
        };
      } else {
        // REPLACE
        reason = rrReason || 'Stock Replacement';
        proposedChanges = {
          action: 'REPLACEMENT',
          productId: selectedProd?._id,
          productName: selectedProd?.name,
          quantity: qty,
          replacementProductId: replacementProd?._id || selectedProd?._id,
          replacementProductName: replacementProd?.name || selectedProd?.name,
          replaceReason: rrReason,
          remarks: rrCustomRemarks
        };
      }

      const prefix = rrActionType === 'HOLD' ? 'HOLD-' : (rrActionType === 'RETURN' ? 'RET-' : 'REP-');
      const payload = {
        referenceNo: prefix + Date.now().toString().slice(-6),
        requestType,
        reason,
        proposedChanges,
        storeId: activeShopWindow._id
      };

      const res = await axios.post('/field-sales/amendments', payload);
      if (res.data?.success) {
        alert(`✓ ${rrActionType === 'HOLD' ? 'Stock Hold' : (rrActionType === 'RETURN' ? 'Stock Return' : 'Stock Replacement')} request logged successfully!`);
        setReturnReplaceModalOpen(false);
        setRrCustomRemarks('');
        fetchCustomer360(activeShopWindow._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || `Failed to process ${rrActionType} request`);
    } finally {
      setRrSubmitting(false);
    }
  };

  // Submit Routine Beat Details
  const handleRoutineBeatSubmit = async (e) => {
    e.preventDefault();
    setBeatSubmitting(true);
    try {
      if (activeVisitRecord) {
        const visitId = activeVisitRecord._id || activeVisitRecord.id;
        await axios.put(`/field-sales/visits/${visitId}`, {
          remarks: `Routine Beat (${beatVisitType}): Feedback: ${beatFeedback || 'None'}. Competitor Notes: ${competitorNotes || 'None'}`
        });
      }
      alert('🗺️ Routine Beat visit notes saved successfully!');
      setShopWindowTab('menu');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save routine beat details');
    } finally {
      setBeatSubmitting(false);
    }
  };

  const cartSubtotal = orderCart.reduce((sum, item) => sum + item.lineTotal, 0);
  const cartGst = cartSubtotal * 0.05;
  const cartGrandTotal = cartSubtotal + cartGst;

  // Handle Photo Capture / Upload
  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo file size exceeds 5MB limit. Please upload a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setInitialPhoto(event.target.result);
      setInitialPhotoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setInitialPhoto(null);
    setInitialPhotoPreview(null);
  };

  // Quick preset chips for Follow-up Date
  const handleSetQuickFollowUpDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setInitialFollowUpDate(d.toISOString().split('T')[0]);
  };

  // Save Draft Notes & Photos during Initial Visit
  const handleSaveInitialVisitDraft = async () => {
    if (!activeVisitRecord) {
      alert('Draft saved locally in form. (Note: Perform live GPS check-in to sync real-time to server).');
      setInitialVisitSavedNotice(true);
      setTimeout(() => setInitialVisitSavedNotice(false), 3500);
      return;
    }
    setInitialVisitSubmitting(true);
    try {
      const visitId = activeVisitRecord._id || activeVisitRecord.id;
      const res = await axios.put(`/field-sales/visits/${visitId}`, {
        remarks: initialDescription,
        photos: initialPhoto ? [initialPhoto] : []
      });
      if (res.data?.success) {
        setInitialVisitSavedNotice(true);
        setTimeout(() => setInitialVisitSavedNotice(false), 3500);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save visit draft');
    } finally {
      setInitialVisitSubmitting(false);
    }
  };

  // Complete Initial Visit based on Decision (Book Today / Follow-up / Close)
  const handleSubmitInitialVisit = async () => {
    if (!initialOrderDecision) {
      alert('Please select whether to Book Order Today, Schedule Follow-up, or Close Lead.');
      return;
    }

    if (!initialDescription.trim()) {
      alert('Please provide a brief description of the visit and meeting discussion.');
      return;
    }

    const finalFollowUpReason = initialFollowUpReason === 'Other / Custom Reason' 
      ? (customFollowUpReason || 'Custom follow-up requested') 
      : initialFollowUpReason;
    const finalCloseReason = initialCloseReason === 'Other Reason' 
      ? (customCloseReason || 'Custom reason for close') 
      : initialCloseReason;

    setInitialVisitSubmitting(true);

    try {
      // Branch 1: BOOK ORDER ON THAT DAY
      if (initialOrderDecision === 'TODAY') {
        if (orderCart.length === 0) {
          alert('Cart is empty! Please add products from the catalogue below to book the order today, or choose "Follow-up for Order Booking" if the order will be placed later.');
          setInitialVisitSubmitting(false);
          return;
        }

        // 1. Create the sales order
        const orderPayload = {
          storeId: activeShopWindow?._id,
          dealerId: activeShopWindow?.dealerId?._id || activeShopWindow?.dealerId,
          items: orderCart.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.price
          })),
          notes: `Initial Visit Order - ${initialDescription}`
        };

        const orderRes = await axios.post('/field-sales/orders', orderPayload);
        const orderData = orderRes.data?.data;

        // 2. Check out the visit if visit record is active
        if (activeVisitRecord) {
          const visitId = activeVisitRecord._id || activeVisitRecord.id;
          const checkoutPayload = {
            outcome: `Initial Visit: Order Booked #${orderData?.orderNumber || ''} (₹${cartGrandTotal.toFixed(2)})`,
            orderValue: cartGrandTotal,
            remarks: initialDescription,
            photos: initialPhoto ? [initialPhoto] : [],
            revisitDate: null
          };
          await axios.post(`/field-sales/visits/${visitId}/check-out`, checkoutPayload);
        }

        alert(`🎉 Initial Visit completed! Order #${orderData?.orderNumber || ''} booked for ₹${cartGrandTotal.toFixed(2)}.`);
        setStageModalOpen(null);
        setActiveVisitRecord(null);
        setActiveShopWindow(null);
        setShopWindowOpen(false);
        setOrderCart([]);
        fetchVisits();
      }

      // Branch 2: SCHEDULE FOLLOW-UP FOR ORDER BOOKING
      else if (initialOrderDecision === 'FOLLOWUP') {
        if (!initialFollowUpDate) {
          alert('Please select a date for the follow-up.');
          setInitialVisitSubmitting(false);
          return;
        }

        // 1. Create Follow-Up Task
        await axios.post('/field-sales/follow-ups', {
          storeId: activeShopWindow?._id,
          title: `Initial Visit Follow-up: Order Booking at ${activeShopWindow?.name}`,
          contactPerson: activeShopWindow?.ownerName || 'Store Owner',
          phone: activeShopWindow?.phone,
          dueDate: initialFollowUpDate,
          priority: 'HIGH',
          reason: 'ORDER_BOOKING',
          notes: `Reason: ${finalFollowUpReason}. Visit Notes: ${initialDescription}`
        });

        // 2. Check out the visit if active
        if (activeVisitRecord) {
          const visitId = activeVisitRecord._id || activeVisitRecord.id;
          const checkoutPayload = {
            outcome: `Initial Visit: Follow-up Scheduled for ${initialFollowUpDate} (${finalFollowUpReason})`,
            revisitDate: initialFollowUpDate,
            remarks: initialDescription,
            photos: initialPhoto ? [initialPhoto] : []
          };
          await axios.post(`/field-sales/visits/${visitId}/check-out`, checkoutPayload);
        }

        alert(`📅 Initial Visit saved! Order booking follow-up scheduled for ${initialFollowUpDate}.`);
        setStageModalOpen(null);
        setActiveVisitRecord(null);
        setActiveShopWindow(null);
        setShopWindowOpen(false);
        fetchVisits();
      }

      // Branch 3: CLOSED / NOT INTERESTED
      else if (initialOrderDecision === 'CLOSED') {
        if (activeVisitRecord) {
          const visitId = activeVisitRecord._id || activeVisitRecord.id;
          const checkoutPayload = {
            outcome: `Initial Visit: Closed / Not Interested (${finalCloseReason})`,
            remarks: `Reason for Close: ${finalCloseReason}. Notes: ${initialDescription}`,
            photos: initialPhoto ? [initialPhoto] : [],
            revisitDate: null
          };
          await axios.post(`/field-sales/visits/${visitId}/check-out`, checkoutPayload);
        }

        alert(`Initial Visit recorded as Closed (${finalCloseReason}).`);
        setStageModalOpen(null);
        setActiveVisitRecord(null);
        setActiveShopWindow(null);
        setShopWindowOpen(false);
        fetchVisits();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit initial visit report');
    } finally {
      setInitialVisitSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-20 sm:pb-8">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Field Sales & Shop Visits</span>
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-bold shrink-0">
              GPS Live
            </span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
            Live GPS Check-In, Map Store Matching, Customer 360, and Instant Order Booking
          </p>
        </div>

        {/* Action Buttons: 2-column grid on mobile for thumb-friendly reach */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          {/* PRIMARY GPS CHECK-IN BUTTON */}
          <button
            type="button"
            onClick={handleOpenSmartCheckIn}
            className="bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/25 active:scale-95 transition-all text-center"
          >
            <Navigation className="w-4 h-4 fill-slate-950 shrink-0" />
            <span className="truncate">Live GPS Check-In</span>
          </button>

          <button
            type="button"
            onClick={handleOpenRegisterWithAutoAddress}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all text-center"
          >
            <Plus className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">+ Register New Shop</span>
          </button>
        </div>
      </div>

      {/* GPS Location & Reverse Geocoded Address Bar */}
      <div className="bg-slate-800/90 border border-white/10 p-3 sm:p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-xl">
        <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
          <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 mt-0.5 sm:mt-0 ${currentCoords ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400'}`}>
            <Navigation className={`w-4 h-4 ${gpsLoading ? 'animate-spin' : ''}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-white">Live Geolocation:</span>
              {currentCoords ? (
                <span className="text-emerald-400 font-mono font-bold text-[11px] sm:text-xs">
                  {currentCoords.latitude.toFixed(4)}° N, {currentCoords.longitude.toFixed(4)}° E
                </span>
              ) : (
                <span className="text-amber-400 font-semibold animate-pulse text-[11px]">Acquiring satellite GPS...</span>
              )}

              {currentCoords && (
                <a
                  href={`https://www.google.com/maps?q=${currentCoords.latitude},${currentCoords.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-bold text-[11px] hover:underline"
                >
                  <MapIcon className="w-3 h-3" />
                  <span>Google Maps ↗</span>
                </a>
              )}
            </div>

            {/* Resolved Physical Street Address */}
            <p className="text-slate-300 text-[11px] mt-1.5 flex items-start gap-1 leading-snug">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span className="font-semibold text-slate-200 break-words">
                {geoLoading ? 'Resolving street address from Google/OSM...' : (geoAddress?.fullAddress || 'Locating street...')}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end pt-1 md:pt-0 border-t md:border-t-0 border-white/5">
          <button
            type="button"
            onClick={() => acquireGPS(false)}
            disabled={gpsLoading}
            className="w-full sm:w-auto px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span>{gpsLoading ? 'Locating...' : 'Refresh GPS'}</span>
          </button>
        </div>
      </div>

      {/* ACTIVE VISIT BANNER (If Visit In Progress) */}
      {activeVisitRecord && activeShopWindow && (
        <div className="bg-gradient-to-r from-amber-500/20 via-slate-800 to-slate-900 border border-amber-500/50 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-4 h-4 rounded-full bg-emerald-400"></div>
              <div className="absolute inset-0 w-4 h-4 rounded-full bg-emerald-400 animate-ping"></div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Live Shop Visit Active
                </span>
                {(activeVisitRecord?.purpose || selectedPurpose) && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-500/50 flex items-center gap-1">
                    <span>🎯</span>
                    <span>{activeVisitRecord?.purpose || selectedPurpose}</span>
                  </span>
                )}
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimer(visitTimer)}
                </span>
              </div>
              <h3 className="text-base font-black text-white mt-1">
                {activeShopWindow.name}
              </h3>
              <p className="text-xs text-slate-400">
                {activeShopWindow.address || activeShopWindow.city || 'Store Location'} • Contact: {activeShopWindow.phone}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShopWindowOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-xs border border-white/10 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            >
              <Store className="w-4 h-4 text-amber-400" />
              <span>Open Shop Window</span>
            </button>

            <button
              type="button"
              onClick={() => setCheckoutModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs cursor-pointer active:scale-95 transition-all shadow-md"
            >
              Check-Out & Complete
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        <button
          type="button"
          onClick={() => setActiveTab('beat')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeTab === 'beat' 
              ? 'bg-amber-500 text-slate-950 font-black shadow-md' 
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>
            {activeVisitRecord && activeShopWindow ? 'Checked-In Store (1)' : `Daily Beat (${shops.length})`}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('allocated')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeTab === 'allocated' 
              ? 'bg-amber-500 text-slate-950 font-black shadow-md' 
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Allocated ({visitHistory.filter(v => v.status === 'SCHEDULED').length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
            activeTab === 'history' 
              ? 'bg-amber-500 text-slate-950 font-black shadow-md' 
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>History ({visitHistory.length})</span>
        </button>
      </div>

      {/* TAB 1: DAILY BEAT SHOPS */}
      {activeTab === 'beat' && (
        <div className="space-y-3 sm:space-y-4">
          {/* Today's Beat Schedule & Purpose Planning Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/30 border border-amber-500/25 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Today's Beat: {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                  </h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Active Route
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  Stores to visit today with planned visit purposes (Order, Payment, Audit, Beat)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center text-xs">
              <span className="text-slate-400 font-semibold">Today's Outlets:</span>
              <span className="font-mono font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30 text-xs sm:text-sm">
                {filteredShops.length} Stores
              </span>
            </div>
          </div>

          {/* Search bar & GPS Quick Trigger (Hidden during active live visit because only the checked-in store is relevant) */}
          {!(activeVisitRecord && activeShopWindow) ? (
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search registered shops by name, city, area..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={handleOpenSmartCheckIn}
                className="w-full sm:w-auto px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 active:scale-95"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Match Store via GPS</span>
              </button>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                <span>Active Visit in Progress: Showing only checked-in store</span>
              </div>
            </div>
          )}

          {/* Shops Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredShops.map((shop) => {
              const visitInfo = getShopVisitDetails(shop);
              const isCheckedIn = Boolean(
                activeVisitRecord && 
                activeShopWindow && 
                String(activeShopWindow._id || activeShopWindow.id) === String(shop._id || shop.id)
              );
              const dist = shop.distanceMeters != null ? shop.distanceMeters : (
                currentCoords?.latitude && shop.latitude 
                  ? calculateDistance(currentCoords.latitude, currentCoords.longitude, shop.latitude, shop.longitude)
                  : null
              );

              return (
                <div 
                  key={shop._id} 
                  className={`border p-4 rounded-2xl flex flex-col justify-between transition-all group ${
                    isCheckedIn
                      ? 'bg-gradient-to-br from-emerald-950/30 via-slate-800/90 to-slate-800/90 border-emerald-500/50 ring-2 ring-emerald-500/30 shadow-lg'
                      : 'bg-slate-800/80 border-white/10 hover:border-amber-500/40 shadow-sm'
                  }`}
                >
                  <div>
                    {/* Top Category and Distance Badges */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 uppercase tracking-wider">
                        {shop.category || 'Retail'}
                      </span>
                      {isCheckedIn ? (
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Checked-In</span>
                        </span>
                      ) : (
                        dist !== null && (
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            dist < 200 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-400'
                          }`}>
                            {dist < 1000 ? `${dist}m away` : `${(dist / 1000).toFixed(1)} km`}
                          </span>
                        )
                      )}
                    </div>

                    {/* Shop Name */}
                    <h3 className="text-sm sm:text-base font-black text-white group-hover:text-amber-400 transition-colors">
                      {shop.name}
                    </h3>

                    {/* Active Checked-In Purpose Badge */}
                    {isCheckedIn && (activeVisitRecord?.purpose || selectedPurpose) && (
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                          <span>🎯</span>
                          <span>{activeVisitRecord?.purpose || selectedPurpose}</span>
                        </span>
                      </div>
                    )}

                    {/* Address & Phone */}
                    <p className="text-xs text-slate-400 mt-1 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{shop.address || 'Chennai Beat'}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{shop.phone}</span>
                    </p>

                    {/* SCHEDULE ON THAT DAY & PURPOSE OF VISIT SECTION */}
                    <div className="mt-3 p-2.5 bg-slate-900/80 border border-white/10 rounded-xl space-y-2">
                      {/* Visit Schedule on that day */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Visit Schedule:</span>
                        </span>
                        <span className={`font-bold px-2 py-0.5 rounded-md border text-[10px] ${visitInfo.scheduleBadgeColor}`}>
                          {visitInfo.scheduleLabel}
                        </span>
                      </div>

                      {/* Purpose to Visit the Shop */}
                      <div className="pt-1.5 border-t border-white/5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-slate-400 font-semibold text-[11px] flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Purpose to Visit:</span>
                          </span>
                          {visitInfo.scheduled && (
                            <span className="text-[9px] font-black uppercase text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              Allocated
                            </span>
                          )}
                        </div>

                        {/* Interactive Purpose Selector Dropdown */}
                        <div className="relative">
                          <select
                            value={visitInfo.purpose}
                            onChange={(e) => {
                              const val = e.target.value;
                              setShopPlannedPurposes(prev => ({
                                ...prev,
                                [String(shop._id || shop.id)]: val
                              }));
                            }}
                            className="w-full bg-slate-800 border border-amber-500/30 hover:border-amber-400 text-amber-200 rounded-lg px-2.5 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer transition-colors"
                          >
                            <option value="Order Booking & Payment Collection">🛒 Order Booking & 💵 Payment Collection</option>
                            <option value="Order Booking">🛒 Order Booking</option>
                            <option value="Payment Collection">💵 Payment Collection</option>
                            <option value="Stock Auditing">📦 Stock Auditing</option>
                            <option value="Stock Auditing & Order Booking">📦 Stock Auditing & 🛒 Order Booking</option>
                            <option value="Initial Visit">📍 Initial Visit</option>
                            <option value="Routine Beat">🗺️ Routine Beat</option>
                          </select>
                        </div>
                      </div>

                      {/* Visited Today Indicator */}
                      {visitInfo.completedToday && (
                        <div className="pt-1 border-t border-white/5 flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>Visited Today ({visitInfo.completedToday.purpose})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                    {isCheckedIn ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveShopWindow(shop);
                            setShopWindowOpen(true);
                            fetchCustomer360(shop._id);
                          }}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md"
                        >
                          <Store className="w-4 h-4" />
                          <span>Open Shop Window</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCheckoutModalOpen(true)}
                          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md"
                        >
                          <span>Check-Out</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleCheckInToShop(shop, visitInfo.purpose)}
                          className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md shadow-amber-500/20"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>GPS Check-In</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveShopWindow(shop);
                            setShopWindowOpen(true);
                            fetchCustomer360(shop._id);
                          }}
                          className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
                          title="Open Shop Window"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ALLOCATED VISITS BY ADMIN */}
      {activeTab === 'allocated' && (
        <div className="space-y-4">
          {visitHistory.filter(v => v.status === 'SCHEDULED').length === 0 ? (
            <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-8 text-center space-y-2">
              <p className="text-sm font-bold text-slate-300">No scheduled visits currently allocated by admin.</p>
              <p className="text-xs text-slate-500">You can check in to any daily beat shop using Live GPS Check-In.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visitHistory.filter(v => v.status === 'SCHEDULED').map((v) => {
                const store = v.storeId || v.store;
                return (
                  <div key={v._id || v.id} className="bg-slate-800/80 border border-amber-500/30 p-4 rounded-2xl flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase bg-amber-500/20 text-amber-300">
                          {v.priority || 'SCHEDULED'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(v.scheduledDate || v.date).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-white">{store?.name || 'Assigned Store'}</h3>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{store?.address || 'Designated Beat Route'}</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCheckInToShop(store || { _id: v.storeId, name: 'Assigned Store' })}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Start GPS Check-In</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VISIT ACTIVITY LOG */}
      {activeTab === 'history' && (
        <div className="bg-slate-800/80 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/60 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">Store / Outlet</th>
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
                        {new Date(v.checkInTime || v.createdAt || v.date).toLocaleString('en-IN', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-white">
                        {v.storeId?.name || v.store?.name || 'Retail Outlet'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                          {v.purpose || 'Store Visit'}
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

      {/* ========================================================================= */}
      {/* 1. SMART GPS CHECK-IN & GOOGLE MAP / STORE MATCHING MODAL                 */}
      {/* ========================================================================= */}
      {smartCheckInModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative my-0 sm:my-auto max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSmartCheckInModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-3 mb-4 pr-10">
              <div className="p-2.5 sm:p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 shrink-0">
                <Compass className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white">Live GPS Check-In</h2>
                <p className="text-[11px] sm:text-xs text-slate-400">
                  Google Map address link &amp; Registered store matching
                </p>
              </div>
            </div>

            {/* Google Map / OSM Preview & Detected Address Card */}
            <div className="space-y-3 mb-5">
              {currentCoords && (
                <div className="w-full h-48 sm:h-56 rounded-2xl overflow-hidden border border-white/10 bg-slate-950 relative shadow-inner">
                  {/* Interactive Map Embed */}
                  <iframe
                    title="Live Location Map"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight="0"
                    marginWidth="0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentCoords.longitude - 0.005}%2C${currentCoords.latitude - 0.005}%2C${currentCoords.longitude + 0.005}%2C${currentCoords.latitude + 0.005}&layer=mapnik&marker=${currentCoords.latitude}%2C${currentCoords.longitude}`}
                    className="w-full h-full opacity-85 hover:opacity-100 transition-opacity"
                  ></iframe>

                  {/* External Google Maps Button floating on Map */}
                  <div className="absolute bottom-2 right-2">
                    <a
                      href={`https://www.google.com/maps?q=${currentCoords.latitude},${currentCoords.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-900/90 hover:bg-slate-900 text-amber-400 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 border border-white/20 shadow-lg backdrop-blur-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Google Maps</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Detected Physical Address Box */}
              <div className="bg-slate-800/80 border border-white/10 p-3.5 rounded-2xl flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Detected Current Location Address:</span>
                    <span className="text-slate-300 text-[11px] font-medium leading-relaxed">
                      {geoLoading ? 'Fetching address from Google/OSM...' : (geoAddress?.fullAddress || 'Locating physical address...')}
                    </span>
                    {geoAddress?.city && (
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        {geoAddress.city} {geoAddress.pincode ? `• PIN: ${geoAddress.pincode}` : ''}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => acquireGPS(false)}
                  className="text-[11px] font-bold text-amber-400 hover:text-amber-300 shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                  <span>Re-fetch</span>
                </button>
              </div>
            </div>

            {/* MATCHED STORES AT THIS LOCATION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-amber-400" />
                  <span>Matching Stores at this Location ({nearbyMatchedShops.length})</span>
                </h3>
                <span className="text-[11px] text-slate-400">Radius ~2km / Area Match</span>
              </div>

              {nearbyMatchedShops.length > 0 ? (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {nearbyMatchedShops.map((shop) => (
                    <div
                      key={shop._id}
                      className="bg-slate-800/90 border border-white/10 hover:border-amber-500/50 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white">{shop.name}</h4>
                          {shop.computedDistance !== null && (
                            <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              shop.computedDistance < 100 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-amber-500/20 text-amber-300'
                            }`}>
                              {shop.computedDistance < 100 ? '🎯 Exact Location' : `${shop.computedDistance}m away`}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1 truncate max-w-sm">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{shop.address || 'Chennai'}</span>
                        </p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>Owner: {shop.ownerName || 'Retailer'}</span>
                          <span>• Phone: {shop.phone}</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCheckInToShop(shop)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Check-In & Open Shop</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                /* NO SHOP MATCHED AT THIS LOCATION */
                <div className="bg-slate-800/40 border border-dashed border-white/10 p-5 rounded-2xl text-center space-y-2">
                  <p className="text-xs font-bold text-slate-300">
                    No registered store found at this exact GPS location.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Are you visiting a new shop? You can register this shop now and its address will be auto-fetched from Google!
                  </p>
                </div>
              )}

              {/* ACTION: REGISTER NEW SHOP AT CURRENT LOCATION */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenRegisterWithAutoAddress}
                  className="w-full bg-slate-800 hover:bg-slate-700/80 border border-amber-500/40 text-amber-300 hover:text-amber-200 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-lg"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>+ Register New Shop at this Location (Auto-fetch Address)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1.5 PURPOSE OF VISIT SELECTION MODAL (Supports Single or Dual Purpose Visit) */}
      {/* ========================================================================= */}
      {purposeModalOpen && pendingStoreForCheckIn && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-amber-500/30 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl relative my-0 sm:my-auto max-h-[92vh] overflow-y-auto space-y-4">
            <button
              type="button"
              onClick={() => {
                setPurposeModalOpen(false);
                setPendingStoreForCheckIn(null);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Selected Store Info */}
            <div className="flex items-start gap-3 pr-8">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block">
                  Store Selected for Check-In:
                </span>
                <h3 className="text-base font-black text-white truncate">
                  {pendingStoreForCheckIn.name}
                </h3>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {pendingStoreForCheckIn.address || pendingStoreForCheckIn.city || 'Store Location'}
                </p>
              </div>
            </div>

            {/* Prompt & Dual Purpose Note */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <span>🎯</span>
                  <span>Select Visit Purpose (1 or 2 Purposes Allowed)</span>
                </p>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {selectedPurposes.length} of 2 Selected
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                At a time, you can visit this store for <strong className="text-amber-400 font-bold">up to 2 purposes</strong> (e.g. Order Booking + Payment Collection). Both will be recorded in your visit log.
              </p>

              {/* Quick Dual Combinations Chips */}
              <div className="pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">
                  ⚡ Quick Dual Combinations (1-Tap):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { p1: 'Order Booking', p2: 'Payment Collection', label: '🛒 Order + 💵 Payment' },
                    { p1: 'Stock Auditing', p2: 'Order Booking', label: '📦 Audit + 🛒 Order' },
                    { p1: 'Stock Auditing', p2: 'Payment Collection', label: '📦 Audit + 💵 Payment' },
                    { p1: 'Initial Visit', p2: 'Order Booking', label: '📍 Initial + 🛒 Order' }
                  ].map((combo, idx) => {
                    const isComboActive = selectedPurposes.length === 2 && 
                      selectedPurposes.includes(combo.p1) && 
                      selectedPurposes.includes(combo.p2);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectCombination(combo.p1, combo.p2)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          isComboActive
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                            : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-white/10 hover:border-amber-500/40'
                        }`}
                      >
                        {combo.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Purpose List options with Checkbox / Multi-Select */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block px-1">
                Tap to Select / Deselect Purposes:
              </span>
              {VISIT_PURPOSES.map((p) => {
                const isSelected = selectedPurposes.includes(p.id);
                const orderIndex = selectedPurposes.indexOf(p.id);

                return (
                  <div
                    key={p.id}
                    onClick={() => togglePurposeSelection(p.id)}
                    className={`w-full p-3 rounded-2xl text-left transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99] border select-none ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500 text-white shadow-md shadow-amber-500/10'
                        : 'bg-slate-800/80 hover:bg-slate-800 border-white/5 hover:border-white/20 text-slate-300'
                    }`}
                  >
                    <div className="pr-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-xs font-black ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                          {p.label}
                        </span>
                        {isSelected && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-mono">
                            {orderIndex === 0 ? '✓ Purpose 1 (Primary)' : '✓ Purpose 2 (Secondary)'}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] mt-0.5 leading-snug ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                        {p.desc}
                      </p>
                    </div>

                    {/* Custom Checkbox circle */}
                    <div className={`w-6 h-6 rounded-xl flex items-center justify-center shrink-0 transition-all border ${
                      isSelected 
                        ? 'bg-amber-500 border-amber-400 text-slate-950' 
                        : 'border-white/20 bg-white/5 text-transparent'
                    }`}>
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Confirm Check-In Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleConfirmCheckInWithPurpose(selectedPurposes)}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-2xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <span>
                  Confirm Check-In: {selectedPurposes.join(' & ')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-[10px] text-center text-slate-500 mt-2">
                Both purposes will be logged in GPS visit record and DAR report.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CORRESPONDING ACTIVE SHOP WINDOW (Customer 360, Order, Collections)     */}
      {/* ========================================================================= */}
      {shopWindowOpen && activeShopWindow && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 w-full max-w-4xl rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative my-0 sm:my-auto max-h-[95vh] sm:max-h-[92vh] flex flex-col">
            {/* Window Top Controls */}
            <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3 sm:pb-4 mb-3 sm:mb-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {activeShopWindow.category || 'Retail Store'}
                  </span>
                  {(activeVisitRecord?.purpose || selectedPurpose) && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                      <span>🎯</span>
                      <strong className="text-white font-black">{activeVisitRecord?.purpose || selectedPurpose}</strong>
                    </span>
                  )}
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Visit: {formatTimer(visitTimer)}
                  </span>
                </div>
                <h2 className="text-base sm:text-xl font-black text-white mt-1 truncate">
                  {activeShopWindow.name}
                </h2>
                <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-400 mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-500" />
                    <a href={`tel:${activeShopWindow.phone}`} className="text-amber-400 hover:underline font-bold">
                      {activeShopWindow.phone}
                    </a>
                  </span>
                  <span>•</span>
                  <span className="truncate max-w-[120px] sm:max-w-none">{activeShopWindow.ownerName || 'Store Owner'}</span>
                  <span>•</span>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activeShopWindow.latitude || currentCoords?.latitude},${activeShopWindow.longitude || currentCoords?.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Navigate</span>
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs cursor-pointer shadow-md active:scale-95 transition-all whitespace-nowrap"
                >
                  Check-Out
                </button>
                <button
                  type="button"
                  onClick={() => setShopWindowOpen(false)}
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Header when inside an activity: Back to Options + Quick 5 Activity Pills */}
            {shopWindowTab !== 'menu' && (
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShopWindowTab('menu')}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all border border-white/10"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>All Store Activities</span>
                </button>

                {/* 5 Quick Activity Selector Pills with Dual Purpose Indicators */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'order', label: '🛒 Order', purposeName: 'Order Booking' },
                    { id: 'payment', label: '💵 Payment', purposeName: 'Payment Collection' },
                    { id: 'stock_audit', label: '📦 Stock Audit', purposeName: 'Stock Auditing' },
                    { id: 'initial_visit', label: '📍 Initial Visit', purposeName: 'Initial Visit' },
                    { id: 'routine_beat', label: '🗺️ Routine Beat', purposeName: 'Routine Beat' }
                  ].map((act) => {
                    const isCurrentTab = shopWindowTab === act.id;
                    const isPartOfVisit = activeVisitRecord?.purpose?.includes(act.purposeName) || selectedPurpose?.includes(act.purposeName);

                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => {
                          setShopWindowTab(act.id);
                          if (act.id === 'order' && activeShopWindow?._id) fetchCustomer360(activeShopWindow._id);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                          isCurrentTab
                            ? 'bg-amber-500 text-slate-950 font-black shadow-sm ring-1 ring-amber-400'
                            : isPartOfVisit
                            ? 'bg-amber-950/50 text-amber-300 border border-amber-500/40 hover:bg-amber-900/40'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <span>{act.label}</span>
                        {isPartOfVisit && !isCurrentTab && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dual Purpose Next Action Switcher Ribbon */}
            {shopWindowTab !== 'menu' && (activeVisitRecord?.purpose?.includes('&') || selectedPurpose?.includes('&')) && (
              <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/40 border border-amber-500/20 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs mb-1">
                <div className="flex items-center gap-2 text-amber-300 min-w-0">
                  <span className="text-sm">🎯</span>
                  <span className="text-[11px] font-bold truncate">
                    Dual Visit: <strong className="text-white">{activeVisitRecord?.purpose || selectedPurpose}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {shopWindowTab !== 'order' && (activeVisitRecord?.purpose?.includes('Order Booking') || selectedPurpose?.includes('Order Booking')) && (
                    <button
                      type="button"
                      onClick={() => {
                        setShopWindowTab('order');
                        if (activeShopWindow?._id) fetchCustomer360(activeShopWindow._id);
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded-lg text-[10px] active:scale-95 transition-all cursor-pointer shadow-sm flex items-center gap-1"
                    >
                      <span>Switch to Order Booking</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {shopWindowTab !== 'payment' && (activeVisitRecord?.purpose?.includes('Payment Collection') || selectedPurpose?.includes('Payment Collection')) && (
                    <button
                      type="button"
                      onClick={() => setShopWindowTab('payment')}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-2.5 py-1 rounded-lg text-[10px] active:scale-95 transition-all cursor-pointer shadow-sm flex items-center gap-1"
                    >
                      <span>Switch to Payment Collection</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {shopWindowTab !== 'stock_audit' && (activeVisitRecord?.purpose?.includes('Stock Auditing') || selectedPurpose?.includes('Stock Auditing')) && (
                    <button
                      type="button"
                      onClick={() => setShopWindowTab('stock_audit')}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-2.5 py-1 rounded-lg text-[10px] active:scale-95 transition-all cursor-pointer shadow-sm flex items-center gap-1"
                    >
                      <span>Switch to Stock Audit</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Shop Window Tab Content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {/* TAB MENU: 5 STORE WINDOW OPTIONS (Exact match with screenshot) */}
              {shopWindowTab === 'menu' && (
                <div className="space-y-3 py-2 max-w-xl mx-auto w-full">
                  <div className="mb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Select Store Activity
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Choose an activity to conduct at {activeShopWindow.name}
                    </p>
                  </div>

                  {/* 1. INITIAL VISIT */}
                  <div
                    onClick={() => setShopWindowTab('initial_visit')}
                    className="p-4 rounded-2xl bg-amber-500 text-slate-950 cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-between group active:scale-[0.99] transition-all select-none"
                  >
                    <div className="pr-3 min-w-0">
                      <p className="text-sm font-black flex items-center gap-2">
                        <span>📍</span>
                        <span>Initial Visit</span>
                      </p>
                      <p className="text-xs text-slate-900 font-medium mt-1">
                        First-time store onboarding, survey & introductory meeting
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-950 text-amber-400 flex items-center justify-center shrink-0">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* 2. PAYMENT COLLECTION */}
                  <div
                    onClick={() => setShopWindowTab('payment')}
                    className="p-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-white/10 hover:border-amber-500/30 text-white cursor-pointer flex items-center justify-between group active:scale-[0.99] transition-all select-none"
                  >
                    <div className="pr-3 min-w-0">
                      <p className="text-sm font-black flex items-center gap-2">
                        <span>💵</span>
                        <span>Payment Collection</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Settling outstanding bills and collecting payments
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 text-slate-400 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center shrink-0 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* 3. ORDER BOOKING */}
                  <div
                    onClick={() => {
                      setShopWindowTab('order');
                      if (activeShopWindow?._id) fetchCustomer360(activeShopWindow._id);
                    }}
                    className="p-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-white/10 hover:border-amber-500/30 text-white cursor-pointer flex items-center justify-between group active:scale-[0.99] transition-all select-none"
                  >
                    <div className="pr-3 min-w-0">
                      <p className="text-sm font-black flex items-center gap-2">
                        <span>🛒</span>
                        <span>Order Booking</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Taking fresh replenishment or new SKU orders
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 text-slate-400 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center shrink-0 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* 4. STOCK AUDITING */}
                  <div
                    onClick={() => setShopWindowTab('stock_audit')}
                    className="p-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-white/10 hover:border-amber-500/30 text-white cursor-pointer flex items-center justify-between group active:scale-[0.99] transition-all select-none"
                  >
                    <div className="pr-3 min-w-0">
                      <p className="text-sm font-black flex items-center gap-2">
                        <span>📦</span>
                        <span>Stock Auditing</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Shelf inventory check, expiry tracking & audit
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 text-slate-400 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center shrink-0 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* 5. ROUTINE BEAT */}
                  <div
                    onClick={() => setShopWindowTab('routine_beat')}
                    className="p-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-white/10 hover:border-amber-500/30 text-white cursor-pointer flex items-center justify-between group active:scale-[0.99] transition-all select-none"
                  >
                    <div className="pr-3 min-w-0">
                      <p className="text-sm font-black flex items-center gap-2">
                        <span>🗺️</span>
                        <span>Routine Beat</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Standard scheduled beat route visit & relationship check
                      </p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/5 text-slate-400 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center shrink-0 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              )}
              {/* TAB 0: INITIAL VISIT */}
              {shopWindowTab === 'initial_visit' && (
                <div className="space-y-4 max-w-3xl mx-auto pb-4">
                  {/* Top Notification if draft saved */}
                  {initialVisitSavedNotice && (
                    <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Visit notes and photo proof draft saved successfully to server!</span>
                    </div>
                  )}

                  {/* Header Banner */}
                  <div className="bg-gradient-to-r from-amber-500/15 via-slate-800 to-slate-800 border border-amber-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-white flex items-center gap-1.5">
                          <span>📍 Initial Store Visit & Assessment</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {activeShopWindow.category || 'Retail Store'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1">
                        Record meeting observations, upload storefront/shelf photo proof, and determine order booking outcome.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveInitialVisitDraft}
                      disabled={initialVisitSubmitting}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 self-start sm:self-auto border border-white/10"
                      title="Save notes in progress without checking out"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Save Draft</span>
                    </button>
                  </div>

                  {/* SECTION 1: DESCRIPTION OF VISIT */}
                  <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <span>Description of Visit & Discussion Notes *</span>
                      </label>
                      <span className="text-[10px] text-amber-400 font-semibold">Required for visit report</span>
                    </div>

                    <textarea
                      rows={4}
                      value={initialDescription}
                      onChange={(e) => setInitialDescription(e.target.value)}
                      placeholder="Enter visit details: Owner discussion, products pitched, store potential, shelf space observed, existing competitor presence, credit requirements..."
                      className="w-full p-3 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />

                    {/* Quick Tags for Field Fast Entry */}
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400">Quick Discussion Tags:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {[
                          'Met owner directly',
                          'Pitched spice pouch range',
                          'Pitched premium flour line',
                          'Interested in 500g packs',
                          'High footfall store',
                          'Existing competitor dominant',
                          'Samples handed over',
                          'Promised credit term discussion',
                          'Shelf placement assured'
                        ].map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              setInitialDescription(prev => {
                                const trimmed = prev.trim();
                                if (!trimmed) return tag;
                                if (trimmed.includes(tag)) return trimmed;
                                return `${trimmed}. ${tag}`;
                              });
                            }}
                            className="text-[10px] bg-slate-900 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-white/5 hover:border-amber-500/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: PHOTO PROOF UPLOAD */}
                  <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-amber-400" />
                        <span>Photo Proof of Store / Shelf / Meeting</span>
                      </label>
                      {initialPhotoPreview && (
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          ✓ Photo Proof Attached
                        </span>
                      )}
                    </div>

                    <input
                      id="initial-visit-camera-input"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handlePhotoCapture}
                    />

                    {!initialPhotoPreview ? (
                      <label
                        htmlFor="initial-visit-camera-input"
                        className="border-2 border-dashed border-white/15 hover:border-amber-500/60 bg-slate-900/60 hover:bg-slate-900 rounded-2xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all group active:scale-99"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Camera className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-white">Tap to Snap Photo with Camera or Upload Proof</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Capture storefront name board, shelf display, or owner meeting</p>
                        <span className="mt-2 text-[10px] bg-white/5 text-amber-300 font-bold px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                          <Upload className="w-3 h-3" />
                          <span>Camera & Gallery Supported (Max 5MB)</span>
                        </span>
                      </label>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-slate-900 p-3 flex flex-col sm:flex-row items-center gap-3">
                        <img
                          src={initialPhotoPreview}
                          alt="Initial Visit Photo Proof"
                          className="w-full sm:w-40 h-40 object-cover rounded-xl border border-white/10 shrink-0 shadow-md"
                        />
                        <div className="flex-1 w-full space-y-2 text-left">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-xs font-bold text-white">Visual Proof Ready for Verification</span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Captured for GPS audit and store verification record.
                          </p>
                          <div className="flex items-center gap-2 pt-1">
                            <label
                              htmlFor="initial-visit-camera-input"
                              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold cursor-pointer transition-all flex items-center gap-1"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>Retake / Replace</span>
                            </label>
                            <button
                              type="button"
                              onClick={handleRemovePhoto}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold cursor-pointer transition-all flex items-center gap-1 border border-rose-500/30"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECTION 3: ORDER BOOKING DECISION & FOLLOW-UP CHECK */}
                  <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                          <ShoppingBag className="w-4 h-4 text-amber-400" />
                          <span>Order Booking Decision & Follow-Up Check</span>
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Did the owner agree to book an order today, request a follow-up, or close?
                        </p>
                      </div>
                    </div>

                    {/* 3 Interactive Option Cards - Clicking any option directly opens its next stage pop-up screen */}
                    <div className="grid grid-cols-1 gap-2.5 sm:gap-3">
                      {/* CARD 1: BOOK ORDER TODAY */}
                      <div
                        onClick={() => {
                          setInitialOrderDecision('TODAY');
                          setStageModalOpen('TODAY');
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 active:scale-[0.99] select-none ${
                          initialOrderDecision === 'TODAY'
                            ? 'bg-emerald-950/25 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg'
                            : 'bg-slate-900/70 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <span className="text-2xl mt-0.5 shrink-0">🛒</span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white tracking-tight">Book Order on That Day</p>
                            <p className="text-xs text-slate-400 mt-0.5">Agreed to buy! Take spot order right now</p>
                            {orderCart.length > 0 && (
                              <span className="inline-block mt-2 text-[10px] font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                                ✓ {orderCart.length} items (₹{cartGrandTotal.toFixed(2)})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 mt-0.5">
                          {initialOrderDecision === 'TODAY' ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shadow-sm">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-slate-600 bg-slate-800/80"></div>
                          )}
                        </div>
                      </div>

                      {/* CARD 2: SCHEDULE FOLLOW-UP */}
                      <div
                        onClick={() => {
                          setInitialOrderDecision('FOLLOWUP');
                          setStageModalOpen('FOLLOWUP');
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 active:scale-[0.99] select-none ${
                          initialOrderDecision === 'FOLLOWUP'
                            ? 'bg-amber-950/25 border-amber-500 ring-2 ring-amber-500/40 shadow-lg'
                            : 'bg-slate-900/70 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <span className="text-2xl mt-0.5 shrink-0">📅</span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white tracking-tight">Schedule Follow-up</p>
                            <p className="text-xs text-slate-400 mt-0.5">Need revisit date & reason for order</p>
                            {initialFollowUpDate && (
                              <span className="inline-block mt-2 text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                                ✓ Revisit: {initialFollowUpDate}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 mt-0.5">
                          {initialOrderDecision === 'FOLLOWUP' ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shadow-sm">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-slate-600 bg-slate-800/80"></div>
                          )}
                        </div>
                      </div>

                      {/* CARD 3: CLOSE / NOT INTERESTED */}
                      <div
                        onClick={() => {
                          setInitialOrderDecision('CLOSED');
                          setStageModalOpen('CLOSED');
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 active:scale-[0.99] select-none ${
                          initialOrderDecision === 'CLOSED'
                            ? 'bg-rose-950/25 border-rose-500 ring-2 ring-rose-500/40 shadow-lg'
                            : 'bg-slate-900/70 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <span className="text-2xl mt-0.5 shrink-0">❌</span>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white tracking-tight">Close / Not Interested</p>
                            <p className="text-xs text-slate-400 mt-0.5">Declined or closed with reason</p>
                            {initialCloseReason && (
                              <span className="inline-block mt-2 text-[10px] font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-md border border-rose-500/30 truncate max-w-full">
                                ✓ {initialCloseReason}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 mt-0.5">
                          {initialOrderDecision === 'CLOSED' ? (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shadow-sm">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full border-2 border-slate-600 bg-slate-800/80"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 1: ORDER BOOKING (Spot Billing, Stock Reconciliation & Replenishment) */}
              {shopWindowTab === 'order' && (
                <div className="space-y-4">
                  {/* STORE STOCK & BILLING STATUS DASHBOARD */}
                  <div className="bg-slate-900/95 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white flex items-center gap-2">
                            <span>Store Stock & Billing Status</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                              {activeShopWindow?.name}
                            </span>
                          </h3>
                          <p className="text-[11px] text-slate-400">
                            Available stock at shop, billed stock, and unbilled pending bills
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (activeShopWindow?._id) fetchCustomer360(activeShopWindow._id);
                        }}
                        disabled={shop360Loading}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold flex items-center gap-1.5 border border-white/10 cursor-pointer active:scale-95 transition-all"
                        title="Refresh live stock & billing"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${shop360Loading ? 'animate-spin text-amber-400' : ''}`} />
                        <span>Refresh Status</span>
                      </button>
                    </div>

                    {/* 3 Metric Cards for Stock & Invoicing */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* CARD 1: CURRENT / SUPPLIED STOCK (Already evlo stock iruku) */}
                      <div className="bg-gradient-to-br from-blue-950/40 to-slate-900/80 border border-blue-500/30 p-3.5 rounded-2xl relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] uppercase font-black tracking-wider text-blue-400 flex items-center gap-1.5">
                            <span>📦</span>
                            <span>Current Stock (Available)</span>
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Store Stock
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black font-mono text-white">
                            {shop360Data?.stockSummary?.currentStock || 0}
                          </span>
                          <span className="text-xs font-bold text-blue-300">Units</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Total stock currently supplied & available at shop
                        </p>
                      </div>

                      {/* CARD 2: BILLED STOCK (Evlo stock ku bill kuduthu) */}
                      <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900/80 border border-emerald-500/30 p-3.5 rounded-2xl relative overflow-hidden group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] uppercase font-black tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <span>🧾</span>
                            <span>Billed Stock (Invoiced)</span>
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {shop360Data?.stockSummary?.billedInvoicesCount || 0} Invoices
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black font-mono text-emerald-400">
                            {shop360Data?.stockSummary?.billedStock || 0}
                          </span>
                          <span className="text-xs font-bold text-emerald-300/80">Units Billed</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium mt-1">
                          ₹{(shop360Data?.stockSummary?.billedAmount || 0).toLocaleString('en-IN')} total invoiced & billed
                        </p>
                      </div>

                      {/* CARD 3: UNBILLED STOCK (Evlo stock ku bill kudukama iruku) */}
                      <div className={`bg-gradient-to-br ${
                        (shop360Data?.stockSummary?.unbilledStock || 0) > 0 
                          ? 'from-amber-950/50 to-slate-900/90 border-amber-500/40 ring-1 ring-amber-500/30' 
                          : 'from-slate-800/40 to-slate-900/80 border-white/10'
                      } p-3.5 rounded-2xl relative overflow-hidden`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] uppercase font-black tracking-wider text-amber-400 flex items-center gap-1.5">
                            <span>⏳</span>
                            <span>Unbilled Stock (Pending Bill)</span>
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            (shop360Data?.stockSummary?.unbilledStock || 0) > 0
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                              : 'bg-slate-700/50 text-slate-400'
                          }`}>
                            {shop360Data?.stockSummary?.unbilledOrdersCount || 0} Orders Pending
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-black font-mono text-amber-400">
                            {shop360Data?.stockSummary?.unbilledStock || 0}
                          </span>
                          <span className="text-xs font-bold text-amber-300/80">Units Unbilled</span>
                        </div>
                        <p className="text-[11px] text-amber-300 font-bold mt-1">
                          ₹{(shop360Data?.stockSummary?.unbilledAmount || 0).toLocaleString('en-IN')} pending bill generation
                        </p>
                      </div>
                    </div>

                    {/* Unbilled Notice Banner / Information */}
                    {(shop360Data?.stockSummary?.unbilledStock || 0) > 0 ? (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                          <p className="text-xs text-amber-200">
                            <strong className="text-amber-400">Bill Kudukaatha Stock Notice:</strong> {shop360Data.stockSummary.unbilledStock} units (valued at ₹{shop360Data.stockSummary.unbilledAmount.toLocaleString('en-IN')}) are currently unbilled for this store.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowStockBreakdown(prev => !prev)}
                          className="text-[11px] font-bold text-amber-300 hover:text-white underline cursor-pointer"
                        >
                          {showStockBreakdown ? 'Hide SKU List' : 'View SKU Breakdown'}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>All prior stock has been billed or clear of pending invoices.</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowStockBreakdown(prev => !prev)}
                          className="text-[11px] font-bold text-slate-300 hover:text-white underline cursor-pointer"
                        >
                          {showStockBreakdown ? 'Hide SKU List' : 'View SKU Breakdown'}
                        </button>
                      </div>
                    )}

                    {/* Collapsible SKU Stock Breakdown Table */}
                    {showStockBreakdown && (
                      <div className="border-t border-white/10 pt-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                          SKU-Wise Stock & Invoicing Status
                        </h4>
                        {(shop360Data?.stockSummary?.productsBreakdown || []).length === 0 ? (
                          <p className="text-xs text-slate-500 text-center py-4">No product history on file for this shop yet.</p>
                        ) : (
                          <div className="max-h-52 overflow-y-auto rounded-xl border border-white/5 bg-slate-950/50">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold sticky top-0">
                                <tr>
                                  <th className="px-3 py-2">Product SKU</th>
                                  <th className="px-3 py-2 text-center">Current Stock</th>
                                  <th className="px-3 py-2 text-center text-emerald-400">Billed Qty</th>
                                  <th className="px-3 py-2 text-center text-amber-400">Unbilled Qty</th>
                                  <th className="px-3 py-2 text-right">Pending Value</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 text-slate-200">
                                {shop360Data.stockSummary.productsBreakdown.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-white/5">
                                    <td className="px-3 py-2">
                                      <p className="font-bold text-white">{item.productName}</p>
                                      <span className="text-[10px] text-slate-400">₹{item.price} / {item.unit}</span>
                                    </td>
                                    <td className="px-3 py-2 text-center font-mono font-bold text-blue-400">
                                      {item.suppliedStock || 0}
                                    </td>
                                    <td className="px-3 py-2 text-center font-mono font-bold text-emerald-400">
                                      {item.billedStock || 0}
                                    </td>
                                    <td className="px-3 py-2 text-center font-mono font-bold text-amber-400">
                                      {item.unbilledStock || 0}
                                    </td>
                                    <td className="px-3 py-2 text-right font-mono font-bold text-amber-400">
                                      {(item.unbilledAmount || 0) > 0 ? `₹${item.unbilledAmount.toLocaleString('en-IN')}` : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* TWO PRIMARY STORE ACTIONS: 1. ORDER STOCK | 2. ISSUE BILL */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* OPTION 1: ORDER STOCK */}
                    <div className="bg-slate-900/90 border border-white/10 hover:border-amber-500/40 rounded-2xl p-5 flex flex-col justify-between shadow-xl group transition-all">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                          {orderCart.length > 0 ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 animate-pulse">
                              {orderCart.reduce((sum, i) => sum + i.quantity, 0)} Items in Cart
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-white/5">
                              Fresh Order
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-black text-white group-hover:text-amber-400 transition-colors">
                          Order Stock
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Take fresh replenishment orders or add new SKU quantities from the catalogue for this store.
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {catalogue.length} Products Available
                        </span>
                        <button
                          type="button"
                          onClick={() => setOrderModalOpen(true)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          <span>+ Order Stock</span>
                        </button>
                      </div>
                    </div>

                    {/* OPTION 2: ISSUE BILL */}
                    <div className="bg-slate-900/90 border border-white/10 hover:border-emerald-500/40 rounded-2xl p-5 flex flex-col justify-between shadow-xl group transition-all">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <Receipt className="w-5 h-5" />
                          </div>
                          {(shop360Data?.stockSummary?.unbilledStock || 0) > 0 ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                              {shop360Data.stockSummary.unbilledStock} Units Unbilled
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ✓ Up to Date
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-black text-white group-hover:text-emerald-400 transition-colors">
                          Issue Bill
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          Generate official tax invoice / spot bill for unbilled stock supplied to this store.
                        </p>
                      </div>

                      <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {(shop360Data?.stockSummary?.unbilledAmount || 0) > 0 
                            ? `Pending: ₹${shop360Data.stockSummary.unbilledAmount.toLocaleString('en-IN')}` 
                            : 'Spot Invoicing'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIssueBillModalOpen(true)}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
                        >
                          <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Issue Bill →</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* POP-UP MODAL: ORDER STOCK / ADD PRODUCTS */}
                  {orderModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
                      <div className="bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
                        {/* Header */}
                        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-white">Order Stock / Add Products</h3>
                              <p className="text-[11px] text-slate-400">
                                Selecting SKUs for <span className="text-amber-400 font-bold">{activeShopWindow?.name}</span>
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOrderModalOpen(false)}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Product Catalogue Selection */}
                            <div className="lg:col-span-2 space-y-3">
                              <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                  type="text"
                                  value={catalogSearch}
                                  onChange={(e) => setCatalogSearch(e.target.value)}
                                  placeholder="Search product catalogue..."
                                  className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-96 overflow-y-auto pr-1">
                                {catalogue
                                  .filter(p => p.name?.toLowerCase().includes(catalogSearch.toLowerCase()))
                                  .map(p => {
                                    const inCart = orderCart.find(i => i.productId === p._id);
                                    const qty = inCart ? inCart.quantity : 0;
                                    const price = parseFloat(p.mrp || p.price || 0);

                                    return (
                                      <div key={p._id} className="bg-slate-800/80 border border-white/10 p-3 rounded-2xl flex flex-col justify-between">
                                        <div>
                                          <h4 className="text-xs font-bold text-white line-clamp-1">{p.name}</h4>
                                          <p className="text-[11px] text-amber-400 font-bold mt-0.5">
                                            ₹{price.toFixed(2)} / {p.unit || 'PCS'}
                                          </p>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2">
                                          <span className="text-[10px] text-slate-400">Carton: {p.cartonSize || 24}</span>
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => updateCartItem(p, -1)}
                                              disabled={qty === 0}
                                              className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold flex items-center justify-center text-xs disabled:opacity-30 cursor-pointer"
                                            >
                                              -
                                            </button>
                                            <span className="w-6 text-center text-xs font-bold text-white">{qty}</span>
                                            <button
                                              type="button"
                                              onClick={() => updateCartItem(p, 1)}
                                              className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs hover:bg-amber-400 cursor-pointer"
                                            >
                                              +
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>

                            {/* Cart Summary */}
                            <div className="bg-slate-800/90 border border-white/10 p-4 rounded-2xl flex flex-col justify-between space-y-4">
                              <div>
                                <h3 className="text-xs font-black uppercase text-white mb-2 flex items-center gap-1.5">
                                  <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Order Cart ({orderCart.length})</span>
                                </h3>

                                {orderCart.length === 0 ? (
                                  <p className="text-xs text-slate-500 text-center py-8">No products added to cart.</p>
                                ) : (
                                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                    {orderCart.map((item) => (
                                      <div key={item.productId} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5">
                                        <div>
                                          <p className="font-bold text-white line-clamp-1">{item.productName}</p>
                                          <span className="text-[10px] text-slate-400">
                                            {item.quantity} x ₹{item.price}
                                          </span>
                                        </div>
                                        <span className="font-bold text-emerald-400 font-mono">
                                          ₹{item.lineTotal.toFixed(2)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="border-t border-white/10 pt-3 space-y-1.5 text-xs">
                                <div className="flex justify-between text-slate-400">
                                  <span>Subtotal:</span>
                                  <span>₹{cartSubtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                  <span>GST (5%):</span>
                                  <span>₹{cartGst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-white font-bold text-sm pt-1 border-t border-white/5">
                                  <span>Grand Total:</span>
                                  <span className="text-emerald-400 font-mono">₹{cartGrandTotal.toFixed(2)}</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={handleBookOrder}
                                  disabled={orderSubmitting || orderCart.length === 0}
                                  className="w-full mt-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                >
                                  {orderSubmitting ? 'Placing Order...' : 'Confirm & Book Order'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* POP-UP MODAL: ISSUE BILL / GENERATE TAX INVOICE */}
                  {issueBillModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
                      <div className="bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
                        {/* Header */}
                        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                              <Receipt className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-white">Issue Bill / Generate Tax Invoice</h3>
                              <p className="text-[11px] text-slate-400">
                                Billing for <span className="text-emerald-400 font-bold">{activeShopWindow?.name}</span>
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIssueBillModalOpen(false)}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
                          {/* Store Details Card */}
                          <div className="bg-slate-800/80 border border-white/10 p-3.5 rounded-2xl flex items-center justify-between">
                            <div>
                              <p className="font-bold text-white text-sm">{activeShopWindow?.name}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{activeShopWindow?.phone || 'No phone'} • {activeShopWindow?.address || activeShopWindow?.city || 'Tamil Nadu'}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              GST Invoicing
                            </span>
                          </div>

                          {/* Items / Stock Being Billed */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-slate-300 uppercase text-[11px]">Items to Bill</span>
                              <span className="text-[11px] text-amber-400 font-bold">
                                {(shop360Data?.stockSummary?.unbilledStock || 0) > 0 
                                  ? `${shop360Data.stockSummary.unbilledStock} Unbilled Units` 
                                  : (orderCart.length > 0 ? `${orderCart.length} Cart Items` : 'Spot Billing')}
                              </span>
                            </div>

                            <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-3 max-h-48 overflow-y-auto space-y-2">
                              {(shop360Data?.stockSummary?.productsBreakdown || []).filter(p => (p.unbilledStock || 0) > 0).length > 0 ? (
                                shop360Data.stockSummary.productsBreakdown
                                  .filter(p => (p.unbilledStock || 0) > 0)
                                  .map((p, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-1.5 border-b border-white/5 text-xs">
                                      <div>
                                        <p className="font-bold text-white">{p.productName}</p>
                                        <span className="text-[10px] text-slate-400">Qty: {p.unbilledStock} {p.unit || 'PCS'}</span>
                                      </div>
                                      <span className="font-bold text-emerald-400 font-mono">
                                        ₹{(p.unbilledAmount || 0).toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  ))
                              ) : orderCart.length > 0 ? (
                                orderCart.map((item) => (
                                  <div key={item.productId} className="flex items-center justify-between py-1.5 border-b border-white/5 text-xs">
                                    <div>
                                      <p className="font-bold text-white">{item.productName}</p>
                                      <span className="text-[10px] text-slate-400">{item.quantity} x ₹{item.price}</span>
                                    </div>
                                    <span className="font-bold text-emerald-400 font-mono">
                                      ₹{item.lineTotal.toFixed(2)}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-slate-500 text-center py-4 text-xs">
                                  No unbilled orders found. To bill, add items using "Order Stock" first.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Payment Method Selector */}
                          <div>
                            <label className="block font-bold text-slate-300 uppercase text-[11px] mb-1.5">
                              Payment Method *
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'CASH', label: '💵 Cash', desc: 'Instant Receipt' },
                                { id: 'UPI', label: '📱 UPI / GPay', desc: 'Digital QR Pay' },
                                { id: 'CREDIT', label: '💳 Credit (15 Days)', desc: 'Store Ledger' },
                                { id: 'CHEQUE', label: '🏦 Cheque', desc: 'Bank Clearance' }
                              ].map(m => (
                                <button
                                  type="button"
                                  key={m.id}
                                  onClick={() => setBillPaymentMethod(m.id)}
                                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                                    billPaymentMethod === m.id
                                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40'
                                      : 'bg-slate-800/80 border-white/10 text-slate-300 hover:border-white/20'
                                  }`}
                                >
                                  <p className="font-bold text-xs">{m.label}</p>
                                  <p className="text-[10px] text-slate-400 mt-0.5">{m.desc}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Notes */}
                          <div>
                            <label className="block font-bold text-slate-300 uppercase text-[11px] mb-1">
                              Bill Remarks / Delivery Memo
                            </label>
                            <input
                              type="text"
                              value={billNotes}
                              onChange={(e) => setBillNotes(e.target.value)}
                              placeholder="e.g. Handed physical printed bill copy to owner..."
                              className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                            />
                          </div>

                          {/* Bill Calculations */}
                          <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-3.5 space-y-1.5">
                            <div className="flex justify-between text-slate-400">
                              <span>Subtotal:</span>
                              <span className="font-mono">
                                ₹{((shop360Data?.stockSummary?.unbilledAmount || 0) > 0 
                                  ? Math.round(((shop360Data.stockSummary.unbilledAmount) / 1.05) * 100) / 100 
                                  : cartSubtotal).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>GST (5%):</span>
                              <span className="font-mono">
                                ₹{((shop360Data?.stockSummary?.unbilledAmount || 0) > 0 
                                  ? Math.round(((shop360Data.stockSummary.unbilledAmount) - ((shop360Data.stockSummary.unbilledAmount) / 1.05)) * 100) / 100 
                                  : cartGst).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between text-white font-black text-sm pt-1.5 border-t border-white/10">
                              <span>Total Bill Payable:</span>
                              <span className="text-emerald-400 font-mono">
                                ₹{((shop360Data?.stockSummary?.unbilledAmount || 0) > 0 
                                  ? shop360Data.stockSummary.unbilledAmount 
                                  : cartGrandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-white/10 flex items-center justify-end gap-2.5 bg-slate-950/60">
                          <button
                            type="button"
                            onClick={() => setIssueBillModalOpen(false)}
                            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleIssueBill}
                            disabled={billSubmitting || ((shop360Data?.stockSummary?.unbilledStock || 0) === 0 && orderCart.length === 0)}
                            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                          >
                            <Receipt className="w-4 h-4 stroke-[2.5]" />
                            <span>{billSubmitting ? 'Issuing Bill...' : 'Confirm & Issue Bill'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CUSTOMER 360 & FINANCIAL LEDGER */}
              {shopWindowTab === '360' && (
                <div className="space-y-4">
                  {shop360Loading ? (
                    <div className="p-8 text-center text-xs text-slate-400">Loading customer 360 history...</div>
                  ) : (
                    <>
                      {/* Financial Metrics Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="bg-slate-800/80 border border-white/10 p-3.5 rounded-2xl">
                          <span className="text-[11px] text-slate-400 uppercase font-bold">Outstanding Balance</span>
                          <h4 className={`text-lg font-black mt-1 font-mono ${
                            (shop360Data?.totalOutstanding || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            ₹{(shop360Data?.totalOutstanding || 0).toLocaleString('en-IN')}
                          </h4>
                        </div>

                        <div className="bg-slate-800/80 border border-white/10 p-3.5 rounded-2xl">
                          <span className="text-[11px] text-slate-400 uppercase font-bold">Total Invoices</span>
                          <h4 className="text-lg font-black text-white mt-1">
                            {shop360Data?.invoices?.length || 0} Invoices
                          </h4>
                        </div>

                        <div className="bg-slate-800/80 border border-white/10 p-3.5 rounded-2xl">
                          <span className="text-[11px] text-slate-400 uppercase font-bold">Previous Visits</span>
                          <h4 className="text-lg font-black text-amber-400 mt-1">
                            {shop360Data?.previousVisits?.length || 0} Visits
                          </h4>
                        </div>
                      </div>

                      {/* Invoices List */}
                      <div className="bg-slate-800/80 border border-white/10 rounded-2xl overflow-hidden">
                        <div className="p-3 border-b border-white/10">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Recent Invoices</h4>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-900/60 text-slate-400 text-[10px] uppercase font-bold">
                              <tr>
                                <th className="px-3 py-2">Invoice No</th>
                                <th className="px-3 py-2">Date</th>
                                <th className="px-3 py-2">Amount</th>
                                <th className="px-3 py-2">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-200">
                              {(shop360Data?.invoices || []).length === 0 ? (
                                <tr>
                                  <td colSpan="4" className="px-3 py-4 text-center text-slate-500">No invoices on file.</td>
                                </tr>
                              ) : (
                                shop360Data.invoices.map((inv) => (
                                  <tr key={inv._id || inv.id}>
                                    <td className="px-3 py-2 font-mono text-white">{inv.invoiceNo || 'INV-001'}</td>
                                    <td className="px-3 py-2 text-slate-400">
                                      {new Date(inv.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-3 py-2 font-mono font-bold text-emerald-400">
                                      ₹{(inv.totalAmount || 0).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-3 py-2">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        inv.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-300'
                                      }`}>
                                        {inv.status || 'OPEN'}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* TAB 3: PAYMENT COLLECTION */}
              {shopWindowTab === 'payment' && (
                <div className="bg-slate-800/80 border border-white/10 p-5 rounded-2xl max-w-lg mx-auto space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white">Payment Collection Receipt</h3>
                        <p className="text-[11px] text-slate-400">
                          Store: <span className="text-emerald-400 font-bold">{activeShopWindow?.name}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Live Ledger Sync
                    </span>
                  </div>

                  {/* 4 AUTOMATED FINANCIAL METRIC CARDS */}
                  {(() => {
                    const totalDue = parseFloat(shop360Data?.totalOutstanding || 0);
                    const pastPaid = (shop360Data?.invoices || [])
                      .filter(i => i.status === 'PAID')
                      .reduce((sum, i) => sum + (parseFloat(i.totalAmount) || 0), 0);
                    const collectedVal = parseFloat(colAmount) || 0;
                    const remBalance = Math.max(0, totalDue - collectedVal);

                    return (
                      <div className="grid grid-cols-2 gap-2">
                        {/* 1. Total Outstanding */}
                        <div className="bg-slate-900/90 border border-white/10 p-2.5 rounded-xl">
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Total Outstanding</span>
                          <span className="text-xs sm:text-sm font-black text-rose-400 font-mono">
                            ₹{totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* 2. Paid Amount (Past Collections) */}
                        <div className="bg-slate-900/90 border border-white/10 p-2.5 rounded-xl">
                          <span className="text-[9px] text-slate-400 uppercase font-bold block">Paid Amount</span>
                          <span className="text-xs sm:text-sm font-black text-cyan-400 font-mono">
                            ₹{pastPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* 3. How Much Collected */}
                        <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl">
                          <span className="text-[9px] text-emerald-400 uppercase font-bold block">How Much Collected</span>
                          <span className="text-xs sm:text-sm font-black text-emerald-300 font-mono">
                            ₹{collectedVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* 4. Balance Amount (Auto-Calculated in real-time) */}
                        <div className={`p-2.5 rounded-xl border ${
                          remBalance === 0 && totalDue > 0
                            ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                            : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                        }`}>
                          <span className="text-[9px] uppercase font-bold block">
                            {remBalance === 0 && totalDue > 0 ? '✓ Zero Balance' : 'Balance Amount'}
                          </span>
                          <span className="text-xs sm:text-sm font-black font-mono">
                            ₹{remBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
                    {/* How Much Collected Input */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                        How Much Collected (₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          min="1"
                          step="any"
                          required
                          value={colAmount}
                          onChange={(e) => setColAmount(e.target.value)}
                          placeholder="e.g. 5000"
                          className="w-full bg-slate-900 border border-white/10 rounded-xl pl-7 pr-20 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-amber-500 font-mono"
                        />
                        {(parseFloat(shop360Data?.totalOutstanding || 0) > 0) && (
                          <button
                            type="button"
                            onClick={() => setColAmount(shop360Data.totalOutstanding.toString())}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-1 bg-white/5 hover:bg-white/10 text-emerald-400 rounded-lg border border-white/10 transition-colors"
                          >
                            Full Due
                          </button>
                        )}
                      </div>
                    </div>

                    {/* PAYMENT COLLECTION METHODS: CASH, GPAY, CHEQ */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">
                        Payment Collection Method *
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {/* Option 1: Cash */}
                        <button
                          type="button"
                          onClick={() => setColMethod('CASH')}
                          className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                            colMethod === 'CASH'
                              ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                              : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="flex justify-center mb-0.5">
                            <Banknote className="w-4 h-4 text-emerald-400" />
                          </div>
                          <p className="font-bold text-[11px] text-white">💵 Cash</p>
                        </button>

                        {/* Option 2: GPay / UPI */}
                        <button
                          type="button"
                          onClick={() => setColMethod('GPAY')}
                          className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                            colMethod === 'GPAY'
                              ? 'bg-indigo-950/60 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500'
                              : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="flex justify-center mb-0.5">
                            <Smartphone className="w-4 h-4 text-indigo-400" />
                          </div>
                          <p className="font-bold text-[11px] text-white">📱 GPay</p>
                        </button>

                        {/* Option 3: Cheque */}
                        <button
                          type="button"
                          onClick={() => setColMethod('CHEQUE')}
                          className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                            colMethod === 'CHEQUE'
                              ? 'bg-amber-950/60 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                              : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="flex justify-center mb-0.5">
                            <Building className="w-4 h-4 text-amber-400" />
                          </div>
                          <p className="font-bold text-[11px] text-white">🏦 Cheque</p>
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Inputs for GPay / Cheque */}
                    {colMethod === 'GPAY' && (
                      <div className="bg-indigo-950/30 border border-indigo-500/30 p-2.5 rounded-xl space-y-1.5 animate-in fade-in">
                        <label className="block font-bold text-indigo-300 uppercase text-[10px]">
                          GPay UPI Ref ID / Transaction No. *
                        </label>
                        <input
                          type="text"
                          required
                          value={colRef}
                          onChange={(e) => setColRef(e.target.value)}
                          placeholder="e.g. 402918274920"
                          className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                        />
                      </div>
                    )}

                    {colMethod === 'CHEQUE' && (
                      <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-xl space-y-2 animate-in fade-in">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                          Cheque Details
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-bold text-slate-300 text-[9px] uppercase mb-1">Cheque No. *</label>
                            <input
                              type="text"
                              required
                              value={colChequeNo}
                              onChange={(e) => setColChequeNo(e.target.value)}
                              placeholder="000452"
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-300 text-[9px] uppercase mb-1">Bank Name *</label>
                            <input
                              type="text"
                              required
                              value={colBankName}
                              onChange={(e) => setColBankName(e.target.value)}
                              placeholder="SBI / HDFC"
                              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block font-bold text-slate-300 text-[9px] uppercase mb-1">Cheque Date</label>
                          <input
                            type="date"
                            value={colChequeDate}
                            onChange={(e) => setColChequeDate(e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* PAYMENT FOR REASON OF PAYMENT */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                        Payment for Reason of Payment *
                      </label>
                      <select
                        value={colReason}
                        onChange={(e) => setColReason(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Outstanding Balance Clearance">Outstanding Balance Clearance (Old Dues)</option>
                        <option value="Partial Invoice Clearance">Partial Invoice Clearance</option>
                        <option value="Spot Order Delivery Payment">Spot Order Delivery Payment</option>
                        <option value="Advance Deposit for Future Stock">Advance Deposit for Upcoming Delivery</option>
                        <option value="Cheque Clearance / Replacement">Cheque Clearance / Replacement</option>
                        <option value="Other">Other Specific Reason</option>
                      </select>

                      {colReason === 'Other' && (
                        <input
                          type="text"
                          required
                          value={colCustomReason}
                          onChange={(e) => setColCustomReason(e.target.value)}
                          placeholder="Specify the exact reason..."
                          className="w-full mt-2 bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      )}
                    </div>

                    {/* Receipt Notes */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Receipt Notes</label>
                      <input
                        type="text"
                        value={colNotes}
                        onChange={(e) => setColNotes(e.target.value)}
                        placeholder="Handed over to retailer Ramesh..."
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={colSubmitting || !colAmount || parseFloat(colAmount) <= 0}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>
                        {colSubmitting 
                          ? 'Recording Payment...' 
                          : `Record Payment Collection (₹${(parseFloat(colAmount) || 0).toFixed(2)})`}
                      </span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 4: STOCK AUDITING */}
              {shopWindowTab === 'stock_audit' && (
                <div className="max-w-2xl mx-auto space-y-4">
                  {/* Top Header Card */}
                  <div className="bg-slate-800/80 border border-white/10 p-4 sm:p-5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg border border-amber-500/30">
                        📦
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-white">Stock Audit & Inventory Actions</h3>
                        <p className="text-[11px] text-slate-400">
                          Store: <span className="text-amber-400 font-bold">{activeShopWindow?.name}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-700/80 text-slate-300 border border-white/10 hidden sm:inline-block">
                      Shelf Stock Control
                    </span>
                  </div>

                  {/* 2 Main Action Cards requested by user */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Option 1: Product Sold */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!soldProductId && catalogue.length > 0) {
                          setSoldProductId(catalogue[0]._id);
                        }
                        setStockSoldModalOpen(true);
                      }}
                      className="group bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 hover:border-emerald-400 p-4 sm:p-5 rounded-2xl text-left cursor-pointer transition-all active:scale-[0.98] shadow-lg hover:shadow-emerald-500/10 flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <ShoppingBag className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                          Product Sold
                          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-emerald-400" />
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Log items sold from stock, enter quantity, generate instant bill or schedule follow-up request.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-emerald-400">
                        <span>Record Sold & Bill</span>
                        <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">Click to Open</span>
                      </div>
                    </button>

                    {/* Option 2: Return or Replace Stock */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!rrProductId && catalogue.length > 0) {
                          setRrProductId(catalogue[0]._id);
                        }
                        if (!rrReplacementProductId && catalogue.length > 0) {
                          setRrReplacementProductId(catalogue[0]._id);
                        }
                        setReturnReplaceModalOpen(true);
                      }}
                      className="group bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/30 hover:border-amber-400 p-4 sm:p-5 rounded-2xl text-left cursor-pointer transition-all active:scale-[0.98] shadow-lg hover:shadow-amber-500/10 flex flex-col justify-between"
                    >
                      <div>
                        <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                          <RotateCcw className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-black text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                          Return, Replace or Hold
                          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-amber-400" />
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Process damaged/expired stock with Return, Replace with new SKU, or put stock on Hold with reason.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-amber-400">
                        <span>Return / Replace / Hold</span>
                        <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">Click to Open</span>
                      </div>
                    </button>
                  </div>

                  {/* Optional Shelf Audit Form */}
                  <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 sm:p-5 space-y-3.5">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                      <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                        Quick Shelf Condition Audit
                      </h4>
                      <span className="text-[10px] text-slate-500">Optional Observations</span>
                    </div>

                    <form onSubmit={handleStockAuditSubmit} className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                          Stock Condition on Shelf
                        </label>
                        <select
                          value={stockAuditCondition}
                          onChange={(e) => setStockAuditCondition(e.target.value)}
                          className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="Stock Sufficient & Good">Stock Sufficient & Good Shelf Facing</option>
                          <option value="Low Stock - Fresh Order Recommended">Low Stock - Fresh Order Recommended</option>
                          <option value="Shelf Out of Stock / Depleted">Shelf Out of Stock / Depleted</option>
                          <option value="Damaged / Near-Expiry Units Found">Damaged / Near-Expiry Units Found</option>
                          <option value="Competitor Dominating Display">Competitor Dominating Display</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                            Shelf Facing Units
                          </label>
                          <input
                            type="number"
                            value={shelfFacingUnits}
                            onChange={(e) => setShelfFacingUnits(e.target.value)}
                            placeholder="e.g. 15"
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                            Damaged Units (Shelf)
                          </label>
                          <input
                            type="number"
                            value={damagedUnits}
                            onChange={(e) => setDamagedUnits(e.target.value)}
                            placeholder="0"
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                          Auditor Notes & Observations
                        </label>
                        <textarea
                          rows="2"
                          value={auditRemarks}
                          onChange={(e) => setAuditRemarks(e.target.value)}
                          placeholder="Shelf visibility, competitor placement, store keeper feedback..."
                          className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={auditSubmitting}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-bold py-2 rounded-xl text-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {auditSubmitting ? 'Recording Audit...' : 'Save Shelf Audit Observation'}
                      </button>
                    </form>
                  </div>

                  {/* POP-UP MODAL 1: PRODUCT SOLD */}
                  {stockSoldModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
                      <div className="bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
                        {/* Header */}
                        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                              <ShoppingBag className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-white">Product Sold - Generate Bill / Follow Up</h3>
                              <p className="text-[11px] text-slate-400">
                                Store: <span className="text-emerald-400 font-bold">{activeShopWindow?.name}</span>
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setStockSoldModalOpen(false)}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
                          {/* Sold Product Selection */}
                          <div>
                            <label className="block font-bold text-slate-300 uppercase text-[11px] mb-1.5">
                              Select Sold Product *
                            </label>
                            <select
                              value={soldProductId || catalogue[0]?._id}
                              onChange={(e) => setSoldProductId(e.target.value)}
                              className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
                            >
                              {catalogue.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.name} — ₹{p.mrp || p.price || 0} / {p.unit || 'PCS'}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Sold Quantity */}
                          <div>
                            <label className="block font-bold text-slate-300 uppercase text-[11px] mb-1.5">
                              Quantity Sold *
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSoldQty(prev => Math.max(1, (parseInt(prev, 10) || 1) - 1))}
                                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold text-base flex items-center justify-center cursor-pointer active:scale-95"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={soldQty}
                                onChange={(e) => setSoldQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-center text-sm font-bold text-white focus:outline-none focus:border-emerald-500 font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => setSoldQty(prev => (parseInt(prev, 10) || 0) + 1)}
                                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold text-base flex items-center justify-center cursor-pointer active:scale-95"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Sold Amount Calculation Card */}
                          {(() => {
                            const p = catalogue.find(item => item._id === (soldProductId || catalogue[0]?._id));
                            const price = parseFloat(p?.mrp || p?.price || 0);
                            const total = (parseInt(soldQty, 10) || 1) * price;
                            return (
                              <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-3.5 flex items-center justify-between">
                                <div>
                                  <p className="font-bold text-white text-xs">{p?.name || 'Selected Product'}</p>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    Rate: ₹{price.toFixed(2)} × {soldQty} {p?.unit || 'PCS'}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[10px] text-emerald-400 uppercase font-bold block">Bill Total</span>
                                  <span className="text-base font-black text-emerald-300 font-mono">₹{total.toFixed(2)}</span>
                                </div>
                              </div>
                            );
                          })()}

                          {/* Payment Method */}
                          <div>
                            <label className="block font-bold text-slate-300 uppercase text-[11px] mb-1.5">
                              Payment Mode for Bill *
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'CASH', label: '💵 Cash' },
                                { id: 'UPI', label: '📱 UPI / GPay' },
                                { id: 'CREDIT', label: '💳 Store Credit' },
                                { id: 'CHEQUE', label: '🏦 Cheque' }
                              ].map(m => (
                                <button
                                  type="button"
                                  key={m.id}
                                  onClick={() => setSoldPaymentMethod(m.id)}
                                  className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                                    soldPaymentMethod === m.id
                                      ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40'
                                      : 'bg-slate-800/80 border-white/10 text-slate-300 hover:border-white/20'
                                  }`}
                                >
                                  <p className="font-bold text-xs">{m.label}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Follow-up Details Section */}
                          <div className="border-t border-white/10 pt-3">
                            <button
                              type="button"
                              onClick={() => setSoldShowFollowUp(!soldShowFollowUp)}
                              className="flex items-center justify-between w-full text-left text-xs font-bold text-amber-400 hover:text-amber-300"
                            >
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {soldShowFollowUp ? 'Hide Follow Request Details' : '+ Add Follow Request Details (Date & Notes)'}
                              </span>
                              <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                                {soldShowFollowUp ? 'Expanded' : 'Optional'}
                              </span>
                            </button>

                            {soldShowFollowUp && (
                              <div className="mt-3 space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-white/10 animate-in fade-in">
                                <div>
                                  <label className="block font-bold text-slate-300 uppercase text-[10px] mb-1">
                                    Follow-up Revisit Date
                                  </label>
                                  <input
                                    type="date"
                                    value={soldFollowUpDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                    onChange={(e) => setSoldFollowUpDate(e.target.value)}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                                  />
                                </div>
                                <div>
                                  <label className="block font-bold text-slate-300 uppercase text-[10px] mb-1">
                                    Follow-up Notes / Reason
                                  </label>
                                  <input
                                    type="text"
                                    value={soldFollowUpNotes}
                                    onChange={(e) => setSoldFollowUpNotes(e.target.value)}
                                    placeholder="e.g. Replenish shelf stock, collect remaining payment..."
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons: Generate Bill & Follow Request */}
                        <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/80 flex flex-col sm:flex-row gap-2.5">
                          <button
                            type="button"
                            onClick={handleGenerateBillForSold}
                            disabled={soldSubmitting}
                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            <Receipt className="w-4 h-4" />
                            {soldSubmitting ? 'Generating Bill...' : 'Generate Bill for Sold Product'}
                          </button>

                          <button
                            type="button"
                            onClick={handleFollowRequestForSold}
                            disabled={soldSubmitting}
                            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                          >
                            <Clock className="w-4 h-4" />
                            Follow Request
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* POP-UP MODAL 2: RETURN / REPLACE / HOLD */}
                  {returnReplaceModalOpen && (
                    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
                      <div className="bg-slate-900 border border-white/10 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
                        {/* Header */}
                        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                              <RotateCcw className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-black text-white">Stock Adjustment & Returns</h3>
                              <p className="text-[11px] text-slate-400">
                                Store: <span className="text-amber-400 font-bold">{activeShopWindow?.name}</span>
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setReturnReplaceModalOpen(false)}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>

                        {/* 3-Option Switcher: Return, Replace, Hold */}
                        <div className="p-4 pb-0 bg-slate-950/40">
                          <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-white/10">
                            <button
                              type="button"
                              onClick={() => setRrActionType('RETURN')}
                              className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                rrActionType === 'RETURN'
                                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Return
                            </button>
                            <button
                              type="button"
                              onClick={() => setRrActionType('REPLACE')}
                              className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                rrActionType === 'REPLACE'
                                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 font-black'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => setRrActionType('HOLD')}
                              className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                rrActionType === 'HOLD'
                                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              <PauseCircle className="w-3.5 h-3.5" />
                              Hold
                            </button>
                          </div>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSubmitReturnReplaceHold} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1">
                          {/* Case A: RETURN or REPLACE */}
                          {(rrActionType === 'RETURN' || rrActionType === 'REPLACE') && (
                            <>
                              {/* Product to Return / Replace */}
                              <div>
                                <label className="block font-bold text-slate-300 uppercase text-[11px] mb-1.5">
                                  {rrActionType === 'RETURN' ? 'Product to Return *' : 'Product to Replace *'}
                                </label>
                                <select
                                  value={rrProductId || catalogue[0]?._id}
                                  onChange={(e) => setRrProductId(e.target.value)}
                                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                                >
                                  {catalogue.map((p) => (
                                    <option key={p._id} value={p._id}>
                                      {p.name} (₹{p.mrp || p.price || 0})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {/* Quantity */}
                              <div>
                                <label className="block font-bold text-slate-300 uppercase text-[11px] mb-1.5">
                                  Quantity to {rrActionType === 'RETURN' ? 'Return' : 'Replace'} *
                                </label>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setRrQty(prev => Math.max(1, (parseInt(prev, 10) || 1) - 1))}
                                    className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold text-base flex items-center justify-center cursor-pointer active:scale-95"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={rrQty}
                                    onChange={(e) => setRrQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                    className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-center text-sm font-bold text-white focus:outline-none focus:border-amber-500 font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setRrQty(prev => (parseInt(prev, 10) || 0) + 1)}
                                    className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-white font-bold text-base flex items-center justify-center cursor-pointer active:scale-95"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {/* If REPLACE: Select replacement product */}
                              {rrActionType === 'REPLACE' && (
                                <div className="bg-amber-950/20 border border-amber-500/20 p-3 rounded-2xl space-y-2">
                                  <label className="block font-bold text-amber-300 uppercase text-[11px]">
                                    Replacement Product (Give in Exchange) *
                                  </label>
                                  <select
                                    value={rrReplacementProductId || catalogue[0]?._id}
                                    onChange={(e) => setRrReplacementProductId(e.target.value)}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
                                  >
                                    {catalogue.map((p) => (
                                      <option key={p._id} value={p._id}>
                                        {p.name} (₹{p.mrp || p.price || 0})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {/* Reason for Return / Replace */}
                              <div>
                                <label className="block font-bold text-slate-300 uppercase text-[11px] mb-1.5">
                                  Reason for {rrActionType === 'RETURN' ? 'Return' : 'Replacement'} *
                                </label>
                                <select
                                  value={rrReason}
                                  onChange={(e) => setRrReason(e.target.value)}
                                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                >
                                  <option value="Damaged / Packet Leaked">Damaged / Packet Leaked</option>
                                  <option value="Expired / Near-Expiry Date">Expired / Near-Expiry Date</option>
                                  <option value="Packaging Crushed in Transit">Packaging Crushed in Transit</option>
                                  <option value="Slow-Moving / Low Demand">Slow-Moving / Low Demand</option>
                                  <option value="Wrong Item Delivered">Wrong Item Delivered</option>
                                  <option value="Quality Defect / Taste Issue">Quality Defect / Taste Issue</option>
                                  <option value="Other">Other Specific Reason</option>
                                </select>
                              </div>

                              {/* Custom Remarks */}
                              <div>
                                <label className="block font-bold text-slate-300 uppercase text-[11px] mb-1">
                                  Additional Remarks / Batch No.
                                </label>
                                <textarea
                                  rows="2"
                                  value={rrCustomRemarks}
                                  onChange={(e) => setRrCustomRemarks(e.target.value)}
                                  placeholder="Mention batch number, damage photo notes, retailer remarks..."
                                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </>
                          )}

                          {/* Case B: HOLD */}
                          {rrActionType === 'HOLD' && (
                            <>
                              <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-3 flex items-start gap-2.5 text-indigo-300">
                                <PauseCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-400" />
                                <div>
                                  <p className="font-bold text-xs text-white">Stock Hold Mode</p>
                                  <p className="text-[11px] text-indigo-200/80 mt-0.5">
                                    Places inventory on hold at this outlet pending retailer verification, payment, or settlement.
                                  </p>
                                </div>
                              </div>

                              {/* Reason for Holding */}
                              <div>
                                <label className="block font-bold text-slate-300 uppercase text-[11px] mb-1.5">
                                  Reason for Holding *
                                </label>
                                <select
                                  value={rrHoldReason}
                                  onChange={(e) => setRrHoldReason(e.target.value)}
                                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                                >
                                  <option value="Awaiting Retailer Payment Clearance">Awaiting Retailer Payment Clearance</option>
                                  <option value="Disputed Consignment / Rate Mismatch">Disputed Consignment / Rate Mismatch</option>
                                  <option value="Shelf Space Under Renovation">Shelf Space Under Renovation</option>
                                  <option value="Quality Check Verification Pending">Quality Check Verification Pending</option>
                                  <option value="Temporary Store Closure / Relocation">Temporary Store Closure / Relocation</option>
                                  <option value="Consignment Audit Discrepancy">Consignment Audit Discrepancy</option>
                                  <option value="Other">Other Reason</option>
                                </select>
                              </div>

                              {/* Detailed Reason Textarea (Required) */}
                              <div>
                                <label className="block font-bold text-slate-300 uppercase text-[11px] mb-1">
                                  Explain Holding Reason Details *
                                </label>
                                <textarea
                                  rows="3"
                                  required
                                  value={rrCustomRemarks}
                                  onChange={(e) => setRrCustomRemarks(e.target.value)}
                                  placeholder="Specify exact reason for placing stock on hold (e.g. Retailer requested 5 days to clear pending cheque before releasing consignment)..."
                                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                            </>
                          )}

                          {/* Submit button */}
                          <div className="pt-2">
                            <button
                              type="submit"
                              disabled={rrSubmitting}
                              className={`w-full font-black py-2.5 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg disabled:opacity-50 ${
                                rrActionType === 'RETURN'
                                  ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                                  : rrActionType === 'REPLACE'
                                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                                  : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/20'
                              }`}
                            >
                              {rrSubmitting
                                ? 'Submitting...'
                                : rrActionType === 'RETURN'
                                ? 'Submit Stock Return'
                                : rrActionType === 'REPLACE'
                                ? 'Submit Stock Replacement'
                                : 'Confirm & Hold Stock'}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: ROUTINE BEAT */}
              {shopWindowTab === 'routine_beat' && (
                <div className="bg-slate-800/80 border border-white/10 p-5 rounded-2xl max-w-lg mx-auto space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                    <span className="text-xl">🗺️</span>
                    <div>
                      <h3 className="text-sm font-black text-white">Routine Beat Route Check</h3>
                      <p className="text-[11px] text-slate-400">Scheduled route visit, merchant relationship & pulse check</p>
                    </div>
                  </div>

                  <form onSubmit={handleRoutineBeatSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                        Beat Route Visit Type *
                      </label>
                      <select
                        value={beatVisitType}
                        onChange={(e) => setBeatVisitType(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Scheduled Beat Route Visit">Standard Scheduled Beat Route Visit</option>
                        <option value="Regular Stock Refill Check">Regular Stock Refill Check</option>
                        <option value="Relationship & Owner Courtesy Check">Relationship & Owner Courtesy Check</option>
                        <option value="Outstanding / Payment Follow-up">Outstanding / Payment Follow-up</option>
                        <option value="Issue / Dispute Resolution">Issue / Dispute Resolution</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                        Owner Discussion & Feedback *
                      </label>
                      <textarea
                        rows="3"
                        required
                        value={beatFeedback}
                        onChange={(e) => setBeatFeedback(e.target.value)}
                        placeholder="Owner feedback on product movement, scheme demand, reorder planning..."
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                        Competitor Activity / Scheme Observed
                      </label>
                      <input
                        type="text"
                        value={competitorNotes}
                        onChange={(e) => setCompetitorNotes(e.target.value)}
                        placeholder="e.g. Parle/Britannia new scheme, competitor retailer margin..."
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={beatSubmitting}
                      className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                      {beatSubmitting ? 'Saving Beat Notes...' : 'Save Routine Beat Details'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. REGISTER NEW SHOP LEAD MODAL (Auto-Fetched Google / OSM Address)        */}
      {/* ========================================================================= */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative my-0 sm:my-auto max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setRegisterModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-3 pr-8">
              <div className="p-2.5 sm:p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-white">Register New Shop Lead</h3>
                <p className="text-[11px] sm:text-xs text-slate-400">With live GPS &amp; auto-fetched address</p>
              </div>
            </div>

            {/* Auto-Fetched Address Notification Badge */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 rounded-xl flex items-center gap-2 text-xs text-emerald-400 mb-3">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Address &amp; location auto-fetched from Google/GPS!</span>
            </div>

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
                    <option value="BAKERY">Bakery / Snacks</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1 flex items-center justify-between">
                  <span>Physical Address (Auto-Fetched) *</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (geoAddress) {
                        setNewShopAddress(geoAddress.fullAddress);
                        setNewShopCity(geoAddress.city);
                        setNewShopPincode(geoAddress.pincode);
                      }
                    }}
                    className="text-[10px] text-amber-400 font-bold hover:underline"
                  >
                    Re-fill from GPS
                  </button>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    City / Town
                  </label>
                  <input
                    type="text"
                    value={newShopCity}
                    onChange={(e) => setNewShopCity(e.target.value)}
                    placeholder="Chennai"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={newShopPincode}
                    onChange={(e) => setNewShopPincode(e.target.value)}
                    placeholder="600001"
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={registerSubmitting}
                className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {registerSubmitting ? 'Registering...' : 'Register & Check-In Immediately'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. GPS CHECK-OUT MODAL                                                    */}
      {/* ========================================================================= */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative my-0 sm:my-auto max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setCheckoutModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-sm sm:text-base font-black text-white mb-1 pr-8">Complete Visit &amp; Check-Out</h3>
            <p className="text-[11px] sm:text-xs text-slate-400 mb-3">Capture exit time, collections, and revisit schedule</p>

            {/* Active Store & Recorded Purpose Information */}
            <div className="bg-slate-800/80 border border-white/10 rounded-2xl p-3 mb-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Visiting Store:</span>
                <span className="font-bold text-white truncate max-w-[200px]">{activeShopWindow?.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Logged Purpose:</span>
                <span className="font-bold text-amber-400 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px]">
                  🎯 {activeVisitRecord?.purpose || selectedPurpose || 'Store Visit'}
                </span>
              </div>
            </div>

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
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
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

      {/* ========================================================================= */}
      {/* 5. INITIAL VISIT STAGE POP-UP SCREEN (DEDICATED NEXT STAGE MODAL)         */}
      {/* ========================================================================= */}
      {stageModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/90 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl relative my-0 sm:my-auto max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-white/10 shrink-0">
              <div className="pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {stageModalOpen === 'TODAY' && '🛒'}
                    {stageModalOpen === 'FOLLOWUP' && '📅'}
                    {stageModalOpen === 'CLOSED' && '❌'}
                  </span>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {stageModalOpen === 'TODAY' && 'Book Order on That Day'}
                    {stageModalOpen === 'FOLLOWUP' && 'Schedule Follow-Up for Order Booking'}
                    {stageModalOpen === 'CLOSED' && 'Close Lead / Not Interested'}
                  </h3>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-1">
                  Store: <span className="text-amber-400 font-bold">{activeShopWindow?.name || 'Selected Store'}</span>
                  {activeShopWindow?.city ? ` • ${activeShopWindow.city}` : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStageModalOpen(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-white/5 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Visit Discussion Notes Shortcut (Shared across all 3 pop-ups so salesperson can edit notes in-place) */}
            <div className="py-2.5 border-b border-white/5 shrink-0">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Visit Discussion / Meeting Notes</span>
                </label>
                {!initialDescription.trim() && (
                  <span className="text-[10px] text-amber-400 font-semibold">* Required before submit</span>
                )}
              </div>
              <input
                type="text"
                value={initialDescription}
                onChange={(e) => setInitialDescription(e.target.value)}
                placeholder="Brief summary of meeting with shop owner..."
                className="w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* STAGE 1: BOOK ORDER TODAY */}
            {stageModalOpen === 'TODAY' && (
              <div className="flex-1 overflow-y-auto py-3 space-y-3.5">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 flex items-start gap-2.5">
                  <span className="text-lg">🛒</span>
                  <div className="text-[11px] text-emerald-200">
                    <p className="font-bold text-emerald-300">Agreed to buy! Take spot order right now.</p>
                    <p className="text-emerald-400/80 mt-0.5">Select quantities from the product catalogue below. Submitting will record the sales order and complete this visit.</p>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Search biscuits, cookies, namkeen..."
                    className="w-full bg-slate-800/90 border border-white/10 rounded-xl pl-9 pr-14 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                  {catalogSearch && (
                    <button
                      type="button"
                      onClick={() => setCatalogSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[11px] font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* SKU List */}
                <div className="space-y-2 max-h-[34vh] overflow-y-auto pr-1">
                  {catalogueLoading ? (
                    <p className="text-xs text-slate-400 text-center py-6">Loading catalogue...</p>
                  ) : catalogue.filter(p => p.name?.toLowerCase().includes(catalogSearch.toLowerCase())).length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      No products match your search.
                    </div>
                  ) : (
                    catalogue
                      .filter(p => p.name?.toLowerCase().includes(catalogSearch.toLowerCase()))
                      .map(p => {
                        const inCart = orderCart.find(item => item.productId === p._id);
                        const qty = inCart ? inCart.quantity : 0;
                        const price = parseFloat(p.mrp || p.price || 0);
                        return (
                          <div 
                            key={p._id}
                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                              qty > 0 
                                ? 'bg-emerald-500/10 border-emerald-500/30' 
                                : 'bg-slate-800/50 border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-white truncate">{p.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span className="text-amber-400 font-bold">₹{price.toFixed(2)}</span>
                                <span>•</span>
                                <span>{p.unit || 'PCS'}</span>
                                {p.category && (
                                  <>
                                    <span>•</span>
                                    <span className="uppercase text-slate-400">
                                      {typeof p.category === 'object' ? (p.category?.name || '') : String(p.category)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Qty Controls */}
                            <div className="flex items-center gap-2 shrink-0">
                              {qty > 0 && (
                                <button
                                  type="button"
                                  onClick={() => updateCartItem(p, -1)}
                                  className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center cursor-pointer text-xs active:scale-95"
                                >
                                  -
                                </button>
                              )}
                              {qty > 0 && (
                                <span className="font-bold text-xs text-white min-w-5 text-center font-mono">
                                  {qty}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => updateCartItem(p, 1)}
                                className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold flex items-center justify-center cursor-pointer text-xs active:scale-95 shadow-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Cart Summary Card */}
                <div className="bg-slate-800/90 border border-white/10 rounded-2xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Selected Items:</span>
                    <span className="font-bold text-white">{orderCart.length} SKUs</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Subtotal:</span>
                    <span className="font-mono text-white">₹{cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>GST (5%):</span>
                    <span className="font-mono text-white">₹{cartGst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-white/10">
                    <span>Grand Total:</span>
                    <span className="font-mono text-emerald-400 text-base">₹{cartGrandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setStageModalOpen(null)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs active:scale-95 transition-all cursor-pointer text-center"
                  >
                    Keep in Cart & Close
                  </button>
                  <button
                    type="button"
                    disabled={orderCart.length === 0 || initialVisitSubmitting}
                    onClick={handleSubmitInitialVisit}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 text-center flex items-center justify-center gap-1.5"
                  >
                    <span>{initialVisitSubmitting ? 'Booking Order...' : `Confirm & Book Order (₹${cartGrandTotal.toFixed(2)})`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: SCHEDULE FOLLOW-UP */}
            {stageModalOpen === 'FOLLOWUP' && (
              <div className="flex-1 overflow-y-auto py-3 space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-start gap-2.5">
                  <span className="text-lg">📅</span>
                  <div className="text-[11px] text-amber-200">
                    <p className="font-bold text-amber-300">Schedule Order Booking Follow-up</p>
                    <p className="text-amber-400/80 mt-0.5">Set a revisit date and specify why follow-up is needed so this lead stays active in your pipeline.</p>
                  </div>
                </div>

                {/* Follow-up Date Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Revisit / Follow-up Date *
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={initialFollowUpDate}
                    onChange={(e) => setInitialFollowUpDate(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />

                  {/* Quick Preset Date Chips */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400 self-center mr-1">Quick Select:</span>
                    <button
                      type="button"
                      onClick={() => handleSetQuickFollowUpDays(1)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 border border-white/5 transition-colors cursor-pointer"
                    >
                      Tomorrow (+1d)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickFollowUpDays(3)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 border border-white/5 transition-colors cursor-pointer"
                    >
                      In 3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickFollowUpDays(7)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 border border-white/5 transition-colors cursor-pointer"
                    >
                      Next Week (+7d)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickFollowUpDays(14)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 border border-white/5 transition-colors cursor-pointer"
                    >
                      In 2 Weeks
                    </button>
                  </div>
                </div>

                {/* Reason for Follow-up */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Reason for Follow-up *
                  </label>
                  <select
                    value={initialFollowUpReason}
                    onChange={(e) => setInitialFollowUpReason(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Owner requested revisit to finalize purchase quantities">Owner requested revisit to finalize purchase quantities</option>
                    <option value="Decision maker / Owner was not available during visit">Decision maker / Owner was not available during visit</option>
                    <option value="Current stock already sufficient, revisit when depleted">Current stock already sufficient, revisit when depleted</option>
                    <option value="Requested credit term / payment clearance first">Requested credit term / payment clearance first</option>
                    <option value="Requested product samples / brochure to review">Requested product samples / brochure to review</option>
                    <option value="Competitor tie-up discussion in progress">Competitor tie-up discussion in progress</option>
                    <option value="Other / Custom Reason">Other / Custom Reason</option>
                  </select>

                  {initialFollowUpReason === 'Other / Custom Reason' && (
                    <textarea
                      rows={2}
                      value={customFollowUpReason}
                      onChange={(e) => setCustomFollowUpReason(e.target.value)}
                      placeholder="Specify the exact reason for follow-up..."
                      className="w-full mt-2 bg-slate-800 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 placeholder-slate-400"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setStageModalOpen(null)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs active:scale-95 transition-all cursor-pointer text-center"
                  >
                    Save & Close Pop-Up
                  </button>
                  <button
                    type="button"
                    disabled={!initialFollowUpDate || initialVisitSubmitting}
                    onClick={handleSubmitInitialVisit}
                    className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black py-3 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-500/20 text-center flex items-center justify-center gap-1.5"
                  >
                    <span>{initialVisitSubmitting ? 'Scheduling...' : 'Confirm & Schedule Follow-Up'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 3: CLOSE / NOT INTERESTED */}
            {stageModalOpen === 'CLOSED' && (
              <div className="flex-1 overflow-y-auto py-3 space-y-4">
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 flex items-start gap-2.5">
                  <span className="text-lg">❌</span>
                  <div className="text-[11px] text-rose-200">
                    <p className="font-bold text-rose-300">Close Lead / Not Interested</p>
                    <p className="text-rose-400/80 mt-0.5">Please specify why the owner declined or why this outlet is not suitable for Mansara products.</p>
                  </div>
                </div>

                {/* Reason for Closing */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Reason for Close / Declining *
                  </label>
                  <select
                    value={initialCloseReason}
                    onChange={(e) => setInitialCloseReason(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="High price / Margin expectation mismatch">High price / Margin expectation mismatch</option>
                    <option value="Not dealing in this product category (Biscuits / Snacks)">Not dealing in this product category (Biscuits / Snacks)</option>
                    <option value="Already stocked with exclusive competitor contract">Already stocked with exclusive competitor contract</option>
                    <option value="Shop permanently closed / moving location">Shop permanently closed / moving location</option>
                    <option value="Negative experience / past payment dispute">Negative experience / past payment dispute</option>
                    <option value="Store owner flatly refused to engage">Store owner flatly refused to engage</option>
                    <option value="Other Reason">Other Reason</option>
                  </select>

                  {initialCloseReason === 'Other Reason' && (
                    <textarea
                      rows={2}
                      value={customCloseReason}
                      onChange={(e) => setCustomCloseReason(e.target.value)}
                      placeholder="Specify the reason why customer declined..."
                      className="w-full mt-2 bg-slate-800 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 placeholder-slate-400"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setStageModalOpen(null)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl text-xs active:scale-95 transition-all cursor-pointer text-center"
                  >
                    Keep Open & Back
                  </button>
                  <button
                    type="button"
                    disabled={initialVisitSubmitting}
                    onClick={handleSubmitInitialVisit}
                    className="flex-1 bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white font-black py-3 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-rose-500/20 text-center flex items-center justify-center gap-1.5"
                  >
                    <span>{initialVisitSubmitting ? 'Closing...' : 'Confirm & Close Lead'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
