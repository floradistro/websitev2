import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/vendor/campaigns - List all campaigns for vendor
export async function GET(request: NextRequest) {
  const vendorId = request.headers.get("x-vendor-id");

  if (!vendorId) {
    return NextResponse.json({ error: "Vendor ID required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Get campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (campaignsError) {
      console.error("Error fetching campaigns:", campaignsError);
      return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
    }

    // Calculate stats
    const stats = {
      total: campaigns?.length || 0,
      sent: campaigns?.filter((c) => c.status === "sent").length || 0,
      scheduled: campaigns?.filter((c) => c.status === "scheduled").length || 0,
      drafts: campaigns?.filter((c) => c.status === "draft").length || 0,
      avgOpenRate: 0,
      avgClickRate: 0,
    };

    // Calculate average open and click rates
    const sentCampaigns = campaigns?.filter((c) => c.status === "sent" && c.total_sent > 0) || [];
    if (sentCampaigns.length > 0) {
      const totalOpenRate = sentCampaigns.reduce((sum, c) => {
        return sum + (c.total_sent > 0 ? (c.total_opened / c.total_sent) * 100 : 0);
      }, 0);
      const totalClickRate = sentCampaigns.reduce((sum, c) => {
        return sum + (c.total_sent > 0 ? (c.total_clicked / c.total_sent) * 100 : 0);
      }, 0);

      stats.avgOpenRate = parseFloat((totalOpenRate / sentCampaigns.length).toFixed(1));
      stats.avgClickRate = parseFloat((totalClickRate / sentCampaigns.length).toFixed(1));
    }

    return NextResponse.json({
      campaigns: campaigns || [],
      stats,
    });
  } catch (error) {
    console.error("Error in campaigns API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
