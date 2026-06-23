// src/store/cartStore.js
import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  storeId: '',
  items: [], // [{ productId, product, quantity, marginPct, unit }]
  notes: '',

  // Actions
  setStoreId: (storeId) => set({ storeId }),
  setNotes: (notes) => set({ notes }),

  addToCart: (product, qty = 1, initialMargin = 0, unit = 'PCS') => {
    const { items } = get();
    const existing = items.find(item => item.productId === product.id);

    if (existing) {
      set({
        items: items.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + qty }
            : item
        )
      });
    } else {
      set({
        items: [...items, { productId: product.id, product, quantity: qty, marginPct: initialMargin, unit }]
      });
    }
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set({
      items: get().items.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    });
  },

  updateMargin: (productId, marginPct) => {
    set({
      items: get().items.map(item =>
        item.productId === productId ? { ...item, marginPct: parseFloat(marginPct) || 0 } : item
      )
    });
  },

  updateUnit: (productId, unit) => {
    set({
      items: get().items.map(item =>
        item.productId === productId ? { ...item, unit } : item
      )
    });
  },

  removeFromCart: (productId) => {
    set({
      items: get().items.filter(item => item.productId !== productId)
    });
  },

  clearCart: () => set({ items: [], storeId: '', notes: '' }),

  // Totals calculations
  getTotals: () => {
    const { items } = get();
    let subtotal = 0;
    let gstTotal = 0;

    items.forEach(item => {
      const mrp = parseFloat(item.product.mrp || item.product.price || 0);
      const sellingPrice = mrp * (1 - (item.marginPct || 0) / 100);
      const gstPct = parseFloat(item.product.gstPercent);
      
      const unit = item.unit || 'PCS';
      const cartonSize = item.product.cartonSize || 24;
      const qtyInPieces = unit === 'CTN' ? (item.quantity * cartonSize) : item.quantity;
      
      const lineSubtotal = sellingPrice * qtyInPieces;
      const lineGst = lineSubtotal * (gstPct / 100);

      subtotal += lineSubtotal;
      gstTotal += lineGst;
    });

    const grandTotal = subtotal + gstTotal;

    return {
      subtotal,
      gstTotal,
      grandTotal,
      itemCount: items.reduce((acc, curr) => {
        const unit = curr.unit || 'PCS';
        const cartonSize = curr.product.cartonSize || 24;
        const qtyInPieces = unit === 'CTN' ? (curr.quantity * cartonSize) : curr.quantity;
        return acc + qtyInPieces;
      }, 0)
    };
  }
}));
