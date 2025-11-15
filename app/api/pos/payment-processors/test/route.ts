import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { requireVendor } from "@/lib/auth/middleware";
import { DejavooClient } from "@/lib/payment-processors/dejavoo";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface TestTransactionRequest {
  processorId: string;
  amount?: number; // Default $1.00
}

/**
 * POST /api/pos/payment-processors/test
 *
 * Send a test transaction to verify the payment processor and terminal are working.
 * This sends a small charge ($0.01 or $1.00) to the physical terminal to verify:
 * - API connectivity
 * - Valid credentials
 * - Terminal is powered on and connected
 * - Terminal can process transactions
 *
 * IMPORTANT: This WILL display on the physical terminal and may require staff to cancel.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireVendor(request);
    if (authResult instanceof NextResponse) return authResult;
    const { vendorId } = authResult;

    const body: TestTransactionRequest = await request.json();
    const { processorId, amount = 1.00 } = body;

    if (!processorId) {
      return NextResponse.json(
        { success: false, error: "processorId is required" },
        { status: 400 }
      );
    }

    // Validate amount
    if (amount < 0.01 || amount > 100) {
      return NextResponse.json(
        { success: false, error: "Test amount must be between $0.01 and $100.00" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Get processor configuration
    const { data: processor, error } = await supabase
      .from("payment_processors")
      .select("id, processor_type, processor_name, dejavoo_authkey, dejavoo_tpn, environment, is_active, vendor_id")
      .eq("id", processorId)
      .eq("vendor_id", vendorId)
      .single();

    if (error || !processor) {
      logger.error("Processor not found:", error);
      return NextResponse.json(
        { success: false, error: "Payment processor not found" },
        { status: 404 }
      );
    }

    if (!processor.is_active) {
      return NextResponse.json(
        { success: false, error: "Payment processor is not active" },
        { status: 400 }
      );
    }

    // Only Dejavoo is supported for now
    if (processor.processor_type !== "dejavoo") {
      return NextResponse.json(
        { success: false, error: "Test transactions only supported for Dejavoo processors" },
        { status: 400 }
      );
    }

    // Verify credentials are configured
    if (!processor.dejavoo_authkey || !processor.dejavoo_tpn) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment processor credentials not configured",
          message: "Missing Dejavoo auth key or TPN"
        },
        { status: 400 }
      );
    }

    try {
      // Initialize Dejavoo client
      const client = new DejavooClient({
        authKey: processor.dejavoo_authkey,
        tpn: processor.dejavoo_tpn,
        environment: processor.environment || "production",
      });

      logger.info(`🧪 Sending $${amount} test transaction to ${processor.processor_name}`);

      // Send test transaction (this will display on terminal)
      const testRef = `TEST-${Date.now()}`;
      const result = await client.sale({
        amount,
        paymentType: "Credit",
        referenceId: testRef,
        printReceipt: "No",
        getReceipt: "No",
        getExtendedData: false,
        timeout: 2, // 2 minute timeout for test
      });

      // Check if approved
      const isApproved = result.GeneralResponse?.StatusCode === "0000" ||
                        result.GeneralResponse?.ResultCode === "0";

      if (isApproved) {
        logger.info(`✅ Test transaction approved for ${processor.processor_name}`, {
          referenceId: testRef,
          authCode: result.AuthCode,
        });

        return NextResponse.json({
          success: true,
          message: "Test transaction approved",
          data: {
            processorName: processor.processor_name,
            referenceId: testRef,
            authCode: result.AuthCode,
            cardLast4: result.CardLast4,
            cardType: result.CardType,
            amount: result.Amount,
          },
        });
      } else {
        // Transaction was declined or failed
        logger.warn(`⚠️ Test transaction declined for ${processor.processor_name}`, {
          referenceId: testRef,
          statusCode: result.GeneralResponse?.StatusCode,
          message: result.GeneralResponse?.Message,
        });

        return NextResponse.json({
          success: false,
          message: result.GeneralResponse?.Message || "Transaction declined",
          data: {
            processorName: processor.processor_name,
            referenceId: testRef,
            statusCode: result.GeneralResponse?.StatusCode,
          },
        });
      }
    } catch (error: any) {
      logger.error(`❌ Test transaction failed for ${processor.processor_name}:`, error);

      // Extract meaningful error message
      let errorMessage = "Test transaction failed";
      let errorDetails = error.message || "Unknown error";

      if (error.message?.includes("timeout")) {
        errorMessage = "Terminal timeout";
        errorDetails = "Terminal did not respond in time. Check that it is powered on and connected.";
      } else if (error.message?.includes("unavailable") || error.message?.includes("not available")) {
        errorMessage = "Terminal unavailable";
        errorDetails = "Terminal is not available. Check that it is powered on and registered.";
      } else if (error.message?.includes("network") || error.message?.includes("reach")) {
        errorMessage = "Network error";
        errorDetails = "Unable to reach payment processor API. Check internet connection.";
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          message: errorDetails,
          processorName: processor.processor_name,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    logger.error("Error in test transaction endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
