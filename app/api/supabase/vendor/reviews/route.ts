import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = getServiceSupabase();
    
    // Get vendor's products
    const { data: vendorProducts } = await supabase
      .from('products')
      .select('id')
      .eq('vendor_id', vendorId);
    
    const productIds = vendorProducts?.map(p => p.id) || [];
    
    if (productIds.length === 0) {
      return NextResponse.json({
        success: true,
        reviews: []
      });
    }
    
    // Get reviews for vendor's products
    const { data, error } = await supabase
      .from('product_reviews')
      .select(`
        *,
        product:product_id(id, name, slug, featured_image),
        customer:customer_id(id, email, first_name, last_name)
      `)
      .in('product_id', productIds)
      .order('created_at', { ascending: false });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      reviews: data || []
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

