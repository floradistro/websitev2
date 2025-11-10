import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth/middleware";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const dynamic = "force-dynamic";

// Delete orphaned products (products without valid vendors)
export async function DELETE(request: NextRequest) {
  // SECURITY: Require admin authentication
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Find products with null or invalid vendor_id
    const { data: orphanedProducts, error: fetchError } = await supabase
      .from("products")
      .select("id, name, vendor_id")
      .is("vendor_id", null);

    if (fetchError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching orphaned products:", fetchError);
      }
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!orphanedProducts || orphanedProducts.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No orphaned products found",
        deleted: 0,
      });
    }

    const orphanedIds = orphanedProducts.map((p) => p.id);

    // Delete related records in parallel
    await Promise.all([
      supabase.from("product_images").delete().in("product_id", orphanedIds),
      supabase.from("product_tags").delete().in("product_id", orphanedIds),
      supabase.from("product_categories").delete().in("product_id", orphanedIds),
      supabase.from("reviews").delete().in("product_id", orphanedIds),
      supabase.from("inventory").delete().in("product_id", orphanedIds),
      supabase.from("inventory_adjustments").delete().in("product_id", orphanedIds),
    ]);

    // Delete orphaned products in bulk
    const { error: deleteError } = await supabase.from("products").delete().in("id", orphanedIds);

    if (deleteError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error deleting orphaned products:", deleteError);
      }
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${orphanedProducts.length} orphaned products`,
      deleted: orphanedProducts.length,
      products: orphanedProducts.map((p) => ({ id: p.id, name: p.name })),
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Orphaned products cleanup error:", err);
    }
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
