// src/pages/marketing/MarketingCalendarPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  X,
  Upload,
  Search,
  Filter,
  Eye,
  Trash2,
  Edit3,
  CalendarDays,
  List,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const EVENT_TYPES = [
  { value: 'Stall', label: 'Stall', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'Exhibition', label: 'Exhibition', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'Promotion', label: 'Promotion', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'Marketing Campaign', label: 'Marketing Campaign', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'Other', label: 'Other', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

export default function MarketingCalendarPage() {
  const { user } = useAuthStore();
  const isAdmin = ['ADMIN', 'B2B_MANAGER'].includes(user?.role);

  const [events, setEvents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Calendar Date State (Current Month / Year)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'

  // Filters
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterAssignee, setFilterAssignee] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Create Form State
  const [createForm, setCreateForm] = useState({
    title: '',
    eventType: 'Promotion',
    startDate: '',
    endDate: '',
    location: '',
    assignedUserIds: [],
    assignedTeam: '',
    description: '',
    status: 'UPCOMING'
  });
  const [creating, setCreating] = useState(false);

  // Complete Form State (Photo Upload)
  const [completionNotes, setCompletionNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    fetchEvents();
    fetchStaff();
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();
      const res = await axios.get(`/marketing/events?month=${month}&year=${year}`);
      if (res.data?.success) {
        setEvents(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load marketing events', err);
      setMessage({ text: 'Failed to load marketing calendar events', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await axios.get('/marketing/staff');
      if (res.data?.success) {
        setStaffList(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load staff list', err);
    }
  };

  // Month Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  const resetToToday = () => {
    setCurrentDate(new Date());
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (filterType !== 'ALL' && e.eventType !== filterType) return false;
      if (filterStatus !== 'ALL' && e.status !== filterStatus) return false;
      if (filterAssignee !== 'ALL') {
        const hasUser = (e.assignedUserIds || []).some(u => (u._id || u) === filterAssignee);
        if (!hasUser) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = e.title?.toLowerCase().includes(q);
        const matchesLoc = e.location?.toLowerCase().includes(q);
        const matchesDesc = e.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesLoc && !matchesDesc) return false;
      }
      return true;
    });
  }, [events, filterType, filterStatus, filterAssignee, searchQuery]);

  // Calendar Days Computation
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Empty cells for leading days
    for (let i = 0; i < firstDay; i++) {
      days.push({ dayNumber: null, isCurrentMonth: false });
    }

    // Days of current month
    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const isToday =
        today.getDate() === d &&
        today.getMonth() === month &&
        today.getFullYear() === year;

      // Find events on this day
      const dayEvents = filteredEvents.filter(ev => {
        const evDate = new Date(ev.startDate);
        return (
          evDate.getDate() === d &&
          evDate.getMonth() === month &&
          evDate.getFullYear() === year
        );
      });

      days.push({
        dayNumber: d,
        date: dateObj,
        isCurrentMonth: true,
        isToday,
        events: dayEvents
      });
    }

    return days;
  }, [currentDate, filteredEvents]);

  // Handle Event Creation
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await axios.post('/marketing/events', createForm);
      if (res.data?.success) {
        setMessage({ text: 'Marketing event created successfully! Notifications dispatched to team.', type: 'success' });
        setShowCreateModal(false);
        setCreateForm({
          title: '',
          eventType: 'Promotion',
          startDate: '',
          endDate: '',
          location: '',
          assignedUserIds: [],
          assignedTeam: '',
          description: '',
          status: 'UPCOMING'
        });
        fetchEvents();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create marketing event');
    } finally {
      setCreating(false);
    }
  };

  // Handle File Selection for Event Photos
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    const previews = files.map(f => URL.createObjectURL(f));
    setFilePreviews(previews);
  };

  // Handle Event Completion & Photo Upload
  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;
    setCompleting(true);
    try {
      const formData = new FormData();
      formData.append('completionNotes', completionNotes);
      selectedFiles.forEach(file => {
        formData.append('photos', file);
      });

      const res = await axios.post(`/marketing/events/${selectedEvent._id}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        setMessage({ text: 'Event marked as completed and photos uploaded successfully!', type: 'success' });
        setShowCompleteModal(false);
        setSelectedEvent(res.data.data);
        fetchEvents();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete event');
    } finally {
      setCompleting(false);
    }
  };

  const openEventDetails = (ev) => {
    setSelectedEvent(ev);
    setShowDetailModal(true);
  };

  const openCompleteModal = (ev) => {
    setSelectedEvent(ev);
    setCompletionNotes(ev.completionNotes || '');
    setSelectedFiles([]);
    setFilePreviews([]);
    setShowCompleteModal(true);
  };

  const openGalleryModal = (ev, initialIndex = 0) => {
    setSelectedEvent(ev);
    setActivePhotoIndex(initialIndex);
    setShowGalleryModal(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-widest text-rose-500 block">
            Marketing &amp; Activations
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-7 h-7 text-rose-600" />
            Marketing Event &amp; Activity Calendar
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Schedule exhibitions, promotions, campaigns, stalls, and manage field activity photos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Schedule Event
          </button>
        </div>
      </div>

      {/* Global Alert Notification */}
      {message.text && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
            message.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Month Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        {/* Navigation & Month Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-slate-800 min-w-[180px]">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={resetToToday}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg border border-rose-100 font-bold">
              {filteredEvents.length} Events This Month
            </span>
            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-100 font-bold">
              {filteredEvents.filter(e => e.status === 'COMPLETED').length} Completed
            </span>
            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100 font-bold">
              {filteredEvents.filter(e => e.status === 'UPCOMING').length} Upcoming
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          {/* Event Type Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
              Event Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="ALL">All Event Types</option>
              {EVENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Assignee Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
              Assigned Personnel
            </label>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="ALL">All Team Members</option>
              {staffList.map(st => (
                <option key={st._id} value={st._id}>
                  {st.name} ({st.role})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
              Search Events
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Title, location, keyword..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-medium text-slate-700"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── CALENDAR VIEW ─── */}
      {viewMode === 'calendar' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-black uppercase text-slate-500 py-3">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[550px]">
            {calendarDays.map((cell, idx) => (
              <div
                key={idx}
                className={`p-2 min-h-[105px] flex flex-col justify-between transition-colors ${
                  !cell.isCurrentMonth
                    ? 'bg-slate-50/40 text-slate-300'
                    : cell.isToday
                    ? 'bg-rose-50/25 ring-1 ring-inset ring-rose-300'
                    : 'bg-white hover:bg-slate-50/40'
                }`}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                      cell.isToday
                        ? 'bg-rose-600 text-white font-black'
                        : cell.isCurrentMonth
                        ? 'text-slate-700'
                        : 'text-slate-300'
                    }`}
                  >
                    {cell.dayNumber}
                  </span>
                  {cell.events && cell.events.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      {cell.events.length} ev
                    </span>
                  )}
                </div>

                {/* Event Chips */}
                <div className="space-y-1 overflow-y-auto max-h-[85px] flex-1">
                  {cell.events?.map(ev => {
                    const typeConfig = EVENT_TYPES.find(t => t.value === ev.eventType) || EVENT_TYPES[4];
                    return (
                      <button
                        key={ev._id}
                        onClick={() => openEventDetails(ev)}
                        className={`w-full text-left p-1.5 rounded-lg border text-[10px] font-bold truncate block transition-transform hover:scale-[1.02] cursor-pointer shadow-2xs ${typeConfig.color}`}
                      >
                        <span className="truncate block font-black">{ev.title}</span>
                        <span className="text-[9px] opacity-80 flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          {ev.location}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ─── LIST VIEW ─── */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {filteredEvents.length === 0 ? (
            <div className="p-16 text-center text-slate-400 space-y-2">
              <CalendarDays className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="font-bold text-sm text-slate-700">No marketing events scheduled</p>
              <p className="text-xs">Click "Schedule Event" above to create exhibitions, promotions, or stalls.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredEvents.map(ev => {
                const typeConfig = EVENT_TYPES.find(t => t.value === ev.eventType) || EVENT_TYPES[4];
                return (
                  <div key={ev._id} className="p-4 sm:p-5 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${typeConfig.color}`}>
                          {ev.eventType}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ev.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                          ev.status === 'ONGOING' ? 'bg-amber-100 text-amber-800' :
                          ev.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ev.status}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {new Date(ev.startDate).toLocaleDateString('en-IN', {
                            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm">{ev.title}</h3>

                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{ev.location}</span>
                        {ev.assignedTeam && <span className="text-slate-400 font-medium">· Team: {ev.assignedTeam}</span>}
                      </p>

                      {ev.assignedUserIds && ev.assignedUserIds.length > 0 && (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Assigned: {ev.assignedUserIds.map(u => u.name || 'Member').join(', ')}</span>
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {ev.photos && ev.photos.length > 0 && (
                        <button
                          onClick={() => openGalleryModal(ev)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-100 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{ev.photos.length} Photos</span>
                        </button>
                      )}

                      {ev.status !== 'COMPLETED' && (
                        <button
                          onClick={() => openCompleteModal(ev)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete &amp; Upload</span>
                        </button>
                      )}

                      <button
                        onClick={() => openEventDetails(ev)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Create Marketing Event Modal ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 my-8">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Schedule Marketing Event</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assigned marketing personnel will receive instant in-app alerts.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Event Name / Campaign Title*</label>
                <input
                  type="text"
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="e.g. Coimbatore Trade Fair Stall #24"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Event Type*</label>
                  <select
                    value={createForm.eventType}
                    onChange={(e) => setCreateForm({ ...createForm, eventType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    {EVENT_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status</label>
                  <select
                    value={createForm.status}
                    onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ONGOING">Ongoing</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Date &amp; Time*</label>
                  <input
                    type="datetime-local"
                    required
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Location / Venue*</label>
                <input
                  type="text"
                  required
                  value={createForm.location}
                  onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
                  placeholder="e.g. CODISSIA Trade Fair Complex, Hall B"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Assigned Personnel (Marketing Team)</label>
                <select
                  multiple
                  value={createForm.assignedUserIds}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setCreateForm({ ...createForm, assignedUserIds: selected });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-800 h-24 text-xs"
                >
                  {staffList.map(st => (
                    <option key={st._id} value={st._id}>
                      {st.name} — {st.role} ({st.phone || st.email})
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 block mt-0.5">Hold Ctrl / Cmd to select multiple personnel</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Goals / Notes</label>
                <textarea
                  rows="3"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Event objectives, target samples to distribute, stall requirements..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Scheduling...' : 'Schedule Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Complete Event & Upload Photos Modal ─── */}
      {showCompleteModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 my-8">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Complete Event &amp; Upload Photos</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedEvent.title} · {selectedEvent.location}</p>
              </div>
              <button onClick={() => setShowCompleteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Completion Summary / Activity Notes*</label>
                <textarea
                  rows="3"
                  required
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Summarize visitor footfall, customer inquiries, product samples distributed, stall outcomes..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Upload Event Photos (Stall, Banner, Crowd)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    id="event-photos-input"
                    className="hidden"
                  />
                  <label htmlFor="event-photos-input" className="cursor-pointer flex flex-col items-center">
                    <Camera className="w-8 h-8 text-rose-500 mb-1" />
                    <span className="font-bold text-slate-700 text-xs">Click to browse or take photos</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">JPEG, PNG, WEBP up to 5MB</span>
                  </label>
                </div>

                {/* Previews */}
                {filePreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {filePreviews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200">
                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completing}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {completing ? 'Uploading & Saving...' : 'Mark Completed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Event Details Modal ─── */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 my-8">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-rose-500 block mb-0.5">Marketing Event Details</span>
                <h3 className="font-black text-slate-900 text-lg">{selectedEvent.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {selectedEvent.eventType}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    selectedEvent.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedEvent.status}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Date &amp; Time</span>
                  <span className="font-bold text-slate-900">
                    {new Date(selectedEvent.startDate).toLocaleDateString('en-IN', {
                      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Location</span>
                  <span className="font-bold text-slate-900">{selectedEvent.location}</span>
                </div>
              </div>

              {selectedEvent.assignedUserIds && selectedEvent.assignedUserIds.length > 0 && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase mb-1">Assigned Marketing Team</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEvent.assignedUserIds.map((u, i) => (
                      <span key={i} className="bg-slate-100 text-slate-800 px-2 py-1 rounded-lg text-xs font-semibold">
                        👤 {u.name || 'Member'} ({u.role})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedEvent.description && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase mb-0.5">Event Description</span>
                  <p className="bg-slate-50 p-2.5 rounded-xl text-slate-600">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.completionNotes && (
                <div>
                  <span className="text-[10px] text-emerald-600 font-bold block uppercase mb-0.5">Completion Notes</span>
                  <p className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl text-emerald-800 font-medium">
                    {selectedEvent.completionNotes}
                  </p>
                </div>
              )}

              {/* Photos Gallery preview */}
              {selectedEvent.photos && selectedEvent.photos.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">
                      Event Photos ({selectedEvent.photos.length})
                    </span>
                    <button
                      onClick={() => openGalleryModal(selectedEvent)}
                      className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      View Full Gallery
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedEvent.photos.map((src, idx) => (
                      <button
                        key={idx}
                        onClick={() => openGalleryModal(selectedEvent, idx)}
                        className="aspect-square rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 cursor-pointer"
                      >
                        <img src={src} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              {selectedEvent.status !== 'COMPLETED' ? (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openCompleteModal(selectedEvent);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Mark Completed &amp; Upload Photos
                </button>
              ) : <div />}

              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Photo Gallery Lightbox Modal ─── */}
      {showGalleryModal && selectedEvent && selectedEvent.photos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 flex items-center justify-between text-white border-b border-slate-800">
              <span className="font-bold text-sm">
                📷 {selectedEvent.title} · Photo {activePhotoIndex + 1} of {selectedEvent.photos.length}
              </span>
              <button onClick={() => setShowGalleryModal(false)} className="text-white hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 bg-black/40 overflow-hidden relative">
              <img
                src={selectedEvent.photos[activePhotoIndex]}
                alt="Event Photo"
                className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain"
              />

              {selectedEvent.photos.length > 1 && (
                <>
                  <button
                    onClick={() => setActivePhotoIndex((activePhotoIndex - 1 + selectedEvent.photos.length) % selectedEvent.photos.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full cursor-pointer"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setActivePhotoIndex((activePhotoIndex + 1) % selectedEvent.photos.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full cursor-pointer"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip */}
            {selectedEvent.photos.length > 1 && (
              <div className="p-3 bg-slate-950 flex gap-2 overflow-x-auto justify-center">
                {selectedEvent.photos.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhotoIndex(i)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 ${
                      i === activePhotoIndex ? 'border-rose-500 scale-105' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={src} alt="Thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
