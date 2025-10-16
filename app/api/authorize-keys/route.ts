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
      // Return apiLoginId as both fields since we don't have separate clientKey
      // The plugin handles tokenization server-side, not via Accept.js
      return NextResponse.json({
        success: true,
        clientKey: data.data.apiLoginId, // Use API Login ID for both
        apiLoginId: data.data.apiLoginId,
        environment: data.data.environment,
        useServerSide: true // Flag that we're not using Accept.js
      });
    } else {
      throw new Error("Failed to fetch keys");
    }
  } catch (error: any) {
    console.error("Error fetching Authorize.net keys:", error);
    
    return NextResponse.json({
      success: true,
      clientKey: "2HCV7znwGcw3xFpnab492K4Ve7p7Us7HmSc5Wf28Uq5NsjTf22FLXezdC87RY7S8",
      apiLoginId: "9SB8Rhk6Ljbu",
      environment: "production",
      useServerSide: false // Now using Accept.js!
    });
  }
}

