import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import {
  rateLimiter,
  RateLimitConfigs,
  getIdentifier,
} from "@/lib/rate-limiter";

/**
 * Customer registration endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Apply rate limiting to prevent spam registrations
    const identifier = getIdentifier(request);
    const allowed = rateLimiter.check(identifier, RateLimitConfigs.auth);

    if (!allowed) {
      const resetTime = rateLimiter.getResetTime(
        identifier,
        RateLimitConfigs.auth,
      );
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
          },
        },
      );
    }

    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: "All fields required" },
        { status: 400 },
      );
    }

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
        console.error("Customer creation error:", customerError);
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
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Registration error:", error);
    }
    return NextResponse.json(
      { success: false, error: "Registration failed. Please try again." },
      { status: 500 },
    );
  }
}
