import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const supabase = getServiceSupabase();
    
    // Execute ALL queries in parallel - single round trip to DB
    const [categoriesResult, locationsResult, productsResult] = await Promise.all([
      // Categories
      supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true }),
      
      // Locations
      supabase
        .from('locations')
        .select('*')
        .order('name', { ascending: true }),
      
      // Products with all related data in ONE query
      supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          type,
          status,
          price,
          regular_price,
          sale_price,
          stock_quantity,
          stock_status,
          featured_image_storage,
          image_gallery_storage,
          meta_data,
          blueprint_fields,
          vendor_id,
          created_at,
          product_categories!inner(
            category:categories(id, name, slug)
          ),
          inventory(
            id,
            quantity,
            location_id,
            stock_status,
            location:locations(id, name, city, state)
          )
        `)
        .eq('status', 'published')
        .gt('stock_quantity', 0)
        .order('created_at', { ascending: false })
        .limit(12)
    ]);
    
    // Check for errors
    if (categoriesResult.error) throw categoriesResult.error;
    if (locationsResult.error) throw locationsResult.error;
    if (productsResult.error) throw productsResult.error;
    
    // Map products to expected format
    const products = (productsResult.data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      type: p.type,
      status: p.status,
      price: p.price,
      regular_price: p.regular_price,
      sale_price: p.sale_price,
      stock_quantity: p.stock_quantity,
      stock_status: p.stock_status,
      featured_image_storage: p.featured_image_storage,
      image_gallery_storage: p.image_gallery_storage,
      categories: p.product_categories?.map((pc: any) => pc.category) || [],
      inventory: p.inventory || [],
      blueprint_fields: p.blueprint_fields || [],
      meta_data: p.meta_data || {},
      vendor_id: p.vendor_id,
    }));
    
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      data: {
        categories: categoriesResult.data || [],
        locations: locationsResult.data || [],
        products: products,
      },
      meta: {
        responseTime: `${responseTime}ms`,
        productCount: products.length,
        categoryCount: categoriesResult.data?.length || 0,
        locationCount: locationsResult.data?.length || 0,
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        'X-Response-Time': `${responseTime}ms`,
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error in /api/page-data/home:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch homepage data',
        data: {
          categories: [],
          locations: [],
          products: [],
        }
      },
      { status: 500 }
    );
  }
}

