/**
 * React Hook for Real-Time Inventory Updates
 * Provides live stock updates without page refresh
 */

import { useEffect, useState, useCallback } from "react";
import { logger } from "@/lib/logger";
import { RealtimeInventoryManager, InventoryChangeEvent } from "@/lib/realtime-inventory";

interface InventoryData {
  id: string;
  product_id: string;
  quantity: number;
  stock_status: string;
  location_id?: string;
  low_stock_threshold?: number;
  reserved_quantity?: number;
}

interface UseRealtimeInventoryReturn {
  inventory: InventoryData | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  totalQuantity: number;
  isLowStock: boolean;
}

/**
 * Hook to subscribe to real-time inventory updates for a product
 */
export function useRealtimeInventory(productId: string | null): UseRealtimeInventoryReturn {
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial inventory data
  const fetchInitialInventory = useCallback(async () => {
    if (!productId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/supabase/inventory?product_id=${productId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch inventory");
      }

      const data = await response.json();

      if (data.success && data.inventory && data.inventory.length > 0) {
        // Aggregate all inventory for this product
        const totalQuantity = data.inventory.reduce(
          (sum: number, inv: any) => sum + parseFloat(inv.quantity || 0),
          0,
        );

        // Use the first inventory record as base
        setInventory({
          ...data.inventory[0],
          quantity: totalQuantity,
        });
      }

      setError(null);
    } catch (err: any) {
      logger.error("Error fetching inventory:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!productId || typeof window === "undefined") {
      setLoading(false);
      return;
    }

    // Fetch initial data
    fetchInitialInventory();

    // Set up real-time subscription
    const manager = RealtimeInventoryManager.getInstance();

    const handleInventoryChange = (event: InventoryChangeEvent) => {
      logger.debug("📡 Real-time inventory update received:", event);

      if (event.eventType === "UPDATE" && event.new) {
        setInventory((prev) => {
          if (!prev) return event.new;

          // Merge with existing data
          return {
            ...prev,
            ...event.new,
            quantity: parseFloat(event.new.quantity || prev.quantity),
          };
        });
      } else if (event.eventType === "DELETE") {
        setInventory(null);
      } else if (event.eventType === "INSERT" && event.new) {
        setInventory(event.new);
      }

      setIsConnected(true);
    };

    const channelName = manager.subscribeToProduct(productId, handleInventoryChange);

    // Check connection status
    const checkConnection = setInterval(() => {
      setIsConnected(manager.getConnectionStatus());
    }, 5000);

    // Cleanup
    return () => {
      clearInterval(checkConnection);
      if (channelName) {
        manager.unsubscribe(channelName);
      }
    };
  }, [productId, fetchInitialInventory]);

  // Calculate derived values
  const totalQuantity = inventory ? parseFloat(String(inventory.quantity || 0)) : 0;
  const isLowStock =
    inventory && inventory.low_stock_threshold
      ? totalQuantity <= inventory.low_stock_threshold
      : false;

  return {
    inventory,
    loading,
    error,
    isConnected,
    totalQuantity,
    isLowStock,
  };
}

/**
 * Hook to subscribe to real-time inventory updates for a vendor
 */
export function useVendorRealtimeInventory(vendorId: string | null) {
  const [inventoryUpdates, setInventoryUpdates] = useState<InventoryChangeEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!vendorId || typeof window === "undefined") {
      return;
    }

    const manager = RealtimeInventoryManager.getInstance();

    const handleInventoryChange = (event: InventoryChangeEvent) => {
      logger.debug("📡 Vendor inventory update:", event);

      // Store last 50 updates for reference
      setInventoryUpdates((prev) => {
        const updates = [event, ...prev];
        return updates.slice(0, 50);
      });

      setIsConnected(true);
    };

    const channelName = manager.subscribeToVendor(vendorId, handleInventoryChange);

    // Check connection status
    const checkConnection = setInterval(() => {
      setIsConnected(manager.getConnectionStatus());
    }, 5000);

    // Cleanup
    return () => {
      clearInterval(checkConnection);
      if (channelName) {
        manager.unsubscribe(channelName);
      }
    };
  }, [vendorId]);

  return {
    inventoryUpdates,
    isConnected,
    updateCount: inventoryUpdates.length,
  };
}
