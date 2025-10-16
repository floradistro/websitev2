import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const baseUrl = process.env.WORDPRESS_API_URL;
const consumerKey = process.env.WORDPRESS_CONSUMER_KEY;
const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const authString = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    const response = await axios.get(
      `${baseUrl}/wp-json/wc/v3/orders/${id}`,
      {
        headers: {
          'Authorization': `Basic ${authString}`
        }
      }
    );

    const order = response.data;

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        number: order.number,
        status: order.status,
        total: order.total,
        date_created: order.date_created,
        billing: order.billing,
        shipping: order.shipping,
        line_items: order.line_items,
        shipping_lines: order.shipping_lines,
        payment_method: order.payment_method,
        payment_method_title: order.payment_method_title,
        customer_note: order.customer_note,
        meta_data: order.meta_data
      }
    });

  } catch (error: any) {
    console.error("Error fetching order:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.message || error.message || "Failed to fetch order"
      },
      { status: error.response?.status || 500 }
    );
  }
}

