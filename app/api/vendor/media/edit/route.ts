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
    const { imageUrl, operation, params } = body;

    if (!imageUrl || !operation) {
      return NextResponse.json(
        { error: "Image URL and operation required" },
        { status: 400 },
      );
    }

    // Fetch the image
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    let processedImage: Buffer;

    switch (operation) {
      case "enhance":
        // Apply enhancement filters
        processedImage = await sharp(imageBuffer)
          .modulate({
            brightness: params.brightness ? params.brightness / 100 : 1,
            saturation: params.saturation ? params.saturation / 100 : 1,
          })
          .linear(params.contrast ? params.contrast / 100 : 1, 0)
          .sharpen()
          .toBuffer();
        break;

      case "auto-enhance":
        // Auto enhance: normalize, sharpen, and boost colors
        processedImage = await sharp(imageBuffer)
          .normalize()
          .sharpen({ sigma: 1.5 })
          .modulate({
            saturation: 1.2,
            brightness: 1.05,
          })
          .toBuffer();
        break;

      case "remove-background":
        // Professional background removal using remove.bg API
        if (!process.env.REMOVE_BG_API_KEY) {
          return NextResponse.json(
            { error: "Remove.bg API key not configured" },
            { status: 500 },
          );
        }

        try {
          const formData = new FormData();
          formData.append("image_file", new Blob([imageBuffer]), "image.jpg");
          formData.append("size", "auto");

          const removeBgResponse = await fetch(
            "https://api.remove.bg/v1.0/removebg",
            {
              method: "POST",
              headers: {
                "X-Api-Key": process.env.REMOVE_BG_API_KEY,
              },
              body: formData,
            },
          );

          if (!removeBgResponse.ok) {
            const errorData = await removeBgResponse.json();
            logger.error("Remove.bg API error:", errorData);
            return NextResponse.json(
              { error: "Background removal failed", details: errorData },
              { status: 500 },
            );
          }

          processedImage = Buffer.from(await removeBgResponse.arrayBuffer());
        } catch (error) {
          logger.error("Remove.bg error:", error);
          return NextResponse.json(
            {
              error: "Failed to remove background",
              details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
          );
        }
        break;

      case "color-boost":
        // Boost colors
        processedImage = await sharp(imageBuffer)
          .modulate({
            saturation: 1.5,
          })
          .toBuffer();
        break;

      default:
        return NextResponse.json(
          { error: "Unknown operation" },
          { status: 400 },
        );
    }

    // Upload processed image to Supabase Storage
    const fileName = `edited_${Date.now()}_${Math.random().toString(36).substring(7)}.png`;
    const filePath = `${vendorId}/media/${fileName}`;

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

    return NextResponse.json({
      success: true,
      url: publicUrl,
      operation,
    });
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json(
      {
        error: "Failed to process image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
