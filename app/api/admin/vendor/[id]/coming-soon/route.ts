import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { toError } from "@/lib/errors";
import { requireAdmin } from "@/lib/auth/middleware";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // SECURITY: Require admin authentication
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { coming_soon, coming_soon_message, launch_date } = body;

    const supabase = getServiceSupabase();

    const updateData: any = {};
    if (typeof coming_soon === "boolean") updateData.coming_soon = coming_soon;
    if (coming_soon_message !== undefined) updateData.coming_soon_message = coming_soon_message;
    if (launch_date !== undefined) updateData.launch_date = launch_date;

    const { data, error } = await supabase
      .from("vendors")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const err = toError(error);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // SECURITY: Require admin authentication
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from("vendors")
      .select("coming_soon, coming_soon_message, launch_date, store_name, logo_url")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const err = toError(error);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
