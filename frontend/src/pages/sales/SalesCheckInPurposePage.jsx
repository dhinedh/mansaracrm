// src/pages/sales/SalesCheckInPurposePage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Store, Check, ArrowRight, ArrowLeft, MapPin, 
  Sparkles, CheckCircle2, AlertCircle, ShoppingCart, 
  CreditCard, Package, RefreshCw, Phone
} from 'lucide-react';

const VISIT_PURPOSES = [
  { id: 'Order Booking', label: '🛒 Order Booking', desc: 'Taking fresh replenishment or new SKU orders' },
  { id: 'Payment Collection', label: '💵 Payment Collection', desc: 'Settling outstanding bills and collecting payments' },
  { id: 'Stock Auditing', label: '📦 Stock Auditing', desc: 'Shelf inventory check, expiry tracking & audit' },
  { id: 'Initial Visit', label: '📍 Initial Visit', desc: 'First time visit to introduce Mansara products' },
  { id: 'Routine Beat', label: '🔄 Routine Beat', desc: 'Scheduled beat route visit and relationship maintenance' }
];

export default function SalesCheckInPurposePage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve shop and coordinates passed via router state or localStorage
  const shopFromState = location.state?.shop;
  const coordsFromState = location.state?.coords;
  const addressFromState = location.state?.address;

  const [shop, setShop] = useState(shopFromState || null);
  const [selectedPurposes, setSelectedPurposes] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!shop) {
      // Check if saved in sessionStorage/localStorage
      try {
        const saved = sessionStorage.getItem('mansara_pending_checkin_store');
        if (saved) {
          setShop(JSON.parse(saved));
        } else {
          // If no store selected, redirect back to check-in page
          navigate('/sales/checkin', { replace: true });
        }
      } catch (e) {
        navigate('/sales/checkin', { replace: true });
      }
    }
  }, [shop, navigate]);

  const togglePurposeSelection = (purposeId) => {
    setSelectedPurposes(prev => {
      if (prev.includes(purposeId)) {
        return prev.filter(p => p !== purposeId);
      } else {
        if (prev.length >= 2) {
          return [prev[0], purposeId]; // Replace 2nd purpose
        }
        return [...prev, purposeId];
      }
    });
  };

  const handleSelectCombination = (p1, p2) => {
    setSelectedPurposes([p1, p2]);
  };

  const handleConfirmCheckIn = async () => {
    if (!shop) return;
    if (selectedPurposes.length === 0) {
      alert('Please select at least 1 visit purpose to check in');
      return;
    }
    setSubmitting(true);
    const finalPurpose = selectedPurposes.join(' & ');

    try {
      const payload = {
        storeId: shop._id,
        dealerId: shop.dealerId?._id || shop.dealerId,
        visitorName: 'Sales Representative',
        purpose: finalPurpose,
        latitude: coordsFromState?.latitude || 11.9401,
        longitude: coordsFromState?.longitude || 79.4861,
        remarks: `Live GPS Check-In (${finalPurpose}) from ${addressFromState?.street || addressFromState?.city || 'Field App'}`
      };

      const res = await axios.post('/field-sales/visits/check-in', payload);
      if (res.data?.success) {
        const visit = res.data.data;
        // Store in localStorage for instant access across visits tab
        localStorage.setItem('mansara_active_visit', JSON.stringify({
          visit,
          store: shop,
          purpose: finalPurpose,
          startedAt: new Date().toISOString()
        }));

        sessionStorage.removeItem('mansara_pending_checkin_store');

        // Navigate directly to the dedicated store visit page
        navigate(`/sales/store-visit/${shop._id || shop.id}`, {
          state: {
            visit,
            store: shop,
            purpose: finalPurpose,
            activeVisitId: visit._id,
            activeStoreId: shop._id || shop.id
          }
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!shop) return null;

  return (
    <div className="max-w-xl mx-auto px-2 sm:px-4 pb-24 space-y-4">
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => navigate('/sales/checkin')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shops</span>
        </button>
        <span className="text-[11px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
          Step 2 of 2: Purpose
        </span>
      </div>

      {/* Selected Store Identity Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-start gap-4">
        <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200 shrink-0">
          <Store className="w-7 h-7" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
            Store Selected for Check-In
          </span>
          <h2 className="text-lg font-black text-slate-900 truncate mt-0.5">
            {shop.name}
          </h2>
          <p className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{shop.address || shop.city || 'Store Location'}</span>
          </p>
          {shop.phone && (
            <p className="text-xs text-amber-700 font-bold mt-1 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              <span>{shop.phone}</span>
            </p>
          )}
        </div>
      </div>

      {/* Purpose Options List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
            Select Visit Purpose:
          </span>
          <span className="text-xs font-bold text-slate-500">
            {selectedPurposes.length} of 2 Selected
          </span>
        </div>
        {VISIT_PURPOSES.map((p) => {
          const isSelected = selectedPurposes.includes(p.id);
          const orderIndex = selectedPurposes.indexOf(p.id);

          return (
            <div
              key={p.id}
              onClick={() => togglePurposeSelection(p.id)}
              className={`w-full p-4 rounded-3xl text-left transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99] border select-none ${
                isSelected
                  ? 'bg-amber-50/70 border-amber-500 text-slate-900 shadow-sm'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <div className="pr-3 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-black ${isSelected ? 'text-amber-900' : 'text-slate-900'}`}>
                    {p.label}
                  </span>
                  {isSelected && (
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-mono">
                      {orderIndex === 0 ? '✓ Purpose 1 (Primary)' : '✓ Purpose 2 (Secondary)'}
                    </span>
                  )}
                </div>
                <p className={`text-xs mt-1 leading-snug ${isSelected ? 'text-slate-700' : 'text-slate-500'}`}>
                  {p.desc}
                </p>
              </div>

              <div className={`w-7 h-7 rounded-2xl flex items-center justify-center shrink-0 transition-all border ${
                isSelected 
                  ? 'bg-amber-500 border-amber-500 text-white' 
                  : 'border-slate-300 bg-slate-50 text-transparent'
              }`}>
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky / Dedicated Confirm Check-In Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleConfirmCheckIn}
          disabled={submitting || selectedPurposes.length === 0}
          className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black py-4 rounded-2xl text-sm sm:text-base transition-all cursor-pointer shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>
            {submitting ? 'Confirming Check-In...' : (selectedPurposes.length === 0 ? 'Select Visit Purpose to Continue' : 'Confirm Check-In')}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <p className="text-[11px] text-center text-slate-400 mt-2 font-medium">
          Both purposes will be logged into your GPS visit audit and DAR report.
        </p>
      </div>
    </div>
  );
}
