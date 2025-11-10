import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
/**
 * Approve wholesale application
 * Admin only
 */
export async function POST(request: NextRequest, {
  // SECURITY: Require authentication
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
 params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();

    const { adminId, notes } = body;
    const { id: applicationId } = await params;

    if (!adminId) {
      return NextResponse.json({ error: "Admin ID required" }, { status: 400 });
    }

    // Update application status
    const { data: application, error: updateError } = await supabase
      .from("wholesale_applications")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        review_notes: notes,
      })
      .eq("id", applicationId)
      .select()
      .single();

    if (updateError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Update application error:", updateError);
      }
      return NextResponse.json(
        {
          error: "Failed to approve application",
          details: updateError.message,
        },
        { status: 500 },
      );
    }

    // The trigger should auto-update the customer, but let's ensure it
    const { error: customerError } = await supabase
      .from("customers")
      .update({
        is_wholesale_approved: true,
        wholesale_approved_at: new Date().toISOString(),
        wholesale_approved_by: adminId,
        wholesale_application_status: "approved",
        wholesale_business_name: application.business_name,
        wholesale_license_number: application.license_number,
        wholesale_license_expiry: application.license_expiry,
        wholesale_tax_id: application.tax_id,
      })
      .eq("id", application.customer_id);

    if (customerError) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Update customer error:", customerError);
      }
    }

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Approve wholesale application error:", err);
    }
    return NextResponse.json(
      { error: "Failed to approve application", details: err.message },
      { status: 500 },
    );
  }
}
