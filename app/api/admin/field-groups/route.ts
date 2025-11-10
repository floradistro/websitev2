import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET - List all field groups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active_only") === "true";

    let query = supabase
      .from("field_groups")
      .select("*")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      field_groups: data || [],
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error fetching field groups:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST - Create new field group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, fields, is_active = true, display_order = 0 } = body;

    if (!name || !slug || !fields) {
      return NextResponse.json(
        { success: false, error: "Name, slug, and fields are required" },
        { status: 400 },
      );
    }

    // Validate fields structure
    if (!Array.isArray(fields)) {
      return NextResponse.json(
        { success: false, error: "Fields must be an array" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("field_groups")
      .insert({
        name,
        slug,
        description,
        fields,
        is_active,
        display_order,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      field_group: data,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error creating field group:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT - Update field group
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, slug, description, fields, is_active, display_order } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Field group ID is required" },
        { status: 400 },
      );
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (fields !== undefined) updateData.fields = fields;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data, error } = await supabase
      .from("field_groups")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      field_group: data,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error updating field group:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE - Delete field group
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Field group ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("field_groups").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Field group deleted successfully",
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error deleting field group:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
