import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import FormData from "form-data";
import axios from "axios";

import { logger } from "@/lib/logger";
const REMOVE_BG_API_KEY = "CTYgh57QAP1FvqrEAHAwzFqG";

// Image enhancement with multiple options
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { imageUrl, fileName, options = {} } = body;

    if (!imageUrl || !fileName) {
      return NextResponse.json(
        {
          error: "Image URL and filename required",
        },
        { status: 400 },
      );
    }

    // Build remove.bg API request with enhancement options
    const formData = new FormData();
    formData.append("image_url", imageUrl);
    formData.append("size", "full"); // MAX quality
    formData.append("format", options.format || "png");

    // Add background options
    if (options.backgroundColor) {
      formData.append("bg_color", options.backgroundColor);
    } else if (options.backgroundImageUrl) {
      formData.append("bg_image_url", options.backgroundImageUrl);
    }

    // Cropping options
    if (options.crop) {
      formData.append("crop", "true");
      if (options.cropMargin) {
        formData.append("crop_margin", options.cropMargin);
      }
    }

    // Add shadow
    if (options.addShadow) {
      formData.append("add_shadow", "true");
    }

    // Subject type
    if (options.type) {
      formData.append("type", options.type); // auto, person, product, car
    }

    // ROI (Region of Interest)
    if (options.roi) {
      formData.append("roi", options.roi); // Format: "x1% y1% x2% y2%"
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

    // Generate new filename with enhancement suffix
    const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    const suffix = options.suffix || "-enhanced";
    const format = options.format || "png";
    const newFileName = `${fileNameWithoutExt}${suffix}.${format}`;
    const filePath = `${vendorId}/${newFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("vendor-product-images")
      .upload(filePath, removeBgResponse.data, {
        contentType: `image/${format}`,
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
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Enhance error:", error.response?.data || error.message);
    }
    return NextResponse.json(
      {
        error: error.response?.data?.errors?.[0]?.title || error.message,
      },
      { status: 500 },
    );
  }
}
