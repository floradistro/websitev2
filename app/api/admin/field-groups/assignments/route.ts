import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET - Get field group assignments for a category or all assignments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category_id");
    const fieldGroupId = searchParams.get("field_group_id");

    let query = supabase
      .from("category_field_groups")
      .select(
        `
        *,
        category:categories(id, name, slug),
        field_group:field_groups(id, name, slug, fields)
      `,
      )
      .order("display_order", { ascending: true });

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    if (fieldGroupId) {
      query = query.eq("field_group_id", fieldGroupId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      assignments: data || [],
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error fetching assignments:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST - Assign field group to category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { category_id, field_group_id, is_required = false, display_order = 0 } = body;

    if (!category_id || !field_group_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Category ID and Field Group ID are required",
        },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("category_field_groups")
      .insert({
        category_id,
        field_group_id,
        is_required,
        display_order,
      })
      .select(
        `
        *,
        category:categories(id, name, slug),
        field_group:field_groups(id, name, slug, fields)
      `,
      )
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      assignment: data,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error creating assignment:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT - Update assignment
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, is_required, display_order } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Assignment ID is required" },
        { status: 400 },
      );
    }

    const updateData: any = {};
    if (is_required !== undefined) updateData.is_required = is_required;
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data, error } = await supabase
      .from("category_field_groups")
      .update(updateData)
      .eq("id", id)
      .select(
        `
        *,
        category:categories(id, name, slug),
        field_group:field_groups(id, name, slug, fields)
      `,
      )
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      assignment: data,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error updating assignment:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE - Remove assignment
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Assignment ID is required" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("category_field_groups").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Assignment removed successfully",
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error deleting assignment:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
