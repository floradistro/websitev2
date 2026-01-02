import { NextRequest, NextResponse } from "next/server";
import { withVendorAuth } from "@/lib/api/route-wrapper";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/vendor/media/generation-configs/[id]
 * Get a specific generation configuration
 */
export const GET = withVendorAuth(
  async (request: NextRequest, { vendorId, params }: { vendorId: string; params: { id: string } }) => {
    const { id } = params;

    try {
      const { data, error } = await supabase
        .from("generation_configs")
        .select("*")
        .eq("id", id)
        .or(`vendor_id.eq.${vendorId},is_public.eq.true`)
        .single();

      if (error) throw error;
      if (!data) {
        return NextResponse.json(
          { success: false, error: "Configuration not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        config: data,
      });
    } catch (error) {
      console.error("Error fetching generation config:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch configuration" },
        { status: 500 }
      );
    }
  }
);

/**
 * PATCH /api/vendor/media/generation-configs/[id]
 * Update a generation configuration
 */
export const PATCH = withVendorAuth(
  async (request: NextRequest, { vendorId, params }: { vendorId: string; params: { id: string } }) => {
    const { id } = params;
    const body = await request.json();

    try {
      // First check if the user owns this config
      const { data: existing } = await supabase
        .from("generation_configs")
        .select("vendor_id")
        .eq("id", id)
        .single();

      if (!existing || existing.vendor_id !== vendorId) {
        return NextResponse.json(
          { success: false, error: "Configuration not found or access denied" },
          { status: 404 }
        );
      }

      // Update only provided fields
      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name.trim();
      if (body.description !== undefined) updateData.description = body.description?.trim() || null;
      if (body.categories !== undefined) updateData.categories = body.categories;
      if (body.tags !== undefined) updateData.tags = body.tags;
      if (body.isPublic !== undefined) updateData.is_public = body.isPublic;

      const { data, error } = await supabase
        .from("generation_configs")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        config: data,
      });
    } catch (error) {
      console.error("Error updating generation config:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update configuration" },
        { status: 500 }
      );
    }
  }
);

/**
 * DELETE /api/vendor/media/generation-configs/[id]
 * Delete a generation configuration
 */
export const DELETE = withVendorAuth(
  async (request: NextRequest, { vendorId, params }: { vendorId: string; params: { id: string } }) => {
    const { id } = params;

    try {
      // Delete only if owned by vendor
      const { error } = await supabase
        .from("generation_configs")
        .delete()
        .eq("id", id)
        .eq("vendor_id", vendorId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
      });
    } catch (error) {
      console.error("Error deleting generation config:", error);
      return NextResponse.json(
        { success: false, error: "Failed to delete configuration" },
        { status: 500 }
      );
    }
  }
);
