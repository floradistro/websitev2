import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import { checkAIRateLimit, RateLimitConfigs } from "@/lib/rate-limiter";
import OpenAI from "openai";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
// Lazy-load OpenAI client
let openai: OpenAI | null = null;
function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
  }
  return openai;
}

// AI auto-tag image with GPT-4 Vision
async function analyzeImageWithAI(imageUrl: string) {
  try {
    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and return ONLY a JSON object with this exact structure:
{
  "category": "product_photos" | "social_media" | "print_marketing" | "promotional" | "brand_assets" | "menus",
  "tags": ["tag1", "tag2", "tag3"],
  "description": "Brief description",
  "colors": ["#hex1", "#hex2", "#hex3"],
  "quality_score": 1-100,
  "detected_content": {
    "has_text": boolean,
    "has_product": boolean,
    "has_logo": boolean,
    "has_people": boolean,
    "style": "photo" | "graphic" | "illustration"
  }
}

Categories:
- "product_photos": Product photography, product shots, packaged items
- "social_media": Instagram posts, Facebook ads, Stories, social media graphics
- "print_marketing": Flyers, posters, print ads, physical marketing materials
- "promotional": Promotional graphics, deals, event materials, special offers
- "brand_assets": Logos, brand elements, templates, style guides
- "menus": Menu boards, price lists, category headers, digital menus

Respond with ONLY the JSON, no other text.`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) return null;

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const analysis = JSON.parse(jsonMatch[0]);
    return analysis;
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ AI analysis error:", err.message);
    }
    return null;
  }
}

// POST - Re-analyze single image with AI
export async function POST(request: NextRequest) {
  try {
    // RATE LIMIT: AI image retagging
    const rateLimitResult = checkAIRateLimit(request, RateLimitConfigs.ai);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // SECURITY: Require vendor authentication
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json({ error: "File ID required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get the file
    const { data: file, error: fetchError } = await supabase
      .from("vendor_media")
      .select("*")
      .eq("id", fileId)
      .eq("vendor_id", vendorId)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Analyze with AI
    const aiAnalysis = await analyzeImageWithAI(file.file_url);

    if (!aiAnalysis) {
      return NextResponse.json(
        { error: "AI analysis failed" },
        { status: 500 },
      );
    }

    // Update metadata
    const { data: updated, error: updateError } = await supabase
      .from("vendor_media")
      .update({
        category: aiAnalysis.category,
        ai_tags: aiAnalysis.tags,
        ai_description: aiAnalysis.description,
        dominant_colors: aiAnalysis.colors,
        detected_content: aiAnalysis.detected_content,
        quality_score: aiAnalysis.quality_score,
        updated_at: new Date().toISOString(),
      })
      .eq("id", fileId)
      .select()
      .single();

    if (updateError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Update error:", updateError);
      }
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      file: updated,
      analysis: aiAnalysis,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
