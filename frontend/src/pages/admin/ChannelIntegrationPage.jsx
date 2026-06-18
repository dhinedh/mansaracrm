// src/pages/admin/ChannelIntegrationPage.jsx
import React from 'react';
import { Cable, AlertCircle, ShoppingBag, Globe, Store } from 'lucide-react';

export default function ChannelIntegrationPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Cable className="w-5 h-5 text-rose-600" />
          Channel Integration
        </h2>
        <p className="text-slate-500 text-xs mt-0.5">Connect and sync live stock/sales across multiple external storefronts and dealer platforms.</p>
      </div>

      {/* Info Card */}
      <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-2xl space-y-4">
        <div className="flex items-center space-x-3 text-amber-900 font-bold text-sm">
          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
          <span>Under Development (Channel Router Architecture)</span>
        </div>
        <p className="text-slate-600 text-xs leading-relaxed">
          Channel Integration will serve as the master gateway connecting Mansara Foods' central inventory database directly to external platforms. When enabled, stock adjustments in the Cockpit will update listings instantly across channels.
        </p>
      </div>

      {/* Channels List */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        {[
          { name: 'Self Storefront Website', desc: 'Sync direct B2C sales from mansarafoods.com to adjust central stock counts.', icon: Globe, status: 'Drafting APIs' },
          { name: 'Amazon Seller Portal', desc: 'Auto-update FBA/FBM listing quantities and pull order receipts into billing.', icon: ShoppingBag, status: 'Scheduled' },
          { name: 'Dealers Portal Router', desc: 'Link wholesale stock levels for dealers to review live before placing PO requests.', icon: Store, status: 'Active (B2B)' }
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.name} className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-xs">{c.name}</h3>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{c.desc}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-[9px]">
                <span className="text-slate-400 font-medium">Integration Status:</span>
                <span className="bg-rose-50 border border-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">{c.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
