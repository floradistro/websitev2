import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Customer authentication
    const customerId = request.headers.get('x-customer-id');
    
    // Filters
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('payment_status');
    const fulfillmentStatus = searchParams.get('fulfillment_status');
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');
    const offset = (page - 1) * perPage;
    
    const supabase = getServiceSupabase();
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        customer:customers(id, email, first_name, last_name, phone),
        order_items(
          *,
          product:products(id, name, slug, featured_image),
          vendor:vendors(id, store_name)
        ),
        order_notes(*)
      `, { count: 'exact' });
    
    // Customer filter
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    
    // Status filters
    if (status) {
      query = query.eq('status', status);
    }
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }
    if (fulfillmentStatus) {
      query = query.eq('fulfillment_status', fulfillmentStatus);
    }
    
    // Pagination & sorting
    query = query
      .order('order_date', { ascending: false })
      .range(offset, offset + perPage - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      orders: data || [],
      pagination: {
        page,
        per_page: perPage,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / perPage)
      }
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      customer_id,
      order_number,
      status = 'pending',
      payment_status = 'pending',
      items = [],
      billing_address,
      shipping_address,
      payment_method,
      shipping_method,
      customer_note,
      delivery_type
    } = body;
    
    if (!customer_id || !order_number || items.length === 0) {
      return NextResponse.json({ 
        error: 'Missing required fields: customer_id, order_number, items' 
      }, { status: 400 });
    }
    
    const supabase = getServiceSupabase();
    
    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (parseFloat(item.unit_price) * parseFloat(item.quantity)), 0
    );
    
    const taxAmount = items.reduce((sum: number, item: any) => 
      sum + parseFloat(item.tax_amount || 0), 0
    );
    
    const shippingAmount = parseFloat(body.shipping_amount || 0);
    const discountAmount = parseFloat(body.discount_amount || 0);
    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id,
        order_number,
        status,
        payment_status,
        subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        billing_address,
        shipping_address,
        payment_method,
        payment_method_title: body.payment_method_title,
        shipping_method,
        shipping_method_title: body.shipping_method_title,
        delivery_type,
        pickup_location_id: body.pickup_location_id,
        customer_note,
        transaction_id: body.transaction_id,
        order_date: new Date().toISOString()
      })
      .select()
      .single();
    
    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }
    
    // Create order items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      wordpress_product_id: item.wordpress_product_id,
      product_name: item.product_name,
      product_sku: item.product_sku,
      product_image: item.product_image,
      unit_price: parseFloat(item.unit_price),
      quantity: parseFloat(item.quantity),
      line_subtotal: parseFloat(item.unit_price) * parseFloat(item.quantity),
      line_total: parseFloat(item.line_total || item.unit_price * item.quantity),
      tax_amount: parseFloat(item.tax_amount || 0),
      vendor_id: item.vendor_id,
      order_type: item.order_type,
      pickup_location_id: item.pickup_location_id,
      pickup_location_name: item.pickup_location_name,
      tier_name: item.tier_name,
      tier_qty: item.tier_qty,
      tier_price: item.tier_price,
      meta_data: item.meta_data || {}
    }));
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    
    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }
    
    // Create initial status history
    await supabase
      .from('order_status_history')
      .insert({
        order_id: order.id,
        to_status: status,
        note: 'Order created'
      });
    
    return NextResponse.json({
      success: true,
      order
    });
    
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

