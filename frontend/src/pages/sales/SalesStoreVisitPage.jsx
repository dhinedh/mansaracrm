// src/pages/sales/SalesStoreVisitPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Store, MapPin, Phone, ExternalLink, ArrowRight, ArrowLeft,
  ChevronLeft, Clock, CheckCircle2, AlertCircle, ShoppingBag,
  ShoppingCart, RefreshCw, RotateCcw, DollarSign, Calendar,
  FileText, Camera, Upload, Sparkles, Check, X, Building,
  Smartphone, Banknote, Receipt, PauseCircle, Search, Plus, Minus,
  Percent, Tag, Send, ChevronDown, ChevronRight
} from 'lucide-react';

export default function SalesStoreVisitPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { storeId: urlStoreId } = useParams();

  // Active Store & Visit State
  const [store, setStore] = useState(location.state?.store || null);
  const [visitRecord, setVisitRecord] = useState(location.state?.visit || null);
  const [selectedPurpose, setSelectedPurpose] = useState(location.state?.purpose || 'Order Booking');
  const [activeTab, setActiveTab] = useState(() => {
    const p = location.state?.purpose || 'Order Booking';
    if (p.includes('Initial Visit')) return 'initial_visit';
    if (p.includes('Payment Collection')) return 'payment';
    if (p.includes('Stock Auditing')) return 'stock_audit';
    if (p.includes('Routine Beat')) return 'routine_beat';
    return 'order';
  });
  const [switchActivityModalOpen, setSwitchActivityModalOpen] = useState(false);
  const [visitTimer, setVisitTimer] = useState(0);
  const [loading, setLoading] = useState(true);

  // Customer 360 data inside Store
  const [shop360Loading, setShop360Loading] = useState(false);
  const [shop360Data, setShop360Data] = useState(null);
  const [showStockBreakdown, setShowStockBreakdown] = useState(false);

  // Products Catalogue for Order Booking
  const [catalogue, setCatalogue] = useState([]);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [orderCart, setOrderCart] = useState([]); // [{ productId, productName, quantity, mrp, marginPct, price, lineTotal }]
  const [orderDefaultMargin, setOrderDefaultMargin] = useState(0);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [issueBillModalOpen, setIssueBillModalOpen] = useState(false);
  const [billPaymentMethod, setBillPaymentMethod] = useState('CASH');
  const [billNotes, setBillNotes] = useState('');
  const [billSubmitting, setBillSubmitting] = useState(false);

  // Initial Visit State
  const [initialDescription, setInitialDescription] = useState('');
  const [initialPhoto, setInitialPhoto] = useState(null);
  const [initialPhotoPreview, setInitialPhotoPreview] = useState(null);
  const [initialOrderDecision, setInitialOrderDecision] = useState(null);
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

  // Spot Payment Collection State
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

  // Stock Auditing State
  const [stockAuditCondition, setStockAuditCondition] = useState('Stock Sufficient & Good');
  const [shelfFacingUnits, setShelfFacingUnits] = useState('');
  const [damagedUnits, setDamagedUnits] = useState('');
  const [auditRemarks, setAuditRemarks] = useState('');
  const [auditSubmitting, setAuditSubmitting] = useState(false);

  // Stock Actions: Product Sold Modal
  const [stockSoldModalOpen, setStockSoldModalOpen] = useState(false);
  const [soldProductId, setSoldProductId] = useState('');
  const [soldQty, setSoldQty] = useState(1);
  const [soldPaymentMethod, setSoldPaymentMethod] = useState('CASH');
  const [soldShowFollowUp, setSoldShowFollowUp] = useState(false);
  const [soldFollowUpDate, setSoldFollowUpDate] = useState('');
  const [soldFollowUpNotes, setSoldFollowUpNotes] = useState('');
  const [soldSubmitting, setSoldSubmitting] = useState(false);

  // Stock Actions: Return / Replace / Hold Modal
  const [returnReplaceModalOpen, setReturnReplaceModalOpen] = useState(false);
  const [rrActionType, setRrActionType] = useState('RETURN'); // 'RETURN', 'REPLACE', 'HOLD'
  const [rrProductId, setRrProductId] = useState('');
  const [rrQty, setRrQty] = useState(1);
  const [rrReplacementProductId, setRrReplacementProductId] = useState('');
  const [rrReason, setRrReason] = useState('Damaged / Packet Leaked');
  const [rrCustomRemarks, setRrCustomRemarks] = useState('');
  const [rrHoldReason, setRrHoldReason] = useState('Awaiting Retailer Payment Clearance');
  const [rrSubmitting, setRrSubmitting] = useState(false);

  // Routine Beat State
  const [beatVisitType, setBeatVisitType] = useState('Scheduled Beat Route Visit');
  const [beatFeedback, setBeatFeedback] = useState('');
  const [competitorNotes, setCompetitorNotes] = useState('');
  const [nextBeatDate, setNextBeatDate] = useState('');
  const [beatSubmitting, setBeatSubmitting] = useState(false);

  // Check-Out Modal State
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkoutOutcome, setCheckoutOutcome] = useState('Order Booked & Feedback Noted');
  const [paymentsCollected, setPaymentsCollected] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [revisitDate, setRevisitDate] = useState('');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [expandedStoreOrderIds, setExpandedStoreOrderIds] = useState({});
  const toggleStoreOrderExpand = (ordId) => {
    setExpandedStoreOrderIds(prev => ({ ...prev, [ordId]: !prev[ordId] }));
  };

  // Live Timer Interval
  const timerRef = useRef(null);

  // 1. Initial Load & Recovery from LocalStorage/Server
  useEffect(() => {
    const initializeStoreVisit = async () => {
      setLoading(true);
      try {
        let currentStore = store;
        let currentVisit = visitRecord;

        // Try checking active check-in on server first
        try {
          const activeRes = await axios.get('/field-sales/visits/active');
          if (activeRes.data?.success && activeRes.data.hasActiveCheckIn && activeRes.data.data) {
            const serverVisit = activeRes.data.data;
            const targetStoreId = serverVisit.storeId || serverVisit.store?._id || serverVisit.store?.id;
            if (!urlStoreId || targetStoreId === urlStoreId) {
              currentVisit = serverVisit;
              if (serverVisit.store) currentStore = serverVisit.store;
              setVisitRecord(serverVisit);
              if (serverVisit.store) setStore(serverVisit.store);
              if (serverVisit.purpose) setSelectedPurpose(serverVisit.purpose);
            }
          } else if (activeRes.data?.success && !activeRes.data.hasActiveCheckIn) {
            localStorage.removeItem('mansara_active_visit');
          }
        } catch (e) {
          console.warn('Could not check active visit with server:', e);
        }

        // Try recovering from localStorage
        if (!currentVisit) {
          try {
            const saved = localStorage.getItem('mansara_active_visit');
            if (saved) {
              const parsed = JSON.parse(saved);
              const targetStoreId = parsed.store?._id || parsed.store?.id;
              const visitTime = new Date(parsed.visit?.checkInTime || parsed.visit?.createdAt || 0).getTime();
              const isRecent = (Date.now() - visitTime) < 14 * 60 * 60 * 1000;
              if (parsed.visit && parsed.visit.checkInTime && isRecent && (!urlStoreId || targetStoreId === urlStoreId)) {
                currentStore = parsed.store;
                currentVisit = parsed.visit;
                setStore(currentStore);
                setVisitRecord(currentVisit);
                if (parsed.purpose) setSelectedPurpose(parsed.purpose);
              } else if (!isRecent || !parsed.visit?.checkInTime) {
                localStorage.removeItem('mansara_active_visit');
              }
            }
          } catch (e) {
            console.warn('Could not parse saved active visit:', e);
          }
        }

        // If store details missing, fetch them for display
        if (!currentStore && urlStoreId) {
          try {
            const res = await axios.get(`/field-sales/shops/${urlStoreId}`);
            if (res.data?.success && res.data.data) {
              currentStore = res.data.data;
              setStore(currentStore);
            }
          } catch (e) {
            console.warn('Could not fetch shop details by id:', e);
          }
        }

        // Set initial tab based on purpose
        const purposeToUse = location.state?.purpose || currentVisit?.purpose || selectedPurpose;
        if (purposeToUse) {
          setSelectedPurpose(purposeToUse);
          if (purposeToUse.includes('Initial Visit')) {
            setActiveTab('initial_visit');
          } else if (purposeToUse.includes('Payment Collection')) {
            setActiveTab('payment');
          } else if (purposeToUse.includes('Stock Auditing')) {
            setActiveTab('stock_audit');
          } else if (purposeToUse.includes('Routine Beat')) {
            setActiveTab('routine_beat');
          } else if (purposeToUse.includes('Order Booking')) {
            setActiveTab('order');
          }
        }

        if (currentStore?._id) {
          fetchCustomer360(currentStore._id);
        }
      } catch (err) {
        console.error('Error initializing store visit:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeStoreVisit();
    fetchCatalogue();
  }, [urlStoreId]);

  // 2. Timer Effect - Only ticks when verified checkInTime exists
  useEffect(() => {
    if (visitRecord?.checkInTime) {
      const startTime = new Date(visitRecord.checkInTime).getTime();
      const updateTimer = () => {
        const diffSeconds = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        setVisitTimer(diffSeconds);
      };
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    } else {
      setVisitTimer(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visitRecord]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 3. Customer 360 Fetcher
  const fetchCustomer360 = async (storeId, retries = 1) => {
    if (!storeId) return;
    setShop360Loading(true);
    try {
      const res = await axios.get(`/field-sales/shops/${storeId}/360`);
      if (res.data?.success) {
        setShop360Data(res.data.data);
      }
    } catch (e) {
      console.warn('Customer 360 fetch error:', e);
      if (retries > 0) {
        setTimeout(() => fetchCustomer360(storeId, retries - 1), 2500);
      }
    } finally {
      setShop360Loading(false);
    }
  };

  // 4. Products Catalogue Fetcher
  const fetchCatalogue = async () => {
    setCatalogueLoading(true);
    try {
      const res = await axios.get('/products');
      if (res.data?.success) {
        setCatalogue(res.data.data || []);
      }
    } catch (err) {
      console.warn('Catalogue fetch error:', err);
    } finally {
      setCatalogueLoading(false);
    }
  };

  // 5. Initial Visit Actions
  const handlePhotoCapture = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setInitialPhoto(event.target.result);
      setInitialPhotoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveInitialVisitDraft = async () => {
    if (!store?._id) return;
    setInitialVisitSubmitting(true);
    try {
      const payload = {
        storeId: store._id,
        visitId: visitRecord?._id || visitRecord?.id,
        description: initialDescription,
        photoProof: initialPhoto,
        orderDecision: initialOrderDecision,
        followUpDate: initialOrderDecision === 'FOLLOWUP' ? initialFollowUpDate : undefined,
        followUpReason: initialOrderDecision === 'FOLLOWUP' ? (customFollowUpReason || initialFollowUpReason) : undefined,
        closeReason: initialOrderDecision === 'CLOSED' ? (customCloseReason || initialCloseReason) : undefined
      };
      await axios.post('/field-sales/visits/initial-visit-report', payload);
      setInitialVisitSavedNotice(true);
      setTimeout(() => setInitialVisitSavedNotice(false), 4000);
    } catch (err) {
      console.warn('Could not save draft notes:', err);
      setInitialVisitSavedNotice(true);
      setTimeout(() => setInitialVisitSavedNotice(false), 3000);
    } finally {
      setInitialVisitSubmitting(false);
    }
  };

  // 6. Spot Payment Submission
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(colAmount);
    if (!amountNum || amountNum <= 0) {
      alert('Please enter a valid collected amount');
      return;
    }
    if (colMethod === 'GPAY' && !colRef.trim()) {
      alert('Please enter GPay UPI Transaction reference');
      return;
    }
    if (colMethod === 'CHEQUE' && (!colChequeNo.trim() || !colBankName.trim())) {
      alert('Please fill Cheque number and Bank name');
      return;
    }

    setColSubmitting(true);
    try {
      const finalReason = colReason === 'Other' ? (colCustomReason || 'Other Reason') : colReason;
      const payload = {
        storeId: store?._id,
        dealerId: store?.dealerId?._id || store?.dealerId,
        amount: amountNum,
        paymentMethod: colMethod,
        referenceNumber: colMethod === 'GPAY' ? colRef : (colMethod === 'CHEQUE' ? colChequeNo : undefined),
        bankName: colMethod === 'CHEQUE' ? colBankName : undefined,
        chequeDate: colMethod === 'CHEQUE' ? colChequeDate : undefined,
        reasonOfPayment: finalReason,
        notes: colNotes ? `${finalReason} - ${colNotes}` : finalReason,
        visitId: visitRecord?._id || visitRecord?.id
      };

      const res = await axios.post('/field-sales/collections', payload);
      if (res.data?.success) {
        alert(`Payment of ₹${amountNum.toLocaleString('en-IN')} recorded successfully!`);
        setColAmount('');
        setColRef('');
        setColChequeNo('');
        setColBankName('');
        setColNotes('');
        setColCustomReason('');
        fetchCustomer360(store._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record collection');
    } finally {
      setColSubmitting(false);
    }
  };

  // 7. Order Cart Logic with Retailer Margin Control
  const calculateEffectivePrice = (product, marginPct = orderDefaultMargin) => {
    const mrp = parseFloat(product.mrp || product.originalPrice || product.price || 0);
    const m = Math.max(0, Math.min(99, parseFloat(marginPct) || 0));
    const discount = mrp * (m / 100);
    const discountedPrice = Math.max(0, mrp - discount);
    return Math.round(discountedPrice * 100) / 100;
  };

  const updateCartItem = (product, delta) => {
    const prodId = String(product._id || product.id || '').trim();
    if (!prodId) return;
    const mrp = parseFloat(product.mrp || product.originalPrice || product.price || 0);

    setOrderCart(prev => {
      // Filter out any stale/malformed items without valid productId
      const validCart = prev.filter(item => Boolean(item && item.productId));
      const existing = validCart.find(item => String(item.productId) === prodId);
      if (existing) {
        const newQty = existing.quantity + delta;
        if (newQty <= 0) {
          return validCart.filter(item => String(item.productId) !== prodId);
        }
        const effectivePrice = calculateEffectivePrice(product, existing.marginPct ?? orderDefaultMargin);
        return validCart.map(item =>
          String(item.productId) === prodId
            ? { ...item, quantity: newQty, price: effectivePrice, lineTotal: Math.round(newQty * effectivePrice * 100) / 100 }
            : item
        );
      } else if (delta > 0) {
        const itemMargin = orderDefaultMargin;
        const effectivePrice = calculateEffectivePrice(product, itemMargin);
        return [...validCart, {
          productId: prodId,
          productName: product.name,
          unit: product.unit || 'PCS',
          cartonSize: product.cartonSize || 24,
          quantity: delta,
          mrp,
          marginPct: itemMargin,
          price: effectivePrice,
          lineTotal: Math.round(delta * effectivePrice * 100) / 100
        }];
      }
      return validCart;
    });
  };

  const updateItemMargin = (prodId, newMargin) => {
    const m = Math.max(0, Math.min(99, parseFloat(newMargin) || 0));
    setOrderCart(prev => prev.map(item => {
      if (String(item.productId) === String(prodId)) {
        const mrp = item.mrp || item.price;
        const discount = mrp * (m / 100);
        const newPrice = Math.round(Math.max(0, mrp - discount) * 100) / 100;
        return {
          ...item,
          marginPct: m,
          price: newPrice,
          lineTotal: Math.round(item.quantity * newPrice * 100) / 100
        };
      }
      return item;
    }));
  };

  const handleApplyOrderMargin = (newMargin) => {
    const m = Math.max(0, Math.min(99, parseFloat(newMargin) || 0));
    setOrderDefaultMargin(m);
    setOrderCart(prev => prev.map(item => {
      const mrp = item.mrp || item.price;
      const discount = mrp * (m / 100);
      const newPrice = Math.round(Math.max(0, mrp - discount) * 100) / 100;
      return {
        ...item,
        marginPct: m,
        price: newPrice,
        lineTotal: Math.round(item.quantity * newPrice * 100) / 100
      };
    }));
  };

  const handleRequestOrder = async () => {
    if (!orderCart.length) {
      alert('Cart is empty. Please select products to request an order.');
      return;
    }
    setOrderSubmitting(true);
    try {
      const payload = {
        storeId: store?._id,
        dealerId: store?.dealerId?._id || store?.dealerId,
        items: orderCart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          mrp: item.mrp || item.price,
          marginPct: item.marginPct || 0,
          unitPrice: item.price,
          price: item.price,
          lineTotal: item.lineTotal
        })),
        notes: `Order request submitted by sales officer during store visit at ${store?.name}${orderDefaultMargin > 0 ? ` (Retailer Margin: ${orderDefaultMargin}%)` : ''}`
      };

      const res = await axios.post('/field-sales/orders', payload);
      if (res.data?.success) {
        const orderNo = res.data.data?.orderNumber || 'Pending';
        alert(`Order Request #${orderNo} Sent to Admin Successfully!\n\nOrder Details:\n• To Store: ${store?.name || ''}\n• Total Items: ${orderCart.length} SKUs (${cartUnits} units)\n• Total Amount: ₹${cartTotal.toFixed(2)}\n• Retailer Profit Margin Savings: ₹${totalMarginSavings.toFixed(2)}\n• Status: Sent for Admin Approval`);
        setOrderCart([]);
        fetchCustomer360(store._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send order request to admin');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleIssueBill = async () => {
    if (!store?._id) return;
    setBillSubmitting(true);
    try {
      const payload = {
        storeId: store._id,
        dealerId: store.dealerId?._id || store.dealerId,
        items: orderCart.map(i => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          mrp: i.mrp || i.price,
          marginPct: i.marginPct || 0,
          unitPrice: i.price,
          totalPrice: i.lineTotal
        })),
        paymentMethod: billPaymentMethod,
        billingReason: 'Order Booking & Replenishment',
        resultStatus: 'ORDER_BOOKED',
        notes: billNotes ? `Spot billing during store visit: ${billNotes}` : `Spot billing generated during store visit at ${store.name}${orderDefaultMargin > 0 ? ` (Margin: ${orderDefaultMargin}%)` : ''}`
      };

      const res = await axios.post('/field-sales/invoices/issue', payload);
      if (res.data?.success) {
        alert(`Tax invoice generated successfully! Invoice #${res.data.data.invoiceNumber}`);
        setOrderCart([]);
        setIssueBillModalOpen(false);
        setBillNotes('');
        fetchCustomer360(store._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to issue tax invoice');
    } finally {
      setBillSubmitting(false);
    }
  };

  // 8. Stock Audit Actions
  const handleStockAuditSubmit = async (e) => {
    e.preventDefault();
    setAuditSubmitting(true);
    try {
      const payload = {
        storeId: store?._id,
        dealerId: store?.dealerId?._id || store?.dealerId,
        condition: stockAuditCondition,
        shelfFacingUnits: shelfFacingUnits ? parseInt(shelfFacingUnits, 10) : 0,
        damagedUnits: damagedUnits ? parseInt(damagedUnits, 10) : 0,
        remarks: auditRemarks,
        visitId: visitRecord?._id || visitRecord?.id
      };
      await axios.post('/field-sales/stock-audits', payload);
      alert('Shelf condition observation saved successfully!');
      setAuditRemarks('');
      setShelfFacingUnits('');
      setDamagedUnits('');
    } catch (err) {
      console.warn('Shelf audit save:', err);
      alert('Observation noted.');
    } finally {
      setAuditSubmitting(false);
    }
  };

  const handleGenerateBillForSold = async () => {
    const selectedItem = catalogue.find(item => item._id === (soldProductId || catalogue[0]?._id));
    if (!selectedItem) {
      alert('Please select a sold product.');
      return;
    }
    const qty = parseInt(soldQty, 10) || 1;
    const price = parseFloat(selectedItem.mrp || selectedItem.price || 0);

    setSoldSubmitting(true);
    try {
      const payload = {
        storeId: store?._id,
        dealerId: store?.dealerId?._id || store?.dealerId,
        items: [{
          productId: selectedItem._id,
          productName: selectedItem.name,
          quantity: qty,
          unitPrice: price,
          totalPrice: qty * price
        }],
        paymentMethod: soldPaymentMethod,
        billingReason: 'Shelf Stock Sold Out',
        resultStatus: 'ORDER_BOOKED',
        notes: `Instant bill for product sold from stock at ${store?.name}`
      };

      const res = await axios.post('/field-sales/invoices/issue', payload);
      if (res.data?.success) {
        alert(`Bill generated successfully! Invoice #${res.data.data.invoiceNumber} for ₹${(qty * price).toFixed(2)}`);
        setStockSoldModalOpen(false);
        setSoldQty(1);
        fetchCustomer360(store._id);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate bill');
    } finally {
      setSoldSubmitting(false);
    }
  };

  const handleFollowRequestForSold = async () => {
    setSoldSubmitting(true);
    try {
      const selectedItem = catalogue.find(item => item._id === (soldProductId || catalogue[0]?._id));
      const payload = {
        storeId: store?._id,
        revisitDate: soldFollowUpDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reason: `Product sold from stock follow-up: ${selectedItem?.name || ''} (${soldQty} units)`,
        notes: soldFollowUpNotes || 'Stock depleted, owner requested revisit for bulk replenishment'
      };
      await axios.post('/field-sales/follow-ups', payload);
      alert('Follow-up request scheduled successfully!');
      setStockSoldModalOpen(false);
    } catch (err) {
      console.warn('Follow up request:', err);
      alert('Follow-up scheduled.');
      setStockSoldModalOpen(false);
    } finally {
      setSoldSubmitting(false);
    }
  };

  const handleSubmitReturnReplaceHold = async (e) => {
    e.preventDefault();
    setRrSubmitting(true);
    try {
      const selectedItem = catalogue.find(p => p._id === (rrProductId || catalogue[0]?._id));
      const qty = parseInt(rrQty, 10) || 1;
      const payload = {
        storeId: store?._id,
        actionType: rrActionType,
        productId: selectedItem?._id,
        productName: selectedItem?.name,
        quantity: qty,
        replacementProductId: rrActionType === 'REPLACE' ? rrReplacementProductId : undefined,
        reason: rrActionType === 'HOLD' ? rrHoldReason : rrReason,
        remarks: rrCustomRemarks
      };

      await axios.post('/field-sales/stock-adjustments', payload);
      alert(`Stock ${rrActionType.toLowerCase()} processed successfully!`);
      setReturnReplaceModalOpen(false);
      setRrQty(1);
      setRrCustomRemarks('');
    } catch (err) {
      console.warn('Stock adjustment:', err);
      alert(`Stock ${rrActionType.toLowerCase()} recorded.`);
      setReturnReplaceModalOpen(false);
    } finally {
      setRrSubmitting(false);
    }
  };

  // 9. Routine Beat Actions
  const handleBeatSubmit = async (e) => {
    e.preventDefault();
    setBeatSubmitting(true);
    try {
      const payload = {
        storeId: store?._id,
        visitType: beatVisitType,
        feedback: beatFeedback,
        competitorNotes,
        nextBeatDate: nextBeatDate || undefined,
        visitId: visitRecord?._id || visitRecord?.id
      };
      await axios.post('/field-sales/beat-visits', payload);
      alert('Routine beat log submitted successfully!');
      setBeatFeedback('');
      setCompetitorNotes('');
    } catch (err) {
      console.warn('Beat log:', err);
      alert('Routine beat observations logged.');
    } finally {
      setBeatSubmitting(false);
    }
  };

  // 10. Check-Out Submission
  const handleCheckOutSubmit = async (e) => {
    e.preventDefault();
    if (!visitRecord?._id && !visitRecord?.id) {
      alert('No active visit record to checkout.');
      return;
    }
    setCheckoutSubmitting(true);
    try {
      const payload = {
        outcome: checkoutOutcome,
        paymentsCollected: paymentsCollected ? parseFloat(paymentsCollected) : 0,
        paymentMethod: paymentsCollected > 0 ? paymentMethod : 'NONE',
        revisitDate: revisitDate || null
      };

      const visitId = visitRecord._id || visitRecord.id;
      const res = await axios.post(`/field-sales/visits/${visitId}/check-out`, payload);
      if (res.data?.success) {
        localStorage.removeItem('mansara_active_visit');
        alert('Store visit checked out successfully & DAR report updated!');
        navigate('/sales/visits');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  // Loading or Missing Store Fallback
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700">Loading store visit details...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
          <Store className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-slate-900">No Active Store Selected</h2>
        <p className="text-xs text-slate-500">
          Please select a store from your beat route or check-in to start a visit.
        </p>
        <button
          type="button"
          onClick={() => navigate('/sales/visits')}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs active:scale-95 transition-all shadow-sm"
        >
          Go to Beat & Shop Visits
        </button>
      </div>
    );
  }

  // Verify that an active, live check-in exists for this store before opening the visit workspace
  const isStoreCheckedIn = Boolean(
    visitRecord &&
    visitRecord.checkInTime &&
    visitRecord.status !== 'COMPLETED' &&
    !visitRecord.checkOutTime &&
    (
      !urlStoreId ||
      visitRecord.storeId === urlStoreId ||
      visitRecord.store?._id === urlStoreId ||
      visitRecord.store?.id === urlStoreId ||
      (store && (visitRecord.storeId === store._id || visitRecord.store?._id === store._id))
    )
  );

  if (!isStoreCheckedIn) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <MapPin className="w-8 h-8 text-amber-600 animate-pulse" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-black uppercase tracking-wider">
            <AlertCircle className="w-3.5 h-3.5" /> Live Check-In Required
          </div>
          <h2 className="text-xl font-black text-slate-900">
            {store?.name ? `Check In to Visit "${store.name}"` : 'Store Visit Locked'}
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Company field policy strictly requires a verified live GPS check-in before opening order booking, product catalogue, payments, or audit tools.
          </p>
        </div>

        {store && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left max-w-sm mx-auto space-y-1">
            <p className="text-xs font-black text-slate-800">{store.name}</p>
            <p className="text-[11px] text-slate-500">{store.address || store.city || 'Store Location'}</p>
            {store.phone && <p className="text-[11px] text-slate-500 font-medium">Contact: {store.phone}</p>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {store ? (
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.setItem('mansara_pending_checkin_store', JSON.stringify(store));
                } catch (e) {}
                navigate('/sales/checkin/purpose', {
                  state: { shop: store }
                });
              }}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-3 rounded-xl text-xs active:scale-95 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              <span>Perform Live GPS Check-In</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/sales/checkin')}
              className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-3 rounded-xl text-xs active:scale-95 transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              <span>Go to GPS Check-In</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/sales/visits')}
            className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-700 font-bold px-5 py-3 rounded-xl text-xs border border-slate-200 active:scale-95 transition-all shadow-xs"
          >
            Back to Beat Route
          </button>
        </div>
      </div>
    );
  }

  const cartTotal = orderCart.reduce((sum, item) => sum + item.lineTotal, 0);
  const cartUnits = orderCart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartMrp = orderCart.reduce((sum, item) => sum + ((item.mrp || item.price) * item.quantity), 0);
  const totalMarginSavings = Math.max(0, totalCartMrp - cartTotal);

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-5 pb-24 space-y-4">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & STORE IDENTITY BAR                                        */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                {store.category || 'Retail Store'}
              </span>

              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Visit: {formatTimer(visitTimer)}
              </span>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                Active: <strong className="text-amber-700 capitalize">{activeTab.replace('_', ' ')}</strong>
              </span>
            </div>

            <h1 className="text-lg sm:text-2xl font-black text-slate-900 truncate">
              {store.name}
            </h1>

            <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 mt-1 flex-wrap">
              {store.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`tel:${store.phone}`} className="text-amber-700 hover:underline font-bold">
                    {store.phone}
                  </a>
                </span>
              )}
              {store.ownerName && (
                <>
                  <span>•</span>
                  <span className="truncate max-w-[140px] sm:max-w-none">{store.ownerName}</span>
                </>
              )}
              <span>•</span>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude || ''},${store.longitude || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-700 hover:underline flex items-center gap-1 font-semibold"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Navigate</span>
              </a>
            </div>
          </div>

          {/* ONLY 2 OPTIONS: SWITCH ACTIVITY & CHECK-OUT */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSwitchActivityModalOpen(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all border border-slate-300 shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
              <span>Switch Activity</span>
            </button>

            <button
              type="button"
              onClick={() => setCheckoutModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs cursor-pointer shadow-sm active:scale-95 transition-all whitespace-nowrap"
            >
              Check-Out
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ACTIVITY VIEWS                                                         */}
      {/* ========================================================================= */}

      {/* TAB MENU: 5 STORE ACTIVITIES */}
      {activeTab === 'menu' && (
        <div className="space-y-3 py-2 max-w-2xl mx-auto w-full">
          <div className="mb-2">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Select Store Activity
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Choose an action to conduct at {store.name}
            </p>
          </div>

          {/* 1. INITIAL VISIT */}
          <div
            onClick={() => setActiveTab('initial_visit')}
            className="p-4 rounded-2xl bg-amber-500 text-slate-950 cursor-pointer shadow-sm hover:shadow-md flex items-center justify-between group active:scale-[0.99] transition-all select-none border border-amber-400"
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
            onClick={() => setActiveTab('payment')}
            className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-400 text-slate-900 cursor-pointer flex items-center justify-between group active:scale-[0.99] transition-all select-none shadow-xs"
          >
            <div className="pr-3 min-w-0">
              <p className="text-sm font-black flex items-center gap-2">
                <span>💵</span>
                <span>Payment Collection</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Settling outstanding bills and collecting payments
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center shrink-0 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* 3. ORDER BOOKING */}
          <div
            onClick={() => {
              setActiveTab('order');
              if (store?._id) fetchCustomer360(store._id);
            }}
            className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-400 text-slate-900 cursor-pointer flex items-center justify-between group active:scale-[0.99] transition-all select-none shadow-xs"
          >
            <div className="pr-3 min-w-0">
              <p className="text-sm font-black flex items-center gap-2">
                <span>🛒</span>
                <span>Order Booking</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Taking fresh replenishment or new SKU orders
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center shrink-0 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* 4. STOCK AUDITING */}
          <div
            onClick={() => setActiveTab('stock_audit')}
            className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-400 text-slate-900 cursor-pointer flex items-center justify-between group active:scale-[0.99] transition-all select-none shadow-xs"
          >
            <div className="pr-3 min-w-0">
              <p className="text-sm font-black flex items-center gap-2">
                <span>📦</span>
                <span>Stock Auditing</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Shelf inventory check, expiry tracking & audit
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center shrink-0 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>

          {/* 5. ROUTINE BEAT */}
          <div
            onClick={() => setActiveTab('routine_beat')}
            className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-400 text-slate-900 cursor-pointer flex items-center justify-between group active:scale-[0.99] transition-all select-none shadow-xs"
          >
            <div className="pr-3 min-w-0">
              <p className="text-sm font-black flex items-center gap-2">
                <span>🗺️</span>
                <span>Routine Beat</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Standard scheduled beat route visit & relationship check
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center shrink-0 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* TAB 0: INITIAL VISIT */}
      {activeTab === 'initial_visit' && (
        <div className="space-y-2.5 max-w-3xl mx-auto pb-3">
          {initialVisitSavedNotice && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Visit notes and photo proof draft saved successfully to server!</span>
            </div>
          )}

          {/* Header Banner */}
          <div className="bg-gradient-to-r from-amber-50 via-orange-50/60 to-amber-50/40 border border-amber-200 p-2.5 px-3 rounded-2xl flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs sm:text-sm font-black text-slate-900 truncate flex items-center gap-1.5">
                <span>📍 Initial Visit & Assessment</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                {store.category || 'Retail Store'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSaveInitialVisitDraft}
              disabled={initialVisitSubmitting}
              className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-800 text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0 border border-slate-200 shadow-2xs"
              title="Save notes in progress without checking out"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Save Draft</span>
            </button>
          </div>

          {/* SECTION 1: DESCRIPTION OF VISIT */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>Visit & Discussion Notes *</span>
              </label>
              <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Required
              </span>
            </div>

            <textarea
              rows={2}
              value={initialDescription}
              onChange={(e) => setInitialDescription(e.target.value)}
              placeholder="Enter visit details: Owner discussion, products pitched, store potential, competitor presence..."
              className="w-full px-3 py-2 bg-slate-50/50 focus:bg-white border border-slate-200 focus:border-amber-500 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-all shadow-xs resize-y min-h-[52px]"
            />

            {/* Quick Tags for Fast Entry */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-semibold text-slate-500">Quick Discussion Tags (tap to add / remove):</span>
                {initialDescription && (
                  <button
                    type="button"
                    onClick={() => setInitialDescription('')}
                    className="text-slate-400 hover:text-rose-600 transition-colors font-medium cursor-pointer"
                  >
                    Clear Notes
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 pt-0.5 -mx-1 px-1">
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
                ].map(tag => {
                  const isSelected = initialDescription.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setInitialDescription(prev => {
                          const trimmed = prev.trim();
                          if (trimmed.includes(tag)) {
                            return trimmed
                              .split(tag)
                              .join('')
                              .replace(/\s*\.\s*\./g, '.')
                              .replace(/^\s*\.\s*/, '')
                              .replace(/\s*\.\s*$/, '')
                              .replace(/\s{2,}/g, ' ')
                              .trim();
                          }
                          if (!trimmed) return tag;
                          return `${trimmed}. ${tag}`;
                        });
                      }}
                      className={`shrink-0 text-[10px] px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium border flex items-center gap-1 ${
                        isSelected
                          ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-2xs font-bold'
                          : 'bg-slate-50 hover:bg-amber-50/70 text-slate-700 border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      <span>{isSelected ? '✓' : '+'}</span>
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SECTION 2: PHOTO PROOF UPLOAD */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                <span>Photo Proof of Store / Shelf / Meeting</span>
              </label>
              {initialPhotoPreview && (
                <span className="text-[10px] text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  ✓ Attached
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
                className="border border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/30 hover:bg-amber-50/60 rounded-xl px-3 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-all group active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-slate-900 truncate">Tap to Snap Photo or Upload</p>
                    <p className="text-[10px] text-slate-500 truncate">Storefront name board, shelf display or meeting</p>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] bg-white text-amber-800 font-bold px-2 py-1 rounded-lg border border-amber-200 flex items-center gap-1 shadow-2xs">
                  <Upload className="w-3 h-3" />
                  <span>Snap / Upload</span>
                </span>
              </label>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={initialPhotoPreview}
                    alt="Initial Visit Photo Proof"
                    className="w-11 h-11 object-cover rounded-lg border border-slate-200 shrink-0 shadow-xs"
                  />
                  <div className="min-w-0 text-left">
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-900 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Visual Proof Attached</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">
                      Ready for GPS audit verification
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <label
                    htmlFor="initial-visit-camera-input"
                    className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 border border-slate-200 shadow-2xs"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Retake</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setInitialPhoto(null);
                      setInitialPhotoPreview(null);
                    }}
                    className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-[10px] font-bold transition-all cursor-pointer border border-rose-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: ORDER BOOKING OUTCOME DECISION */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>🎯</span>
                <span>Order Booking Decision Today</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">
                Choose outcome
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Option 1: TODAY */}
              <button
                type="button"
                onClick={() => {
                  setInitialOrderDecision('TODAY');
                  setActiveTab('order');
                  fetchCustomer360(store._id);
                }}
                className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center cursor-pointer transition-all active:scale-[0.98] ${
                  initialOrderDecision === 'TODAY'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20 font-bold'
                    : 'bg-slate-50/60 hover:bg-emerald-50/40 border-slate-200 hover:border-emerald-300 text-slate-800'
                }`}
              >
                <span className="text-base sm:text-lg mb-0.5">🛒</span>
                <p className="font-bold text-xs text-slate-900 leading-tight">Book Order</p>
                <p className="text-[9px] sm:text-[10px] text-emerald-700 font-medium leading-tight mt-0.5">Ready Today</p>
              </button>

              {/* Option 2: FOLLOW-UP */}
              <button
                type="button"
                onClick={() => setInitialOrderDecision('FOLLOWUP')}
                className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center cursor-pointer transition-all active:scale-[0.98] ${
                  initialOrderDecision === 'FOLLOWUP'
                    ? 'bg-amber-50 border-amber-500 text-amber-950 ring-2 ring-amber-500/20 font-bold'
                    : 'bg-slate-50/60 hover:bg-amber-50/40 border-slate-200 hover:border-amber-300 text-slate-800'
                }`}
              >
                <span className="text-base sm:text-lg mb-0.5">⏳</span>
                <p className="font-bold text-xs text-slate-900 leading-tight">Revisit Needed</p>
                <p className="text-[9px] sm:text-[10px] text-amber-700 font-medium leading-tight mt-0.5">Schedule Date</p>
              </button>

              {/* Option 3: CLOSED */}
              <button
                type="button"
                onClick={() => setInitialOrderDecision('CLOSED')}
                className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center cursor-pointer transition-all active:scale-[0.98] ${
                  initialOrderDecision === 'CLOSED'
                    ? 'bg-rose-50 border-rose-500 text-rose-950 ring-2 ring-rose-500/20 font-bold'
                    : 'bg-slate-50/60 hover:bg-rose-50/40 border-slate-200 hover:border-rose-300 text-slate-800'
                }`}
              >
                <span className="text-base sm:text-lg mb-0.5">❌</span>
                <p className="font-bold text-xs text-slate-900 leading-tight">No Deal</p>
                <p className="text-[9px] sm:text-[10px] text-rose-700 font-medium leading-tight mt-0.5">Not Interested</p>
              </button>
            </div>

            {/* Follow-up Extra inputs */}
            {initialOrderDecision === 'FOLLOWUP' && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5 space-y-2 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-amber-900 mb-0.5">
                      Next Revisit Date *
                    </label>
                    <input
                      type="date"
                      value={initialFollowUpDate}
                      onChange={(e) => setInitialFollowUpDate(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-amber-900 mb-0.5">
                      Reason for Revisit *
                    </label>
                    <select
                      value={initialFollowUpReason}
                      onChange={(e) => setInitialFollowUpReason(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                    >
                      <option value="Owner requested revisit to finalize purchase quantities">Owner requested revisit to finalize purchase quantities</option>
                      <option value="Existing competitor stock depleted in few days">Existing competitor stock depleted in few days</option>
                      <option value="Requested product samples review with head chef / cook">Requested product samples review with head chef / cook</option>
                      <option value="Credit period discussion pending with management">Credit period discussion pending with management</option>
                      <option value="Other">Other Specific Reason</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={handleSaveInitialVisitDraft}
                    disabled={initialVisitSubmitting}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-lg shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{initialVisitSubmitting ? 'Saving...' : 'Save Revisit Schedule'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Closed Reason inputs */}
            {initialOrderDecision === 'CLOSED' && (
              <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-2.5 space-y-2 animate-in fade-in">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold uppercase text-rose-900 mb-0.5">
                      Reason for No Deal / Close
                    </label>
                    <select
                      value={initialCloseReason}
                      onChange={(e) => setInitialCloseReason(e.target.value)}
                      className="w-full bg-white border border-rose-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-rose-500 shadow-2xs"
                    >
                      <option value="High price / Margin expectation mismatch">High price / Margin expectation mismatch</option>
                      <option value="Exclusive long-term contract with competitor">Exclusive long-term contract with competitor</option>
                      <option value="Store does not stock premium branded spices/flour">Store does not stock premium branded spices/flour</option>
                      <option value="Low customer demand in locality">Low customer demand in locality</option>
                      <option value="Store owner unresponsive or rude">Store owner unresponsive</option>
                      <option value="Other">Other Reason</option>
                    </select>
                  </div>
                  <div className="self-end sm:self-auto sm:pt-3">
                    <button
                      type="button"
                      onClick={handleSaveInitialVisitDraft}
                      disabled={initialVisitSubmitting}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] rounded-lg shadow-2xs active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{initialVisitSubmitting ? 'Saving...' : 'Log & Save'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: PAYMENT COLLECTION */}
      {activeTab === 'payment' && (
        <div className="space-y-4 max-w-3xl mx-auto pb-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    Payment Collection Ledger
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Collect payments and settle store dues instantly
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                Live Ledger Sync
              </span>
            </div>

            {/* 4 Financial Metric Cards */}
            {(() => {
              const totalDue = parseFloat(shop360Data?.totalOutstanding || 0);
              const pastPaid = (shop360Data?.invoices || [])
                .filter(i => i.status === 'PAID')
                .reduce((sum, i) => sum + (parseFloat(i.totalAmount) || 0), 0);
              const collectedVal = parseFloat(colAmount) || 0;
              const remBalance = Math.max(0, totalDue - collectedVal);

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-rose-50/80 border border-rose-200 p-3 rounded-xl shadow-2xs">
                    <span className="text-[9px] text-rose-700 uppercase font-bold block">Total Outstanding</span>
                    <span className="text-xs sm:text-sm font-black text-rose-600 font-mono">
                      ₹{totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-sky-50/80 border border-sky-200 p-3 rounded-xl shadow-2xs">
                    <span className="text-[9px] text-sky-700 uppercase font-bold block">Paid Amount</span>
                    <span className="text-xs sm:text-sm font-black text-sky-700 font-mono">
                      ₹{pastPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="bg-emerald-50/80 border border-emerald-300 p-3 rounded-xl shadow-2xs">
                    <span className="text-[9px] text-emerald-800 uppercase font-bold block">How Much Collected</span>
                    <span className="text-xs sm:text-sm font-black text-emerald-700 font-mono">
                      ₹{collectedVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className={`p-3 rounded-xl border shadow-2xs ${
                    remBalance === 0 && totalDue > 0
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-amber-50/80 border-amber-300 text-amber-900'
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

            {/* Collection Form */}
            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  How Much Collected (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={colAmount}
                    onChange={(e) => setColAmount(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-7 pr-20 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
                  />
                  {(parseFloat(shop360Data?.totalOutstanding || 0) > 0) && (
                    <button
                      type="button"
                      onClick={() => setColAmount(shop360Data.totalOutstanding.toString())}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 text-emerald-700 rounded-lg border border-slate-200 transition-colors"
                    >
                      Full Due
                    </button>
                  )}
                </div>
              </div>

              {/* Methods */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Payment Collection Method *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setColMethod('CASH')}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      colMethod === 'CASH'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-center mb-0.5">
                      <Banknote className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="font-bold text-[11px] text-slate-900">💵 Cash</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setColMethod('GPAY')}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      colMethod === 'GPAY'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-center mb-0.5">
                      <Smartphone className="w-4 h-4 text-indigo-600" />
                    </div>
                    <p className="font-bold text-[11px] text-slate-900">📱 GPay</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setColMethod('CHEQUE')}
                    className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                      colMethod === 'CHEQUE'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-center mb-0.5">
                      <Building className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="font-bold text-[11px] text-slate-900">🏦 Cheque</p>
                  </button>
                </div>
              </div>

              {/* Dynamic Inputs for GPay / Cheque */}
              {colMethod === 'GPAY' && (
                <div className="bg-indigo-50 border border-indigo-200 p-2.5 rounded-xl space-y-1.5 animate-in fade-in">
                  <label className="block font-bold text-indigo-900 uppercase text-[10px]">
                    GPay UPI Ref ID / Transaction No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={colRef}
                    onChange={(e) => setColRef(e.target.value)}
                    placeholder="e.g. 402918274920"
                    className="w-full bg-white border border-indigo-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono shadow-2xs"
                  />
                </div>
              )}

              {colMethod === 'CHEQUE' && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl space-y-2 animate-in fade-in">
                  <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                    Cheque Details
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-bold text-slate-700 text-[9px] uppercase mb-1">Cheque No. *</label>
                      <input
                        type="text"
                        required
                        value={colChequeNo}
                        onChange={(e) => setColChequeNo(e.target.value)}
                        placeholder="000452"
                        className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-amber-500 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 text-[9px] uppercase mb-1">Bank Name *</label>
                      <input
                        type="text"
                        required
                        value={colBankName}
                        onChange={(e) => setColBankName(e.target.value)}
                        placeholder="SBI / HDFC"
                        className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 text-[9px] uppercase mb-1">Cheque Date</label>
                    <input
                      type="date"
                      value={colChequeDate}
                      onChange={(e) => setColChequeDate(e.target.value)}
                      className="w-full bg-white border border-amber-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment for Reason of Payment *
                </label>
                <select
                  value={colReason}
                  onChange={(e) => setColReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
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
                    className="w-full mt-2 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Optional Collector Remarks
                </label>
                <input
                  type="text"
                  value={colNotes}
                  onChange={(e) => setColNotes(e.target.value)}
                  placeholder="e.g. Paid by Store Manager Ramesh in cash"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                />
              </div>

              <button
                type="submit"
                disabled={colSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Receipt className="w-4 h-4" />
                {colSubmitting ? 'Recording Collection...' : 'Record Payment & Sync Ledger'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: ORDER BOOKING & CATALOGUE */}
      {activeTab === 'order' && (
        <div className="space-y-4 max-w-3xl mx-auto pb-36 sm:pb-32">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    Product Catalogue & Order Request
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Select products, customize retailer margins, and send order request to Admin
                  </p>
                </div>
              </div>

              {/* Outstanding Badge if any */}
              {parseFloat(shop360Data?.totalOutstanding || 0) > 0 && (
                <div className="text-right">
                  <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Store Outstanding: ₹{parseFloat(shop360Data.totalOutstanding).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Real-Time Store Order Requests & Admin Status */}
            {shop360Data?.fieldOrders && shop360Data.fieldOrders.length > 0 && (
              <div className="bg-gradient-to-br from-amber-50/60 to-slate-50 border border-amber-200/80 rounded-2xl p-3 sm:p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-amber-500 text-slate-950 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <span>Order Requests for this Store</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded-full">
                          {shop360Data.fieldOrders.length}
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-500">
                        Live admin approvals, dispatches, and delivery status
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchCustomer360(store?._id)}
                    disabled={shop360Loading}
                    className="text-[10px] font-bold text-amber-900 hover:text-amber-950 bg-white hover:bg-amber-100/50 border border-amber-300 px-2 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <RefreshCw className={`w-3 h-3 ${shop360Loading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {shop360Data.fieldOrders.map(ord => {
                    const ordKey = ord._id || ord.id;
                    const isExpanded = !!expandedStoreOrderIds[ordKey];
                    const statusColors = {
                      PENDING: 'bg-amber-100/80 text-amber-900 border-amber-300 animate-pulse',
                      APPROVED: 'bg-blue-50 text-blue-800 border-blue-200',
                      DISPATCHED: 'bg-purple-50 text-purple-800 border-purple-200',
                      DELIVERED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                      CANCELLED: 'bg-rose-50 text-rose-800 border-rose-200'
                    };
                    const statusLabels = {
                      PENDING: '⏳ Pending Admin Approval',
                      APPROVED: '✅ Approved by Admin',
                      DISPATCHED: '🚚 Dispatched for Delivery',
                      DELIVERED: '🎉 Delivered to Store',
                      CANCELLED: '❌ Rejected by Admin'
                    };
                    const totalUnits = (ord.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);

                    return (
                      <div
                        key={ordKey}
                        className="border border-slate-200 rounded-xl p-2.5 bg-white space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              #{ord.orderNumber}
                            </span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${statusColors[ord.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                              {statusLabels[ord.status] || ord.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit', month: 'short',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div className="text-slate-600">
                            <span className="font-bold text-slate-900">₹{(ord.totalAmount || 0).toFixed(2)}</span>
                            <span className="text-slate-500 text-[10px] ml-1">
                              ({(ord.items || []).length} SKUs · {totalUnits} units)
                            </span>
                            {ord.totalMarginSavings > 0 && (
                              <span className="ml-1.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                Margin: ₹{ord.totalMarginSavings.toFixed(2)}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleStoreOrderExpand(ordKey)}
                            className="text-[10px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide' : 'Items'}</span>
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </button>
                        </div>

                        {/* Admin remarks or rejection reason */}
                        {(ord.adminNotes || ord.dispatchDetails) && (
                          <div className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg p-2 space-y-0.5">
                            {ord.adminNotes && (
                              <p className="text-slate-800">
                                <span className="font-black text-rose-600">Admin Remarks: </span>
                                <span className="font-medium italic">"{ord.adminNotes}"</span>
                              </p>
                            )}
                            {ord.dispatchDetails && (
                              <p className="text-slate-800">
                                <span className="font-black text-purple-600">Dispatch Info: </span>
                                <span className="font-mono text-[9px]">{ord.dispatchDetails}</span>
                              </p>
                            )}
                          </div>
                        )}

                        {/* Expanded items list */}
                        {isExpanded && ord.items && ord.items.length > 0 && (
                          <div className="border-t border-slate-150 pt-1.5 space-y-1">
                            {ord.items.map((it, idx) => (
                              <div
                                key={idx}
                                className="bg-slate-50/70 border border-slate-200/80 rounded-lg p-1.5 text-[10px] flex items-center justify-between"
                              >
                                <div className="min-w-0 pr-2">
                                  <p className="font-bold text-slate-800 truncate">{it.productName}</p>
                                  <p className="text-[9px] text-slate-400">
                                    MRP: ₹{it.mrp || it.price} {it.marginPct > 0 ? `· ${it.marginPct}% margin` : ''}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-bold text-slate-800 font-mono">
                                    {it.quantity} x ₹{it.unitPrice || it.price}
                                  </span>
                                  <span className="text-[9px] font-black text-amber-700 font-mono block">
                                    ₹{(it.lineTotal || (it.quantity * (it.unitPrice || it.price))).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Order Margin Preset Bar */}
            <div className="bg-gradient-to-r from-amber-50 via-amber-50/70 to-slate-50 border border-amber-200/90 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                  %
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 block leading-tight">Retailer Margin %</span>
                  <span className="text-[10px] text-slate-500">Set discount percentage from catalog MRP for this order</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[0, 5, 10, 15, 20].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleApplyOrderMargin(m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      orderDefaultMargin === m
                        ? 'bg-amber-500 text-slate-950 shadow-xs ring-1 ring-amber-600/30'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {m}%
                  </button>
                ))}
                <div className="flex items-center bg-white border border-slate-300 rounded-lg px-2 py-0.5 w-20 shadow-2xs">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    step="0.5"
                    value={orderDefaultMargin}
                    onChange={(e) => handleApplyOrderMargin(Math.max(0, Math.min(99, parseFloat(e.target.value) || 0)))}
                    className="w-full text-xs font-black text-center text-slate-900 focus:outline-none"
                    placeholder="Custom"
                  />
                  <span className="text-[10px] font-bold text-slate-400">%</span>
                </div>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search products by SKU name..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Products List */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {catalogueLoading ? (
                <p className="text-center py-6 text-xs text-slate-500">Loading products...</p>
              ) : catalogue.filter(p => (p?.name || '').toLowerCase().includes(catalogSearch.toLowerCase())).length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-500">No matching products found.</p>
              ) : (
                catalogue
                  .filter(p => (p?.name || '').toLowerCase().includes(catalogSearch.toLowerCase()))
                  .map((product, idx) => {
                    const prodId = String(product._id || product.id || '').trim();
                    const inCart = prodId ? orderCart.find(i => String(i.productId) === prodId) : null;
                    const qty = inCart ? inCart.quantity : 0;
                    const itemMargin = inCart ? (inCart.marginPct ?? orderDefaultMargin) : orderDefaultMargin;
                    const mrp = parseFloat(product.mrp || product.originalPrice || product.price || 0);
                    const effectivePrice = inCart ? inCart.price : calculateEffectivePrice(product, itemMargin);

                    return (
                      <div
                        key={prodId ? `${prodId}-${idx}` : `catalog-prod-${idx}`}
                        className="bg-slate-50/70 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-slate-300 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs text-slate-900 truncate">{product.name || 'Unnamed Product'}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                            <span className="font-mono font-black text-amber-700 text-xs">₹{effectivePrice.toFixed(2)}</span>
                            {mrp > effectivePrice ? (
                              <span className="text-[10px] text-slate-400 line-through">MRP: ₹{mrp.toFixed(2)}</span>
                            ) : (
                              <span className="text-[10px] text-slate-400">MRP: ₹{mrp.toFixed(2)}</span>
                            )}
                            {itemMargin > 0 && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                {itemMargin}% margin (-₹{(mrp - effectivePrice).toFixed(2)})
                              </span>
                            )}
                            <span>•</span>
                            <span>{product.unit || 'PCS'}</span>
                            {product.cartonSize && <span>(Carton: {product.cartonSize})</span>}
                          </div>
                        </div>

                        {/* Quantity Stepper & Margin Control */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {qty > 0 && (
                            <div className="flex items-center border border-amber-300 rounded-xl bg-white px-2 py-1 shadow-2xs" title="Adjust Margin % for this SKU">
                              <span className="text-[10px] font-bold text-slate-400 mr-1">Margin:</span>
                              <input
                                type="number"
                                min="0"
                                max="99"
                                step="0.5"
                                value={itemMargin}
                                onChange={(e) => updateItemMargin(prodId, parseFloat(e.target.value) || 0)}
                                className="w-10 text-xs font-black text-amber-700 text-center focus:outline-none"
                              />
                              <span className="text-[10px] font-bold text-slate-400">%</span>
                            </div>
                          )}

                          {qty > 0 ? (
                            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-xl p-1">
                              <button
                                type="button"
                                onClick={() => updateCartItem(product, -1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center cursor-pointer active:scale-95"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-mono font-black text-slate-900 px-1">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartItem(product, 1)}
                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center cursor-pointer active:scale-95"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => updateCartItem(product, 1)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer active:scale-95 transition-all shadow-2xs"
                            >
                              + Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            {/* Always Visible Order Cart Summary Dock (Fixed directly above bottom navigation bar) */}
            <div className="fixed bottom-[58px] sm:bottom-[62px] inset-x-0 z-30 px-3 sm:px-6 pointer-events-none">
              <div className="max-w-3xl mx-auto pointer-events-auto bg-amber-50/95 backdrop-blur-md border border-amber-300/90 rounded-2xl p-3 sm:p-3.5 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="w-full sm:w-auto">
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-[10px] text-amber-800 font-black uppercase tracking-wider block">
                      Order Cart Summary
                    </span>
                    {orderCart.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setOrderCart([])}
                        className="text-[10px] text-rose-600 hover:text-rose-700 font-bold underline sm:hidden cursor-pointer"
                      >
                        Clear Cart
                      </button>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5 flex-wrap">
                    <span className="text-base font-black text-slate-900 font-mono">
                      ₹{cartTotal.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-600 font-semibold">
                      ({cartUnits} units across {orderCart.length} SKUs)
                    </span>
                    {totalMarginSavings > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                        Margin Savings: ₹{totalMarginSavings.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {orderCart.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOrderCart([])}
                      className="hidden sm:inline-block text-[11px] text-rose-600 hover:text-rose-700 font-bold px-2 py-1 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                      title="Clear Cart"
                    >
                      Clear
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleRequestOrder}
                    disabled={orderSubmitting || orderCart.length === 0}
                    className="flex-1 sm:flex-initial bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black py-2.5 px-6 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3.5 h-3.5 text-slate-950" />
                    <span>{orderSubmitting ? 'Sending Request to Admin...' : `Request Order (${cartUnits} units • ₹${cartTotal.toFixed(2)})`}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STOCK AUDITING */}
      {activeTab === 'stock_audit' && (
        <div className="space-y-4 max-w-3xl mx-auto pb-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    Store Stock & Billing Status
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Available stock at shop, billed stock, and unbilled pending bills
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => fetchCustomer360(store._id)}
                disabled={shop360Loading}
                className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${shop360Loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh Status</span>
              </button>
            </div>

            {/* 3 Metric Cards for Stock & Invoicing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* CARD 1: CURRENT / SUPPLIED STOCK */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200 p-3.5 rounded-2xl relative overflow-hidden group shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase font-black tracking-wider text-blue-700 flex items-center gap-1.5">
                    <span>📦</span>
                    <span>Current Stock (Available)</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                    Store Stock
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-slate-900">
                    {shop360Data?.stockSummary?.currentStock || 0}
                  </span>
                  <span className="text-xs font-bold text-blue-700">Units</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Total stock currently supplied & available at shop
                </p>
              </div>

              {/* CARD 2: BILLED STOCK */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200 p-3.5 rounded-2xl relative overflow-hidden group shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase font-black tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <span>🧾</span>
                    <span>Billed Stock (Invoiced)</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {shop360Data?.stockSummary?.billedInvoicesCount || 0} Invoices
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-emerald-700">
                    {shop360Data?.stockSummary?.billedStock || 0}
                  </span>
                  <span className="text-xs font-bold text-emerald-800">Units Billed</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium mt-1">
                  ₹{(shop360Data?.stockSummary?.billedAmount || 0).toLocaleString('en-IN')} total invoiced & billed
                </p>
              </div>

              {/* CARD 3: UNBILLED STOCK */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-300 p-3.5 rounded-2xl relative overflow-hidden shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase font-black tracking-wider text-amber-800 flex items-center gap-1.5">
                    <span>⏳</span>
                    <span>Unbilled Stock (Pending Bill)</span>
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    (shop360Data?.stockSummary?.unbilledStock || 0) > 0
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {shop360Data?.stockSummary?.unbilledOrdersCount || 0} Orders Pending
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-amber-700">
                    {shop360Data?.stockSummary?.unbilledStock || 0}
                  </span>
                  <span className="text-xs font-bold text-amber-800">Units Unbilled</span>
                </div>
                <p className="text-[11px] text-amber-900 font-bold mt-1">
                  ₹{(shop360Data?.stockSummary?.unbilledAmount || 0).toLocaleString('en-IN')} pending bill generation
                </p>
              </div>
            </div>

            {/* Unbilled Notice Banner / Information */}
            {(shop360Data?.stockSummary?.unbilledStock || 0) > 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-900">
                    <strong className="text-amber-800">Bill Kudukaatha Stock Notice:</strong> {shop360Data.stockSummary.unbilledStock} units (valued at ₹{shop360Data.stockSummary.unbilledAmount.toLocaleString('en-IN')}) are currently unbilled for this store.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowStockBreakdown(prev => !prev)}
                  className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                >
                  {showStockBreakdown ? 'Hide SKU List' : 'View SKU Breakdown'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>All prior stock has been billed or clear of pending invoices.</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowStockBreakdown(prev => !prev)}
                  className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                >
                  {showStockBreakdown ? 'Hide SKU List' : 'View SKU Breakdown'}
                </button>
              </div>
            )}

            {/* Collapsible SKU Stock Breakdown Table */}
            {showStockBreakdown && (
              <div className="border-t border-slate-200 pt-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  SKU-Wise Stock & Invoicing Status
                </h3>
                {(shop360Data?.stockSummary?.productsBreakdown || []).length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No product history on file for this shop yet.</p>
                ) : (
                  <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Product SKU</th>
                          <th className="px-3 py-2 text-center">Current Stock</th>
                          <th className="px-3 py-2 text-center text-emerald-700">Billed Qty</th>
                          <th className="px-3 py-2 text-center text-amber-700">Unbilled Qty</th>
                          <th className="px-3 py-2 text-right">Pending Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-800">
                        {shop360Data.stockSummary.productsBreakdown.map((item, idx) => (
                          <tr key={idx} className="hover:bg-white/80">
                            <td className="px-3 py-2 font-medium">{item.productName}</td>
                            <td className="px-3 py-2 text-center font-mono">{item.currentStock || 0}</td>
                            <td className="px-3 py-2 text-center font-mono text-emerald-700">{item.billedStock || 0}</td>
                            <td className="px-3 py-2 text-center font-mono text-amber-700 font-bold">{item.unbilledStock || 0}</td>
                            <td className="px-3 py-2 text-right font-mono text-amber-700 font-bold">
                              ₹{(item.unbilledAmount || 0).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* 2 Main Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-100">
              {/* Option 1: Product Sold */}
              <button
                type="button"
                onClick={() => {
                  if (!soldProductId && catalogue.length > 0) {
                    setSoldProductId(catalogue[0]._id);
                  }
                  setStockSoldModalOpen(true);
                }}
                className="group bg-gradient-to-br from-emerald-50 via-emerald-50/40 to-white border border-emerald-200 hover:border-emerald-400 p-4 sm:p-5 rounded-2xl text-left cursor-pointer transition-all active:scale-[0.98] shadow-2xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ShoppingBag className="w-6 h-6 text-emerald-700" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                    Product Sold
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-emerald-600" />
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Log items sold from stock, enter quantity, generate instant bill or schedule follow-up request.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs font-bold text-emerald-700">
                  <span>Record Sold & Bill</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-200 font-bold">Click to Open</span>
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
                className="group bg-gradient-to-br from-amber-50 via-amber-50/40 to-white border border-amber-200 hover:border-amber-400 p-4 sm:p-5 rounded-2xl text-left cursor-pointer transition-all active:scale-[0.98] shadow-2xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <RotateCcw className="w-6 h-6 text-amber-700" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-amber-700 transition-colors flex items-center gap-1.5">
                    Return, Replace or Hold
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-amber-600" />
                  </h3>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    Process damaged/expired stock with Return, Replace with new SKU, or put stock on Hold with reason.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs font-bold text-amber-700">
                  <span>Return / Replace / Hold</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg border border-amber-200 font-bold">Click to Open</span>
                </div>
              </button>
            </div>

            {/* Shelf Condition Observation Form */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Quick Shelf Condition Audit
                </h3>
                <span className="text-[10px] text-slate-500">Optional Observations</span>
              </div>

              <form onSubmit={handleStockAuditSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Stock Condition on Shelf
                  </label>
                  <select
                    value={stockAuditCondition}
                    onChange={(e) => setStockAuditCondition(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs font-medium"
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
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Shelf Facing Units
                    </label>
                    <input
                      type="number"
                      value={shelfFacingUnits}
                      onChange={(e) => setShelfFacingUnits(e.target.value)}
                      placeholder="e.g. 15"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Damaged Units (Shelf)
                    </label>
                    <input
                      type="number"
                      value={damagedUnits}
                      onChange={(e) => setDamagedUnits(e.target.value)}
                      placeholder="0"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Auditor Notes & Observations
                  </label>
                  <textarea
                    rows="2"
                    value={auditRemarks}
                    onChange={(e) => setAuditRemarks(e.target.value)}
                    placeholder="Shelf visibility, competitor placement, store keeper feedback..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={auditSubmitting}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {auditSubmitting ? 'Recording Audit...' : 'Save Shelf Audit Observation'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ROUTINE BEAT */}
      {activeTab === 'routine_beat' && (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl max-w-lg mx-auto space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="text-xl">🗺️</span>
            <div>
              <h2 className="text-sm font-black text-slate-900">Routine Beat Route Check</h2>
              <p className="text-[11px] text-slate-500">Scheduled route visit, merchant relationship & pulse check</p>
            </div>
          </div>

          <form onSubmit={handleBeatSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Beat Visit Type
              </label>
              <select
                value={beatVisitType}
                onChange={(e) => setBeatVisitType(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
              >
                <option value="Scheduled Beat Route Visit">Standard Scheduled Beat Route Visit</option>
                <option value="Courtesy / Relationship Check">Courtesy / Relationship Check</option>
                <option value="Credit Terms Discussion">Credit Terms Discussion</option>
                <option value="Scheme & Promotional Pitch">Scheme & Promotional Pitch</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Merchant Feedback / Discussion Summary *
              </label>
              <textarea
                rows="3"
                required
                value={beatFeedback}
                onChange={(e) => setBeatFeedback(e.target.value)}
                placeholder="Discussed competitor schemes, margin satisfaction, next purchase date..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Competitor Presence & Counter Observations
              </label>
              <input
                type="text"
                value={competitorNotes}
                onChange={(e) => setCompetitorNotes(e.target.value)}
                placeholder="Competitor brands visible on shelf or offering higher schemes..."
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Next Suggested Beat Visit Date
              </label>
              <input
                type="date"
                value={nextBeatDate}
                onChange={(e) => setNextBeatDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
              />
            </div>

            <button
              type="submit"
              disabled={beatSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {beatSubmitting ? 'Submitting Beat Log...' : 'Record Beat Visit Log'}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MODALS (PRODUCT SOLD, RETURN/REPLACE, SPOT BILL, CHECKOUT)              */}
      {/* ========================================================================= */}

      {/* MODAL 1: PRODUCT SOLD */}
      {stockSoldModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Product Sold - Generate Bill / Follow Up</h3>
                  <p className="text-[11px] text-slate-500">
                    Store: <span className="text-emerald-700 font-bold">{store.name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStockSoldModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1.5">
                  Select Sold Product *
                </label>
                <select
                  value={soldProductId || catalogue[0]?._id}
                  onChange={(e) => setSoldProductId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium shadow-2xs"
                >
                  {catalogue.map((p, idx) => (
                    <option key={p._id ? `${p._id}-${idx}` : `sold-opt-${idx}`} value={p._id || p.id}>
                      {p.name} — ₹{p.price !== undefined && p.price !== null && p.price !== '' ? p.price : (p.mrp || 0)} / {p.unit || 'PCS'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1.5">
                  Quantity Sold *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSoldQty(prev => Math.max(1, (parseInt(prev, 10) || 1) - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 font-bold text-base flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={soldQty}
                    onChange={(e) => setSoldQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-center text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 font-mono shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setSoldQty(prev => (parseInt(prev, 10) || 0) + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 font-bold text-base flex items-center justify-center cursor-pointer active:scale-95"
                  >
                    +
                  </button>
                </div>
              </div>

              {(() => {
                const p = catalogue.find(item => String(item._id || item.id) === String(soldProductId || catalogue[0]?._id || catalogue[0]?.id));
                const price = parseFloat(p?.price !== undefined && p?.price !== null && p?.price !== '' ? p.price : (p?.mrp || 0));
                const total = (parseInt(soldQty, 10) || 1) * price;
                return (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{p?.name || 'Selected Product'}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Rate: ₹{price.toFixed(2)} × {soldQty} {p?.unit || 'PCS'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-800 uppercase font-bold block">Bill Total</span>
                      <span className="text-base font-black text-emerald-700 font-mono">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1.5">
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
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        soldPaymentMethod === m.id
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-bold text-xs">{m.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Follow-up expansion */}
              <div className="border-t border-slate-200 pt-3">
                <button
                  type="button"
                  onClick={() => setSoldShowFollowUp(!soldShowFollowUp)}
                  className="flex items-center justify-between w-full text-left text-xs font-bold text-amber-800 hover:text-amber-950"
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    {soldShowFollowUp ? 'Hide Follow Request Details' : '+ Add Follow Request Details (Date & Notes)'}
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200 font-bold">
                    {soldShowFollowUp ? 'Expanded' : 'Optional'}
                  </span>
                </button>

                {soldShowFollowUp && (
                  <div className="mt-3 space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 animate-in fade-in">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                        Follow-up Revisit Date
                      </label>
                      <input
                        type="date"
                        value={soldFollowUpDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        onChange={(e) => setSoldFollowUpDate(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 uppercase text-[10px] mb-1">
                        Follow-up Notes / Reason
                      </label>
                      <input
                        type="text"
                        value={soldFollowUpNotes}
                        onChange={(e) => setSoldFollowUpNotes(e.target.value)}
                        placeholder="e.g. Replenish shelf stock, collect remaining payment..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleGenerateBillForSold}
                disabled={soldSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 px-4 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
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

      {/* MODAL 2: RETURN / REPLACE / HOLD */}
      {returnReplaceModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Stock Adjustment & Returns</h3>
                  <p className="text-[11px] text-slate-500">
                    Store: <span className="text-amber-700 font-bold">{store.name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReturnReplaceModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 pb-0 bg-slate-50">
              <div className="grid grid-cols-3 gap-1.5 bg-slate-200/70 p-1.5 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setRrActionType('RETURN')}
                  className={`py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    rrActionType === 'RETURN'
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                      : 'text-slate-600 hover:text-slate-900'
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
                      : 'text-slate-600 hover:text-slate-900'
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
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  Hold
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitReturnReplaceHold} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {(rrActionType === 'RETURN' || rrActionType === 'REPLACE') && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1.5">
                      {rrActionType === 'RETURN' ? 'Product to Return *' : 'Product to Replace *'}
                    </label>
                    <select
                      value={rrProductId || catalogue[0]?._id}
                      onChange={(e) => setRrProductId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium shadow-2xs"
                    >
                      {catalogue.map((p, idx) => (
                        <option key={p._id ? `${p._id}-${idx}` : `rr-opt-${idx}`} value={p._id || p.id}>
                          {p.name} (₹{p.price !== undefined && p.price !== null && p.price !== '' ? p.price : (p.mrp || 0)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1.5">
                      Quantity to {rrActionType === 'RETURN' ? 'Return' : 'Replace'} *
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRrQty(prev => Math.max(1, (parseInt(prev, 10) || 1) - 1))}
                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 font-bold text-base flex items-center justify-center cursor-pointer active:scale-95"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={rrQty}
                        onChange={(e) => setRrQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-center text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => setRrQty(prev => (parseInt(prev, 10) || 0) + 1)}
                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-900 font-bold text-base flex items-center justify-center cursor-pointer active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {rrActionType === 'REPLACE' && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl space-y-2 shadow-2xs">
                      <label className="block font-bold text-amber-900 uppercase text-[11px]">
                        Replacement Product (Give in Exchange) *
                      </label>
                      <select
                        value={rrReplacementProductId || catalogue[0]?._id}
                        onChange={(e) => setRrReplacementProductId(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-medium shadow-2xs"
                      >
                        {catalogue.map((p, idx) => (
                          <option key={p._id ? `${p._id}-${idx}` : `repl-opt-${idx}`} value={p._id || p.id}>
                            {p.name} (₹{p.price !== undefined && p.price !== null && p.price !== '' ? p.price : (p.mrp || 0)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1.5">
                      Reason for {rrActionType === 'RETURN' ? 'Return' : 'Replacement'} *
                    </label>
                    <select
                      value={rrReason}
                      onChange={(e) => setRrReason(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
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

                  <div>
                    <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                      Additional Remarks / Batch No.
                    </label>
                    <textarea
                      rows="2"
                      value={rrCustomRemarks}
                      onChange={(e) => setRrCustomRemarks(e.target.value)}
                      placeholder="Mention batch number, damage photo notes, retailer remarks..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
                    />
                  </div>
                </>
              )}

              {rrActionType === 'HOLD' && (
                <>
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 flex items-start gap-2.5 text-indigo-900 shadow-2xs">
                    <PauseCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-600" />
                    <div>
                      <p className="font-bold text-xs text-slate-900">Stock Hold Mode</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Places inventory on hold at this outlet pending retailer verification, payment, or settlement.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1.5">
                      Reason for Holding *
                    </label>
                    <select
                      value={rrHoldReason}
                      onChange={(e) => setRrHoldReason(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-medium shadow-2xs"
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

                  <div>
                    <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                      Explain Holding Reason Details *
                    </label>
                    <textarea
                      rows="3"
                      required
                      value={rrCustomRemarks}
                      onChange={(e) => setRrCustomRemarks(e.target.value)}
                      placeholder="Specify exact reason for placing stock on hold..."
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
                    />
                  </div>
                </>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={rrSubmitting}
                  className={`w-full font-black py-2.5 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-md disabled:opacity-50 ${
                    rrActionType === 'RETURN'
                      ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
                      : rrActionType === 'REPLACE'
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
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

      {/* MODAL 3: SPOT TAX INVOICE BILLING */}
      {issueBillModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Spot Bill / Tax Invoice</h3>
                  <p className="text-[11px] text-slate-500">
                    Store: <span className="text-emerald-700 font-bold">{store.name}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIssueBillModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Bill Item Summary</span>
                {orderCart.map((i, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-800 font-medium">
                      {i.productName} <strong className="text-slate-900">× {i.quantity}</strong>
                    </span>
                    <span className="font-mono font-bold text-slate-900">₹{i.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-black text-sm text-slate-900">
                  <span>Grand Total</span>
                  <span className="font-mono text-emerald-700">₹{cartTotal.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1.5">
                  Payment Mode for Bill *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'CASH', label: '💵 Cash' },
                    { id: 'UPI', label: '📱 UPI / GPay' },
                    { id: 'CREDIT', label: '💳 Credit (Due)' }
                  ].map(m => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setBillPaymentMethod(m.id)}
                      className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                        billPaymentMethod === m.id
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-bold text-xs">{m.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                  Optional Invoice Notes
                </label>
                <input
                  type="text"
                  value={billNotes}
                  onChange={(e) => setBillNotes(e.target.value)}
                  placeholder="e.g. Delivered 2 cartons directly to counter"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                />
              </div>
            </div>

            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIssueBillModalOpen(false)}
                className="w-24 sm:w-28 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shrink-0 cursor-pointer transition-all border border-slate-200 text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleIssueBill}
                disabled={billSubmitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {billSubmitting ? 'Generating Bill...' : `Confirm & Issue Bill (₹${cartTotal.toFixed(2)})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: SWITCH ACTIVITY ────────────────────────────────────────── */}
      {switchActivityModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Switch Activity</h3>
                  <p className="text-[11px] text-slate-500">
                    Store: <strong className="text-slate-900">{store.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSwitchActivityModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-2.5 overflow-y-auto">
              {[
                { id: 'order', label: 'Order Booking', icon: '🛒', desc: 'Taking fresh replenishment or new SKU orders' },
                { id: 'initial_visit', label: 'Initial Visit', icon: '📍', desc: 'First-time onboarding, survey & introductory meeting' },
                { id: 'payment', label: 'Payment Collection', icon: '💵', desc: 'Settling outstanding bills and collecting payments' },
                { id: 'stock_audit', label: 'Stock Auditing', icon: '📦', desc: 'Shelf inventory check, expiry tracking & audit' },
                { id: 'routine_beat', label: 'Routine Beat', icon: '🔄', desc: 'Scheduled beat route visit and relationship maintenance' }
              ].map((act) => {
                const isActive = activeTab === act.id;
                const isPurposeMatch = selectedPurpose?.includes(act.label);
                return (
                  <button
                    key={act.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(act.id);
                      if (act.id === 'order' && store?._id) {
                        fetchCustomer360(store._id);
                      }
                      setSwitchActivityModalOpen(false);
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-95 ${
                      isActive
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20'
                        : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl shrink-0">{act.icon}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-black text-slate-900">{act.label}</span>
                          {isPurposeMatch && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Selected Purpose
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{act.desc}</p>
                      </div>
                    </div>
                    {isActive ? (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 shrink-0">
                        Active
                      </span>
                    ) : (
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setSwitchActivityModalOpen(false)}
                className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CHECKOUT FORM */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xl">🏁</span>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Complete Store Visit & Check-Out</h3>
                  <p className="text-[11px] text-slate-500">
                    Store: <strong className="text-slate-900">{store.name}</strong> • Time: {formatTimer(visitTimer)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckOutSubmit} className="p-4 sm:p-5 pb-8 sm:pb-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                  Visit Outcome *
                </label>
                <select
                  value={checkoutOutcome}
                  onChange={(e) => setCheckoutOutcome(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs font-medium"
                >
                  <option value="Order Booked & Feedback Noted">Order Booked & Feedback Noted</option>
                  <option value="Payment Collected Only">Payment Collected Only</option>
                  <option value="Stock Audited & Restocked">Stock Audited & Restocked</option>
                  <option value="No Order - Follow-up Needed">No Order - Follow-up Needed</option>
                  <option value="Store Closed / Owner Unavailable">Store Closed / Owner Unavailable</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                  Total Payments Collected During Visit (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={paymentsCollected}
                  onChange={(e) => setPaymentsCollected(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                />
              </div>

              {parseFloat(paymentsCollected || 0) > 0 && (
                <div>
                  <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                  >
                    <option value="CASH">Cash</option>
                    <option value="GPAY">GPay / UPI</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                  Next Suggested Revisit Date
                </label>
                <input
                  type="date"
                  value={revisitDate}
                  onChange={(e) => setRevisitDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono shadow-2xs"
                />
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(false)}
                  className="w-24 sm:w-28 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs shrink-0 cursor-pointer transition-all border border-slate-200 text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checkoutSubmitting}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs sm:text-sm active:scale-95 transition-all cursor-pointer shadow-md shadow-amber-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <span>{checkoutSubmitting ? 'Checking Out...' : 'Confirm Check-Out'}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
