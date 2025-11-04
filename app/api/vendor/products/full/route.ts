import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';
import { requireVendor } from '@/lib/auth/middleware';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;
export const revalidate = 60; // Cache for 60 seconds

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Use secure middleware to get vendor_id from session
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    // Parse query parameters for pagination and filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 per page
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';

    const supabase = getServiceSupabase();

    console.log(`[Products API] Fetching for vendor: ${vendorId} (page ${page}, limit ${limit})`);

    // Build query
    let query = supabase
      .from('products')
      .select('id, name, sku, regular_price, cost_price, description, status, featured_image_storage, image_gallery_storage, primary_category_id, custom_fields, categories:primary_category_id(name)', { count: 'exact' })
      .eq('vendor_id', vendorId);

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (category && category !== 'all') {
      query = query.eq('categories.name', category);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Fetch products with count
    const productsStart = Date.now();
    const { data: products, error: productsError, count } = await query
      .range(from, to)
      .order('name');

    if (productsError) throw productsError;
    
    console.log(`[Products API] Products fetched in ${Date.now() - productsStart}ms (${products?.length || 0} products)`);

    if (!products || products.length === 0) {
      return NextResponse.json({
        success: true,
        products: [],
        total: count || 0,
        page,
        limit,
        totalPages: 0,
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
    (inventoryRecords || []).forEach((inv: any) => {
      const currentQty = inventoryMap.get(inv.product_id) || 0;
      inventoryMap.set(inv.product_id, currentQty + parseFloat(inv.quantity || '0'));
    });

    // Format products with custom_fields processing
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
        price: parseFloat(product.regular_price) || 0,
        cost_price: product.cost_price ? parseFloat(product.cost_price) : undefined,
        description: product.description || '',
        status: product.status || 'pending',
        total_stock: inventoryMap.get(product.id) || 0, // LIVE inventory from all locations
        custom_fields: product.custom_fields || {}, // Vendors have full autonomy over custom fields
        pricing_tiers: [], // Don't load in list view - load in full editor
        images: images
      };
    });

    const elapsed = Date.now() - startTime;
    const totalPages = count ? Math.ceil(count / limit) : 0;

    console.log(`✅ Products full API loaded in ${elapsed}ms - ${formattedProducts.length} products (page ${page}/${totalPages}), ${inventoryRecords?.length || 0} inventory records`);

    return NextResponse.json({
      success: true,
      products: formattedProducts,
      total: count || 0,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      elapsed_ms: elapsed
    }, {
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
        'X-Response-Time': `${elapsed}ms`,
        'CDN-Cache-Control': 'max-age=60',
        'X-Total-Count': String(count || 0),
        'X-Page': String(page),
        'X-Total-Pages': String(totalPages)
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
