import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import FormData from "form-data";
import axios from "axios";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY || "";

// Process a single image with enhancements
async function enhanceImage(
  file: { url: string; name: string },
  vendorId: string,
  options: any,
  retries = 3,
) {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt > 1) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const formData = new FormData();
      formData.append("image_url", file.url);
      formData.append("size", "full");
      formData.append("format", options.format || "png");

      // Add all enhancement options
      if (options.backgroundColor) {
        formData.append("bg_color", options.backgroundColor);
      }
      if (options.crop) {
        formData.append("crop", "true");
        if (options.cropMargin) {
          formData.append("crop_margin", options.cropMargin);
        }
      }
      if (options.addShadow) {
        formData.append("add_shadow", "true");
      }
      if (options.type) {
        formData.append("type", options.type);
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

      // Generate new filename
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      const suffix = options.suffix || "-enhanced";
      const format = options.format || "png";
      const newFileName = `${fileNameWithoutExt}${suffix}.${format}`;
      const filePath = `${vendorId}/${newFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("vendor-product-images")
        .upload(filePath, removeBgResponse.data, {
          contentType: `image/${format}`,
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("vendor-product-images").getPublicUrl(filePath);

      return {
        success: true,
        originalName: file.name,
        newName: newFileName,
        url: publicUrl,
      };
    } catch (error) {
      lastError = error;

      if (error.response?.status === 429 && attempt < retries) {
        continue;
      }

      throw new Error(`${file.name}: ${err.message}`);
    }
  }

  throw lastError || new Error(`${file.name}: Unknown error`);
}

// Bulk enhancement with parallel processing
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { files, options = {}, concurrency = 10 } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        {
          error: "Files array required",
        },
        { status: 400 },
      );
    }

    const results: any[] = [];
    const errors: any[] = [];

    // Process in chunks
    const chunks = [];
    for (let i = 0; i < files.length; i += concurrency) {
      chunks.push(files.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      const promises = chunk.map((file) => enhanceImage(file, vendorId, options, 3));
      const settled = await Promise.allSettled(promises);

      settled.forEach((result, index) => {
        if (result.status === "fulfilled") {
          results.push(result.value);
        } else {
          errors.push({
            fileName: chunk[index].name,
            error: result.reason?.message || "Unknown error",
          });
        }
      });

      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT method - alias to POST for consistency
export async function PUT(request: NextRequest) {
  return POST(request);
}
