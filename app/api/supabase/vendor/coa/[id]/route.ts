import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    // Verify vendor owns this COA
    const { data: existing } = await supabase
      .from("vendor_coas")
      .select("vendor_id, file_url")
      .eq("id", id)
      .single();

    if (!existing || existing.vendor_id !== vendorId) {
      return NextResponse.json({ error: "COA not found or unauthorized" }, { status: 404 });
    }

    // Delete from database
    const { error: deleteError } = await supabase.from("vendor_coas").delete().eq("id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Optionally delete file from Supabase Storage
    if (existing.file_url && existing.file_url.includes("supabase.co/storage")) {
      const pathMatch = existing.file_url.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
      if (pathMatch) {
        const [, bucket, path] = pathMatch;
        await supabase.storage.from(bucket).remove([path]);
      }
    }

    return NextResponse.json({
      success: true,
      message: "COA deleted",
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
