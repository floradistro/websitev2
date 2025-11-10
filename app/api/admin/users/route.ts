import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const revalidate = 30; // Cache for 30 seconds

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("users")
      .select(
        `
        *,
        vendors(store_name, email)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error loading users:", error);
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, users: data || [] });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in users API:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const supabase = getServiceSupabase();

    if (action === "create") {
      const {
        email,
        first_name,
        last_name,
        role = "pos_staff",
        vendor_id,
        phone,
        employee_id,
      } = data;

      if (!email || !first_name || !last_name) {
        return NextResponse.json(
          {
            success: false,
            error: "Email, first name, and last name are required",
          },
          { status: 400 },
        );
      }

      try {
        // Step 1: Create user in Supabase Auth
        const tempPassword =
          Math.random().toString(36).slice(-10) +
          Math.random().toString(36).slice(-10).toUpperCase() +
          "!123";

        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            first_name,
            last_name,
            role,
          },
        });

        if (authError) {
          if (process.env.NODE_ENV === "development") {
            logger.error("Error creating auth user:", authError);
          }
          return NextResponse.json(
            {
              success: false,
              error: `Failed to create login: ${authError.message}`,
            },
            { status: 400 },
          );
        }

        // Step 2: Create user in users table with auth_user_id
        const { data: user, error: dbError } = await supabase
          .from("users")
          .insert({
            auth_user_id: authUser.user.id,
            email,
            first_name,
            last_name,
            role,
            vendor_id: vendor_id || null,
            phone,
            employee_id,
            status: "active",
            login_enabled: true,
          })
          .select()
          .single();

        if (dbError) {
          if (process.env.NODE_ENV === "development") {
            logger.error("Error creating user in database:", dbError);
          }
          // Cleanup: delete auth user if database insert fails
          await supabase.auth.admin.deleteUser(authUser.user.id);
          return NextResponse.json(
            {
              success: false,
              error: `Database error: ${dbError.message}`,
            },
            { status: 400 },
          );
        }

        // Step 3: Send password reset email so they can set their own password
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password`,
        });

        if (resetError) {
          if (process.env.NODE_ENV === "development") {
            logger.warn("Failed to send password reset email:", resetError);
          }
          // Don't fail the whole operation if email fails
        }

        return NextResponse.json({
          success: true,
          user,
          message: `User ${first_name} ${last_name} created successfully. Password reset email sent to ${email}.`,
        });
      } catch (error) {
        const err = toError(error);
        if (process.env.NODE_ENV === "development") {
          logger.error("Error in user creation:", err);
        }
        return NextResponse.json(
          {
            success: false,
            error: err.message || "Failed to create user",
          },
          { status: 500 },
        );
      }
    }

    if (action === "update") {
      const { user_id, first_name, last_name, phone, role, employee_id, vendor_id } = data;

      if (!user_id) {
        return NextResponse.json(
          {
            success: false,
            error: "user_id is required",
          },
          { status: 400 },
        );
      }

      const updatePayload: any = {};
      if (first_name !== undefined) updatePayload.first_name = first_name;
      if (last_name !== undefined) updatePayload.last_name = last_name;
      if (phone !== undefined) updatePayload.phone = phone;
      if (role !== undefined) updatePayload.role = role;
      if (employee_id !== undefined) updatePayload.employee_id = employee_id;
      if (vendor_id !== undefined) updatePayload.vendor_id = vendor_id;

      const { error } = await supabase.from("users").update(updatePayload).eq("id", user_id);

      if (error) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Error updating user:", error);
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "User updated successfully",
      });
    }

    if (action === "toggle_status") {
      const { user_id, status } = data;

      if (!user_id || !status) {
        return NextResponse.json(
          {
            success: false,
            error: "user_id and status are required",
          },
          { status: 400 },
        );
      }

      const { error } = await supabase
        .from("users")
        .update({ status, login_enabled: status === "active" })
        .eq("id", user_id);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: `User ${status === "active" ? "activated" : "deactivated"}`,
      });
    }

    if (action === "delete") {
      const { user_id } = data;

      if (!user_id) {
        return NextResponse.json(
          {
            success: false,
            error: "user_id is required",
          },
          { status: 400 },
        );
      }

      const { error } = await supabase.from("users").delete().eq("id", user_id);

      if (error) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Error deleting user:", error);
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: "User deleted successfully",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action. Valid actions: create, update, toggle_status, delete",
      },
      { status: 400 },
    );
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in users API:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
