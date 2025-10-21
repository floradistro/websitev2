import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServiceSupabase();
    
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        location:locations(id, name, type, city, state),
        vendor:vendors(id, store_name, email)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Inventory not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      inventory: data
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
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
    const { quantity, unit_cost, low_stock_threshold, notes } = body;
    
    const supabase = getServiceSupabase();
    
    // Verify vendor owns this inventory
    const { data: existing } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', id)
      .eq('vendor_id', vendorId)
      .single();
    
    if (!existing) {
      return NextResponse.json({ error: 'Inventory not found or unauthorized' }, { status: 404 });
    }
    
    // Build update object
    const updates: any = {};
    if (quantity !== undefined) updates.quantity = parseFloat(quantity);
    if (unit_cost !== undefined) updates.unit_cost = parseFloat(unit_cost);
    if (low_stock_threshold !== undefined) updates.low_stock_threshold = parseFloat(low_stock_threshold);
    if (notes !== undefined) updates.notes = notes;
    
    // Update inventory
    const { data: updated, error: updateError } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      inventory: updated
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const vendorId = request.headers.get('x-vendor-id');
    if (!vendorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = getServiceSupabase();
    
    // Verify vendor owns this inventory
    const { data: existing } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', id)
      .eq('vendor_id', vendorId)
      .single();
    
    if (!existing) {
      return NextResponse.json({ error: 'Inventory not found or unauthorized' }, { status: 404 });
    }
    
    // Delete inventory
    const { error: deleteError } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Inventory deleted'
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

