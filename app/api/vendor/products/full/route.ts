import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 60; // Cache for 60 seconds

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
    
    console.log(`[Products API] Fetching for vendor: ${vendorId}`);
    
    // Fetch products - essential fields only
    const productsStart = Date.now();
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, sku, price, cost_price, description, status')
      .eq('vendor_id', vendorId)
      .order('name');

    if (productsError) throw productsError;
    
    console.log(`[Products API] Products fetched in ${Date.now() - productsStart}ms (${products?.length || 0} products)`);

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        products: [],
        total: 0,
        elapsed_ms: Date.now() - startTime
      });
    }

    const productIds = products.map(p => p.id);

    // Fetch related data in parallel including LIVE inventory
    const relatedStart = Date.now();
    const [categoriesResult, inventoryResult] = await Promise.allSettled([
      supabase
        .from('product_categories')
        .select('product_id, categories(name)')
        .in('product_id', productIds)
        .limit(1000),

      // Query live inventory quantities - only product_id and quantity
      // No need to filter by vendor_id since productIds are already vendor-filtered
      supabase
        .from('inventory')
        .select('product_id, quantity')
        .in('product_id', productIds)
    ]);
    
    console.log(`[Products API] Related data fetched in ${Date.now() - relatedStart}ms`);

    // Extract data from settled promises
    const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value.data || [] : [];
    const inventoryRecords = inventoryResult.status === 'fulfilled' ? inventoryResult.value.data || [] : [];
    
    console.log(`[Products API] Categories: ${categories.length}, Inventory: ${inventoryRecords.length}`);

    // Build maps for fast lookup
    const categoryMap = new Map(
      categories.map((pc: any) => [
        pc.product_id,
        pc.categories?.name || 'Uncategorized'
      ])
    );

    // Build inventory map - sum quantities across all locations per product
    const inventoryMap = new Map<string, number>();
    inventoryRecords.forEach((inv: any) => {
      const currentQty = inventoryMap.get(inv.product_id) || 0;
      inventoryMap.set(inv.product_id, currentQty + parseFloat(inv.quantity || '0'));
    });

    // Format products (no custom fields for speed - catalog doesn't need them in list view)
    const formattedProducts = (products || []).map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku || '',
      category: categoryMap.get(product.id) || 'Uncategorized',
      price: parseFloat(product.price) || 0,
      cost_price: product.cost_price ? parseFloat(product.cost_price) : undefined,
      description: product.description || '',
      status: product.status || 'pending',
      total_stock: inventoryMap.get(product.id) || 0, // LIVE inventory from all locations
      custom_fields: [], // Don't load in list view - load in editor
      pricing_tiers: [], // Don't load in list view - load in full editor
      images: []
    }));

    const elapsed = Date.now() - startTime;
    console.log(`✅ Products full API loaded in ${elapsed}ms - ${formattedProducts.length} products, ${inventoryRecords.length} inventory records`);

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      total: formattedProducts.length,
      elapsed_ms: elapsed
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
        'X-Response-Time': `${elapsed}ms`,
        'CDN-Cache-Control': 'max-age=60'
      }
    });
  } catch (error: any) {
    console.error('Full products API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
