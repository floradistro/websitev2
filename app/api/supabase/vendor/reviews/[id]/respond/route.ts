import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { response } = body;
    
    if (!response) {
      return NextResponse.json({ error: 'Response text required' }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();
    
    // Verify this review is for vendor's product
    const { data: review } = await supabase
      .from('product_reviews')
      .select(`
        id,
        product_id
      `)
      .eq('id', id)
      .single();
    
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }
    
    // Verify vendor owns the product
    const { data: product } = await supabase
      .from('products')
      .select('vendor_id')
      .eq('id', review.product_id)
      .single();
    
    if (!product || product.vendor_id !== vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Update review with vendor response
    const { data, error } = await supabase
      .from('product_reviews')
      .update({
        vendor_response: response,
        vendor_id: vendorId,
        responded_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      review: data
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

