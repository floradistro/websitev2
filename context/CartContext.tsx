"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef, useMemo } from "react";
// import { analytics } from "@/lib/analytics";

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  tierName: string;
  image?: string;
  
  // DUAL UNIT SYSTEM - Critical for inventory deduction
  quantity_grams?: number;          // Actual amount in grams (for inventory deduction)
  quantity_display?: string;        // Display label (e.g., "1 lb", "3.5g", "½ oz")
  
  orderType?: "pickup" | "delivery";
  locationId?: string;
  locationName?: string;
  deliveryAddress?: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updateCartItem: (productId: number, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("flora-cart");
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        // Ensure it's an array before setting
        if (Array.isArray(parsed)) {
          setItems(parsed);
        } else {
          console.warn("Cart data in localStorage is not an array, clearing it");
          localStorage.removeItem("flora-cart");
        }
      } catch (error) {
        console.error("Failed to load cart:", error);
        localStorage.removeItem("flora-cart");
      }
    }
  }, []);

  // Debounced save to localStorage - prevents excessive writes
  useEffect(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to save after 300ms of inactivity
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem("flora-cart", JSON.stringify(items));
      } catch (error) {
        console.error("Failed to save cart:", error);
      }
    }, 300);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [items]);

  const addToCart = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existingItem = prev.find(
        (i) => i.productId === item.productId && i.tierName === item.tierName
      );

      if (existingItem) {
        return prev.map((i) =>
          i.productId === item.productId && i.tierName === item.tierName
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }

      return [...prev, item];
    });

    // Track analytics event
    // analytics.addToCart({
    //   id: item.productId,
    //   name: item.name,
    //   price: item.price,
    //   quantity: item.quantity,
    // });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setItems((prev) => {
      const item = prev.find((i) => i.productId === productId);
      
      // Track analytics event
      // if (item) {
      //   analytics.removeFromCart({
      //     id: item.productId,
      //     name: item.name,
      //     price: item.price,
      //     quantity: item.quantity,
      //   });
      // }
      
      return prev.filter((item) => item.productId !== productId);
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const updateCartItem = useCallback((productId: number, updates: Partial<CartItem>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, ...updates } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Memoize calculations to prevent re-computation on every render
  const itemCount = useMemo(() => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);
  
  const total = useMemo(() => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      items: Array.isArray(items) ? items : [],
      addToCart,
      removeFromCart,
      updateQuantity,
      updateCartItem,
      clearCart,
      itemCount,
      total,
    }),
    [items, addToCart, removeFromCart, updateQuantity, updateCartItem, clearCart, itemCount, total]
  );

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

