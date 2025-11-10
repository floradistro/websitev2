import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

import { logger } from "@/lib/logger";
/**
 * Get customer by ID
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getServiceSupabase();
    const { id: customerId } = await params;

    const { data: customer, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Customer not found", details: error.message },
        { status: 404 },
      );
    }

    return NextResponse.json({ customer });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Get customer error:", error);
    }
    return NextResponse.json(
      { error: "Failed to get customer", details: error.message },
      { status: 500 },
    );
  }
}
