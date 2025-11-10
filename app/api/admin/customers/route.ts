import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/middleware";
import { createClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  // SECURITY: Require admin authentication
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { user } = authResult;
    const isReadOnly = user.role === "readonly";

    // Get vendors with product counts
    const { data: vendors, error } = await supabase
      .from("vendors")
      .select(
        `
        id,
        store_name,
        email,
        created_at,
        status,
        metadata,
        updated_at
      `,
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    // Get product counts for each vendor
    const vendorIds = vendors?.map((v) => v.id) || [];
    const { data: productCounts } = await supabase
      .from("products")
      .select("vendor_id")
      .in("vendor_id", vendorIds);

    // Count products per vendor
    const productCountMap: Record<string, number> = {};
    productCounts?.forEach((p) => {
      productCountMap[p.vendor_id] = (productCountMap[p.vendor_id] || 0) + 1;
    });

    // Transform to customer format
    const customers =
      vendors?.map((vendor) => {
        // Determine status
        let displayStatus: "active" | "trial" | "churned" = "active";

        const createdDate = new Date(vendor.created_at);
        const daysSinceCreated = Math.floor(
          (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (vendor.status !== "active") {
          displayStatus = "churned";
        } else if (daysSinceCreated <= 30) {
          displayStatus = "trial";
        }

        return {
          id: vendor.id,
          email: isReadOnly ? "•••@•••.•••" : vendor.email, // Hide emails for readonly users
          name: vendor.store_name,
          created_at: vendor.created_at,
          last_active: vendor.updated_at || vendor.created_at,
          plan: "WhaleTools", // SaaS product name
          status: displayStatus,
          revenue: 0, // TODO: Track actual subscription revenue
          productsCount: productCountMap[vendor.id] || 0,
        };
      }) || [];

    return NextResponse.json({ customers });
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Admin customers error:", err);
    }
    return NextResponse.json(
      { error: err.message || "Failed to load customers" },
      { status: 500 },
    );
  }
}
