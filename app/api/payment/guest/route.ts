import { NextRequest, NextResponse } from "next/server";

/**
 * Guest checkout endpoint - creates order without requiring authentication
 * Uses the WordPress site directly instead of REST API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      payment_token,
      payment_type,
      billing,
      shipping,
      items,
      shipping_method,
      shipping_cost,
      total
    } = body;

    if (!payment_token || !billing || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const isApplePay = payment_type === "apple_pay";
    const baseUrl = process.env.WORDPRESS_API_URL;

    // Create order data to submit directly to WordPress checkout
    const orderData = {
      payment_method: "authorize_net_cim",
      payment_token: payment_token,
      billing_first_name: billing.firstName,
      billing_last_name: billing.lastName,
      billing_email: billing.email,
      billing_phone: billing.phone,
      billing_address_1: billing.address || "",
      billing_address_2: billing.address2 || "",
      billing_city: billing.city || "",
      billing_state: billing.state || "",
      billing_postcode: billing.zipCode || "",
      billing_country: billing.country || "US",
      shipping_first_name: shipping?.firstName || billing.firstName,
      shipping_last_name: shipping?.lastName || billing.lastName,
      shipping_address_1: shipping?.address || billing.address || "",
      shipping_address_2: shipping?.address2 || billing.address2 || "",
      shipping_city: shipping?.city || billing.city || "",
      shipping_state: shipping?.state || billing.state || "",
      shipping_postcode: shipping?.zip || billing.zipCode || "",
      shipping_country: shipping?.country || billing.country || "US",
      order_items: items.map((item: any) => ({
        product_id: item.productId,
        quantity: item.quantity,
        tier_name: item.tierName,
        order_type: item.orderType || "delivery",
        location_id: item.locationId,
        location_name: item.locationName
      })),
      shipping_method: shipping_method?.method_id || "flat_rate",
      shipping_cost: shipping_cost
    };

    // Post to a custom WordPress endpoint that handles guest checkout
    const response = await fetch(
      `${baseUrl}/wp-json/flora/v1/checkout/create-order`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Order creation failed");
    }

    return NextResponse.json({
      success: true,
      order_id: data.order_id,
      order_number: data.order_number,
      order_key: data.order_key,
      status: data.status,
      total: data.total
    });

  } catch (error: any) {
    console.error("Guest checkout error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Checkout failed"
      },
      { status: 500 }
    );
  }
}

