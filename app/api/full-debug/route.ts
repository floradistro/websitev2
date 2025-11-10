import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

export async function GET() {
  const results: any = {
    step1_env: {},
    step2_supabase: {},
    step3_products_query: {},
    step4_vendor_filter: {},
    step5_final: {},
  };

  try {
    // STEP 1: Check environment
    results.step1_env = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV,
      urlFirst20: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20),
    };

    // STEP 2: Create Supabase client
    let supabase;
    try {
      supabase = getServiceSupabase();
      results.step2_supabase = { status: "SUCCESS", error: null };
    } catch (e: any) {
      results.step2_supabase = { status: "FAILED", error: e.message };
      return NextResponse.json(results, { status: 500 });
    }

    // STEP 3: Query products with relationships
    const {
      data: products,
      error: queryError,
      count,
    } = await supabase
      .from("products")
      .select(
        `
        *,
        primary_category:categories!primary_category_id(id, name, slug),
        vendor:vendors!vendor_id(id, store_name, slug, status),
        product_categories(
          category:categories(id, name, slug)
        )
      `,
        { count: "exact" },
      )
      .eq("status", "published")
      .limit(20);

    results.step3_products_query = {
      error: queryError?.message || null,
      totalCount: count,
      returnedCount: products?.length || 0,
      sampleProducts: products?.slice(0, 3).map((p: any) => ({
        id: p.id,
        name: p.name,
        vendor_id: p.vendor_id,
        vendor_name: p.vendor?.store_name,
        vendor_status: p.vendor?.status,
        stock_quantity: p.stock_quantity,
        category: p.primary_category?.name,
      })),
    };

    if (queryError) {
      return NextResponse.json(results, { status: 500 });
    }

    // STEP 4: Apply vendor filter
    const activeProducts =
      products?.filter((p: any) => {
        if (!p.vendor_id) return true;
        if (p.vendor && p.vendor.status) {
          return p.vendor.status === "active";
        }
        return false;
      }) || [];

    results.step4_vendor_filter = {
      beforeFilter: products?.length || 0,
      afterFilter: activeProducts.length,
      filteredOut: (products?.length || 0) - activeProducts.length,
      reasonsFilteredOut: products
        ?.filter((p: any) => {
          if (!p.vendor_id) return false;
          if (p.vendor && p.vendor.status === "active") return false;
          return true;
        })
        .map((p: any) => ({
          name: p.name,
          vendor_id: p.vendor_id,
          vendor_exists: !!p.vendor,
          vendor_status: p.vendor?.status || "NO_VENDOR_DATA",
        })),
    };

    // STEP 5: What would be returned by the products API
    results.step5_final = {
      productsReturned: activeProducts.length,
      productNames: activeProducts.map((p: any) => p.name),
      allHaveVendors: activeProducts.every((p: any) => p.vendor_id),
      vendorsInData: [
        ...new Set(activeProducts.map((p: any) => p.vendor?.store_name)),
      ].filter(Boolean),
    };

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      {
        ...results,
        criticalError: {
          message: error.message,
          stack: error.stack,
        },
      },
      { status: 500 },
    );
  }
}
