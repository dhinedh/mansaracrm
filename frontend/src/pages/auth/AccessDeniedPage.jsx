// src/pages/auth/AccessDeniedPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AccessDeniedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 select-none relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center space-y-6 bg-slate-950 border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-inner animate-pulse">
          <ShieldAlert className="w-8 h-8 text-rose-500" strokeWidth={1.8} />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Access Restricted</h2>
          <p className="text-[11px] font-bold text-rose-400 bg-rose-950/45 border border-rose-500/15 py-1 px-3.5 rounded-full inline-block uppercase tracking-widest">
            🔒 You do not have privilege access
          </p>
        </div>

        <p className="text-slate-400 text-xs leading-relaxed max-w-sm mx-auto">
          Your current administrative account profile does not possess the permissions required to view this module. Please contact the Operations Admin for privilege clearance.
        </p>

        <div className="pt-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center space-x-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer hover:bg-slate-850 hover:text-white transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
