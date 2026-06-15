// src/pages/admin/NotificationsPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Bell, CheckCheck, Trash2, Info, TrendingUp, Package,
  ShieldAlert, Truck, AlertCircle, MailOpen, Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const CATEGORIES = [
  { id: 'ALL',     label: 'All',          icon: Bell },
  { id: 'BILLING', label: 'Billing',      icon: TrendingUp },
  { id: 'STOCK',   label: 'Stock',        icon: Package },
  { id: 'ACCOUNT', label: 'Account',      icon: ShieldAlert },
  { id: 'SYSTEM',  label: 'System',       icon: AlertCircle },
];

const TYPE_META = {
  STOCK_TRANSFER:    { label: 'Stock Transfer',   color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Package,      dot: 'bg-emerald-500' },
  DELIVERY_UPDATE:   { label: 'Delivery Update',  color: 'bg-sky-100 text-sky-700 border-sky-200',             icon: Truck,        dot: 'bg-sky-500' },
  INVOICE_GENERATED: { label: 'Billing / Invoice',color: 'bg-rose-100 text-rose-700 border-rose-200',          icon: TrendingUp,   dot: 'bg-rose-500' },
  ACCOUNT_UPDATE:    { label: 'Account',          color: 'bg-amber-100 text-amber-700 border-amber-200',       icon: ShieldAlert,  dot: 'bg-amber-500' },
  SYSTEM:            { label: 'System',           color: 'bg-violet-100 text-violet-700 border-violet-200',    icon: AlertCircle,  dot: 'bg-violet-500' },
};

function groupByDate(list) {
  const groups = {};
  list.forEach(n => {
    const d = new Date(n.createdAt);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    let key;
    if (d.toDateString() === today.toDateString()) key = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) key = 'Yesterday';
    else key = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });
  return groups;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/notifications');
      setNotifications(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) { console.error(err); }
  };

  const handleMarkRead = async (id) => {
    try {
      await axios.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      try {
        await axios.patch(`/notifications/${n.id}/read`);
        setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, isRead: true } : notif));
      } catch (err) { console.error(err); }
    }
    const role = user?.role;
    const { transferId, invoiceId, dealerId } = n.metadata || {};
    if (role === 'ADMIN') {
      if (n.type === 'STOCK_TRANSFER' || n.type === 'DELIVERY_UPDATE') navigate('/admin/transfers', { state: { activeTab: 'history', transferId } });
      else if (n.type === 'INVOICE_GENERATED') navigate('/admin/dashboard', { state: { invoiceId } });
      else if (n.type === 'ACCOUNT_UPDATE') navigate('/admin/dealers', { state: { dealerId } });
      else navigate('/admin/dashboard');
    } else {
      if (n.type === 'STOCK_TRANSFER' || n.type === 'DELIVERY_UPDATE') navigate('/dealer/transfers', { state: { transferId } });
      else if (n.type === 'INVOICE_GENERATED') navigate('/dealer/invoices', { state: { invoiceId } });
      else navigate('/dealer/dashboard');
    }
  };

  // Count per category for tab badges
  const countFor = (tabId) => {
    return notifications.filter(n => {
      const unread = !n.isRead;
      if (tabId === 'ALL') return unread;
      if (tabId === 'BILLING') return unread && n.type === 'INVOICE_GENERATED';
      if (tabId === 'STOCK') return unread && (n.type === 'STOCK_TRANSFER' || n.type === 'DELIVERY_UPDATE');
      if (tabId === 'ACCOUNT') return unread && n.type === 'ACCOUNT_UPDATE';
      if (tabId === 'SYSTEM') return unread && n.type === 'SYSTEM';
      return false;
    }).length;
  };

  const filtered = notifications.filter(n => {
    if (showUnreadOnly && n.isRead) return false;
    if (activeTab === 'ALL') return true;
    if (activeTab === 'BILLING') return n.type === 'INVOICE_GENERATED';
    if (activeTab === 'STOCK') return n.type === 'STOCK_TRANSFER' || n.type === 'DELIVERY_UPDATE';
    if (activeTab === 'ACCOUNT') return n.type === 'ACCOUNT_UPDATE';
    if (activeTab === 'SYSTEM') return n.type === 'SYSTEM';
    return true;
  });

  const unreadTotal = notifications.filter(n => !n.isRead).length;
  const grouped = groupByDate(filtered);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center space-x-2">
            <span>Notification Center</span>
            {unreadTotal > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                {unreadTotal} unread
              </span>
            )}
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Real-time alerts for billing, stock movements, deliveries, and account updates.
          </p>
        </div>
        {unreadTotal > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl transition-all border border-rose-100 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Unread spotlight */}
      {unreadTotal > 0 && !showUnreadOnly && activeTab === 'ALL' && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
              <Mail className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <p className="text-xs font-bold text-rose-800">You have {unreadTotal} unread notification{unreadTotal > 1 ? 's' : ''}</p>
              <p className="text-[10px] text-rose-600">Click any notification to mark it read and navigate to the related section.</p>
            </div>
          </div>
          <button
            onClick={() => setShowUnreadOnly(true)}
            className="text-[10px] font-bold text-rose-700 bg-white border border-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
          >
            Show unread only
          </button>
        </div>
      )}

      {/* Category Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {CATEGORIES.map(tab => {
            const count = countFor(tab.id);
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer flex-shrink-0 ${
                  isActive
                    ? 'border-rose-600 text-rose-700 bg-rose-50/50'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {count > 0 && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Unread toggle on the right */}
          <div className="ml-auto flex items-center pr-4 pl-2 border-l border-slate-100">
            <label className="flex items-center space-x-2 text-[10px] font-bold text-slate-500 cursor-pointer select-none whitespace-nowrap">
              <div
                onClick={() => setShowUnreadOnly(v => !v)}
                className={`w-8 h-4 rounded-full transition-colors cursor-pointer relative ${showUnreadOnly ? 'bg-rose-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${showUnreadOnly ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span>Unread only</span>
            </label>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <MailOpen className="w-10 h-10 text-slate-200 mx-auto mb-3 stroke-1" />
            <p className="text-slate-500 text-xs font-bold">No notifications here</p>
            <p className="text-[10px] text-slate-400 mt-1">
              {showUnreadOnly ? 'No unread notifications in this category.' : 'All caught up in this category.'}
            </p>
            {showUnreadOnly && (
              <button
                onClick={() => setShowUnreadOnly(false)}
                className="mt-4 text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Show all notifications
              </button>
            )}
          </div>
        ) : (
          <div>
            {Object.entries(grouped).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                {/* Date separator */}
                <div className="px-5 py-2 bg-slate-50/70 border-b border-slate-100 border-t border-t-slate-100">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{dateLabel}</span>
                </div>
                {items.map((n) => {
                  const meta = TYPE_META[n.type] || TYPE_META.SYSTEM;
                  const Icon = meta.icon;
                  return (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`flex items-start gap-4 px-5 py-4 border-b border-slate-100 last:border-0 cursor-pointer transition-all group ${
                        n.isRead
                          ? 'hover:bg-slate-50/50'
                          : 'bg-rose-50/20 hover:bg-rose-50/40 border-l-4 border-l-rose-500'
                      }`}
                    >
                      {/* Unread dot */}
                      <div className="pt-1 w-3 shrink-0 flex flex-col items-center">
                        {!n.isRead && (
                          <div className={`w-2 h-2 rounded-full ${meta.dot}`} />
                        )}
                      </div>

                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${n.isRead ? 'bg-slate-50' : 'bg-white shadow-sm border border-slate-100'}`}>
                        <Icon className="w-4 h-4 text-slate-500" />
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className={`inline-flex items-center text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wide ${meta.color}`}>
                            {meta.label}
                          </span>
                          {!n.isRead && (
                            <span className="text-[9px] bg-rose-600 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              New
                            </span>
                          )}
                        </div>
                        <h4 className={`text-xs font-bold ${n.isRead ? 'text-slate-600' : 'text-slate-800'}`}>
                          {n.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                        <span className="block text-[9px] text-slate-400 font-semibold">
                          {new Date(n.createdAt).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.isRead && (
                          <button
                            onClick={e => { e.stopPropagation(); handleMarkRead(n.id); }}
                            title="Mark as read"
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <MailOpen className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(n.id); }}
                          title="Delete notification"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
