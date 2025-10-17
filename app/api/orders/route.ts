import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const baseUrl = process.env.WORDPRESS_API_URL;
const consumerKey = process.env.WORDPRESS_CONSUMER_KEY;
const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customer");
    const page = searchParams.get("page") || "1";
    const perPage = searchParams.get("per_page") || "20";
    const status = searchParams.get("status"); // Filter by status
    const orderType = searchParams.get("order_type"); // Filter by delivery/pickup
    
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 }
      );
    }
    
    const authString = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    const params: any = {
      customer: customerId,
      page: page,
      per_page: perPage,
      orderby: 'date',
      order: 'desc',
    };

    if (status) {
      params.status = status;
    }
    
    const response = await axios.get(
      `${baseUrl}/wp-json/wc/v3/orders`,
      {
        headers: {
          'Authorization': `Basic ${authString}`
        },
        params
      }
    );

    let orders = response.data;

    // Filter by order type if specified
    if (orderType && (orderType === "delivery" || orderType === "pickup")) {
      orders = orders.filter((order: any) => {
        // Check meta_data or line items for order type
        const hasOrderType = order.line_items.some((item: any) => 
          item.meta_data?.some((meta: any) => 
            meta.key === 'order_type' && meta.value === orderType
          )
        );
        return hasOrderType;
      });
    }

    // Enhanced order data with tracking info
    const enhancedOrders = orders.map((order: any) => {
      // Determine if order has delivery or pickup items
      const deliveryItems = order.line_items.filter((item: any) =>
        item.meta_data?.find((m: any) => m.key === 'order_type')?.value === 'delivery'
      );
      
      const pickupItems = order.line_items.filter((item: any) =>
        item.meta_data?.find((m: any) => m.key === 'order_type')?.value === 'pickup'
      );

      // Get pickup location from first pickup item
      const pickupLocation = pickupItems.length > 0
        ? pickupItems[0].meta_data?.find((m: any) => m.key === 'pickup_location_name')?.value
        : null;

      return {
        id: order.id,
        number: order.number,
        status: order.status,
        total: order.total,
        currency: order.currency,
        date_created: order.date_created,
        date_modified: order.date_modified,
        date_completed: order.date_completed,
        billing: order.billing,
        shipping: order.shipping,
        line_items: order.line_items.map((item: any) => ({
          id: item.id,
          name: item.name,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
          image: item.image,
          meta_data: item.meta_data,
          order_type: item.meta_data?.find((m: any) => m.key === 'order_type')?.value || 'delivery',
          tier_name: item.meta_data?.find((m: any) => m.key === 'tier_name')?.value,
          pickup_location: item.meta_data?.find((m: any) => m.key === 'pickup_location_name')?.value,
        })),
        shipping_lines: order.shipping_lines,
        payment_method: order.payment_method,
        payment_method_title: order.payment_method_title,
        customer_note: order.customer_note,
        has_delivery: deliveryItems.length > 0,
        has_pickup: pickupItems.length > 0,
        pickup_location: pickupLocation,
      };
    });

    return NextResponse.json({
      success: true,
      orders: enhancedOrders,
      total: response.headers['x-wp-total'],
      total_pages: response.headers['x-wp-totalpages'],
    });

  } catch (error: any) {
    console.error("Error fetching orders:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to fetch orders"
      },
      { status: error.response?.status || 500 }
    );
  }
}

