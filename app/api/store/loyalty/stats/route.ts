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

    // Top 5 members by points balance
    const { data: topLoyalty } = await supabase
      .from("customer_loyalty")
      .select("customer_id, points_balance, points_lifetime_earned, current_tier")
      .eq("vendor_id", vendorId)
      .order("points_balance", { ascending: false })
      .limit(5);

    // Get customer details for top members
    const topMembers = [];
    if (topLoyalty && topLoyalty.length > 0) {
      const customerIds = topLoyalty.map((l) => l.customer_id);
      const { data: customers } = await supabase
        .from("customers")
        .select("id, first_name, last_name, email")
        .in("id", customerIds);

      const customerMap = new Map(customers?.map((c) => [c.id, c]) || []);

      for (const loyalty of topLoyalty) {
        const customer = customerMap.get(loyalty.customer_id);
        if (customer) {
          topMembers.push({
            id: customer.id,
            name: `${customer.first_name} ${customer.last_name}`.trim() || "Unknown",
            email: customer.email,
            points: loyalty.points_balance,
            lifetime_points: loyalty.points_lifetime_earned,
            tier: loyalty.current_tier || "bronze",
          });
        }
      }
    }

    return NextResponse.json({
      stats: {
        total_members: totalMembers || 0,
        active_members: activeMembers,
        points_issued: pointsIssued,
        points_redeemed: pointsRedeemed,
      },
      topMembers,
    });
  } catch (error) {
    logger.error("Loyalty stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
