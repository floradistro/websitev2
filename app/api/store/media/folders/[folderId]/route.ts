import { NextRequest, NextResponse } from "next/server";
import { withVendorAuth } from "@/lib/api/route-wrapper";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * PATCH /api/vendor/media/folders/[folderId]
 * Rename a folder
 */
export const PATCH = async (
  request: NextRequest,
  context: { params: Promise<{ folderId: string }> }
) => {
  return withVendorAuth(async (request: NextRequest, { vendorId }) => {
    const params = await context.params;
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ success: false, error: "Folder name is required" }, { status: 400 });
    }

    const { data: folder, error } = await supabase
      .from("media_folders")
      .update({ name: name.trim() })
      .eq("id", params.folderId)
      .eq("vendor_id", vendorId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      folder,
    };
  })(request);
};

/**
 * DELETE /api/vendor/media/folders/[folderId]
 * Delete a folder (files inside will have folder_id set to null)
 */
export const DELETE = async (
  request: NextRequest,
  context: { params: Promise<{ folderId: string }> }
) => {
  return withVendorAuth(async (request: NextRequest, { vendorId }) => {
    const params = await context.params;

    // First, move all files in this folder to root
    await supabase
      .from("vendor_media")
      .update({ folder_id: null })
      .eq("folder_id", params.folderId)
      .eq("vendor_id", vendorId);

    // Then delete the folder
    const { error } = await supabase
      .from("media_folders")
      .delete()
      .eq("id", params.folderId)
      .eq("vendor_id", vendorId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  })(request);
};
