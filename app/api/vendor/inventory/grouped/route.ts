import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 30; // Cache for 30 seconds (inventory changes frequently)

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID required' },
        { status: 401 }
      );
    }
    
    const supabase = getServiceSupabase();
    
    // Optimized: Fetch only what we need in parallel
    const [inventoryResult, locationsResult] = await Promise.all([
      // Get inventory with minimal data
      supabase
        .from('inventory')
        .select('id, product_id, quantity, location_id')
        .eq('vendor_id', vendorId),
      
      // Get locations (small dataset)
      supabase
        .from('locations')
        .select('id, name, is_primary')
        .eq('vendor_id', vendorId)
        .eq('is_active', true)
    ]);

    const inventory = inventoryResult.data || [];
    const locations = locationsResult.data || [];
    
    // Get unique product IDs from inventory
    const productIds = [...new Set(inventory.map(inv => inv.product_id))];
    
    // Fetch products only for those in inventory (faster)
    const { data: products } = await supabase
      .from('products')
      .select('id, name, sku, price, cost_price, primary_category:categories!primary_category_id(name)')
      .in('id', productIds)
      .eq('vendor_id', vendorId);

    // Build location map for fast lookup
    const locationMap = new Map(locations.map(l => [l.id, l.name]));

    // Group inventory by product
    const inventoryByProduct = new Map<string, any[]>();
    inventory.forEach(inv => {
      if (!inventoryByProduct.has(inv.product_id)) {
        inventoryByProduct.set(inv.product_id, []);
      }
      inventoryByProduct.get(inv.product_id)!.push(inv);
    });

    // Build grouped products (fast, no loops in loops)
    const groupedProducts = (products || []).map(product => {
      const productInventory = inventoryByProduct.get(product.id) || [];
      
      const total_quantity = productInventory.reduce(
        (sum, inv) => sum + (parseFloat(inv.quantity) || 0), 
        0
      );

      // CRITICAL FIX: Only include locations with quantity > 0
      const locationInventory = productInventory
        .filter(inv => parseFloat(inv.quantity) > 0)
        .map(inv => ({
          inventory_id: inv.id.toString(),
          location_id: inv.location_id,
          location_name: locationMap.get(inv.location_id) || 'Unknown',
          quantity: parseFloat(inv.quantity) || 0
        }));

      return {
        product_id: product.id,
        product_name: product.name,
        sku: product.sku || '',
        category: (product.primary_category as any)?.name || 'Uncategorized',
        price: parseFloat(product.price) || 0,
        cost_price: product.cost_price ? parseFloat(product.cost_price) : undefined,
        total_quantity,
        locations: locationInventory
      };
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ Grouped inventory loaded in ${elapsed}ms - ${groupedProducts.length} products`);

    return NextResponse.json({
      success: true,
      products: groupedProducts,
      locations: locations || [],
      total: groupedProducts.length,
      elapsed_ms: elapsed
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
        'X-Response-Time': `${elapsed}ms`,
        'CDN-Cache-Control': 'max-age=30'
      }
    });
  } catch (error: any) {
    console.error('Grouped inventory API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
