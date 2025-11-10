import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { withErrorHandler } from "@/lib/api-handler";
import { requireVendor } from "@/lib/auth/middleware";
import OpenAI from "openai";

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
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    // Generate image with DALL-E 3
    const response = await getOpenAI().images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image generation failed" },
        { status: 500 },
      );
    }

    // Download the generated image
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to download generated image" },
        { status: 500 },
      );
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    const supabase = getServiceSupabase();

    // Generate filename
    const timestamp = Date.now();
    const sanitizedPrompt = prompt
      .substring(0, 30)
      .replace(/[^a-zA-Z0-9]/g, "-");
    const fileName = `ai-generated-${sanitizedPrompt}-${timestamp}.png`;
    const filePath = `${vendorId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("vendor-product-images")
      .upload(filePath, imageBuffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      if (process.env.NODE_ENV === "development") {
        console.error("❌ Upload error:", uploadError);
      }
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("vendor-product-images").getPublicUrl(filePath);

    // Save to database with metadata
    const { data: mediaRecord, error: dbError } = await supabase
      .from("vendor_media")
      .insert({
        vendor_id: vendorId,
        file_name: fileName,
        file_path: filePath,
        file_url: publicUrl,
        file_size: imageBuffer.length,
        file_type: "image/png",
        category: category,
        ai_tags: ["ai-generated", "dall-e"],
        ai_description: prompt,
        title: `AI Generated: ${prompt.substring(0, 50)}`,
        detected_content: {
          has_text: false,
          has_product: false,
          has_logo: false,
          has_people: false,
          style: "illustration",
          ai_generated: true,
        },
        quality_score: 85,
        status: "active",
      })
      .select()
      .single();

    if (dbError) {
      if (process.env.NODE_ENV === "development") {
        console.error("❌ Database error:", dbError);
      }
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      file: mediaRecord,
      prompt: prompt,
      message: "Image generated successfully",
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error:", error);
    }
    return NextResponse.json(
      {
        error: error.message || "Failed to generate image",
      },
      { status: 500 },
    );
  }
});
