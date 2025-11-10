import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import crypto from "crypto";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
 * Claim Account Endpoint
 *
 * Handles first-time login for migrated customers who have loyalty points
 * but no Supabase Auth account yet.
 *
 * Flow:
 * 1. Customer enters email
 * 2. System checks if customer exists (has loyalty data)
 * 3. System checks if auth account already exists
 * 4. If customer exists but no auth, create auth account with temp password
 * 5. Send password reset email so they can set their own password
 */
export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

  try {
    const supabase = getServiceSupabase();
    const { email, phone, redirectTo } = await request.json();

    if (!email && !phone) {
      return NextResponse.json(
        { error: "Email or phone number is required" },
        { status: 400, headers: corsHeaders },
      );
    }

    // Step 1: Check if customer exists in database (by email OR phone)
    // If BOTH email and phone are provided, prioritize phone (existing identifier)
    let customers: any[] | null = null;
    let customerError: any = null;

    if (phone) {
      // If phone is provided, search by phone (even if email is also provided)
      // This handles the case where user is adding email to a phone-only account
      const normalizedPhone = phone.replace(/\D/g, "");

      // Query all customers with this vendor and filter client-side
      // because phone numbers are stored with various formatting
      const result = await supabase
        .from("customers")
        .select("id, email, phone, first_name, last_name, loyalty_points, auth_user_id, vendor_id")
        .not("phone", "is", null);

      if (result.data) {
        // Filter to find phone numbers that match when stripped of formatting
        customers = result.data.filter((c) => {
          if (!c.phone) return false;
          const dbPhoneStripped = c.phone.replace(/\D/g, "");
          return dbPhoneStripped === normalizedPhone;
        });
      } else {
        customers = [];
      }
      customerError = result.error;
    } else if (email) {
      // Only search by email if phone is not provided
      const result = await supabase
        .from("customers")
        .select("id, email, phone, first_name, last_name, loyalty_points, auth_user_id, vendor_id")
        .eq("email", email.toLowerCase().trim());
      customers = result.data;
      customerError = result.error;
    }

    if (customerError || !customers || customers.length === 0) {
      return NextResponse.json(
        {
          error:
            "No account found with this email or phone number. Please contact support or create a new account.",
        },
        { status: 404, headers: corsHeaders },
      );
    }

    // If multiple customers found (phone number can match multiple), take the one with most loyalty points
    const customer =
      customers.length > 1
        ? customers.reduce((prev, current) =>
            (current.loyalty_points || 0) > (prev.loyalty_points || 0) ? current : prev,
          )
        : customers[0];

    if (customerError || !customer) {
      return NextResponse.json(
        {
          error:
            "No account found with this email. Please contact support or create a new account.",
        },
        { status: 404, headers: corsHeaders },
      );
    }

    // Step 2: Check if auth account already exists
    if (customer.auth_user_id) {
      return NextResponse.json(
        {
          error:
            'This account is already activated. Please use "Forgot Password" if you need to reset your password.',
        },
        { status: 400, headers: corsHeaders },
      );
    }

    // Step 2.5: If customer doesn't have email, we need to ask for one
    if (
      !customer.email ||
      customer.email.includes("@phone.local") ||
      customer.email.includes("@alpine.local")
    ) {
      // Customer only has phone number, need to collect email
      if (!email) {
        return NextResponse.json(
          {
            needsEmail: true,
            message:
              "We found your account! Please provide an email address to complete activation.",
            customerInfo: {
              firstName: customer.first_name,
              lastName: customer.last_name,
              phone: customer.phone,
              loyaltyPoints: customer.loyalty_points,
            },
          },
          { status: 200, headers: corsHeaders },
        );
      }

      // Update customer with the provided email
      const { error: updateError } = await supabase
        .from("customers")
        .update({ email: email.toLowerCase().trim() })
        .eq("id", customer.id);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update email. Please try again." },
          { status: 500, headers: corsHeaders },
        );
      }

      customer.email = email.toLowerCase().trim();
    }

    // Step 3: Customer exists but no auth account - create one
    // Generate a secure temporary password
    const tempPassword = crypto.randomBytes(16).toString("base64").slice(0, 12) + "!Aa1";

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: customer.email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: customer.first_name || "",
        last_name: customer.last_name || "",
        phone: customer.phone || "",
        migrated: true,
        claimed_at: new Date().toISOString(),
      },
    });

    if (authError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error creating auth user:", authError);
      }
      return NextResponse.json(
        {
          error: "Failed to create auth account. Please try again or contact support.",
        },
        { status: 500, headers: corsHeaders },
      );
    }

    // Step 4: Link auth account to customer record
    const { error: linkError } = await supabase
      .from("customers")
      .update({ auth_user_id: authData.user.id })
      .eq("id", customer.id);

    if (linkError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error linking auth to customer:", linkError);
      }
      // Rollback - delete the auth user we just created
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to link account. Please try again." },
        { status: 500, headers: corsHeaders },
      );
    }

    // Step 5: Send password reset email
    const resetRedirectUrl =
      redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(customer.email, {
      redirectTo: resetRedirectUrl,
    });

    if (resetError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error sending reset email:", resetError);
      }
      return NextResponse.json(
        {
          success: true,
          message:
            'Account created but failed to send email. Please use "Forgot Password" to set your password.',
          requiresPasswordReset: true,
        },
        { status: 200, headers: corsHeaders },
      );
    }

    // Success!
    return NextResponse.json(
      {
        success: true,
        message: `Account claimed successfully! We've sent a password reset email to ${customer.email}. Check your inbox to set your password.`,
        loyaltyPoints: customer.loyalty_points || 0,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in claim account:", err);
    }
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500, headers: corsHeaders },
    );
  }
}
