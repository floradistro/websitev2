import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
// Force dynamic rendering
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials not configured");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseClient();
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const categorySlug = formData.get("categorySlug") as string;
    const imageType = formData.get("imageType") as string; // 'image' or 'banner'

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
        },
        { status: 400 },
      );
    }

    if (!categorySlug) {
      return NextResponse.json(
        {
          success: false,
          error: "Category slug is required",
        },
        { status: 400 },
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Allowed: JPEG, PNG, WebP, SVG, GIF",
        },
        { status: 400 },
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: "File size must be less than 5MB",
        },
        { status: 400 },
      );
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${categorySlug}-${imageType}-${Date.now()}.${fileExt}`;
    const filePath = `${categorySlug}/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("category-images")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Supabase storage error:", error);
      }
      throw error;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("category-images").getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error uploading category image:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to upload image",
      },
      { status: 500 },
    );
  }
}

// DELETE - Remove image from storage
export async function DELETE(request: NextRequest) {
  const supabase = getSupabaseClient();

  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        {
          success: false,
          error: "Image path is required",
        },
        { status: 400 },
      );
    }

    const { error } = await supabase.storage.from("category-images").remove([path]);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error deleting category image:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to delete image",
      },
      { status: 500 },
    );
  }
}
