import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Filters
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const status = searchParams.get('status') || 'published';
    const featured = searchParams.get('featured');
    const onSale = searchParams.get('on_sale');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const vendorId = searchParams.get('vendor_id');
    const wordpressId = searchParams.get('wordpress_id');
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    const offset = (page - 1) * perPage;
    
    // Sorting
    const orderBy = searchParams.get('orderby') || 'date_created';
    const order = searchParams.get('order') || 'desc';
    
    const supabase = getServiceSupabase();
    
    // Build query - LEFT JOIN categories (not inner) to include products without category relationships
    let query = supabase
      .from('products')
      .select(`
        *,
        primary_category:categories!primary_category_id(id, name, slug),
        vendor:vendors!vendor_id(id, store_name, slug, status),
        product_categories(
          category:categories(id, name, slug)
        )
      `, { count: 'exact' });
    
    // Status filter - default to published only
    if (status) {
      query = query.eq('status', status);
    } else {
      query = query.eq('status', 'published');
    }
    
    // Category filter - use primary_category_id instead of junction table
    if (category) {
      query = query.eq('primary_category_id', category);
    }
    
    // Search filter (full-text search)
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
    }
    
    // Featured filter
    if (featured === 'true') {
      query = query.eq('featured', true);
    }
    
    // On sale filter
    if (onSale === 'true') {
      query = query.eq('on_sale', true);
    }
    
    // Price range
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }
    
    // Vendor filter
    if (vendorId) {
      console.log('🔵 Filtering products by vendor_id:', vendorId);
      query = query.eq('vendor_id', vendorId);
    }
    
    // WordPress ID filter (for backward compatibility)
    if (wordpressId) {
      query = query.eq('wordpress_id', parseInt(wordpressId));
    }
    
    // Sorting
    const orderColumn = orderBy === 'price' ? 'price' : 
                       orderBy === 'name' ? 'name' : 
                       orderBy === 'popularity' ? 'sales_count' : 
                       orderBy === 'rating' ? 'average_rating' : 
                       'date_created';
    
    query = query.order(orderColumn, { ascending: order === 'asc' });
    
    // Pagination
    query = query.range(offset, offset + perPage - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // CRITICAL: Filter out products from suspended vendors
    const activeProducts = data?.filter((p: any) => {
      // If product has NO vendor_id, it's a house product - always show
      if (!p.vendor_id) {
        return true;
      }
      // If product has vendor, check vendor is active
      if (p.vendor && p.vendor.status) {
        return p.vendor.status === 'active';
      }
      // If vendor data is missing but vendor_id exists, hide it (data integrity issue)
      return false;
    }) || [];
    
    console.log(`✅ Products query: ${data?.length || 0} total, ${activeProducts.length} active (filtered out suspended vendors)`);
    
    return NextResponse.json({
      success: true,
      products: activeProducts,
      pagination: {
        page,
        per_page: perPage,
        total: activeProducts.length,
        total_pages: Math.ceil(activeProducts.length / perPage)
      }
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
      }
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    const {
      name,
      slug,
      description,
      short_description,
      sku,
      type = 'simple',
      status = 'draft',
      regular_price,
      sale_price,
      category_ids = [],
      featured_image,
      image_gallery = [],
      attributes = {},
      blueprint_fields = [],
      manage_stock = true,
      stock_quantity,
      stock_status = 'instock',
      weight,
      length,
      width,
      height,
      featured = false,
      meta_data = {}
    } = body;
    
    if (!name || !slug) {
      return NextResponse.json({ 
        error: 'Missing required fields: name, slug' 
      }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();
    
    // Create product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name,
        slug,
        description,
        short_description,
        sku,
        type,
        status,
        regular_price: regular_price ? parseFloat(regular_price) : null,
        sale_price: sale_price ? parseFloat(sale_price) : null,
        vendor_id: vendorId,
        primary_category_id: category_ids[0] || null,
        featured_image,
        image_gallery,
        attributes,
        blueprint_fields,
        manage_stock,
        stock_quantity: stock_quantity ? parseFloat(stock_quantity) : null,
        stock_status,
        weight: weight ? parseFloat(weight) : null,
        length: length ? parseFloat(length) : null,
        width: width ? parseFloat(width) : null,
        height: height ? parseFloat(height) : null,
        featured,
        meta_data
      })
      .select()
      .single();
    
    if (productError) {
      console.error('Error creating product:', productError);
      return NextResponse.json({ error: productError.message }, { status: 500 });
    }
    
    // Link to categories
    if (category_ids.length > 0 && product) {
      const categoryLinks = category_ids.map((catId: string, index: number) => ({
        product_id: product.id,
        category_id: catId,
        is_primary: index === 0
      }));
      
      await supabase
        .from('product_categories')
        .insert(categoryLinks);
    }
    
    return NextResponse.json({
      success: true,
      product
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

