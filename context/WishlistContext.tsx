"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
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

const consumerKey = "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
const consumerSecret = "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem("flora-wishlist");
    if (savedWishlist) {
      try {
        setItems(JSON.parse(savedWishlist));
      } catch (error) {
        console.error("Failed to load wishlist:", error);
      }
    }
    setLoaded(true);
  }, []);

  // Load wishlist from WordPress when user logs in (only once per user)
  useEffect(() => {
    if (user?.id && loaded) {
      loadWishlistFromWordPress();
    }
  }, [user?.id]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem("flora-wishlist", JSON.stringify(items));
        
        // Debounced sync to WordPress (only if user is logged in)
        if (user?.id && !syncing) {
          const timeoutId = setTimeout(() => {
            syncWishlistToWordPress();
          }, 1000); // Wait 1 second before syncing
          
          return () => clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error("Failed to save wishlist:", error);
      }
    }
  }, [items, user?.id]);

  const loadWishlistFromWordPress = async () => {
    if (!user?.id) return;

    try {
      const response = await axios.get(`/api/wp-proxy`, {
        params: {
          path: `/wp-json/wc/v3/customers/${user.id}`,
          consumer_key: consumerKey,
          consumer_secret: consumerSecret,
        }
      });

      const meta = response.data.meta_data || [];
      const wishlistMeta = meta.find((m: any) => m.key === 'flora_wishlist');
      
      if (wishlistMeta && wishlistMeta.value) {
        try {
          const serverWishlist = typeof wishlistMeta.value === 'string' 
            ? JSON.parse(wishlistMeta.value) 
            : wishlistMeta.value;
          
          if (Array.isArray(serverWishlist) && serverWishlist.length > 0) {
            setItems(serverWishlist);
          }
        } catch (e) {
          console.error("Error parsing wishlist from WordPress:", e);
        }
      }
    } catch (error) {
      console.error("Error loading wishlist from WordPress:", error);
    }
  };

  const syncWishlistToWordPress = async () => {
    if (!user?.id || syncing) return;

    try {
      setSyncing(true);
      
      await axios.put(
        `/api/wp-proxy?path=/wp-json/wc/v3/customers/${user.id}&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`,
        {
          meta_data: [
            {
              key: 'flora_wishlist',
              value: JSON.stringify(items)
            }
          ]
        }
      );
    } catch (error) {
      console.error("Error syncing wishlist to WordPress:", error);
    } finally {
      setSyncing(false);
    }
  };

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
