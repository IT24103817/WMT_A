import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CartContext = createContext(null);
const STORAGE_KEY = 'gm_cart_v1';

/**
 * Local AsyncStorage cart. One item per listing (gem listings are unique pieces).
 * `qty` is conceptually limited to 1 per listing but we keep the field so the
 * Order model is uniform across direct/offer/bid sources.
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setItems(JSON.parse(raw));
      } catch {}
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, hydrated]);

  const add = useCallback((listing) => {
    if (!listing?._id) return;
    setItems((prev) => {
      if (prev.some((i) => i.listingId === listing._id)) return prev; // already in cart
      return [...prev, {
        listingId: listing._id,
        gemId: listing.gem?._id,
        gemName: listing.gem?.name || 'Gem',
        gemMeta: [listing.gem?.type, listing.gem?.colour, listing.gem?.carats ? `${listing.gem.carats}ct` : null].filter(Boolean).join(' · '),
        photo: listing.gem?.photos?.[0] || listing.photos?.[0] || null,
        unitPrice: listing.price,
        qty: 1,
        stockQty: Math.max(1, Number(listing.gem?.stockQty) || 1),
      }];
    });
  }, []);

  const remove = useCallback((listingId) => {
    setItems((prev) => prev.filter((i) => i.listingId !== listingId));
  }, []);

  const updateQty = useCallback((listingId, qty) => {
    setItems((prev) => prev.map((i) => {
      if (i.listingId !== listingId) return i;
      const cap = Math.max(1, Number(i.stockQty) || 1);
      return { ...i, qty: Math.max(1, Math.min(cap, qty)) };
    }));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const has = useCallback((listingId) => items.some((i) => i.listingId === listingId), [items]);

  const subtotal = items.reduce((s, i) => s + (i.unitPrice * (i.qty || 1)), 0);
  const count = items.length;

  return (
    <CartContext.Provider value={{ items, add, remove, updateQty, clear, has, subtotal, count, hydrated }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return { items: [], add: () => {}, remove: () => {}, updateQty: () => {}, clear: () => {}, has: () => false, subtotal: 0, count: 0, hydrated: true };
  }
  return ctx;
}
