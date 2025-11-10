import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { inventoryCache, generateCacheKey } from "@/lib/cache-manager";
import { monitor } from "@/lib/performance-monitor";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function GET(request: NextRequest) {
  const endTimer = monitor.startTimer("Locations API");

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const activeOnly = searchParams.get("active") === "true";

    // SECURITY: Get vendor_id from query param (for public access) or null for all retail locations
    // This endpoint is meant to be public for retail locations, but vendor locations require vendorId
    const vendorId = searchParams.get("vendor_id");

    // Generate cache key
    const cacheKey = generateCacheKey("locations", {
      type: type || "all",
      active: activeOnly ? "true" : "false",
      vendorId: vendorId || "all",
    });

    // Check cache first
    const cached = inventoryCache.get(cacheKey);
    if (cached) {
      endTimer();
      monitor.recordCacheAccess("locations", true);

      return NextResponse.json(cached, {
        headers: {
          "X-Cache-Status": "HIT",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      });
    }

    monitor.recordCacheAccess("locations", false);
    const supabase = getServiceSupabase();

    let query = supabase.from("locations").select("*");

    // Filter by type if specified
    if (type) {
      query = query.eq("type", type);
    }

    // Filter active only
    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    // SECURITY: Filter by vendor if specified, otherwise only return retail locations
    if (vendorId) {
      query = query.or(`vendor_id.eq.${vendorId},type.eq.retail`);
    } else {
      // No vendorId provided - only return public retail locations
      query = query.eq("type", "retail");
    }

    const { data, error } = await query.order("name", { ascending: true });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching locations:", error);
      }
      endTimer();
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Store in cache
    const responseData = {
      success: true,
      locations: data || [],
    };

    inventoryCache.set(cacheKey, responseData);
    endTimer();

    return NextResponse.json(responseData, {
      headers: {
        "X-Cache-Status": "MISS",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const vendorId = body.vendor_id; // Get vendor_id from request body

    const { name, slug, type, address_line1, city, state, zip, phone, email } = body;

    if (!name || !slug || !type) {
      return NextResponse.json(
        {
          error: "Missing required fields: name, slug, type",
        },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // If vendor is creating, auto-set vendor_id and type
    const locationData: any = {
      name,
      slug,
      type: vendorId ? "vendor" : type,
      address_line1,
      city,
      state,
      zip,
      phone,
      email,
    };

    if (vendorId) {
      locationData.vendor_id = vendorId;
    }

    const { data: location, error: locationError } = await supabase
      .from("locations")
      .insert(locationData)
      .select()
      .single();

    if (locationError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error creating location:", locationError);
      }
      return NextResponse.json({ error: locationError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      location,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
