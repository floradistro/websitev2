import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/vendor/labels/templates
 * Fetch saved label templates for a vendor
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get("vendorId");
    const locationId = searchParams.get("locationId");

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: "Vendor ID required" },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from("label_templates")
      .select("*")
      .eq("user_id", vendorId)
      .order("updated_at", { ascending: false });

    // Filter by location if specified
    if (locationId) {
      query = query.eq("location_id", locationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching templates:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      templates: data || [],
    });
  } catch (error: any) {
    console.error("Error in templates API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vendor/labels/templates
 * Create a new label template
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { vendorId, locationId, name, description, templateType, configData } = body;

    if (!vendorId || !name || !configData) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("label_templates")
      .insert({
        user_id: vendorId,
        location_id: locationId || null,
        name,
        description: description || null,
        template_type: templateType || "avery_5160",
        config_data: configData,
        is_public: false,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating template:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      template: data,
    });
  } catch (error: any) {
    console.error("Error in templates API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/vendor/labels/templates
 * Update an existing template
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { templateId, name, description, configData } = body;

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: "Template ID required" },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (configData) updates.config_data = configData;

    const { data, error } = await supabase
      .from("label_templates")
      .update(updates)
      .eq("id", templateId)
      .select()
      .single();

    if (error) {
      console.error("Error updating template:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      template: data,
    });
  } catch (error: any) {
    console.error("Error in templates API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/vendor/labels/templates
 * Delete a template
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: "Template ID required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("label_templates")
      .delete()
      .eq("id", templateId);

    if (error) {
      console.error("Error deleting template:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Error in templates API:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
