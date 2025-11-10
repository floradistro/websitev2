import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/vendor/analytics/v2/test-data
 * Test endpoint to check if data exists and is accessible
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    // Check orders
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("vendor_id", vendorId)
      .limit(5);

    if (ordersError) throw ordersError;

    // Check POS transactions
    const { data: posTransactions, error: posError } = await supabase
      .from("pos_transactions")
      .select("*")
      .eq("vendor_id", vendorId)
      .limit(5);

    if (posError) throw posError;

    // Check order items
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("vendor_id", vendorId)
      .limit(5);

    if (itemsError) throw itemsError;

    // Get counts
    const { count: orderCount } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("vendor_id", vendorId);

    const { count: posCount } = await supabase
      .from("pos_transactions")
      .select("*", { count: "exact", head: true })
      .eq("vendor_id", vendorId);

    return NextResponse.json({
      success: true,
      vendorId,
      counts: {
        orders: orderCount,
        posTransactions: posCount,
        orderItems: orderItems?.length,
      },
      samples: {
        orders: orders?.slice(0, 2),
        posTransactions: posTransactions?.slice(0, 2),
        orderItems: orderItems?.slice(0, 2),
      },
    });
  } catch (error: any) {
    console.error("Test data error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch test data" },
      { status: 500 },
    );
  }
}
