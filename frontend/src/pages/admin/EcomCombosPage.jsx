// src/pages/admin/EcomCombosPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  RefreshCw, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertTriangle,
  FolderPlus,
  Info
} from 'lucide-react';
import { BACKEND_URL } from '../../store/authStore';

export default function EcomCombosPage() {
  const [combos, setCombos] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [comboPrice, setComboPrice] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [active, setActive] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    fetchCombos();
    fetchProducts();
  }, []);

  // Auto-generate slug from name
  useEffect(() => {
    if (name && !editingCombo) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generated);
    }
  }, [name, editingCombo]);

  const fetchCombos = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/ecom/combos');
      if (res.data.success) {
        setCombos(res.data.combos || []);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to fetch combos', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/products');
      setProducts(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdd = () => {
    setEditingCombo(null);
    setName('');
    setSlug('');
    setDescription('');
    setPrice('');
    setComboPrice('');
    setSelectedProductIds([]);
    setActive(true);
    setImageUrl('');
    setShowFormModal(true);
  };

  const handleOpenEdit = (combo) => {
    setEditingCombo(combo);
    setName(combo.name || '');
    setSlug(combo.slug || '');
    setDescription(combo.description || '');
    setPrice(String(combo.price || ''));
    setComboPrice(String(combo.comboPrice || ''));
    setSelectedProductIds((combo.products || []).map(p => typeof p === 'object' ? p._id : p));
    setActive(combo.isActive !== false);
    setImageUrl(combo.image || '');
    setShowFormModal(true);
  };

  const handleSaveCombo = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setMessage({ text: '', type: '' });

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      price: parseFloat(price),
      comboPrice: parseFloat(comboPrice),
      products: selectedProductIds,
      active,
      image: imageUrl.trim() || '/logo.png'
    };

    try {
      if (editingCombo) {
        await axios.put(`/ecom/combos/${editingCombo._id}`, payload);
        setMessage({ text: 'Combo updated successfully!', type: 'success' });
      } else {
        await axios.post('/ecom/combos', payload);
        setMessage({ text: 'Combo created successfully!', type: 'success' });
      }
      setShowFormModal(false);
      fetchCombos();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to save combo', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCombo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this combo?')) return;
    try {
      await axios.delete(`/ecom/combos/${id}`);
      setMessage({ text: 'Combo deleted successfully!', type: 'success' });
      fetchCombos();
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to delete combo', type: 'error' });
    }
  };

  const handleToggleActive = async (combo) => {
    const nextActive = combo.isActive === false;
    try {
      await axios.put(`/ecom/combos/${combo._id}`, { active: nextActive });
      setCombos(prev => prev.map(c => c._id === combo._id ? { ...c, isActive: nextActive } : c));
      setMessage({ text: `Combo ${nextActive ? 'activated' : 'deactivated'} successfully!`, type: 'success' });
    } catch (err) {
      console.error(err);
      setMessage({ text: 'Failed to update status', type: 'error' });
    }
  };

  const handleToggleProductSelection = (prodId) => {
    setSelectedProductIds(prev => {
      if (prev.includes(prodId)) {
        return prev.filter(id => id !== prodId);
      } else {
        return [...prev, prodId];
      }
    });
  };

  const filteredCombos = combos.filter(c => 
    (c.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-rose-600" />
            Product Combos
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">Bundle related items together to create custom retail e-commerce packages.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Combo</span>
        </button>
      </div>

      {/* Message feedback */}
      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
            : 'bg-rose-50 text-rose-800 border border-rose-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {message.text}
          <button onClick={() => setMessage({ text: '', type: '' })} className="ml-auto text-slate-400 hover:text-slate-600 font-bold">✕</button>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 border border-slate-150 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search combos by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none transition-all"
          />
        </div>
        <button
          onClick={fetchCombos}
          className="inline-flex items-center space-x-1.5 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Grid list */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white border border-slate-150 rounded-2xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      ) : filteredCombos.length === 0 ? (
        <div className="py-24 text-center text-xs text-slate-400 font-semibold italic bg-white border border-slate-150 rounded-2xl flex flex-col items-center justify-center gap-2">
          <Package className="w-8 h-8 text-slate-350 stroke-1" />
          <span>No product combos found. Click Add New Combo to get started.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCombos.map((combo) => {
            const productsCount = combo.products?.length || 0;
            return (
              <div key={combo._id} className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow relative">
                {/* Status indicator */}
                <div className="absolute top-3 right-3 z-10 flex gap-1">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                    combo.isActive !== false 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {combo.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Combo Image */}
                <div className="h-40 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative overflow-hidden">
                  {combo.image ? (
                    <img
                      src={combo.image.startsWith('http') || combo.image.startsWith('data:') ? combo.image : `${BACKEND_URL}${combo.image.startsWith('/') ? '' : '/'}${combo.image}`}
                      alt={combo.name}
                      className="object-cover h-full w-full"
                      onError={(e) => { e.target.src = 'https://placehold.co/600x400?text=Combo+Pack'; }}
                    />
                  ) : (
                    <div className="text-slate-300 flex flex-col items-center space-y-1">
                      <ImageIcon className="w-10 h-10 stroke-1" />
                      <span className="text-[9px] uppercase tracking-wider font-bold">No Image</span>
                    </div>
                  )}
                  <span className="absolute bottom-3 left-3 bg-white/95 border border-slate-100 text-[8px] font-black uppercase px-2 py-0.5 rounded-full text-slate-600 shadow-sm">
                    {productsCount} Items Bundled
                  </span>
                </div>

                {/* Contents details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-slate-800 text-sm truncate">{combo.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 h-8 leading-relaxed">
                      {combo.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-[9px] text-slate-400 uppercase font-black">Combo Pricing</div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-black text-rose-600">₹{parseFloat(combo.comboPrice || combo.price || 0).toFixed(2)}</span>
                        {combo.comboPrice < combo.price && (
                          <span className="text-xs line-through text-slate-450">₹{parseFloat(combo.price || 0).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleToggleActive(combo)}
                      className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                        combo.isActive !== false
                          ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                      }`}
                    >
                      {combo.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>

                  {/* Combo Product list names */}
                  {combo.products && combo.products.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-3 space-y-1 border border-slate-100 text-[10px]">
                      <div className="font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Info className="w-3 h-3 text-rose-600" /> Included Products
                      </div>
                      <ul className="list-disc list-inside text-slate-600 truncate space-y-0.5 pl-0.5">
                        {combo.products.map((p, idx) => (
                          <li key={idx} className="truncate">{typeof p === 'object' ? p.name : `Product ID: ${p}`}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleOpenEdit(combo)}
                      className="flex-1 inline-flex items-center justify-center space-x-1 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-2 rounded-xl text-[10px] font-bold cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Bundle</span>
                    </button>
                    <button
                      onClick={() => handleDeleteCombo(combo._id)}
                      className="inline-flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 p-2 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-5 h-5 text-rose-600" />
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">
                  {editingCombo ? 'Edit Product Combo' : 'Create Product Combo'}
                </h3>
              </div>
              <button 
                onClick={() => setShowFormModal(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCombo} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Combo Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Health Breakfast Combo"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">URL Slug</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="e.g. breakfast-combo-pack"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Regular/Original Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Regular Retail Sum"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Combo Offer Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={comboPrice}
                    onChange={(e) => setComboPrice(e.target.value)}
                    placeholder="Discounted Offer Price"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 font-bold mb-1">Display Image URL</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="e.g. /images/combos/breakfast.jpg"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Short Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="2"
                  required
                  placeholder="Provide marketing description for this bundle pack..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                ></textarea>
              </div>

              {/* Product selector widget */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-bold text-slate-700 uppercase">Select Bundled Products ({selectedProductIds.length})</span>
                  <input
                    type="text"
                    placeholder="Filter products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="p-1 px-2 border border-slate-200 focus:border-rose-500 rounded-lg focus:outline-none text-[11px]"
                  />
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                  {filteredProducts.map(p => {
                    const isSelected = selectedProductIds.includes(p.id || p._id);
                    return (
                      <label 
                        key={p.id || p._id} 
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border hover:bg-slate-100 transition-colors ${
                          isSelected ? 'bg-white border-rose-200 text-rose-800' : 'bg-white/80 border-slate-150'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleProductSelection(p.id || p._id)}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                          <span className="font-bold">{p.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-405 font-mono">₹{p.price} | {p.sku}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="activeCheck" className="font-bold text-slate-700 cursor-pointer">Publish and list on e-commerce storefront</label>
              </div>

              <div className="pt-4 flex space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || selectedProductIds.length === 0}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all text-center flex items-center justify-center cursor-pointer disabled:bg-slate-200 disabled:shadow-none"
                >
                  {submitting ? 'Saving...' : editingCombo ? 'Save Changes' : 'Create Combo Bundle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
