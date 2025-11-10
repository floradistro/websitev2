import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { requireVendor } from "@/lib/auth/middleware";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
// Lazy-load OpenAI client to avoid build-time errors
let openai: OpenAI | null = null;
function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });
  }
  return openai;
}

/**
 * POST /api/vendor/media/reimagine
 * Analyze an image with GPT-4 Vision and recreate it with DALL-E
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const {
      imageUrl,
      fileName,
      instructions,
      size = "1024x1024",
      quality = "standard",
      style = "vivid",
    } = body;

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL required" }, { status: 400 });
    }

    // Step 1: Analyze the image with GPT-4 Vision to create a prompt
    const basePrompt = instructions
      ? `Analyze this image and create a detailed DALL-E prompt to recreate it with these modifications: "${instructions}". Focus on: composition, style, colors, mood, subjects, lighting, and key visual elements. Make the prompt vivid and detailed (2-3 sentences max). Do not include any preamble, just the prompt.`
      : "Analyze this image and create a detailed DALL-E prompt to recreate it. Focus on: composition, style, colors, mood, subjects, lighting, and key visual elements. Make the prompt vivid and detailed (2-3 sentences max). Do not include any preamble, just the prompt.";

    const visionResponse = await getOpenAI().chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: basePrompt,
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
      max_tokens: 300,
    });

    const generatedPrompt = visionResponse.choices[0]?.message?.content?.trim();

    if (!generatedPrompt) {
      throw new Error("Failed to generate prompt from image");
    }

    // Step 2: Generate new image with DALL-E using the generated prompt
    const dalleResponse = await getOpenAI().images.generate({
      model: "dall-e-3",
      prompt: generatedPrompt,
      n: 1,
      size: size as "1024x1024" | "1024x1792" | "1792x1024",
      quality: quality as "standard" | "hd",
      style: style as "vivid" | "natural",
    });

    const imageData = dalleResponse.data?.[0];
    if (!imageData?.url) {
      throw new Error("No image URL returned from DALL-E");
    }

    const newImageUrl = imageData.url;

    // Step 3: Download the generated image
    const imageResponse = await fetch(newImageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBlob = new Blob([imageBuffer], { type: "image/png" });

    // Step 4: Generate filename with "-reimagined" suffix
    const timestamp = Date.now();
    const fileNameWithoutExt = (fileName || "image").replace(/\.[^/.]+$/, "");
    const newFileName = `${fileNameWithoutExt}-reimagined-${timestamp}.png`;

    // Step 5: Upload to Supabase
    const supabase = getServiceSupabase();
    const filePath = `${vendorId}/${newFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("vendor-product-images")
      .upload(filePath, imageBlob, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Upload error:", uploadError);
      }
      throw uploadError;
    }

    // Step 6: Get public URL
    const { data: urlData } = supabase.storage.from("vendor-product-images").getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    return NextResponse.json({
      success: true,
      file: {
        name: newFileName,
        url: publicUrl,
        size: imageBlob.size,
        type: "image/png",
        generated_prompt: generatedPrompt,
        revised_prompt: imageData?.revised_prompt,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Reimagine error:", error);
    }
    return NextResponse.json(
      { error: error.message || "Failed to reimagine image" },
      { status: 500 },
    );
  }
}

// Bulk reimagine
export async function PUT(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { files, instructions, size = "1024x1024", quality = "standard", style = "vivid" } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: "Files array required" }, { status: 400 });
    }

    const results: any[] = [];
    const errors: any[] = [];

    // Process sequentially to avoid rate limits
    for (const file of files) {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/vendor/media/reimagine`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-vendor-id": vendorId,
          },
          body: JSON.stringify({
            imageUrl: file.url,
            fileName: file.name,
            instructions,
            size,
            quality,
            style,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to reimagine image");
        }

        results.push({
          success: true,
          originalName: file.name,
          newName: data.file.name,
          url: data.file.url,
          prompt: data.file.generated_prompt,
        });
      } catch (err: any) {
        if (process.env.NODE_ENV === "development") {
          logger.error(`❌ Failed ${file.name}:`, err);
        }
        errors.push({
          fileName: file.name,
          error: err.message,
        });
      }

      // Add delay between requests to avoid rate limits
      if (files.indexOf(file) < files.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
