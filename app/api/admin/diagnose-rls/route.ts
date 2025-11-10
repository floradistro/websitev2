import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/admin/diagnose-rls
 * Diagnose the intermittent RLS error on cash sales
 *
 * This endpoint will:
 * 1. Check environment variables
 * 2. Verify service role client configuration
 * 3. Attempt to create a test order
 * 4. Return detailed diagnostic info
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // STEP 1: Check environment variables
    const envCheck = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKeyPrefix:
        process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + "...",
    };

    if (!envCheck.hasServiceKey) {
      return NextResponse.json(
        {
          success: false,
          error: "CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set!",
          envCheck,
        },
        { status: 500 },
      );
    }

    // STEP 2: Get service client and check its configuration
    const supabase = getServiceSupabase();

    // Try to read the current auth headers being used
    // @ts-ignore - accessing internal state for debugging
    const clientUrl = supabase.supabaseUrl;
    // @ts-ignore - accessing internal state for debugging
    const clientHeaders = supabase.rest?.headers || {};
    // @ts-ignore - accessing header properties
    const authHeader = clientHeaders.Authorization || "";

    // STEP 3: Check current user/session (service role should have none)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      return NextResponse.json(
        {
          success: false,
          error:
            "CRITICAL: Service role client has an auth session! This should NEVER happen.",
          session: {
            user: session.user?.email,
            role: session.user?.role,
          },
          envCheck,
        },
        { status: 500 },
      );
    }

    // STEP 4: Test RLS policies on orders table

    const testOrderData = {
      order_number: `RLS-TEST-${Date.now()}`,
      vendor_id: "cd2e1122-d511-4edb-be5d-98ef274b4baf",
      status: "completed",
      payment_status: "paid",
      fulfillment_status: "fulfilled",
      delivery_type: "pickup",
      pickup_location_id: "9090e35e-1a6d-4d08-8cc2-8f3021e6f5a6",
      subtotal: 10.0,
      tax_amount: 0.8,
      total_amount: 10.8,
      payment_method: "cash", // Testing with CASH specifically
      billing_address: { name: "RLS Test" },
      completed_date: new Date().toISOString(),
      metadata: {
        rls_diagnostic_test: true,
        test_timestamp: Date.now(),
      },
    };

    const { data: testOrder, error: insertError } = await supabase
      .from("orders")
      .insert(testOrderData)
      .select()
      .single();

    if (insertError) {
      if (process.env.NODE_ENV === "development") {
        console.error("❌ INSERT failed:", insertError);
      }
      // Get the RLS policies for orders table
      const { data: policies } = await supabase
        .rpc("pg_policies")
        .or("tablename.eq.orders");

      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to insert test order - RLS policy is blocking service role!",
          insertError: {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint,
          },
          testOrderData,
          envCheck,
          clientConfig: {
            url: clientUrl,
            hasAuthHeader: !!authHeader,
          },
          rlsPolicies: policies,
          duration_ms: Date.now() - startTime,
        },
        { status: 500 },
      );
    }

    // Clean up test order
    await supabase.from("orders").delete().eq("id", testOrder.id);

    // STEP 5: Try multiple rapid inserts to see if it's a race condition

    const rapidTests = await Promise.all([
      createTestOrder(supabase, "cash", 1),
      createTestOrder(supabase, "card", 2),
      createTestOrder(supabase, "cash", 3),
      createTestOrder(supabase, "card", 4),
      createTestOrder(supabase, "cash", 5),
    ]);

    const failedTests = rapidTests.filter((t) => !t.success);

    // Clean up all test orders
    const testIds = rapidTests
      .filter((t) => t.success && t.orderId)
      .map((t) => t.orderId);
    if (testIds.length > 0) {
      await supabase.from("orders").delete().in("id", testIds);
    }

    return NextResponse.json({
      success: true,
      message:
        failedTests.length === 0
          ? "✅ All diagnostics passed - RLS is working correctly"
          : `⚠️ ${failedTests.length}/5 rapid tests failed`,
      envCheck,
      clientConfig: {
        url: clientUrl,
        hasAuthHeader: !!authHeader,
        authHeaderPrefix: authHeader ? authHeader.substring(0, 30) : "none",
      },
      singleTest: {
        success: true,
        orderId: testOrder.id,
      },
      rapidTests: {
        total: 5,
        succeeded: rapidTests.filter((t) => t.success).length,
        failed: failedTests.length,
        results: rapidTests,
      },
      duration_ms: Date.now() - startTime,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("💥 Diagnostic failed:", error);
    }
    return NextResponse.json(
      {
        success: false,
        error: "Diagnostic threw an exception",
        message: error.message,
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}

async function createTestOrder(
  supabase: any,
  paymentMethod: string,
  sequence: number,
) {
  const orderData = {
    order_number: `RLS-RAPID-${Date.now()}-${sequence}`,
    vendor_id: "cd2e1122-d511-4edb-be5d-98ef274b4baf",
    status: "completed",
    payment_status: "paid",
    fulfillment_status: "fulfilled",
    delivery_type: "pickup",
    pickup_location_id: "9090e35e-1a6d-4d08-8cc2-8f3021e6f5a6",
    subtotal: 10.0,
    tax_amount: 0.8,
    total_amount: 10.8,
    payment_method: paymentMethod,
    billing_address: { name: `RLS Rapid Test ${sequence}` },
    completed_date: new Date().toISOString(),
    metadata: {
      rls_rapid_test: true,
      sequence,
      payment_method: paymentMethod,
    },
  };

  const { data, error } = await supabase
    .from("orders")
    .insert(orderData)
    .select("id")
    .single();

  return {
    success: !error,
    paymentMethod,
    sequence,
    orderId: data?.id,
    error: error
      ? {
          code: error.code,
          message: error.message,
        }
      : null,
  };
}
