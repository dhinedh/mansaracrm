// src/pages/dealer/CartPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useCartStore } from '../../store/cartStore';
import { 
  Trash2, 
  Store, 
  FileText, 
  Calculator, 
  AlertTriangle,
  Receipt,
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Check,
  PlusCircle,
  Truck,
  AlertCircle,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CartPage() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGstEnabled, setIsGstEnabled] = useState(true);
  const [isCredit, setIsCredit] = useState(false);
  const [storeSearch, setStoreSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  
  // Redesign state
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [dealerInventory, setDealerInventory] = useState({});
  const [catalogSearch, setCatalogSearch] = useState('');
  const [localQtys, setLocalQtys] = useState({});
  const [localMargins, setLocalMargins] = useState({});
  const [shippingCharges, setShippingCharges] = useState(0);
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

  const { 
    items, 
    storeId, 
    notes, 
    setStoreId, 
    setNotes, 
    addToCart,
    updateQuantity, 
    updateMargin,
    updateUnit,
    removeFromCart, 
    clearCart,
    getTotals 
  } = useCartStore();

  const fetchMarginRules = async () => {
    try {
      const res = await axios.get('/margins');
      return res.data.data || [];
    } catch (err) {
      console.error('Error fetching margins:', err);
      return [];
    }
  };

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

  useEffect(() => {
    const init = async () => {
      try {
        const rules = await fetchMarginRules();
        setMarginRules(rules);
        
        // Fetch stores
        const res = await axios.get('/stores');
        const storeData = res.data.data || [];
        setStores(storeData);
        
        let initialStoreId = useCartStore.getState().storeId;
        if (storeData.length > 0 && !initialStoreId) {
          initialStoreId = storeData[0].id;
          setStoreId(initialStoreId);
          setStoreSearch(storeData[0].name);
        }
        
        setLoading(false);
        await fetchProductsAndInventory(rules, initialStoreId);
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    fetchProductsAndInventory();
  }, [catalogSearch]);

  // Keep local inputs in sync with items in cart
  useEffect(() => {
    const newQtys = { ...localQtys };
    const newMargins = { ...localMargins };
    items.forEach(item => {
      newQtys[item.productId] = item.quantity;
      newMargins[item.productId] = item.marginPct;
    });
    setLocalQtys(newQtys);
    setLocalMargins(newMargins);
  }, [items]);

  const fetchStores = async () => {
    try {
      const res = await axios.get('/stores');
      const storeData = res.data.data || [];
      setStores(storeData);
      if (storeData.length > 0 && !useCartStore.getState().storeId) {
        setStoreId(storeData[0].id);
        setStoreSearch(storeData[0].name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsAndInventory = async (currentRules = marginRules, targetStoreId = storeId) => {
    try {
      const prodRes = await axios.get('/products', { params: { search: catalogSearch } });
      const invRes = await axios.get('/inventory/dealer');
      const invMap = {};
      invRes.data.data.forEach(item => {
        invMap[item.productId] = item.quantity;
      });
      setDealerInventory(invMap);

      // Sort so items with stock > 0 are at the top
      const sorted = [...prodRes.data.data].sort((a, b) => {
        const qtyA = invMap[a.id] || 0;
        const qtyB = invMap[b.id] || 0;
        if (qtyA > 0 && qtyB <= 0) return -1;
        if (qtyA <= 0 && qtyB > 0) return 1;
        return 0;
      });
      setCatalogProducts(sorted);

      // Initialize default inputs for search results
      setLocalQtys(prev => {
        const next = { ...prev };
        sorted.forEach(p => {
          if (next[p.id] === undefined) next[p.id] = 1;
        });
        return next;
      });
      setLocalMargins(prev => {
        const next = { ...prev };
        sorted.forEach(p => {
          next[p.id] = resolveMargin(p, targetStoreId, currentRules);
        });
        return next;
      });
    } catch (err) {
      console.error('Error fetching catalog in cart page:', err);
    }
  };

  const handleStoreSearchChange = (val) => {
    setStoreSearch(val);
    if (val.trim().length >= 2) {
      const matched = stores.filter(s => s.name.toLowerCase().includes(val.toLowerCase()));
      setFilteredSuggestions(matched);
      setShowSuggestions(true);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
    const exactMatch = stores.find(s => s.name.toLowerCase() === val.trim().toLowerCase());
    const targetStoreId = exactMatch ? exactMatch.id : null;
    
    setStoreId(targetStoreId);

    // Dynamically update localMargins for catalog selection
    setLocalMargins(prev => {
      const next = { ...prev };
      catalogProducts.forEach(p => {
        next[p.id] = resolveMargin(p, targetStoreId);
      });
      return next;
    });

    // Dynamically update cart items margin percentages
    items.forEach(item => {
      const newMargin = resolveMargin(item.product, targetStoreId);
      updateMargin(item.productId, newMargin);
    });
  };

  const handleSuggestionClick = (store) => {
    setStoreSearch(store.name);
    setStoreId(store.id);
    setShowSuggestions(false);

    // Dynamically update localMargins for catalog selection
    setLocalMargins(prev => {
      const next = { ...prev };
      catalogProducts.forEach(p => {
        next[p.id] = resolveMargin(p, store.id);
      });
      return next;
    });

    // Dynamically update cart items margin percentages
    items.forEach(item => {
      const newMargin = resolveMargin(item.product, store.id);
      updateMargin(item.productId, newMargin);
    });
  };

  const handleLocalQtyChange = (productId, delta, max) => {
    const current = localQtys[productId] || 1;
    const next = current + delta;
    if (next < 1) return;
    if (next > max) {
      alert(`Cannot exceed available stock of ${max}`);
      return;
    }
    setLocalQtys(prev => ({ ...prev, [productId]: next }));
  };

  const handleAddOrUpdateItem = (product) => {
    const qty = localQtys[product.id] || 1;
    const margin = localMargins[product.id] || 10;
    const max = dealerInventory[product.id] || 0;

    if (max <= 0) {
      alert("This product is currently out of stock in your inventory. Request stock from central warehouse.");
      return;
    }

    if (qty > max) {
      alert(`Cannot exceed available stock of ${max} ${product.unit}`);
      return;
    }

    const inCart = items.find(it => it.productId === product.id);
    if (inCart) {
      updateQuantity(product.id, qty);
      updateMargin(product.id, margin);
    } else {
      addToCart(product, qty, margin);
    }
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!storeId && !storeSearch.trim()) {
      alert('Please select or enter a target store/outlet.');
      return;
    }

    try {
      const res = await axios.post('/billing', {
        storeId,
        storeName: storeId ? undefined : storeSearch.trim(),
        notes,
        isGstEnabled,
        isCredit,
        shippingCharges: parseFloat(shippingCharges || 0),
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          marginPct: item.marginPct,
          unit: item.unit || 'PCS'
        }))
      });

      alert(`GST Invoice ${res.data.data.invoiceNo} generated successfully as OPEN!`);
      clearCart();
      setShippingCharges(0);
      navigate('/dealer/ledgers');
    } catch (err) {
      alert(err.response?.data?.message || 'Invoice generation failed');
    }
  };

  const { subtotal, gstTotal, grandTotal } = getTotals();
  const finalGrandTotal = (isGstEnabled ? grandTotal : subtotal) + parseFloat(shippingCharges || 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Catalog Quick Add & Cart Panel */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Quick Selection List Section */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider flex items-center space-x-2">
              <PlusCircle className="w-4 h-4 text-rose-600" />
              <span>Quick Product Selection</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Search local stock and add instantly</span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search local stock catalog by name/SKU..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none text-xs transition-all"
            />
          </div>

          {/* Product grid / list */}
          <div className="max-h-60 overflow-y-auto pr-1 divide-y divide-slate-100 border border-slate-150 rounded-xl bg-slate-50/20">
            {catalogProducts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 font-medium">
                No matching catalog items found.
              </div>
            ) : (
              catalogProducts.map(product => {
                const maxStock = dealerInventory[product.id] || 0;
                const chosenQty = localQtys[product.id] || 1;
                const chosenMargin = localMargins[product.id] || 10;
                const inCart = items.some(it => it.productId === product.id);

                return (
                  <div key={product.id} className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white hover:bg-slate-50/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-slate-800 text-xs truncate">{product.name}</h4>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wide ${
                          maxStock <= 0 ? 'bg-rose-50 text-rose-700' :
                          maxStock <= 10 ? 'bg-amber-50 text-amber-700 animate-pulse' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {maxStock} {product.unit} In Stock
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5 font-medium">SKU: {product.sku} · Category: {product.category?.name || 'General'}</p>
                    </div>
                    {maxStock > 0 ? (
                      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                        {/* Margin field */}
                        <div className="space-y-0.5">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide">Margin %</span>
                          <div className="relative w-14">
                            <input
                              type="number"
                              value={chosenMargin}
                              onChange={(e) => setLocalMargins({ ...localMargins, [product.id]: parseFloat(e.target.value) || 0 })}
                              className="w-full p-1.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:rounded-lg text-center font-bold text-slate-700 text-xs pr-4 focus:outline-none"
                            />
                            <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">%</span>
                          </div>
                        </div>

                        {/* Qty selector */}
                        <div className="space-y-0.5">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide">Qty</span>
                          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => handleLocalQtyChange(product.id, -1, maxStock)}
                              className="p-1 hover:bg-white rounded text-slate-500 cursor-pointer"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              max={maxStock}
                              value={chosenQty}
                              onChange={(e) => setLocalQtys({ ...localQtys, [product.id]: Math.min(maxStock, Math.max(1, parseInt(e.target.value) || 1)) })}
                              className="w-8 border-0 bg-transparent text-center font-bold text-xs text-slate-800 focus:outline-none focus:ring-0 p-0"
                            />
                            <button
                              type="button"
                              onClick={() => handleLocalQtyChange(product.id, 1, maxStock)}
                              className="p-1 hover:bg-white rounded text-slate-500 cursor-pointer"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>

                        {/* Add button */}
                        <div className="pt-3.5">
                          <button
                            type="button"
                            onClick={() => handleAddOrUpdateItem(product)}
                            className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide flex items-center space-x-1 cursor-pointer transition-all ${
                              inCart 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100/50'
                                : 'bg-rose-600 text-white hover:bg-rose-700 shadow-md shadow-rose-100'
                            }`}
                          >
                            {inCart ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            <span>{inCart ? 'Sync' : 'Add'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center pt-2">
                        <button
                          type="button"
                          onClick={() => openPoModal(product)}
                          className="px-3 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100/50 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-wide flex items-center space-x-1.5 cursor-pointer transition-all shadow-sm"
                        >
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Ask Admin for stock</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Items Ledger (Cart items) */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Billed Items List</h3>
              <span className="text-[10px] text-slate-400 block font-medium mt-0.5">Edit margins & quantities dynamically below</span>
            </div>
            {items.length > 0 && (
              <button 
                onClick={clearCart} 
                className="text-[9px] font-black text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/20 font-medium">
              No products added to this invoice yet. Use the product list above to search and add products.
            </div>
          ) : (
            <div className="border border-slate-150 rounded-xl overflow-hidden bg-white">
              <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 p-3 text-[9px] font-black uppercase tracking-wider text-slate-400">
                <div className="col-span-5">Product Details</div>
                <div className="col-span-2 text-center">Billing Qty</div>
                <div className="col-span-2 text-center">Margin %</div>
                <div className="col-span-2 text-right">Selling Price</div>
                <div className="col-span-1 text-center">Delete</div>
              </div>

              {items.map((item) => {
                const mrp = parseFloat(item.product.mrp || item.product.price || 0);
                const sellingPrice = mrp * (1 - (item.marginPct || 0) / 100);
                
                const unit = item.unit || 'PCS';
                const cartonSize = item.product.cartonSize || 12;
                const qtyInPieces = unit === 'CTN' ? item.quantity * cartonSize : item.quantity;
                const lineTotal = sellingPrice * qtyInPieces;
                const maxStock = dealerInventory[item.productId] || 0;

                return (
                  <div key={item.productId} className="grid grid-cols-12 items-center p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50/20 text-xs">
                    <div className="col-span-5 pr-2">
                      <p className="font-bold text-slate-800 truncate">{item.product.name}</p>
                      <span className="text-[9px] font-black text-rose-600 block">SKU: {item.product.sku}</span>
                      <span className="text-[9px] text-slate-450 block font-medium">MRP: ₹{mrp.toFixed(2)} · Stock: {maxStock} PCS</span>
                    </div>

                    <div className="col-span-2 flex flex-col items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max={unit === 'CTN' ? Math.floor(maxStock / cartonSize) : maxStock}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.productId, Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-14 p-1 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg text-center font-bold text-slate-700 text-xs focus:outline-none"
                      />
                      <select
                        value={unit}
                        onChange={(e) => updateUnit(item.productId, e.target.value)}
                        className="text-[9px] p-0.5 border border-slate-200 rounded bg-white text-slate-600 focus:outline-none focus:border-rose-500"
                      >
                        <option value="PCS">PCS</option>
                        <option value="CTN">CTN ({cartonSize})</option>
                      </select>
                    </div>

                    <div className="col-span-2 flex justify-center">
                      <div className="relative w-14">
                        <input
                          type="number"
                          value={item.marginPct}
                          onChange={(e) => updateMargin(item.productId, e.target.value)}
                          className="w-full p-1 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-lg text-center font-bold text-slate-700 text-xs pr-4 focus:outline-none"
                        />
                        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">%</span>
                      </div>
                    </div>

                    <div className="col-span-2 text-right">
                      <p className="font-bold text-slate-800">₹{sellingPrice.toFixed(2)}</p>
                      <span className="text-[9px] text-slate-400 block font-medium">Tot: ₹{lineTotal.toFixed(2)}</span>
                    </div>

                    <div className="col-span-1 flex justify-center">
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-rose-600 hover:text-rose-800 p-1 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart Summary Panel */}
      <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm h-fit space-y-6">
        <h3 className="font-black text-slate-800 text-xs uppercase tracking-wider">Invoice Configuration</h3>

        {/* Store Selection */}
        <div className="space-y-2 relative z-25">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Target Store / Outlet *</label>
          <div className="relative">
            <Store className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={storeSearch}
              onChange={(e) => handleStoreSearchChange(e.target.value)}
              onFocus={() => {
                if (storeSearch.trim().length >= 2) {
                  const matched = stores.filter(s => s.name.toLowerCase().includes(storeSearch.toLowerCase()));
                  setFilteredSuggestions(matched);
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Type customer shop or store name..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold text-slate-700 text-xs transition-all"
            />
          </div>
          
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute top-[68px] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-slate-100">
              {filteredSuggestions.map(s => (
                <div
                  key={s.id}
                  onClick={() => handleSuggestionClick(s)}
                  className="p-3 hover:bg-rose-50/50 cursor-pointer text-xs flex justify-between items-center transition-colors"
                >
                  <strong className="text-slate-800 font-bold">{s.name}</strong>
                  <span className="text-[10px] text-slate-400 font-medium">{s.phone || s.city || 'Existing outlet'}</span>
                </div>
              ))}
            </div>
          )}
          
          {storeSearch.trim().length >= 2 && !storeId && (
            <p className="text-[10px] text-indigo-600 font-bold animate-pulse mt-1">
              ✨ Store "{storeSearch}" not found. It will be registered dynamically.
            </p>
          )}
        </div>

        {/* Shipping Charges */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Shipping Charges (₹)</label>
          <div className="relative">
            <Truck className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              min="0"
              value={shippingCharges}
              onChange={(e) => setShippingCharges(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="0.00"
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none font-bold text-slate-700 text-xs transition-all"
            />
          </div>
        </div>

        {/* Invoice Summary Calculations */}
        <div className="space-y-3.5 text-xs text-slate-600 border-b border-slate-100 pb-4">
          <div className="flex justify-between items-center">
            <span>Subtotal:</span>
            <strong className="text-slate-800">₹{subtotal.toFixed(2)}</strong>
          </div>
          
          <div className="flex items-center justify-between border-t border-dashed border-slate-100 pt-3 pb-1">
            <label className="flex items-center space-x-2 font-bold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isGstEnabled}
                onChange={(e) => setIsGstEnabled(e.target.checked)}
                className="rounded text-rose-600 border-slate-300 focus:ring-rose-500 w-4 h-4 cursor-pointer"
              />
              <span>Enable GST Tax Billing</span>
            </label>
          </div>

          <div className="flex items-center justify-between border-t border-dashed border-slate-100 pt-3 pb-1">
            <label className="flex items-center space-x-2 font-bold text-slate-750 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCredit}
                onChange={(e) => setIsCredit(e.target.checked)}
                className="rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
              />
              <span className="flex items-center space-x-1">
                <span>Mark as Credit (15 Days Terms)</span>
                <span className="text-[9px] bg-indigo-50 text-indigo-700 font-extrabold px-1.5 py-0.2 rounded uppercase tracking-wider">Credit</span>
              </span>
            </label>
          </div>

          {isGstEnabled ? (
            <>
              <div className="flex justify-between items-center text-[10px] text-slate-400 pl-4 border-l-2 border-rose-100">
                <span>CGST (50% of GST):</span>
                <strong className="text-slate-600">₹{(gstTotal / 2).toFixed(2)}</strong>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 pl-4 border-l-2 border-rose-100">
                <span>SGST (50% of GST):</span>
                <strong className="text-slate-600">₹{(gstTotal / 2).toFixed(2)}</strong>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 pl-4 border-l-2 border-rose-200">
                <span>Total GST:</span>
                <strong className="text-slate-800">₹{gstTotal.toFixed(2)}</strong>
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center text-[11px] text-slate-400 pl-4 border-l-2 border-slate-200">
              <span>GST Tax:</span>
              <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded text-[9px] uppercase font-black">Disabled</span>
            </div>
          )}

          {parseFloat(shippingCharges) > 0 && (
            <div className="flex justify-between items-center text-xs text-slate-600">
              <span>Shipping Charges:</span>
              <strong className="text-slate-800">₹{parseFloat(shippingCharges).toFixed(2)}</strong>
            </div>
          )}

          <div className="flex justify-between items-center text-sm font-black border-t border-slate-100 pt-3 text-slate-800">
            <span>Final Invoice Value:</span>
            <span className="text-rose-600 text-base">₹{finalGrandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Remarks / Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="2"
            placeholder="e.g. Terms, delivery instructions, reference invoice details"
            className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-rose-500 focus:bg-white rounded-xl focus:outline-none text-xs"
          ></textarea>
        </div>

        <button
          onClick={handleGenerateInvoice}
          disabled={(!storeId && !storeSearch.trim()) || items.length === 0}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-xs flex items-center justify-center space-x-2 disabled:bg-slate-200 disabled:shadow-none cursor-pointer"
        >
          <Receipt className="w-4 h-4" />
          <span>Generate Tax Invoice (OPEN)</span>
        </button>

      </div>

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
