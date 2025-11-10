import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import FormData from "form-data";
import axios from "axios";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
const REMOVE_BG_API_KEY = "CTYgh57QAP1FvqrEAHAwzFqG";

// Add custom background to image
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { imageUrl, fileName, backgroundColor, backgroundImageUrl } = body;

    if (!imageUrl || !fileName) {
      return NextResponse.json(
        {
          error: "Image URL and filename required",
        },
        { status: 400 },
      );
    }

    // Call remove.bg API with custom background
    const formData = new FormData();
    formData.append("image_url", imageUrl);
    formData.append("size", "full"); // MAX quality
    formData.append("format", "png");

    // Add background color or image
    if (backgroundColor) {
      formData.append("bg_color", backgroundColor); // Hex color like #ffffff
    } else if (backgroundImageUrl) {
      formData.append("bg_image_url", backgroundImageUrl);
    }

    const removeBgResponse = await axios({
      method: "post",
      url: "https://api.remove.bg/v1.0/removebg",
      data: formData,
      responseType: "arraybuffer",
      headers: {
        ...formData.getHeaders(),
        "X-Api-Key": REMOVE_BG_API_KEY,
      },
      timeout: 90000,
    });

    const supabase = getServiceSupabase();

    // Generate new filename with background suffix
    const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    const bgSuffix = backgroundColor ? `-bg${backgroundColor.replace("#", "")}` : "-bg";
    const newFileName = `${fileNameWithoutExt}${bgSuffix}.png`;
    const filePath = `${vendorId}/${newFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("vendor-product-images")
      .upload(filePath, removeBgResponse.data, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Upload error:", uploadError);
      }
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("vendor-product-images").getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      file: {
        name: newFileName,
        url: publicUrl,
        originalFileName: fileName,
      },
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Add background error:", error.response?.data || err.message);
    }
    if (error.response?.status === 402) {
      return NextResponse.json(
        {
          error: "API credits exhausted. Please contact support.",
        },
        { status: 402 },
      );
    }

    return NextResponse.json(
      {
        error: error.response?.data?.errors?.[0]?.title || err.message,
      },
      { status: 500 },
    );
  }
}
