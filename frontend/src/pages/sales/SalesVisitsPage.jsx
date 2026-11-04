import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();

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

  // Selected Purpose of Visit state (Supports Single or Dual Purpose Visit)
  const [selectedPurpose, setSelectedPurpose] = useState('Order Booking');
  const [selectedPurposes, setSelectedPurposes] = useState(['Order Booking']);
  const [pendingStoreForCheckIn, setPendingStoreForCheckIn] = useState(null); // When store is chosen, prompt for purpose
  const [purposeModalOpen, setPurposeModalOpen] = useState(false);

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
      console.warn('Backend geocode failed, trying client fallback:', e.message);
    }

    try {
      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      );
      if (bdcRes.ok) {
        const b = await bdcRes.json();
        const city = b.locality || b.city || 'Viluppuram';
        const state = b.principalSubdivision || 'Tamil Nadu';
        const pincode = b.postcode || '';
        const street = b.localityInfo?.administrative?.[b.localityInfo.administrative.length - 1]?.name || city;
        const fullAddress = `${street ? street + ', ' : ''}${city}, ${state}${pincode ? ' - ' + pincode : ''}`;
        const bdcResult = { fullAddress, street: street || city, city, pincode, state, area: city };
        setGeoAddress(bdcResult);
        return bdcResult;
      }
    } catch (bdcErr) {
      console.warn('BigDataCloud geocode failed:', bdcErr);
    }

    const isViluppuram = Math.abs(lat - 11.94) < 0.5 && Math.abs(lon - 79.48) < 0.5;
    const city = isViluppuram ? 'Viluppuram' : 'Chennai';
    const pincode = isViluppuram ? '605602' : '600001';
    const street = isViluppuram ? 'Kandamangalam Main Road' : 'Commercial Main Road';
    const fallback = {
      fullAddress: `Near GPS (${lat.toFixed(4)}, ${lon.toFixed(4)}), ${street}, ${city} - ${pincode}`,
      street,
      city,
      pincode,
      state: 'Tamil Nadu',
      area: isViluppuram ? 'Viluppuram Central' : 'Central Zone'
    };
    setGeoAddress(fallback);
    setGeoLoading(false);
    return fallback;
  };

  // Acquire GPS position
  const acquireGPS = (openModalAfter = false) => {
    setGpsLoading(true);
    setGpsError(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
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
          } catch (e) {
            console.warn('GPS handling error:', e);
          }
        },
        async (err) => {
          try {
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
          } catch (e) {
            console.warn('GPS fallback error:', e);
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

      // Check for verified live active check-in from server
      try {
        const activeRes = await axios.get('/field-sales/visits/active');
        if (activeRes.data?.success && activeRes.data.hasActiveCheckIn && activeRes.data.data?.store?.name) {
          const liveVisit = activeRes.data.data;
          const liveStore = liveVisit.store;
          setActiveVisitRecord(liveVisit);
          setActiveShopWindow(liveStore);
          const targetStoreId = liveStore._id || liveStore.id;
          if (targetStoreId) fetchCustomer360(targetStoreId);

          // Sync localStorage
          localStorage.setItem('mansara_active_visit', JSON.stringify({
            visit: liveVisit,
            store: liveStore,
            purpose: liveVisit.purpose || 'Store Visit',
            startedAt: liveVisit.checkInTime || liveVisit.createdAt || new Date().toISOString()
          }));
          return;
        } else if (activeRes.data?.success && !activeRes.data.hasActiveCheckIn) {
          // Server explicitly confirms no active check-in - purge local cache immediately
          localStorage.removeItem('mansara_active_visit');
          setActiveVisitRecord(null);
          setActiveShopWindow(null);
          return;
        }
      } catch (err) {
        console.warn('Could not fetch active check-in from server:', err);
      }

      // If server has no active check-in, verify if localStorage has a valid recent check-in
      const saved = localStorage.getItem('mansara_active_visit');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const started = new Date(parsed.startedAt || parsed.visit?.checkInTime || 0).getTime();
          const hoursOld = (Date.now() - started) / (1000 * 60 * 60);
          if (parsed.visit && parsed.store?.name && hoursOld < 14) {
            setActiveVisitRecord(parsed.visit);
            setActiveShopWindow(parsed.store);
            if (parsed.purpose) setSelectedPurpose(parsed.purpose);
            return;
          }
        } catch (e) {}
        // Stale or invalid visit in localStorage - clear it!
        localStorage.removeItem('mansara_active_visit');
      }

      // No verified live check-in active
      setActiveVisitRecord(null);
      setActiveShopWindow(null);
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
    if (!storeId || storeId === 'undefined' || storeId === 'null') {
      return;
    }
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
    // Check query params if user clicked "Start GPS Check-In" from dashboard
    if (searchParams.get('gpsCheckIn') === 'true') {
      navigate('/sales/checkin', { replace: true });
      return;
    }

    acquireGPS();
    fetchVisits();
    fetchCatalogue();

    // Check if coming from GPS Check-In page with new active visit
    if (location.state?.autoOpenShopWindow) {
      const stored = localStorage.getItem('mansara_active_visit');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed?.visit && parsed?.store) {
            navigate(`/sales/store-visit/${parsed.store._id || parsed.store.id}`, {
              state: parsed,
              replace: true
            });
            return;
          }
        } catch (e) {}
      }
    }
  }, [location.state, navigate]);

  // Timer for active visit
  useEffect(() => {
    let interval = null;
    if (activeVisitRecord?.checkInTime || activeVisitRecord?.createdAt) {
      const startTime = new Date(activeVisitRecord.checkInTime || activeVisitRecord.createdAt).getTime();
      const updateTimer = () => {
        const diffSeconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        setVisitTimer(diffSeconds);
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
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
    navigate('/sales/checkin');
  };

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

  // User taps store to check in -> Navigates to dedicated separate purpose page
  const handleSelectStoreForCheckIn = (shop, preselectedPurpose = null) => {
    try {
      sessionStorage.setItem('mansara_pending_checkin_store', JSON.stringify(shop));
    } catch (e) {}
    navigate('/sales/checkin/purpose', {
      state: {
        shop,
        coords: currentCoords,
        address: geoAddress
      }
    });
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
        const activeData = {
          visit,
          store: shop,
          purpose: finalPurpose,
          startedAt: new Date().toISOString()
        };
        localStorage.setItem('mansara_active_visit', JSON.stringify(activeData));
        setActiveVisitRecord(visit);
        setActiveShopWindow(shop);
        setPendingStoreForCheckIn(null);
        setSmartCheckInModalOpen(false);
        setPurposeModalOpen(false);

        navigate(`/sales/store-visit/${shop._id || shop.id}`, {
          state: activeData
        });
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
  const handleOpenRegisterWithAutoAddress = async () => {
    setNewShopName('');
    setNewShopOwner('');
    setNewShopPhone('');
    setSmartCheckInModalOpen(false);
    setRegisterModalOpen(true);

    if (geoAddress?.fullAddress) {
      setNewShopAddress(geoAddress.fullAddress);
      setNewShopCity(geoAddress.city || '');
      setNewShopPincode(geoAddress.pincode || '');
    } else {
      let coords = currentCoords;
      if (!coords && 'geolocation' in navigator) {
        coords = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            () => resolve({ latitude: 11.9401, longitude: 79.4861 }),
            { enableHighAccuracy: true, timeout: 8000 }
          );
        });
        setCurrentCoords(coords);
      }
      if (coords) {
        const addr = await reverseGeocode(coords.latitude, coords.longitude);
        if (addr) {
          setNewShopAddress(addr.fullAddress);
          setNewShopCity(addr.city);
          setNewShopPincode(addr.pincode);
        }
      }
    }
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
        localStorage.removeItem('mansara_active_visit');
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
      {Boolean(activeVisitRecord && activeVisitRecord.checkInTime && activeShopWindow && activeShopWindow.name) && (
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
              onClick={() => navigate(`/sales/store-visit/${activeShopWindow._id || activeShopWindow.id}`, {
                state: {
                  visit: activeVisitRecord,
                  store: activeShopWindow,
                  purpose: activeVisitRecord?.purpose || selectedPurpose
                }
              })}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md"
            >
              <Store className="w-4 h-4" />
              <span>Open Store Visit Page</span>
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
            {filteredShops.map((shop, idx) => {
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
                  key={shop._id || shop.id || `shop-${shop.name || ''}-${idx}`} 
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
                          onClick={() => navigate(`/sales/store-visit/${shop._id || shop.id}`, {
                            state: {
                              visit: activeVisitRecord,
                              store: shop,
                              purpose: activeVisitRecord?.purpose || selectedPurpose
                            }
                          })}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md"
                        >
                          <Store className="w-4 h-4" />
                          <span>Open Store Visit Page</span>
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
                      <button
                        type="button"
                        onClick={() => handleCheckInToShop(shop, visitInfo.purpose)}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-md shadow-amber-500/20"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>GPS Check-In to Start Visit</span>
                      </button>
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
                  Confirm Check-In
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
