import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
// Fix broken image records where .jpg files were converted to .png
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    // Get all .jpg/.jpeg files
    const { data: jpgFiles, error: fetchError } = await supabase
      .from("vendor_media")
      .select("*")
      .eq("vendor_id", vendorId)
      .or("file_name.ilike.%.jpg,file_name.ilike.%.jpeg");

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!jpgFiles || jpgFiles.length === 0) {
      return NextResponse.json({ message: "No files to fix", fixed: 0 });
    }

    let fixed = 0;
    const updates = [];

    for (const file of jpgFiles) {
      // Check if .png version exists in storage
      const pngFileName = file.file_name.replace(/\.(jpg|jpeg)$/i, ".png");
      const pngPath = `${vendorId}/${pngFileName}`;

      const { data: pngExists } = await supabase.storage
        .from("vendor-product-images")
        .list(vendorId, {
          search: pngFileName,
        });

      if (pngExists && pngExists.length > 0) {
        // PNG version exists, update the record
        updates.push({
          id: file.id,
          file_name: pngFileName,
          file_path: pngPath,
          file_url: file.file_url.replace(/\.(jpg|jpeg)$/i, ".png"),
        });
      }
    }

    // Batch update all records
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("vendor_media")
        .update({
          file_name: update.file_name,
          file_path: update.file_path,
          file_url: update.file_url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", update.id);

      if (!updateError) {
        fixed++;
      }
    }

    logger.debug(`✅ Fixed ${fixed} image records`);

    return NextResponse.json({
      success: true,
      fixed,
      total: jpgFiles.length,
    });
  } catch (error) {
    logger.error("Error fixing filenames:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
