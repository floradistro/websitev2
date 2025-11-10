import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import { withErrorHandler } from "@/lib/api-handler";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withErrorHandler(async (request: NextRequest) => {
  try {
    // Use secure middleware to get vendor_id from session
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    // Get products with inventory
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        sku,
        price,
        cost_price,
        custom_fields,
        primary_category:categories!primary_category_id(name)
      `,
      )
      .eq("vendor_id", vendorId)
      .order("name");

    if (productsError) throw productsError;

    // Get inventory
    const { data: inventoryData, error: inventoryError } = await supabase
      .from("inventory")
      .select(
        `
        id,
        product_id,
        quantity,
        stock_status,
        location_id,
        location:locations(
          id,
          name,
          city,
          state
        )
      `,
      )
      .eq("vendor_id", vendorId);

    if (inventoryError) throw inventoryError;

    // Get locations
    const { data: locations, error: locationsError } = await supabase
      .from("locations")
      .select("id, name, city, state, is_primary, is_active")
      .eq("vendor_id", vendorId)
      .eq("is_active", true)
      .order("is_primary", { ascending: false });

    if (locationsError) throw locationsError;

    // Map inventory to products
    const inventory = (products || []).flatMap((product) => {
      const productInventory = (inventoryData || []).filter((inv) => inv.product_id === product.id);

      if (productInventory.length === 0) {
        return [];
      }

      return productInventory.map((inv) => {
        // Extract flora fields
        const floraFields: any = {};
        if (product.custom_fields && Array.isArray(product.custom_fields)) {
          product.custom_fields.forEach((field: any) => {
            if (field && field.field_name && field.field_value) {
              floraFields[field.field_name] = field.field_value;
            }
          });
        }

        // Determine stock status
        let stock_status: "in_stock" | "low_stock" | "out_of_stock" = "out_of_stock";
        if (inv.quantity > 10) stock_status = "in_stock";
        else if (inv.quantity > 0) stock_status = "low_stock";

        return {
          id: `${inv.id}`,
          product_id: product.id,
          product_name: product.name,
          sku: product.sku || "",
          quantity: parseFloat(inv.quantity) || 0,
          category_name: (product.primary_category as any)?.name || "Uncategorized",
          price: parseFloat(product.price) || 0,
          cost_price: product.cost_price ? parseFloat(product.cost_price) : undefined,
          stock_status,
          location_id: inv.location_id || "",
          location_name: (inv.location as any)?.name || "Unknown",
          flora_fields: Object.keys(floraFields).length > 0 ? floraFields : undefined,
        };
      });
    });

    return NextResponse.json({
      success: true,
      inventory,
      locations: locations || [],
      total: inventory.length,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Inventory API error:", err);
    }
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 },
    );
  }
});
