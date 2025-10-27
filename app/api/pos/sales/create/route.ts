import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface CartItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  inventoryId: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const {
      locationId,
      vendorId,
      sessionId,
      userId,
      items,
      subtotal,
      taxAmount,
      total,
      paymentMethod,
      cashTendered,
      changeGiven,
      customerId,
      customerName = 'Walk-In',
    }: {
      locationId: string;
      vendorId: string;
      sessionId?: string;
      userId?: string;
      items: CartItem[];
      subtotal: number;
      taxAmount: number;
      total: number;
      paymentMethod: 'cash' | 'card';
      cashTendered?: number;
      changeGiven?: number;
      customerId?: string;
      customerName?: string;
    } = await request.json();

    if (!locationId || !vendorId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate order number
    const locationCode = (await supabase
      .from('locations')
      .select('slug')
      .eq('id', locationId)
      .single()).data?.slug.substring(0, 3).toUpperCase() || 'POS';
    
    const dateCode = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const sequence = Date.now().toString().slice(-4);
    const orderNumber = `POS-${locationCode}-${dateCode}-${sequence}`;

    // Create customer record if needed
    let finalCustomerId = customerId;
    if (!customerId && customerName !== 'Walk-In') {
      const { data: newCustomer } = await supabase
        .from('customers')
        .insert({
          first_name: customerName,
          email: `walkin-${Date.now()}@pos.local`,
          metadata: { pos_walk_in: true },
        })
        .select('id')
        .single();
      
      finalCustomerId = newCustomer?.id;
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: finalCustomerId,
        vendor_id: vendorId,
        status: 'completed',
        payment_status: 'paid',
        fulfillment_status: 'fulfilled',
        delivery_type: 'pickup',
        pickup_location_id: locationId,
        subtotal,
        tax_amount: taxAmount,
        total_amount: total,
        payment_method: paymentMethod,
        billing_address: { name: customerName },
        completed_date: new Date().toISOString(),
        metadata: {
          pos_sale: true,
          walk_in: true,
          payment_method: paymentMethod,
          cash_tendered: cashTendered,
          change_given: changeGiven,
        },
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order', details: orderError.message },
        { status: 500 }
      );
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      line_subtotal: item.lineTotal,
      line_total: item.lineTotal,
      vendor_id: vendorId,
      order_type: 'pickup',
      pickup_location_id: locationId,
      inventory_id: item.inventoryId,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Rollback order
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { error: 'Failed to create order items', details: itemsError.message },
        { status: 500 }
      );
    }

    // Create POS transaction
    const transactionNumber = `TXN-${orderNumber}-${Date.now()}`;
    
    const { data: transaction, error: transactionError } = await supabase
      .from('pos_transactions')
      .insert({
        transaction_number: transactionNumber,
        location_id: locationId,
        vendor_id: vendorId,
        order_id: order.id,
        session_id: sessionId,
        user_id: userId,
        transaction_type: 'walk_in_sale',
        payment_method: paymentMethod,
        payment_status: 'completed',
        subtotal,
        tax_amount: taxAmount,
        total_amount: total,
        cash_tendered: cashTendered,
        change_given: changeGiven,
        metadata: {
          walk_in_sale: true,
          customer_name: customerName,
          items_count: items.length,
        },
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Error creating POS transaction:', transactionError);
    }

    // Deduct inventory for each item
    for (const item of items) {
      // Get current quantity first
      const { data: inv } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('id', item.inventoryId)
        .single();
      
      if (inv) {
        await supabase
          .from('inventory')
          .update({
            quantity: inv.quantity - item.quantity,
          })
          .eq('id', item.inventoryId);
      }
    }

    return NextResponse.json({
      success: true,
      order,
      transaction,
      message: `Sale completed: ${orderNumber}`,
    });
  } catch (error: any) {
    console.error('Error in create sale endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

