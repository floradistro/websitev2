import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { withErrorHandler } from "@/lib/api-handler";
import { requireVendor } from "@/lib/auth/middleware";
import OpenAI from "openai";

import { logger } from "@/lib/logger";
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

// POST - Generate image with DALL-E
export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    // SECURITY: Require vendor authentication
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { prompt, category = "product_photos" } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Generate image with DALL-E 3
    // Using HD quality for better detail and consistency
    // Style set to "natural" for more realistic, less dramatic results
    const response = await getOpenAI().images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd", // Upgraded from "standard" to "hd" for finer details
      style: "natural", // "natural" = more realistic, "vivid" = hyper-real/dramatic
      response_format: "url",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
    }

    // Download and store temporarily in our storage
    // This prevents DALL-E URL expiration issues
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Failed to download generated image" }, { status: 500 });
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const supabase = getServiceSupabase();

    // Store in temp location for approval workflow
    const timestamp = Date.now();
    const tempFileName = `temp-${timestamp}.png`;
    const tempFilePath = `${vendorId}/temp/${tempFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("vendor-product-images")
      .upload(tempFilePath, imageBuffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      logger.error("Temp upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL for temp file
    const {
      data: { publicUrl },
    } = supabase.storage.from("vendor-product-images").getPublicUrl(tempFilePath);

    // Return temp URL for approval workflow
    return NextResponse.json({
      success: true,
      tempUrl: publicUrl,
      tempPath: tempFilePath, // Include path so we can clean up later
      prompt: prompt,
      message: "Image generated successfully (pending approval)",
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", error);
    }
    return NextResponse.json(
      {
        error: error.message || "Failed to generate image",
      },
      { status: 500 },
    );
  }
});
