import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const baseUrl = process.env.WORDPRESS_API_URL;
const consumerKey = process.env.WORDPRESS_CONSUMER_KEY;
const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET;

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

    // Prepare line items for WooCommerce order
    const line_items = items.map((item: any) => ({
      product_id: item.productId,
      quantity: item.quantity,
      meta_data: [
        {
          key: "tier_name",
          value: item.tierName
        },
        {
          key: "order_type",
          value: item.orderType || "delivery"
        },
        ...(item.locationId ? [{
          key: "pickup_location_id",
          value: item.locationId
        }] : []),
        ...(item.locationName ? [{
          key: "pickup_location_name",
          value: item.locationName
        }] : [])
      ]
    }));

    // Prepare shipping lines
    const shipping_lines = shipping_cost > 0 ? [{
      method_id: shipping_method?.method_id || "flat_rate",
      method_title: shipping_method?.method_title || "Standard Shipping",
      total: shipping_cost.toFixed(2)
    }] : [];

    // Determine if there are any delivery items
    const hasDeliveryItems = items.some((item: any) => item.orderType === "delivery");

    // Create WooCommerce order
    const orderData = {
      payment_method: "authorize_net_cim",
      payment_method_title: isApplePay ? "Apple Pay (Authorize.net)" : "Credit Card (Authorize.net)",
      set_paid: false,
      billing: {
        first_name: billing.firstName,
        last_name: billing.lastName,
        email: billing.email,
        phone: billing.phone,
        address_1: billing.address || "",
        address_2: billing.address2 || "",
        city: billing.city || "",
        state: billing.state || "",
        postcode: billing.zipCode || "",
        country: billing.country || "US"
      },
      shipping: (shipping && hasDeliveryItems) ? {
        first_name: shipping.firstName || billing.firstName,
        last_name: shipping.lastName || billing.lastName,
        address_1: shipping.address,
        address_2: shipping.address2 || "",
        city: shipping.city,
        state: shipping.state,
        postcode: shipping.zip,
        country: shipping.country || "US"
      } : {
        first_name: billing.firstName,
        last_name: billing.lastName,
        address_1: billing.address || "",
        address_2: billing.address2 || "",
        city: billing.city || "",
        state: billing.state || "",
        postcode: billing.zipCode || "",
        country: billing.country || "US"
      },
      line_items,
      shipping_lines,
      meta_data: [
        {
          key: "_authorize_net_cim_payment_token",
          value: payment_token
        },
        {
          key: "_wc_authorize_net_cim_payment_token",
          value: payment_token
        },
        {
          key: "opaqueDataValue",
          value: payment_token
        },
        {
          key: "_payment_type",
          value: isApplePay ? "apple_pay" : "credit_card"
        }
      ]
    };

    // Create the order via WooCommerce REST API
    const authString = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    const response = await axios.post(
      `${baseUrl}/wp-json/wc/v3/orders`,
      orderData,
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const order = response.data;

    // The Authorize.net gateway will automatically process the payment
    // when it finds the payment token in the order meta data
    // We may need to trigger a payment processing action
    
    // Wait a moment for the payment to process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fetch updated order status
    const updatedOrderResponse = await axios.get(
      `${baseUrl}/wp-json/wc/v3/orders/${order.id}`,
      {
        headers: {
          'Authorization': `Basic ${authString}`
        }
      }
    );

    const updatedOrder = updatedOrderResponse.data;

    return NextResponse.json({
      success: true,
      order_id: updatedOrder.id,
      order_number: updatedOrder.number,
      order_key: updatedOrder.order_key,
      status: updatedOrder.status,
      total: updatedOrder.total,
      payment_url: updatedOrder.payment_url || `${baseUrl}/checkout/order-received/${updatedOrder.id}/?key=${updatedOrder.order_key}`
    });

  } catch (error: any) {
    console.error("Payment processing error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.message || error.message || "Payment processing failed",
        details: error.response?.data
      },
      { status: error.response?.status || 500 }
    );
  }
}

