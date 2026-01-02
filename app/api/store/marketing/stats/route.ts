/**
 * Marketing Stats API
 * Returns overview statistics for marketing dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    // Get stats from built-in system
    const stats = await getBuiltInStats(vendorId);

    return NextResponse.json(stats);
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Marketing stats error:", err);
    }
    return NextResponse.json(
      { error: "Failed to load marketing stats", message: err.message },
      { status: 500 },
    );
  }
}

async function getBuiltInStats(vendorId: string): Promise<any> {
  // Get campaign counts
  const { count: totalCampaigns } = await supabase
    .from("email_campaigns")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", vendorId);

  const { count: activeCampaigns } = await supabase
    .from("email_campaigns")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", vendorId)
    .in("status", ["scheduled", "sending"]);

  // Get customer count for THIS vendor only
  const { count: customerCount } = await supabase
    .from("vendor_customers")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", vendorId);

  // Get segment count
  const { count: segmentCount } = await supabase
    .from("customer_segments")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", vendorId);

  // Get campaign stats
  const { data: campaigns } = await supabase
    .from("email_campaigns")
    .select("total_sent, total_opened, total_clicked, total_revenue")
    .eq("vendor_id", vendorId);

  const sent = campaigns?.reduce((sum, c) => sum + (c.total_sent || 0), 0) || 0;
  const opened = campaigns?.reduce((sum, c) => sum + (c.total_opened || 0), 0) || 0;
  const clicked = campaigns?.reduce((sum, c) => sum + (c.total_clicked || 0), 0) || 0;
  const revenue = campaigns?.reduce((sum, c) => sum + (c.total_revenue || 0), 0) || 0;

  // Get loyalty members
  const { count: loyaltyMembers } = await supabase
    .from("customer_loyalty")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", vendorId)
    .gt("points_balance", 0);

  return {
    total_campaigns: totalCampaigns || 0,
    active_campaigns: activeCampaigns || 0,
    total_customers: customerCount || 0,
    segment_count: segmentCount || 0,
    total_sent: sent,
    total_opened: opened,
    total_clicked: clicked,
    total_revenue: revenue,
    loyalty_members: loyaltyMembers || 0,
  };
}
