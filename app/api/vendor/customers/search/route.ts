import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/vendor/customers/search - Search customers by name or email
export async function GET(request: NextRequest) {
  const vendorId = request.headers.get("x-vendor-id");

  if (!vendorId) {
    return NextResponse.json({ error: "Vendor ID required" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const limit = parseInt(searchParams.get("limit") || "50");

  if (!query || query.trim().length < 2) {
    return NextResponse.json(
      { error: "Search query must be at least 2 characters" },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    console.log(`🔍 Searching customers for vendor ${vendorId} with query: "${query}"`);

    // Search by email or name (metadata->name field)
    // Using ilike for case-insensitive partial matching
    const { data: customers, error } = await supabase
      .from("customers")
      .select("id, email, metadata, loyalty_points, loyalty_tier, created_at")
      .eq("vendor_id", vendorId)
      .or(`email.ilike.%${query}%,metadata->>first_name.ilike.%${query}%,metadata->>last_name.ilike.%${query}%`)
      .limit(limit)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error searching customers:", error);
      return NextResponse.json(
        { error: "Failed to search customers", details: error },
        { status: 500 }
      );
    }

    // Format customer data for easy consumption
    const formattedCustomers = customers?.map((customer) => {
      const metadata = customer.metadata || {};
      const firstName = metadata.first_name || "";
      const lastName = metadata.last_name || "";
      const fullName = `${firstName} ${lastName}`.trim() || "Unknown";

      return {
        id: customer.id,
        email: customer.email,
        name: fullName,
        firstName,
        lastName,
        loyaltyPoints: customer.loyalty_points || 0,
        loyaltyTier: customer.loyalty_tier,
        createdAt: customer.created_at,
      };
    }) || [];

    console.log(`✅ Found ${formattedCustomers.length} customers matching "${query}"`);

    return NextResponse.json({
      customers: formattedCustomers,
      total: formattedCustomers.length,
      query,
    });
  } catch (error) {
    console.error("Error in customer search API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
