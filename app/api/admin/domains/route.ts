import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
// GET - List all domains (admin)
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    const { data: domains, error } = await supabase
      .from("vendor_domains")
      .select(
        `
        *,
        vendor:vendors(id, store_name, slug, email)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, domains });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error fetching domains:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE - Remove a domain (admin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get("id");

    if (!domainId) {
      return NextResponse.json({ error: "Domain ID required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { error } = await supabase.from("vendor_domains").delete().eq("id", domainId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Domain removed successfully",
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error deleting domain:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
