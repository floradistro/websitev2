import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";

// GET - Get single template by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    const { data: template, error } = await supabase
      .from("prompt_templates")
      .select("*")
      .eq("id", id)
      .or(`vendor_id.eq.${vendorId},is_public.eq.true`)
      .single();

    if (error || !template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    logger.error("GET /prompt-templates/[id] error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// PUT - Update template
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { name, description, prompt_text, category, style, parameters } = body;

    const supabase = getServiceSupabase();

    // Check ownership
    const { data: existing } = await supabase
      .from("prompt_templates")
      .select("vendor_id")
      .eq("id", id)
      .single();

    if (!existing || existing.vendor_id !== vendorId) {
      return NextResponse.json({ error: "Template not found or access denied" }, { status: 403 });
    }

    // Update template
    const updateData: any = { updated_at: new Date().toISOString() };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (prompt_text) updateData.prompt_text = prompt_text;
    if (category) updateData.category = category;
    if (style) updateData.style = style;
    if (parameters) updateData.parameters = parameters;

    const { data: template, error } = await supabase
      .from("prompt_templates")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      logger.error("Error updating template:", err);
      return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template,
    });
  } catch (error) {
    logger.error("PUT /prompt-templates/[id] error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    // Check ownership
    const { data: existing } = await supabase
      .from("prompt_templates")
      .select("vendor_id")
      .eq("id", id)
      .single();

    if (!existing || existing.vendor_id !== vendorId) {
      return NextResponse.json({ error: "Template not found or access denied" }, { status: 403 });
    }

    // Delete template
    const { error } = await supabase.from("prompt_templates").delete().eq("id", id);

    if (error) {
      logger.error("Error deleting template:", err);
      return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    logger.error("DELETE /prompt-templates/[id] error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

// POST - Increment usage count
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;

    const supabase = getServiceSupabase();

    // Increment usage count
    const { error } = await supabase.rpc("increment_template_usage", {
      template_id: id,
    });

    if (error) {
      // If function doesn't exist, do it manually
      const { data: template } = await supabase
        .from("prompt_templates")
        .select("usage_count")
        .eq("id", id)
        .single();

      if (template) {
        await supabase
          .from("prompt_templates")
          .update({ usage_count: (template.usage_count || 0) + 1 })
          .eq("id", id);
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    logger.error("POST /prompt-templates/[id] error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
