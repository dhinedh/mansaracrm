// src/pages/admin/TicketsPage.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { 
  HelpCircle, 
  Plus, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  User, 
  Tag, 
  AlertTriangle,
  ArrowRight,
  Send,
  Building2
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function TicketsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Dealer Submit states
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('DELIVERY'); // 'DELIVERY' | 'QUALITY' | 'BILLING' | 'OTHER'
  const [priority, setPriority] = useState('MEDIUM'); // 'LOW' | 'MEDIUM' | 'HIGH'
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal & Thread states
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const threadEndRef = useRef(null);

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  useEffect(() => {
    if (showDetailModal && threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.replies, showDetailModal]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/tickets', {
        params: { status: statusFilter }
      });
      setTickets(res.data.data || []);
      
      // Keep selected ticket updated if modal is open
      if (selectedTicket) {
        const updated = res.data.data.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (err) {
      console.error('Failed to fetch tickets', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      await axios.post('/tickets', {
        subject,
        category,
        priority,
        description
      });
      setMessage({ text: 'Helpdesk ticket submitted successfully. Support team notified.', type: 'success' });
      setSubject('');
      setDescription('');
      fetchTickets();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to submit ticket', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await axios.patch(`/tickets/${id}/status`, { status });
      if (res.data.success) {
        fetchTickets();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handlePostReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSendingReply(true);

    try {
      const res = await axios.post(`/tickets/${selectedTicket.id}/reply`, {
        message: replyText
      });
      if (res.data.success) {
        setReplyText('');
        fetchTickets();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to post reply');
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Complaints Tickets Helpdesk</h2>
        <p className="text-slate-500 text-xs">
          {isAdmin 
            ? 'Manage dealer complaints, answer queries, and maintain SLA statuses.' 
            : 'Open a complaint ticket and chat directly with our Mansara Support team.'}
        </p>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Dealer Open Form OR Admin Filter Controls */}
        <div className="lg:col-span-1 space-y-6 text-xs">
          {!isAdmin ? (
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-rose-600" />
                <span>Open New Ticket</span>
              </h3>

              <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Ticket Subject *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of issue..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer"
                    >
                      <option value="DELIVERY">Delivery Issue</option>
                      <option value="QUALITY">Quality Defect</option>
                      <option value="BILLING">Billing / Margin</option>
                      <option value="OTHER">Other Query</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-bold mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-bold mb-1">Detailed Description *</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="4"
                    placeholder="Provide invoice details, batch numbers, or description..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold py-2.5 rounded-xl transition-all shadow-md"
                >
                  {submitting ? 'Submitting...' : 'Create Helpdesk Ticket'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider">Ticket Filters</h3>
              <div className="flex flex-col space-y-2">
                {['', 'OPEN', 'IN_PROGRESS', 'RESOLVED'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`text-left px-4 py-2.5 rounded-xl font-semibold transition-colors flex items-center justify-between ${
                      statusFilter === status 
                        ? 'bg-rose-50 text-rose-700 border border-rose-100/50' 
                        : 'bg-white hover:bg-slate-50 text-slate-600 border border-transparent'
                    }`}
                  >
                    <span>{status === '' ? 'All Tickets' : status.replace('_', ' ')}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick FAQ info block */}
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-3 leading-relaxed text-slate-500 text-[11px]">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Helpdesk Guidelines</h4>
            <p>1. **Priority Levels:** Set **HIGH** priority only for transport damages or urgent pricing discrepancies.</p>
            <p>2. **Communication:** Do not open multiple threads for the same batch issue. Use the replies feature inside the ticket details.</p>
          </div>
        </div>

        {/* RIGHT COLUMN: Tickets list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden text-xs">
            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Complaint Tickets Index</span>
              <span className="text-[10px] text-slate-400 font-bold">{tickets.length} Tickets Found</span>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-rose-600"></div>
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 font-semibold italic">
                No helpdesk tickets logged under this filter.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tickets.map(t => (
                  <div 
                    key={t.id} 
                    onClick={() => { setSelectedTicket(t); setShowDetailModal(true); }}
                    className="p-5 hover:bg-slate-50/30 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <strong className="text-slate-800 text-xs">{t.ticketNo}</strong>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                          t.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          t.status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {t.status}
                        </span>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                          t.priority === 'HIGH' ? 'bg-rose-100 text-rose-800' :
                          t.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {t.priority}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-700 text-xs">{t.subject}</h4>
                      {isAdmin && (
                        <p className="text-[10px] text-slate-500 flex items-center space-x-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{t.creatorName}</span>
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400">
                        Category: <strong className="text-slate-600">{t.category}</strong> · Opened: {new Date(t.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 ml-auto sm:ml-0">
                      <span className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 font-bold px-2.5 py-1.5 rounded-lg flex items-center space-x-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{t.replies?.length || 0} Replies</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Chat & Details Thread Modal */}
      {showDetailModal && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 flex flex-col h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-150 flex justify-between items-center bg-rose-50">
              <div>
                <span className="text-[10px] font-black text-rose-600 block">SUPPORT SERVICE THREAD</span>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide truncate max-w-[400px]">
                  {selectedTicket.ticketNo}: {selectedTicket.subject}
                </h3>
              </div>
              <button 
                onClick={() => { setShowDetailModal(false); setSelectedTicket(null); setReplyText(''); }} 
                className="text-slate-400 hover:text-slate-600 font-bold bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer text-xs"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Body: Ticket Details & Message Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 flex flex-col justify-between">
              
              <div className="space-y-6">
                {/* Meta details banner */}
                <div className="bg-white border border-slate-150 p-4 rounded-xl space-y-3 text-xs">
                  <div className="flex flex-wrap gap-4 items-center">
                    <span className="flex items-center space-x-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Category: <strong className="text-slate-700">{selectedTicket.category}</strong></span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span>Priority: <strong className="text-slate-700">{selectedTicket.priority}</strong></span>
                    <span className="text-slate-300">•</span>
                    <span>Opened: <strong className="text-slate-700">{new Date(selectedTicket.createdAt).toLocaleString()}</strong></span>
                  </div>

                  {isAdmin && (
                    <div className="border-t border-slate-100 pt-2.5 flex items-center space-x-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Submitted By: <strong className="text-rose-600">{selectedTicket.creatorName}</strong></span>
                    </div>
                  )}

                  {/* Description Box */}
                  <div className="bg-slate-50 border border-slate-200/50 p-3 rounded-lg text-slate-700 leading-relaxed italic">
                    "{selectedTicket.description}"
                  </div>

                  {/* Status Toggle for Admin */}
                  {isAdmin && (
                    <div className="border-t border-slate-100 pt-3 flex items-center space-x-3">
                      <span className="font-bold text-slate-500">Update Ticket Status:</span>
                      <div className="flex space-x-2">
                        {['OPEN', 'IN_PROGRESS', 'RESOLVED'].map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleUpdateStatus(selectedTicket.id, st)}
                            className={`px-3 py-1 rounded text-[10px] font-bold border transition-colors ${
                              selectedTicket.status === st 
                                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-250 hover:bg-slate-50'
                            }`}
                          >
                            {st.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Reply Thread */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Conversation Thread</h4>
                  
                  {(!selectedTicket.replies || selectedTicket.replies.length === 0) ? (
                    <p className="text-slate-400 text-center italic py-4 text-xs font-semibold">No replies posted on this ticket yet.</p>
                  ) : (
                    <div className="space-y-4 text-xs">
                      {selectedTicket.replies.map((reply, idx) => {
                        const isSelf = reply.userId === user.id;
                        return (
                          <div 
                            key={idx} 
                            className={`flex flex-col max-w-[80%] ${
                              isSelf ? 'ml-auto items-end' : 'mr-auto items-start'
                            }`}
                          >
                            <span className="text-[9px] text-slate-400 font-bold mb-1">
                              {reply.userName} · {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className={`p-3 rounded-2xl leading-relaxed ${
                              isSelf 
                                ? 'bg-rose-600 text-white rounded-tr-none shadow-sm' 
                                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                            }`}>
                              {reply.message}
                            </div>
                          </div>
                        );
                      })}
                      <div ref={threadEndRef} />
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Input form */}
              {selectedTicket.status !== 'RESOLVED' ? (
                <form onSubmit={handlePostReply} className="flex gap-2 pt-4 border-t border-slate-150 bg-transparent shrink-0 mt-6">
                  <input
                    type="text"
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type reply message..."
                    className="flex-1 px-4 py-2.5 text-xs bg-white border border-slate-250 rounded-xl focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <div className="mt-6 bg-slate-100 border border-slate-200 p-3 rounded-xl text-center text-slate-500 font-semibold text-xs italic shrink-0">
                  This ticket has been marked as RESOLVED. Thread closed.
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
