import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // SECURITY: Use requireVendor to get vendor_id from authenticated session
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;

    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    // Get all vendor products with categories in ONE query
    const productsResult = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        slug,
        status,
        price,
        stock_quantity,
        featured_image_storage,
        created_at,
        primary_category:categories!primary_category_id(id, name, slug)
      `,
      )
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (productsResult.error) throw productsResult.error;

    const products = (productsResult.data || []).map((p: any) => {
      // Map status to vendor UI
      let status: "approved" | "pending" | "rejected" = "pending";
      if (p.status === "published") status = "approved";
      else if (p.status === "pending") status = "pending";
      else status = "rejected";

      return {
        id: p.id,
        submissionId: p.id,
        name: p.name || "Unnamed Product",
        image: p.featured_image_storage || "/yacht-club-logo.png",
        status: status,
        quantity: p.stock_quantity || 0,
        price: `$${parseFloat(p.price || 0).toFixed(2)}`,
        category: p.primary_category?.name || "Product",
        coaStatus: "missing",
        submittedDate: p.created_at,
        rejectionReason: null,
      };
    });

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        products: products,
        meta: {
          responseTime: `${responseTime}ms`,
          vendorId,
          productCount: products.length,
        },
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30",
          "X-Response-Time": `${responseTime}ms`,
        },
      },
    );
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("❌ Error in /api/page-data/vendor-products:", error);
    }
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch vendor products",
      },
      { status: 500 },
    );
  }
}
