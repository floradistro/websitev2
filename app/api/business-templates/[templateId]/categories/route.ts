/**
 * API: Template Categories
 * GET - Get all categories for a specific template
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

    const { data: categories, error } = await supabase
      .from("template_categories")
      .select("*")
      .eq("template_id", templateId)
      .order("display_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      categories: categories || [],
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Template categories API error:", err);
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch categories" },
      { status: 500 },
    );
  }
}
