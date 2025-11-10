import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/client";
import { getPaymentProcessorForRegister, getPaymentProcessor } from "@/lib/payment-processors";
import type { ProcessPaymentRequest } from "@/lib/payment-processors/types";
import { requireVendor } from "@/lib/auth/middleware";

import { logger } from "@/lib/logger";
import { toError } from "@/lib/errors";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/pos/payment/process
 * Process a payment through the configured payment processor
 */
export async function POST(request: NextRequest) {
  // SECURITY: Require vendor authentication (Phase 4)
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendorId } = authResult;

  try {
    const supabase = getServiceSupabase();

    const {
      registerId,
      locationId,
      amount,
      tipAmount,
      paymentMethod,
      orderId,
      referenceId,
      invoiceNumber,
      customerId,
      metadata,
    }: {
      registerId?: string;
      locationId: string;
      amount: number;
      tipAmount?: number;
      paymentMethod: string;
      orderId?: string;
      referenceId?: string;
      invoiceNumber?: string;
      customerId?: string;
      metadata?: Record<string, any>;
    } = await request.json();

    // Validate required fields
    if (!locationId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields: locationId, amount, paymentMethod" },
        { status: 400 },
      );
    }

    // Cash payments don't need processor
    if (paymentMethod === "cash") {
      return NextResponse.json({
        success: true,
        message: "Cash payment - no processor required",
        paymentMethod: "cash",
        amount,
      });
    }

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id;

    try {
      // Get payment processor
      let processor;
      if (registerId) {
        processor = await getPaymentProcessorForRegister(registerId);
      } else {
        processor = await getPaymentProcessor(locationId);
      }

      // Build payment request
      const paymentRequest: ProcessPaymentRequest = {
        amount,
        tipAmount,
        paymentMethod: paymentMethod as any,
        locationId,
        registerId,
        orderId,
        userId,
        referenceId,
        invoiceNumber,
        customerId,
        metadata,
      };

      // Process payment
      const result = await processor.processSale(paymentRequest);

      return NextResponse.json({
        success: result.success,
        transactionId: result.transactionId,
        authorizationCode: result.authorizationCode,
        message: result.message,
        cardType: result.cardType,
        cardLast4: result.cardLast4,
        amount: result.amount,
        tipAmount: result.tipAmount,
        totalAmount: result.totalAmount,
        receiptData: result.receiptData,
        metadata: result.metadata,
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Payment processing error:", err);
      }
      // Check if it's a Dejavoo-specific error
      const isDeclined = error.isDeclined?.() || error.statusCode !== "0000";
      const isTerminalError = error.isTerminalError?.();
      const isTimeout = error.isTimeout?.();

      return NextResponse.json(
        {
          success: false,
          error: err.message || "Payment processing failed",
          isDeclined,
          isTerminalError,
          isTimeout,
          details: error.statusCode ? `Status: ${error.statusCode}` : undefined,
        },
        { status: isTerminalError ? 503 : 400 },
      );
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Payment API error:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: err.message,
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/pos/payment/refund
 * Process a refund through the payment processor
 */
export async function PUT(request: NextRequest) {
  // SECURITY: Require vendor authentication - Critical fix from Apple Assessment
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendorId } = authResult;

  try {
    const supabase = getServiceSupabase();

    const {
      transactionId,
      amount,
      reason,
    }: {
      transactionId: string;
      amount?: number;
      reason?: string;
    } = await request.json();

    if (!transactionId) {
      return NextResponse.json({ error: "Missing required field: transactionId" }, { status: 400 });
    }

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get original transaction
    const { data: paymentTxn, error: txnError } = await supabase
      .from("payment_transactions")
      .select("*, payment_processor:payment_processors(*)")
      .eq("id", transactionId)
      .single();

    if (txnError || !paymentTxn) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    try {
      // Get payment processor
      const { getPaymentProcessorById } = await import("@/lib/payment-processors");
      const processor = await getPaymentProcessorById(paymentTxn.payment_processor_id);

      // Process refund
      const result = await processor.processRefund({
        originalTransactionId: transactionId,
        amount,
        reason,
        userId: user?.id,
      });

      return NextResponse.json({
        success: result.success,
        transactionId: result.transactionId,
        message: result.message,
        amount: result.amount,
        receiptData: result.receiptData,
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Refund processing error:", err);
      }
      return NextResponse.json(
        {
          success: false,
          error: err.message || "Refund processing failed",
        },
        { status: 400 },
      );
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Refund API error:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: err.message,
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/pos/payment/void
 * Void a transaction through the payment processor
 */
export async function DELETE(request: NextRequest) {
  // SECURITY: Require vendor authentication - Critical fix from Apple Assessment
  const authResult = await requireVendor(request);
  if (authResult instanceof NextResponse) return authResult;
  const { vendorId } = authResult;

  try {
    const supabase = getServiceSupabase();

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");
    const reason = searchParams.get("reason");

    if (!transactionId) {
      return NextResponse.json(
        { error: "Missing required parameter: transactionId" },
        { status: 400 },
      );
    }

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get original transaction
    const { data: paymentTxn, error: txnError } = await supabase
      .from("payment_transactions")
      .select("*, payment_processor:payment_processors(*)")
      .eq("id", transactionId)
      .single();

    if (txnError || !paymentTxn) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    try {
      // Get payment processor
      const { getPaymentProcessorById } = await import("@/lib/payment-processors");
      const processor = await getPaymentProcessorById(paymentTxn.payment_processor_id);

      // Void transaction
      const result = await processor.voidTransaction({
        transactionId,
        userId: user?.id,
        reason: reason || undefined,
      });

      return NextResponse.json({
        success: result.success,
        transactionId: result.transactionId,
        message: result.message,
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        logger.error("Void processing error:", err);
      }
      return NextResponse.json(
        {
          success: false,
          error: err.message || "Void processing failed",
        },
        { status: 400 },
      );
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      logger.error("Void API error:", err);
    }
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: err.message,
      },
      { status: 500 },
    );
  }
}
