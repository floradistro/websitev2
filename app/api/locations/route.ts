/**
 * API: Locations
 * GET /api/locations
 * Fetches locations for component registry smart components
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

// Cache for 60 seconds, stale-while-revalidate for 120 seconds
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get("vendor_id");
    const locationIds = searchParams
      .get("location_ids")
      ?.split(",")
      .filter(Boolean);

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: "vendor_id is required" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    let query = supabase
      .from("locations")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("is_active", true);

    // Filter by specific location IDs
    if (locationIds && locationIds.length > 0) {
      query = query.in("id", locationIds);
    }

    query = query.order("name");

    const { data: locations, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        locations: locations || [],
        count: locations?.length || 0,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Locations API error:", error);
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch locations" },
      { status: 500 },
    );
  }
}
