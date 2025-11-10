import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import {
  redisRateLimiter,
  RateLimitConfigs,
  getIdentifier,
} from "@/lib/redis-rate-limiter";
import { toError } from "@/lib/errors";
import { RegisterSchema, validateData } from "@/lib/validation/schemas";

/**
 * Customer registration endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Apply distributed rate limiting to prevent spam registrations
    const identifier = getIdentifier(request);
    const allowed = await redisRateLimiter.check(identifier, RateLimitConfigs.auth);

    if (!allowed) {
      const resetTime = await redisRateLimiter.getResetTime(
        identifier,
        RateLimitConfigs.auth,
      );
      logger.warn("Registration rate limit exceeded", {
        ip: identifier,
        resetTime,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Too many registration attempts. Please try again later.",
          retryAfter: resetTime,
        },
        {
          status: 429,
          headers: {
            "Retry-After": resetTime.toString(),
            "X-RateLimit-Limit": RateLimitConfigs.auth.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetTime.toString(),
          },
        },
      );
    }

    const body = await request.json();

    // SECURITY: Validate input with Zod schema
    const validation = validateData(RegisterSchema, body);
    if (!validation.success) {
      logger.warn("Registration validation failed", {
        errors: validation.details,
        ip: request.headers.get("x-forwarded-for") || "unknown",
      });
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          details: validation.details,
        },
        { status: 400 },
      );
    }

    const { email, password, firstName, lastName } = validation.data;

    const supabase = getServiceSupabase();

    // 1. Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: authError?.message || "Registration failed" },
        { status: 400 },
      );
    }

    // 2. Create customer record
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .insert({
        auth_user_id: authData.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        username: email.split("@")[0],
        is_active: true,
        email_verified: false,
      })
      .select()
      .single();

    if (customerError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Customer creation error:", customerError);
      }
      // If customer creation fails, we should clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: "Failed to create customer account" },
        { status: 500 },
      );
    }

    // 3. Return user data
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
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Registration error:", err);
    }
    return NextResponse.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}
