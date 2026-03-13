"use client";

import { create } from "zustand";

export interface CartItem {
  productId: string;
  storeId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  maxStock: number;
}

interface CartState {
  items: CartItem[];
  storeId: string | null;
  storeName: string | null;
  isOpen: boolean;

  addItem: (item: CartItem, storeName: string) => "added" | "different_store";
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  forceAddItem: (item: CartItem, storeName: string) => void;
  setOpen: (open: boolean) => void;

  getItemCount: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  storeId: null,
  storeName: null,
  isOpen: false,

  addItem: (item, storeName) => {
    const state = get();
    if (state.storeId && state.storeId !== item.storeId) {
      return "different_store";
    }

    const existing = state.items.find((i) => i.productId === item.productId);
    if (existing) {
      const newQty = Math.min(existing.quantity + item.quantity, item.maxStock, 99);
      set({
        items: state.items.map((i) =>
          i.productId === item.productId ? { ...i, quantity: newQty } : i,
        ),
      });
    } else {
      if (state.items.length >= 50) return "added"; // silently cap
      set({
        items: [...state.items, item],
        storeId: item.storeId,
        storeName,
      });
    }
    return "added";
  },

  removeItem: (productId) => {
    const state = get();
    const newItems = state.items.filter((i) => i.productId !== productId);
    set({
      items: newItems,
      storeId: newItems.length > 0 ? state.storeId : null,
      storeName: newItems.length > 0 ? state.storeName : null,
    });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    set({
      items: get().items.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.min(quantity, i.maxStock, 99) }
          : i,
      ),
    });
  },

  clearCart: () => set({ items: [], storeId: null, storeName: null }),

  forceAddItem: (item, storeName) => {
    set({
      items: [item],
      storeId: item.storeId,
      storeName,
    });
  },

  setOpen: (open) => set({ isOpen: open }),

  getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

  getSubtotal: () =>
    get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));
