// src/pages/sales/SalesSyncPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  RefreshCw, Wifi, WifiOff, CheckCircle2, 
  AlertCircle, Database, Smartphone, ArrowRight, ShieldCheck 
} from 'lucide-react';

export default function SalesSyncPage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [offlineVisits, setOfflineVisits] = useState([]);
  const [offlineCollections, setOfflineCollections] = useState([]);
  const [syncLog, setSyncLog] = useState([]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Read cached items
    try {
      const v = JSON.parse(localStorage.getItem('mansara_offline_visits') || '[]');
      const c = JSON.parse(localStorage.getItem('mansara_offline_collections') || '[]');
      setOfflineVisits(v);
      setOfflineCollections(c);
    } catch (e) {
      setOfflineVisits([]);
      setOfflineCollections([]);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const res = await axios.post('/field-sales/sync', {
        visits: offlineVisits,
        collections: offlineCollections
      });

      if (res.data?.success) {
        localStorage.removeItem('mansara_offline_visits');
        localStorage.removeItem('mansara_offline_collections');
        setOfflineVisits([]);
        setOfflineCollections([]);
        setSyncLog([
          `Synchronized ${res.data.data.visitsSynced} visits and ${res.data.data.collectionsSynced} collections at ${new Date().toLocaleTimeString()}`,
          ...syncLog
        ]);
        alert('Offline records synchronized with Mansara Cloud!');
      }
    } catch (err) {
      alert('Sync failed. Please check internet connection.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Offline Mode & Cloud Synchronisation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Module 33: Store visit notes, orders & receipts in poor connectivity areas and sync to ERP
        </p>
      </div>

      {/* Network Status Card */}
      <div className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
        isOnline 
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800' 
          : 'bg-rose-50/70 border-rose-200 text-rose-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl ${isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
            {isOnline ? <Wifi className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              {isOnline ? 'Connected to Cloud Services' : 'Offline Mode Active'}
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {isOnline 
                ? 'High-speed connection available. All actions sync in real-time.' 
                : 'Visits and orders will be stored in device cache until connection returns.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSyncNow}
          disabled={syncing || !isOnline}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md active:scale-95 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing...' : 'Sync Pending Data Now'}</span>
        </button>
      </div>

      {/* Queue Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Offline Visits in Queue</span>
            <Database className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{offlineVisits.length}</div>
          <p className="text-[10px] text-slate-500">Includes GPS check-ins & duration logs</p>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Offline Collections in Queue</span>
            <Database className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{offlineCollections.length}</div>
          <p className="text-[10px] text-slate-500">Includes in-field cash & cheque receipts</p>
        </div>
      </div>

      {/* Sync Activity History */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
          Sync Activity Log
        </h3>
        {syncLog.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No synchronization events recorded this session.</p>
        ) : (
          <ul className="space-y-2 text-xs">
            {syncLog.map((log, index) => (
              <li key={index} className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{log}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
