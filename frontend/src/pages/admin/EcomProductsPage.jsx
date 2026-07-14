// src/pages/admin/EcomProductsPage.jsx
// Ecommerce Products management — connects to mansara-nourish-hub backend
import React, { useEffect, useState, useMemo } from 'react';
import {
  Package, Search, RefreshCw, Eye, EyeOff, Star,
  Tag, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Upload
} from 'lucide-react';
import BulkUploadModal from '../../components/BulkUploadModal';

// E-Commerce backend base URL
const getEcomApiUrl = () => {
  const envUrl = import.meta.env.VITE_ECOM_API_URL;
  if (envUrl) return envUrl;
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isLocal ? 'http://localhost:5001/api' : 'https://mansara-backend.onrender.com/api';
};

const ECOM_API = getEcomApiUrl();

const getEcomToken = () => localStorage.getItem('mansara-token') || '';

export default function EcomProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [flagFilter, setFlagFilter] = useState('all');

  // Pagination
  const [page, setPage] = useState(1);
  const PER_PAGE = 15;

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${getEcomToken()}` };
      const [prodRes, catRes] = await Promise.all([
        fetch(`${ECOM_API}/products?limit=500`, { headers }),
        fetch(`${ECOM_API}/categories`, { headers }),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      setProducts(prodData.products || prodData.data || []);
      setCategories(catData.categories || catData.data || []);
    } catch (err) {
      setMessage({ text: 'Failed to fetch products from e-commerce backend.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (product) => {
    const newStatus = !product.isActive;
    try {
      const res = await fetch(`${ECOM_API}/products/${product.id || product._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getEcomToken()}`,
        },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (!res.ok) throw new Error('Failed');
      setProducts(prev =>
        prev.map(p =>
          (p.id || p._id) === (product.id || product._id) ? { ...p, isActive: newStatus } : p
        )
      );
      setMessage({ text: `Product ${newStatus ? 'activated' : 'deactivated'}`, type: 'success' });
    } catch {
      setMessage({ text: 'Failed to update product status', type: 'error' });
    }
  };

  // Filtered + paginated
  const filtered = useMemo(() => {
    let r = [...products];
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(p => (p.name || '').toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') r = r.filter(p => (p.category || p.categoryId) === categoryFilter);
    if (statusFilter !== 'all') r = r.filter(p => statusFilter === 'active' ? p.isActive !== false : p.isActive === false);
    if (flagFilter === 'new') r = r.filter(p => p.isNewArrival);
    if (flagFilter === 'featured') r = r.filter(p => p.isFeatured);
    if (flagFilter === 'offer') r = r.filter(p => p.isOffer || (p.offerPrice && p.offerPrice < p.price));
    return r;
  }, [products, search, categoryFilter, statusFilter, flagFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            E-Commerce Products
          </h2>
          <p className="text-slate-500 text-xs mt-0.5">
            Manage products visible on the Mansara online store.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkUpload(true)}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" /> Bulk Upload
          </button>
          <button
            onClick={fetchAll}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
            : 'bg-rose-50 text-rose-800 border border-rose-100'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {message.text}
          <button onClick={() => setMessage({ text: '', type: '' })} className="ml-auto text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or SKU..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400"
          />
        </div>
        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
          className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer font-semibold text-slate-600">
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer font-semibold text-slate-600">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={flagFilter} onChange={e => { setFlagFilter(e.target.value); setPage(1); }}
          className="text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none cursor-pointer font-semibold text-slate-600">
          <option value="all">All Flags</option>
          <option value="new">New Arrivals</option>
          <option value="featured">Featured</option>
          <option value="offer">On Offer</option>
        </select>
        <span className="text-xs text-slate-400 font-semibold ml-auto">{filtered.length} products</span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : paged.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs font-semibold flex flex-col items-center gap-2">
            <Package className="w-8 h-8 stroke-1" />
            No products found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3 px-4">Image</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Variants / SKUs</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Price</th>
                  <th className="p-3 text-center">Stock</th>
                  <th className="p-3 text-center">Flags</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paged.map(product => {
                  const pid = product.id || product._id;
                  const isActive = product.isActive !== false;
                  const stock = product.stock ?? product.stockQuantity ?? '—';
                  const isLowStock = typeof stock === 'number' && stock < 10;
                  const offerPrice = product.offerPrice || product.originalPrice;
                  return (
                    <tr key={pid} className="hover:bg-slate-50/50">
                      <td className="p-3 px-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover"
                              onError={e => { e.target.src = 'https://placehold.co/80?text=No+Img'; }} />
                          ) : (
                            <Package className="w-full h-full p-2 text-slate-300" />
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800 max-w-[180px] truncate">{product.name}</div>
                        {product.sku && <div className="text-[10px] text-slate-400 font-mono">{product.sku}</div>}
                      </td>
                      {/* Variants / SKUs column */}
                      <td className="p-3">
                        {product.variants && product.variants.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {product.variants.map((v, vi) => (
                              <span
                                key={vi}
                                title={v.sku ? `SKU: ${v.sku}` : 'No SKU set'}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  v.sku
                                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                                    : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}
                              >
                                {v.weight || '?'}
                                {v.sku ? <span className="font-mono font-normal opacity-75">#{v.sku}</span> : <span className="opacity-60">⚠ no SKU</span>}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-[10px]">—</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-500 capitalize">{product.category || '—'}</td>
                      <td className="p-3 text-right">
                        <div className="font-bold text-slate-800">₹{product.price?.toLocaleString()}</div>
                        {offerPrice && offerPrice > product.price && (
                          <div className="text-[10px] text-slate-400 line-through">₹{offerPrice}</div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-bold ${typeof stock === 'number' && stock === 0 ? 'text-rose-600' : isLowStock ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {stock}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {product.isNewArrival && <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded-full">NEW</span>}
                          {product.isFeatured && <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Star className="w-2.5 h-2.5" />FEAT</span>}
                          {(product.isOffer || (product.offerPrice && product.offerPrice < product.price)) && (
                            <span className="bg-orange-100 text-orange-700 text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Tag className="w-2.5 h-2.5" />SALE</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleStatus(product)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {isActive ? <><Eye className="w-3 h-3" /> Active</> : <><EyeOff className="w-3 h-3" /> Inactive</>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-semibold">
              Page {page} of {totalPages} • {filtered.length} products
            </span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-50 cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 hover:bg-slate-50 cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    {/* Bulk Upload Modal */}
    {showBulkUpload && (
      <BulkUploadModal
        onClose={() => setShowBulkUpload(false)}
        onSuccess={() => {
          setShowBulkUpload(false);
          fetchAll();
          setMessage({ text: 'Bulk upload complete! Product list refreshed.', type: 'success' });
        }}
      />
    )}
    </div>
  );
}
