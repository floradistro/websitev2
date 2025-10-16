import { NextRequest, NextResponse } from "next/server";

const baseUrl = process.env.WORDPRESS_API_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { payment_token, billing, shipping, items, shipping_method, shipping_cost } = body;

    if (!payment_token || !billing || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Build checkout form data exactly as WooCommerce expects
    const formData = new URLSearchParams({
      payment_method: 'authorize_net_cim',
      'wc-authorize-net-cim-payment-nonce': payment_token,
      billing_first_name: billing.firstName,
      billing_last_name: billing.lastName,
      billing_email: billing.email,
      billing_phone: billing.phone,
      billing_address_1: billing.address || '',
      billing_address_2: billing.address2 || '',
      billing_city: billing.city || '',
      billing_state: billing.state || '',
      billing_postcode: billing.zipCode || '',
      billing_country: billing.country || 'US',
      shipping_first_name: shipping?.firstName || billing.firstName,
      shipping_last_name: shipping?.lastName || billing.lastName,
      shipping_address_1: shipping?.address || billing.address || '',
      shipping_address_2: shipping?.address2 || billing.address2 || '',
      shipping_city: shipping?.city || billing.city || '',
      shipping_state: shipping?.state || billing.state || '',
      shipping_postcode: shipping?.zip || billing.zipCode || '',
      shipping_country: shipping?.country || billing.country || 'US',
      ship_to_different_address: shipping ? '1' : '0',
      terms: '1',
      'woocommerce-process-checkout-nonce': '', // Will be populated
      _wp_http_referer: '/?wc-ajax=update_order_review'
    });

    // Add cart items
    items.forEach((item: any, index: number) => {
      formData.append(`cart[${index}][product_id]`, item.productId.toString());
      formData.append(`cart[${index}][quantity]`, item.quantity.toString());
      formData.append(`cart[${index}][tier_name]`, item.tierName);
      if (item.orderType) {
        formData.append(`cart[${index}][order_type]`, item.orderType);
      }
      if (item.locationId) {
        formData.append(`cart[${index}][location_id]`, item.locationId);
      }
      if (item.locationName) {
        formData.append(`cart[${index}][location_name]`, item.locationName);
      }
    });

    // Submit to WordPress admin-ajax (works for guests via nopriv hook)
    const response = await fetch(`${baseUrl}/wp-admin/admin-ajax.php?action=flora_create_order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment_token,
        billing,
        shipping,
        items,
        shipping_cost
      })
    });

    const data = await response.json();

    if (data.success && data.data) {
      return NextResponse.json({
        success: true,
        order_id: data.data.order_id,
        order_number: data.data.order_number,
        order_key: data.data.order_key || ''
      });
    } else {
      throw new Error(data.data?.error || "Order creation failed");
    }

  } catch (error: any) {
    console.error("Payment error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Payment failed" },
      { status: 500 }
    );
  }
}

