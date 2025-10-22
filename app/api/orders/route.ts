import { NextRequest, NextResponse } from "next/server";

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
