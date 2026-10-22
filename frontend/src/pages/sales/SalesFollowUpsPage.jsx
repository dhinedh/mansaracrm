// src/pages/sales/SalesFollowUpsPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Clock, Plus, CheckCircle2, AlertCircle, Calendar, 
  Search, Phone, X, Check, ArrowRight, User 
} from 'lucide-react';

export default function SalesFollowUpsPage() {
  const [followUps, setFollowUps] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  // New follow-up modal state (Module 26)
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [selectedShopId, setSelectedShopId] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [reason, setReason] = useState('PAYMENT_COLLECTION');
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, sRes] = await Promise.all([
        axios.get('/field-sales/follow-ups'),
        axios.get('/field-sales/shops')
      ]);

      if (fRes.data?.success) setFollowUps(fRes.data.data || []);
      if (sRes.data?.success) {
        setShops(sRes.data.data || []);
        if (sRes.data.data?.length > 0) setSelectedShopId(sRes.data.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching follow-ups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateFollowUp = async (e) => {
    e.preventDefault();
    if (!title || !dueDate) {
      alert('Please enter title and due date');
      return;
    }

    try {
      const res = await axios.post('/field-sales/follow-ups', {
        title,
        storeId: selectedShopId || null,
        contactPerson,
        phone,
        dueDate,
        priority,
        reason,
        notes
      });

      if (res.data?.success) {
        alert('Follow-up task scheduled!');
        setModalOpen(false);
        setTitle('');
        setContactPerson('');
        setPhone('');
        setNotes('');
        fetchData();
      }
    } catch (err) {
      alert('Failed to schedule task');
    }
  };

  const handleComplete = async (id) => {
    const outcomeRemarks = prompt('Enter completion remarks / outcome:');
    if (!outcomeRemarks) return;

    try {
      const res = await axios.put(`/field-sales/follow-ups/${id}/complete`, {
        outcomeRemarks
      });
      if (res.data?.success) {
        alert('Task marked as completed!');
        fetchData();
      }
    } catch (err) {
      alert('Failed to update task');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Follow-Up & Reminder Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Modules 26–27: Payment Collections, Delivery Re-visits, Order Bookings & Complaints
          </p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule New Follow-Up</span>
        </button>
      </div>

      {/* Follow-Ups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {followUps.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400 bg-slate-800/40 rounded-3xl border border-white/5">
            No pending follow-ups. All clear!
          </div>
        ) : (
          followUps.map((f) => (
            <div 
              key={f._id} 
              className="bg-slate-800/80 border border-white/10 p-5 rounded-2xl flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                    f.priority === 'URGENT' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    f.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-white/10 text-slate-300'
                  }`}>
                    {f.priority}
                  </span>
                  <span className={`text-[10px] font-bold ${
                    f.status === 'COMPLETED' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {f.status}
                  </span>
                </div>

                <h3 className="text-sm font-black text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{f.notes || 'Routine follow-up task'}</p>

                <div className="mt-3 space-y-1 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Due: {new Date(f.dueDate).toLocaleDateString()}</span>
                  </div>
                  {f.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{f.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {f.status === 'PENDING' && (
                <div className="pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => handleComplete(f._id)}
                    className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark as Completed</span>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-black text-white mb-1">Schedule Follow-Up Task</h3>
            <p className="text-xs text-slate-400 mb-4">Module 26: Set target date, reason and urgency</p>

            <form onSubmit={handleCreateFollowUp} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Collect ₹12,500 pending invoice payment"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Linked Retail Shop</label>
                <select
                  value={selectedShopId}
                  onChange={(e) => setSelectedShopId(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">General Task (No Shop)</option>
                  {shops.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 uppercase mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Reason / Category</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="PAYMENT_COLLECTION">Payment Collection</option>
                  <option value="ORDER_BOOKING">Order Booking</option>
                  <option value="PROPOSAL_REVIEW">Proposal Review</option>
                  <option value="COMPLAINT">Complaint Resolution</option>
                  <option value="GENERAL">General Routine</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Notes</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional context or customer remarks..."
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs active:scale-95 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
              >
                Save Follow-Up Task
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
