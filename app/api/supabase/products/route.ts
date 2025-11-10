import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { productCache, generateCacheKey } from "@/lib/cache-manager";
import { monitor } from "@/lib/performance-monitor";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function GET(request: NextRequest) {
  const startTime = performance.now();
  const endTimer = monitor.startTimer("Product List");

  try {
    const { searchParams } = new URL(request.url);
    const perPage = parseInt(searchParams.get("per_page") || "200");
    const category = searchParams.get("category");
    const vendorId = searchParams.get("vendor_id");

    // Generate cache key based on query parameters
    const cacheKey = generateCacheKey("products", {
      perPage,
      category: category || "all",
      vendorId: vendorId || "all",
    });

    // Check cache first
    const cached = productCache.get(cacheKey);
    if (cached) {
      const duration = performance.now() - startTime;
      endTimer(); // Record in performance monitor
      monitor.recordCacheAccess("products", true); // Record cache hit

      return NextResponse.json(cached, {
        headers: {
          "X-Cache-Status": "HIT",
          "X-Response-Time": `${duration.toFixed(2)}ms`,
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      });
    }

    // Record cache miss
    monitor.recordCacheAccess("products", false);

    const supabase = getServiceSupabase();

    // Fetch products from Supabase
    let query = supabase
      .from("products")
      .select("*")
      .in("status", ["publish", "published", "active"])
      .order("name", { ascending: true })
      .limit(perPage);

    if (category) {
      query = query.eq("primary_category_id", category);
    }

    if (vendorId) {
      query = query.eq("vendor_id", vendorId);
    }

    const { data: products, error: productsError } = await query;

    if (productsError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Error fetching products:", productsError);
      }
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    if (products && products.length > 0) {
    }

    // Fetch product categories relationships

    const { data: productCategoriesData, error: categoriesError } = await supabase.from(
      "product_categories",
    ).select(`
        product_id,
        category_id,
        is_primary,
        category:categories!inner(id, name, slug)
      `);

    if (categoriesError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Error fetching categories:", categoriesError);
      }
    }

    // Map categories by product ID
    const categoriesMap = new Map<string, any[]>();
    (productCategoriesData || []).forEach((pc: any) => {
      const productId = pc.product_id?.toString();
      if (productId) {
        if (!categoriesMap.has(productId)) {
          categoriesMap.set(productId, []);
        }
        categoriesMap.get(productId)!.push({
          id: pc.category.id,
          name: pc.category.name,
          slug: pc.category.slug,
          is_primary: pc.is_primary,
        });
      }
    });

    // Fetch inventory with locations

    const { data: allInventory, error: invError } = await supabase
      .from("inventory")
      .select(
        `
        product_id,
        location_id,
        quantity,
        location:locations!inner(id, name, city, state, is_active)
      `,
      )
      .gt("quantity", 0);

    if (invError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Error fetching inventory:", invError);
      }
    }

    if (allInventory && allInventory.length > 0) {
    }

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

    // Process products
    const processedProducts = (products || []).map((p: any) => {
      const inventory = inventoryMap.get(p.id) || [];
      const categories = categoriesMap.get(p.id) || [];

      // Filter active locations
      const activeInventory = inventory.filter((inv: any) => inv.location?.is_active === true);

      // Calculate stock
      const totalStock = activeInventory.reduce(
        (sum: number, inv: any) => sum + parseFloat(inv.quantity || 0),
        0,
      );

      // Extract pricing tiers from embedded pricing_data
      const pricingData = p.pricing_data || {};
      const pricingTiers: any[] = [];

      (pricingData.tiers || []).forEach((tier: any) => {
        if (tier.enabled !== false && tier.price) {
          pricingTiers.push({
            break_id: tier.id,
            label: tier.label,
            quantity: tier.quantity || 1,
            unit: tier.unit || "g",
            price: parseFloat(tier.price),
            sort_order: tier.sort_order || 0,
          });
        }
      });

      pricingTiers.sort((a, b) => a.sort_order - b.sort_order);

      // Ensure custom_fields is an array
      const blueprintFieldsArray = Array.isArray(p.custom_fields) ? p.custom_fields : [];

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price || p.regular_price,
        regular_price: p.regular_price,
        sale_price: p.sale_price,
        featured_image_storage: p.featured_image_storage,
        image_gallery_storage: p.image_gallery_storage,
        stock_quantity: totalStock,
        stock_status: totalStock > 0 ? "in_stock" : "out_of_stock",
        inventory: activeInventory,
        vendor_id: p.vendor_id,
        primary_category_id: p.primary_category_id,
        categories: categories,
        custom_fields: blueprintFieldsArray,
        meta_data: p.meta_data || {},
        pricing_tiers: pricingTiers,
      };
    });

    // Filter - only in stock AND has valid price
    const inStockProducts = processedProducts.filter((p: any) => {
      const hasStock = parseFloat(p.stock_quantity || 0) > 0;
      const hasPrice = p.price && parseFloat(p.price) > 0;
      return hasStock && hasPrice;
    });

    const responseData = {
      success: true,
      products: inStockProducts,
    };

    // Store in cache
    productCache.set(cacheKey, responseData);

    const duration = performance.now() - startTime;
    endTimer(); // Record in performance monitor

    return NextResponse.json(responseData, {
      headers: {
        "X-Cache-Status": "MISS",
        "X-Response-Time": `${duration.toFixed(2)}ms`,
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("❌ FATAL ERROR in products API:", err);
    }
    if (process.env.NODE_ENV === "development") {
      logger.error("Stack:", err.stack);
    }
    return NextResponse.json(
      {
        error: err.message,
        details: String(error),
        stack: err.stack,
      },
      { status: 500 },
    );
  }
}
