// src/pages/admin/StallsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, 
  Store, 
  User, 
  MapPin, 
  TrendingUp, 
  IndianRupee, 
  Calendar, 
  Activity, 
  CheckCircle,
  FileText,
  DollarSign,
  ChevronRight,
  Loader2,
  AlertTriangle
} from 'lucide-react';

export default function StallsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [operatorName, setOperatorName] = useState('');
  const [investment, setInvestment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedSessionReport, setSelectedSessionReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/stalls/sessions');
      setSessions(res.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch stall sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await axios.post('/stalls/sessions', {
        name,
        location,
        operatorName,
        investment: parseFloat(investment || 0)
      });
      setName('');
      setLocation('');
      setOperatorName('');
      setInvestment('');
      setShowCreateModal(false);
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSession = async (id) => {
    if (!window.confirm('Are you sure you want to close this stall session? No further sales can be added.')) {
      return;
    }
    try {
      await axios.post(`/stalls/sessions/${id}/close`);
      fetchSessions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close session');
    }
  };

  const handleViewReport = async (id) => {
    try {
      setReportLoading(true);
      setShowReportModal(true);
      const res = await axios.get(`/stalls/sessions/${id}/report`);
      setSelectedSessionReport(res.data.data);
    } catch (err) {
      alert('Failed to load report data');
      setShowReportModal(false);
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="w-7 h-7 text-rose-500" />
            B2C Stall Module
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage high-speed direct-to-customer stall billing, locations, and real-time profitability metrics.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Start New Stall Session
        </button>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
          <p className="text-slate-500 mt-2 font-medium">Loading stall sessions...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-6 h-6 text-rose-500" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">No Stall Sessions Yet</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mt-1">
            Start your first direct sales session to manage on-site billing and live event reports.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            Launch Stall Session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((sess) => (
            <div 
              key={sess.id} 
              className={`bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden ${
                sess.status === 'ACTIVE' ? 'border-rose-100 bg-gradient-to-tr from-white to-rose-50/20' : 'border-slate-200'
              }`}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                  sess.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${sess.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  {sess.status}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-800 pr-16">{sess.name}</h3>
                
                {/* Session Details */}
                <div className="space-y-2 mt-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{sess.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Operator: <strong className="text-slate-700">{sess.operatorName}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-slate-400" />
                    <span>Investment: <strong className="text-slate-700">₹{sess.investment?.toLocaleString()}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Opened: {new Date(sess.startDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-100">
                {sess.status === 'ACTIVE' ? (
                  <>
                    <button
                      onClick={() => navigate(`/admin/stall-billing?sessionId=${sess.id}`)}
                      className="bg-rose-500 hover:bg-rose-600 text-white py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      <Store className="w-3.5 h-3.5" />
                      Billing Terminal
                    </button>
                    <button
                      onClick={() => handleCloseSession(sess.id)}
                      className="border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Close Stall
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleViewReport(sess.id)}
                      className="col-span-2 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      View P&L Report
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Start Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-black text-slate-850 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Store className="w-5 h-5 text-rose-500" />
              Launch Stall Session
            </h2>
            <form onSubmit={handleCreateSession} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Stall Name / Event</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Pondicherry Food Fest Stall 1"
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Location</label>
                <input 
                  type="text" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Pondicherry"
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Operator Name (Staff In-Charge)</label>
                <input 
                  type="text" 
                  value={operatorName} 
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="e.g. Murali Krishnan"
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Stall Investment (₹)</label>
                <input 
                  type="number" 
                  value={investment} 
                  onChange={(e) => setInvestment(e.target.value)}
                  placeholder="e.g. 5000"
                  required
                  min="0"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white transition flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Open Stall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* P&L Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h2 className="text-xl font-black text-slate-850 flex items-center gap-2">
                <TrendingUp className="w-5.5 h-5.5 text-rose-500" />
                Stall P&L Analytics Report
              </h2>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {reportLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                <p className="text-slate-500 mt-2">Generating P&L statements...</p>
              </div>
            ) : selectedSessionReport ? (
              <div className="space-y-6 mt-4">
                {/* Basic Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl text-sm">
                  <div>
                    <span className="text-slate-400 text-xs font-semibold block uppercase">Stall</span>
                    <strong className="text-slate-700">{selectedSessionReport.session.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-semibold block uppercase">Location</span>
                    <strong className="text-slate-700">{selectedSessionReport.session.location}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-semibold block uppercase">Operator</span>
                    <strong className="text-slate-700">{selectedSessionReport.session.operatorName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs font-semibold block uppercase">Duration</span>
                    <strong className="text-slate-700">
                      {new Date(selectedSessionReport.session.startDate).toLocaleDateString()}
                      {selectedSessionReport.session.endDate ? ` - ${new Date(selectedSessionReport.session.endDate).toLocaleDateString()}` : ''}
                    </strong>
                  </div>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                    <span className="text-slate-400 text-xs font-bold uppercase block">Stall Investment</span>
                    <div className="text-2xl font-black text-slate-800 mt-1">
                      ₹{selectedSessionReport.session.investment?.toLocaleString()}
                    </div>
                  </div>

                  <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                    <span className="text-slate-400 text-xs font-bold uppercase block">Total Sales Revenue</span>
                    <div className="text-2xl font-black text-slate-800 mt-1">
                      ₹{selectedSessionReport.metrics.totalRevenue?.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                      <span>Cash: ₹{selectedSessionReport.metrics.cashRevenue}</span>
                      <span>Online: ₹{selectedSessionReport.metrics.onlineRevenue}</span>
                    </div>
                  </div>

                  <div className={`border rounded-xl p-4 ${
                    selectedSessionReport.metrics.netProfit >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
                  }`}>
                    <span className="text-xs font-bold uppercase block">Net Profit / Loss</span>
                    <div className="text-2xl font-black mt-1">
                      ₹{selectedSessionReport.metrics.netProfit?.toLocaleString()}
                    </div>
                    <span className="text-[10px] font-semibold mt-1 block">
                      {selectedSessionReport.metrics.netProfit >= 0 ? '✅ Profitable Stall' : '❌ Non-Profitable Location'}
                    </span>
                  </div>
                </div>

                {/* Product Performance Table */}
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Product Demand Breakdown</h3>
                  {selectedSessionReport.productDemands.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-sm">
                      No sales items registered on this session.
                    </div>
                  ) : (
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-100">
                            <th className="p-3">Product</th>
                            <th className="p-3 text-center">Qty Sold</th>
                            <th className="p-3 text-right">Revenue Generated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSessionReport.productDemands.map((prod, index) => (
                            <tr key={prod.productId} className="border-b border-slate-50 hover:bg-slate-50/50">
                              <td className="p-3 font-semibold text-slate-700 flex items-center gap-2">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                                  index === 0 ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {index + 1}
                                </span>
                                {prod.productName}
                              </td>
                              <td className="p-3 text-center font-bold text-slate-850">{prod.quantitySold}</td>
                              <td className="p-3 text-right font-bold text-slate-850">₹{prod.totalRevenue?.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            <div className="mt-6 pt-4 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowReportModal(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-sm font-semibold transition"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
