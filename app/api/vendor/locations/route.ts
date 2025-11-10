import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

export async function GET(request: NextRequest) {
  try {
    // Support both header and query parameter
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: "Vendor ID required" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("is_active", true)
      .order("is_primary", { ascending: false })
      .order("name");

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error loading vendor locations:", error);
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, locations: data || [] });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error in vendor locations API:", error);
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;
    const body = await request.json();
    const { action, location_id, ...data } = body;

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: "Vendor ID required" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    if (action === "update") {
      // Vendors can only update contact info
      const updateData: any = {};
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.email !== undefined) updateData.email = data.email;

      if (Object.keys(updateData).length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "No valid fields to update",
          },
          { status: 400 },
        );
      }

      // Verify location belongs to vendor
      const { data: location, error: verifyError } = await supabase
        .from("locations")
        .select("vendor_id")
        .eq("id", location_id)
        .maybeSingle();

      if (verifyError) {
        if (process.env.NODE_ENV === "development") {
          console.error("❌ Error fetching location:", verifyError);
        }
        return NextResponse.json(
          {
            success: false,
            error: "Database error",
          },
          { status: 500 },
        );
      }

      if (!location || location.vendor_id !== vendorId) {
        return NextResponse.json(
          {
            success: false,
            error: "Location not found or access denied",
          },
          { status: 403 },
        );
      }

      const { error } = await supabase
        .from("locations")
        .update(updateData)
        .eq("id", location_id)
        .eq("vendor_id", vendorId);

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Location updated successfully",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action",
      },
      { status: 400 },
    );
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error in vendor locations API:", error);
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
