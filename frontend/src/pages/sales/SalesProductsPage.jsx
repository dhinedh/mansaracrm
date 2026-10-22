// src/pages/sales/SalesProductsPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Package, Search, DollarSign, Calculator, Tag, 
  CheckCircle2, Sparkles, AlertCircle, ShoppingBag, Send 
} from 'lucide-react';

export default function SalesProductsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial subtab from URL
  const getInitialTab = () => {
    const p = window.location.pathname;
    if (p.includes('/pricing')) return 'simulator';
    if (p.includes('/schemes')) return 'schemes';
    if (p.includes('/margins')) return 'margins';
    return 'catalogue';
  };

  const [activeSubTab, setActiveSubTab] = useState(getInitialTab);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Simulator state (Module 13)
  const [simProduct, setSimProduct] = useState(null);
  const [simDiscount, setSimDiscount] = useState(0);
  const [simMargin, setSimMargin] = useState(10);
  const [simQty, setSimQty] = useState(1);
  const [simResult, setSimResult] = useState(null);

  // Margin Request state (Module 14)
  const [marginReqProduct, setMarginReqProduct] = useState('');
  const [marginReqPercent, setMarginReqPercent] = useState('');
  const [marginReqRemarks, setMarginReqRemarks] = useState('');
  const [marginSubmitting, setMarginSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, schRes] = await Promise.all([
        axios.get('/field-sales/catalogue'),
        axios.get('/field-sales/schemes')
      ]);

      if (catRes.data?.success) {
        setProducts(catRes.data.data.products || []);
        setCategories(catRes.data.data.categories || []);
        if (catRes.data.data.products?.length > 0) {
          setSimProduct(catRes.data.data.products[0]);
        }
      }
      if (schRes.data?.success) {
        setSchemes(schRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching catalogue:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync activeSubTab when URL pathname changes
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/pricing')) {
      setActiveSubTab('simulator');
    } else if (path.includes('/schemes')) {
      setActiveSubTab('schemes');
    } else if (path.includes('/margins')) {
      setActiveSubTab('margins');
    } else if (path.includes('/catalogue') || path.includes('/stock')) {
      setActiveSubTab('catalogue');
    }
  }, [location.pathname]);

  const handleTabClick = (tab) => {
    setActiveSubTab(tab);
    if (tab === 'simulator') navigate('/sales/pricing');
    else if (tab === 'schemes') navigate('/sales/schemes');
    else if (tab === 'margins') navigate('/sales/margins');
    else navigate('/sales/catalogue');
  };

  const calculateLocally = (prod, marg, disc, qty) => {
    if (!prod) return null;
    const mrp = parseFloat(prod.mrp || 0);
    const m = parseFloat(marg || 10);
    const d = parseFloat(disc || 0);
    const q = parseInt(qty || 1, 10);

    const retailerPrice = mrp * (1 - (m / 100));
    const effectivePrice = retailerPrice * (1 - (d / 100));
    const orderVal = effectivePrice * q;
    const baseCost = parseFloat(prod.costPrice || (mrp * 0.55));
    const estProfit = (effectivePrice - baseCost) * q;

    return {
      product: { id: prod._id, name: prod.name, mrp },
      discountPercent: d,
      marginPercent: m,
      quantity: q,
      unitSellingPrice: Math.round(effectivePrice * 100) / 100,
      orderValue: Math.round(orderVal * 100) / 100,
      estimatedProfit: Math.round(estProfit * 100) / 100
    };
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-calculate simulation on input change
  useEffect(() => {
    if (simProduct) {
      setSimResult(calculateLocally(simProduct, simMargin, simDiscount, simQty));
    }
  }, [simProduct, simMargin, simDiscount, simQty]);

  // Run price simulation calculation
  const handleCalculateSimulation = async () => {
    if (!simProduct) return;
    try {
      const res = await axios.post('/field-sales/simulate-price', {
        productId: simProduct._id,
        discountPercent: simDiscount,
        marginPercent: simMargin,
        quantity: simQty
      });
      if (res.data?.success) {
        setSimResult(res.data.data);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    }
  };

  // Submit Margin Request
  const handleSubmitMarginRequest = async (e) => {
    e.preventDefault();
    if (!marginReqPercent) return;
    setMarginSubmitting(true);
    try {
      const res = await axios.post('/field-sales/margins/request', {
        productId: marginReqProduct || null,
        proposedMarginPercent: marginReqPercent,
        remarks: marginReqRemarks
      });
      if (res.data?.success) {
        alert('Margin approval request submitted to Admin!');
        setMarginReqPercent('');
        setMarginReqRemarks('');
      }
    } catch (err) {
      alert('Failed to submit margin request');
    } finally {
      setMarginSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory || p.category?._id === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Product & Pricing Management
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Modules 11–17: Catalogue, Price Simulator, Customer Margin Request & Trade Schemes
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => handleTabClick('catalogue')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'catalogue' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          Product Catalogue ({products.length})
        </button>
        <button
          type="button"
          onClick={() => handleTabClick('simulator')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'simulator' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          Price Simulator
        </button>
        <button
          type="button"
          onClick={() => handleTabClick('schemes')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'schemes' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          Trade Schemes ({schemes.length})
        </button>
        <button
          type="button"
          onClick={() => handleTabClick('margins')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'margins' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          Margin Approval Request
        </button>
      </div>

      {/* SubTab 1: Product Catalogue (Module 11, 12, 17) */}
      {activeSubTab === 'catalogue' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by title..."
                className="w-full pl-11 pr-4 py-2 bg-slate-800/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((p) => (
              <div 
                key={p._id} 
                className="bg-slate-800/80 border border-white/10 hover:border-amber-500/40 p-4 rounded-2xl flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="w-full h-32 bg-slate-900 rounded-xl overflow-hidden mb-3 flex items-center justify-center border border-white/5">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-10 h-10 text-slate-600" />
                    )}
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300 uppercase">
                    {p.category?.name || 'General'}
                  </span>
                  <h3 className="text-sm font-black text-white mt-1.5">{p.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{p.description || 'Premium Mansara FMCG Product'}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Retail MRP</span>
                    <div className="text-base font-black text-amber-400">₹{(p.mrp || 0).toLocaleString('en-IN')}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase">Pack / Carton</span>
                    <div className="text-xs font-bold text-slate-200">{p.unit || '10 Pcs/Box'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 2: Price Simulator (Module 13) */}
      {activeSubTab === 'simulator' && (
        <div className="max-w-2xl mx-auto bg-slate-800/80 border border-white/10 p-6 rounded-3xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/10">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Commercial Price & Margin Simulator</h3>
              <p className="text-xs text-slate-400">Calculate net retailer selling price, margin discounts and order profitability</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Select Target Product</label>
              <select
                value={simProduct?._id || ''}
                onChange={(e) => {
                  const prod = products.find(p => p._id === e.target.value);
                  setSimProduct(prod);
                }}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {products.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} - MRP ₹{p.mrp}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Retailer Margin (%)</label>
                <input
                  type="number"
                  value={simMargin}
                  onChange={(e) => setSimMargin(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Extra Discount (%)</label>
                <input
                  type="number"
                  value={simDiscount}
                  onChange={(e) => setSimDiscount(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 uppercase mb-1">Quantity</label>
                <input
                  type="number"
                  value={simQty}
                  onChange={(e) => setSimQty(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCalculateSimulation}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-3 rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer"
            >
              Simulate Net Price & Profitability
            </button>

            {simResult && (
              <div className="p-4 bg-purple-950/40 border border-purple-500/30 rounded-2xl space-y-2 pt-3">
                <h4 className="font-black text-purple-300 text-xs uppercase tracking-wider">Simulation Output</h4>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="bg-slate-900/80 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400">Effective Unit Price</span>
                    <p className="text-base font-black text-white">₹{simResult.unitSellingPrice}</p>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400">Total Order Value</span>
                    <p className="text-base font-black text-amber-400">₹{simResult.orderValue}</p>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl">
                    <span className="text-[10px] text-slate-400">Est. Gross Margin</span>
                    <p className="text-base font-black text-emerald-400">₹{simResult.estimatedProfit}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SubTab 3: Trade Promotion & Schemes (Module 16) */}
      {activeSubTab === 'schemes' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {schemes.map((scheme) => (
            <div 
              key={scheme.id} 
              className="bg-slate-800/80 border border-amber-500/30 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-black uppercase mb-3">
                  <Tag className="w-3 h-3" />
                  <span>Active Scheme</span>
                </div>
                <h3 className="text-base font-black text-white">{scheme.title}</h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{scheme.description}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Valid Until:</span>
                <span className="font-mono text-emerald-400 font-bold">{scheme.validUntil}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SubTab 4: Margin Request & Approval (Module 14, 15) */}
      {activeSubTab === 'margins' && (
        <div className="max-w-xl mx-auto bg-slate-800/80 border border-white/10 p-6 rounded-3xl space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Customer-Specific Margin Request</h3>
              <p className="text-xs text-slate-400">Submit special retailer margin request for Admin approval</p>
            </div>
          </div>

          <form onSubmit={handleSubmitMarginRequest} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Applicable Product (Optional)</label>
              <select
                value={marginReqProduct}
                onChange={(e) => setMarginReqProduct(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Apply to Entire Order / All Products</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Proposed Margin Percentage (%) *</label>
              <input
                type="number"
                required
                value={marginReqPercent}
                onChange={(e) => setMarginReqPercent(e.target.value)}
                placeholder="e.g. 15"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 uppercase mb-1">Remarks & Commercial Justification</label>
              <textarea
                rows="3"
                value={marginReqRemarks}
                onChange={(e) => setMarginReqRemarks(e.target.value)}
                placeholder="High volume retail placement, competitor scheme match..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={marginSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{marginSubmitting ? 'Submitting Request...' : 'Submit Margin for Approval'}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
