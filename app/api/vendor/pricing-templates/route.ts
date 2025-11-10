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
      tier_type: template.tier_type,
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
      context: template.context,
      is_active: template.is_active,
      is_default: template.is_default,
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
