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
    const { imageUrl, color, tolerance = 30, fileName } = body;

    if (!imageUrl || !color) {
      return NextResponse.json(
        { error: "Image URL and color required" },
        { status: 400 },
      );
    }

    // Validate color has r, g, b
    if (
      typeof color.r !== "number" ||
      typeof color.g !== "number" ||
      typeof color.b !== "number"
    ) {
      return NextResponse.json(
        { error: "Color must have r, g, b values" },
        { status: 400 },
      );
    }

    logger.info("Removing color from image", {
      imageUrl,
      color,
      tolerance,
    });

    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height, channels: originalChannels } = metadata;

    if (!width || !height) {
      throw new Error("Could not read image dimensions");
    }

    logger.info("Image metadata", { width, height, originalChannels });

    // Get raw pixel data with explicit RGBA format
    const image = sharp(imageBuffer);
    const { data, info } = await image
      .ensureAlpha() // Ensure image has alpha channel
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channels = 4; // RGBA always has 4 channels after ensureAlpha

    logger.info("Raw pixel data obtained", {
      dataLength: data.length,
      channels: info.channels,
      expectedLength: width * height * channels,
    });

    // Process pixels - remove matching colors
    const targetR = color.r;
    const targetG = color.g;
    const targetB = color.b;
    let pixelsRemoved = 0;

    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      // Skip if already transparent
      if (a === 0) continue;

      // Calculate color distance (Euclidean distance in RGB space)
      const distance = Math.sqrt(
        Math.pow(r - targetR, 2) +
          Math.pow(g - targetG, 2) +
          Math.pow(b - targetB, 2),
      );

      // If color is within tolerance, make it transparent
      if (distance <= tolerance) {
        data[i + 3] = 0; // Set alpha to 0 (transparent)
        pixelsRemoved++;
      }
    }

    logger.info("Pixels processed", { pixelsRemoved });

    // Convert back to image
    const processedImage = await sharp(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4, // Explicitly set to 4 for RGBA
      },
    })
      .png() // Use PNG to preserve transparency
      .toBuffer();

    // Upload processed image to Supabase Storage
    const newFileName = fileName
      ? `color_removed_${Date.now()}_${fileName}`
      : `color_removed_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
    const filePath = `${vendorId}/media/${newFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("vendor_media")
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
    } = supabase.storage.from("vendor_media").getPublicUrl(filePath);

    logger.info("Successfully removed color from image", {
      originalUrl: imageUrl,
      newUrl: publicUrl,
      pixelsProcessed: data.length / channels,
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      operation: "remove-color",
      color,
      tolerance,
    });
  } catch (error) {
    logger.error("Error removing color from image:", error);
    return NextResponse.json(
      {
        error: "Failed to remove color",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
