import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
// Get base URL for internal API calls
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

// Products cache endpoint using Supabase
export async function GET(request: NextRequest) {
  try {
    // Fetch all products from Supabase
    const response = await fetch(
      `${getBaseUrl()}/api/supabase/products?per_page=200&status=published`,
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error("Failed to fetch products");
    }

    // Map to expected format
    const products = data.products.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      type: p.type,
      status: p.status,
      price: p.price,
      regular_price: p.regular_price,
      sale_price: p.sale_price,
      on_sale: p.on_sale,
      images: p.featured_image ? [{ src: p.featured_image }] : [],
      categories: p.product_categories?.map((pc: any) => pc.category) || [],
      meta_data: p.meta_data || {},
      custom_fields: p.custom_fields || [],
      stock_status: p.stock_status || "in_stock",
      total_stock: p.stock_quantity || 0,
      inventory: [],
      total_sales: p.sales_count || 0,
    }));

    return NextResponse.json({
      success: true,
      products,
      total: data.pagination?.total || products.length,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Products cache error:", err);
    }
    return NextResponse.json(
      {
        success: false,
        products: [],
        error: err.message,
      },
      { status: 500 },
    );
  }
}
