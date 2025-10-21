import { NextRequest, NextResponse } from "next/server";

const baseUrl = process.env.WORDPRESS_API_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { payment_token, billing, shipping, items, shipping_cost } = body;

    if (!payment_token || !billing || !items || items.length === 0) {
      console.error('MISSING FIELDS!');
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const wpUrl = `${baseUrl}/wp-admin/admin-ajax.php?action=flora_create_order`;

    // Submit to WordPress admin-ajax (works for guests via nopriv hook)
    const response = await fetch(wpUrl, {
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

    if (!response.ok) {
      console.error('WordPress returned non-200:', response.status);
      throw new Error(`WordPress returned ${response.status}`);
    }

    const text = await response.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse response:', text);
      throw new Error('Invalid response from WordPress: ' + text.substring(0, 200));
    }

    if (data.success && data.data) {
      return NextResponse.json({
        success: true,
        order_id: data.data.order_id,
        order_number: data.data.order_number,
        order_key: data.data.order_key || ''
      });
    } else {
      const errorMsg = data.data?.error || data.error || "Order creation failed";
      console.error('WordPress error:', errorMsg);
      throw new Error(errorMsg);
    }

  } catch (error: any) {
    console.error("Payment error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Payment failed",
        debug: {
          message: error.message,
          stack: error.stack?.substring(0, 500)
        }
      },
      { status: 500 }
    );
  }
}

