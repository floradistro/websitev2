"use client";

import { useEffect, useState, useCallback, useRef } from "react";

const MAX_RECENTLY_VIEWED = 12;

export interface RecentlyViewedProduct {
  id: number;
  name: string;
  price: string;
  image?: string;
  viewedAt: number;
}

export function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedProduct[]>([]);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Load from localStorage on mount - only once
    if (!isInitialized.current) {
      const stored = localStorage.getItem("recentlyViewed");
      if (stored) {
        try {
          setRecentlyViewed(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to parse recently viewed:", e);
        }
      }
      isInitialized.current = true;
    }
  }, []);

  const addProduct = useCallback((product: Omit<RecentlyViewedProduct, "viewedAt">) => {
    setRecentlyViewed((prev) => {
      // Check if already exists (avoid duplicates)
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev; // Don't add if already in list
      }
      
      // Add to beginning with timestamp
      const updated = [
        { ...product, viewedAt: Date.now() },
        ...prev,
      ].slice(0, MAX_RECENTLY_VIEWED);

      // Save to localStorage
      localStorage.setItem("recentlyViewed", JSON.stringify(updated));
      
      return updated;
    });
  }, []);

  const clearAll = () => {
    setRecentlyViewed([]);
    localStorage.removeItem("recentlyViewed");
  };

  return { recentlyViewed, addProduct, clearAll };
}

