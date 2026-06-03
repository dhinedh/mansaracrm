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
      setStores(res.data.data);
      if (res.data.data.length > 0 && !storeId) {
        setStoreId(res.data.data[0].id); // select first store as default
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!storeId || items.length === 0) return;

    try {
      const res = await axios.post('/billing', {
        storeId,
        notes,
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

        {/* Store selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Select Target Store / Outlet *</label>
          <div className="relative">
            <Store className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-rose-500 rounded-xl focus:outline-none cursor-pointer font-bold text-slate-700 text-xs"
            >
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name} (GST: {s.gstNumber || 'N/A'})</option>
              ))}
            </select>
          </div>
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
          <div className="flex justify-between items-center">
            <span>Calculated GST (CGST+SGST):</span>
            <strong className="text-slate-800">₹{gstTotal.toFixed(2)}</strong>
          </div>
          <div className="flex justify-between items-center text-sm font-black border-t border-slate-100 pt-3 text-slate-800">
            <span>Final Invoice Value:</span>
            <span className="text-rose-600 text-base">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleGenerateInvoice}
          disabled={!storeId || items.length === 0}
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
