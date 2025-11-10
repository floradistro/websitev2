import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { withErrorHandler } from "@/lib/api-handler";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
// POST - Approve and save generated image with proper naming and product linking
export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { imageUrl, tempPath, productId, productName } = body;

    logger.debug("📥 Approve request received:", {
      imageUrl,
      tempPath,
      productId,
      productName,
      vendorId,
    });

    if (!imageUrl || !productId || !productName) {
      return NextResponse.json(
        { error: "imageUrl, productId, and productName are required" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Download the temporary image from our storage
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json({ error: "Failed to download generated image" }, { status: 500 });
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    // Create clean filename from product name
    const cleanName = productName
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase();
    const fileName = `${cleanName}.png`;
    const filePath = `${vendorId}/${fileName}`;

    // Upload to Supabase Storage (upsert to replace if exists)
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("vendor-product-images")
      .upload(filePath, imageBuffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: true, // Replace if product already has an image
      });

    if (uploadError) {
      logger.error("Upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("vendor-product-images").getPublicUrl(filePath);

    // Save to database with product link (upsert to handle duplicates)
    const { data: mediaRecord, error: dbError } = await supabase
      .from("vendor_media")
      .upsert(
        {
          vendor_id: vendorId,
          file_name: fileName,
          file_path: filePath,
          file_url: publicUrl,
          file_size: imageBuffer.length,
          file_type: "image/png",
          category: "product_photos",
          ai_tags: ["ai-generated", "product-icon"],
          title: productName,
          alt_text: `${productName} product icon`,
          linked_product_ids: [productId],
          detected_content: {
            has_text: false,
            has_product: true,
            has_logo: false,
            has_people: false,
            style: "illustration",
            ai_generated: true,
          },
          quality_score: 90,
          status: "active",
        },
        {
          onConflict: "file_path",
        },
      )
      .select()
      .single();

    if (dbError) {
      logger.error("Database error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Update product's image_url to use this new image
    logger.debug("🔄 Updating product image_url:", { productId, vendorId, publicUrl });

    // Use raw SQL to bypass RLS
    const { data: productUpdateData, error: productUpdateError } = await supabase.rpc(
      "update_product_image",
      {
        p_product_id: productId,
        p_vendor_id: vendorId,
        p_image_url: publicUrl,
      },
    );

    if (productUpdateError) {
      logger.error("❌ Product update error (RPC):", JSON.stringify(productUpdateError, null, 2));
      // Fallback: try direct update (may fail due to RLS but at least we tried)
      const { error: fallbackError } = await supabase
        .from("products")
        .update({
          featured_image_storage: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .eq("vendor_id", vendorId);

      if (fallbackError) {
        logger.error("❌ Fallback update error:", JSON.stringify(fallbackError, null, 2));
      } else {
        logger.debug("✅ Product updated successfully (fallback method)");
      }
    } else {
      logger.debug("✅ Product updated successfully via RPC:", productUpdateData);
    }

    // Clean up temp file if path was provided
    if (tempPath) {
      await supabase.storage.from("vendor-product-images").remove([tempPath]);
    }

    return NextResponse.json({
      success: true,
      file: mediaRecord,
      message: "Image approved and saved successfully",
    });
  } catch (error: any) {
    logger.error("Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to approve image",
      },
      { status: 500 },
    );
  }
});
