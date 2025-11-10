import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * GET /api/schemas/sections
 * Get all section schemas (for building editor UI)
 */
export async function GET(request: NextRequest) {
  // SECURITY: Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const supabase = getServiceSupabase();

    // Get all active section schemas
    const { data: schemas, error } = await supabase
      .from("section_schemas")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, schemas });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error fetching section schemas:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/schemas/sections/[key]
 * Get a specific section schema
 */
export async function POST(request: NextRequest) {
  // SECURITY: Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { section_key } = await request.json();

    if (!section_key) {
      return NextResponse.json({ error: "section_key required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: schema, error } = await supabase
      .from("section_schemas")
      .select("*")
      .eq("section_key", section_key)
      .eq("is_active", true)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, schema });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error fetching section schema:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
