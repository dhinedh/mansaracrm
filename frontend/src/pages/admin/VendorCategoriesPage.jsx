// src/pages/admin/VendorCategoriesPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Tag,
  Plus,
  Search,
  Layers,
  Edit3,
  Trash2,
  FolderPlus,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Building2,
  Package,
  FileText
} from 'lucide-react';
import {
  getStoredVendorCategories,
  saveStoredVendorCategories
} from '../../utils/vendorCategoriesStore';

export default function VendorCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // null if creating, cat object if editing
  const [showSubModal, setShowSubModal] = useState(false);
  const [selectedParentCat, setSelectedParentCat] = useState(null);

  // Form State
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [subCatInput, setSubCatInput] = useState('');
  const [newSubCatName, setNewSubCatName] = useState('');

  useEffect(() => {
    loadCategories();
    const handleSync = () => loadCategories();
    window.addEventListener('vendor_categories_updated', handleSync);
    return () => window.removeEventListener('vendor_categories_updated', handleSync);
  }, []);

  const loadCategories = () => {
    setCategories(getStoredVendorCategories());
  };

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDesc('');
    setSubCatInput('');
    setShowCategoryModal(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setSubCatInput((cat.subCategories || []).join(', '));
    setShowCategoryModal(true);
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const subCats = subCatInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    let updated;
    if (editingCategory) {
      updated = categories.map(c =>
        c.id === editingCategory.id
          ? { ...c, name: catName.trim(), description: catDesc.trim(), subCategories: subCats }
          : c
      );
      setMessage({ text: `Updated category "${catName.trim()}".`, type: 'success' });
    } else {
      const newCat = {
        id: `cat-${Date.now().toString().slice(-6)}`,
        name: catName.trim(),
        description: catDesc.trim(),
        subCategories: subCats
      };
      updated = [newCat, ...categories];
      setMessage({ text: `Created supply category "${catName.trim()}".`, type: 'success' });
    }

    saveStoredVendorCategories(updated);
    setCategories(updated);
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = (catId, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"? This action will remove its sub-categories.`)) return;
    const updated = categories.filter(c => c.id !== catId);
    saveStoredVendorCategories(updated);
    setCategories(updated);
    setMessage({ text: `Deleted category "${name}".`, type: 'success' });
  };

  const handleOpenAddSubModal = (cat) => {
    setSelectedParentCat(cat);
    setNewSubCatName('');
    setShowSubModal(true);
  };

  const handleAddSubCategorySubmit = (e) => {
    e.preventDefault();
    if (!newSubCatName.trim() || !selectedParentCat) return;

    const updated = categories.map(c => {
      if (c.id === selectedParentCat.id) {
        const existing = c.subCategories || [];
        if (!existing.includes(newSubCatName.trim())) {
          return { ...c, subCategories: [...existing, newSubCatName.trim()] };
        }
      }
      return c;
    });

    saveStoredVendorCategories(updated);
    setCategories(updated);
    setShowSubModal(false);
    setMessage({ text: `Added sub-category "${newSubCatName.trim()}" to "${selectedParentCat.name}".`, type: 'success' });
  };

  const handleRemoveSubCatTag = (catId, subName) => {
    const updated = categories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          subCategories: (c.subCategories || []).filter(s => s !== subName)
        };
      }
      return c;
    });

    saveStoredVendorCategories(updated);
    setCategories(updated);
  };

  const filteredCategories = categories.filter(c => {
    const q = search.toLowerCase();
    const matchesName = c.name.toLowerCase().includes(q);
    const matchesDesc = (c.description || '').toLowerCase().includes(q);
    const matchesSub = (c.subCategories || []).some(s => s.toLowerCase().includes(q));
    return matchesName || matchesDesc || matchesSub;
  });

  const totalSubCategories = categories.reduce((sum, c) => sum + (c.subCategories?.length || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
              Vendor &amp; Procurement Master
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Tag className="w-7 h-7 text-rose-500" />
            Supply Categories &amp; Sub-Categories
          </h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Configure primary supply streams, sub-categories, and raw material classifications. All updates automatically reflect across Vendor Profiles, Procurement POs, and Inventory Reorders.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-bold px-5 py-3 rounded-2xl shadow-lg hover:shadow-rose-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>+ Add Supply Category</span>
        </button>
      </div>

      {/* System Alerts */}
      {message.text && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between shadow-sm animate-fade-in ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ text: '', type: '' })} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Primary Categories</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{categories.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Total Sub-Categories</p>
          <p className="text-2xl font-black text-indigo-700 mt-1">{totalSubCategories}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">System Integration Status</p>
          <p className="text-xs font-black text-emerald-700 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Auto-Synced across Vendors &amp; Procurement
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search categories or sub-categories (e.g. Spices, Pouches, Machinery)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Category & Sub-Category Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCategories.map(cat => (
          <div
            key={cat.id}
            className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 text-base">{cat.name}</h3>
                    <p className="text-[11px] text-slate-500">{cat.description || 'No description provided.'}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => handleOpenEditModal(cat)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sub-Categories List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Sub-Categories ({cat.subCategories?.length || 0})
                  </span>
                  <button
                    onClick={() => handleOpenAddSubModal(cat)}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Sub-Category
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {cat.subCategories && cat.subCategories.length > 0 ? (
                    cat.subCategories.map((sub, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl group hover:border-rose-200 hover:bg-rose-50/50 transition-colors"
                      >
                        <span>{sub}</span>
                        <button
                          onClick={() => handleRemoveSubCatTag(cat.id, sub)}
                          className="text-slate-400 hover:text-rose-600 font-black text-xs cursor-pointer ml-0.5"
                          title="Remove Sub-Category"
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">No sub-categories added yet.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Summary */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
              <span>Category Code: {cat.id}</span>
              <span className="text-rose-700 font-bold">Active in Procurement</span>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT CATEGORY MODAL */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-rose-600" />
                {editingCategory ? 'Edit Supply Category' : 'Create New Supply Category'}
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Primary Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raw Materials or Packaging Materials"
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Briefly describe what items fall under this category..."
                  value={catDesc}
                  onChange={e => setCatDesc(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Sub-Categories (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spices & Masala, Grains & Millets, Oils & Fats"
                  value={subCatInput}
                  onChange={e => setSubCatInput(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Separate multiple sub-categories using commas.</p>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD SUB-CATEGORY MODAL */}
      {showSubModal && selectedParentCat && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-rose-600" />
                Add Sub-Category under "{selectedParentCat.name}"
              </h3>
              <button onClick={() => setShowSubModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            <form onSubmit={handleAddSubCategorySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Sub-Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spices &amp; Masala, Pouches, Tapes..."
                  value={newSubCatName}
                  onChange={e => setNewSubCatName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-rose-500 focus:bg-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSubModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-md"
                >
                  Add Sub-Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
