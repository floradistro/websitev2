import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/vendor/loyalty/stats
 * Get loyalty program statistics
 */
export async function GET(request: NextRequest) {
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendorId } = authResult;

  const supabase = getServiceSupabase();

  try {
    // Total members
    const { count: totalMembers } = await supabase
      .from("customer_loyalty")
      .select("*", { count: "exact", head: true })
      .eq("vendor_id", vendorId);

    // Active members (had transaction in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: activeCustomers } = await supabase
      .from("loyalty_transactions")
      .select("customer_id")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .limit(1000);

    const activeMembers = new Set(activeCustomers?.map((t) => t.customer_id) || []).size;

    // Points issued (sum of all earned transactions)
    const { data: issuedData } = await supabase
      .from("loyalty_transactions")
      .select("points")
      .eq("transaction_type", "earned");

    const pointsIssued = issuedData?.reduce((sum, t) => sum + t.points, 0) || 0;

    // Points redeemed (sum of all redeemed transactions)
    const { data: redeemedData } = await supabase
      .from("loyalty_transactions")
      .select("points")
      .eq("transaction_type", "redeemed");

    const pointsRedeemed = Math.abs(redeemedData?.reduce((sum, t) => sum + t.points, 0) || 0);

    return NextResponse.json({
      stats: {
        total_members: totalMembers || 0,
        active_members: activeMembers,
        points_issued: pointsIssued,
        points_redeemed: pointsRedeemed,
      },
    });
  } catch (error) {
    logger.error("Loyalty stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
