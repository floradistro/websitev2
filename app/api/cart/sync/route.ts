import { NextRequest, NextResponse } from "next/server";

const baseUrl = process.env.WORDPRESS_API_URL;

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No items provided" },
        { status: 400 }
      );
    }

    // Add items to WooCommerce cart via AJAX endpoint (no auth required)
    const formData = new URLSearchParams();
    
    items.forEach((item: any) => {
      formData.append('product_id', item.productId.toString());
      formData.append('quantity', item.quantity.toString());
    });

    const response = await fetch(`${baseUrl}/?wc-ajax=add_to_cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const data = await response.text();

    return NextResponse.json({
      success: true,
      cart_synced: true
    });

  } catch (error: any) {
    console.error("Cart sync error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

