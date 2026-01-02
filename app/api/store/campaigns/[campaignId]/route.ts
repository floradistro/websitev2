import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/vendor/campaigns/[campaignId] - Get campaign details
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

    const { data: campaign, error } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("vendor_id", vendorId)
      .single();

    if (error || !campaign) {
      console.error("Error fetching campaign:", error);
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ campaign });
  } catch (error: any) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign", details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/vendor/campaigns/[campaignId] - Update campaign
export async function PATCH(
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
    const supabase = await createClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from("email_campaigns")
      .select("id")
      .eq("id", campaignId)
      .eq("vendor_id", vendorId)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Update campaign
    const { data: campaign, error } = await supabase
      .from("email_campaigns")
      .update(body)
      .eq("id", campaignId)
      .select()
      .single();

    if (error) {
      console.error("Error updating campaign:", error);
      return NextResponse.json(
        { error: "Failed to update campaign" },
        { status: 500 }
      );
    }

    return NextResponse.json({ campaign });
  } catch (error: any) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/vendor/campaigns/[campaignId] - Delete campaign
export async function DELETE(
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

    // Verify ownership and delete
    const { error } = await supabase
      .from("email_campaigns")
      .delete()
      .eq("id", campaignId)
      .eq("vendor_id", vendorId);

    if (error) {
      console.error("Error deleting campaign:", error);
      return NextResponse.json(
        { error: "Failed to delete campaign" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign", details: error.message },
      { status: 500 }
    );
  }
}
