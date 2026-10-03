import { createContext, useContext, useState, useCallback, useEffect } from "react";
import * as api from "../api";
import { trackAddToCart } from "../analytics/metaPixel";

const CartContext = createContext(null);
const STORAGE_KEY = "motolink-guest-cart-v1";

function readStoredCart() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(value)) return [];

    // Browser storage can be edited by the user or extensions. Keep only the
    // non-sensitive cart entries that have the shape the UI expects; checkout
    // still revalidates every product and price on the server.
    return value
      .filter((item) => {
        const product = item?.product;
        return (
          Number.isInteger(product?.id) &&
          product.id > 0 &&
          Number.isInteger(item?.quantity) &&
          item.quantity >= 1 &&
          item.quantity <= 99
        );
      })
      .map((item) => ({ ...item, id: item.product.id }));
  } catch {
    return [];
  }
}

export function CartProvider({ children, initialItems }) {
  const [items, setItems] = useState(() => initialItems ?? readStoredCart());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const refreshCart = useCallback(async () => {
    const current = readStoredCart();
    const refreshed = (
      await Promise.all(
        current.map(async (item) => {
          try {
            const product = await api.getProduct(item.product.id);
            return { id: product.id, product, quantity: item.quantity };
          } catch {
            return null;
          }
        })
      )
    ).filter(Boolean);
    setItems(refreshed);
    return refreshed;
  }, []);

  const addToCart = useCallback(async (productOrId, quantity = 1) => {
    const product =
      typeof productOrId === "object" ? productOrId : await api.getProduct(productOrId);
    if (!product || product.stockQuantity < 1) {
      throw new Error("This product is out of stock");
    }

    const existing = items.find((item) => item.product.id === product.id);
    const newQuantity = (existing?.quantity || 0) + quantity;
    if (newQuantity > product.stockQuantity) {
      throw new Error("Requested quantity exceeds available stock");
    }
    setItems((current) =>
      existing
        ? current.map((item) =>
            item.product.id === product.id ? { ...item, product, quantity: newQuantity } : item
          )
        : [...current, { id: product.id, product, quantity }]
    );
    trackAddToCart(product, quantity);
  }, [items]);

  const updateQuantity = useCallback((productId, quantity) => {
    const item = items.find((candidate) => candidate.product.id === productId);
    if (item && quantity > item.product.stockQuantity) {
      return Promise.reject(new Error("Requested quantity exceeds available stock"));
    }
    setItems((current) =>
      current.map((candidate) =>
        candidate.product.id === productId ? { ...candidate, quantity } : candidate
      )
    );
    return Promise.resolve();
  }, [items]);

  const removeFromCart = useCallback((productId) => {
    setItems((current) => current.filter((item) => item.product.id !== productId));
    return Promise.resolve();
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, count, refreshCart, addToCart, updateQuantity, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
