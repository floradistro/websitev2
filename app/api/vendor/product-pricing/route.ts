import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET - Get product pricing assignments for a vendor
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 4)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    // SECURITY: vendorId from JWT, query param ignored (Phase 4)
    const productId = searchParams.get("product_id");

    // Build query based on filter type
    let assignments: any[] | null | undefined = [];
    let error: any = null;

    if (productId) {
      // Simple direct query by product_id
      const result = await supabase
        .from("product_pricing_assignments")
        .select(
          `
          *,
          product:products!inner (
            id,
            name,
            sku,
            vendor_id
          ),
          blueprint:pricing_tier_blueprints (
            id,
            name,
            slug,
            description,
            tier_type,
            context,
            price_breaks,
            applicable_to_categories
          )
        `,
        )
        .eq("product_id", productId)
        .eq("is_active", true);

      assignments = result.data;
      error = result.error;
    } else {
      // For vendor filter, get all products first, then join
      const result = await supabase
        .from("product_pricing_assignments")
        .select(
          `
          *,
          product:products!inner (
            id,
            name,
            sku,
            vendor_id
          ),
          blueprint:pricing_tier_blueprints (
            id,
            name,
            slug,
            description,
            tier_type,
            context,
            price_breaks,
            applicable_to_categories
          )
        `,
        )
        .eq("is_active", true);

      // Filter by vendor_id in memory
      assignments = result.data?.filter((a: any) => a.product?.vendor_id === vendorId) || [];
      error = result.error;
    }

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Supabase error fetching product pricing assignments:", error);
      }
      logger.error("Error details:", JSON.stringify(error, null, 2));
      // Return empty array instead of throwing to prevent modal crashes
      return NextResponse.json({
        success: true,
        assignments: [],
      });
    }

    return NextResponse.json({
      success: true,
      assignments: assignments || [],
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ Error fetching product pricing assignments:", err);
    }
    return NextResponse.json(
      { success: false, error: err.message || "Failed to load pricing" },
      { status: 500 },
    );
  }
}

// POST - Assign pricing tier to specific products
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 4)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { vendor_id, product_ids, blueprint_id, price_overrides = {} } = body;

    // SECURITY: vendorId from JWT, query param ignored (Phase 4)

    if (!product_ids || !blueprint_id) {
      return NextResponse.json(
        { success: false, error: "product_ids and blueprint_id are required" },
        { status: 400 },
      );
    }

    // Verify products belong to vendor
    const { data: products, error: verifyError } = await supabase
      .from("products")
      .select("id")
      .in("id", product_ids)
      .eq("vendor_id", vendorId);

    if (verifyError) throw verifyError;

    const validProductIds = products?.map((p) => p.id) || [];

    if (validProductIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid products found for this vendor" },
        { status: 400 },
      );
    }

    // Check for existing assignments
    const { data: existing, error: existingError } = await supabase
      .from("product_pricing_assignments")
      .select("product_id, id")
      .in("product_id", validProductIds)
      .eq("blueprint_id", blueprint_id);

    if (existingError) throw existingError;

    const existingMap = new Map((existing || []).map((e) => [e.product_id, e.id]));
    const toInsert: any[] = [];
    const toUpdate: string[] = [];

    validProductIds.forEach((productId) => {
      if (existingMap.has(productId)) {
        toUpdate.push(existingMap.get(productId)!);
      } else {
        toInsert.push({
          product_id: productId,
          blueprint_id,
          price_overrides: price_overrides[productId] || {},
          is_active: true,
        });
      }
    });

    // Insert new assignments
    if (toInsert.length > 0) {
      const { data: insertedData, error: insertError } = await supabase
        .from("product_pricing_assignments")
        .insert(toInsert)
        .select();

      if (insertError) {
        throw insertError;
      }
    }

    // Update existing assignments to active
    if (toUpdate.length > 0) {
      const { error: updateError } = await supabase
        .from("product_pricing_assignments")
        .update({ is_active: true })
        .in("id", toUpdate);

      if (updateError) {
        throw updateError;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Pricing tier assigned to ${validProductIds.length} product(s)`,
      assigned_count: validProductIds.length,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error assigning product pricing:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PUT - Update product pricing assignment (e.g., price overrides)
export async function PUT(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 4)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { assignment_id, price_overrides, is_active } = body;

    if (!assignment_id) {
      return NextResponse.json(
        { success: false, error: "assignment_id is required" },
        { status: 400 },
      );
    }

    const updateData: any = {};
    if (price_overrides !== undefined) updateData.price_overrides = price_overrides;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from("product_pricing_assignments")
      .update(updateData)
      .eq("id", assignment_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      assignment: data,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error updating product pricing assignment:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// DELETE - Remove product pricing assignment
export async function DELETE(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 4)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignment_id");
    const productId = searchParams.get("product_id");
    const blueprintId = searchParams.get("blueprint_id");

    if (!assignmentId && (!productId || !blueprintId)) {
      return NextResponse.json(
        {
          success: false,
          error: "assignment_id or (product_id and blueprint_id) required",
        },
        { status: 400 },
      );
    }

    let query = supabase.from("product_pricing_assignments").update({ is_active: false });

    if (assignmentId) {
      query = query.eq("id", assignmentId);
    } else {
      query = query.eq("product_id", productId!).eq("blueprint_id", blueprintId!);
    }

    const { error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Product pricing assignment removed",
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error removing product pricing assignment:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
