import { getServiceSupabase } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
import { requireVendor } from "@/lib/auth/middleware";
// GET /api/vendor/wholesale-customers - List all wholesale customers for vendor
export async function GET(request: NextRequest) {
  // SECURITY: Require vendor authentication
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);

    const vendorId = searchParams.get("vendor_id");
    const active = searchParams.get("active"); // 'true', 'false', or null (all)
    const pricingTier = searchParams.get("pricing_tier"); // 'wholesale', 'distributor', 'vip'
    const search = searchParams.get("search");

    if (!vendorId) {
      return NextResponse.json({ success: false, error: "vendor_id is required" }, { status: 400 });
    }

    let query = supabase
      .from("wholesale_customers")
      .select(
        `
        *,
        customer_vendor:customer_vendor_id(
          id,
          store_name
        )
      `,
      )
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    // Filter by active status
    if (active === "true") {
      query = query.eq("is_active", true);
    } else if (active === "false") {
      query = query.eq("is_active", false);
    }

    // Filter by pricing tier
    if (pricingTier) {
      query = query.eq("pricing_tier", pricingTier);
    }

    // Search by name (either external company name or vendor business name)
    if (search) {
      const { data: allCustomers, error } = await query;

      if (error) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Error fetching wholesale customers:", error);
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      const filtered = allCustomers?.filter((customer) => {
        const searchLower = search.toLowerCase();
        const externalName = customer.external_company_name?.toLowerCase() || "";
        const vendorName = customer.customer_vendor?.store_name?.toLowerCase() || "";
        return externalName.includes(searchLower) || vendorName.includes(searchLower);
      });

      return NextResponse.json({
        success: true,
        data: filtered || [],
        count: filtered?.length || 0,
      });
    }

    const { data: customers, error, count } = await query;

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching wholesale customers:", error);
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: customers || [],
      count: count || customers?.length || 0,
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in GET /api/vendor/wholesale-customers:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/vendor/wholesale-customers - Create, update, or delete wholesale customer
export async function POST(request: NextRequest) {
  // SECURITY: Require vendor authentication
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const supabase = getServiceSupabase();
    const body = await request.json();
    const { action, vendor_id, ...customerData } = body;

    if (!vendor_id) {
      return NextResponse.json({ success: false, error: "vendor_id is required" }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ success: false, error: "action is required" }, { status: 400 });
    }

    switch (action) {
      case "create": {
        // Validate: must have either customer_vendor_id OR external_company_name
        if (!customerData.customer_vendor_id && !customerData.external_company_name) {
          return NextResponse.json(
            {
              success: false,
              error: "Either customer_vendor_id or external_company_name is required",
            },
            { status: 400 },
          );
        }

        const { data: newCustomer, error } = await supabase
          .from("wholesale_customers")
          .insert({
            vendor_id,
            customer_vendor_id: customerData.customer_vendor_id || null,
            external_company_name: customerData.external_company_name || null,
            contact_name: customerData.contact_name || null,
            contact_email: customerData.contact_email || null,
            contact_phone: customerData.contact_phone || null,
            billing_address_line1: customerData.billing_address_line1 || null,
            billing_address_line2: customerData.billing_address_line2 || null,
            billing_city: customerData.billing_city || null,
            billing_state: customerData.billing_state || null,
            billing_postal_code: customerData.billing_postal_code || null,
            billing_country: customerData.billing_country || null,
            shipping_address_line1: customerData.shipping_address_line1 || null,
            shipping_address_line2: customerData.shipping_address_line2 || null,
            shipping_city: customerData.shipping_city || null,
            shipping_state: customerData.shipping_state || null,
            shipping_postal_code: customerData.shipping_postal_code || null,
            shipping_country: customerData.shipping_country || null,
            pricing_tier: customerData.pricing_tier || "wholesale",
            discount_percent: customerData.discount_percent || 0,
            payment_terms: customerData.payment_terms || null,
            credit_limit: customerData.credit_limit || null,
            tax_id: customerData.tax_id || null,
            notes: customerData.notes || null,
            is_active: customerData.is_active !== undefined ? customerData.is_active : true,
          })
          .select()
          .single();

        if (error) {
          if (process.env.NODE_ENV === "development") {
            logger.error("Error creating wholesale customer:", error);
          }
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data: newCustomer,
          message: "Wholesale customer created successfully",
        });
      }

      case "update": {
        const { id } = customerData;

        if (!id) {
          return NextResponse.json(
            { success: false, error: "customer id is required for update" },
            { status: 400 },
          );
        }

        // Validate: must have either customer_vendor_id OR external_company_name
        if (!customerData.customer_vendor_id && !customerData.external_company_name) {
          return NextResponse.json(
            {
              success: false,
              error: "Either customer_vendor_id or external_company_name is required",
            },
            { status: 400 },
          );
        }

        const { data: updatedCustomer, error } = await supabase
          .from("wholesale_customers")
          .update({
            customer_vendor_id: customerData.customer_vendor_id || null,
            external_company_name: customerData.external_company_name || null,
            contact_name: customerData.contact_name || null,
            contact_email: customerData.contact_email || null,
            contact_phone: customerData.contact_phone || null,
            billing_address_line1: customerData.billing_address_line1 || null,
            billing_address_line2: customerData.billing_address_line2 || null,
            billing_city: customerData.billing_city || null,
            billing_state: customerData.billing_state || null,
            billing_postal_code: customerData.billing_postal_code || null,
            billing_country: customerData.billing_country || null,
            shipping_address_line1: customerData.shipping_address_line1 || null,
            shipping_address_line2: customerData.shipping_address_line2 || null,
            shipping_city: customerData.shipping_city || null,
            shipping_state: customerData.shipping_state || null,
            shipping_postal_code: customerData.shipping_postal_code || null,
            shipping_country: customerData.shipping_country || null,
            pricing_tier: customerData.pricing_tier,
            discount_percent: customerData.discount_percent,
            payment_terms: customerData.payment_terms || null,
            credit_limit: customerData.credit_limit || null,
            tax_id: customerData.tax_id || null,
            notes: customerData.notes || null,
            is_active: customerData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("vendor_id", vendor_id) // Ensure vendor owns this customer
          .select()
          .single();

        if (error) {
          if (process.env.NODE_ENV === "development") {
            logger.error("Error updating wholesale customer:", error);
          }
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data: updatedCustomer,
          message: "Wholesale customer updated successfully",
        });
      }

      case "delete": {
        const { id } = customerData;

        if (!id) {
          return NextResponse.json(
            { success: false, error: "customer id is required for delete" },
            { status: 400 },
          );
        }

        // Soft delete by setting is_active to false
        const { data: deletedCustomer, error } = await supabase
          .from("wholesale_customers")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("vendor_id", vendor_id) // Ensure vendor owns this customer
          .select()
          .single();

        if (error) {
          if (process.env.NODE_ENV === "development") {
            logger.error("Error deleting wholesale customer:", error);
          }
          return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data: deletedCustomer,
          message: "Wholesale customer deactivated successfully",
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in POST /api/vendor/wholesale-customers:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
