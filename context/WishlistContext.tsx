"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import axios from "axios";

interface WishlistItem {
  productId: number;
  name: string;
  price: string;
  image?: string;
  slug?: string;
  dateAdded: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (item: Omit<WishlistItem, 'dateAdded'>) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;
  clearWishlist: () => void;
  itemCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const wishlistKey = user?.id ? `flora-wishlist-${user.id}` : "flora-wishlist";
    const savedWishlist = localStorage.getItem(wishlistKey);
    if (savedWishlist) {
      try {
        setItems(JSON.parse(savedWishlist));
      } catch (error) {
        console.error("Failed to load wishlist:", error);
      }
    }
    setLoaded(true);
  }, [user?.id]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (loaded) {
      const wishlistKey = user?.id ? `flora-wishlist-${user.id}` : "flora-wishlist";
      localStorage.setItem(wishlistKey, JSON.stringify(items));
    }
  }, [items, loaded, user?.id]);

  const addToWishlist = useCallback((item: Omit<WishlistItem, 'dateAdded'>) => {
    setItems((prev) => {
      // Check if already in wishlist
      if (prev.some((i) => i.productId === item.productId)) {
        return prev;
      }
      
      return [...prev, { ...item, dateAdded: new Date().toISOString() }];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: number) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const isInWishlist = useCallback((productId: number) => {
    return items.some((item) => item.productId === productId);
  }, [items]);

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.length;

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        itemCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
