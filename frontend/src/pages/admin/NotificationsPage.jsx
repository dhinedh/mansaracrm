// src/pages/admin/NotificationsPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Bell,
  CheckCheck,
  Trash2, 
  Info, 
  TrendingUp, 
  Package, 
  ShieldAlert 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

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
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await axios.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/notifications/${id}`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n) => {
    // 1. Mark as read first if not read
    if (!n.isRead) {
      try {
        await axios.patch(`/notifications/${n.id}/read`);
        // update local list instantly for better UX
        setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, isRead: true } : notif));
      } catch (err) {
        console.error(err);
      }
    }
    
    // 2. Navigate based on type and user role
    const role = user?.role;
    const transferId = n.metadata?.transferId;
    const invoiceId = n.metadata?.invoiceId;
    const dealerId = n.metadata?.dealerId;
    
    if (role === 'ADMIN') {
      switch (n.type) {
        case 'STOCK_TRANSFER':
        case 'DELIVERY_UPDATE':
          navigate('/admin/inventory', { state: { activeTab: 'history', transferId } });
          break;
        case 'INVOICE_GENERATED':
          navigate('/admin/dashboard', { state: { invoiceId } });
          break;
        case 'ACCOUNT_UPDATE':
          navigate('/admin/dealers', { state: { dealerId } });
          break;
        default:
          navigate('/admin/dashboard');
      }
    } else if (role === 'DEALER') {
      switch (n.type) {
        case 'STOCK_TRANSFER':
        case 'DELIVERY_UPDATE':
          navigate('/dealer/transfers', { state: { transferId } });
          break;
        case 'INVOICE_GENERATED':
          navigate('/dealer/invoices', { state: { invoiceId } });
          break;
        case 'ACCOUNT_UPDATE':
          navigate('/dealer/dashboard');
          break;
        default:
          navigate('/dealer/dashboard');
      }
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'STOCK_TRANSFER': return <Package className="w-4 h-4 text-emerald-600" />;
      case 'INVOICE_GENERATED': return <TrendingUp className="w-4 h-4 text-rose-600" />;
      case 'ACCOUNT_UPDATE': return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      default: return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (showUnreadOnly && n.isRead) return false;
    if (activeTab === 'ALL') return true;
    if (activeTab === 'BILLING') return n.type === 'INVOICE_GENERATED';
    if (activeTab === 'STOCK') return n.type === 'STOCK_TRANSFER' || n.type === 'DELIVERY_UPDATE';
    if (activeTab === 'ACCOUNT') return n.type === 'ACCOUNT_UPDATE';
    if (activeTab === 'SYSTEM') return n.type === 'SYSTEM';
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Notification Center</h2>
          <p className="text-slate-500 text-xs">Review real-time updates regarding accounts, stock movements, and billing operations.</p>
        </div>
        {notifications.filter(n => !n.isRead).length > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/50 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'ALL', label: 'All Alerts' },
            { id: 'BILLING', label: 'Billing / Invoices' },
            { id: 'STOCK', label: 'Stock & Dispatches' },
            { id: 'ACCOUNT', label: 'Account Profile' },
            { id: 'SYSTEM', label: 'System Alerts' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-black tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-rose-600 text-rose-700 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <label className="flex items-center space-x-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={(e) => setShowUnreadOnly(e.target.checked)}
            className="rounded text-rose-600 border-slate-300 focus:ring-rose-500 w-4 h-4 cursor-pointer"
          />
          <span>Show Unread Only</span>
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white border border-slate-150 p-12 text-center rounded-2xl">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-4 stroke-1" />
              <p className="text-slate-500 text-xs font-bold">You are all caught up!</p>
              <p className="text-[10px] text-slate-400 mt-1">No alerts found under this category.</p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`bg-white border p-5 rounded-2xl shadow-sm flex items-start justify-between gap-4 transition-all cursor-pointer hover:border-rose-200 hover:shadow-md ${
                  n.isRead 
                    ? 'border-slate-150 opacity-75' 
                    : 'border-rose-200 border-l-4 border-l-rose-600 bg-rose-50/10 shadow-md'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-50 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-xs flex items-center space-x-2">
                      <span>{n.title}</span>
                      {!n.isRead && (
                        <span className="text-[9px] bg-rose-600 text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider scale-90">Unread</span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{n.message}</p>
                    <span className="block text-[9px] text-slate-400 font-semibold">
                      {new Date(n.createdAt).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!n.isRead && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                      className="text-rose-600 hover:bg-rose-50 text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                    className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
