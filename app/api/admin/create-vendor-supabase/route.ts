import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function POST(request: NextRequest) {
  try {
    const { store_name, email, username, password } = await request.json();

    if (!store_name || !email || !username || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "store_name, email, username, and password are required",
        },
        { status: 400 },
      );
    }

    const slug = store_name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const supabase = getServiceSupabase();

    // 1. Create vendor in Supabase
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .insert({
        email,
        store_name,
        slug,
        status: "active",
      })
      .select()
      .single();

    if (vendorError) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to create vendor in database",
          error: vendorError.message,
        },
        { status: 500 },
      );
    }

    // 2. Create Supabase auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        vendor_id: vendor.id,
        store_name,
        role: "vendor_owner",
      },
    });

    if (authError) {
      // Rollback vendor creation if auth fails
      await supabase.from("vendors").delete().eq("id", vendor.id);

      return NextResponse.json(
        {
          success: false,
          message: "Failed to create auth user",
          error: authError.message,
        },
        { status: 500 },
      );
    }

    // 3. Create user profile with vendor_owner role
    const { error: userError } = await supabase.from("users").insert({
      auth_user_id: authUser.user.id,
      email,
      first_name: store_name,
      last_name: "Owner",
      role: "vendor_owner",
      vendor_id: vendor.id,
      status: "active",
      login_enabled: true,
    });

    if (userError) {
      if (process.env.NODE_ENV === "development") {
        logger.warn("User profile creation error:", userError);
      }
      // Don't fail - auth user exists
    }

    // 4. Create default warehouse location for vendor
    const { data: location, error: locationError } = await supabase
      .from("locations")
      .insert({
        name: `${store_name} Warehouse`,
        slug: `${slug}-warehouse`,
        type: "vendor",
        vendor_id: vendor.id,
        city: "",
        state: "",
        is_active: true,
        is_default: true,
        pos_enabled: true,
        accepts_online_orders: true,
        accepts_transfers: true,
      })
      .select()
      .single();

    if (locationError) {
      if (process.env.NODE_ENV === "development") {
        logger.warn("⚠️ Failed to create vendor location:", locationError);
      }
      // Don't fail - vendor can create location later
    }

    // 5. Send password reset email so vendor can set their own password

    const { data: resetData, error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`,
      },
    );

    if (resetError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("❌ Failed to send password reset email:", resetError);
      }
      return NextResponse.json({
        success: true,
        message: "Vendor created successfully, but email failed to send.",
        vendor: {
          id: vendor.id,
          email: vendor.email,
          store_name: vendor.store_name,
          slug: vendor.slug,
          status: vendor.status,
        },
        auth_user_id: authUser.user?.id,
        location_id: location?.id,
        email_error: resetError.message,
        note: "Admin must manually send password reset email from Supabase Dashboard",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Vendor created successfully! Password reset email sent.",
      vendor: {
        id: vendor.id,
        email: vendor.email,
        store_name: vendor.store_name,
        slug: vendor.slug,
        status: vendor.status,
      },
      auth_user_id: authUser.user?.id,
      location_id: location?.id,
      login_note: `Vendor can login at /vendor/login with email: ${email}`,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Create vendor error:", err);
    }
    return NextResponse.json(
      {
        success: false,
        message: err.message || "Failed to create vendor",
        error: error.toString(),
      },
      { status: 500 },
    );
  }
}
