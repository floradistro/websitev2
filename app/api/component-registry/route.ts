/**
 * Component Registry API - Main Endpoint
 * GET /api/component-registry
 *
 * Returns complete registry information
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();

    // Get all components
    const { data: components, error: compError } = await supabase
      .from("component_templates")
      .select("*")
      .eq("is_public", true)
      .eq("is_deprecated", false)
      .order("category, name");

    if (compError) throw compError;

    // Get all variants
    const { data: variants, error: varError } = await supabase
      .from("component_variant_configs")
      .select("*")
      .order("component_key, is_default DESC");

    if (varError) throw varError;

    // Get all field bindings
    const { data: bindings, error: bindError } = await supabase
      .from("field_component_bindings")
      .select("*")
      .order("field_type, compatibility_score DESC");

    if (bindError) throw bindError;

    // Group components by category
    const byCategory = components?.reduce(
      (acc, comp) => {
        if (!acc[comp.category]) {
          acc[comp.category] = [];
        }
        acc[comp.category].push(comp);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Group bindings by field type
    const bindingsByField = bindings?.reduce(
      (acc, binding) => {
        if (!acc[binding.field_type]) {
          acc[binding.field_type] = [];
        }
        acc[binding.field_type].push(binding);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Build variant map
    const variantMap = variants?.reduce(
      (acc, variant) => {
        if (!acc[variant.component_key]) {
          acc[variant.component_key] = [];
        }
        acc[variant.component_key].push(variant);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    return NextResponse.json({
      success: true,
      registry: {
        version: "1.0.0",
        total_components: components?.length || 0,
        components: {
          all: components,
          by_category: byCategory,
        },
        variants: {
          all: variants,
          by_component: variantMap,
        },
        bindings: {
          all: bindings,
          by_field_type: bindingsByField,
        },
        stats: {
          atomic_components: byCategory?.atomic?.length || 0,
          composite_components: byCategory?.composite?.length || 0,
          smart_components: byCategory?.smart?.length || 0,
          total_variants: variants?.length || 0,
          total_bindings: bindings?.length || 0,
          smart_data_sources:
            components
              ?.filter((c) => c.fetches_real_data)
              .flatMap((c) => c.data_sources)
              .filter((v, i, a) => a.indexOf(v) === i) || [],
        },
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to fetch component registry:", error);
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch component registry" },
      { status: 500 },
    );
  }
}
