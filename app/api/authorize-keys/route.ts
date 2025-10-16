import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // For now, return sandbox/test credentials
    // In production, this would fetch from WordPress
    // But for development, we'll use test credentials
    
    return NextResponse.json({
      success: true,
      clientKey: "7Kz9p6L3qR2mN8vY4wX5tC9bH6jF2dA1", // Placeholder - will be replaced by real keys from WooCommerce
      apiLoginId: "5KA4cP7Rz", // Placeholder - will be replaced by real keys from WooCommerce  
      environment: "sandbox"
    });

    // Uncomment below when WordPress Authorize.net plugin is configured:
    /*
    const baseUrl = process.env.WORDPRESS_API_URL;
    const authParams = `consumer_key=${process.env.WORDPRESS_CONSUMER_KEY}&consumer_secret=${process.env.WORDPRESS_CONSUMER_SECRET}`;
    
    const response = await fetch(
      `${baseUrl}/wp-json/wc/v3/payment_gateways/authorize_net_cim?${authParams}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch Authorize.net settings");
    }

    const gateway = await response.json();
    
    // Extract the public client key and API login ID from gateway settings
    const clientKey = gateway.settings?.client_key?.value || '';
    const apiLoginId = gateway.settings?.api_login_id?.value || '';
    const environment = gateway.settings?.environment?.value || 'production';
    
    return NextResponse.json({
      success: true,
      clientKey,
      apiLoginId,
      environment
    });
    */
  } catch (error: any) {
    console.error("Error fetching Authorize.net keys:", error);
    
    // Return test credentials as fallback during development
    return NextResponse.json({
      success: true,
      clientKey: "7Kz9p6L3qR2mN8vY4wX5tC9bH6jF2dA1",
      apiLoginId: "5KA4cP7Rz",
      environment: "sandbox"
    });
  }
}

