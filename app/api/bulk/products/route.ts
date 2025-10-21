import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * Bulk Products API - Lightning fast product fetching
 * POST /api/bulk/products
 * Body: { ids: string[], include_inventory?: boolean, include_categories?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const { ids, include_inventory = false, include_categories = true } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: ids array required' },
        { status: 400 }
      );
    }

    // Limit to prevent abuse
    if (ids.length > 500) {
      return NextResponse.json(
        { error: 'Maximum 500 products per request' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    
    // Build select query dynamically based on what's needed
    let selectQuery = `
      id,
      name,
      slug,
      sku,
      description,
      short_description,
      type,
      status,
      featured_image,
      image_gallery,
      regular_price,
      sale_price,
      on_sale,
      featured,
      stock_quantity,
      stock_status,
      vendor_id,
      vendor:vendors!vendor_id(id, store_name, slug, status)
    `;

    if (include_categories) {
      selectQuery += `,
        primary_category:categories!primary_category_id(id, name, slug),
        product_categories(
          category:categories(id, name, slug)
        )
      `;
    }

    // Fetch all products in one query
    const { data: products, error } = await supabase
      .from('products')
      .select(selectQuery)
      .in('id', ids)
      .eq('status', 'published');

    if (error) {
      console.error('Bulk products fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Filter out suspended vendors
    const activeProducts = products?.filter((p: any) => 
      !p.vendor || p.vendor.status === 'active'
    ) || [];

    // Optionally fetch inventory in parallel
    let inventoryMap = new Map();
    if (include_inventory && activeProducts.length > 0) {
      const productIds = activeProducts.map((p: any) => p.id);
      const { data: inventory } = await supabase
        .from('inventory')
        .select(`
          product_id,
          location_id,
          quantity,
          available_quantity,
          stock_status
        `)
        .in('product_id', productIds);

      inventory?.forEach(inv => {
        if (!inventoryMap.has(inv.product_id)) {
          inventoryMap.set(inv.product_id, []);
        }
        inventoryMap.get(inv.product_id).push(inv);
      });
    }

    // Enrich products with inventory if requested
    const enrichedProducts = activeProducts.map((product: any) => ({
      ...product,
      ...(include_inventory && { inventory: inventoryMap.get(product.id) || [] })
    }));

    return NextResponse.json({ 
      products: enrichedProducts,
      count: enrichedProducts.length
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
      }
    });
  } catch (error) {
    console.error('Bulk products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Bulk Products with Pagination - Optimized for speed
 * GET /api/bulk/products?page=1&limit=50&category=...&featured=true
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200); // Max 200
    const offset = (page - 1) * limit;
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const vendorId = searchParams.get('vendor_id');

    const supabase = getServiceSupabase();
    
    // Optimized query - only essential fields for lists
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        sku,
        short_description,
        featured_image,
        regular_price,
        sale_price,
        on_sale,
        featured,
        stock_status,
        stock_quantity,
        vendor_id,
        vendor:vendors!vendor_id(id, store_name, slug, status),
        primary_category:categories!primary_category_id(id, name, slug)
      `, { count: 'exact' })
      .eq('status', 'published');

    if (category) {
      query = query.eq('primary_category_id', category);
    }

    if (featured === 'true') {
      query = query.eq('featured', true);
    }

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }

    query = query
      .order('date_created', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Bulk products fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    // Filter out suspended vendors
    const activeProducts = products?.filter((p: any) => 
      !p.vendor || p.vendor.status === 'active'
    ) || [];

    return NextResponse.json({ 
      products: activeProducts,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('Bulk products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

