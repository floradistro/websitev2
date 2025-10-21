import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vendorId = request.headers.get('x-vendor-id');
    
    console.log('🔵 Update product:', id, 'vendor:', vendorId);
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const supabase = getServiceSupabase();
    
    // Verify vendor owns this product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, vendor_id')
      .eq('id', id)
      .single();
    
    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    if (product.vendor_id !== vendorId) {
      return NextResponse.json({ error: 'Unauthorized - not your product' }, { status: 403 });
    }
    
    console.log('🔵 Updating product with data:', body);
    
    // Update product
    const { data: updated, error: updateError } = await supabase
      .from('products')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating product:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    console.log('✅ Product updated:', updated.name, 'new status:', updated.status);
    
    return NextResponse.json({
      success: true,
      product: updated,
      message: body.status === 'pending' ? 'Product resubmitted for approval' : 'Product updated'
    });
    
  } catch (error: any) {
    console.error('❌ Update product error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

