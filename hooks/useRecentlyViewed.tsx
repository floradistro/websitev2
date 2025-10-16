"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem("recentlyViewed");
    if (stored) {
      try {
        setRecentlyViewed(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recently viewed:", e);
      }
    }
  }, []);

  const addProduct = (product: Omit<RecentlyViewedProduct, "viewedAt">) => {
    setRecentlyViewed((prev) => {
      // Remove if already exists
      const filtered = prev.filter((p) => p.id !== product.id);
      
      // Add to beginning with timestamp
      const updated = [
        { ...product, viewedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENTLY_VIEWED);

      // Save to localStorage
      localStorage.setItem("recentlyViewed", JSON.stringify(updated));
      
      return updated;
    });
  };

  const clearAll = () => {
    setRecentlyViewed([]);
    localStorage.removeItem("recentlyViewed");
  };

  return { recentlyViewed, addProduct, clearAll };
}

