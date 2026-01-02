import { NextRequest, NextResponse } from "next/server";
import { withVendorAuth } from "@/lib/api/route-wrapper";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/vendor/media/generation-configs/[id]/use
 * Mark a configuration as used (increment usage counter and update last_used timestamp)
 */
export const POST = withVendorAuth(
  async (request: NextRequest, { vendorId, params }: { vendorId: string; params: { id: string } }) => {
    const { id } = params;

    try {
      // First, get the current config
      const { data: currentConfig, error: fetchError } = await supabase
        .from("generation_configs")
        .select("*")
        .eq("id", id)
        .or(`vendor_id.eq.${vendorId},is_public.eq.true`)
        .single();

      if (fetchError) throw fetchError;

      // Increment times_used and update last_used
      const { data, error } = await supabase
        .from("generation_configs")
        .update({
          times_used: (currentConfig.times_used || 0) + 1,
          last_used: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        config: data,
      });
    } catch (error) {
      console.error("Error marking config as used:", error);
      return NextResponse.json(
        { success: false, error: "Failed to update usage" },
        { status: 500 }
      );
    }
  }
);
