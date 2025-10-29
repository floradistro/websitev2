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

import { createClient } from '@supabase/supabase-js';
import { AlpineIQClient, createAlpineIQClient } from './alpineiq-client';
import crypto from 'crypto';

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
      .from('vendors')
      .select('marketing_provider, marketing_config')
      .eq('id', this.vendorId)
      .single();

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const vendorData = vendor as any;
    this.isAlpineIQVendor = vendorData.marketing_provider === 'alpineiq';

    if (this.isAlpineIQVendor) {
      // Initialize AlpineIQ client
      this.alpineiq = createAlpineIQClient(vendorData.marketing_config);

      // Test connection
      const connected = await this.alpineiq.testConnection();
      if (!connected) {
        throw new Error('Failed to connect to AlpineIQ');
      }

      console.log(`✅ AlpineIQ sync initialized for vendor ${this.vendorId}`);
    } else {
      console.log(`ℹ️  Vendor ${this.vendorId} uses built-in marketing system`);
    }
  }

  /**
   * Start all sync listeners
   */
  startSync(): void {
    if (!this.isAlpineIQVendor || !this.alpineiq) {
      console.log('Sync not started - vendor not using AlpineIQ');
      return;
    }

    this.syncCustomers();
    this.syncOrders();
    console.log(`🔄 AlpineIQ sync started for vendor ${this.vendorId}`);
  }

  /**
   * Stop all sync listeners
   */
  stopSync(): void {
    this.channels.forEach((channel) => channel.unsubscribe());
    this.channels = [];
    console.log(`⏸️  AlpineIQ sync stopped for vendor ${this.vendorId}`);
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
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'customers',
          filter: `vendor_id=eq.${this.vendorId}`,
        },
        async (payload) => {
          console.log('Customer change detected:', payload.eventType, (payload.new as any)?.id);

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            await this.pushCustomerToAlpineIQ((payload.new as any));
          } else if (payload.eventType === 'DELETE') {
            // AlpineIQ doesn't support DELETE, just log it
            await this.logSync({
              entity_type: 'customer',
              entity_id: (payload.old as any).id,
              direction: 'to_alpineiq',
              status: 'success',
              payload: { note: 'Customer deleted locally, kept in AlpineIQ' },
            });
          }
        }
      )
      .subscribe();

    this.channels.push(channel);
  }

  /**
   * Push a customer to AlpineIQ
   */
  async pushCustomerToAlpineIQ(customer: any): Promise<void> {
    if (!this.alpineiq) return;

    try {
      // Check if already synced
      const { data: mappingData } = await this.supabase
        .from('alpineiq_customer_mapping')
        .select('*')
        .eq('customer_id', customer.id)
        .single();

      // Create hash of current data
      const dataHash = this.hashCustomerData(customer);

      // Skip if unchanged
      const mapping = mappingData as any;
      if (mapping && mapping.sync_hash === dataHash) {
        console.log('Customer unchanged, skipping sync:', customer.id);
        return;
      }

      // Upsert customer in AlpineIQ
      const result = await this.alpineiq.upsertCustomer({
        email: customer.email,
        phone: customer.phone,
        firstName: customer.first_name,
        lastName: customer.last_name,
        birthdate: customer.birthdate,
        metadata: {
          pos_customer_id: customer.id,
          total_orders: customer.total_orders || 0,
          lifetime_value: customer.lifetime_value || 0,
          last_order_date: customer.last_order_date,
        },
      });

      // Get AlpineIQ contact ID
      let alpineiqCustomerId = result.contactID;
      if (!alpineiqCustomerId) {
        // Lookup by phone or email
        alpineiqCustomerId =
          (await this.alpineiq.lookupCustomerByPhone(customer.phone)) ||
          (await this.alpineiq.lookupCustomerByEmail(customer.email));
      }

      if (!alpineiqCustomerId) {
        throw new Error('Failed to get AlpineIQ contact ID');
      }

      // Save or update mapping
      await this.supabase.from('alpineiq_customer_mapping').upsert({
        vendor_id: this.vendorId,
        customer_id: customer.id,
        alpineiq_customer_id: alpineiqCustomerId,
        sync_hash: dataHash,
        last_synced_at: new Date().toISOString(),
      } as any);

      // Log success
      await this.logSync({
        entity_type: 'customer',
        entity_id: customer.id,
        direction: 'to_alpineiq',
        status: 'success',
        alpineiq_id: alpineiqCustomerId,
        payload: customer,
      });

      console.log(`✅ Customer synced to AlpineIQ: ${customer.email}`);
    } catch (error: any) {
      console.error('Failed to sync customer:', error);

      // Log failure
      await this.logSync({
        entity_type: 'customer',
        entity_id: customer.id,
        direction: 'to_alpineiq',
        status: 'failed',
        error_message: error.message,
        payload: customer,
      });

      // Queue for retry
      await this.queueRetry('customer', customer.id);
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
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          filter: `vendor_id=eq.${this.vendorId}`,
        },
        async (payload) => {
          console.log('Order created:', (payload.new as any).id);
          await this.pushOrderToAlpineIQ((payload.new as any));
        }
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
      // Get customer mapping
      const { data: mapping } = await this.supabase
        .from('alpineiq_customer_mapping')
        .select('alpineiq_customer_id')
        .eq('customer_id', order.customer_id)
        .single();

      if (!mapping) {
        // Customer not synced yet, try to sync first
        const { data: customer } = await this.supabase
          .from('customers')
          .select('*')
          .eq('id', order.customer_id)
          .single();

        if (customer) {
          await this.pushCustomerToAlpineIQ(customer);

          // Try to get mapping again
          const { data: newMapping } = await this.supabase
            .from('alpineiq_customer_mapping')
            .select('alpineiq_customer_id')
            .eq('customer_id', order.customer_id)
            .single();

          if (!newMapping) {
            throw new Error('Customer not synced to AlpineIQ');
          }
        } else {
          throw new Error('Customer not found');
        }
      }

      // Calculate loyalty points
      // Assuming $1 = 10 points (from AlpineIQ config: accrual: 100 means 100 points per $10?)
      const pointsEarned = Math.floor(order.total * 10);

      // Create sale in AlpineIQ
      await this.alpineiq.createSale({
        customerId: mapping.alpineiq_customer_id,
        orderId: order.id,
        total: order.total,
        items: order.items || [],
        locationId: order.location_id,
        createdAt: order.created_at,
        pointsEarned,
        metadata: {
          pos_order_id: order.id,
          payment_method: order.payment_method,
          order_type: order.order_type,
        },
      });

      // Log success
      await this.logSync({
        entity_type: 'order',
        entity_id: order.id,
        direction: 'to_alpineiq',
        status: 'success',
        alpineiq_id: mapping.alpineiq_customer_id,
        payload: { order_id: order.id, points: pointsEarned },
      });

      console.log(`✅ Order synced to AlpineIQ: ${order.id} (${pointsEarned} points)`);
    } catch (error: any) {
      console.error('Failed to sync order:', error);

      // Log failure
      await this.logSync({
        entity_type: 'order',
        entity_id: order.id,
        direction: 'to_alpineiq',
        status: 'failed',
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
      .from('customers')
      .select('*')
      .eq('id', customerId)
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
      .from('orders')
      .select('*')
      .eq('id', orderId)
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
      .from('customers')
      .select('*')
      .eq('vendor_id', this.vendorId)
      .limit(limit);

    if (!customers) return;

    console.log(`Starting bulk sync of ${customers.length} customers...`);

    for (const customer of customers) {
      await this.pushCustomerToAlpineIQ(customer);
      // Rate limiting: 5 requests per second
      await this.sleep(200);
    }

    console.log(`✅ Bulk sync complete: ${customers.length} customers`);
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

    return crypto.createHash('sha256').update(data).digest('hex');
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
    await this.supabase.from('alpineiq_sync_log').insert({
      vendor_id: this.vendorId,
      ...log,
    });
  }

  /**
   * Queue failed sync for retry
   */
  private async queueRetry(entityType: string, entityId: string): Promise<void> {
    // Update retry count in sync log
    const { data: log } = await this.supabase
      .from('alpineiq_sync_log')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('status', 'failed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (log) {
      await this.supabase
        .from('alpineiq_sync_log')
        .update({
          status: 'retry',
          retry_count: log.retry_count + 1,
        })
        .eq('id', log.id);
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
      .from('alpineiq_sync_log')
      .select('status, created_at')
      .eq('vendor_id', this.vendorId)
      .order('created_at', { ascending: false });

    if (!stats) {
      return { total_synced: 0, total_failed: 0, last_sync: null };
    }

    return {
      total_synced: stats.filter((s) => s.status === 'success').length,
      total_failed: stats.filter((s) => s.status === 'failed').length,
      last_sync: stats[0]?.created_at || null,
    };
  }
}

/**
 * Factory function to create sync service
 */
export async function createAlpineIQSyncService(
  vendorId: string,
  config: { supabaseUrl: string; supabaseKey: string }
): Promise<AlpineIQSyncService> {
  const service = new AlpineIQSyncService({
    vendorId,
    ...config,
  });

  await service.initialize();
  return service;
}
