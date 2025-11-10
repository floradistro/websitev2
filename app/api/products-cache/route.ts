import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // Fetch ALL products
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .in("status", ["publish", "published", "active"])
      .order("name", { ascending: true });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching products:", error);
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Fetch ALL inventory
    const { data: allInventory } = await supabase
      .from("inventory")
      .select(
        `
        id,
        product_id,
        location_id,
        quantity,
        stock_status,
        location:locations!inner(id, name, is_active)
      `,
      )
      .gt("quantity", 0);

    // Map inventory by product UUID
    const inventoryMap = new Map<string, any[]>();
    (allInventory || []).forEach((inv: any) => {
      const productId = inv.product_id?.toString();
      if (productId && !inventoryMap.has(productId)) {
        inventoryMap.set(productId, []);
      }
      if (productId) {
        inventoryMap.get(productId)!.push(inv);
      }
    });

    // Process products with inventory
    const processedProducts = (products || []).map((p: any) => {
      const productInventory = inventoryMap.get(p.id) || [];

      const activeInventory = productInventory.filter(
        (inv: any) => inv.location?.is_active === true || inv.location?.is_active === 1,
      );

      const totalStock = activeInventory.reduce(
        (sum: number, inv: any) => sum + parseFloat(inv.quantity || 0),
        0,
      );

      return {
        ...p,
        stock_quantity: totalStock,
        stock_status: totalStock > 0 ? "in_stock" : "out_of_stock",
        inventory: activeInventory,
      };
    });

    // Filter: Only products with stock
    const inStockProducts = processedProducts.filter((p: any) => {
      const stock = parseFloat(p.stock_quantity || 0);
      return stock > 0;
    });

    return NextResponse.json(
      {
        success: true,
        products: inStockProducts,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in products-cache API:", error);
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
