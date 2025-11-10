// @ts-nocheck
/**
 * AlpineIQ Sync Service
 * Bidirectional sync between our system and AlpineIQ
 *
 * Features:
 * - Real-time customer sync (POS → AlpineIQ)
 * - Order sync for loyalty points
 * - Campaign event tracking (AlpineIQ → Our system)
 * - Automatic retry on failure
 * - Change detection to avoid unnecessary syncs
 */

import { createClient } from "@supabase/supabase-js";
import { AlpineIQClient, createAlpineIQClient } from "./alpineiq-client";
import crypto from "crypto";

export interface SyncServiceConfig {
  vendorId: string;
  supabaseUrl: string;
  supabaseKey: string;
}

export class AlpineIQSyncService {
  private vendorId: string;
  private supabase: ReturnType<typeof createClient>;
  private alpineiq: AlpineIQClient | null = null;
  private channels: any[] = [];
  private isAlpineIQVendor = false;

  constructor(config: SyncServiceConfig) {
    this.vendorId = config.vendorId;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  /**
   * Initialize sync service
   */
  async initialize(): Promise<void> {
    // Check if vendor uses AlpineIQ
    const { data: vendor } = await this.supabase
      .from("vendors")
      .select("marketing_provider, marketing_config")
      .eq("id", this.vendorId)
      .single();

    if (!vendor) {
      throw new Error("Vendor not found");
    }

    const vendorData = vendor as any;
    this.isAlpineIQVendor = vendorData.marketing_provider === "alpineiq";

    if (this.isAlpineIQVendor) {
      // Initialize AlpineIQ client
      this.alpineiq = createAlpineIQClient(vendorData.marketing_config);

      // Test connection
      const connected = await this.alpineiq.testConnection();
      if (!connected) {
        throw new Error("Failed to connect to AlpineIQ");
      }
    } else {
    }
  }

  /**
   * Start all sync listeners
   */
  startSync(): void {
    if (!this.isAlpineIQVendor || !this.alpineiq) {
      return;
    }

    this.syncCustomers();
    this.syncOrders();
  }

  /**
   * Stop all sync listeners
   */
  stopSync(): void {
    this.channels.forEach((channel) => channel.unsubscribe());
    this.channels = [];
  }

  // ----------------------------------------------------------------------------
  // CUSTOMER SYNC (Your System → AlpineIQ)
  // ----------------------------------------------------------------------------

  /**
   * Listen for customer changes and sync to AlpineIQ
   */
  private syncCustomers(): void {
    const channel = this.supabase
      .channel(`alpineiq_customers_${this.vendorId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "customers",
          filter: `vendor_id=eq.${this.vendorId}`,
        },
        async (payload) => {
          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            await this.pushCustomerToAlpineIQ(payload.new as any);
          } else if (payload.eventType === "DELETE") {
            // AlpineIQ doesn't support DELETE, just log it
            await this.logSync({
              entity_type: "customer",
              entity_id: (payload.old as any).id,
              direction: "to_alpineiq",
              status: "success",
              payload: { note: "Customer deleted locally, kept in AlpineIQ" },
            });
          }
        },
      )
      .subscribe();

    this.channels.push(channel);
  }

  /**
   * Push a customer to AlpineIQ loyalty program
   */
  async pushCustomerToAlpineIQ(customer: any): Promise<void> {
    if (!this.alpineiq) return;

    try {
      // Check if already synced
      const { data: mappingData } = await this.supabase
        .from("alpineiq_customer_mapping")
        .select("*")
        .eq("customer_id", customer.id)
        .single();

      // Create hash of current data
      const dataHash = this.hashCustomerData(customer);

      // Skip if unchanged
      const mapping = mappingData as any;
      if (mapping && mapping.sync_hash === dataHash) {
        return;
      }

      // Sign up customer for loyalty using correct endpoint
      const result = await this.alpineiq.signupLoyaltyMember({
        email: customer.email,
        mobilePhone: customer.phone,
        firstName: customer.first_name || undefined,
        lastName: customer.last_name || undefined,
        address: customer.address || undefined,
        favoriteStore: undefined,
      });

      // Get AlpineIQ contact ID from result
      const alpineiqCustomerId = result.contactID;

      if (!alpineiqCustomerId) {
        throw new Error("Failed to get AlpineIQ contact ID from signup");
      }

      // Save or update mapping
      await this.supabase.from("alpineiq_customer_mapping").upsert({
        vendor_id: this.vendorId,
        customer_id: customer.id,
        alpineiq_customer_id: alpineiqCustomerId,
        sync_hash: dataHash,
        last_synced_at: new Date().toISOString(),
      } as any);

      // Log success
      await this.logSync({
        entity_type: "customer",
        entity_id: customer.id,
        direction: "to_alpineiq",
        status: "success",
        alpineiq_id: alpineiqCustomerId,
        payload: customer,
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to sync customer:", error);
      }
      // Log failure
      await this.logSync({
        entity_type: "customer",
        entity_id: customer.id,
        direction: "to_alpineiq",
        status: "failed",
        error_message: error.message,
        payload: customer,
      });

      // Queue for retry
      await this.queueRetry("customer", customer.id);
    }
  }

  // ----------------------------------------------------------------------------
  // ORDER SYNC (Your System → AlpineIQ for Loyalty Points)
  // ----------------------------------------------------------------------------

  /**
   * Listen for order changes and sync to AlpineIQ
   */
  private syncOrders(): void {
    const channel = this.supabase
      .channel(`alpineiq_orders_${this.vendorId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `vendor_id=eq.${this.vendorId}`,
        },
        async (payload) => {
          await this.pushOrderToAlpineIQ(payload.new as any);
        },
      )
      .subscribe();

    this.channels.push(channel);
  }

  /**
   * Push an order to AlpineIQ for loyalty points
   */
  async pushOrderToAlpineIQ(order: any): Promise<void> {
    if (!this.alpineiq) return;

    try {
      // Get customer info
      const { data: customer } = await this.supabase
        .from("customers")
        .select("*")
        .eq("id", order.customer_id)
        .single();

      if (!customer) {
        throw new Error("Customer not found");
      }

      // Get order items with product details
      const { data: orderItems } = await this.supabase
        .from("order_items")
        .select(
          `
          *,
          products (
            name,
            sku,
            category,
            brand,
            cannabis_type,
            thc_percentage,
            cbd_percentage
          )
        `,
        )
        .eq("order_id", order.id);

      // Format items for Alpine IQ
      const items = (orderItems || []).map((item: any) => ({
        sku: item.products?.sku || item.product_id || "UNKNOWN",
        size: item.variant_name || "",
        category: item.products?.category || "MISC",
        subcategory: item.products?.subcategory || "",
        brand: item.products?.brand || "",
        name: item.products?.name || item.product_name || "Product",
        strain: item.products?.strain || "",
        grade: "A",
        species: item.products?.cannabis_type || item.products?.species || "",
        price: parseFloat(item.unit_price || 0),
        discount: parseFloat(item.discount_amount || 0),
        quantity: parseInt(item.quantity || 1),
        customAttributes: item.products?.thc_percentage
          ? [
              {
                key: "THC",
                value: `${item.products.thc_percentage}%`,
              },
            ]
          : [],
      }));

      // Get location name
      const { data: location } = await this.supabase
        .from("locations")
        .select("name")
        .eq("id", order.location_id)
        .single();

      // Format transaction date (Alpine IQ format: 'YYYY-MM-DD HH:mm:ss +0000')
      const transactionDate =
        new Date(order.created_at)
          .toISOString()
          .replace("T", " ")
          .split(".")[0] + " +0000";

      // Create sale in AlpineIQ with correct format
      await this.alpineiq.createSale({
        member: {
          email: customer.email,
          mobilePhone: customer.phone || undefined,
          firstName: customer.first_name || undefined,
          lastName: customer.last_name || undefined,
        },
        visit: {
          pos_id: order.id,
          pos_user: customer.email,
          pos_type: order.order_type === "delivery" ? "online" : "in-store",
          transaction_date: transactionDate,
          location: location?.name || "Main Store",
          budtenderName: order.employee_name,
          budtenderID: order.employee_id,
          visit_details_attributes: items,
          transaction_total: parseFloat(order.total),
          send_notification: false,
        },
      });

      // Log success
      await this.logSync({
        entity_type: "order",
        entity_id: order.id,
        direction: "to_alpineiq",
        status: "success",
        payload: {
          order_id: order.id,
          total: order.total,
          items: items.length,
        },
      });
    } catch (error: any) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to sync order:", error);
      }
      // Log failure
      await this.logSync({
        entity_type: "order",
        entity_id: order.id,
        direction: "to_alpineiq",
        status: "failed",
        error_message: error.message,
        payload: order,
      });
    }
  }

  // ----------------------------------------------------------------------------
  // MANUAL SYNC METHODS
  // ----------------------------------------------------------------------------

  /**
   * Manually sync a customer to AlpineIQ
   */
  async syncCustomer(customerId: string): Promise<void> {
    const { data: customer } = await this.supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();

    if (customer) {
      await this.pushCustomerToAlpineIQ(customer);
    }
  }

  /**
   * Manually sync an order to AlpineIQ
   */
  async syncOrder(orderId: string): Promise<void> {
    const { data: order } = await this.supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (order) {
      await this.pushOrderToAlpineIQ(order);
    }
  }

  /**
   * Bulk sync all customers
   */
  async bulkSyncCustomers(limit = 100): Promise<void> {
    const { data: customers } = await this.supabase
      .from("customers")
      .select("*")
      .eq("vendor_id", this.vendorId)
      .limit(limit);

    if (!customers) return;

    for (const customer of customers) {
      await this.pushCustomerToAlpineIQ(customer);
      // Rate limiting: 5 requests per second
      await this.sleep(200);
    }
  }

  // ----------------------------------------------------------------------------
  // UTILITY METHODS
  // ----------------------------------------------------------------------------

  /**
   * Create hash of customer data to detect changes
   */
  private hashCustomerData(customer: any): string {
    const data = JSON.stringify({
      email: customer.email,
      phone: customer.phone,
      first_name: customer.first_name,
      last_name: customer.last_name,
      birthdate: customer.birthdate,
    });

    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Log sync operation
   */
  private async logSync(log: {
    entity_type: string;
    entity_id: string;
    direction: string;
    status: string;
    alpineiq_id?: string;
    error_message?: string;
    payload?: any;
  }): Promise<void> {
    await this.supabase.from("alpineiq_sync_log").insert({
      vendor_id: this.vendorId,
      ...log,
    });
  }

  /**
   * Queue failed sync for retry
   */
  private async queueRetry(
    entityType: string,
    entityId: string,
  ): Promise<void> {
    // Update retry count in sync log
    const { data: log } = await this.supabase
      .from("alpineiq_sync_log")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (log) {
      await this.supabase
        .from("alpineiq_sync_log")
        .update({
          status: "retry",
          retry_count: log.retry_count + 1,
        })
        .eq("id", log.id);
    }

    // TODO: Implement exponential backoff retry logic with job queue
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get sync statistics
   */
  async getSyncStats(): Promise<{
    total_synced: number;
    total_failed: number;
    last_sync: string | null;
  }> {
    const { data: stats } = await this.supabase
      .from("alpineiq_sync_log")
      .select("status, created_at")
      .eq("vendor_id", this.vendorId)
      .order("created_at", { ascending: false });

    if (!stats) {
      return { total_synced: 0, total_failed: 0, last_sync: null };
    }

    return {
      total_synced: stats.filter((s) => s.status === "success").length,
      total_failed: stats.filter((s) => s.status === "failed").length,
      last_sync: stats[0]?.created_at || null,
    };
  }
}

/**
 * Factory function to create sync service
 */
export async function createAlpineIQSyncService(
  vendorId: string,
  config: { supabaseUrl: string; supabaseKey: string },
): Promise<AlpineIQSyncService> {
  const service = new AlpineIQSyncService({
    vendorId,
    ...config,
  });

  await service.initialize();
  return service;
}
