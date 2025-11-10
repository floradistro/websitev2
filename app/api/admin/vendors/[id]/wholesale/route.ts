import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
/**
 * Update vendor wholesale settings
 * Admin only
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getServiceSupabase();
    const { id: vendorId } = await params;
    const body = await request.json();

    const {
      vendor_type,
      wholesale_enabled,
      minimum_order_amount,
      distributor_terms,
      distributor_license_number,
      distributor_license_expiry,
    } = body;

    // Validate vendor_type
    if (vendor_type && !["standard", "distributor", "both"].includes(vendor_type)) {
      return NextResponse.json({ error: "Invalid vendor type" }, { status: 400 });
    }

    // Update vendor
    const { data: vendor, error: updateError } = await supabase
      .from("vendors")
      .update({
        vendor_type: vendor_type || "standard",
        wholesale_enabled: wholesale_enabled || false,
        minimum_order_amount: minimum_order_amount || 0,
        distributor_terms: distributor_terms || null,
        distributor_license_number: distributor_license_number || null,
        distributor_license_expiry: distributor_license_expiry || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vendorId)
      .select()
      .single();

    if (updateError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Update vendor error:", updateError);
      }
      return NextResponse.json(
        { error: "Failed to update vendor", details: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      vendor,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Update vendor wholesale settings error:", error);
    }
    return NextResponse.json(
      { error: "Failed to update settings", details: error.message },
      { status: 500 },
    );
  }
}

/**
 * Get vendor wholesale settings
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getServiceSupabase();
    const { id: vendorId } = await params;

    const { data: vendor, error } = await supabase
      .from("vendors")
      .select(
        `
        *,
        products:products(count)
      `,
      )
      .eq("id", vendorId)
      .single();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Get vendor error:", error);
      }
      return NextResponse.json(
        { error: "Vendor not found", details: error.message },
        { status: 404 },
      );
    }

    return NextResponse.json({ vendor });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Get vendor wholesale settings error:", error);
    }
    return NextResponse.json(
      { error: "Failed to get settings", details: error.message },
      { status: 500 },
    );
  }
}
