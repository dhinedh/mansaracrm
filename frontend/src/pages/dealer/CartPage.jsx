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
  ShoppingCart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CartPage() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGstEnabled, setIsGstEnabled] = useState(true);
  const [storeSearch, setStoreSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  const { 
    items, 
    storeId, 
    notes, 
    setStoreId, 
    setNotes, 
    updateQuantity, 
    updateMargin, 
    removeFromCart, 
    clearCart,
    getTotals 
  } = useCartStore();

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await axios.get('/stores');
      const storeData = res.data.data || [];
      setStores(storeData);
      if (storeData.length > 0 && !storeId) {
        setStoreId(storeData[0].id);
        setStoreSearch(storeData[0].name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
    if (exactMatch) {
      setStoreId(exactMatch.id);
    } else {
      setStoreId(null);
    }
  };

  const handleSuggestionClick = (store) => {
    setStoreSearch(store.name);
    setStoreId(store.id);
    setShowSuggestions(false);
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
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          marginPct: item.marginPct
        }))
      });

      alert(`GST Invoice ${res.data.data.invoiceNo} generated successfully!`);
      clearCart();
      navigate('/dealer/invoices');
    } catch (err) {
      alert(err.response?.data?.message || 'Invoice generation failed');
    }
  };

  const { subtotal, gstTotal, grandTotal } = getTotals();

  if (items.length === 0) {
    return (
      <div className="bg-white border border-slate-150 rounded-3xl p-12 text-center max-w-lg mx-auto mt-12 shadow-sm">
        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-6">
          <ShoppingCart className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Billing Cart is Empty</h3>
        <p className="text-slate-500 text-xs mt-1.5 mb-6">Browse warehouse products, confirm local dealer stock levels, and select quantities to build custom invoices.</p>
        <button
          onClick={() => navigate('/dealer/products')}
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-rose-200 transition-all cursor-pointer"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* Products list and store selector */}
      <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="font-black text-slate-800 text-sm uppercase tracking-wide">GST Billing Constructor</h3>
          <button onClick={clearCart} className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100/50 px-3 py-1.5 rounded-lg cursor-pointer">Clear All</button>
        </div>

        {/* Store selector (Text input search & dynamically register) */}
        <div className="space-y-2 relative z-20">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Select Target Store / Outlet *</label>
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
              ✨ Store "{storeSearch}" not found. It will be registered as a new outlet when you generate the invoice.
            </p>
          )}
        </div>

        {/* Items Listing */}
        <div className="space-y-4">
          <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">Billing Items Grid</span>
          
          <div className="border border-slate-150 rounded-2xl overflow-hidden bg-white">
            <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-100 p-3.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
              <div className="col-span-4">Product details</div>
              <div className="col-span-3 text-center">Billing Qty</div>
              <div className="col-span-2 text-center">Margin %</div>
              <div className="col-span-2 text-right">Selling Price</div>
              <div className="col-span-1 text-center">Action</div>
            </div>

            {items.map((item) => {
              const basePrice = parseFloat(item.product.price);
              const sellingPrice = basePrice * (1 + (item.marginPct || 0) / 100);
              const lineTotal = sellingPrice * item.quantity;

              return (
                <div key={item.productId} className="grid grid-cols-12 items-center p-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50/20 text-xs">
                  {/* Name and SKU */}
                  <div className="col-span-4">
                    <p className="font-bold text-slate-800 truncate">{item.product.name}</p>
                    <span className="text-[9px] font-black text-rose-600 block">SKU: {item.product.sku}</span>
                    <span className="text-[9px] text-slate-400 block">Base: ₹{basePrice.toFixed(2)}</span>
                  </div>

                  {/* Quantity input */}
                  <div className="col-span-3 flex justify-center">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 0)}
                      className="w-16 p-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none text-center font-bold text-slate-700"
                    />
                  </div>

                  {/* Margin % input */}
                  <div className="col-span-2 flex justify-center">
                    <div className="relative w-16">
                      <input
                        type="number"
                        value={item.marginPct}
                        onChange={(e) => updateMargin(item.productId, e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none text-center font-bold text-slate-700 pr-5"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">%</span>
                    </div>
                  </div>

                  {/* Selling Price */}
                  <div className="col-span-2 text-right">
                    <p className="font-bold text-slate-800">₹{sellingPrice.toFixed(2)}</p>
                    <span className="text-[9px] text-slate-400 block">Total: ₹{lineTotal.toFixed(2)}</span>
                  </div>

                  {/* Delete Button */}
                  <div className="col-span-1 flex justify-center">
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-rose-600 hover:text-rose-800 p-1 bg-rose-50 hover:bg-rose-100 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Memo Notes */}
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
      </div>

      {/* Cart Summary */}
      <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm h-fit space-y-6">
        <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Invoice Summary</h3>

        <div className="space-y-3.5 text-xs text-slate-600 border-b border-slate-100 pb-4">
          <div className="flex justify-between items-center">
            <span>Subtotal (Selling Price):</span>
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

          <div className="flex justify-between items-center text-sm font-black border-t border-slate-100 pt-3 text-slate-800">
            <span>Final Invoice Value:</span>
            <span className="text-rose-600 text-base">₹{(isGstEnabled ? grandTotal : subtotal).toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleGenerateInvoice}
          disabled={(!storeId && !storeSearch.trim()) || items.length === 0}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-xs flex items-center justify-center space-x-2 disabled:bg-slate-200 disabled:shadow-none cursor-pointer"
        >
          <Receipt className="w-4 h-4" />
          <span>Generate Tax Invoice</span>
        </button>

        <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl flex items-start space-x-2.5 text-[10px] text-slate-400 leading-relaxed">
          <Calculator className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span>Margins are automatically calculated on top of base distributor pricing and correct tax slabs (5%, 12%, 18% HSN GST rules) are applied.</span>
        </div>
      </div>
    </div>
  );
}
