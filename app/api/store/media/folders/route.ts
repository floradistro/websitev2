import { NextRequest, NextResponse } from "next/server";
import { withVendorAuth } from "@/lib/api/route-wrapper";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * GET /api/vendor/media/folders
 * Get all folders for vendor
 */
export const GET = withVendorAuth(async (request: NextRequest, { vendorId }) => {
  const { data: folders, error } = await supabase
    .from("media_folders")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("name");

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    folders: folders || [],
  };
});

/**
 * POST /api/vendor/media/folders
 * Create a new folder
 */
export const POST = withVendorAuth(async (request: NextRequest, { vendorId }) => {
  const body = await request.json();
  const { name, parent_folder_id, color, icon } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ success: false, error: "Folder name is required" }, { status: 400 });
  }

  const { data: folder, error } = await supabase
    .from("media_folders")
    .insert({
      vendor_id: vendorId,
      name: name.trim(),
      parent_folder_id: parent_folder_id || null,
      color: color || "#6366f1",
      icon: icon || "folder",
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return {
    success: true,
    folder,
  };
});
