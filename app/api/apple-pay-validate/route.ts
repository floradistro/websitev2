import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { validationURL } = body;

    if (!validationURL) {
      return NextResponse.json(
        { success: false, error: "Validation URL is required" },
        { status: 400 }
      );
    }

    // Forward the validation request to WordPress/Authorize.net
    // This endpoint should be implemented on your WordPress side
    const baseUrl = process.env.WORDPRESS_API_URL;
    const authParams = `consumer_key=${process.env.WORDPRESS_CONSUMER_KEY}&consumer_secret=${process.env.WORDPRESS_CONSUMER_SECRET}`;

    const response = await axios.post(
      `${baseUrl}/wp-json/wc/v3/payment_gateways/authorize_net_cim/apple-pay-validate?${authParams}`,
      {
        validation_url: validationURL
      },
      {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 10000
      }
    );

    return NextResponse.json({
      success: true,
      merchantSession: response.data
    });

  } catch (error: any) {
    console.error("Apple Pay validation error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.response?.data?.message || error.message || "Apple Pay validation failed"
      },
      { status: error.response?.status || 500 }
    );
  }
}

