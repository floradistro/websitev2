import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/vendor/campaigns/[campaignId]/channels - Get campaign channels
export async function GET(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const vendorId = request.headers.get("x-vendor-id");
  const { campaignId } = params;

  if (!vendorId) {
    return NextResponse.json({ error: "Vendor ID required" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Verify campaign ownership
    const { data: campaign } = await supabase
      .from("email_campaigns")
      .select("id")
      .eq("id", campaignId)
      .eq("vendor_id", vendorId)
      .single();

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Get channels
    const { data: channels, error } = await supabase
      .from("campaign_channels")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching channels:", error);
      return NextResponse.json(
        { error: "Failed to fetch channels" },
        { status: 500 }
      );
    }

    return NextResponse.json({ channels: channels || [] });
  } catch (error: any) {
    console.error("Error fetching channels:", error);
    return NextResponse.json(
      { error: "Failed to fetch channels", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/vendor/campaigns/[campaignId]/channels - Create channel
export async function POST(
  request: NextRequest,
  { params }: { params: { campaignId: string } }
) {
  const vendorId = request.headers.get("x-vendor-id");
  const { campaignId } = params;

  if (!vendorId) {
    return NextResponse.json({ error: "Vendor ID required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { channel, content, ai_generated, ai_prompt } = body;

    if (!channel || !content) {
      return NextResponse.json(
        { error: "Channel and content required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify campaign ownership
    const { data: campaign } = await supabase
      .from("email_campaigns")
      .select("id")
      .eq("id", campaignId)
      .eq("vendor_id", vendorId)
      .single();

    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Create channel
    const { data: newChannel, error } = await supabase
      .from("campaign_channels")
      .insert({
        campaign_id: campaignId,
        vendor_id: vendorId,
        channel,
        content,
        ai_generated: ai_generated || false,
        ai_prompt: ai_prompt || null,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating channel:", error);
      return NextResponse.json(
        { error: "Failed to create channel" },
        { status: 500 }
      );
    }

    return NextResponse.json({ channel: newChannel });
  } catch (error: any) {
    console.error("Error creating channel:", error);
    return NextResponse.json(
      { error: "Failed to create channel", details: error.message },
      { status: 500 }
    );
  }
}
