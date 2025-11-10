/**
 * Marketing Stats API
 * Returns overview statistics for marketing dashboard
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireVendor } from "@/lib/auth/middleware";

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

    // Get vendor info to check provider
    const { data: vendor } = await supabase
      .from("vendors")
      .select("marketing_provider, marketing_config")
      .eq("id", vendorId)
      .single();

    let stats = {
      total_campaigns: 0,
      active_campaigns: 0,
      total_customers: 0,
      segment_count: 0,
      total_sent: 0,
      total_opened: 0,
      total_clicked: 0,
      total_revenue: 0,
      loyalty_members: 0,
    };

    if (vendor?.marketing_provider === "alpineiq") {
      // Get stats from AlpineIQ (via sync log or direct API)
      stats = await getAlpineIQStats(vendorId);
    } else {
      // Get stats from built-in system
      stats = await getBuiltInStats(vendorId);
    }

    return NextResponse.json(stats);
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Marketing stats error:", error);
    }
    return NextResponse.json(
      { error: "Failed to load marketing stats", message: error.message },
      { status: 500 },
    );
  }
}

async function getAlpineIQStats(vendorId: string): Promise<any> {
  // Get campaign stats from AlpineIQ sync log
  const { data: syncData } = await supabase
    .from("alpineiq_sync_log")
    .select("*")
    .eq("vendor_id", vendorId)
    .eq("entity_type", "campaign")
    .eq("status", "success");

  // Get customer count
  const { count: customerCount } = await supabase
    .from("alpineiq_customer_mapping")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", vendorId);

  // Get campaign events
  const { data: events } = await supabase
    .from("marketing_campaign_events")
    .select("event_type, attributed_revenue")
    .eq("vendor_id", vendorId)
    .eq("campaign_type", "alpineiq");

  const sent = events?.filter((e) => e.event_type === "sent").length || 0;
  const opened = events?.filter((e) => e.event_type === "opened").length || 0;
  const clicked = events?.filter((e) => e.event_type === "clicked").length || 0;
  const revenue =
    events?.reduce((sum, e) => sum + (e.attributed_revenue || 0), 0) || 0;

  return {
    total_campaigns: syncData?.length || 0,
    active_campaigns: 0, // Would need to query AlpineIQ API
    total_customers: customerCount || 0,
    segment_count: 0, // Would need to query AlpineIQ API
    total_sent: sent,
    total_opened: opened,
    total_clicked: clicked,
    total_revenue: revenue,
  };
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
  const opened =
    campaigns?.reduce((sum, c) => sum + (c.total_opened || 0), 0) || 0;
  const clicked =
    campaigns?.reduce((sum, c) => sum + (c.total_clicked || 0), 0) || 0;
  const revenue =
    campaigns?.reduce((sum, c) => sum + (c.total_revenue || 0), 0) || 0;

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
