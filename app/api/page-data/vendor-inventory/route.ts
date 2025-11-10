import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import type {
  Product,
  InventoryRecord,
  Location,
  CustomField,
  InventoryItem,
} from "@/types/inventory";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // SECURITY: Use requireVendor to get vendor_id from authenticated session
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;

    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    // Execute ALL queries in parallel - products, inventory, locations
    const [productsResult, inventoryResult, locationsResult] =
      await Promise.allSettled([
        // Products with categories
        supabase
          .from("products")
          .select(
            `
          id,
          name,
          sku,
          price,
          cost_price,
          stock_quantity,
          featured_image_storage,
          description,
          custom_fields,
          primary_category:categories!primary_category_id(id, name)
        `,
          )
          .eq("vendor_id", vendorId)
          .order("name", { ascending: true }),

        // Inventory with locations
        supabase
          .from("inventory")
          .select(
            `
          id,
          product_id,
          quantity,
          stock_status,
          location_id,
          location:locations(id, name, city, state)
        `,
          )
          .eq("vendor_id", vendorId),

        // Vendor locations
        supabase
          .from("locations")
          .select("*")
          .eq("vendor_id", vendorId)
          .order("is_primary", { ascending: false }),
      ]);

    // Extract data (using unknown intermediate to handle Supabase response shape)
    const products = (productsResult.status === "fulfilled"
      ? productsResult.value.data || []
      : []) as unknown as Product[];
    const inventoryData = (inventoryResult.status === "fulfilled"
      ? inventoryResult.value.data || []
      : []) as unknown as InventoryRecord[];
    const locations = (locationsResult.status === "fulfilled"
      ? locationsResult.value.data || []
      : []) as unknown as Location[];

    // Group inventory by product
    const inventoryByProduct: Record<string, InventoryRecord[]> = {};
    inventoryData.forEach((inv) => {
      if (!inventoryByProduct[inv.product_id]) {
        inventoryByProduct[inv.product_id] = [];
      }
      inventoryByProduct[inv.product_id].push(inv);
    });

    // Map to inventory items format
    const inventory: InventoryItem[] = products.map((p) => {
      const productInventory = inventoryByProduct[p.id] || [];
      const totalQuantity = productInventory.reduce(
        (sum, inv) => sum + (inv.quantity || 0),
        0,
      );

      // Determine stock status
      let stock_status: "in_stock" | "low_stock" | "out_of_stock" =
        "out_of_stock";
      if (totalQuantity > 10) stock_status = "in_stock";
      else if (totalQuantity > 0) stock_status = "low_stock";

      // Extract Flora fields
      const floraFields: Record<string, string | number | boolean> = {};
      if (p.custom_fields && Array.isArray(p.custom_fields)) {
        p.custom_fields.forEach((field) => {
          if (field && field.field_name && field.field_value) {
            floraFields[field.field_name] = field.field_value;
          }
        });
      }

      return {
        id: p.id,
        inventory_id: productInventory[0]?.id || null,
        product_id: p.id,
        product_name: p.name,
        sku: p.sku || "",
        quantity: totalQuantity,
        category_name: p.primary_category?.name || "Product",
        image: p.featured_image_storage,
        price: parseFloat(String(p.price || 0)),
        cost_price: p.cost_price ? parseFloat(String(p.cost_price)) : undefined,
        description: p.description,
        stock_status,
        stock_status_label:
          stock_status === "in_stock"
            ? "In Stock"
            : stock_status === "low_stock"
              ? "Low Stock"
              : "Out of Stock",
        location_name: productInventory[0]?.location?.name || "No Location",
        location_id: productInventory[0]?.location_id || null,
        locations_with_stock: productInventory.length,
        inventory_locations: productInventory.map((inv) => ({
          location_id: inv.location_id,
          location_name: inv.location?.name || "Unknown",
          quantity: inv.quantity,
          stock_status: inv.stock_status,
        })),
        flora_fields: floraFields,
      };
    });

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: {
          products: products,
          inventory: inventory,
          locations: locations,
        },
        meta: {
          responseTime: `${responseTime}ms`,
          vendorId,
          productCount: products.length,
          inventoryCount: inventory.length,
          locationCount: locations.length,
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30",
          "X-Response-Time": `${responseTime}ms`,
        },
      },
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "❌ Error in /api/page-data/vendor-inventory:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch vendor inventory",
      },
      { status: 500 },
    );
  }
}
