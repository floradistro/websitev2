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

const consumerKey = "ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5";
const consumerSecret = "cs_38194e74c7ddc5d72b6c32c70485728e7e529678";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadedFromWordPress, setLoadedFromWordPress] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    if (user?.id && loaded && !loadedFromWordPress) {
      loadWishlistFromWordPress();
    }
  }, [user?.id, loaded]);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (loaded) {
      localStorage.setItem("flora-wishlist", JSON.stringify(items));
    }
  }, [items, loaded]);

  const loadWishlistFromWordPress = async () => {
    if (!user?.id || loadedFromWordPress) return;

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
      
      setLoadedFromWordPress(true);
    } catch (error) {
      console.error("Error loading wishlist from WordPress:", error);
      setLoadedFromWordPress(true);
    }
  };

  const syncWishlistToWordPress = async () => {
    if (!user?.id || !loadedFromWordPress) return;

    try {
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
    }
  };

  const addToWishlist = useCallback((item: Omit<WishlistItem, 'dateAdded'>) => {
    setItems((prev) => {
      // Check if already in wishlist
      if (prev.some((i) => i.productId === item.productId)) {
        return prev;
      }
      
      const newItems = [...prev, { ...item, dateAdded: new Date().toISOString() }];
      
      // Sync to WordPress after state update (debounced)
      if (user?.id && loadedFromWordPress) {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        syncTimeoutRef.current = setTimeout(() => {
          axios.put(
            `/api/wp-proxy?path=/wp-json/wc/v3/customers/${user.id}&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`,
            { meta_data: [{ key: 'flora_wishlist', value: JSON.stringify(newItems) }] }
          ).catch(e => console.error('Wishlist sync error:', e));
        }, 1000);
      }
      
      return newItems;
    });
  }, [user?.id, loadedFromWordPress]);

  const removeFromWishlist = useCallback((productId: number) => {
    setItems((prev) => {
      const newItems = prev.filter((item) => item.productId !== productId);
      
      // Sync to WordPress after state update (debounced)
      if (user?.id && loadedFromWordPress) {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
        }
        syncTimeoutRef.current = setTimeout(() => {
          axios.put(
            `/api/wp-proxy?path=/wp-json/wc/v3/customers/${user.id}&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`,
            { meta_data: [{ key: 'flora_wishlist', value: JSON.stringify(newItems) }] }
          ).catch(e => console.error('Wishlist sync error:', e));
        }, 1000);
      }
      
      return newItems;
    });
  }, [user?.id, loadedFromWordPress]);

  const isInWishlist = useCallback((productId: number) => {
    return items.some((item) => item.productId === productId);
  }, [items]);

  const clearWishlist = useCallback(() => {
    setItems([]);
    
    // Sync to WordPress (debounced)
    if (user?.id && loadedFromWordPress) {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      syncTimeoutRef.current = setTimeout(() => {
        axios.put(
          `/api/wp-proxy?path=/wp-json/wc/v3/customers/${user.id}&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`,
          { meta_data: [{ key: 'flora_wishlist', value: JSON.stringify([]) }] }
        ).catch(e => console.error('Wishlist sync error:', e));
      }, 1000);
    }
  }, [user?.id, loadedFromWordPress]);

  const itemCount = items.length;

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

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
