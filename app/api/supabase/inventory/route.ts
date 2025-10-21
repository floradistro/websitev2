import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = request.headers.get('x-vendor-id');
    const productId = searchParams.get('product_id');
    const locationId = searchParams.get('location_id');
    
    const supabase = getServiceSupabase();
    
    let query = supabase
      .from('inventory')
      .select(`
        *,
        location:locations(id, name, type),
        vendor:vendors(id, store_name)
      `);
    
    // Filter by vendor if specified
    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }
    
    // Filter by product if specified
    if (productId) {
      query = query.eq('product_id', parseInt(productId));
    }
    
    // Filter by location if specified
    if (locationId) {
      query = query.eq('location_id', locationId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching inventory:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      inventory: data || []
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
    const { product_id, location_id, quantity, unit_cost, low_stock_threshold } = body;
    
    if (!product_id || !location_id || quantity === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: product_id, location_id, quantity' 
      }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();
    
    // Create inventory record
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .insert({
        product_id: parseInt(product_id),
        location_id,
        vendor_id: vendorId,
        quantity: parseFloat(quantity),
        unit_cost: unit_cost ? parseFloat(unit_cost) : null,
        low_stock_threshold: low_stock_threshold ? parseFloat(low_stock_threshold) : 10
      })
      .select()
      .single();
    
    if (inventoryError) {
      console.error('Error creating inventory:', inventoryError);
      return NextResponse.json({ error: inventoryError.message }, { status: 500 });
    }
    
    // Create initial stock movement
    await supabase
      .from('stock_movements')
      .insert({
        inventory_id: inventory.id,
        product_id: parseInt(product_id),
        to_location_id: location_id,
        movement_type: 'purchase',
        quantity: parseFloat(quantity),
        quantity_before: 0,
        quantity_after: parseFloat(quantity),
        cost_per_unit: unit_cost ? parseFloat(unit_cost) : null,
        reason: 'Initial inventory'
      });
    
    return NextResponse.json({
      success: true,
      inventory
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

