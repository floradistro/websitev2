/**
 * API: Import Business Template
 * POST - Import template categories and field groups to vendor account
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require vendor authentication (Phase 2)
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body = await request.json();
    const { template_id, import_categories, import_field_groups } = body;

    if (!template_id) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Check if already imported
    const { data: existingImport } = await supabase
      .from("vendor_template_imports")
      .select("id")
      .eq("vendor_id", vendorId)
      .eq("template_id", template_id)
      .single();

    let categoriesCreated = 0;
    let fieldGroupsCreated = 0;

    // Import Categories
    if (import_categories) {
      const { data: templateCategories, error: categoriesError } = await supabase
        .from("template_categories")
        .select("*")
        .eq("template_id", template_id)
        .order("display_order", { ascending: true });

      if (categoriesError) throw categoriesError;

      // Create vendor-specific copies of categories
      const categoryMapping = new Map<string, string>(); // old ID -> new ID

      for (const templateCat of templateCategories || []) {
        // Check if already exists
        const { data: existing } = await supabase
          .from("categories")
          .select("id")
          .eq("vendor_id", vendorId)
          .eq("source_template_category_id", templateCat.id)
          .single();

        if (existing) {
          categoryMapping.set(templateCat.id, existing.id);
          continue; // Skip if already imported
        }

        // Create unique slug for vendor
        const baseSlug = templateCat.slug;
        let finalSlug = baseSlug;
        const { data: slugCheck } = await supabase
          .from("categories")
          .select("slug")
          .eq("slug", baseSlug)
          .or(`vendor_id.is.null,vendor_id.eq.${vendorId}`)
          .single();

        if (slugCheck) {
          finalSlug = `${baseSlug}-${Date.now()}`;
        }

        const { data: newCategory, error: createError } = await supabase
          .from("categories")
          .insert({
            name: templateCat.name,
            slug: finalSlug,
            description: templateCat.description,
            icon: templateCat.icon,
            image_url: templateCat.image_url,
            vendor_id: vendorId,
            source_template_id: template_id,
            source_template_category_id: templateCat.id,
            display_order: templateCat.display_order,
          })
          .select("id")
          .single();

        if (createError) {
          if (process.env.NODE_ENV === "development") {
            logger.error("Error creating category:", createError);
          }
          continue;
        }

        if (newCategory) {
          categoryMapping.set(templateCat.id, newCategory.id);
          categoriesCreated++;
        }
      }

      // Handle parent relationships (for subcategories)
      for (const templateCat of templateCategories || []) {
        if (templateCat.parent_id && categoryMapping.has(templateCat.parent_id)) {
          const childId = categoryMapping.get(templateCat.id);
          const newParentId = categoryMapping.get(templateCat.parent_id);

          if (childId && newParentId) {
            await supabase.from("categories").update({ parent_id: newParentId }).eq("id", childId);
          }
        }
      }
    }

    // Import Field Groups
    if (import_field_groups) {
      const { data: templateFieldGroups, error: fieldGroupsError } = await supabase
        .from("template_field_groups")
        .select("*")
        .eq("template_id", template_id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (fieldGroupsError) throw fieldGroupsError;

      for (const templateFieldGroup of templateFieldGroups || []) {
        // Check if already exists
        const { data: existing } = await supabase
          .from("vendor_product_fields")
          .select("id")
          .eq("vendor_id", vendorId)
          .eq("source_template_field_group_id", templateFieldGroup.id)
          .single();

        if (existing) {
          continue; // Skip if already imported
        }

        // Create unique slug for vendor
        const baseSlug = templateFieldGroup.slug;
        let finalSlug = baseSlug;
        const { data: slugCheck } = await supabase
          .from("vendor_product_fields")
          .select("slug")
          .eq("vendor_id", vendorId)
          .eq("slug", baseSlug)
          .single();

        if (slugCheck) {
          finalSlug = `${baseSlug}-${Date.now()}`;
        }

        const { error: createError } = await supabase.from("vendor_product_fields").insert({
          vendor_id: vendorId,
          name: templateFieldGroup.name,
          slug: finalSlug,
          description: templateFieldGroup.description,
          fields: templateFieldGroup.fields,
          source_template_id: template_id,
          source_template_field_group_id: templateFieldGroup.id,
          is_active: true,
        });

        if (createError) {
          if (process.env.NODE_ENV === "development") {
            logger.error("Error creating field group:", createError);
          }
          continue;
        }

        fieldGroupsCreated++;
      }
    }

    // Record import
    if (!existingImport) {
      await supabase.from("vendor_template_imports").insert({
        vendor_id: vendorId,
        template_id: template_id,
        imported_categories: import_categories,
        imported_field_groups: import_field_groups,
      });
    } else {
      await supabase
        .from("vendor_template_imports")
        .update({
          imported_categories: import_categories,
          imported_field_groups: import_field_groups,
        })
        .eq("vendor_id", vendorId)
        .eq("template_id", template_id);
    }

    return NextResponse.json({
      success: true,
      categories_created: categoriesCreated,
      field_groups_created: fieldGroupsCreated,
      message: "Template imported successfully",
    });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Import template error:", err);
    }
    return NextResponse.json(
      { error: err.message || "Failed to import template" },
      { status: 500 },
    );
  }
}
