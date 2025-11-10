import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { createClient } from "@/lib/supabase/server";
import sharp from "sharp";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

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
    const { imageUrl, fileName, intensity = 1 } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Image URL required" },
        { status: 400 },
      );
    }

    logger.info("Refining edges for image", {
      imageUrl,
      intensity,
    });

    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      throw new Error("Could not read image dimensions");
    }

    logger.info("Image metadata", { width, height });

    // Extract alpha channel
    const alphaChannel = await sharp(imageBuffer)
      .extractChannel(3) // Extract alpha channel
      .toBuffer();

    // Apply blur to alpha channel based on intensity
    // intensity 1 = 1px blur (subtle), intensity 2 = 2px blur (moderate)
    const blurAmount = Math.max(0.5, Math.min(3, intensity));
    const smoothedAlpha = await sharp(alphaChannel)
      .blur(blurAmount)
      .toBuffer();

    // Get RGB channels
    const rgbImage = await sharp(imageBuffer)
      .removeAlpha()
      .toBuffer();

    // Recombine RGB with smoothed alpha
    const processedImage = await sharp(rgbImage)
      .joinChannel(smoothedAlpha)
      .png()
      .toBuffer();

    // Upload processed image to Supabase Storage
    const newFileName = fileName
      ? `refined_${Date.now()}_${fileName}`
      : `refined_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
    const filePath = `${vendorId}/media/${newFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("vendor-product-images")
      .upload(filePath, processedImage, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      logger.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload processed image" },
        { status: 500 },
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("vendor-product-images").getPublicUrl(filePath);

    logger.info("Successfully refined edges", {
      originalUrl: imageUrl,
      newUrl: publicUrl,
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      operation: "refine-edges",
      intensity,
    });
  } catch (error) {
    logger.error("Error refining edges:", error);
    return NextResponse.json(
      {
        error: "Failed to refine edges",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
