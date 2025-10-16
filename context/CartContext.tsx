"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
// import { analytics } from "@/lib/analytics";

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  tierName: string;
  image?: string;
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

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("flora-cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Failed to load cart:", error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("flora-cart", JSON.stringify(items));
  }, [items]);

  const addToCart = (item: CartItem) => {
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
  };

  const removeFromCart = (productId: number) => {
    const item = items.find((i) => i.productId === productId);
    
    setItems((prev) => prev.filter((item) => item.productId !== productId));
    
    // Track analytics event
    // if (item) {
    //   analytics.removeFromCart({
    //     id: item.productId,
    //     name: item.name,
    //     price: item.price,
    //     quantity: item.quantity,
    //   });
    // }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const updateCartItem = (productId: number, updates: Partial<CartItem>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, ...updates } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateCartItem,
        clearCart,
        itemCount,
        total,
      }}
    >
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

