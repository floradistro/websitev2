import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, submission_id, action } = body; // action: 'approve' or 'reject'
    
    const id = productId || submission_id;
    
    console.log('🔵 Approval request:', { id, action });
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();
    
    if (action === 'approve') {
      console.log('🔵 Approving product:', id);
      
      // Update product status to published
      const { data: product, error: updateError } = await supabase
        .from('products')
        .update({ 
          status: 'published',
          date_on_sale_from: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Error approving product:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      
      console.log('✅ Product approved:', product.id, product.name, 'wordpress_id:', product.wordpress_id);
      
      // Ensure product is ready for public display
      // Stock will be managed via vendor inventory manager
      
      return NextResponse.json({
        success: true,
        message: 'Product approved and published',
        product
      });
      
    } else if (action === 'reject') {
      console.log('🔵 Rejecting product:', id);
      
      // Update product status to archived
      const { data: product, error: updateError } = await supabase
        .from('products')
        .update({ 
          status: 'archived'
        })
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Error rejecting product:', updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
      
      console.log('✅ Product rejected:', product.id, product.name);
      
      return NextResponse.json({
        success: true,
        message: 'Product rejected',
        product
      });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    
  } catch (error: any) {
    console.error('Approve product error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
