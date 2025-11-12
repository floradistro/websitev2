import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/vendor/campaigns/generate - AI-generate a new campaign
export async function POST(request: NextRequest) {
  const vendorId = request.headers.get("x-vendor-id");

  if (!vendorId) {
    return NextResponse.json({ error: "Vendor ID required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { prompt, audience, subject, html_content, name } = body;

    console.log('🔍 [API GENERATE] Received payload:', {
      hasPrompt: !!prompt,
      hasSubject: !!subject,
      hasHtmlContent: !!html_content,
      htmlContentLength: html_content?.length || 0,
      htmlPreview: html_content?.substring(0, 100),
    });

    // Support both old format (prompt only) and new format (with AI-generated content)
    const isAIGenerated = html_content && subject;
    console.log(`🔍 [API GENERATE] isAIGenerated: ${isAIGenerated}`);

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Campaign prompt required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Get vendor info for personalization
    const { data: vendor } = await supabase
      .from("vendors")
      .select("store_name, email")
      .eq("id", vendorId)
      .single();

    // Prepare campaign data
    const campaignName = name || prompt.slice(0, 100);
    const campaignSubject = subject || `Email from ${vendor?.store_name || "Your Store"}`;

    // Use AI-generated HTML if provided, otherwise use placeholder
    const htmlContent = html_content || `<p>AI will generate beautiful content here based on: ${prompt}</p>`;

    // Extract text content from HTML if AI-generated
    let textContent = `AI will generate beautiful content here based on: ${prompt}`;
    if (isAIGenerated && html_content) {
      // Simple text extraction - remove HTML tags and excessive whitespace
      textContent = html_content
        .replace(/<style[^>]*>.*?<\/style>/gis, '')
        .replace(/<script[^>]*>.*?<\/script>/gis, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 500); // Limit to 500 chars for text preview
    }

    // Create draft campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .insert({
        vendor_id: vendorId,
        name: campaignName,
        subject: campaignSubject,
        from_name: vendor?.store_name || "Your Store",
        from_email: vendor?.email || "noreply@example.com",
        segment_type: audience === "all" ? "all_customers" : "loyalty_members",
        status: "draft",
        html_content: htmlContent,
        text_content: textContent,
      })
      .select()
      .single();

    if (campaignError) {
      console.error("Error creating campaign:", campaignError);
      return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
    }

    console.log(`✅ Campaign created: ${campaign.name} (${isAIGenerated ? 'AI-generated' : 'placeholder'} content)`);

    return NextResponse.json({
      campaign,
      message: isAIGenerated
        ? "Campaign created successfully with AI-generated content!"
        : "Campaign created successfully. AI generation will be added soon!",
    });
  } catch (error) {
    console.error("Error in campaign generate API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
