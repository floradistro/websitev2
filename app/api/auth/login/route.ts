import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { LoginSchema, validateData } from "@/lib/validation/schemas";
import { createAuthCookie } from "@/lib/auth/middleware";
import { logger } from "@/lib/logger";
import { rateLimiter, RateLimitConfigs, getIdentifier } from "@/lib/rate-limiter";

// Get CORS headers with proper origin (not wildcard when using credentials)
function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: getCorsHeaders(request) });
}

/**
 * Customer login endpoint
 */
export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

  try {
    // SECURITY: Apply rate limiting to prevent brute force attacks
    const identifier = getIdentifier(request);
    const allowed = rateLimiter.check(identifier, RateLimitConfigs.auth);

    if (!allowed) {
      const resetTime = rateLimiter.getResetTime(identifier, RateLimitConfigs.auth);
      return NextResponse.json(
        {
          success: false,
          error: "Too many login attempts. Please try again later.",
          retryAfter: resetTime,
        },
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Retry-After": resetTime.toString(),
          },
        },
      );
    }

    const body = await request.json();

    // Validate input
    const validation = validateData(LoginSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400, headers: corsHeaders },
      );
    }

    const { email, password } = validation.data;

    const supabase = getServiceSupabase();

    // 1. Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401, headers: corsHeaders },
      );
    }

    // 2. Get customer record from Supabase
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("email", email)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: "Customer account not found" },
        { status: 404, headers: corsHeaders },
      );
    }

    // 3. Return user data
    const user = {
      id: customer.id, // UUID string from Supabase
      email: customer.email,
      firstName: customer.first_name || "",
      lastName: customer.last_name || "",
      username: customer.username || email.split("@")[0],
      billing: customer.billing_address || {},
      shipping: customer.shipping_address || {},
      avatar_url: customer.avatar_url || null,
      isWholesaleApproved: customer.is_wholesale_approved || false,
      loyaltyPoints: customer.loyalty_points || 0,
      loyaltyTier: customer.loyalty_tier || "bronze",
      totalOrders: customer.total_orders || 0,
      totalSpent: customer.total_spent || 0,
      phone: customer.phone || null,
    };

    // Create response with HTTP-only cookie (secure)
    const response = NextResponse.json(
      {
        success: true,
        user,
        // NOTE: Session token no longer returned in JSON for security
        // Token is now in HTTP-only cookie, preventing XSS attacks
      },
      { headers: corsHeaders },
    );

    // Set HTTP-only cookie with auth token
    const cookie = createAuthCookie(authData.session.access_token);
    response.cookies.set(cookie.name, cookie.value, cookie.options);

    return response;
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Login error:", error);
    }
    return NextResponse.json(
      { success: false, error: "Login failed. Please try again." },
      { status: 500, headers: corsHeaders },
    );
  }
}
