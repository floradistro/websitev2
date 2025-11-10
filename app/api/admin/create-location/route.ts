import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireAdmin } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Emergency endpoint to create a default location for a vendor
 * Only use this if vendor has no locations and needs one
 */
export async function POST(request: NextRequest) {
  // SECURITY: Require admin authentication
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { vendorEmail } = await request.json();

    if (!vendorEmail) {
      return NextResponse.json({ error: "vendorEmail is required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get vendor
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("email", vendorEmail)
      .single();

    if (vendorError || !vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Check if location already exists
    const { data: existingLocations } = await supabase
      .from("locations")
      .select("*")
      .eq("vendor_id", vendor.id);

    if (existingLocations && existingLocations.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Location already exists",
        locations: existingLocations,
      });
    }

    // Create default location
    const { data: location, error: locationError } = await supabase
      .from("locations")
      .insert({
        vendor_id: vendor.id,
        name: "Main Location",
        address: "123 Main St",
        city: "Charlotte",
        state: "NC",
        zip_code: "28201",
        phone: "(704) 555-0100",
        is_active: true,
        pos_enabled: true,
      })
      .select()
      .single();

    if (locationError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error creating location:", locationError);
      }
      return NextResponse.json(
        { error: "Failed to create location", details: locationError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Location created successfully",
      location,
      note: "Please log out and log back in to see the location",
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Create location error:", err);
    }
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 },
    );
  }
}
