import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 120; // Allow up to 2 minutes for AI processing

export async function POST(request: NextRequest) {
  // SECURITY: Require vendor authentication
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const supabase = await createClient();
    const vendorId = request.headers.get("x-vendor-id");
    if (!vendorId) {
      return NextResponse.json(
        { error: "Vendor ID required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { imageUrl, maskDataUrl, prompt, fileName } = body;

    if (!imageUrl || !maskDataUrl || !prompt) {
      return NextResponse.json(
        { error: "Image URL, mask, and prompt required" },
        { status: 400 },
      );
    }

    logger.info("AI Reimagine request", {
      imageUrl,
      prompt,
      hasMask: !!maskDataUrl,
    });

    // Check if REPLICATE_API_TOKEN is set
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) {
      logger.error("REPLICATE_API_TOKEN not configured");
      return NextResponse.json(
        { error: "AI reimagine service is not configured" },
        { status: 503 },
      );
    }

    // Download the original image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Convert mask data URL to buffer
    const maskBase64 = maskDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const maskBuffer = Buffer.from(maskBase64, "base64");

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const originalWidth = metadata.width || 1024;
    const originalHeight = metadata.height || 1024;

    logger.info("Processing image for inpainting", {
      originalWidth,
      originalHeight,
      prompt,
    });

    // Process image - ensure it's in a good format for SD
    const processedImage = await sharp(imageBuffer)
      .png()
      .toBuffer();

    // Process mask - Stability AI SD Inpainting expects WHITE areas to be inpainted
    // Our mask already has WHITE where user brushed, which is correct
    const processedMask = await sharp(maskBuffer)
      .resize(originalWidth, originalHeight, {
        fit: "fill",
      })
      .png()
      .toBuffer();

    // Convert to base64 data URLs for Replicate
    const imageBase64 = `data:image/png;base64,${processedImage.toString("base64")}`;
    const maskBase64Url = `data:image/png;base64,${processedMask.toString("base64")}`;

    // Enhanced prompt for better blending
    // Detect if this is a text-related request
    const isTextRequest = /\b(text|word|letter|say|write|font|typography)\b/i.test(prompt);

    const enhancedPrompt = isTextRequest
      ? `${prompt}, clear legible text, sharp typography, professional design, match existing style and colors, high quality`
      : `${prompt}, photorealistic, seamless blend, match existing lighting and style, high quality, detailed`;

    logger.info("Calling Replicate SD Inpainting", {
      prompt: enhancedPrompt,
      isTextRequest
    });

    // Call Replicate API with Stability AI SD Inpainting (more reliable)
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${replicateToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "e490d072a34a94a11e9711ed5a6ba621c3fab884eda1665d9d3a282d65a21180", // Stability AI SD Inpainting
        input: {
          image: imageBase64,
          mask: maskBase64Url,
          prompt: enhancedPrompt,
          negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy, bad proportions, watermark, garbled, nonsense",
          num_inference_steps: 25, // Reduced for faster processing
          guidance_scale: 8.5,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error("Replicate API error:", errorData);
      throw new Error("Failed to start AI reimagine");
    }

    const prediction = await response.json();
    logger.info("Replicate prediction started", { id: prediction.id });

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 110; // 110 seconds max (leave 10 seconds buffer before API timeout)
    let result = prediction;

    while (
      result.status !== "succeeded" &&
      result.status !== "failed" &&
      attempts < maxAttempts
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;

      const pollResponse = await fetch(
        `https://api.replicate.com/v1/predictions/${prediction.id}`,
        {
          headers: {
            Authorization: `Token ${replicateToken}`,
          },
        },
      );

      if (!pollResponse.ok) {
        throw new Error("Failed to poll prediction status");
      }

      result = await pollResponse.json();
      logger.info("Replicate prediction status", {
        id: prediction.id,
        status: result.status,
        attempt: attempts,
      });
    }

    if (result.status === "failed") {
      logger.error("Replicate prediction failed", { error: result.error });
      throw new Error(result.error || "AI reimagine failed");
    }

    if (result.status !== "succeeded" || !result.output || result.output.length === 0) {
      throw new Error("AI reimagine timed out or produced no output");
    }

    // Get the output image URL
    const outputImageUrl = result.output[0];

    logger.info("Replicate inpainting completed", { url: outputImageUrl });

    // Download the result
    const resultResponse = await fetch(outputImageUrl);
    const resultBuffer = Buffer.from(await resultResponse.arrayBuffer());

    // Upload to storage
    const newFileName = fileName
      ? `reimagined_${Date.now()}_${fileName}`
      : `reimagined_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
    const filePath = `${vendorId}/media/${newFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("vendor-product-images")
      .upload(filePath, resultBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      logger.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload reimagined image" },
        { status: 500 },
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("vendor-product-images").getPublicUrl(filePath);

    logger.info("Successfully reimagined image", {
      originalUrl: imageUrl,
      newUrl: publicUrl,
      prompt,
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      operation: "ai-reimagine",
      prompt,
    });
  } catch (error) {
    logger.error("Error reimagining image:", error);
    return NextResponse.json(
      {
        error: "Failed to reimagine image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
