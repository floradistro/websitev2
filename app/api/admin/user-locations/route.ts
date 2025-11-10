import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function POST(request: NextRequest) {
  try {
    const { user_id, location_ids, is_primary_location } = await request.json();

    if (!user_id || !Array.isArray(location_ids)) {
      return NextResponse.json(
        {
          success: false,
          error: "user_id and location_ids array are required",
        },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Remove existing assignments
    await supabase.from("user_locations").delete().eq("user_id", user_id);

    // Add new assignments
    const assignments = location_ids.map((location_id, index) => ({
      user_id,
      location_id,
      is_primary_location:
        is_primary_location === location_id || (index === 0 && !is_primary_location),
      can_sell: true,
      can_manage_inventory: true,
      can_manage: false,
      can_transfer: false,
    }));

    if (assignments.length > 0) {
      const { error } = await supabase.from("user_locations").insert(assignments);

      if (error) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Error assigning locations:", error);
        }
        return NextResponse.json(
          {
            success: false,
            error: error.message,
          },
          { status: 400 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Assigned to ${location_ids.length} location(s)`,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in user-locations API:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "user_id is required",
        },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("user_locations")
      .select(
        `
        *,
        locations:location_id (
          id,
          name,
          city,
          state
        )
      `,
      )
      .eq("user_id", userId);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching user locations:", error);
      }
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      locations: data || [],
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in user-locations GET:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 },
    );
  }
}
