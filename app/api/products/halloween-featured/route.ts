/**
 * Halloween Featured Products API
 * Pulls REAL Flora Distro products from database
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  try {
    // Query real products from Flora Distro
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, price, featured_image, custom_fields, slug")
      .eq("vendor_id", "cd2e1122-d511-4edb-be5d-98ef274b4baf")
      .eq("status", "published")
      .eq("featured", true)
      .limit(6);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Database error:", error);
      }
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 },
      );
    }

    // Transform to Halloween homepage format
    const halloweenProducts = products.map((product) => {
      const fields = product.custom_fields || {};

      return {
        id: product.id,
        name: product.name,
        strain_type: fields.strain_type || "Hybrid",
        thc_percent: parseFloat(fields.thc_percentage || "0"),
        cbd_percent: parseFloat(fields.cbd_percentage || "0"),
        price: parseFloat(product.price || "0"),
        image: product.featured_image || "/products/placeholder.jpg",
        effects: fields.effects || [],
        terpenes: fields.terpenes || [],
      };
    });

    return NextResponse.json(halloweenProducts);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error fetching Halloween products:", error);
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
