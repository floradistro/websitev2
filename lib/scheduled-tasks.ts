/**
 * Automated Scheduled Tasks
 * Runs periodic maintenance and monitoring tasks
 * Enterprise automation patterns
 */

import { jobQueue } from './job-queue';
import { productCache, vendorCache, inventoryCache } from './cache-manager';
import { getServiceSupabase } from './supabase/client';

/**
 * Run all scheduled tasks
 * Call this from a cron job or interval
 */
export async function runScheduledTasks(): Promise<void> {
  const startTime = Date.now();

  try {
    // Run tasks in parallel for efficiency
    await Promise.allSettled([
      cleanupExpiredCache(),
      checkLowStockAlerts(),
      generateDailyMetrics(),
      cleanupOldJobs(),
    ]);

    const duration = Date.now() - startTime;
  } catch (error) {
    console.error('❌ Error in scheduled tasks:', error);
  }
}

/**
 * Task 1: Clean up expired cache entries
 * Runs every hour
 */
async function cleanupExpiredCache(): Promise<void> {
  
  try {
    // Cache automatically expires based on TTL
    // This is just for logging/monitoring
    const stats = {
      product: productCache.getStats(),
      vendor: vendorCache.getStats(),
      inventory: inventoryCache.getStats()
    };

    console.log('📊 Cache stats:', {
      product: `${stats.product.size}/${stats.product.max}`,
      vendor: `${stats.vendor.size}/${stats.vendor.max}`,
      inventory: `${stats.inventory.size}/${stats.inventory.max}`
    });

    // Optional: Force clear old caches during off-peak hours
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 4) {
      await jobQueue.enqueue('cleanup-cache', { cacheType: 'all' }, { priority: 5 });
    }
  } catch (error) {
    console.error('❌ Cache cleanup failed:', error);
  }
}

/**
 * Task 2: Check for low stock and send alerts
 * Runs every 30 minutes
 */
async function checkLowStockAlerts(): Promise<void> {
  
  try {
    const supabase = getServiceSupabase();
    
    // Find inventory items below threshold
    const { data: lowStock, error } = await supabase
      .from('inventory')
      .select(`
        id,
        quantity,
        low_stock_threshold,
        product:products(id, name),
        vendor:vendors(id, email, store_name)
      `)
      .lte('quantity', supabase.rpc('quantity_below_threshold'))
      .gt('quantity', 0) // Still has some stock
      .limit(100);

    if (error) {
      console.error('❌ Error fetching low stock:', error);
      return;
    }

    if (!lowStock || lowStock.length === 0) {
      return;
    }


    // Queue email notifications for vendors
    for (const item of lowStock) {
      const product = item.product as any;
      const vendor = item.vendor as any;

      if (vendor?.email && product?.name) {
        await jobQueue.enqueue(
          'send-email',
          {
            to: vendor.email,
            subject: `Low Stock Alert: ${product.name}`,
            html: `
              <h2>Low Stock Alert</h2>
              <p>Your product <strong>${product.name}</strong> is running low on stock.</p>
              <p>Current quantity: <strong>${item.quantity}g</strong></p>
              <p>Threshold: <strong>${item.low_stock_threshold || 10}g</strong></p>
              <p>Please restock soon to avoid running out.</p>
            `,
            productId: product.id,
            vendorId: vendor.id
          },
          { priority: 2 } // High priority
        );
      }
    }

  } catch (error) {
    console.error('❌ Low stock check failed:', error);
  }
}

/**
 * Task 3: Generate daily metrics and reports
 * Runs once per day at midnight
 */
async function generateDailyMetrics(): Promise<void> {
  const hour = new Date().getHours();
  
  // Only run at midnight (0) or 1 AM
  if (hour !== 0 && hour !== 1) {
    return;
  }

  
  try {
    const supabase = getServiceSupabase();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get yesterday's orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total, status')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return;
    }

    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total || '0'), 0) || 0;
    const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;

    console.log('📈 Daily metrics:', {
      date: yesterday.toISOString().split('T')[0],
      totalOrders,
      totalRevenue: `$${totalRevenue.toFixed(2)}`,
      completedOrders,
      completionRate: totalOrders > 0 ? `${((completedOrders / totalOrders) * 100).toFixed(1)}%` : '0%'
    });

    // Queue report generation
    await jobQueue.enqueue(
      'generate-report',
      {
        type: 'daily-sales',
        date: yesterday.toISOString(),
        metrics: {
          totalOrders,
          totalRevenue,
          completedOrders
        }
      },
      { priority: 4 } // Low priority
    );

  } catch (error) {
    console.error('❌ Daily metrics generation failed:', error);
  }
}

/**
 * Task 4: Clean up old completed jobs
 * Runs every 6 hours
 */
async function cleanupOldJobs(): Promise<void> {
  
  try {
    const stats = jobQueue.getStats();
    
    // Clear history if it's getting too large
    if (stats.completed > 500 || stats.failed > 200) {
      jobQueue.clearHistory();
    } else {
    }
  } catch (error) {
    console.error('❌ Job cleanup failed:', error);
  }
}

/**
 * Setup automated task scheduler
 * Call this on server startup
 */
export function setupScheduledTasks(): void {
  if (typeof window !== 'undefined') {
    return;
  }


  // Run immediately on startup
  runScheduledTasks();

  // Schedule tasks every hour
  const intervalMs = 60 * 60 * 1000; // 1 hour
  setInterval(() => {
    runScheduledTasks();
  }, intervalMs);

  console.log(`✅ Scheduled tasks active (interval: ${intervalMs / 1000 / 60} minutes)`);
}

/**
 * Task: Refresh materialized views (if you have any)
 * Runs during off-peak hours
 */
export async function refreshMaterializedViews(): Promise<void> {
  
  try {
    const supabase = getServiceSupabase();
    
    // Call the refresh function (if you have materialized views)
    // const { error } = await supabase.rpc('refresh_materialized_views');
    
    // if (error) {
    //   console.error('❌ Failed to refresh materialized views:', error);
    //   return;
    // }
    
  } catch (error) {
    console.error('❌ Materialized views refresh failed:', error);
  }
}

