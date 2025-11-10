/**
 * MCP (Model Context Protocol) Tools for Claude
 * Allows Claude to query database and access vendor data
 */

import { getServiceSupabase } from "@/lib/supabase/client";

export interface MCPTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

export const MCP_TOOLS: MCPTool[] = [
  {
    name: "get_vendor_products",
    description:
      "Fetch products for the current vendor. Returns product names, descriptions, prices, categories, and inventory levels.",
    input_schema: {
      type: "object",
      properties: {
        vendor_id: {
          type: "string",
          description: "The vendor UUID",
        },
        limit: {
          type: "number",
          description: "Max number of products to return (default 20)",
        },
        category: {
          type: "string",
          description: "Optional category filter",
        },
      },
      required: ["vendor_id"],
    },
  },
  {
    name: "get_vendor_categories",
    description: "Fetch all product categories for the vendor",
    input_schema: {
      type: "object",
      properties: {
        vendor_id: {
          type: "string",
          description: "The vendor UUID",
        },
      },
      required: ["vendor_id"],
    },
  },
  {
    name: "get_vendor_info",
    description: "Get vendor details like store name, logo, tagline, and branding",
    input_schema: {
      type: "object",
      properties: {
        vendor_id: {
          type: "string",
          description: "The vendor UUID",
        },
      },
      required: ["vendor_id"],
    },
  },
  {
    name: "get_top_selling_products",
    description: "Get the vendor's top-selling products",
    input_schema: {
      type: "object",
      properties: {
        vendor_id: {
          type: "string",
          description: "The vendor UUID",
        },
        limit: {
          type: "number",
          description: "Max number of products (default 10)",
        },
      },
      required: ["vendor_id"],
    },
  },
];

/**
 * Execute MCP tool and return results
 */
export async function executeMCPTool(toolName: string, input: any): Promise<any> {
  const supabase = getServiceSupabase();

  switch (toolName) {
    case "get_vendor_products": {
      const { vendor_id, limit = 20, category } = input;

      let query = supabase
        .from("products")
        .select(
          `
          id,
          name,
          description,
          strain_type,
          category_id,
          categories (name),
          product_pricing (
            base_price,
            pricing_tier_id,
            pricing_tiers (tier_name)
          ),
          product_inventory (
            quantity_available
          )
        `,
        )
        .eq("vendor_id", vendor_id)
        .eq("is_active", true)
        .limit(limit);

      if (category) {
        query = query.eq("categories.name", category);
      }

      const { data, error } = await query;

      if (error) {
        return { error: error.message };
      }

      return {
        products:
          data?.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            strain_type: p.strain_type,
            category: p.categories?.[0]?.name,
            price: p.product_pricing?.[0]?.base_price,
            pricing_tier: p.product_pricing?.[0]?.pricing_tiers?.[0]?.tier_name,
            stock: p.product_inventory?.[0]?.quantity_available || 0,
          })) || [],
        total: data?.length || 0,
      };
    }

    case "get_vendor_categories": {
      const { vendor_id } = input;

      const { data, error } = await supabase
        .from("categories")
        .select("id, name, parent_category_id")
        .eq("vendor_id", vendor_id)
        .eq("is_active", true);

      if (error) {
        return { error: error.message };
      }

      return {
        categories: data || [],
        total: data?.length || 0,
      };
    }

    case "get_vendor_info": {
      const { vendor_id } = input;

      const { data, error } = await supabase
        .from("vendors")
        .select("id, slug, store_name, tagline, logo_url, primary_color, secondary_color")
        .eq("id", vendor_id)
        .single();

      if (error) {
        return { error: error.message };
      }

      return data;
    }

    case "get_top_selling_products": {
      const { vendor_id, limit = 10 } = input;

      // Query based on order frequency
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          description,
          product_pricing (base_price)
        `,
        )
        .eq("vendor_id", vendor_id)
        .eq("is_active", true)
        .limit(limit);

      if (error) {
        return { error: error.message };
      }

      return {
        products: data || [],
        total: data?.length || 0,
      };
    }

    default:
      return { error: "Unknown tool" };
  }
}
