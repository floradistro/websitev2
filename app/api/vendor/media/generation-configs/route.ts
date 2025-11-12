import { NextRequest, NextResponse } from "next/server";
import { withVendorAuth } from "@/lib/api/route-wrapper";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/vendor/media/generation-configs
 * Create a new generation configuration
 */
export const POST = withVendorAuth(async (request: NextRequest, { vendorId }) => {
  const body = await request.json();
  const {
    name,
    description,
    templateId,
    basePrompt,
    artStyle,
    format,
    includeText,
    referenceImages,
    approvedStyleDescription,
    rejectedStyleDescription,
    iterationsCount,
    successRate,
    totalGenerated,
    categories,
    tags,
  } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("generation_configs")
      .insert({
        vendor_id: vendorId,
        name: name.trim(),
        description: description?.trim() || null,
        template_id: templateId || null,
        base_prompt: basePrompt || "",
        art_style: artStyle || "default",
        format: format || "digital",
        include_text: includeText || "none",
        reference_images: referenceImages || [],
        approved_style_description: approvedStyleDescription || null,
        rejected_style_description: rejectedStyleDescription || null,
        iterations_count: iterationsCount || 1,
        success_rate: successRate || 0,
        total_generated: totalGenerated || 0,
        categories: categories || [],
        tags: tags || [],
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      config: data,
    });
  } catch (error) {
    console.error("Error creating generation config:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create configuration" },
      { status: 500 }
    );
  }
});

/**
 * GET /api/vendor/media/generation-configs
 * List generation configurations for the vendor
 */
export const GET = withVendorAuth(async (request: NextRequest, { vendorId }) => {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const sort = searchParams.get("sort") || "last_used"; // last_used, created_at, times_used, name
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    let query = supabase
      .from("generation_configs")
      .select("*")
      .or(`vendor_id.eq.${vendorId},is_public.eq.true`)
      .limit(limit);

    // Filter by category if provided
    if (category) {
      query = query.contains("categories", [category]);
    }

    // Apply sorting
    switch (sort) {
      case "created_at":
        query = query.order("created_at", { ascending: false });
        break;
      case "times_used":
        query = query.order("times_used", { ascending: false });
        break;
      case "name":
        query = query.order("name", { ascending: true });
        break;
      case "last_used":
      default:
        query = query.order("last_used", { ascending: false });
        break;
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      configs: data || [],
    });
  } catch (error) {
    console.error("Error fetching generation configs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch configurations" },
      { status: 500 }
    );
  }
});
