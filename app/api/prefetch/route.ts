import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

/**
 * Prefetch API - Load all essential data in one request
 * GET /api/prefetch?include=categories,vendors,featured
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include')?.split(',') || ['categories', 'featured'];

    const supabase = getServiceSupabase();
    const data: any = {};

    // Build parallel queries
    const queries: Promise<any>[] = [];

    // Categories
    if (include.includes('categories')) {
      queries.push(
        supabase
          .from('categories')
          .select('id, name, slug, image_url, parent_id, menu_order, is_featured')
          .is('parent_id', null)
          .order('menu_order')
          .limit(20)
          .then(result => ({ categories: result.data || [] }))
      );
    }

    // Featured products
    if (include.includes('featured')) {
      queries.push(
        supabase
          .from('products')
          .select(`
            id,
            name,
            slug,
            featured_image,
            regular_price,
            sale_price,
            on_sale,
            stock_status,
            vendor:vendors!vendor_id(id, store_name, slug, status)
          `)
          .eq('status', 'published')
          .eq('featured', true)
          .limit(12)
          .then(result => ({ 
            featured: result.data?.filter((p: any) => 
              !p.vendor || p.vendor.status === 'active'
            ) || [] 
          }))
      );
    }

    // Active vendors
    if (include.includes('vendors')) {
      queries.push(
        supabase
          .from('vendors')
          .select('id, store_name, slug, logo_url, description')
          .eq('status', 'active')
          .limit(20)
          .then(result => ({ vendors: result.data || [] }))
      );
    }

    // New arrivals
    if (include.includes('new')) {
      queries.push(
        supabase
          .from('products')
          .select(`
            id,
            name,
            slug,
            featured_image,
            regular_price,
            sale_price,
            on_sale,
            vendor:vendors!vendor_id(id, store_name, slug, status)
          `)
          .eq('status', 'published')
          .order('date_created', { ascending: false })
          .limit(12)
          .then(result => ({ 
            new_arrivals: result.data?.filter((p: any) => 
              !p.vendor || p.vendor.status === 'active'
            ) || [] 
          }))
      );
    }

    // Execute all queries in parallel
    const results = await Promise.allSettled(queries);

    // Merge results
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        Object.assign(data, result.value);
      }
    });

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=120',
      }
    });
  } catch (error: any) {
    console.error('Prefetch error:', error);
    return NextResponse.json(
      { error: 'Failed to prefetch data' },
      { status: 500 }
    );
  }
}

