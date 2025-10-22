import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    
    console.log('🔵 Fetching pending products from Supabase...');
    
    // Get all pending products from Supabase
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching pending products:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        pending: []
      }, { status: 500 });
    }

    console.log(`🔵 Found ${products?.length || 0} pending products`);

    // Get vendors separately to avoid relationship issues
    const vendorIds = [...new Set(products?.map(p => p.vendor_id).filter(Boolean) || [])];
    const { data: vendors } = await supabase
      .from('vendors')
      .select('id, store_name')
      .in('id', vendorIds);
    
    const vendorMap = (vendors || []).reduce((acc: any, v: any) => {
      acc[v.id] = v.store_name;
      return acc;
    }, {});

    // Get categories separately
    const categoryIds = [...new Set(products?.map(p => p.primary_category_id).filter(Boolean) || [])];
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .in('id', categoryIds);
    
    const categoryMap = (categories || []).reduce((acc: any, c: any) => {
      acc[c.id] = c.name;
      return acc;
    }, {});

    // Map to expected format for admin UI with full details
    const pendingProducts = (products || []).map((p: any) => {
      const isUpdate = p.updated_at && new Date(p.updated_at) > new Date(p.created_at);
      
      return {
        id: p.id,
        vendor_id: p.vendor_id,
        product_name: p.name,
        store_name: vendorMap[p.vendor_id] || 'Yacht Club',
        status: p.status,
        submitted_date: p.created_at,
        updated_date: p.updated_at,
        is_update: isUpdate,
        
        // Pricing
        price: p.regular_price?.toString() || '',
        sale_price: p.sale_price?.toString() || '',
        sku: p.sku || '',
        
        // Details
        category: categoryMap[p.primary_category_id] || 'Uncategorized',
        description: p.description || p.short_description || '',
        short_description: p.short_description || '',
        product_type: p.type || 'simple',
        
        // Cannabis info
        pricing_mode: p.meta_data?.pricing_mode || 'single',
        thc_percentage: p.meta_data?.thc_percentage || '',
        cbd_percentage: p.meta_data?.cbd_percentage || '',
        strain_type: p.meta_data?.strain_type || '',
        lineage: p.meta_data?.lineage || '',
        terpenes: p.meta_data?.terpenes || '',
        effects: p.meta_data?.effects || '',
        
        // Media
        featured_image: p.featured_image_storage || p.featured_image || '',
        image_urls: p.image_gallery_storage || p.image_gallery || [],
        coa_url: p.meta_data?.coa_url || '',
        
        // Stock
        stock_quantity: p.stock_quantity || 0,
        stock_status: p.stock_status || 'in_stock',
        
        // IDs
        slug: p.slug
      };
    });

    console.log(`✅ Found ${pendingProducts.length} pending products in Supabase`);

    return NextResponse.json({
      success: true,
      pending: pendingProducts,
      count: pendingProducts.length
    });

  } catch (error: any) {
    console.error('Get pending products error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch pending products',
      pending: []
    }, { status: 500 });
  }
}
