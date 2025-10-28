import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { orderId, locationId } = await request.json();

    if (!orderId || !locationId) {
      return NextResponse.json(
        { error: 'Missing orderId or locationId' },
        { status: 400 }
      );
    }

    // Get the order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        vendor_id,
        total_amount,
        payment_method,
        customer_id,
        delivery_type
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Determine if this is a shipping order
    const isShippingOrder = order.delivery_type === 'delivery';

    // FIRST: Update order status to fulfilled
    const updateData: any = {
      fulfillment_status: 'fulfilled',
      completed_date: new Date().toISOString(),
    };

    // For shipping orders, also set shipped_date
    if (isShippingOrder) {
      updateData.shipped_date = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order status', details: updateError.message },
        { status: 500 }
      );
    }

    // Get active session for this location (if exists)
    const { data: activeSession } = await supabase
      .from('pos_sessions')
      .select('id')
      .eq('location_id', locationId)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .single();

    // Create POS transaction for fulfillment
    const transactionNumber = `TXN-${order.order_number}-${Date.now()}`;
    // NOTE: Using 'pickup_fulfillment' for all orders until database constraint is updated
    // Shipping orders are tracked via metadata.is_shipping_order
    const transactionType = 'pickup_fulfillment';

    const { data: transaction, error: transactionError } = await supabase
      .from('pos_transactions')
      .insert({
        transaction_number: transactionNumber,
        location_id: locationId,
        vendor_id: order.vendor_id,
        order_id: order.id,
        session_id: activeSession?.id || null,
        transaction_type: transactionType,
        payment_method: 'prepaid_online',
        payment_status: 'completed',
        subtotal: order.total_amount,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: order.total_amount,
        // customer_id is integer in pos_transactions (legacy schema), skip for now
        metadata: {
          fulfilled_via_pos: true,
          original_order: order.order_number,
          customer_id: order.customer_id, // Store in metadata instead
          fulfilled_at: new Date().toISOString(),
          delivery_type: order.delivery_type,
          is_shipping_order: isShippingOrder,
        },
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating POS transaction:', transactionError);
      return NextResponse.json(
        { error: 'Failed to create POS transaction', details: transactionError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction,
      message: `Order ${order.order_number} fulfilled successfully`,
    });
  } catch (error: any) {
    console.error('Error in POS fulfill endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

