import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

/**
 * Check if user has wholesale access
 * Only vendors and wholesale-approved customers have access
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // Get user from request headers or cookies
    const authHeader = request.headers.get("authorization");
    const userId = authHeader?.split("Bearer ")[1];

    if (!userId) {
      return NextResponse.json({
        hasAccess: false,
        reason: "Not authenticated",
      });
    }

    // Check if user is a vendor
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_type, wholesale_enabled")
      .eq("id", userId)
      .single();

    if (vendor && !vendorError) {
      return NextResponse.json({
        hasAccess: true,
        userType: "vendor",
        vendorType: vendor.vendor_type,
        wholesaleEnabled: vendor.wholesale_enabled,
      });
    }

    // Check if user is a wholesale-approved customer
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select(
        "id, is_wholesale_approved, wholesale_business_name, wholesale_application_status",
      )
      .eq("auth_user_id", userId)
      .single();

    if (customer && !customerError && customer.is_wholesale_approved) {
      return NextResponse.json({
        hasAccess: true,
        userType: "customer",
        wholesaleApproved: true,
        businessName: customer.wholesale_business_name,
      });
    }

    // Check if they have a pending application
    if (customer && customer.wholesale_application_status === "pending") {
      return NextResponse.json({
        hasAccess: false,
        reason: "Application pending review",
        applicationStatus: "pending",
      });
    }

    // No access
    return NextResponse.json({
      hasAccess: false,
      reason: "Not a vendor or wholesale-approved customer",
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Check wholesale access error:", error);
    }
    return NextResponse.json(
      { error: "Failed to check access", details: error.message },
      { status: 500 },
    );
  }
}
