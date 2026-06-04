// src/pages/admin/ProductsPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../store/authStore';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Inbox, 
  Image as ImageIcon,
  Tag,
  DollarSign,
  Percent
} from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [gstPercent, setGstPercent] = useState('5');
  const [hsnCode, setHsnCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState('KG');
  const [initialStock, setInitialStock] = useState('100');
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [search, categoryFilter]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/products', {
        params: { search, categoryId: categoryFilter }
      });
      // Sort: in-stock items first, then out-of-stock
      const sorted = [...res.data.data].sort((a, b) => {
        const qtyA = a.companyStock?.quantity || 0;
        const qtyB = b.companyStock?.quantity || 0;
        if (qtyA > 0 && qtyB <= 0) return -1;
        if (qtyA <= 0 && qtyB > 0) return 1;
        return 0;
      });
      setProducts(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/products/categories');
      setCategories(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    const formData = new FormData();
    formData.append('name', name);
    formData.append('sku', sku);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('mrp', mrp);
    formData.append('gstPercent', gstPercent);
    formData.append('hsnCode', hsnCode);
    formData.append('categoryId', categoryId);
    formData.append('unit', unit);
    formData.append('initialStock', initialStock);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      await axios.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ text: 'Product added successfully!', type: 'success' });
      fetchProducts();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to add product', type: 'error' });
    }
  };

  const handleEditProduct = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    const formData = new FormData();
    formData.append('name', name);
    formData.append('sku', sku);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('mrp', mrp);
    formData.append('gstPercent', gstPercent);
    formData.append('hsnCode', hsnCode);
    formData.append('categoryId', categoryId);
    formData.append('unit', unit);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      await axios.put(`/products/${currentProduct.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ text: 'Product updated successfully!', type: 'success' });
      fetchProducts();
      setShowEditModal(false);
      resetForm();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update product', type: 'error' });
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await axios.delete(`/products/${id}`);
      fetchProducts();
      setMessage({ text: 'Product deleted successfully!', type: 'success' });
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (p) => {
    setCurrentProduct(p);
    setName(p.name);
    setSku(p.sku);
    setDescription(p.description || '');
    setPrice(String(p.price));
    setMrp(p.mrp ? String(p.mrp) : '');
    setGstPercent(String(p.gstPercent));
    setHsnCode(p.hsnCode || '');
    setCategoryId(p.categoryId);
    setUnit(p.unit);
    setShowEditModal(true);
  };

  const resetForm = () => {
    setName(''); setSku(''); setDescription(''); setPrice(''); setMrp('');
    setGstPercent('5'); setHsnCode(''); setCategoryId(''); setUnit('KG');
    setInitialStock('100'); setImageFile(null); setCurrentProduct(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Product Catalog</h2>
          <p className="text-slate-500 text-xs">Maintain SKUs, modify tax details, and manage warehouse products.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New SKU</span>
        </button>
      </div>

      {/* Filter and search controls */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 border border-slate-150 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, SKU, HSN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none transition-all"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none transition-all font-semibold text-slate-600 cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {message.text && (
        <div className={`px-4 py-3 rounded-xl text-xs font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-shadow">
              {/* Product Image */}
              <div className="h-32 sm:h-44 bg-slate-50 relative flex items-center justify-center border-b border-slate-100 overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl.startsWith('http') || product.imageUrl.startsWith('data:') ? product.imageUrl : `${BACKEND_URL}${product.imageUrl.startsWith('/') ? '' : '/'}${product.imageUrl}`}
                    alt={product.name}
                    className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="text-slate-300 flex flex-col items-center space-y-1">
                    <ImageIcon className="w-10 h-10 stroke-1" />
                    <span className="text-[9px] uppercase tracking-wider font-bold">No Image</span>
                  </div>
                )}
                
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-slate-100 text-[8px] font-black uppercase px-2 py-0.5 rounded-full text-slate-600 shadow-sm">
                  {product.category?.name}
                </span>
              </div>

              {/* Product details */}
              <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="block text-[9px] font-black text-rose-600 tracking-wider">SKU: {product.sku}</span>
                  <h3 className="font-bold text-slate-800 text-xs truncate">{product.name}</h3>
                  <p className="text-[10px] text-slate-400 line-clamp-2 h-7">{product.description || 'No description provided.'}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Dist. Price:</span>
                    <span className="font-black text-slate-800">₹{parseFloat(product.price).toFixed(2)} / {product.unit}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-medium">Tax rate:</span>
                    <span className="font-bold text-slate-600">{product.gstPercent}% GST</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-medium">Warehouse Stock:</span>
                    <span className={`font-bold ${product.companyStock?.quantity <= 20 ? 'text-rose-600' : 'text-slate-600'}`}>
                      {product.companyStock?.quantity || 0} {product.unit}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    onClick={() => openEditModal(product)}
                    className="flex-1 inline-flex items-center justify-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 py-1.5 rounded-xl text-[10px] font-bold"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="inline-flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 p-1.5 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Add Catalog Product</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">Close</button>
            </div>
            
            <form onSubmit={handleAddProduct} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Product Name *</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">SKU Code *</label>
                  <input type="text" required value={sku} onChange={e => setSku(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Base Distributor Price (₹) *</label>
                  <input type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Retail MRP (₹, optional)</label>
                  <input type="number" step="0.01" value={mrp} onChange={e => setMrp(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">GST Tax Rate (%)</label>
                  <select value={gstPercent} onChange={e => setGstPercent(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer">
                    <option value="0">0% GST</option>
                    <option value="5">5% GST (Standard Spices)</option>
                    <option value="12">12% GST (Processed Foods)</option>
                    <option value="18">18% GST (Luxury Items)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Category *</label>
                  <select required value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer">
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Unit of Measure</label>
                  <input type="text" value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g. KG, PCS, LTR" className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">HSN Tax Code</label>
                  <input type="text" value={hsnCode} onChange={e => setHsnCode(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Initial Warehouse Stock</label>
                  <input type="number" value={initialStock} onChange={e => setInitialStock(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Product Photo</label>
                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer" />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"></textarea>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-xs">
                  Create Catalog Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Edit Product SKU Details</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">Close</button>
            </div>
            
            <form onSubmit={handleEditProduct} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Product Name</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">SKU Code</label>
                  <input type="text" required value={sku} onChange={e => setSku(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Base Price (₹) *</label>
                  <input type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">MRP (₹)</label>
                  <input type="number" step="0.01" value={mrp} onChange={e => setMrp(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">GST Tax Rate (%)</label>
                  <select value={gstPercent} onChange={e => setGstPercent(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer">
                    <option value="0">0% GST</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Category</label>
                  <select required value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer">
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Unit</label>
                  <input type="text" value={unit} onChange={e => setUnit(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">HSN Code</label>
                  <input type="text" value={hsnCode} onChange={e => setHsnCode(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Product Photo</label>
                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer" />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"></textarea>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-xs">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
