// src/pages/dealer/DealerProductsPage.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useCartStore } from '../../store/cartStore';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Tag, 
  AlertCircle,
  Check,
  ShoppingBag
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DealerProductsPage() {
  const [products, setProducts] = useState([]);
  const [dealerInventory, setDealerInventory] = useState({}); // { productId: qty }
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { addToCart, items, updateQuantity } = useCartStore();
  const [quantities, setQuantities] = useState({}); // local input states for quantity picker { productId: number }

  useEffect(() => {
    fetchProductsAndInventory();
  }, [search]);

  const fetchProductsAndInventory = async () => {
    try {
      // 1. Get products list
      const prodRes = await axios.get('/products', { params: { search } });
      setProducts(prodRes.data.data);

      // 2. Get dealer stock
      const invRes = await axios.get('/inventory/dealer');
      const invMap = {};
      invRes.data.data.forEach(item => {
        invMap[item.productId] = item.quantity;
      });
      setDealerInventory(invMap);

      // Setup initial quantities for picker
      const initialQtys = {};
      prodRes.data.data.forEach(p => {
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

  const handleAddToCart = (product) => {
    const qty = quantities[product.id] || 1;
    const max = dealerInventory[product.id] || 0;

    if (max <= 0) {
      alert("This product is currently out of stock in your inventory. Please ask admin for stock transfer.");
      return;
    }

    addToCart(product, qty, 10); // default margin to 10%
    alert(`Added ${qty} ${product.unit} of ${product.name} to billing cart!`);
  };

  return (
    <div className="space-y-6">
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

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const availableStock = dealerInventory[product.id] || 0;
            const chosenQty = quantities[product.id] || 1;
            const inCart = items.some(item => item.productId === product.id);

            return (
              <div key={product.id} className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                
                {/* Product Detail Header */}
                <div className="p-5 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-rose-600 tracking-wider">SKU: {product.sku}</span>
                    <h3 className="font-bold text-slate-800 text-xs truncate">{product.name}</h3>
                    <span className="inline-block bg-slate-50 border border-slate-100 text-[8px] font-black uppercase px-2 py-0.5 rounded-md text-slate-500">
                      {product.category?.name}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Dist. Price:</span>
                      <strong className="text-slate-800">₹{parseFloat(product.price).toFixed(2)}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">GST:</span>
                      <span className="font-semibold text-slate-600">{product.gstPercent}% GST</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-bold">My Stock:</span>
                      <span className={`font-black px-2 py-0.5 rounded-lg text-[10px] ${
                        availableStock <= 10 ? 'bg-amber-50 text-amber-700 animate-pulse' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {availableStock} {product.unit} available
                      </span>
                    </div>
                  </div>
                </div>

                {/* Qty and Purchase footer */}
                <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-3">
                  {availableStock > 0 ? (
                    <>
                      {/* Qty Plus/Minus Picker */}
                      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-1.5">
                        <button
                          onClick={() => handleQtyChange(product.id, -1)}
                          className="p-1 hover:bg-slate-50 rounded-lg text-slate-500"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black text-slate-800">{chosenQty}</span>
                        <button
                          onClick={() => handleQtyChange(product.id, 1)}
                          className="p-1 hover:bg-slate-50 rounded-lg text-slate-500"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl text-[10px] uppercase shadow-lg shadow-rose-200 transition-all flex items-center justify-center space-x-2"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add to Bill</span>
                      </button>
                    </>
                  ) : (
                    <div className="bg-rose-50/50 border border-rose-100/50 text-rose-700 p-3 rounded-xl text-[10px] font-bold text-center flex items-center justify-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Request stock from Admin</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
