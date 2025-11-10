/**
 * AI-Ready Field Management API
 *
 * Allows AI to programmatically:
 * - Create custom fields
 * - Update field definitions
 * - Delete fields
 * - Query field schemas
 * - Apply field templates
 *
 * All operations logged for AI learning
 */

import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * POST /api/ai/fields/create
 * AI creates a custom field
 */
export async function POST(request: NextRequest) {
  // SECURITY: Require vendor authentication
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const {
      vendor_id,
      section_key,
      field_config,
      ai_context, // Optional: Why AI created this field
    } = await request.json();

    if (!vendor_id || !section_key || !field_config) {
      return NextResponse.json(
        {
          error: "vendor_id, section_key, and field_config required",
        },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // AI generates a unique field_id if not provided
    const field_id =
      field_config.field_id ||
      `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabase
      .from("vendor_custom_fields")
      .insert({
        vendor_id: vendor_id,
        section_key: section_key,
        field_id: field_id,
        field_definition: {
          ...field_config.definition,
          ai_generated: true,
          ai_context: ai_context || null,
          created_by: "ai",
        },
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          {
            error: "Field with this ID already exists",
            suggestion: "Try a different field_id or use UPDATE endpoint",
          },
          { status: 409 },
        );
      }
      throw error;
    }

    // Log for AI learning

    return NextResponse.json({
      success: true,
      field: data,
      message: "Field created successfully",
      ai_ready: true,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in AI field creation:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/ai/fields/update
 * AI updates an existing field definition
 */
export async function PATCH(request: NextRequest) {
  // SECURITY: Require vendor authentication
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { field_id, vendor_id, updates, ai_reason } = await request.json();

    if (!field_id || !vendor_id || !updates) {
      return NextResponse.json(
        {
          error: "field_id, vendor_id, and updates required",
        },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Get current field
    const { data: currentField, error: fetchError } = await supabase
      .from("vendor_custom_fields")
      .select("*")
      .eq("id", field_id)
      .eq("vendor_id", vendor_id)
      .single();

    if (fetchError || !currentField) {
      return NextResponse.json({ error: "Field not found" }, { status: 404 });
    }

    // Merge updates with existing definition
    const updatedDefinition = {
      ...currentField.field_definition,
      ...updates,
      last_modified_by: "ai",
      modification_reason: ai_reason,
    };

    const { data, error } = await supabase
      .from("vendor_custom_fields")
      .update({
        field_definition: updatedDefinition,
      })
      .eq("id", field_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      field: data,
      message: "Field updated successfully",
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in AI field update:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/ai/fields/remove
 * AI removes a field
 */
export async function DELETE(request: NextRequest) {
  // SECURITY: Require vendor authentication
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const url = new URL(request.url);
    const field_id = url.searchParams.get("field_id");
    const vendor_id = url.searchParams.get("vendor_id");
    const ai_reason = url.searchParams.get("reason");

    if (!field_id || !vendor_id) {
      return NextResponse.json(
        {
          error: "field_id and vendor_id required",
        },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from("vendor_custom_fields")
      .delete()
      .eq("id", field_id)
      .eq("vendor_id", vendor_id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Field removed successfully",
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in AI field deletion:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
