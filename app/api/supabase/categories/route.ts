import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { productCache, generateCacheKey } from "@/lib/cache-manager";
import { monitor } from "@/lib/performance-monitor";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function GET(request: NextRequest) {
  const endTimer = monitor.startTimer("Categories API");

  try {
    const { searchParams } = new URL(request.url);

    const parent = searchParams.get("parent");
    const activeOnly = searchParams.get("active") === "true";
    const featured = searchParams.get("featured") === "true";

    // Generate cache key
    const cacheKey = generateCacheKey("categories", {
      parent: parent || "all",
      active: activeOnly ? "true" : "false",
      featured: featured ? "true" : "false",
    });

    // Check cache first
    const cached = productCache.get(cacheKey);
    if (cached) {
      endTimer();
      monitor.recordCacheAccess("categories", true);

      return NextResponse.json(cached, {
        headers: {
          "X-Cache-Status": "HIT",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      });
    }

    monitor.recordCacheAccess("categories", false);
    const supabase = getServiceSupabase();

    let query = supabase.from("categories").select(`
        *,
        parent:categories!parent_id(id, name, slug)
      `);

    // Filter by parent
    if (parent === "null" || parent === "0") {
      query = query.is("parent_id", null);
    } else if (parent) {
      query = query.eq("parent_id", parent);
    }

    // Active only
    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    // Featured only
    if (featured) {
      query = query.eq("featured", true);
    }

    query = query.order("display_order", { ascending: true });

    const { data, error } = await query;

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching categories:", err);
      }
      endTimer();
      return NextResponse.json({ error: err.message }, { status: 500 });
    }

    // Store in cache
    const responseData = {
      success: true,
      categories: data || [],
    };

    productCache.set(cacheKey, responseData);
    endTimer();

    return NextResponse.json(responseData, {
      headers: {
        "X-Cache-Status": "MISS",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      name,
      slug,
      description,
      parent_id,
      image_url,
      banner_url,
      display_order = 0,
      is_active = true,
      featured = false,
      meta_title,
      meta_description,
    } = body;

    if (!name || !slug) {
      return NextResponse.json(
        {
          error: "Missing required fields: name, slug",
        },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .insert({
        name,
        slug,
        description,
        parent_id: parent_id || null,
        image_url,
        banner_url,
        display_order,
        is_active,
        featured,
        meta_title,
        meta_description,
      })
      .select()
      .single();

    if (categoryError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error creating category:", categoryError);
      }
      return NextResponse.json({ error: categoryError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
