import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { rateLimiter, RateLimitConfigs, getIdentifier } from "@/lib/rate-limiter";
import { toError } from "@/lib/errors";

/**
 * Update customer profile
 */
export async function PUT(request: NextRequest) {
  try {
    // SECURITY: Apply rate limiting to prevent spam updates
    const identifier = getIdentifier(request);
    const allowed = rateLimiter.check(identifier, RateLimitConfigs.api);

    if (!allowed) {
      const resetTime = rateLimiter.getResetTime(identifier, RateLimitConfigs.api);
      return NextResponse.json(
        {
          success: false,
          error: "Too many update requests. Please try again later.",
          retryAfter: resetTime,
        },
        {
          status: 429,
          headers: {
            "Retry-After": resetTime.toString(),
          },
        },
      );
    }

    const body = await request.json();
    const { userId, ...updateData } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Build update object with proper typing
    const updates: Record<string, string | object | null> = {};
    if (updateData.firstName) updates.first_name = updateData.firstName;
    if (updateData.lastName) updates.last_name = updateData.lastName;
    if (updateData.phone) updates.phone = updateData.phone;
    if (updateData.billing) updates.billing_address = updateData.billing;
    if (updateData.shipping) updates.shipping_address = updateData.shipping;
    if (updateData.avatar_url) updates.avatar_url = updateData.avatar_url;

    updates.updated_at = new Date().toISOString();

    const { data: customer, error: updateError } = await supabase
      .from("customers")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (updateError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Update error:", updateError);
      }
      return NextResponse.json(
        { success: false, error: "Failed to update profile" },
        { status: 500 },
      );
    }

    const user = {
      id: customer.id,
      email: customer.email,
      firstName: customer.first_name,
      lastName: customer.last_name,
      username: customer.username,
      billing: customer.billing_address,
      shipping: customer.shipping_address,
      avatar_url: customer.avatar_url,
    };

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Update profile error:", err);
    }
    return NextResponse.json(
      { success: false, error: "Update failed. Please try again." },
      { status: 500 },
    );
  }
}
