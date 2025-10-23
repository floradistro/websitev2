import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { isStockAvailable } from "@/lib/unit-conversion";

// Get base URL for internal API calls
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customer");
    const page = searchParams.get("page") || "1";
    const perPage = searchParams.get("per_page") || "20";
    const status = searchParams.get("status");
    
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 }
      );
    }
    
    // Build query params
    const params = new URLSearchParams({
      customer_id: customerId,
      page,
      per_page: perPage
    });
    
    if (status) {
      params.append('status', status);
    }
    
    // Fetch orders from Supabase
    const response = await fetch(`${getBaseUrl()}/api/supabase/orders?${params}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Failed to fetch orders');
    }
    
    // Format orders data
    const orders = data.orders.map((order: any) => ({
      id: order.id,
      number: order.order_number,
      status: order.status,
      total: order.total_amount.toString(),
      currency: order.currency || 'USD',
      date_created: order.order_date,
      date_modified: order.updated_at,
      date_completed: order.completed_date,
      billing: order.billing_address,
      shipping: order.shipping_address,
      line_items: order.order_items.map((item: any) => ({
        id: item.id,
        name: item.product_name,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.unit_price,
        total: item.line_total,
        image: item.product_image ? { src: item.product_image } : null,
        meta_data: item.meta_data || {},
        order_type: item.order_type || 'delivery',
        tier_name: item.tier_name,
        pickup_location: item.pickup_location_name
      })),
      shipping_lines: [],
      payment_method: order.payment_method,
      payment_method_title: order.payment_method_title,
      customer_note: order.customer_note
    }));
    
    return NextResponse.json({
      success: true,
      orders,
      pagination: data.pagination
    });
    
  } catch (error: any) {
    console.error('Orders API error:', error);
    return NextResponse.json({ 
      success: false,
      orders: [],
      error: error.message 
    }, { status: 500 });
  }
}

/**
 * POST - Create new order
 * Handles inventory deduction in GRAMS
 */
export async function POST(request: NextRequest) {
  const supabase = getServiceSupabase();
  
  try {
    const body = await request.json();
    const {
      customer_id,
      line_items,
      billing_address,
      shipping_address,
      payment_method,
      payment_method_title,
      customer_note,
      order_type = 'delivery'
    } = body;

    console.log('🛒 Creating order with', line_items?.length, 'items');

    // ============================================================================
    // STEP 1: Validate all line items have stock (in grams)
    // ============================================================================
    for (const item of line_items) {
      const quantity_grams = item.quantity_grams || item.quantity; // Fallback to quantity if no grams specified
      
      if (!quantity_grams || quantity_grams <= 0) {
        return NextResponse.json({
          success: false,
          error: `Invalid quantity for ${item.name}`
        }, { status: 400 });
      }

      // Fetch current stock
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, stock_quantity, sku')
        .eq('id', item.product_id)
        .single();

      if (productError || !product) {
        console.error('❌ Product not found:', item.product_id);
        return NextResponse.json({
          success: false,
          error: `Product not found: ${item.name}`
        }, { status: 404 });
      }

      // Check if sufficient stock (in grams)
      const availableStock = product.stock_quantity || 0;
      
      if (!isStockAvailable(availableStock, quantity_grams)) {
        console.error(`❌ Insufficient stock for ${product.name}. Need: ${quantity_grams}g, Have: ${availableStock}g`);
        return NextResponse.json({
          success: false,
          error: `Insufficient stock for ${product.name}. Only ${availableStock}g available.`
        }, { status: 400 });
      }

      console.log(`✅ Stock check passed: ${product.name} (${quantity_grams}g requested, ${availableStock}g available)`);
    }

    // ============================================================================
    // STEP 2: Calculate order total
    // ============================================================================
    const total_amount = line_items.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // ============================================================================
    // STEP 3: Create order record
    // ============================================================================
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id,
        order_number: orderNumber,
        status: 'pending',
        total_amount,
        currency: 'USD',
        payment_method,
        payment_method_title: payment_method_title || payment_method,
        billing_address,
        shipping_address,
        customer_note,
        order_type,
        order_date: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Failed to create order:', orderError);
      throw new Error('Failed to create order');
    }

    console.log('✅ Order created:', order.order_number);

    // ============================================================================
    // STEP 4: Create order items & Deduct inventory (in GRAMS)
    // ============================================================================
    const orderItems = [];
    
    for (const item of line_items) {
      const quantity_grams = item.quantity_grams || item.quantity;
      const quantity_display = item.quantity_display || `${item.quantity}`;

      // Create order item
      const { data: orderItem, error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.name,
          product_image: item.image,
          quantity: item.quantity,
          quantity_grams,           // ← CRITICAL: Store grams for tracking
          quantity_display,         // ← CRITICAL: Store display for receipt
          unit_price: item.price,
          line_total: item.price * item.quantity,
          tier_name: item.tierName || 'Standard',
          order_type: item.orderType || order_type,
          pickup_location_id: item.locationId,
          pickup_location_name: item.locationName,
          meta_data: {
            quantity_grams,
            quantity_display,
            original_tier: item.tierName
          }
        })
        .select()
        .single();

      if (itemError) {
        console.error('❌ Failed to create order item:', itemError);
        throw new Error(`Failed to create order item for ${item.name}`);
      }

      orderItems.push(orderItem);

      // ============================================================================
      // DEDUCT FROM INVENTORY (in GRAMS)
      // ============================================================================
      console.log(`📉 Deducting ${quantity_grams}g (${quantity_display}) from ${item.name}`);

      const { data: updatedProduct, error: stockError } = await supabase
        .from('products')
        .update({
          stock_quantity: supabase.raw(`stock_quantity - ${quantity_grams}`)
        })
        .eq('id', item.product_id)
        .select('stock_quantity, name')
        .single();

      if (stockError) {
        console.error('❌ Failed to update inventory:', stockError);
        throw new Error(`Failed to update inventory for ${item.name}`);
      }

      console.log(`✅ Inventory updated: ${updatedProduct.name} - New stock: ${updatedProduct.stock_quantity}g`);

      // If using multi-location inventory, also update inventory_items table
      if (item.locationId) {
        const { error: locationStockError } = await supabase
          .from('inventory_items')
          .update({
            quantity: supabase.raw(`quantity - ${quantity_grams}`)
          })
          .eq('product_id', item.product_id)
          .eq('location_id', item.locationId);

        if (locationStockError) {
          console.warn('⚠️ Location inventory update failed:', locationStockError);
          // Don't fail the order, just log it
        } else {
          console.log(`✅ Location inventory updated: ${item.locationName}`);
        }
      }
    }

    // ============================================================================
    // STEP 5: Return complete order
    // ============================================================================
    console.log('✅ Order completed successfully:', order.order_number);

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        number: order.order_number,
        status: order.status,
        total: order.total_amount.toString(),
        currency: order.currency,
        date_created: order.order_date,
        line_items: orderItems.map((item: any) => ({
          id: item.id,
          name: item.product_name,
          product_id: item.product_id,
          quantity: item.quantity,
          quantity_grams: item.quantity_grams,        // ← Included in response
          quantity_display: item.quantity_display,    // ← Included in response
          price: item.unit_price,
          total: item.line_total,
          tier_name: item.tier_name
        }))
      }
    });

  } catch (error: any) {
    console.error('❌ Order creation error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create order'
    }, { status: 500 });
  }
}
