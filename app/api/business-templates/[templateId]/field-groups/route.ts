/**
 * API: Template Field Groups
 * GET - Get all field groups for a specific template
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  // SECURITY: Require admin authentication
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { templateId } = await params;
    const supabase = getServiceSupabase();

    const { data: fieldGroups, error } = await supabase
      .from("template_field_groups")
      .select("*")
      .eq("template_id", templateId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      field_groups: fieldGroups || [],
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Template field groups API error:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to fetch field groups",
      },
      { status: 500 },
    );
  }
}
