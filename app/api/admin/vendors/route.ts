import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireAdmin } from "@/lib/auth/middleware";

export async function GET(request: NextRequest) {
  try {
    // SECURITY FIX: Require admin authentication
    const authResult = await requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Return auth error
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("vendors")
      .select("id, store_name, slug, logo_url, status, coming_soon")
      .order("store_name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, vendors: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
