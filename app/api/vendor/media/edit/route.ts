import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const vendorId = request.headers.get("x-vendor-id");
    if (!vendorId) {
      return NextResponse.json({ error: "Vendor ID required" }, { status: 400 });
    }

    const body = await request.json();
    const { imageUrl, operation, params } = body;

    if (!imageUrl || !operation) {
      return NextResponse.json(
        { error: "Image URL and operation required" },
        { status: 400 }
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
        // Simple background removal using threshold
        // For production, you'd use a service like remove.bg
        processedImage = await sharp(imageBuffer)
          .removeAlpha()
          .flatten({ background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .toBuffer();
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
        return NextResponse.json({ error: "Unknown operation" }, { status: 400 });
    }

    // Upload processed image to Supabase Storage
    const fileName = `edited_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const filePath = `${vendorId}/media/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("vendor_media")
      .upload(filePath, processedImage, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload processed image" }, { status: 500 });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("vendor_media").getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      operation,
    });
  } catch (error) {
    console.error("Error processing image:", error);
    return NextResponse.json(
      { error: "Failed to process image", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
