import React, { createContext, useCallback, useContext, useState } from 'react';

export interface CartItem {
  photoId: string;
  photoTitle: string;
  thumbnailUrl: string | null;
  priceCfa: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (photoId: string) => void;
  clearCart: () => void;
  isInCart: (photoId: string) => boolean;
  totalCfa: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/** Client-side only, per browser tab, cleared on checkout — this is a
 * pre-purchase scratchpad, not a record of anything real; the order and
 * its price breakdown are only ever authoritative once the backend
 * creates them. */
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => (prev.some((c) => c.photoId === item.photoId) ? prev : [...prev, item]));
  }, []);

  const removeFromCart = useCallback((photoId: string) => {
    setCart((prev) => prev.filter((c) => c.photoId !== photoId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);
  const isInCart = useCallback((photoId: string) => cart.some((c) => c.photoId === photoId), [cart]);
  const totalCfa = cart.reduce((sum, item) => sum + item.priceCfa, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, isInCart, totalCfa }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};
