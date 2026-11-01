import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DollarSign, Plus, CheckCircle2, Clock, Calendar, 
  Search, FileText, Camera, UploadCloud, X, ArrowRight,
  Receipt, Building, Smartphone, Banknote, ShieldCheck
} from 'lucide-react';

export default function SalesCollectionsPage() {
  const [activeTab, setActiveTab] = useState('collect'); // 'collect', 'commitments'
  const [shops, setShops] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Collection Form state (Module 24)
  const [selectedShopId, setSelectedShopId] = useState('');
  const [shop360Data, setShop360Data] = useState(null);
  const [shop360Loading, setShop360Loading] = useState(false);

  const [amount, setAmount] = useState(''); // How much collected
  const [paymentMethod, setPaymentMethod] = useState('CASH'); // 'CASH', 'GPAY', 'CHEQUE'
  const [paymentReason, setPaymentReason] = useState('Outstanding Balance Clearance');
  const [customReason, setCustomReason] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [collecting, setCollecting] = useState(false);

  // Commitment Form state (Module 25)
  const [commitModalOpen, setCommitModalOpen] = useState(false);
  const [commitShopId, setCommitShopId] = useState('');
  const [commitAmount, setCommitAmount] = useState('');
  const [commitDate, setCommitDate] = useState('');
  const [commitRemarks, setCommitRemarks] = useState('');

  // Fetch Store 360 to get outstanding and already paid amounts automatically
  const fetchStore360 = async (storeId) => {
    if (!storeId) return;
    setShop360Loading(true);
    try {
      const res = await axios.get(`/field-sales/shops/${storeId}/360`);
      if (res.data?.success) {
        setShop360Data(res.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch store 360 data:', err);
    } finally {
      setShop360Loading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shopsRes, commitRes] = await Promise.all([
        axios.get('/field-sales/shops'),
        axios.get('/field-sales/commitments')
      ]);

      if (shopsRes.data?.success) {
        const fetchedShops = shopsRes.data.data || [];
        setShops(fetchedShops);
        if (fetchedShops.length > 0) {
          const firstId = fetchedShops[0]._id;
          setSelectedShopId(firstId);
          setCommitShopId(firstId);
          fetchStore360(firstId);
        }
      }
      if (commitRes.data?.success) {
        setCommitments(commitRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching collections data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Whenever user changes selected store, re-fetch store balance automatically
  const handleStoreChange = (storeId) => {
    setSelectedShopId(storeId);
    fetchStore360(storeId);
  };

  // Live Auto-Calculation of Financials
  const totalOutstanding = parseFloat(shop360Data?.totalOutstanding || 0);
  const alreadyPaid = (shop360Data?.invoices || [])
    .filter(i => i.status === 'PAID')
    .reduce((sum, i) => sum + (parseFloat(i.totalAmount) || 0), 0);
  const collectedNow = parseFloat(amount) || 0;
  const balanceAmount = Math.max(0, totalOutstanding - collectedNow);

  // Handle Payment Collection Submit (Module 24)
  const handleCollectionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedShopId || !amount || collectedNow <= 0) {
      alert('Please enter a valid collected amount');
      return;
    }

    setCollecting(true);
    try {
      const selectedStore = shops.find(s => s._id === selectedShopId);
      const reasonText = paymentReason === 'Other' ? customReason : paymentReason;
      const refText = paymentMethod === 'CHEQUE' 
        ? `Cheque No: ${chequeNo}${bankName ? ` (${bankName})` : ''}${chequeDate ? ` Dt: ${chequeDate}` : ''}`
        : (paymentMethod === 'GPAY' ? `GPay UPI: ${paymentRef}` : paymentRef);

      const finalRemarks = [
        `Reason: ${reasonText}`,
        refText ? `Ref: ${refText}` : '',
        remarks ? `Remarks: ${remarks}` : ''
      ].filter(Boolean).join(' | ');

      const res = await axios.post('/field-sales/collections', {
        storeId: selectedShopId,
        amount: collectedNow,
        paymentMethod,
        paymentReference: paymentMethod === 'CHEQUE' ? chequeNo : paymentRef,
        remarks: finalRemarks
      });

      if (res.data?.success) {
        alert(`✓ Payment collection of ₹${collectedNow.toFixed(2)} recorded successfully for ${selectedStore?.name || 'store'}!`);
        setAmount('');
        setPaymentRef('');
        setChequeNo('');
        setBankName('');
        setChequeDate('');
        setCustomReason('');
        setRemarks('');
        fetchStore360(selectedShopId);
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Collection failed');
    } finally {
      setCollecting(false);
    }
  };

  // Handle Payment Commitment Submit (Module 25)
  const handleCommitmentSubmit = async (e) => {
    e.preventDefault();
    if (!commitShopId || !commitAmount || !commitDate) {
      alert('Please fill all required fields');
      return;
    }

    const shop = shops.find(s => s._id === commitShopId);
    try {
      const res = await axios.post('/field-sales/commitments', {
        storeId: commitShopId,
        storeName: shop?.name || 'Retail Store',
        promisedAmount: parseFloat(commitAmount),
        expectedDate: commitDate,
        customerRemarks: commitRemarks
      });

      if (res.data?.success) {
        alert('Payment commitment recorded!');
        setCommitModalOpen(false);
        setCommitAmount('');
        setCommitRemarks('');
        fetchData();
      }
    } catch (err) {
      alert('Failed to record commitment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Payment Collection & Commitments
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Modules 24–25: Record In-Field Cash / UPI Collections & Track Promised Payments
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCommitModalOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
        >
          <Calendar className="w-4 h-4" />
          <span>Record Payment Commitment</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('collect')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'collect' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Record Collection (Module 24)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('commitments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'commitments' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          Commitment Tracking ({commitments.length})
        </button>
      </div>

      {/* Tab 1: Record Collection */}
      {activeTab === 'collect' && (
        <div className="max-w-2xl mx-auto space-y-5">
          {/* Main Card */}
          <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-3xl space-y-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Record In-Store Payment Receipt</h3>
                  <p className="text-xs text-slate-500">Automated ledger balance calculation & digital payment slip</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hidden sm:inline-block">
                Auto-Ledger Sync
              </span>
            </div>

            {/* Store Selector */}
            <div>
              <label className="block font-bold text-slate-700 uppercase text-xs mb-1.5">
                Select Customer Shop *
              </label>
              <select
                value={selectedShopId}
                onChange={(e) => handleStoreChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium"
              >
                {shops.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} — {s.address || s.city || 'Tamil Nadu'}
                  </option>
                ))}
              </select>
            </div>

            {/* 4 AUTOMATED FINANCIAL METRIC CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 1. Total Outstanding */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Total Outstanding</span>
                <span className="text-sm sm:text-base font-black text-rose-600 font-mono">
                  ₹{totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Billed Open Dues</span>
              </div>

              {/* 2. Already Paid */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Paid Amount</span>
                <span className="text-sm sm:text-base font-black text-cyan-700 font-mono">
                  ₹{alreadyPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Past Collections</span>
              </div>

              {/* 3. How Much Collected */}
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl">
                <span className="text-[10px] text-emerald-800 uppercase font-bold block mb-1">How Much Collected</span>
                <span className="text-sm sm:text-base font-black text-emerald-700 font-mono">
                  ₹{collectedNow.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] text-emerald-600 block mt-0.5">Current Receipt</span>
              </div>

              {/* 4. Balance Amount (Auto-Calculated) */}
              <div className={`p-3 rounded-2xl border ${
                balanceAmount === 0 && totalOutstanding > 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}>
                <span className="text-[10px] uppercase font-bold block mb-1">
                  {balanceAmount === 0 && totalOutstanding > 0 ? '✓ Zero Balance' : 'Balance Amount'}
                </span>
                <span className="text-sm sm:text-base font-black font-mono block">
                  ₹{balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[9px] opacity-80 block mt-0.5">
                  {balanceAmount === 0 && totalOutstanding > 0 ? 'Fully Cleared' : 'Remaining Due'}
                </span>
              </div>
            </div>

            <form onSubmit={handleCollectionSubmit} className="space-y-4 text-xs pt-1">
              {/* How Much Collected Input */}
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                  How Much Collected (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount collected..."
                    className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                  {totalOutstanding > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(totalOutstanding.toString())}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors"
                    >
                      Fill Full Due
                    </button>
                  )}
                </div>
              </div>

              {/* PAYMENT COLLECTION METHODS: CASH, GPAY, CHEQ */}
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1.5">
                  Payment Collection Method *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Option 1: Cash */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3 rounded-2xl border text-center cursor-pointer transition-all ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex justify-center mb-1">
                      <Banknote className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="font-bold text-xs text-slate-900">💵 Cash</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Physical Cash</p>
                  </button>

                  {/* Option 2: GPay / UPI */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('GPAY')}
                    className={`p-3 rounded-2xl border text-center cursor-pointer transition-all ${
                      paymentMethod === 'GPAY'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex justify-center mb-1">
                      <Smartphone className="w-5 h-5 text-indigo-600" />
                    </div>
                    <p className="font-bold text-xs text-slate-900">📱 GPay / UPI</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Google Pay / QR</p>
                  </button>

                  {/* Option 3: Cheque */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CHEQUE')}
                    className={`p-3 rounded-2xl border text-center cursor-pointer transition-all ${
                      paymentMethod === 'CHEQUE'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex justify-center mb-1">
                      <Building className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className="font-bold text-xs text-slate-900">🏦 Cheque</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Bank Cheque</p>
                  </button>
                </div>
              </div>

              {/* Dynamic Inputs for GPay / Cheque */}
              {paymentMethod === 'GPAY' && (
                <div className="bg-indigo-50/70 border border-indigo-200 p-3 rounded-2xl space-y-2 animate-in fade-in">
                  <label className="block font-bold text-indigo-900 uppercase text-[10px]">
                    GPay / UPI Transaction ID / UTR Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. 402918274920 or UPI Ref ID"
                    className="w-full bg-white border border-indigo-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              )}

              {paymentMethod === 'CHEQUE' && (
                <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl space-y-3 animate-in fade-in">
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                    Cheque Information
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-700 text-[10px] uppercase mb-1">Cheque Number *</label>
                      <input
                        type="text"
                        required
                        value={chequeNo}
                        onChange={(e) => setChequeNo(e.target.value)}
                        placeholder="e.g. 000452"
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 text-[10px] uppercase mb-1">Bank Name *</label>
                      <input
                        type="text"
                        required
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. SBI, HDFC, ICICI"
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 text-[10px] uppercase mb-1">Cheque Date</label>
                      <input
                        type="date"
                        value={chequeDate}
                        onChange={(e) => setChequeDate(e.target.value)}
                        className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PAYMENT FOR REASON OF PAYMENT */}
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1.5">
                  Payment for Reason of Payment *
                </label>
                <select
                  value={paymentReason}
                  onChange={(e) => setPaymentReason(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="Outstanding Balance Clearance">Outstanding Balance Clearance (Old Dues)</option>
                  <option value="Partial Invoice Clearance">Partial Invoice Clearance</option>
                  <option value="Spot Order Delivery Payment">Spot Order Delivery Payment</option>
                  <option value="Advance Deposit for Future Stock">Advance Deposit for Upcoming Delivery</option>
                  <option value="Cheque Clearance / Replacement">Cheque Clearance / Replacement</option>
                  <option value="Other">Other Specific Reason</option>
                </select>

                {paymentReason === 'Other' && (
                  <input
                    type="text"
                    required
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Specify the exact reason for this payment..."
                    className="w-full mt-2 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                )}
              </div>

              {/* Optional Collection Remarks */}
              <div>
                <label className="block font-bold text-slate-700 uppercase text-[11px] mb-1">
                  Collection Remarks / Notes
                </label>
                <textarea
                  rows="2"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Handed physical receipt copy, collected from store cashier..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={collecting || collectedNow <= 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
              >
                <Receipt className="w-4 h-4" />
                <span>
                  {collecting
                    ? 'Recording Receipt...'
                    : `Confirm Payment Collection (₹${collectedNow.toFixed(2)})`}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: Commitments List (Module 25) */}
      {activeTab === 'commitments' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Store Name</th>
                <th className="px-4 py-3">Promised Amount</th>
                <th className="px-4 py-3">Target Date</th>
                <th className="px-4 py-3">Remarks</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {commitments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                    No payment commitments recorded. Click "Record Payment Commitment" above.
                  </td>
                </tr>
              ) : (
                commitments.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-900">{c.storeName}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-600">
                      ₹{(c.promisedAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-amber-600 font-mono">
                      {new Date(c.expectedDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-500">
                      {c.customerRemarks || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Commitment Modal */}
      {commitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setCommitModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl bg-slate-100 hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-slate-900 mb-1">Record Payment Commitment</h3>
            <p className="text-xs text-slate-500 mb-4">Module 25: Track promised amounts & target clearance date</p>

            <form onSubmit={handleCommitmentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Retail Shop *</label>
                <select
                  value={commitShopId}
                  onChange={(e) => setCommitShopId(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  {shops.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Promised Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={commitAmount}
                  onChange={(e) => setCommitAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Expected Clearance Date *</label>
                <input
                  type="date"
                  required
                  value={commitDate}
                  onChange={(e) => setCommitDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Customer Remarks</label>
                <textarea
                  rows="2"
                  value={commitRemarks}
                  onChange={(e) => setCommitRemarks(e.target.value)}
                  placeholder="Cheque will be issued after weekend sales..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-black py-3 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-cyan-600/20"
              >
                Log Commitment Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
