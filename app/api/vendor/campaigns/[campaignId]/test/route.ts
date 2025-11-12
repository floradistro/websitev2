import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { render } from "@react-email/render";
import { sendEmail } from "@/lib/email/resend-client";
import CampaignEmail from "@/emails/CampaignEmail";

// POST /api/vendor/campaigns/[campaignId]/test - Send test email
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
    const { testEmail } = body;

    if (!testEmail || !testEmail.trim()) {
      return NextResponse.json({ error: "Test email address required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const supabase = await createClient();

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("vendor_id", vendorId)
      .single();

    if (campaignError || !campaign) {
      console.error("Error fetching campaign:", campaignError);
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Get vendor details for branding
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("store_name, slug, logo_url, brand_colors, vercel_deployment_url")
      .eq("id", vendorId)
      .single();

    if (vendorError) {
      console.error("Error fetching vendor:", vendorError);
      return NextResponse.json(
        { error: "Failed to fetch vendor details" },
        { status: 500 }
      );
    }

    // Construct store URL
    const storeUrl = vendor?.vercel_deployment_url
      ? `https://${vendor.vercel_deployment_url}`
      : vendor?.slug
      ? `https://floradistro.com/${vendor.slug}`
      : "https://floradistro.com";

    const unsubscribeUrl = `${storeUrl}/unsubscribe`;

    // Extract brand colors if available
    const brandColors = vendor?.brand_colors || {};
    const primaryColor = brandColors.primary || '#8b5cf6';
    const accentColor = brandColors.accent || brandColors.secondary || '#a78bfa';

    // Check if html_content is a complete HTML document (AI-generated)
    // or just a fragment (needs wrapping in CampaignEmail template)
    const isCompleteHtml = campaign.html_content?.trim().toLowerCase().startsWith('<!doctype') ||
                          campaign.html_content?.trim().toLowerCase().startsWith('<html');

    let emailHtml: string;

    if (isCompleteHtml) {
      // Claude generated a complete HTML email - use it directly
      console.log('📧 Using AI-generated complete HTML email');
      emailHtml = campaign.html_content;
    } else {
      // Legacy or partial content - wrap in CampaignEmail template
      console.log('📧 Wrapping content in CampaignEmail template');
      emailHtml = await render(
        CampaignEmail({
          subject: campaign.subject,
          storeName: campaign.from_name || vendor?.store_name || "Your Store",
          storeUrl,
          logoUrl: vendor?.logo_url || '',
          htmlContent: campaign.html_content,
          textContent: campaign.text_content,
          unsubscribeUrl,
          primaryColor,
          accentColor,
        })
      );
    }

    // Send test email via Resend
    console.log(`📧 Sending test email to ${testEmail} for campaign: ${campaign.name}`);

    const result = await sendEmail({
      to: testEmail,
      subject: `[TEST] ${campaign.subject}`,
      html: emailHtml,
      from: `${campaign.from_name || vendor?.store_name} <noreply@floradistro.com>`,
      replyTo: campaign.from_email,
    });

    console.log(`✅ Test email sent successfully! Email ID: ${result.emailId}`);

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
      emailId: result.emailId,
    });
  } catch (error: any) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      {
        error: "Failed to send test email",
        details: error.message
      },
      { status: 500 }
    );
  }
}
