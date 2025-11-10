import { NextRequest, NextResponse } from "next/server";
import { requireCustomer } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
// Get base URL for internal API calls
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // SECURITY: Require customer authentication
  const authResult = await requireCustomer(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;

    // Fetch customer from Supabase
    const response = await fetch(`${getBaseUrl()}/api/supabase/customers/${id}`);
    const data = await response.json();

    if (!data.success || !data.customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json(data.customer);
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Customer API error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // SECURITY: Require customer authentication
  const authResult = await requireCustomer(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Update customer in Supabase
    const response = await fetch(`${getBaseUrl()}/api/supabase/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error("Failed to update customer");
    }

    return NextResponse.json(data.customer);
  } catch (error) {
    const err = toError(error);
    if (process.env.NODE_ENV === "development") {
      logger.error("Update customer error:", err);
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
