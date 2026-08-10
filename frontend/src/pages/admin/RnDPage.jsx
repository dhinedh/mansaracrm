// src/pages/admin/RnDPage.jsx
import React, { useState } from 'react';
import {
  Microscope,
  Plus,
  Search,
  Beaker,
  FileSpreadsheet,
  HeartPulse,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Sparkles,
  Calculator,
  ChevronRight,
  ShieldCheck,
  Tag,
  Scale,
  Package,
  Award,
  Filter
} from 'lucide-react';

const DEMO_FORMULATIONS = [
  {
    id: 'BOM-2026-001',
    name: 'Millet & Urad Special Blend v2.4',
    category: 'Papad & Appalam',
    version: '2.4',
    status: 'Production Approved',
    approvedBy: 'Dr. A. Sharma (Head of QC)',
    fssaiStatus: 'Certified Pass',
    shelfLifeDays: 180,
    targetBatchKg: 500,
    ingredients: [
      { name: 'Urad Dal Flour', percentage: 55, category: 'Raw Material' },
      { name: 'Finger Millet (Ragi) Flour', percentage: 25, category: 'Raw Material' },
      { name: 'Black Pepper Powder', percentage: 6, category: 'Spices' },
      { name: 'Asafoetida (Hing)', percentage: 2, category: 'Spices' },
      { name: 'Edible Salt & Soda', percentage: 4, category: 'Additive' },
      { name: 'Refined Vegetable Oil', percentage: 8, category: 'Oil/Fat' }
    ],
    packaging: [
      { item: '200g Laminated Moisture Pouch', unit: 'Pouches', ratioPerKg: 5 },
      { item: 'Corrugated Master Shipping Box (50 pkts)', unit: 'Boxes', ratioPerKg: 0.1 }
    ],
    trialNotes: 'Batch passed crispiness test. Optimum moisture level retained at 11.2%. High shelf stability.'
  },
  {
    id: 'BOM-2026-002',
    name: 'Jeera Delight Special Appalam',
    category: 'Appalam',
    version: '1.2',
    status: 'Lab Testing',
    approvedBy: 'Pending QC Review',
    fssaiStatus: 'Lab Testing',
    shelfLifeDays: 150,
    targetBatchKg: 300,
    ingredients: [
      { name: 'Urad Dal Flour', percentage: 70, category: 'Raw Material' },
      { name: 'Cumin Seeds (Jeera)', percentage: 12, category: 'Spices' },
      { name: 'Salt & Rice Flour Dust', percentage: 8, category: 'Additive' },
      { name: 'Gingelly Oil', percentage: 10, category: 'Oil/Fat' }
    ],
    packaging: [
      { item: '100g Printed Pouch', unit: 'Pouches', ratioPerKg: 10 },
      { item: 'Outer Shipper Carton', unit: 'Boxes', ratioPerKg: 0.2 }
    ],
    trialNotes: 'Trial batch 3 conducted on Aug 4. Excellent aroma. Texture testing in progress.'
  },
  {
    id: 'BOM-2026-003',
    name: 'Spicy Masala Millet Snacks v3.0',
    category: 'Ready-to-Fry',
    version: '3.0',
    status: 'Draft',
    approvedBy: 'Unassigned',
    fssaiStatus: 'Draft Stage',
    shelfLifeDays: 120,
    targetBatchKg: 200,
    ingredients: [
      { name: 'Pearl Millet (Bajra) Flour', percentage: 45, category: 'Raw Material' },
      { name: 'Rice Flour', percentage: 30, category: 'Raw Material' },
      { name: 'Red Chili Powder & Garam Masala', percentage: 15, category: 'Spices' },
      { name: 'Iodized Salt', percentage: 4, category: 'Additive' },
      { name: 'Sunflower Oil', percentage: 6, category: 'Oil/Fat' }
    ],
    packaging: [
      { item: '250g Zip-lock Foil Pouch', unit: 'Pouches', ratioPerKg: 4 },
      { item: 'Outer Box (20 pkts)', unit: 'Boxes', ratioPerKg: 0.2 }
    ],
    trialNotes: 'Initial trial formulation. Salt percentage reduced by 0.5% for healthier profile.'
  }
];

export default function RnDPage() {
  const [formulations, setFormulations] = useState(DEMO_FORMULATIONS);
  const [selectedFormulation, setSelectedFormulation] = useState(DEMO_FORMULATIONS[0]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [batchCalcKg, setBatchCalcKg] = useState(selectedFormulation?.targetBatchKg || 500);

  // New Formulation Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newForm, setNewForm] = useState({
    name: '',
    category: 'Papad & Appalam',
    version: '1.0',
    shelfLifeDays: 180,
    trialNotes: '',
    ingredients: [
      { name: 'Raw Material Base', percentage: 70, category: 'Raw Material' },
      { name: 'Spice Mix', percentage: 15, category: 'Spices' },
      { name: 'Additive / Salt', percentage: 5, category: 'Additive' },
      { name: 'Edible Oil', percentage: 10, category: 'Oil/Fat' }
    ]
  });

  const filtered = formulations.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) || f.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectFormulation = (form) => {
    setSelectedFormulation(form);
    setBatchCalcKg(form.targetBatchKg || 500);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const created = {
      id: `BOM-2026-0${formulations.length + 1}`,
      name: newForm.name,
      category: newForm.category,
      version: newForm.version,
      status: 'Lab Testing',
      approvedBy: 'Pending QC',
      fssaiStatus: 'Lab Testing',
      shelfLifeDays: Number(newForm.shelfLifeDays),
      targetBatchKg: 250,
      ingredients: newForm.ingredients,
      packaging: [
        { item: 'Standard Printed Foil Pouch', unit: 'Pouches', ratioPerKg: 5 },
        { item: 'Master Corrugated Box', unit: 'Boxes', ratioPerKg: 0.1 }
      ],
      trialNotes: newForm.trialNotes || 'New trial batch formulation logged.'
    };

    setFormulations(prev => [created, ...prev]);
    setSelectedFormulation(created);
    setShowCreateModal(false);
    setNewForm({
      name: '',
      category: 'Papad & Appalam',
      version: '1.0',
      shelfLifeDays: 180,
      trialNotes: '',
      ingredients: [
        { name: 'Raw Material Base', percentage: 70, category: 'Raw Material' },
        { name: 'Spice Mix', percentage: 15, category: 'Spices' },
        { name: 'Additive / Salt', percentage: 5, category: 'Additive' },
        { name: 'Edible Oil', percentage: 10, category: 'Oil/Fat' }
      ]
    });
  };

  const handlePromoteToApproved = (id) => {
    setFormulations(prev =>
      prev.map(f =>
        f.id === id
          ? { ...f, status: 'Production Approved', fssaiStatus: 'Certified Pass', approvedBy: 'Chief QC Manager' }
          : f
      )
    );
    if (selectedFormulation.id === id) {
      setSelectedFormulation(prev => ({ ...prev, status: 'Production Approved', fssaiStatus: 'Certified Pass', approvedBy: 'Chief QC Manager' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Microscope className="w-5 h-5 text-rose-600" />
            R&amp;D Lab &amp; Recipe Formulation (BOM)
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Document raw material recipe ratios, packaging Bill of Materials (BOM), lab trials, and FSSAI safety certifications.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> New Recipe Formulation
        </button>
      </div>

      {/* R&D Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Beaker className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Recipes</p>
            <p className="text-lg font-black text-slate-800">{formulations.length}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Production Approved</p>
            <p className="text-lg font-black text-slate-800">{formulations.filter(f => f.status === 'Production Approved').length}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">In Lab Trials</p>
            <p className="text-lg font-black text-slate-800">{formulations.filter(f => f.status === 'Lab Testing').length}</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FSSAI Certified</p>
            <p className="text-lg font-black text-slate-800">{formulations.filter(f => f.fssaiStatus === 'Certified Pass').length}</p>
          </div>
        </div>
      </div>

      {/* Main Workspace (Left List, Right Active Detail) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Formulations List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search formulations or BOM..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-400"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-600 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="Production Approved">Approved</option>
                <option value="Lab Testing">Lab Testing</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filtered.map(form => {
                const isSelected = selectedFormulation?.id === form.id;
                return (
                  <div
                    key={form.id}
                    onClick={() => handleSelectFormulation(form)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-rose-50/70 border-rose-200 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-rose-100 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded-md">
                        {form.id}
                      </span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        form.status === 'Production Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : form.status === 'Lab Testing'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {form.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">{form.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        {form.category} • v{form.version}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                      <span>{form.ingredients.length} Ingredients</span>
                      <span className="font-medium text-slate-600">{form.shelfLifeDays} days shelf life</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Formulation & BOM Detail */}
        {selectedFormulation ? (
          <div className="lg:col-span-7 space-y-6">
            {/* Header Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-100">
                      {selectedFormulation.id}
                    </span>
                    <span className="text-xs text-slate-400">v{selectedFormulation.version}</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mt-1">{selectedFormulation.name}</h3>
                  <p className="text-xs text-slate-500">{selectedFormulation.category}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    selectedFormulation.status === 'Production Approved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : selectedFormulation.status === 'Lab Testing'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedFormulation.status}
                  </span>
                  {selectedFormulation.status !== 'Production Approved' && (
                    <button
                      onClick={() => handlePromoteToApproved(selectedFormulation.id)}
                      className="mt-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                    >
                      Approve for Commercial Production
                    </button>
                  )}
                </div>
              </div>

              {/* Recipe Composition Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">FSSAI Status</span>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> {selectedFormulation.fssaiStatus}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approved By</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">{selectedFormulation.approvedBy}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Est. Shelf Life</span>
                  <span className="text-xs font-bold text-slate-800 mt-0.5 block">{selectedFormulation.shelfLifeDays} Days</span>
                </div>
              </div>

              {/* Trial Notes */}
              <div className="bg-rose-50/40 border border-rose-100/80 p-3.5 rounded-xl text-xs space-y-1">
                <span className="font-bold text-rose-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-600" /> QC &amp; Taste Trial Notes:
                </span>
                <p className="text-slate-600 leading-relaxed">{selectedFormulation.trialNotes}</p>
              </div>
            </div>

            {/* Ingredients & Raw Material Bill of Materials (BOM) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                  <Scale className="w-4 h-4 text-rose-600" />
                  Raw Material Formulation Breakdown (% Mix)
                </h4>
                <span className="text-xs font-bold text-slate-400">
                  Total: {selectedFormulation.ingredients.reduce((acc, i) => acc + i.percentage, 0)}%
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                      <th className="p-2.5">Ingredient Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5 text-right">Recipe Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedFormulation.ingredients.map((ing, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-bold text-slate-800">{ing.name}</td>
                        <td className="p-2.5">
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                            {ing.category}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-rose-600">{ing.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Interactive Batch Requirements Calculator */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-rose-600" />
                    Target Production Batch Calculator
                  </h4>
                  <p className="text-slate-400 text-xs mt-0.5">Calculates required raw material weight for any target production size.</p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-600">Batch Size (kg):</label>
                  <input
                    type="number"
                    value={batchCalcKg}
                    onChange={e => setBatchCalcKg(Math.max(1, Number(e.target.value)))}
                    className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              {/* Calculated Requirements Table */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Required Inputs for {batchCalcKg} kg Batch:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedFormulation.ingredients.map((ing, idx) => {
                    const reqKg = ((ing.percentage / 100) * batchCalcKg).toFixed(1);
                    return (
                      <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                        <span className="font-medium text-slate-700">{ing.name}</span>
                        <span className="font-black text-rose-600 font-mono">{reqKg} kg</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Packaging Bill of Materials (BOM) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
              <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-rose-600" />
                Packaging Bill of Materials (BOM Specs)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedFormulation.packaging.map((pkg, idx) => {
                  const reqQty = Math.ceil(pkg.ratioPerKg * batchCalcKg);
                  return (
                    <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 text-xs">{pkg.item}</p>
                        <p className="text-[10px] text-slate-400">Spec Ratio: {pkg.ratioPerKg} {pkg.unit} / kg</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-800 block font-mono">{reqQty} {pkg.unit}</span>
                        <span className="text-[9px] text-slate-400">for {batchCalcKg}kg batch</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* New Recipe Formulation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <Beaker className="w-4 h-4 text-rose-600" />
                New Recipe Formulation &amp; BOM
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recipe / Product Name *</label>
                <input
                  required
                  value={newForm.name}
                  onChange={e => setNewForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Garlic &amp; Pepper Urad Papad v1.0"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newForm.category}
                    onChange={e => setNewForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Papad & Appalam">Papad &amp; Appalam</option>
                    <option value="Appalam">Appalam</option>
                    <option value="Ready-to-Fry">Ready-to-Fry</option>
                    <option value="Spices & Seasoning">Spices &amp; Seasoning</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Est. Shelf Life (Days)</label>
                  <input
                    type="number"
                    value={newForm.shelfLifeDays}
                    onChange={e => setNewForm(prev => ({ ...prev, shelfLifeDays: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lab QC Trial Notes</label>
                <textarea
                  rows={3}
                  value={newForm.trialNotes}
                  onChange={e => setNewForm(prev => ({ ...prev, trialNotes: e.target.value }))}
                  placeholder="Describe recipe testing feedback, moisture percentage, or sensory comments..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Save Formulation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
