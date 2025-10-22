import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { productId, locationId, quantity, unitCost } = body;
    
    if (!productId || !locationId || quantity === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: productId, locationId, quantity' 
      }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();
    
    // Verify vendor owns this product
    const { data: product } = await supabase
      .from('products')
      .select('id, vendor_id')
      .eq('id', productId)
      .single();
    
    if (!product || product.vendor_id !== vendorId) {
      return NextResponse.json({ 
        error: 'Product not found or unauthorized' 
      }, { status: 403 });
    }
    
    // Create inventory record
    const { data: inventory, error: createError } = await supabase
      .from('inventory')
      .insert({
        product_id: productId,
        location_id: locationId,
        vendor_id: vendorId,
        quantity: parseFloat(quantity),
        unit_cost: unitCost ? parseFloat(unitCost) : null,
        low_stock_threshold: 10
      })
      .select()
      .single();
    
    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }
    
    // Create initial stock movement
    await supabase
      .from('stock_movements')
      .insert({
        inventory_id: inventory.id,
        product_id: parseInt(productId),
        movement_type: 'purchase',
        quantity: parseFloat(quantity),
        quantity_before: 0,
        quantity_after: parseFloat(quantity),
        to_location_id: locationId,
        reason: 'Initial inventory setup'
      });
    
    return NextResponse.json({
      success: true,
      inventory
    });
    
  } catch (error: any) {
    console.error('Create inventory error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

