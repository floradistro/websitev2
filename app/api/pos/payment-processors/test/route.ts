import { NextRequest, NextResponse } from "next/server";
import { requireVendor } from "@/lib/auth/middleware";
import { getPaymentProcessorById } from "@/lib/payment-processors";
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

    try {
      // Use the SAME payment processor abstraction as working POS payments
      const processor = await getPaymentProcessorById(processorId);
      const config = processor.getConfig();

      if (!config.is_active) {
        return NextResponse.json(
          { success: false, error: "Payment processor is not active" },
          { status: 400 }
        );
      }

      logger.info(`🧪 Sending $${amount} test transaction to ${config.processor_name}`);

      // Send test transaction using the payment processor
      const testRef = `TEST-${Date.now()}`;
      const result = await processor.processSale({
        amount,
        paymentMethod: "card",
        referenceId: testRef,
        metadata: { isTest: true },
      });

      if (result.success) {
        logger.info(`✅ Test transaction approved for ${config.processor_name}`, {
          referenceId: testRef,
          authCode: result.authorizationCode,
        });

        return NextResponse.json({
          success: true,
          message: result.message || "Test transaction approved",
          data: {
            processorName: config.processor_name,
            referenceId: testRef,
            authCode: result.authorizationCode,
            cardLast4: result.cardLast4,
            cardType: result.cardType,
            amount: result.amount,
          },
        });
      } else {
        logger.warn(`⚠️ Test transaction failed for ${config.processor_name}`, {
          referenceId: testRef,
          message: result.message,
        });

        return NextResponse.json({
          success: false,
          message: result.message || "Transaction failed",
          data: {
            processorName: config.processor_name,
            referenceId: testRef,
          },
        });
      }
    } catch (error: any) {
      logger.error(`❌ Test transaction error:`, error);

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
