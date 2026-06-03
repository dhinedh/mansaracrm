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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const getIcon = (type) => {
    switch (type) {
      case 'STOCK_TRANSFER': return <Package className="w-4 h-4 text-emerald-600" />;
      case 'INVOICE_GENERATED': return <TrendingUp className="w-4 h-4 text-rose-600" />;
      case 'ACCOUNT_UPDATE': return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      default: return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

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
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/50 px-3.5 py-2 rounded-xl transition-all"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="bg-white border border-slate-150 p-12 text-center rounded-2xl">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-4 stroke-1" />
              <p className="text-slate-500 text-xs font-bold">You are all caught up!</p>
              <p className="text-[10px] text-slate-400 mt-1">No new alerts to display.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`bg-white border p-5 rounded-2xl shadow-sm flex items-start justify-between gap-4 transition-all ${
                  n.isRead ? 'border-slate-150 opacity-75' : 'border-rose-100 bg-rose-50/10'
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
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
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
                      onClick={() => handleMarkRead(n.id)}
                      className="text-rose-600 hover:bg-rose-50 text-[10px] font-bold px-2 py-1 rounded"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-slate-50 rounded-lg transition-colors"
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
