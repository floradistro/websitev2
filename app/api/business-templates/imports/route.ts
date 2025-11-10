/**
 * API: Vendor Template Imports
 * GET - Get all templates imported by a vendor
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendor_id");

    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID is required" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    const { data: imports, error } = await supabase
      .from("vendor_template_imports")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("imported_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      imports: imports || [],
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Get template imports error:", error);
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch imports" },
      { status: 500 },
    );
  }
}
