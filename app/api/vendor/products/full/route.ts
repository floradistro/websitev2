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
    
    // Fetch products - essential fields including images and category
    const productsStart = Date.now();
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, sku, price, cost_price, description, status, featured_image_storage, image_gallery_storage, primary_category_id, categories:primary_category_id(name)')
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

    // Fetch LIVE inventory in parallel
    const relatedStart = Date.now();
    const { data: inventoryRecords } = await supabase
      .from('inventory')
      .select('product_id, quantity')
      .in('product_id', productIds);

    console.log(`[Products API] Related data fetched in ${Date.now() - relatedStart}ms`);
    console.log(`[Products API] Inventory: ${inventoryRecords?.length || 0} records`);

    // Build inventory map - sum quantities across all locations per product
    const inventoryMap = new Map<string, number>();
    inventoryRecords.forEach((inv: any) => {
      const currentQty = inventoryMap.get(inv.product_id) || 0;
      inventoryMap.set(inv.product_id, currentQty + parseFloat(inv.quantity || '0'));
    });

    // Format products (no custom fields for speed - catalog doesn't need them in list view)
    const formattedProducts = (products || []).map((product: any) => {
      // Build images array: featured image first, then gallery images
      const images: string[] = [];

      // Add featured image
      if (product.featured_image_storage) {
        images.push(product.featured_image_storage);
      }

      // Add gallery images if they exist
      if (product.image_gallery_storage && Array.isArray(product.image_gallery_storage)) {
        // Filter out featured image to avoid duplicates
        const additionalImages = product.image_gallery_storage.filter((img: string) => img && img !== product.featured_image_storage);
        images.push(...additionalImages);
      }

      return {
        id: product.id,
        name: product.name,
        sku: product.sku || '',
        category: product.categories?.name || 'Uncategorized', // Get category from primary_category_id relation
        price: parseFloat(product.price) || 0,
        cost_price: product.cost_price ? parseFloat(product.cost_price) : undefined,
        description: product.description || '',
        status: product.status || 'pending',
        total_stock: inventoryMap.get(product.id) || 0, // LIVE inventory from all locations
        custom_fields: [], // Don't load in list view - load in editor
        pricing_tiers: [], // Don't load in list view - load in full editor
        images: images
      };
    });

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
