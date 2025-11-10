/**
 * Real-Time Inventory Management System
 * Uses Supabase Realtime for instant inventory updates
 * Amazon/Apple-style live stock tracking
 */

import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import { inventoryCache } from "./cache-manager";

import { logger } from "@/lib/logger";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type InventoryChangeEvent = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  old: any;
  new: any;
  table: string;
};

export type InventoryChangeHandler = (event: InventoryChangeEvent) => void;

/**
 * Manages real-time inventory subscriptions
 * Singleton pattern for connection efficiency
 */
export class RealtimeInventoryManager {
  private static instance: RealtimeInventoryManager | null = null;
  private supabase: any;
  private channels: Map<string, RealtimeChannel> = new Map();
  private handlers: Map<string, Set<InventoryChangeHandler>> = new Map();
  private isConnected: boolean = false;

  constructor() {
    // Only create client on browser side
    if (typeof window !== "undefined") {
      this.supabase = createClient(supabaseUrl, supabaseAnonKey, {
        realtime: {
          params: {
            eventsPerSecond: 10, // Rate limiting
          },
        },
      });
    }
  }

  /**
   * Get singleton instance
   */
  static getInstance(): RealtimeInventoryManager {
    if (!RealtimeInventoryManager.instance) {
      RealtimeInventoryManager.instance = new RealtimeInventoryManager();
    }
    return RealtimeInventoryManager.instance;
  }

  /**
   * Subscribe to inventory changes for a specific product
   */
  subscribeToProduct(productId: string, handler: InventoryChangeHandler): string {
    if (!this.supabase) {
      logger.warn("⚠️  Realtime not available (server-side)");
      return "";
    }

    const channelName = `inventory-product-${productId}`;

    // Store handler
    if (!this.handlers.has(channelName)) {
      this.handlers.set(channelName, new Set());
    }
    this.handlers.get(channelName)!.add(handler);

    // Create channel if it doesn't exist
    if (!this.channels.has(channelName)) {
      const channel = this.supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
            schema: "public",
            table: "inventory",
            filter: `product_id=eq.${productId}`,
          },
          (payload: any) => {
            // Invalidate inventory cache
            inventoryCache.invalidatePattern(`.*product.*${productId}.*`);

            // Notify all handlers
            const handlers = this.handlers.get(channelName);
            if (handlers) {
              const event: InventoryChangeEvent = {
                eventType: payload.eventType,
                old: payload.old,
                new: payload.new,
                table: payload.table,
              };

              handlers.forEach((h) => {
                try {
                  h(event);
                } catch (error) {
                  if (process.env.NODE_ENV === "development") {
                    logger.error("Error in inventory change handler:", error);
                  }
                }
              });
            }
          },
        )
        .subscribe((status: string) => {
          this.isConnected = status === "SUBSCRIBED";
        });

      this.channels.set(channelName, channel);
    }

    return channelName;
  }

  /**
   * Subscribe to all inventory changes for a vendor
   */
  subscribeToVendor(vendorId: string, handler: InventoryChangeHandler): string {
    if (!this.supabase) {
      logger.warn("⚠️  Realtime not available (server-side)");
      return "";
    }

    const channelName = `inventory-vendor-${vendorId}`;

    // Store handler
    if (!this.handlers.has(channelName)) {
      this.handlers.set(channelName, new Set());
    }
    this.handlers.get(channelName)!.add(handler);

    // Create channel if it doesn't exist
    if (!this.channels.has(channelName)) {
      const channel = this.supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "inventory",
            filter: `vendor_id=eq.${vendorId}`,
          },
          (payload: any) => {
            // Invalidate vendor caches
            inventoryCache.invalidatePattern(`.*vendor.*${vendorId}.*`);

            // Notify handlers
            const handlers = this.handlers.get(channelName);
            if (handlers) {
              const event: InventoryChangeEvent = {
                eventType: payload.eventType,
                old: payload.old,
                new: payload.new,
                table: payload.table,
              };

              handlers.forEach((h) => {
                try {
                  h(event);
                } catch (error) {
                  if (process.env.NODE_ENV === "development") {
                    logger.error("Error in vendor inventory handler:", error);
                  }
                }
              });
            }
          },
        )
        .subscribe((status: string) => {});

      this.channels.set(channelName, channel);
    }

    return channelName;
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.handlers.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    this.channels.forEach((channel, name) => {
      this.supabase.removeChannel(channel);
    });
    this.channels.clear();
    this.handlers.clear();
    this.isConnected = false;
  }

  /**
   * Check if real-time is connected
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Get active channels count
   */
  getActiveChannelsCount(): number {
    return this.channels.size;
  }
}

// Export singleton instance for convenience
export const realtimeInventory =
  typeof window !== "undefined" ? RealtimeInventoryManager.getInstance() : null;
