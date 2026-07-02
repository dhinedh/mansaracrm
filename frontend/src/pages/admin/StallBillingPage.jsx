// src/pages/admin/StallBillingPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Search, 
  ShoppingBag, 
  Trash2, 
  DollarSign, 
  Plus, 
  Minus,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { BACKEND_URL } from '../../store/authStore';

export default function StallBillingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionId = new URLSearchParams(location.search).get('sessionId');

  // Stall & Product State
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Cart State
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!sessionId) {
      navigate('/admin/stalls');
      return;
    }
    fetchSessionAndProducts();
  }, [sessionId]);

  const fetchSessionAndProducts = async () => {
    try {
      setLoading(true);
      // Fetch session info
      const sessRes = await axios.get(`/stalls/sessions/${sessionId}`);
      setSession(sessRes.data.data);

      // Fetch products
      const prodRes = await axios.get('/products');
      setProducts(prodRes.data.data);

      // Fetch categories
      const catRes = await axios.get('/products/categories');
      setCategories(catRes.data.data);
    } catch (err) {
      alert('Failed to load billing terminal. Verify active session.');
      navigate('/admin/stalls');
    } finally {
      setLoading(false);
    }
  };

  const getProductImage = (imagePath) => {
    if (!imagePath) return '/placeholder.png';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
      return imagePath;
    }
    return `${BACKEND_URL.replace('/api', '')}/${imagePath}`;
  };

  // Add to cart
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      const defaultPrice = parseFloat(product.mrp || product.price || 0);

      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          price: defaultPrice,
          mrp: defaultPrice
        }];
      }
    });
  };

  // Update quantity
  const updateQty = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  // Update manual override price on the fly
  const handlePriceChange = (productId, newPrice) => {
    setCart(prev => prev.map(item => 
      item.productId === productId 
        ? { ...item, price: parseFloat(newPrice) || 0 }
        : item
    ));
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  // Clear cart
  const clearCart = () => setCart([]);

  // Calculate totals
  const totalAmount = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  // Submit sale
  const handleCheckout = async (paymentMethod) => {
    if (cart.length === 0) return;
    try {
      setSubmitting(true);
      await axios.post(`/stalls/sessions/${sessionId}/sales`, {
        items: cart,
        paymentMethod
      });
      setSuccessMsg(`Sale of ₹${totalAmount.toLocaleString()} recorded via ${paymentMethod}!`);
      clearCart();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Filters
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = !selectedCategory || p.categoryId === selectedCategory;
    return matchesSearch && matchesCat && p.isActive;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin" />
        <p className="text-slate-500 mt-2 font-medium">Initializing high-speed billing terminal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shrink-0 z-10 shadow-sm">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/admin/stalls')}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-800 flex items-center gap-1.5 leading-none">
              <ShoppingBag className="w-5 h-5 text-rose-500" />
              Stall Billing Terminal
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Stall: {session?.name} • Location: {session?.location}
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-3.5 py-1.5 rounded-full text-xs font-bold border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Terminal Active</span>
        </div>
      </header>

      {/* Main Billing Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Product Grid (Catalog) */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden min-w-0">
          {/* Catalog search and category filters */}
          <div className="flex gap-4 mb-4 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Quick search products or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 text-slate-400 bg-white border border-slate-250/50 rounded-2xl">
                <p className="font-semibold text-sm">No products match your search/filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="bg-white border border-slate-200/80 rounded-2xl p-3 text-left hover:border-rose-300 hover:shadow-sm active:scale-95 transition-all flex flex-col justify-between h-44 group overflow-hidden"
                  >
                    <div className="w-full h-24 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden mb-2 relative">
                      <img 
                        src={getProductImage(p.image)} 
                        alt={p.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        onError={(e) => { e.target.src = '/placeholder.png'; }}
                      />
                      <span className="absolute bottom-1 right-1 bg-slate-900/70 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                        {p.unit}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 text-xs truncate leading-tight">{p.name}</h4>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-rose-500 font-extrabold text-xs">₹{p.mrp || p.price}</span>
                        {p.companyStock?.quantity > 0 ? (
                          <span className="text-[9px] text-slate-400 font-medium">Stock: {p.companyStock.quantity}</span>
                        ) : (
                          <span className="text-[9px] text-rose-500 font-bold">Out of stock</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Sticky Checkout Sidebar */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center shrink-0 bg-slate-50/50">
            <h3 className="font-black text-slate-800 flex items-center gap-1.5 text-sm uppercase tracking-wide">
              🛒 Current Order ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </h3>
            {cart.length > 0 && (
              <button 
                onClick={clearCart} 
                className="text-xs text-rose-500 hover:text-rose-600 font-bold"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {successMsg && (
              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top-4 duration-300">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>{successMsg}</span>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 text-center">
                <ShoppingBag className="w-8 h-8 mb-2 text-slate-300" />
                <p className="text-xs font-semibold">Cart is empty.</p>
                <p className="text-[10px] mt-0.5">Click products on the left to add.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 text-xs pr-4 leading-tight">{item.productName}</h4>
                    <button 
                      onClick={() => removeFromCart(item.productId)}
                      className="text-slate-400 hover:text-rose-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2.5 bg-white border border-slate-200 rounded-lg p-0.5">
                      <button 
                        onClick={() => updateQty(item.productId, -1)}
                        className="p-1 hover:bg-slate-50 text-slate-600 rounded"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-xs text-slate-800 w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQty(item.productId, 1)}
                        className="p-1 hover:bg-slate-50 text-slate-600 rounded"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Price Override Input */}
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Price:</span>
                      <div className="relative">
                        <span className="absolute left-1.5 top-1.5 text-[10px] font-bold text-slate-400">₹</span>
                        <input 
                          type="number"
                          value={item.price}
                          onChange={(e) => handlePriceChange(item.productId, e.target.value)}
                          className="w-16 pl-4 pr-1 py-1 border border-slate-200 rounded-md text-xs font-bold text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Panel Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-4 shrink-0">
            <div className="flex justify-between items-center text-slate-850 font-black text-sm">
              <span>Total Amount</span>
              <span className="text-rose-500 text-lg">₹{totalAmount.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCheckout('CASH')}
                disabled={cart.length === 0 || submitting}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>Pay Cash</span>
              </button>

              <button
                onClick={() => handleCheckout('ONLINE')}
                disabled={cart.length === 0 || submitting}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Pay Online (UPI)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
