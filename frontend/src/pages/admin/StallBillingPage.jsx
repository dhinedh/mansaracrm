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

  // Cart & Discounts State
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  // Flag: are products sourced from the frozen stall session (not full catalog)?
  const [isSessionStock, setIsSessionStock] = useState(false);
  const [amountPaidInput, setAmountPaidInput] = useState('');

  // Automatically reset amount paid input when cart changes so it defaults back to new MRP Total
  useEffect(() => {
    setAmountPaidInput('');
  }, [cart]);

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
      const sessionData = sessRes.data.data;
      setSession(sessionData);

      if (sessionData.products && sessionData.products.length > 0) {
        // Map session products to format expected by UI
        const mappedProducts = sessionData.products.map(p => ({
          id: p.productId,
          name: p.productName,
          price: p.price,
          mrp: p.price,
          stock: p.currentStock, // Enforce current stock as available stock
          unit: 'PCS',
          isActive: true
          // NOTE: no categoryId — these are stall-configured products only
        }));
        setProducts(mappedProducts);
        setIsSessionStock(true);          // ← stall session mode
        setCategories([]);                // ← no category filter needed
        setSelectedCategory('');          // ← clear any stale filter
      } else {
        // Fetch products
        const prodRes = await axios.get('/products');
        setProducts(prodRes.data.data);

        // Fetch categories
        const catRes = await axios.get('/products/categories');
        setCategories(catRes.data.data);
      }
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
    // Check stock limit if defined
    if (product.stock !== undefined && product.stock <= 0) {
      alert(`Product "${product.name}" is out of stock!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      const defaultPrice = parseFloat(product.mrp || product.price || 0);

      if (existing) {
        const nextQty = existing.quantity + 1;
        if (product.stock !== undefined && nextQty > product.stock) {
          alert(`Cannot add more. Insufficient stock (Available: ${product.stock})`);
          return prev;
        }
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: nextQty }
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
        const prod = products.find(p => p.id === productId);
        if (prod && prod.stock !== undefined && newQty > prod.stock) {
          alert(`Cannot update quantity. Insufficient stock (Available: ${prod.stock})`);
          return item;
        }
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
  const clearCart = () => {
    setCart([]);
    setAmountPaidInput('');
  };

  // Calculate totals
  // mrp = stall-configured price; price = actual price user entered (can be less = discount)
  const mrpTotal      = cart.reduce((sum, item) => sum + (item.quantity * (item.mrp || item.price)), 0);
  const finalPayable  = amountPaidInput !== '' ? parseFloat(amountPaidInput) || 0 : mrpTotal;
  const autoDiscount  = Math.max(0, mrpTotal - finalPayable);

  // Submit sale
  const handleCheckout = async (paymentMethod) => {
    if (cart.length === 0) return;
    try {
      setSubmitting(true);

      const totalMRP = mrpTotal;
      const discount = autoDiscount;

      let distributedCart = cart;
      if (totalMRP > 0 && discount > 0) {
        let remainingDiscount = discount;
        distributedCart = cart.map((item, idx) => {
          const itemMRP = item.mrp || item.price;
          const itemTotalMRP = itemMRP * item.quantity;

          let itemDiscount = 0;
          if (idx === cart.length - 1) {
            // Last item gets the remainder to avoid rounding errors
            itemDiscount = remainingDiscount;
          } else {
            // Proportional discount
            itemDiscount = parseFloat(((itemTotalMRP / totalMRP) * discount).toFixed(2));
            remainingDiscount -= itemDiscount;
          }

          const newPrice = Math.max(0, (itemTotalMRP - itemDiscount) / item.quantity);
          return {
            ...item,
            price: newPrice
          };
        });
      }

      await axios.post(`/stalls/sessions/${sessionId}/sales`, {
        items: distributedCart,
        paymentMethod,
        discountAmount: discount
      });
      setSuccessMsg(`Sale of ₹${finalPayable.toLocaleString()} recorded via ${paymentMethod}!`);
      clearCart();
      fetchSessionAndProducts(); // Reload stock levels
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
    // When in session-stock mode, ALL loaded products are stall products — skip category filter
    const matchesCat = isSessionStock || !selectedCategory || p.categoryId === selectedCategory;
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
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition cursor-pointer"
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
            
            {/* Category filter — only show when NOT in session-stock mode */}
            {!isSessionStock && (
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
            )}
            {/* Session-stock badge */}
            {isSessionStock && (
              <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Stall Stock Only
              </div>
            )}
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
                    className="bg-white border border-slate-200/80 rounded-2xl p-3 text-left hover:border-rose-300 hover:shadow-sm active:scale-95 transition-all flex flex-col justify-between h-44 group overflow-hidden cursor-pointer"
                  >
                    <div className="w-full h-24 rounded-xl bg-slate-50 flex items-center justify-center overflow-hidden mb-2 relative">
                      <img 
                        src={getProductImage(p.image)} 
                        alt={p.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        onError={(e) => { e.target.src = '/placeholder.png'; }}
                      />
                      <span className="absolute bottom-1 right-1 bg-slate-900/70 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                        {p.unit || 'PCS'}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 text-xs truncate leading-tight">{p.name}</h4>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-rose-500 font-extrabold text-xs">₹{p.mrp || p.price}</span>
                        {p.stock !== undefined ? (
                          <span className={`text-[9px] font-bold ${p.stock > 0 ? 'text-slate-400' : 'text-rose-500'}`}>Stock: {p.stock}</span>
                        ) : p.companyStock?.quantity > 0 ? (
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
                className="text-xs text-rose-500 hover:text-rose-600 font-bold cursor-pointer"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {successMsg && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-4 rounded-xl flex items-center gap-2 text-xs font-bold animate-bounce">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-20">
                <ShoppingBag className="w-8 h-8 text-slate-300" />
                <p className="text-xs font-bold">Cart is empty.</p>
                <p className="text-[10px] text-slate-400 text-center px-6">Click configured items on the catalog grid to build checkout invoice.</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 text-xs pr-4 leading-tight">{item.productName}</h4>
                    <button 
                      onClick={() => removeFromCart(item.productId)}
                      className="text-slate-400 hover:text-rose-500 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quantity + Actual Price row */}
                  <div className="flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2.5 bg-white border border-slate-200 rounded-lg p-0.5">
                      <button 
                        onClick={() => updateQty(item.productId, -1)}
                        className="p-1 hover:bg-slate-50 text-slate-600 rounded cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-xs text-slate-800 w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQty(item.productId, 1)}
                        className="p-1 hover:bg-slate-50 text-slate-600 rounded cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Actual Price Input — user types selling price; MRP shown as reference */}
                    <div className="flex flex-col items-end gap-0.5">
                      {/* MRP reference (greyed out) */}
                      {item.mrp !== undefined && item.mrp !== item.price && (
                        <span className="text-[9px] text-slate-400 line-through">MRP ₹{item.mrp}</span>
                      )}
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-slate-500 font-bold">Price:</span>
                        <div className="relative">
                          <span className="absolute left-1.5 top-1.5 text-[10px] font-bold text-slate-400">₹</span>
                          <input 
                            type="number"
                            min="0"
                            value={item.price}
                            onChange={(e) => handlePriceChange(item.productId, e.target.value)}
                            className="w-16 pl-4 pr-1 py-1 border border-rose-200 rounded-md text-xs font-bold text-rose-700 text-right focus:outline-none focus:ring-1 focus:ring-rose-500 bg-rose-50"
                          />
                        </div>
                      </div>
                      {/* Per-item discount badge */}
                      {item.mrp > item.price && (
                        <span className="text-[9px] font-bold text-emerald-600">
                          − ₹{((item.mrp - item.price) * item.quantity).toLocaleString()} off
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Checkout Panel Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/50 space-y-4 shrink-0">
            {/* Totals Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span className="font-semibold">MRP Total</span>
                <span className="font-bold text-slate-500">₹{mrpTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600 py-0.5">
                <span className="font-semibold text-slate-700">Amount Paid</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder={mrpTotal}
                    value={amountPaidInput}
                    onChange={(e) => setAmountPaidInput(e.target.value)}
                    className="w-28 pl-6 pr-2 py-1 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-right focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                  />
                </div>
              </div>

              {autoDiscount > 0 && (
                <div className="flex justify-between items-center text-emerald-700 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
                  <span className="font-semibold">Discount (auto)</span>
                  <span className="font-bold">− ₹{autoDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="font-black text-slate-850 text-sm">Final Payable</span>
                <span className="text-rose-500 text-xl font-black">₹{finalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
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
