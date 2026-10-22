// src/pages/sales/SalesCollectionsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  DollarSign, Plus, CheckCircle2, Clock, Calendar, 
  Search, FileText, Camera, UploadCloud, X, ArrowRight 
} from 'lucide-react';

export default function SalesCollectionsPage() {
  const [activeTab, setActiveTab] = useState('collect'); // 'collect', 'commitments'
  const [shops, setShops] = useState([]);
  const [commitments, setCommitments] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Collection Form state (Module 24)
  const [selectedShopId, setSelectedShopId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [collecting, setCollecting] = useState(false);

  // Commitment Form state (Module 25)
  const [commitModalOpen, setCommitModalOpen] = useState(false);
  const [commitShopId, setCommitShopId] = useState('');
  const [commitAmount, setCommitAmount] = useState('');
  const [commitDate, setCommitDate] = useState('');
  const [commitRemarks, setCommitRemarks] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shopsRes, commitRes] = await Promise.all([
        axios.get('/field-sales/shops'),
        axios.get('/field-sales/commitments')
      ]);

      if (shopsRes.data?.success) {
        setShops(shopsRes.data.data || []);
        if (shopsRes.data.data?.length > 0) {
          setSelectedShopId(shopsRes.data.data[0]._id);
          setCommitShopId(shopsRes.data.data[0]._id);
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

  // Handle Payment Collection Submit (Module 24)
  const handleCollectionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedShopId || !amount) {
      alert('Please select shop and collection amount');
      return;
    }

    setCollecting(true);
    try {
      const res = await axios.post('/field-sales/collections', {
        storeId: selectedShopId,
        amount: parseFloat(amount),
        paymentMethod,
        paymentReference: paymentRef,
        remarks
      });

      if (res.data?.success) {
        alert('Payment collection recorded successfully!');
        setAmount('');
        setPaymentRef('');
        setRemarks('');
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
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Payment Collection & Commitments
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Modules 24–25: Record In-Field Cash / UPI Collections & Track Promised Payments
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCommitModalOpen(true)}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
        >
          <Calendar className="w-4 h-4" />
          <span>Record Payment Commitment</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('collect')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'collect' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          Record Collection (Module 24)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('commitments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'commitments' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          Commitment Tracking ({commitments.length})
        </button>
      </div>

      {/* Tab 1: Record Collection */}
      {activeTab === 'collect' && (
        <div className="max-w-xl mx-auto bg-slate-800/80 border border-white/10 p-6 rounded-3xl space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Record In-Store Payment Receipt</h3>
              <p className="text-xs text-slate-400">Generate digital receipt and FIFO credit towards open invoices</p>
            </div>
          </div>

          <form onSubmit={handleCollectionSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Select Customer Shop *</label>
              <select
                value={selectedShopId}
                onChange={(e) => setSelectedShopId(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {shops.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} - {s.address || 'Chennai'}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Amount Collected (₹) *</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">UPI / QR Code</option>
                  <option value="CHEQUE">Bank Cheque</option>
                  <option value="NEFT">NEFT / RTGS</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">UPI / Cheque / Bank Reference No</label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="UPI Ref ID, Cheque No..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Collection Remarks</label>
              <textarea
                rows="2"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Clearance notes, partial payment agreed..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={collecting}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <DollarSign className="w-4 h-4" />
              <span>{collecting ? 'Recording Receipt...' : 'Confirm Payment Collection'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Commitments List (Module 25) */}
      {activeTab === 'commitments' && (
        <div className="bg-slate-800/80 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Store Name</th>
                <th className="px-4 py-3">Promised Amount</th>
                <th className="px-4 py-3">Target Date</th>
                <th className="px-4 py-3">Remarks</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {commitments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                    No payment commitments recorded. Click "Record Payment Commitment" above.
                  </td>
                </tr>
              ) : (
                commitments.map((c) => (
                  <tr key={c._id} className="hover:bg-white/5">
                    <td className="px-4 py-3 font-bold text-white">{c.storeName}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                      ₹{(c.promisedAmount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-amber-400 font-mono">
                      {new Date(c.expectedDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-400">
                      {c.customerRemarks || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400">
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setCommitModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-white mb-1">Record Payment Commitment</h3>
            <p className="text-xs text-slate-400 mb-4">Module 25: Track promised amounts & target clearance date</p>

            <form onSubmit={handleCommitmentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Retail Shop *</label>
                <select
                  value={commitShopId}
                  onChange={(e) => setCommitShopId(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {shops.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Promised Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={commitAmount}
                  onChange={(e) => setCommitAmount(e.target.value)}
                  placeholder="e.g. 15000"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Expected Clearance Date *</label>
                <input
                  type="date"
                  required
                  value={commitDate}
                  onChange={(e) => setCommitDate(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Customer Remarks</label>
                <textarea
                  rows="2"
                  value={commitRemarks}
                  onChange={(e) => setCommitRemarks(e.target.value)}
                  placeholder="Cheque will be issued after weekend sales..."
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-cyan-500/20"
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
