import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

/**
 * Get distributor vendors
 * Only accessible to vendors and wholesale-approved customers
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search");

    const offset = (page - 1) * limit;

    // Build query for distributor vendors
    let query = supabase
      .from("vendors")
      .select(
        `
        *,
        products:products(count)
      `,
        { count: "exact" },
      )
      .in("vendor_type", ["distributor", "both"])
      .eq("status", "active")
      .eq("wholesale_enabled", true);

    // Search
    if (search) {
      query = query.or(`store_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Pagination
    query = query
      .range(offset, offset + limit - 1)
      .order("store_name", { ascending: true });

    const { data: distributors, error, count } = await query;

    if (error) {
      console.error("Get distributors error:", error);
      return NextResponse.json(
        { error: "Failed to get distributors", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      distributors: distributors || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error: any) {
    console.error("Get distributors error:", error);
    return NextResponse.json(
      { error: "Failed to get distributors", details: error.message },
      { status: 500 },
    );
  }
}
