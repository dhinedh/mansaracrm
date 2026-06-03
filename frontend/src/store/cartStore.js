// src/store/cartStore.js
import { create } from 'zustand';

export const useCartStore = create((set, get) => ({
  storeId: '',
  items: [], // [{ productId, product, quantity, marginPct }]
  notes: '',

  // Actions
  setStoreId: (storeId) => set({ storeId }),
  setNotes: (notes) => set({ notes }),

  addToCart: (product, qty = 1, initialMargin = 0) => {
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
        items: [...items, { productId: product.id, product, quantity: qty, marginPct: initialMargin }]
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
      const basePrice = parseFloat(item.product.price);
      const sellingPrice = basePrice * (1 + (item.marginPct || 0) / 100);
      const gstPct = parseFloat(item.product.gstPercent);
      
      const lineSubtotal = sellingPrice * item.quantity;
      const lineGst = lineSubtotal * (gstPct / 100);

      subtotal += lineSubtotal;
      gstTotal += lineGst;
    });

    const grandTotal = subtotal + gstTotal;

    return {
      subtotal,
      gstTotal,
      grandTotal,
      itemCount: items.reduce((acc, curr) => acc + curr.quantity, 0)
    };
  }
}));
