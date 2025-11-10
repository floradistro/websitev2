import { getServiceSupabase } from "@/lib/supabase/client";
import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
// GET /api/vendor/suppliers - List all suppliers for vendor
export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const { searchParams } = new URL(request.url);

    const vendorId = searchParams.get("vendor_id");
    const active = searchParams.get("active"); // 'true', 'false', or null (all)
    const search = searchParams.get("search");

    if (!vendorId) {
      return NextResponse.json({ success: false, error: "vendor_id is required" }, { status: 400 });
    }

    let query = supabase
      .from("suppliers")
      .select(
        `
        *,
        supplier_vendor:supplier_vendor_id(
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

    // Search by name (either external name or vendor business name)
    if (search) {
      // We need to handle search for both external_name and linked vendor names
      // For simplicity, we'll fetch all and filter in JS
      const { data: allSuppliers, error } = await query;

      if (error) {
        if (process.env.NODE_ENV === "development") {
          logger.error("Error fetching suppliers:", err);
        }
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
      }

      const filtered = allSuppliers?.filter((supplier) => {
        const searchLower = search.toLowerCase();
        const externalName = supplier.external_name?.toLowerCase() || "";
        const vendorName = supplier.supplier_vendor?.business_name?.toLowerCase() || "";
        return externalName.includes(searchLower) || vendorName.includes(searchLower);
      });

      return NextResponse.json({
        success: true,
        data: filtered || [],
        count: filtered?.length || 0,
      });
    }

    const { data: suppliers, error, count } = await query;

    if (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Error fetching suppliers:", err);
      }
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: suppliers || [],
      count: count || suppliers?.length || 0,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in GET /api/vendor/suppliers:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/vendor/suppliers - Create, update, or delete supplier
export async function POST(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    const body = await request.json();
    const { action, vendor_id, ...supplierData } = body;

    if (!vendor_id) {
      return NextResponse.json({ success: false, error: "vendor_id is required" }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ success: false, error: "action is required" }, { status: 400 });
    }

    switch (action) {
      case "create": {
        // Validate: must have either supplier_vendor_id OR external_name
        if (!supplierData.supplier_vendor_id && !supplierData.external_name) {
          return NextResponse.json(
            {
              success: false,
              error: "Either supplier_vendor_id or external_name is required",
            },
            { status: 400 },
          );
        }

        const { data: newSupplier, error } = await supabase
          .from("suppliers")
          .insert({
            vendor_id,
            supplier_vendor_id: supplierData.supplier_vendor_id || null,
            external_name: supplierData.external_name || null,
            external_company: supplierData.external_company || null,
            contact_name: supplierData.contact_name || null,
            contact_email: supplierData.contact_email || null,
            contact_phone: supplierData.contact_phone || null,
            address_line1: supplierData.address_line1 || null,
            address_line2: supplierData.address_line2 || null,
            city: supplierData.city || null,
            state: supplierData.state || null,
            zip: supplierData.zip || null,
            country: supplierData.country || null,
            payment_terms: supplierData.payment_terms || null,
            notes: supplierData.notes || null,
            is_active: supplierData.is_active !== undefined ? supplierData.is_active : true,
          })
          .select()
          .maybeSingle();

        if (error) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Error creating supplier:", err);
          }
          return NextResponse.json({ success: false, error: err.message }, { status: 500 });
        }

        if (!newSupplier) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Supplier creation returned null");
          }
          return NextResponse.json(
            { success: false, error: "Failed to create supplier" },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          data: newSupplier,
          message: "Supplier created successfully",
        });
      }

      case "update": {
        const { id } = supplierData;

        if (!id) {
          return NextResponse.json(
            { success: false, error: "supplier id is required for update" },
            { status: 400 },
          );
        }

        // Validate: must have either supplier_vendor_id OR external_name
        if (!supplierData.supplier_vendor_id && !supplierData.external_name) {
          return NextResponse.json(
            {
              success: false,
              error: "Either supplier_vendor_id or external_name is required",
            },
            { status: 400 },
          );
        }

        const { data: updatedSupplier, error } = await supabase
          .from("suppliers")
          .update({
            supplier_vendor_id: supplierData.supplier_vendor_id || null,
            external_name: supplierData.external_name || null,
            external_company: supplierData.external_company || null,
            contact_name: supplierData.contact_name || null,
            contact_email: supplierData.contact_email || null,
            contact_phone: supplierData.contact_phone || null,
            address_line1: supplierData.address_line1 || null,
            address_line2: supplierData.address_line2 || null,
            city: supplierData.city || null,
            state: supplierData.state || null,
            zip: supplierData.zip || null,
            country: supplierData.country || null,
            payment_terms: supplierData.payment_terms || null,
            notes: supplierData.notes || null,
            is_active: supplierData.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("vendor_id", vendor_id) // Ensure vendor owns this supplier
          .select()
          .maybeSingle();

        if (error) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Error updating supplier:", err);
          }
          return NextResponse.json({ success: false, error: err.message }, { status: 500 });
        }

        if (!updatedSupplier) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Supplier update affected 0 rows - supplier may have been deleted");
          }
          return NextResponse.json(
            {
              success: false,
              error: "Supplier not found or was deleted. Please refresh the page.",
            },
            { status: 404 },
          );
        }

        return NextResponse.json({
          success: true,
          data: updatedSupplier,
          message: "Supplier updated successfully",
        });
      }

      case "delete": {
        const { id } = supplierData;

        if (!id) {
          return NextResponse.json(
            { success: false, error: "supplier id is required for delete" },
            { status: 400 },
          );
        }

        // Soft delete by setting is_active to false
        const { data: deletedSupplier, error } = await supabase
          .from("suppliers")
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("vendor_id", vendor_id) // Ensure vendor owns this supplier
          .select()
          .maybeSingle();

        if (error) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Error deleting supplier:", err);
          }
          return NextResponse.json({ success: false, error: err.message }, { status: 500 });
        }

        if (!deletedSupplier) {
          if (process.env.NODE_ENV === "development") {
            logger.error("❌ Supplier delete affected 0 rows - supplier may have been deleted");
          }
          return NextResponse.json(
            {
              success: false,
              error: "Supplier not found or was already deleted. Please refresh the page.",
            },
            { status: 404 },
          );
        }

        return NextResponse.json({
          success: true,
          data: deletedSupplier,
          message: "Supplier deactivated successfully",
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Error in POST /api/vendor/suppliers:", err);
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
