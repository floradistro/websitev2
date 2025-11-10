import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function PATCH(request: NextRequest) {
  try {
    // Use secure middleware to get vendor_id from session
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { product_id, updates } = body;

    if (!product_id || !updates) {
      return NextResponse.json(
        { success: false, error: "Product ID and updates required" },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Verify product belongs to vendor
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("id, vendor_id")
      .eq("id", product_id)
      .maybeSingle();

    if (fetchError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching product:", fetchError);
      }
      return NextResponse.json({ success: false, error: "Database error" }, { status: 500 });
    }

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found or already deleted" },
        { status: 404 },
      );
    }

    if (product.vendor_id !== vendorId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    // Build update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.sku !== undefined) updateData.sku = updates.sku;
    if (updates.regular_price !== undefined) updateData.regular_price = updates.regular_price;
    if (updates.cost_price !== undefined) updateData.cost_price = updates.cost_price;
    if (updates.description !== undefined) updateData.description = updates.description;

    // Handle custom_fields directly (NEW SYSTEM - object format)
    if (updates.custom_fields !== undefined) {
      updateData.custom_fields = updates.custom_fields;
    }
    // Handle custom fields (LEGACY - for backwards compatibility)
    // Only use custom_fields if custom_fields was not provided
    else if (updates.custom_fields) {
      const fieldsArray = Object.entries(updates.custom_fields)
        .map(([field_name, field_value]) => {
          // Convert field_name to proper label format (e.g., thc_percentage → THC Content)
          const labelMap: any = {
            thc_percentage: "THC Content",
            cbd_percentage: "CBD Content",
            strain_type: "Strain Type",
            lineage: "Genetics",
            terpenes: "Dominant Terpenes",
            effects: "Effects",
            nose: "Aroma",
            taste: "Flavors",
          };

          return {
            type: "text",
            label:
              labelMap[field_name] ||
              field_name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            value: field_value,
          };
        })
        .filter((f) => f.value); // Only include non-empty values

      updateData.custom_fields = fieldsArray;
    }

    // Handle meta_data updates (for pricing blueprints, etc.)
    if (updates.meta_data !== undefined) {
      updateData.meta_data = updates.meta_data;
    }

    const { data: updated, error: updateError } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", product_id)
      .select()
      .maybeSingle();

    if (updateError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Update error:", updateError);
      }
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    if (!updated) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Product update affected 0 rows - product may have been deleted");
      }
      return NextResponse.json(
        {
          success: false,
          error: "Product not found or was deleted during update. Please refresh the page.",
          product_id,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      product: updated,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Product update error:", err);
    }
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
}
