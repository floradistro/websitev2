import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
export const dynamic = "force-dynamic";

// GET - List all prompt templates (own + public)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category");
    const style = searchParams.get("style");
    const publicOnly = searchParams.get("public") === "true";

    let query = supabase
      .from("prompt_templates")
      .select("*")
      .order("is_public", { ascending: false }) // Public templates first
      .order("usage_count", { ascending: false }) // Most used first
      .order("created_at", { ascending: false });

    // Filter by category
    if (category) {
      query = query.eq("category", category);
    }

    // Filter by style
    if (style) {
      query = query.eq("style", style);
    }

    // Filter: public only or own + public
    if (publicOnly) {
      query = query.eq("is_public", true);
    } else {
      query = query.or(`vendor_id.eq.${vendorId},is_public.eq.true`);
    }

    const { data: templates, error } = await query;

    if (error) {
      logger.error("Error fetching templates:", error);
      return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      templates,
      count: templates?.length || 0,
    });
  } catch (error: any) {
    logger.error("GET /prompt-templates error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// POST - Create new prompt template
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { name, description, prompt_text, category, style, parameters, is_public = false } = body;

    // Validation
    if (!name || !prompt_text) {
      return NextResponse.json({ error: "Name and prompt text are required" }, { status: 400 });
    }

    if (name.length > 255) {
      return NextResponse.json({ error: "Name must be 255 characters or less" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Create template
    const { data: template, error } = await supabase
      .from("prompt_templates")
      .insert({
        vendor_id: vendorId,
        name,
        description,
        prompt_text,
        category,
        style,
        parameters: parameters || { size: "1024x1024", quality: "standard" },
        is_public: is_public && false, // Only admins can create public templates
      })
      .select()
      .single();

    if (error) {
      logger.error("Error creating template:", error);
      return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error: any) {
    logger.error("POST /prompt-templates error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
