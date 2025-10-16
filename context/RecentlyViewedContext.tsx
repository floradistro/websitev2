"use client";

import { createContext, useContext, ReactNode } from "react";
import { useRecentlyViewed, RecentlyViewedProduct } from "@/hooks/useRecentlyViewed";

interface RecentlyViewedContextType {
  recentlyViewed: RecentlyViewedProduct[];
  addProduct: (product: Omit<RecentlyViewedProduct, "viewedAt">) => void;
  clearAll: () => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

export function RecentlyViewedProvider({ children }: { children: ReactNode }) {
  const recentlyViewed = useRecentlyViewed();
  
  return (
    <RecentlyViewedContext.Provider value={recentlyViewed}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewedContext() {
  const context = useContext(RecentlyViewedContext);
  if (!context) {
    throw new Error("useRecentlyViewedContext must be used within RecentlyViewedProvider");
  }
  return context;
}

