import { NextRequest, NextResponse } from "next/server";

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Fetch customer from Supabase
    const response = await fetch(
      `${getBaseUrl()}/api/supabase/customers/${id}`,
    );
    const data = await response.json();

    if (!data.success || !data.customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(data.customer);
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Customer API error:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Update customer in Supabase
    const response = await fetch(
      `${getBaseUrl()}/api/supabase/customers/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();

    if (!data.success) {
      throw new Error("Failed to update customer");
    }

    return NextResponse.json(data.customer);
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Update customer error:", error);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
