import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    
    // Get products with all relationships
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        primary_category:categories!primary_category_id(id, name, slug),
        vendor:vendors!vendor_id(id, store_name, slug, status)
      `)
      .eq('status', 'published')
      .limit(10);
    
    if (error) {
      return NextResponse.json({
        error: error.message,
        details: error
      }, { status: 500 });
    }
    
    // Filter active vendors
    const activeProducts = products?.filter((p: any) => {
      if (!p.vendor_id) return true;
      if (p.vendor && p.vendor.status) {
        return p.vendor.status === 'active';
      }
      return false;
    }) || [];
    
    return NextResponse.json({
      success: true,
      totalFromDB: products?.length || 0,
      afterVendorFilter: activeProducts.length,
      sampleProducts: activeProducts.slice(0, 5).map((p: any) => ({
        id: p.id,
        wordpress_id: p.wordpress_id,
        name: p.name,
        vendor_id: p.vendor_id,
        vendor_name: p.vendor?.store_name || 'No Vendor',
        stock_quantity: p.stock_quantity,
        stock_status: p.stock_status,
        status: p.status,
        featured_image_storage: p.featured_image_storage,
        category: p.primary_category?.name || 'None'
      })),
      allProductNames: activeProducts.map((p: any) => p.name),
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

