// src/pages/dealer/DealerProductsPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useCartStore } from '../../store/cartStore';
import { BACKEND_URL } from '../../store/authStore';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  AlertCircle,
  Check,
  ShoppingBag,
  ArrowRight,
  X,
  Leaf
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function DealerProductsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLowStockFilter, setIsLowStockFilter] = useState(location.state?.filter === 'low_stock');
  const [products, setProducts] = useState([]);
  const [dealerInventory, setDealerInventory] = useState({}); // { productId: qty }
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addToCart, items } = useCartStore();
  const [quantities, setQuantities] = useState({}); // local input states for quantity picker { productId: number }
  const [marginRules, setMarginRules] = useState([]);

  // PO Request Modal states
  const [showPoModal, setShowPoModal] = useState(false);
  const [selectedPoProduct, setSelectedPoProduct] = useState(null);
  const [poQty, setPoQty] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [submittingPo, setSubmittingPo] = useState(false);

  const openPoModal = (product) => {
    setSelectedPoProduct(product);
    setPoQty(String(product.minOrderQty || 10));
    setPoNotes('');
    setShowPoModal(true);
  };

  const handleSubmittingPo = async (e) => {
    e.preventDefault();
    if (!selectedPoProduct) return;
    const parsedQty = parseInt(poQty);
    if (!parsedQty || parsedQty < 1) {
      alert('Please enter a valid quantity of 1 or more.');
      return;
    }
    setSubmittingPo(true);
    try {
      await axios.post('/requests', {
        items: [
          {
            productId: selectedPoProduct.id,
            quantity: parsedQty
          }
        ],
        notes: poNotes || `Purchase request for out of stock item: ${selectedPoProduct.name}`
      });
      alert(`Stock request for ${selectedPoProduct.name} submitted successfully!`);
      setShowPoModal(false);
      setSelectedPoProduct(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit stock request');
    } finally {
      setSubmittingPo(false);
    }
  };

  useEffect(() => {
    fetchProductsAndInventory();
  }, [search, isLowStockFilter]);

  useEffect(() => {
    const fetchMargins = async () => {
      try {
        const res = await axios.get('/margins');
        setMarginRules(res.data.data || []);
      } catch (err) {
        console.error('Error fetching margins:', err);
      }
    };
    fetchMargins();
  }, []);

  const resolveMargin = (product, targetStoreId, rulesList = marginRules) => {
    if (!rulesList || rulesList.length === 0) return 10; // Default fallback

    // 1. Check rule matching storeId AND productId
    let rule = rulesList.find(r => 
      r.storeId && r.storeId.toString() === targetStoreId?.toString() && 
      r.productId && r.productId.toString() === product.id.toString()
    );
    if (rule) return rule.marginPercent;

    // 2. Check rule matching storeId AND categoryId
    const catId = product.category?._id || product.category || product.categoryId;
    rule = rulesList.find(r => 
      r.storeId && r.storeId.toString() === targetStoreId?.toString() && 
      r.categoryId && r.categoryId.toString() === catId?.toString()
    );
    if (rule) return rule.marginPercent;

    // 3. Check rule matching storeId only
    rule = rulesList.find(r => 
      r.storeId && r.storeId.toString() === targetStoreId?.toString() && 
      !r.productId && !r.categoryId
    );
    if (rule) return rule.marginPercent;

    // 4. Check rule matching productId only
    rule = rulesList.find(r => 
      !r.storeId && r.productId && r.productId.toString() === product.id.toString()
    );
    if (rule) return rule.marginPercent;

    // 5. Check rule matching categoryId only
    rule = rulesList.find(r => 
      !r.storeId && r.categoryId && r.categoryId.toString() === catId?.toString()
    );
    if (rule) return rule.marginPercent;

    // 6. Check default margin rule
    rule = rulesList.find(r => r.isDefault);
    if (rule) return rule.marginPercent;

    return 10; // default margin fallback
  };

  const fetchProductsAndInventory = async () => {
    try {
      // 1. Get products list
      const prodRes = await axios.get('/products', { params: { search } });

      // 2. Get dealer stock
      const invRes = await axios.get('/inventory/dealer');
      const invMap = {};
      invRes.data.data.forEach(item => {
        invMap[item.productId] = item.quantity;
      });
      setDealerInventory(invMap);

      // 3. Sort: items dealer has in stock appear first
      let sorted = [...prodRes.data.data].sort((a, b) => {
        const qtyA = invMap[a.id] || 0;
        const qtyB = invMap[b.id] || 0;
        if (qtyA > 0 && qtyB <= 0) return -1;
        if (qtyA <= 0 && qtyB > 0) return 1;
        return 0;
      });

      if (isLowStockFilter) {
        sorted = sorted.filter(p => (invMap[p.id] || 0) <= 20);
      }
      setProducts(sorted);

      // Setup initial quantities for picker
      const initialQtys = {};
      sorted.forEach(p => {
        initialQtys[p.id] = 1;
      });
      setQuantities(initialQtys);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = (productId, delta) => {
    const current = quantities[productId] || 1;
    const next = current + delta;
    if (next < 1) return;

    // Check against available dealer stock bounds
    const max = dealerInventory[productId] || 0;
    if (next > max) {
      alert(`Cannot exceed available dealer stock (${max})`);
      return;
    }

    setQuantities({ ...quantities, [productId]: next });
  };

  const [addedFeedback, setAddedFeedback] = useState({}); // { productId: boolean }

  const handleAddToCart = (product) => {
    const qty = quantities[product.id] || 1;
    const max = dealerInventory[product.id] || 0;

    if (max <= 0) {
      alert("This product is currently out of stock in your inventory. Please ask admin for stock transfer.");
      return;
    }

    const currentStoreId = useCartStore.getState().storeId;
    const detectedMargin = resolveMargin(product, currentStoreId);

    addToCart(product, qty, detectedMargin);

    // Show temporary feedback and stay on page
    setAddedFeedback(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedFeedback(prev => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  // Get reactive cart totals for the sticky bottom bar
  const cartItems = useCartStore(state => state.items);
  const { grandTotal } = useCartStore.getState().getTotals();

  return (
    <div className="space-y-6 relative min-h-[80vh]">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Stock Inventory Catalog</h2>
          <p className="text-slate-500 text-xs">Browse available dealer stock levels, verify base pricing, and build invoices.</p>
        </div>
        <Link
          to="/dealer/cart"
          className="inline-flex items-center space-x-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all self-start sm:self-auto cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Build Bill ({items.length} items)</span>
        </Link>
      </div>

      {/* Filter and search controls */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 border border-slate-150 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search catalog products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none transition-all"
          />
        </div>
      </div>

      {isLowStockFilter && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
            <span><strong>Filtering:</strong> Showing items with low inventory (20 units or less).</span>
          </div>
          <button
            onClick={() => setIsLowStockFilter(false)}
            className="text-[10px] font-black uppercase text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Clear Filter
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 pb-24 sm:pb-0">
          {products.map((product) => {
            const availableStock = dealerInventory[product.id] || 0;
            const chosenQty = quantities[product.id] || 1;
            const inCart = items.some(item => item.productId === product.id);
            const imageUrl = product.imageUrl ? `${BACKEND_URL}${product.imageUrl}` : null;

            return (
              <div key={product.id} className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group relative">
                
                {/* Product Image Thumbnail */}
                <div className="aspect-square w-full bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100 relative">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={product.name} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = `<div class="text-slate-300"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg></div>`;
                      }}
                    />
                  ) : (
                    <div className="text-slate-350">
                      <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                    </div>
                  )}
                </div>

                {/* Product Detail Header */}
                <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-rose-600 tracking-wider">SKU: {product.sku}</span>
                    <h3 className="font-bold text-slate-800 text-xs truncate flex items-center gap-1" title={product.name}>
                      {product.name.toLowerCase().includes('coriander') && (
                        <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                      <span>{product.name}</span>
                    </h3>
                    <span className="inline-block bg-slate-50 border border-slate-100 text-[8px] font-black uppercase px-2 py-0.5 rounded-md text-slate-500">
                      {product.category?.name}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs border-t border-slate-100 pt-2 sm:pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[10px] sm:text-xs">Dist. Price:</span>
                      <strong className="text-slate-800 text-[11px] sm:text-xs">₹{parseFloat(product.price).toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-[10px] sm:text-xs">GST:</span>
                      <span className="font-semibold text-slate-600 text-[10px] sm:text-xs">{product.gstPercent}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold text-[10px] sm:text-xs">Stock:</span>
                      <span className={`font-black px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] ${
                        availableStock <= 10 ? 'bg-amber-50 text-amber-700 animate-pulse' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {availableStock} {product.unit}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Qty and Purchase footer */}
                <div className="p-3 sm:p-5 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
                  {availableStock > 0 ? (
                    <div className="flex flex-col gap-2">
                      {/* Qty Plus/Minus Picker */}
                      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-0.5">
                        <button
                          onClick={() => handleQtyChange(product.id, -1)}
                          className="p-1 hover:bg-slate-50 rounded-lg text-slate-500 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={availableStock}
                          value={chosenQty}
                          onChange={(e) => {
                            const val = Math.min(availableStock, Math.max(1, parseInt(e.target.value) || 1));
                            setQuantities({ ...quantities, [product.id]: val });
                          }}
                          className="w-12 border-0 bg-transparent text-center font-bold text-xs text-slate-800 focus:outline-none focus:ring-0 p-0"
                        />
                        <button
                          onClick={() => handleQtyChange(product.id, 1)}
                          className="p-1 hover:bg-slate-50 rounded-lg text-slate-500 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        className={`w-full text-white font-bold py-2 rounded-xl text-[10px] uppercase transition-all flex items-center justify-center space-x-1.5 ${
                          addedFeedback[product.id] || inCart 
                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100' 
                            : 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-100'
                        }`}
                      >
                        {addedFeedback[product.id] ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added to Bill!</span>
                          </>
                        ) : inCart ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>In Bill</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Add to Bill</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openPoModal(product)}
                      className="w-full bg-rose-50 border border-rose-200 hover:bg-rose-100/50 text-rose-700 p-2.5 rounded-xl text-[9px] font-black text-center flex items-center justify-center space-x-1.5 cursor-pointer uppercase transition-all shadow-sm"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Ask Admin for stock</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Checkout Bar for Mobile */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-150 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-40 sm:hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Cart</span>
              <div className="text-xs text-slate-800 font-extrabold flex items-center space-x-1.5">
                <span>Build Bill ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
                <span className="text-slate-300">•</span>
                <span className="text-rose-600 font-black">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
            <Link
              to="/dealer/cart"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center space-x-2 shadow-lg shadow-rose-100 transition-all cursor-pointer shrink-0"
            >
              <span>Proceed to Bill</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
      {/* Ask Admin for Stock Modal */}
      {showPoModal && selectedPoProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden animate-zoom-in my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50">
              <div>
                <span className="text-[10px] font-black text-rose-600 uppercase tracking-wider block">Admin Stock Request</span>
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">Request Stock: {selectedPoProduct.name}</h3>
              </div>
              <button 
                onClick={() => { setShowPoModal(false); setSelectedPoProduct(null); }} 
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmittingPo} className="p-6 space-y-4 text-xs">
              <div className="bg-amber-50/50 border border-amber-100 text-amber-900 p-4 rounded-xl space-y-1">
                <p className="leading-relaxed">This item is currently out of stock in your inventory. Submitting this request will notify the warehouse administrator to dispatch a new stock transfer to your account.</p>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Requested Quantity ({selectedPoProduct.unit || 'PCS'}) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={poQty}
                  onChange={(e) => setPoQty(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold text-xs"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Minimum Order Qty is {selectedPoProduct.minOrderQty || 1} {selectedPoProduct.unit}</span>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">Request Notes / Reason</label>
                <textarea
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  rows="3"
                  placeholder="e.g. Urgent store billing demand, client pre-order request..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none"
                ></textarea>
              </div>

              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowPoModal(false); setSelectedPoProduct(null); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2.5 rounded-xl text-center cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPo}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all text-center flex items-center justify-center space-x-2 cursor-pointer disabled:bg-slate-200"
                >
                  {submittingPo ? (
                    <span>Submitting...</span>
                  ) : (
                    <span>Submit PO Request</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
