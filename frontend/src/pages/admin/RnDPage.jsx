// src/pages/admin/RnDPage.jsx
import React from 'react';
import { Microscope, AlertCircle, FileSpreadsheet, Beaker, HeartPulse } from 'lucide-react';

export default function RnDPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Microscope className="w-5 h-5 text-rose-600" />
          Research &amp; Development (R&amp;D)
        </h2>
        <p className="text-slate-500 text-xs mt-0.5">Track formulation trials, recipe test batches, food safety certifications, and compliance reports.</p>
      </div>

      {/* Info Card */}
      <div className="bg-amber-50/50 border border-amber-100 p-6 rounded-2xl space-y-4">
        <div className="flex items-center space-x-3 text-amber-900 font-bold text-sm">
          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
          <span>Under Development (Recipe &amp; Formulation Lab Log)</span>
        </div>
        <p className="text-slate-600 text-xs leading-relaxed">
          The R&D Module will enable the quality control and development teams to document new product recipes, record trial batch feedback, track raw material vendor performance, and generate quality certificates for commercial production approval.
        </p>
      </div>

      {/* R&D Activities */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
        {[
          { name: 'Recipe Formulation Lab', desc: 'Create trial lists of raw material percentages (e.g. ratios of urad dal, millet, spices) for test batches.', icon: Beaker, status: 'Drafting UI' },
          { name: 'Trial Reports & Feedback', desc: 'Log flavor profiles, storage life estimations, and tasting review comments on sample recipes.', icon: FileSpreadsheet, status: 'Scheduled' },
          { name: 'Compliance & Safety Certs', desc: 'Store lab analysis reports, FSSAI compliance declarations, and food safety testing logs.', icon: HeartPulse, status: 'Scheduled' }
        ].map((act) => {
          const Icon = act.icon;
          return (
            <div key={act.name} className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-xs">{act.name}</h3>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">{act.desc}</p>
              </div>
              <div className="pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-[9px]">
                <span className="text-slate-400 font-medium">Lab Status:</span>
                <span className="bg-rose-50 border border-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">{act.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
