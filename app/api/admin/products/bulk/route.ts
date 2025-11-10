import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Bulk delete products - optimized for performance
export async function DELETE(request: NextRequest) {
  try {
    const { product_ids, force = false } = await request.json();

    if (
      !product_ids ||
      !Array.isArray(product_ids) ||
      product_ids.length === 0
    ) {
      return NextResponse.json(
        { error: "product_ids array is required" },
        { status: 400 },
      );
    }

    const results = [];

    // Process in batches of 10 for better performance
    const batchSize = 10;
    for (let i = 0; i < product_ids.length; i += batchSize) {
      const batch = product_ids.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(async (product_id) => {
          try {
            // Check inventory if not force delete
            if (!force) {
              const { data: inv } = await supabase
                .from("inventory")
                .select("quantity")
                .eq("product_id", product_id)
                .gt("quantity", 0)
                .limit(1);

              if (inv && inv.length > 0) {
                return {
                  product_id,
                  success: false,
                  error_message: "Has inventory",
                };
              }
            }

            // Delete related records in parallel
            if (force) {
              await Promise.all([
                supabase
                  .from("inventory")
                  .delete()
                  .eq("product_id", product_id),
                supabase
                  .from("inventory_adjustments")
                  .delete()
                  .eq("product_id", product_id),
              ]);
            }

            await Promise.all([
              supabase
                .from("product_images")
                .delete()
                .eq("product_id", product_id),
              supabase
                .from("product_tags")
                .delete()
                .eq("product_id", product_id),
              supabase
                .from("product_categories")
                .delete()
                .eq("product_id", product_id),
              supabase.from("reviews").delete().eq("product_id", product_id),
            ]);

            // Delete product
            const { error } = await supabase
              .from("products")
              .delete()
              .eq("id", product_id);

            if (error) throw error;

            return { product_id, success: true, error_message: null };
          } catch (err: any) {
            return { product_id, success: false, error_message: err.message };
          }
        }),
      );

      results.push(
        ...batchResults
          .map((r) => (r.status === "fulfilled" ? r.value : null))
          .filter(Boolean),
      );
    }

    const successful = results.filter((r: any) => r.success).length;
    const failed = results.filter((r: any) => !r.success).length;

    return NextResponse.json({
      success: true,
      results: {
        total: results.length,
        successful,
        failed,
        details: results,
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Bulk delete products error:", error);
    }
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// Bulk update product status - optimized
export async function PATCH(request: NextRequest) {
  try {
    const { product_ids, status } = await request.json();

    if (
      !product_ids ||
      !Array.isArray(product_ids) ||
      product_ids.length === 0
    ) {
      return NextResponse.json(
        { error: "product_ids array is required" },
        { status: 400 },
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 },
      );
    }

    // Bulk update in single query - instant!
    const { error } = await supabase
      .from("products")
      .update({ status, updated_at: new Date().toISOString() })
      .in("id", product_ids);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Bulk update error:", error);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      results: {
        total: product_ids.length,
        successful: product_ids.length,
        failed: 0,
        details: product_ids.map((id) => ({
          product_id: id,
          success: true,
          error_message: null,
        })),
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Bulk update products error:", error);
    }
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// Bulk approve products - optimized
export async function POST(request: NextRequest) {
  try {
    const { product_ids } = await request.json();

    if (
      !product_ids ||
      !Array.isArray(product_ids) ||
      product_ids.length === 0
    ) {
      return NextResponse.json(
        { error: "product_ids array is required" },
        { status: 400 },
      );
    }

    // Bulk update in single query - much faster!
    const { error } = await supabase
      .from("products")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .in("id", product_ids);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Bulk approve error:", error);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      results: {
        total: product_ids.length,
        successful: product_ids.length,
        failed: 0,
        details: product_ids.map((id) => ({
          product_id: id,
          success: true,
          error_message: null,
        })),
      },
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Bulk approve products error:", error);
    }
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
