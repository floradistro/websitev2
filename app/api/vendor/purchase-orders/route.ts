import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'Vendor ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const supabase = getServiceSupabase();
    
    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        location:location_id(id, name, city, state),
        items:purchase_order_items(
          id,
          product_id,
          product_name,
          product_sku,
          quantity_ordered,
          quantity_received,
          unit_cost,
          line_total,
          receive_status
        )
      `)
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false });
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('❌ Error loading purchase orders:', error);
      
      // Check if table doesn't exist
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return NextResponse.json({ 
          success: true, 
          purchase_orders: [],
          warning: 'Purchase orders table not yet created. Please apply migration: 20251023_purchase_orders.sql'
        });
      }
      
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, purchase_orders: data || [] });
  } catch (error: any) {
    console.error('❌ Error in purchase orders API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'Vendor ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { location_id, expected_delivery_date, supplier_name, supplier_email, supplier_phone, items, notes } = body;

    if (!location_id || !items || items.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Location and items are required' 
      }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Create PO
    const { data: po, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        vendor_id: vendorId,
        location_id,
        expected_delivery_date,
        supplier_name,
        supplier_email,
        supplier_phone,
        internal_notes: notes,
        status: 'draft'
      })
      .select()
      .single();

    if (poError) {
      console.error('Error creating purchase order:', poError);
      return NextResponse.json({ success: false, error: poError.message }, { status: 500 });
    }

    // Create PO items
    const poItems = items.map((item: any) => ({
      purchase_order_id: po.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      quantity_ordered: item.quantity,
      unit_cost: item.unit_cost
    }));

    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(poItems);

    if (itemsError) {
      console.error('Error creating PO items:', itemsError);
      // Rollback PO
      await supabase.from('purchase_orders').delete().eq('id', po.id);
      return NextResponse.json({ success: false, error: itemsError.message }, { status: 500 });
    }

    // Fetch complete PO with items
    const { data: completePO } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        location:location_id(id, name),
        items:purchase_order_items(*)
      `)
      .eq('id', po.id)
      .single();

    return NextResponse.json({ 
      success: true, 
      purchase_order: completePO,
      message: 'Purchase order created successfully'
    });
  } catch (error: any) {
    console.error('Error in create purchase order API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const vendorId = request.headers.get('x-vendor-id');
    
    if (!vendorId) {
      return NextResponse.json({ success: false, error: 'Vendor ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { po_id, status, tracking_number, carrier, shipping_notes } = body;

    if (!po_id) {
      return NextResponse.json({ success: false, error: 'PO ID required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Verify ownership
    const { data: po, error: verifyError } = await supabase
      .from('purchase_orders')
      .select('id')
      .eq('id', po_id)
      .eq('vendor_id', vendorId)
      .single();

    if (verifyError || !po) {
      return NextResponse.json({ success: false, error: 'Purchase order not found' }, { status: 404 });
    }

    // Update PO
    const updates: any = {};
    if (status) updates.status = status;
    if (tracking_number !== undefined) updates.tracking_number = tracking_number;
    if (carrier !== undefined) updates.carrier = carrier;
    if (shipping_notes !== undefined) updates.shipping_notes = shipping_notes;

    const { data: updated, error: updateError } = await supabase
      .from('purchase_orders')
      .update(updates)
      .eq('id', po_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating purchase order:', updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      purchase_order: updated,
      message: 'Purchase order updated successfully'
    });
  } catch (error: any) {
    console.error('Error in update purchase order API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}



