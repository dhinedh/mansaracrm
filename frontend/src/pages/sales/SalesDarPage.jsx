// src/pages/sales/SalesDarPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FileText, Calendar, CheckCircle2, ShoppingBag, 
  DollarSign, MapPin, Download, RefreshCw, Award,
  Clock, TrendingUp, Phone, Send, ChevronRight,
  Package, CreditCard, ChevronDown, Check, AlertCircle,
  ExternalLink, Layers, ArrowUpRight, Filter
} from 'lucide-react';

export default function SalesDarPage() {
  const [selectedRange, setSelectedRange] = useState('today'); // 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [activeTab, setActiveTab] = useState('visits'); // 'visits' | 'orders' | 'collections' | 'skus'
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [customNote, setCustomNote] = useState('');

  // Calculate Date bounds based on selected range
  const getDateParams = () => {
    const today = new Date();
    const formatDate = (d) => d.toISOString().split('T')[0];

    if (selectedRange === 'today') {
      const dStr = formatDate(today);
      return { startDate: dStr, endDate: dStr };
    }
    if (selectedRange === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const dStr = formatDate(y);
      return { startDate: dStr, endDate: dStr };
    }
    if (selectedRange === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 6);
      return { startDate: formatDate(weekAgo), endDate: formatDate(today) };
    }
    if (selectedRange === 'month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: formatDate(monthStart), endDate: formatDate(today) };
    }
    return { startDate: customStartDate, endDate: customEndDate };
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      const { startDate, endDate } = getDateParams();
      const res = await axios.get(`/field-sales/dar?startDate=${startDate}&endDate=${endDate}`);
      if (res.data?.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching sales report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedRange, customStartDate, customEndDate]);

  const kpis = reportData?.kpis || {};
  const salesperson = reportData?.salesperson || {};
  const visits = reportData?.visits || [];
  const orders = reportData?.orders || [];
  const bills = reportData?.bills || [];
  const collections = reportData?.collections || [];
  const topSkus = reportData?.topSkus || [];

  // Format WhatsApp DAR Message
  const getWhatsAppMessage = () => {
    const start = reportData?.startDate || 'Today';
    const end = reportData?.endDate || 'Today';
    const dateLabel = start === end ? start : `${start} to ${end}`;

    let msg = `*MANSARA FOODS — FIELD SALES REPORT*\n`;
    msg += `📅 *Date:* ${dateLabel}\n`;
    msg += `👤 *Rep:* ${salesperson.name || 'Sales Representative'}\n`;
    msg += `📍 *Beat:* ${salesperson.beat || 'Territory Beat'}\n`;
    msg += `─────────────────────────\n`;
    msg += `🎯 *Target:* ₹${(kpis.targetOrderValue || 0).toLocaleString('en-IN')}\n`;
    msg += `💰 *Booked:* ₹${(kpis.salesValue || 0).toLocaleString('en-IN')} (${kpis.achievementPercent || 0}%)\n`;
    msg += `🧾 *Bills Issued:* ${kpis.billsGeneratedCount || bills.length || 0} Bills (₹${(kpis.billsTotalAmount || 0).toLocaleString('en-IN')})\n`;
    msg += `💵 *Collections:* ₹${(kpis.totalCollections || 0).toLocaleString('en-IN')}\n`;
    msg += `   • Cash: ₹${(kpis.cashCollected || 0).toLocaleString('en-IN')}\n`;
    msg += `   • UPI: ₹${(kpis.upiCollected || 0).toLocaleString('en-IN')}\n`;
    msg += `\n📍 *Store Visits:* ${kpis.visitsCompleted || 0} / ${kpis.totalVisits || 0}\n`;
    msg += `✅ *Strike Rate:* ${kpis.strikeRate || 0}% (${kpis.ordersBookedCount || 0} Orders)\n`;
    if (kpis.dutyMinutes > 0) {
      const hrs = Math.floor(kpis.dutyMinutes / 60);
      const mins = kpis.dutyMinutes % 60;
      msg += `⏱️ *Duty Time:* ${hrs}h ${mins}m\n`;
    }

    if (topSkus.length > 0) {
      msg += `\n📦 *Top SKUs Sold:*\n`;
      topSkus.slice(0, 3).forEach((sku, idx) => {
        msg += `${idx + 1}. ${sku.name}: ${sku.quantity} pcs (₹${sku.revenue.toLocaleString('en-IN')})\n`;
      });
    }

    if (customNote.trim()) {
      msg += `\n📝 *Field Notes:* ${customNote.trim()}\n`;
    }

    msg += `─────────────────────────\n`;
    msg += `_Generated via Mansara CRM_`;
    return encodeURIComponent(msg);
  };

  const handleOpenWhatsApp = () => {
    const encoded = getWhatsAppMessage();
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
    setShowShareModal(false);
  };

  return (
    <div className="space-y-4 pb-20 max-w-7xl mx-auto px-1 sm:px-4">
      {/* 1. Header & Identity Bar */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-100">
                Field Sales Report Hub
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-0.5">
              Sales & Activity Report
            </h1>
            <p className="text-xs text-amber-100/90 font-medium mt-0.5">
              {salesperson.name || 'Sales Representative'} • Beat: <span className="underline decoration-amber-300 font-bold">{salesperson.beat || 'Assigned Territory'}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setShowShareModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Share ASM</span>
            </button>
            <button
              onClick={() => window.print()}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <button
              onClick={fetchReport}
              disabled={loading}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-xl text-white transition-all active:scale-95 disabled:opacity-50"
              title="Refresh Report"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Date Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mt-4 pt-3 border-t border-white/20">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'Last 7 Days' },
            { id: 'month', label: 'This Month' },
            { id: 'custom', label: 'Custom 📅' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedRange(item.id);
                if (item.id === 'custom') setShowCustomPicker(true);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedRange === item.id
                  ? 'bg-white text-amber-900 shadow-sm'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Modal/Dropdown */}
      {showCustomPicker && selectedRange === 'custom' && (
        <div className="bg-white border border-amber-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-600">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium flex-1 focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-600">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium flex-1 focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            onClick={() => {
              setShowCustomPicker(false);
              fetchReport();
            }}
            className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs ml-auto shadow-sm"
          >
            Apply Range
          </button>
        </div>
      )}

      {/* 2. Target vs Achieved Hero Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              🎯
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Sales Target vs Booked
              </span>
              <div className="text-lg sm:text-xl font-black text-slate-900">
                ₹{(kpis.salesValue || 0).toLocaleString('en-IN')}
                <span className="text-xs font-bold text-slate-400 font-normal"> / ₹{(kpis.targetOrderValue || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${
              (kpis.achievementPercent || 0) >= 100 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}>
              {kpis.achievementPercent || 0}% Quota
            </span>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              {kpis.remainingTarget > 0 ? `₹${kpis.remainingTarget.toLocaleString('en-IN')} to go` : '🎯 Target Smashed!'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-3">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              (kpis.achievementPercent || 0) >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
            }`}
            style={{ width: `${Math.min(100, kpis.achievementPercent || 0)}%` }}
          />
        </div>
      </div>

      {/* 3. 2x2 Quick KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Visits & Strike Rate */}
        <div className="bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Visits & Strike</span>
            <MapPin className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {kpis.visitsCompleted || 0}
            <span className="text-xs text-slate-400 font-normal"> / {kpis.totalVisits || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-bold text-emerald-700">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>{kpis.strikeRate || 0}% Strike Rate</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {kpis.gpsVerifiedVisits || 0} GPS verified visits
          </p>
        </div>

        {/* Collections */}
        <div className="bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Collections</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            ₹{(kpis.totalCollections || 0).toLocaleString('en-IN')}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-slate-600">
            <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded">Cash: ₹{(kpis.cashCollected || 0).toLocaleString('en-IN')}</span>
            <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded">UPI: ₹{(kpis.upiCollected || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Orders Booked & AOV */}
        <div className="bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Orders Booked</span>
            <ShoppingBag className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {kpis.ordersBookedCount || 0}
            <span className="text-xs text-slate-400 font-normal"> orders</span>
          </div>
          <p className="text-[11px] font-bold text-slate-700 mt-1.5">
            AOV: <span className="text-amber-600 font-black">₹{(kpis.averageOrderValue || 0).toLocaleString('en-IN')}</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {kpis.totalItemsSold || 0} total units booked
          </p>
        </div>

        {/* Field Duty Time */}
        <div className="bg-white border border-slate-200 p-3.5 sm:p-4 rounded-2xl shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Field Duty</span>
            <Clock className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {kpis.dutyMinutes ? `${Math.floor(kpis.dutyMinutes / 60)}h ${kpis.dutyMinutes % 60}m` : '--'}
          </div>
          <p className="text-[10px] text-slate-500 font-medium mt-1.5 truncate">
            In: {kpis.firstCheckIn ? new Date(kpis.firstCheckIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
            {' • '}
            Out: {kpis.lastCheckOut ? new Date(kpis.lastCheckOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
          </p>
          <p className="text-[10px] text-cyan-700 font-bold mt-0.5">
            {kpis.followUpsCompleted || 0}/{kpis.followUpsScheduled || 0} Follow-ups Done
          </p>
        </div>
      </div>

      {/* 4. Tab Navigation Strip */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
        {[
          { id: 'visits', label: `Visits (${visits.length})`, icon: MapPin },
          { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
          { id: 'bills', label: `Bills Generated (${bills.length})`, icon: FileText },
          { id: 'collections', label: `Collections (${collections.length})`, icon: CreditCard },
          { id: 'skus', label: `SKUs Sold (${topSkus.length})`, icon: Package }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-1 justify-center ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. Tab Content Sections */}

      {/* TAB 1: VISITS (DAR) */}
      {activeTab === 'visits' && (
        <div className="space-y-3">
          {visits.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
              <MapPin className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-600">No visits logged for this period</p>
              <p className="text-xs text-slate-400 mt-1">Start a store check-in from your route beat.</p>
            </div>
          ) : (
            visits.map((v, i) => (
              <div
                key={v.id || i}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-amber-300 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        #{String(i + 1).padStart(2, '0')}
                      </span>
                      <h3 className="font-black text-sm text-slate-900 truncate">
                        {v.storeName}
                      </h3>
                      {v.verified && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> GPS Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span>{v.purpose}</span>
                      {v.phone && (
                        <a
                          href={`tel:${v.phone}`}
                          className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-0.5"
                        >
                          <Phone className="w-3 h-3" /> Call
                        </a>
                      )}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs text-slate-500 font-medium">
                      {new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.checkOutTime 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {v.checkOutTime ? 'Completed' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Outcome & Financials */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs flex-wrap gap-2">
                  <p className="text-slate-600 italic text-[11px] flex-1 min-w-[200px]">
                    "{v.outcome || 'Routine retail audit'}"
                  </p>
                  <div className="flex items-center gap-3">
                    {v.orderValue > 0 && (
                      <span className="text-amber-700 font-black text-xs">
                        Order: ₹{v.orderValue.toLocaleString('en-IN')}
                      </span>
                    )}
                    {v.paymentsCollected > 0 && (
                      <span className="text-emerald-700 font-black text-xs">
                        Col: ₹{v.paymentsCollected.toLocaleString('en-IN')}
                      </span>
                    )}
                    {v.checkInLat && v.checkInLng && (
                      <a
                        href={`https://maps.google.com/?q=${v.checkInLat},${v.checkInLng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-slate-700"
                        title="Open in Google Maps"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: ORDERS BOOKED */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
              <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-600">No sales orders booked in this period</p>
              <p className="text-xs text-slate-400 mt-1">Orders booked via mobile catalogue will appear here.</p>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-amber-300 transition-all cursor-pointer"
                onClick={() => setSelectedOrder(ord)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-800">
                        {ord.orderNumber}
                      </span>
                      <span className="bg-amber-50 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200">
                        {ord.status}
                      </span>
                    </div>
                    <h3 className="font-black text-sm text-slate-900 mt-1">
                      {ord.storeName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {ord.itemsCount} items • Mode: <span className="font-bold text-slate-700">{ord.paymentMethod}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-black text-amber-600">
                      ₹{(ord.totalAmount || 0).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(ord.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Click to view order item details</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: BILLS GENERATED */}
      {activeTab === 'bills' && (
        <div className="space-y-3">
          {/* Summary Strip */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">
                Total Bills Issued
              </span>
              <div className="text-xl font-black text-amber-900">
                {bills.length} Tax Invoices
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Gross Billing Value</span>
              <div className="text-lg font-black text-amber-600">
                ₹{(kpis.billsTotalAmount || bills.reduce((acc, b) => acc + (b.totalAmount || 0), 0)).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {bills.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-600">No bills generated for this period</p>
              <p className="text-xs text-slate-400 mt-1">Direct spot invoices and billing entries will appear here.</p>
            </div>
          ) : (
            bills.map((bill) => (
              <div
                key={bill.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-amber-300 transition-all space-y-2.5"
              >
                {/* Header: Invoice No + Date + Result Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">
                        {bill.invoiceNo}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        bill.resultStatus === 'COLLECTED' || bill.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : bill.resultStatus === 'PARTIALLY_COLLECTED'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {bill.resultStatus === 'COLLECTED' || bill.status === 'PAID' ? '● Fully Paid / Collected' : '○ Pending Collection'}
                      </span>
                    </div>
                    <h3 className="font-black text-sm text-slate-900 mt-1.5">
                      To: {bill.customerName}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-base sm:text-lg font-black text-slate-900">
                      ₹{(bill.totalAmount || 0).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(bill.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Details: Billing Reason, Terms, Phone */}
                <div className="bg-slate-50 rounded-xl p-2.5 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Billing Reason:</span>
                    <span className="font-semibold text-slate-800">{bill.billingReason || 'Spot Sale / Direct Order'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Payment Mode:</span>
                    <span className="font-bold text-slate-800">{bill.paymentMethod}</span>
                    {bill.dueDate && (
                      <span className="text-[10px] text-amber-700 ml-1.5 font-medium">
                        (Due: {new Date(bill.dueDate).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer contact & Address */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span className="truncate max-w-[240px] sm:max-w-md">
                    📍 {bill.customerAddress || 'Direct Retail Counter'}
                  </span>
                  {bill.customerPhone && (
                    <a
                      href={`tel:${bill.customerPhone}`}
                      className="text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 shrink-0 ml-2"
                    >
                      <Phone className="w-3 h-3" /> Call
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: COLLECTIONS LEDGER */}
      {activeTab === 'collections' && (
        <div className="space-y-3">
          {/* Summary Strip */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                Total Reconciled Collections
              </span>
              <div className="text-xl font-black text-emerald-800">
                ₹{(kpis.totalCollections || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="text-right text-xs space-y-0.5">
              <div>Cash: <span className="font-bold">₹{(kpis.cashCollected || 0).toLocaleString('en-IN')}</span></div>
              <div>UPI: <span className="font-bold">₹{(kpis.upiCollected || 0).toLocaleString('en-IN')}</span></div>
            </div>
          </div>

          {collections.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
              <CreditCard className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-600">No payment receipts logged</p>
              <p className="text-xs text-slate-400 mt-1">Record collections during store visits or invoice settlement.</p>
            </div>
          ) : (
            collections.map((c, i) => (
              <div
                key={c.id || i}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-black text-sm text-slate-900">{c.storeName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
                      {c.method}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Ref: {c.reference}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-black text-emerald-600">
                    +₹{c.amount.toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(c.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: SKU PENETRATION */}
      {activeTab === 'skus' && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Product Movement Analytics
              </span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                {topSkus.length} Distinct SKUs Booked
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-amber-600">
                {kpis.totalItemsSold || 0} Total Units
              </span>
            </div>
          </div>

          {topSkus.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
              <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-sm text-slate-600">No SKU data available for this range</p>
            </div>
          ) : (
            topSkus.map((sku, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 font-black text-xs flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">{sku.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Booked in {sku.orderCount} orders
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-slate-900">
                    {sku.quantity} pcs
                  </div>
                  <div className="text-xs font-bold text-amber-600">
                    ₹{sku.revenue.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL 1: ORDER DETAIL MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-600">Sales Order Detail</span>
                <h3 className="text-base font-black text-slate-900">{selectedOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="py-3 text-xs space-y-1">
              <p><strong className="text-slate-700">Customer:</strong> {selectedOrder.storeName}</p>
              {selectedOrder.address && <p><strong className="text-slate-700">Address:</strong> {selectedOrder.address}</p>}
              <p><strong className="text-slate-700">Payment Mode:</strong> {selectedOrder.paymentMethod}</p>
            </div>

            <div className="mt-2 border rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b text-[11px]">
                  <tr>
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Price</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedOrder.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-medium text-slate-800">{it.productName || 'Product'}</td>
                      <td className="p-2.5 text-center font-bold">{it.quantity}</td>
                      <td className="p-2.5 text-right font-mono">₹{it.price || it.unitPrice}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900 font-mono">
                        ₹{(it.lineTotal || (it.quantity * (it.price || it.unitPrice))).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-3 border-t flex items-center justify-between">
              <span className="font-bold text-slate-700 text-sm">Grand Total:</span>
              <span className="text-lg font-black text-amber-600">
                ₹{(selectedOrder.totalAmount || 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: WHATSAPP SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  📲
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Share Report to Manager</h3>
                  <p className="text-[10px] text-slate-400">Sends formatted summary to WhatsApp</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold flex items-center justify-center hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Add Optional Note / Remark for ASM:
                </label>
                <textarea
                  rows={2}
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Completed South Beat route. Heavy rainfall in evening, 2 shops rescheduled."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                {decodeURIComponent(getWhatsAppMessage())}
              </div>

              <button
                onClick={handleOpenWhatsApp}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Launch WhatsApp Now</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
