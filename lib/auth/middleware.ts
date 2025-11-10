import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
export interface AuthUser {
  id: string;
  email: string;
  role?: "vendor_admin" | "employee" | "manager" | "customer";
  vendor_id?: string;
}

/**
 * Extract and verify authentication token from request
 * Supports both Authorization header and HTTP-only cookie
 */
export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Try Authorization header first (for API calls)
    let token = request.headers.get("authorization")?.replace("Bearer ", "");

    // Fallback to HTTP-only cookie (for browser requests)
    if (!token) {
      token = request.cookies.get("auth-token")?.value;
    }

    if (!token) {
      return null;
    }

    const supabase = getServiceSupabase();

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    // Get additional user data from database
    const { data: userData } = await supabase
      .from("users")
      .select("id, email, role, vendor_id")
      .eq("email", user.email)
      .single();

    if (userData) {
      return {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        vendor_id: userData.vendor_id,
      };
    }

    // Fallback: check if customer
    const { data: customer } = await supabase
      .from("customers")
      .select("id, email")
      .eq("email", user.email)
      .single();

    if (customer) {
      return {
        id: customer.id,
        email: customer.email,
        role: "customer",
      };
    }

    return null;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Auth verification error:", error);
    }
    return null;
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  request: NextRequest,
): Promise<{ user: AuthUser } | NextResponse> {
  const user = await verifyAuth(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized - Authentication required" }, { status: 401 });
  }

  return { user };
}

/**
 * Middleware to require admin role (vendor_admin, manager, or super admin)
 */
export async function requireAdmin(
  request: NextRequest,
): Promise<{ user: AuthUser } | NextResponse> {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult; // Return error response
  }

  const { user } = authResult;

  if (!user.role || !["vendor_admin", "manager"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

  return { user };
}

/**
 * Middleware to require vendor access and verify vendor_id from session (not headers)
 */
export async function requireVendor(
  request: NextRequest,
): Promise<{ user: AuthUser; vendorId: string } | NextResponse> {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult; // Return error response
  }

  const { user } = authResult;

  if (!user.vendor_id) {
    return NextResponse.json({ error: "Forbidden - Vendor access required" }, { status: 403 });
  }

  // SECURITY: Use vendor_id from authenticated session, not from headers
  // This prevents header spoofing attacks
  return { user, vendorId: user.vendor_id };
}

/**
 * Middleware to require customer access and verify customer_id from session (not headers)
 */
export async function requireCustomer(
  request: NextRequest,
): Promise<{ user: AuthUser; customerId: string } | NextResponse> {
  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult; // Return error response
  }

  const { user } = authResult;

  if (user.role !== "customer") {
    return NextResponse.json({ error: "Forbidden - Customer access required" }, { status: 403 });
  }

  // Get customer ID from database using authenticated user
  const supabase = getServiceSupabase();
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("email", user.email)
    .single();

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  // SECURITY: Use customer_id from authenticated session, not from headers
  // This prevents header spoofing attacks (Phase 3)
  return { user, customerId: customer.id };
}

/**
 * Helper to create secure cookie response with auth token
 */
export function createAuthCookie(token: string): {
  name: string;
  value: string;
  options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "strict" | "lax" | "none";
    maxAge: number;
    path: string;
  };
} {
  return {
    name: "auth-token",
    value: token,
    options: {
      httpOnly: true, // Prevent JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax", // CSRF protection (lax for better compatibility)
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    },
  };
}
