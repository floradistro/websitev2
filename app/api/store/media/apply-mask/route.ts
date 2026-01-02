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
    const { imageUrl, maskDataUrl, fileName } = body;

    if (!imageUrl || !maskDataUrl) {
      return NextResponse.json(
        { error: "Image URL and mask data required" },
        { status: 400 },
      );
    }

    logger.info("Applying mask to image", {
      imageUrl,
      hasMask: !!maskDataUrl,
    });

    // Fetch the original image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Convert mask data URL to buffer
    const maskBase64 = maskDataUrl.replace(/^data:image\/\w+;base64,/, "");
    const maskBuffer = Buffer.from(maskBase64, "base64");

    // Get dimensions of original image
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;

    if (!width || !height) {
      throw new Error("Could not read image dimensions");
    }

    // Ensure mask is same size as image
    const resizedMask = await sharp(maskBuffer)
      .resize(width, height, {
        fit: "fill",
      })
      .greyscale() // Convert to greyscale (we only care about alpha/intensity)
      .toBuffer();

    // Get raw pixel data from both image and mask
    const imageData = await sharp(imageBuffer)
      .ensureAlpha()
      .raw()
      .toBuffer();

    const maskData = await sharp(resizedMask).raw().toBuffer();

    // Apply mask: Where mask is dark (erased), make image transparent
    // Mask is greyscale, so we only need to check one channel
    const channels = 4; // RGBA

    for (let i = 0; i < imageData.length; i += channels) {
      const maskIndex = Math.floor(i / channels); // Mask is greyscale (1 channel)
      const maskValue = maskData[maskIndex];

      // If mask is dark (< 128), reduce alpha (erase)
      // If mask is bright (> 128), keep alpha (restore/preserve)
      if (maskValue < 128) {
        // Dark area = erased area
        imageData[i + 3] = 0; // Set alpha to 0 (transparent)
      }
      // Otherwise keep original alpha value
    }

    // Convert back to image
    const processedImage = await sharp(imageData, {
      raw: {
        width,
        height,
        channels,
      },
    })
      .png() // Use PNG to preserve transparency
      .toBuffer();

    // Upload processed image to Supabase Storage
    const newFileName = fileName
      ? `masked_${Date.now()}_${fileName}`
      : `masked_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
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

    logger.info("Successfully applied mask to image", {
      originalUrl: imageUrl,
      newUrl: publicUrl,
    });

    return NextResponse.json({
      success: true,
      url: publicUrl,
      operation: "apply-mask",
    });
  } catch (error) {
    logger.error("Error applying mask to image:", error);
    return NextResponse.json(
      {
        error: "Failed to apply mask",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
