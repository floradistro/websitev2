import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

// Vercel serverless function timeout: 60 seconds for AI generation
export const maxDuration = 60;

// POST /api/vendor/campaigns/generate-react - Generate React Email component with Claude
export async function POST(request: NextRequest) {
  const vendorId = request.headers.get("x-vendor-id");

  if (!vendorId) {
    return NextResponse.json({ error: "Vendor ID required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { prompt, context } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: "Prompt required" }, { status: 400 });
    }

    const supabase = await createClient();

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

    // Get context data if provided
    let productData = null;
    let mediaData = null;
    let customerData = null;

    if (context?.productIds && context.productIds.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, name, description, short_description, regular_price, featured_image_storage, custom_fields")
        .in("id", context.productIds)
        .eq("vendor_id", vendorId)
        .limit(5);
      productData = products;
    }

    if (context?.mediaIds && context.mediaIds.length > 0) {
      const { data: media } = await supabase
        .from("vendor_media")
        .select("id, file_url, alt_text, title, ai_description")
        .in("id", context.mediaIds)
        .eq("vendor_id", vendorId)
        .limit(5);
      mediaData = media;
    }

    if (context?.segmentType) {
      // Get sample customer data for personalization context
      const { data: customers } = await supabase
        .from("customers")
        .select("first_name, loyalty_tier, loyalty_points, total_orders, lifetime_value")
        .eq("vendor_id", vendorId)
        .limit(3);
      customerData = customers;
    }

    // Construct store URL
    const storeUrl = vendor?.vercel_deployment_url
      ? `https://${vendor.vercel_deployment_url}`
      : vendor?.slug
      ? `https://floradistro.com/${vendor.slug}`
      : "https://floradistro.com";

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log(`🤖 Generating React Email with Claude for: "${prompt}"`);

    // Build context-aware system prompt
    const systemPrompt = `You are an expert email marketing designer for cannabis dispensaries. Your job is to generate beautiful, high-converting marketing emails as HTML.

BRAND CONTEXT:
Store Name: ${vendor.store_name}
Store URL: ${storeUrl}
Brand Colors: ${JSON.stringify(vendor.brand_colors || {})}
Logo: ${vendor.logo_url || 'Not provided'}

${productData ? `PRODUCTS TO FEATURE:\n${JSON.stringify(productData, null, 2)}` : ''}
${mediaData ? `AVAILABLE MEDIA:\n${JSON.stringify(mediaData, null, 2)}` : ''}
${customerData ? `CUSTOMER CONTEXT:\n${JSON.stringify(customerData, null, 2)}` : ''}

CRITICAL REQUIREMENTS:
1. Generate a complete HTML email (including <!DOCTYPE html>, <html>, <head>, <body> tags)
2. Use INLINE STYLES ONLY (no CSS classes, no external stylesheets)
3. Use brand colors from the context
4. Make it mobile-responsive with max-width: 600px
5. Use email-safe HTML (tables for layout, not flexbox/grid)
6. Include the store logo if provided
7. Include unsubscribe link at bottom
8. Make it visually beautiful and modern (2025 design standards)
9. Be cannabis-compliant (no health claims, age-gate mentions)
10. Add a hidden preheader text after opening <body> tag for email clients

RESPOND WITH ONLY THE HTML - NO EXPLANATIONS, NO MARKDOWN CODE BLOCKS, JUST THE RAW HTML CODE.

The HTML should be production-ready and render perfectly in all major email clients (Gmail, Outlook, Apple Mail, etc).`;

    const userPrompt = `Create an email for: ${prompt}

${context?.additionalContext ? `Additional context: ${context.additionalContext}` : ''}

Generate beautiful, engaging email JSX now.`;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    let generatedHTML = response.content[0].type === "text"
      ? response.content[0].text
      : "";

    // Strip markdown code blocks if Claude wrapped the HTML
    if (generatedHTML.trim().startsWith('```')) {
      generatedHTML = generatedHTML.trim().replace(/^```[a-z]*\n?/, '').replace(/\n?```$/, '').trim();
    }

    // Extract subject line from title tag or first h1
    const titleMatch = generatedHTML.match(/<title>(.*?)<\/title>/i);
    const h1Match = generatedHTML.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const subject = titleMatch ? titleMatch[1] : h1Match ? h1Match[1].replace(/<[^>]*>/g, '') : `New campaign from ${vendor.store_name}`;

    console.log(`✅ Generated ${generatedHTML.length} characters of HTML`);

    return NextResponse.json({
      success: true,
      html: generatedHTML,
      subject,
      metadata: {
        model: "claude-sonnet-4-20250514",
        tokens: response.usage.output_tokens,
        vendor: {
          name: vendor.store_name,
          colors: vendor.brand_colors,
          logo: vendor.logo_url,
        },
      },
    });
  } catch (error: any) {
    console.error("Error generating React Email:", error);
    return NextResponse.json(
      {
        error: "Failed to generate email",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
