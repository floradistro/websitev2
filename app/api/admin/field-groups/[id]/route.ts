import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth/middleware";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET - Get single field group
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // SECURITY: Require admin authentication
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;
    const { data, error } = await supabase.from("field_groups").select("*").eq("id", id).single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      field_group: data,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error fetching field group:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
