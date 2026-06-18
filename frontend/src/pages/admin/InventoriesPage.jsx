// src/pages/admin/InventoriesPage.jsx
import React from 'react';
import { Warehouse, AlertCircle, ShoppingBag, Carrot, Wheat } from 'lucide-react';

export default function InventoriesPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Warehouse className="w-5 h-5 text-rose-600" />
          Raw Materials Inventory
        </h2>
        <p className="text-slate-500 text-xs mt-0.5">Track procurement, stock levels, and quality of manufacturing raw materials (grain, dal, packaging).</p>
      </div>

      {/* Distinction Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 text-white p-6 rounded-2xl space-y-3 shadow-md">
        <div className="flex items-center space-x-2.5">
          <Warehouse className="w-5 h-5 text-rose-400" />
          <h3 className="font-black text-sm uppercase tracking-wider">Concept: Stock vs. Inventory</h3>
        </div>
        <p className="text-slate-300 text-xs leading-relaxed">
          In Mansara Foods CRM, <strong>Stock</strong> refers to finished, packaged retail products (e.g. Urad Health Mix, Millet Idly Podi) that are ready to be dispatched to dealers.
          <br />
          <strong>Inventory</strong> refers strictly to raw manufacturing ingredients (e.g. Urad Dal, Rice, Cardamom, Cocoa) and packaging materials stocked to produce finished goods.
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-2xl space-y-4">
        <div className="flex items-center space-x-3 text-amber-900 font-bold text-sm">
          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
          <span>Procurement Stock Ledger — Under Development</span>
        </div>
        <p className="text-slate-600 text-xs leading-relaxed font-medium">
          This workspace will list raw materials purchase receipts, supplier contracts, cost tracking per kg, and trigger automated stock alerts when raw ingredients fall below batch production requirements.
        </p>
      </div>

      {/* Ingredients Category list */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        {[
          { name: 'Raw Grains & Spices', desc: 'Urad Dal, Rice, Millet, Coriander, Pepper, etc. managed by weight.', icon: Wheat, status: '0 Items Procurement' },
          { name: 'Packaging Materials', desc: 'Retail packets, shipping cartons, printing labels, and containers.', icon: ShoppingBag, status: '0 Items Procurement' },
          { name: 'Farming Vendors', desc: 'Farming cooperatives and supplier contacts list with quality ratings.', icon: Carrot, status: '0 Vendors Linked' }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-xs">{item.name}</h3>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-[9px] text-slate-400 font-semibold">
                <span>Active count:</span>
                <span className="text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full font-bold">{item.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
