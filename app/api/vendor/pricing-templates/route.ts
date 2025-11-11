import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
/**
 * GET /api/vendor/pricing-templates
 * Fetch all pricing templates for a vendor
 */
export async function GET(request: NextRequest) {
  try {
    // SECURITY: Use requireVendor to get vendor_id from authenticated session
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;

    const { vendorId } = authResult;

    const supabase = getServiceSupabase();

    // Fetch pricing templates for this vendor
    const { data: templates, error } = await supabase
      .from("pricing_tier_templates")
      .select("*")
      .or(`vendor_id.eq.${vendorId},vendor_id.is.null`)
      .eq("is_active", true)
      .order("name");

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching pricing templates:", error);
      }
      return NextResponse.json({ error: "Failed to fetch pricing templates" }, { status: 500 });
    }

    // Transform the data to match the expected format
    const formattedTemplates = templates.map((template: any) => ({
      id: template.id,
      vendor_id: template.vendor_id,
      name: template.name,
      slug: template.slug,
      description: template.description,
      quality_tier: template.quality_tier,
      applicable_to_categories: template.category_id ? [template.category_id] : [],
      price_breaks: (template.default_tiers || []).map((tier: any, index: number) => ({
        break_id: tier.id || `${index + 1}`,
        label: tier.label,
        qty: tier.quantity,
        unit: tier.unit,
        price: tier.default_price,
        sort_order: tier.sort_order || index + 1,
      })),
      is_active: template.is_active,
      created_at: template.created_at,
      updated_at: template.updated_at,
    }));

    return NextResponse.json({
      success: true,
      blueprints: formattedTemplates, // Keep as 'blueprints' for backward compatibility
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in pricing templates route:", error);
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/vendor/pricing-templates
 * Create a new pricing template
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;

    const { vendorId } = authResult;
    const body = await request.json();

    const supabase = getServiceSupabase();

    // Create slug from name
    const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Transform price_breaks to default_tiers format
    const default_tiers = (body.price_breaks || []).map((pb: any) => ({
      id: pb.break_id,
      label: pb.label,
      quantity: pb.qty,
      unit: pb.unit,
      default_price: pb.default_price || pb.price,
      sort_order: pb.sort_order
    }));

    // Get first category ID from applicable_to_categories
    const category_id = body.applicable_to_categories?.[0] || null;

    const templateData = {
      vendor_id: vendorId,
      name: body.name,
      slug: slug,
      description: body.description || null,
      quality_tier: body.quality_tier || null,
      category_id: category_id,
      default_tiers: default_tiers,
      is_active: true
    };

    const { data, error } = await supabase
      .from("pricing_tier_templates")
      .insert(templateData)
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error creating pricing template:", error);
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template: data
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in POST pricing template:", error);
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/vendor/pricing-templates
 * Update an existing pricing template
 */
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;

    const { vendorId } = authResult;
    const body = await request.json();

    if (!body.id) {
      return NextResponse.json({ success: false, error: "Template ID required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Transform price_breaks to default_tiers format
    const default_tiers = (body.price_breaks || []).map((pb: any) => ({
      id: pb.break_id,
      label: pb.label,
      quantity: pb.qty,
      unit: pb.unit,
      default_price: pb.default_price || pb.price,
      sort_order: pb.sort_order
    }));

    // Get first category ID from applicable_to_categories
    const category_id = body.applicable_to_categories?.[0] || null;

    const templateData = {
      name: body.name,
      description: body.description || null,
      quality_tier: body.quality_tier || null,
      category_id: category_id,
      default_tiers: default_tiers,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("pricing_tier_templates")
      .update(templateData)
      .eq("id", body.id)
      .eq("vendor_id", vendorId)
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error updating pricing template:", error);
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      template: data
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in PUT pricing template:", error);
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/vendor/pricing-templates
 * Delete (deactivate) a pricing template
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;

    const { vendorId } = authResult;
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("id");

    if (!templateId) {
      return NextResponse.json({ success: false, error: "Template ID required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from("pricing_tier_templates")
      .update({ is_active: false })
      .eq("id", templateId)
      .eq("vendor_id", vendorId);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error deleting pricing template:", error);
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in DELETE pricing template:", error);
    }
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
