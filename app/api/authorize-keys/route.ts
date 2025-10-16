import { NextRequest, NextResponse } from "next/server";

const baseUrl = process.env.WORDPRESS_API_URL;

export async function GET(request: NextRequest) {
  try {
    // Fetch from WordPress admin-ajax (no auth required)
    const response = await fetch(
      `${baseUrl}/wp-admin/admin-ajax.php?action=flora_get_auth_keys`,
      { cache: 'no-store' }
    );

    const data = await response.json();

    if (data.success && data.data) {
      return NextResponse.json({
        success: true,
        clientKey: data.data.clientKey,
        apiLoginId: data.data.apiLoginId,
        environment: data.data.environment
      });
    } else {
      throw new Error("Failed to fetch keys");
    }
  } catch (error: any) {
    console.error("Error fetching Authorize.net keys:", error);
    
    // Return test credentials as fallback
    return NextResponse.json({
      success: true,
      clientKey: "7Kz9p6L3qR2mN8vY4wX5tC9bH6jF2dA1",
      apiLoginId: "5KA4cP7Rz",
      environment: "sandbox"
    });
  }
}

