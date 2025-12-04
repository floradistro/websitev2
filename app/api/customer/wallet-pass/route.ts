import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Supabase edge function URL
const WALLET_PASS_EDGE_FUNCTION = "https://uaednwpxursknmwdeejn.supabase.co/functions/v1/wallet-pass";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * GET /api/customer/wallet-pass?customer_id=xxx&vendor_id=xxx
 * Redirects to Supabase edge function for Apple Wallet pass generation
 *
 * PUBLIC ENDPOINT - No auth required (for QR code scanning)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customer_id");
    const vendorId = searchParams.get("vendor_id");

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 },
      );
    }

    // Build edge function URL with query params
    const edgeFunctionUrl = new URL(WALLET_PASS_EDGE_FUNCTION);
    edgeFunctionUrl.searchParams.set("customer_id", customerId);
    if (vendorId) {
      edgeFunctionUrl.searchParams.set("vendor_id", vendorId);
    }

    // Proxy to Supabase edge function
    const response = await fetch(edgeFunctionUrl.toString(), {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
        "apikey": SUPABASE_ANON_KEY,
        "Accept": "application/vnd.apple.pkpass",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Failed to generate wallet pass";
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        // Not JSON
      }
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status },
      );
    }

    // Return the .pkpass file
    const buffer = await response.arrayBuffer();
    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.pkpass",
        "Content-Disposition": `attachment; filename="loyalty-pass.pkpass"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
