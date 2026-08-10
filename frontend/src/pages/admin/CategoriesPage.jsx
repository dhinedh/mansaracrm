// src/pages/admin/CategoriesPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Tag, Plus, Search, RefreshCw, FolderPlus, CheckCircle2, AlertTriangle, Edit3, Trash2, Layers, X } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subCategories, setSubCategories] = useState([]);
  const [newSubInput, setNewSubInput] = useState('');

  // Inline sub-category quick add state per category card
  const [cardSubInputs, setCardSubInputs] = useState({});

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/products/categories');
      setCategories(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setName('');
    setDescription('');
    setSubCategories([]);
    setNewSubInput('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (category) => {
    setEditingCategory(category);
    setName(category.name || '');
    setDescription(category.description || '');
    setSubCategories(Array.isArray(category.subCategories) ? [...category.subCategories] : []);
    setNewSubInput('');
    setShowEditModal(true);
  };

  // Tag helper for Add / Edit modal
  const handleAddSubCategoryTag = () => {
    const trimmed = newSubInput.trim();
    if (trimmed && !subCategories.includes(trimmed)) {
      setSubCategories(prev => [...prev, trimmed]);
      setNewSubInput('');
    }
  };

  const handleRemoveSubCategoryTag = (subToRemove) => {
    setSubCategories(prev => prev.filter(s => s !== subToRemove));
  };

  // Save new category
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      await axios.post('/products/categories', {
        name: name.trim(),
        description: description.trim(),
        subCategories
      });
      setMessage({ text: 'Category created successfully!', type: 'success' });
      setShowAddModal(false);
      fetchCategories();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to create category', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Save edit category
  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCategory || !name.trim()) return;
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    try {
      await axios.put(`/products/categories/${editingCategory.id}`, {
        name: name.trim(),
        description: description.trim(),
        subCategories
      });
      setMessage({ text: `Category "${name}" updated successfully!`, type: 'success' });
      setShowEditModal(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update category', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Are you sure you want to delete category "${category.name}"?`)) return;
    try {
      await axios.delete(`/products/categories/${category.id}`);
      setMessage({ text: `Category "${category.name}" deleted successfully.`, type: 'success' });
      fetchCategories();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to delete category.', type: 'error' });
    }
  };

  // Remove a sub-category directly from card view
  const handleRemoveSubFromCard = async (category, subToRemove) => {
    const updatedSubs = (category.subCategories || []).filter(s => s !== subToRemove);
    try {
      await axios.put(`/products/categories/${category.id}`, {
        subCategories: updatedSubs
      });
      // Optimistic update
      setCategories(prev => prev.map(c => c.id === category.id ? { ...c, subCategories: updatedSubs } : c));
    } catch (err) {
      console.error('Failed to remove sub-category:', err);
    }
  };

  // Inline add sub-category directly from card view
  const handleInlineAddSubToCard = async (category) => {
    const val = (cardSubInputs[category.id] || '').trim();
    if (!val) return;
    const currentSubs = category.subCategories || [];
    if (currentSubs.includes(val)) return;

    const updatedSubs = [...currentSubs, val];
    try {
      await axios.put(`/products/categories/${category.id}`, {
        subCategories: updatedSubs
      });
      setCategories(prev => prev.map(c => c.id === category.id ? { ...c, subCategories: updatedSubs } : c));
      setCardSubInputs(prev => ({ ...prev, [category.id]: '' }));
    } catch (err) {
      console.error('Failed to add sub-category:', err);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
    (c.subCategories && c.subCategories.some(sub => sub.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Tag className="w-5 h-5 text-rose-600" />
            Product Categories & Sub-Categories
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Manage main product categories and sub-classification tags for finished inventory.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Message feedback */}
      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
            : 'bg-rose-50 text-rose-800 border border-rose-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
          <span className="flex-1">{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 border border-slate-150 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search categories or sub-categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none transition-all"
          />
        </div>
        <button
          onClick={fetchCategories}
          className="inline-flex items-center space-x-1.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Category Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-16 bg-white border border-slate-150 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="py-20 text-center text-xs text-slate-400 font-semibold italic bg-white border border-slate-150 rounded-2xl">
          No product categories found. Click "Add New Category" to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((cat) => (
            <div key={cat.id} className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between space-y-4">
              
              {/* Header section */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 shrink-0">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm leading-tight">{cat.name}</h3>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {(cat.subCategories || []).length} Sub-categories
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditModal(cat)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Category & Sub-categories"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {cat.description || 'No description provided.'}
                </p>

                {/* Sub-categories tag area */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                      <Layers className="w-3 h-3 text-rose-500" />
                      Sub-Categories
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                    {(cat.subCategories && cat.subCategories.length > 0) ? (
                      cat.subCategories.map((sub, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center space-x-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors border border-slate-200/60"
                        >
                          <span>{sub}</span>
                          <button
                            onClick={() => handleRemoveSubFromCard(cat, sub)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 hover:bg-rose-100 rounded cursor-pointer"
                            title={`Remove "${sub}"`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400 italic font-normal">No sub-categories added yet.</span>
                    )}
                  </div>

                  {/* Quick Add Sub-Category inline input */}
                  <div className="mt-2.5 flex items-center space-x-1.5">
                    <input
                      type="text"
                      placeholder="+ Quick add sub-category..."
                      value={cardSubInputs[cat.id] || ''}
                      onChange={(e) => setCardSubInputs(prev => ({ ...prev, [cat.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleInlineAddSubToCard(cat);
                        }
                      }}
                      className="flex-1 px-2.5 py-1 text-[11px] bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-lg focus:outline-none font-medium"
                    />
                    <button
                      onClick={() => handleInlineAddSubToCard(cat)}
                      className="bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                      title="Add sub-category"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 mt-2">
                <span>Created: {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString('en-IN') : 'Active'}</span>
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase text-[8px]">Active</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                  {showEditModal ? `Edit Category: ${editingCategory?.name}` : 'Add Product Category'}
                </h3>
              </div>
              <button 
                onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingCategory(null); }} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={showEditModal ? handleUpdateCategory : handleAddCategory} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 font-bold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rice Mixes, Health Drink Mix..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
                  placeholder="Summarize product lines under this classification..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none text-slate-700"
                ></textarea>
              </div>

              {/* Sub-categories management inside modal */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="block text-slate-600 font-bold flex items-center justify-between">
                  <span>Sub-Categories</span>
                  <span className="text-[10px] text-slate-400 font-normal">Press Enter or click Add to append tag</span>
                </label>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newSubInput}
                    onChange={(e) => setNewSubInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSubCategoryTag();
                      }
                    }}
                    placeholder="e.g. Coriander Special, Traditional Podi..."
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-semibold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubCategoryTag}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                  >
                    + Add Tag
                  </button>
                </div>

                {/* Sub-categories tags list */}
                <div className="flex flex-wrap gap-1.5 pt-2 max-h-36 overflow-y-auto">
                  {subCategories.length > 0 ? (
                    subCategories.map((sub, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center space-x-1.5 bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-1 rounded-lg text-xs font-bold"
                      >
                        <span>{sub}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubCategoryTag(sub)}
                          className="text-rose-500 hover:text-rose-800 font-bold p-0.5 rounded cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No sub-categories added yet.</p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingCategory(null); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all text-center flex items-center justify-center cursor-pointer disabled:bg-slate-200"
                >
                  {submitting ? (showEditModal ? 'Updating...' : 'Creating...') : (showEditModal ? 'Save Changes' : 'Create Category')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
