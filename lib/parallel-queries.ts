import { getServiceSupabase } from '@/lib/supabase/client';
import { vendorCache, generateCacheKey } from '@/lib/cache-manager';

/**
 * Fetch all vendor dashboard data in parallel
 * Amazon-style parallel query execution
 * Expected: 70% faster than sequential queries
 */
export async function getVendorDashboardData(vendorId: string) {
  // Check cache first
  const cacheKey = generateCacheKey('vendor-dashboard', { vendorId });
  const cached = vendorCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = getServiceSupabase();
  
  // Execute ALL queries in parallel using Promise.allSettled
  // allSettled ensures all queries complete even if some fail
  const [
    productsResult,
    inventoryResult,
    ordersResult,
    statsResult,
  ] = await Promise.allSettled([
    // Products - recent 50
    supabase
      .from('products')
      .select('id, name, status, stock_quantity, price, image_urls, created_at')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(50),
    
    // Inventory - all locations
    supabase
      .from('inventory')
      .select(`
        id, 
        product_id, 
        quantity, 
        stock_status,
        reserved_quantity,
        low_stock_threshold,
        location:locations(id, name, city)
      `)
      .eq('vendor_id', vendorId),
    
    // Recent orders (30 days)
    supabase
      .from('orders')
      .select(`
        id,
        total,
        status,
        created_at,
        order_items!inner(vendor_id, product_id, quantity, price)
      `)
      .eq('order_items.vendor_id', vendorId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100),
    
    // Aggregate stats - total products, total sales, pending approvals
    supabase
      .from('products')
      .select('id, status, stock_quantity, price', { count: 'exact' })
      .eq('vendor_id', vendorId),
  ]);
  
  // Handle results gracefully - even if some queries fail, we return partial data
  const result = {
    products: productsResult.status === 'fulfilled' ? productsResult.value.data || [] : [],
    inventory: inventoryResult.status === 'fulfilled' ? inventoryResult.value.data || [] : [],
    orders: ordersResult.status === 'fulfilled' ? ordersResult.value.data || [] : [],
    stats: statsResult.status === 'fulfilled' ? calculateStats(statsResult.value.data || []) : {},
    errors: [
      productsResult.status === 'rejected' ? { type: 'products', reason: productsResult.reason } : null,
      inventoryResult.status === 'rejected' ? { type: 'inventory', reason: inventoryResult.reason } : null,
      ordersResult.status === 'rejected' ? { type: 'orders', reason: ordersResult.reason } : null,
      statsResult.status === 'rejected' ? { type: 'stats', reason: statsResult.reason } : null,
    ].filter(Boolean)
  };

  // Cache the result
  vendorCache.set(cacheKey, result);

  return result;
}

/**
 * Calculate vendor statistics from products data
 */
function calculateStats(products: any[]): {
  totalProducts: number;
  publishedProducts: number;
  pendingProducts: number;
  totalValue: number;
  lowStockCount: number;
} {
  const stats = {
    totalProducts: products.length,
    publishedProducts: 0,
    pendingProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
  };

  for (const product of products) {
    if (product.status === 'published') {
      stats.publishedProducts++;
    }
    if (product.status === 'pending') {
      stats.pendingProducts++;
    }
    if (product.stock_quantity && product.price) {
      stats.totalValue += product.stock_quantity * product.price;
    }
    if (product.stock_quantity <= 10) {
      stats.lowStockCount++;
    }
  }

  return stats;
}

/**
 * Fetch vendor products with smart caching
 */
export async function getVendorProducts(vendorId: string, options: {
  status?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const cacheKey = generateCacheKey('vendor-products', { vendorId, ...options });
  const cached = vendorCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = getServiceSupabase();
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('vendor_id', vendorId);

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, count, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching vendor products:', error);
    throw error;
  }

  const result = { data: data || [], count: count || 0 };
  vendorCache.set(cacheKey, result);

  return result;
}

/**
 * Fetch vendor inventory across all locations
 */
export async function getVendorInventory(vendorId: string) {
  const cacheKey = generateCacheKey('vendor-inventory', { vendorId });
  const cached = vendorCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      *,
      product:products(id, name, image_urls),
      location:locations(id, name, city)
    `)
    .eq('vendor_id', vendorId);

  if (error) {
    console.error('Error fetching vendor inventory:', error);
    throw error;
  }

  vendorCache.set(cacheKey, data || []);
  return data || [];
}

