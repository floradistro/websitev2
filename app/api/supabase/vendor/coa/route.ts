import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

export async function GET(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");
    const activeOnly = searchParams.get("active") === "true";

    const supabase = getServiceSupabase();

    let query = supabase
      .from("vendor_coas")
      .select(
        `
        *,
        product:product_id(id, name, slug, featured_image)
      `,
      )
      .eq("vendor_id", vendorId);

    if (productId) {
      query = query.eq("product_id", productId);
    }

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    query = query.order("upload_date", { ascending: false });

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      coas: data || [],
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const {
      product_id,
      file_name,
      file_url,
      file_size,
      lab_name,
      test_date,
      expiry_date,
      batch_number,
      test_results,
    } = body;

    if (!file_name || !file_url) {
      return NextResponse.json(
        {
          error: "Missing required fields: file_name, file_url",
        },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    const { data: coa, error: coaError } = await supabase
      .from("vendor_coas")
      .insert({
        vendor_id: vendorId,
        product_id,
        file_name,
        file_url,
        file_size,
        lab_name,
        test_date,
        expiry_date,
        batch_number,
        test_results,
        is_active: true,
      })
      .select()
      .single();

    if (coaError) {
      return NextResponse.json({ error: coaError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      coa,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
