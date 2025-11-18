/**
 * Payment Processor Abstraction Layer
 * Routes payments to the appropriate processor based on configuration
 */

import { getServiceSupabase } from "@/lib/supabase/client";
import DejavooClient from "./dejavoo";
import {
  type PaymentProcessor,
  type ProcessPaymentRequest,
  type ProcessRefundRequest,
  type VoidTransactionRequest,
  type PaymentResult,
  type PaymentTransaction,
  type IPaymentProcessor,
  PaymentError,
} from "./types";

// ============================================================
// PAYMENT PROCESSOR FACTORY
// ============================================================

/**
 * Get payment processor for a location
 */
async function getPaymentProcessor(locationId: string): Promise<IPaymentProcessor> {
  const supabase = getServiceSupabase();

  // Get default active processor for location
  const { data: processor, error } = await supabase
    .from("payment_processors")
    .select("*")
    .eq("location_id", locationId)
    .eq("is_active", true)
    .eq("is_default", true)
    .single();

  if (error || !processor) {
    throw new Error(`No active payment processor found for location ${locationId}`);
  }

  return createProcessorInstance(processor);
}

/**
 * Get payment processor by ID
 */
async function getPaymentProcessorById(processorId: string): Promise<IPaymentProcessor> {
  const supabase = getServiceSupabase();

  const { data: processor, error } = await supabase
    .from("payment_processors")
    .select("*")
    .eq("id", processorId)
    .single();

  if (error || !processor) {
    throw new Error(`Payment processor ${processorId} not found`);
  }

  return createProcessorInstance(processor);
}

/**
 * Get payment processor for a register
 */
async function getPaymentProcessorForRegister(registerId: string): Promise<IPaymentProcessor> {
  const supabase = getServiceSupabase();

  // Get register with processor info
  const { data: register, error } = await supabase
    .from("pos_registers")
    .select("payment_processor_id, location_id")
    .eq("id", registerId)
    .single();

  if (error || !register) {
    throw new Error(`Register ${registerId} not found`);
  }

  // If register has specific processor, use that
  if (register.payment_processor_id) {
    return getPaymentProcessorById(register.payment_processor_id);
  }

  // Otherwise use location's default processor
  return getPaymentProcessor(register.location_id);
}

/**
 * Create processor instance based on type
 */
function createProcessorInstance(config: PaymentProcessor): IPaymentProcessor {
  // CRITICAL: Validate processor_type exists before switch
  if (!config.processor_type) {
    throw new Error(
      `Payment processor configuration is incomplete. Missing processor_type. ` +
        `Processor ID: ${config.id}, Name: ${config.processor_name || "Unknown"}`,
    );
  }

  switch (config.processor_type) {
    case "dejavoo":
      return new DejavooPaymentProcessor(config);

    case "authorize_net":
      throw new Error("Authorize.Net integration not yet implemented");

    case "stripe":
      throw new Error("Stripe integration not yet implemented");

    case "square":
      throw new Error("Square integration not yet implemented");

    case "clover":
      throw new Error("Clover integration not yet implemented");

    default:
      throw new Error(
        `Unsupported processor type: "${config.processor_type}". ` +
          `Supported types: dejavoo, authorize_net, stripe, square, clover`,
      );
  }
}

// ============================================================
// DEJAVOO PAYMENT PROCESSOR IMPLEMENTATION
// ============================================================

class DejavooPaymentProcessor implements IPaymentProcessor {
  private client: DejavooClient;
  private config: PaymentProcessor;

  constructor(config: PaymentProcessor) {
    this.config = config;

    if (!config.dejavoo_authkey || !config.dejavoo_tpn) {
      throw new Error("Dejavoo configuration missing authkey or TPN");
    }

    this.client = new DejavooClient({
      authKey: config.dejavoo_authkey,
      tpn: config.dejavoo_tpn,
      environment: config.environment,
    });
  }

  async processSale(request: ProcessPaymentRequest): Promise<PaymentResult> {
    const supabase = getServiceSupabase();

    // Generate reference ID
    const referenceId = request.referenceId || `TXN-${Date.now()}`;

    try {
      // Process sale with Dejavoo
      const response = await this.client.sale({
        amount: request.amount,
        tipAmount: request.tipAmount,
        paymentType: this.mapPaymentMethodToDejavoo(request.paymentMethod),
        referenceId,
        invoiceNumber: request.invoiceNumber,
        printReceipt: "No",
        getReceipt: "Both",
        getExtendedData: true,
      });

      // Log transaction
      const transaction: Partial<PaymentTransaction> = {
        vendor_id: this.config.vendor_id,
        location_id: request.locationId,
        payment_processor_id: this.config.id,
        pos_register_id: request.registerId,
        order_id: request.orderId,
        user_id: request.userId,
        processor_type: "dejavoo",
        transaction_type: "sale",
        payment_method: request.paymentMethod,
        amount: request.amount,
        tip_amount: request.tipAmount || 0,
        status: "approved",
        processor_transaction_id: response.ReferenceId,
        processor_reference_id: referenceId,
        authorization_code: response.AuthCode,
        result_code: response.GeneralResponse.ResultCode,
        status_code: response.GeneralResponse.StatusCode,
        message: response.GeneralResponse.Message,
        request_data: { amount: request.amount, tipAmount: request.tipAmount },
        response_data: response as any,
        card_type: response.CardType,
        card_last_four: response.CardLast4,
        card_bin: response.CardBin,
        cardholder_name: response.CardholderName,
        receipt_data: response.ReceiptData ? { text: response.ReceiptData } : undefined,
        processed_at: new Date().toISOString(),
        retry_count: 0,
      };

      const { data: savedTransaction } = await supabase
        .from("payment_transactions")
        .insert(transaction)
        .select()
        .single();

      return {
        success: true,
        transactionId: savedTransaction?.id || "",
        authorizationCode: response.AuthCode,
        message: response.GeneralResponse.Message,
        cardType: response.CardType,
        cardLast4: response.CardLast4,
        amount: request.amount,
        tipAmount: request.tipAmount || 0,
        totalAmount: request.amount + (request.tipAmount || 0),
        receiptData: response.ReceiptData,
      };
    } catch (error: any) {
      // Log failed transaction
      const transaction: Partial<PaymentTransaction> = {
        vendor_id: this.config.vendor_id,
        location_id: request.locationId,
        payment_processor_id: this.config.id,
        pos_register_id: request.registerId,
        order_id: request.orderId,
        user_id: request.userId,
        processor_type: "dejavoo",
        transaction_type: "sale",
        payment_method: request.paymentMethod,
        amount: request.amount,
        tip_amount: request.tipAmount || 0,
        status: "error",
        processor_reference_id: referenceId,
        error_message: error.message,
        request_data: { amount: request.amount, tipAmount: request.tipAmount },
        response_data: error.response || {},
        processed_at: new Date().toISOString(),
        retry_count: 0,
      };

      await supabase.from("payment_transactions").insert(transaction);

      throw error;
    }
  }

  async processRefund(request: ProcessRefundRequest): Promise<PaymentResult> {
    const supabase = getServiceSupabase();

    // Get original transaction
    const { data: originalTxn, error: txnError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("id", request.originalTransactionId)
      .single();

    if (txnError || !originalTxn) {
      throw new Error("Original transaction not found");
    }

    const refundAmount = request.amount || originalTxn.total_amount;
    const referenceId = `REFUND-${Date.now()}`;

    try {
      const response = await this.client.return({
        amount: refundAmount,
        paymentType: this.mapPaymentMethodToDejavoo(originalTxn.payment_method),
        referenceId,
        printReceipt: "No",
        getReceipt: "Both",
        getExtendedData: true,
      });

      // Log refund transaction
      const transaction: Partial<PaymentTransaction> = {
        vendor_id: this.config.vendor_id,
        location_id: originalTxn.location_id,
        payment_processor_id: this.config.id,
        pos_register_id: originalTxn.pos_register_id,
        order_id: originalTxn.order_id,
        user_id: request.userId,
        processor_type: "dejavoo",
        transaction_type: "refund",
        payment_method: originalTxn.payment_method,
        amount: refundAmount,
        tip_amount: 0,
        status: "approved",
        processor_transaction_id: response.ReferenceId,
        processor_reference_id: referenceId,
        authorization_code: response.AuthCode,
        result_code: response.GeneralResponse.ResultCode,
        status_code: response.GeneralResponse.StatusCode,
        message: response.GeneralResponse.Message,
        request_data: {
          originalTransactionId: request.originalTransactionId,
          amount: refundAmount,
        },
        response_data: response as any,
        receipt_data: response.ReceiptData ? { text: response.ReceiptData } : undefined,
        processed_at: new Date().toISOString(),
        retry_count: 0,
      };

      const { data: savedTransaction } = await supabase
        .from("payment_transactions")
        .insert(transaction)
        .select()
        .single();

      // Update original transaction status
      await supabase
        .from("payment_transactions")
        .update({ status: "refunded" })
        .eq("id", request.originalTransactionId);

      return {
        success: true,
        transactionId: savedTransaction?.id || "",
        authorizationCode: response.AuthCode,
        message: response.GeneralResponse.Message,
        amount: refundAmount,
        tipAmount: 0,
        totalAmount: refundAmount,
        receiptData: response.ReceiptData,
      };
    } catch (error: any) {
      throw error;
    }
  }

  async voidTransaction(request: VoidTransactionRequest): Promise<PaymentResult> {
    const supabase = getServiceSupabase();

    // Get original transaction
    const { data: originalTxn, error: txnError } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("id", request.transactionId)
      .single();

    if (txnError || !originalTxn) {
      throw new Error("Transaction not found");
    }

    if (!originalTxn.processor_reference_id) {
      throw new Error("Cannot void transaction without processor reference ID");
    }

    try {
      const response = await this.client.void({
        referenceId: originalTxn.processor_reference_id,
        printReceipt: "No",
        getReceipt: "Both",
      });

      // Update original transaction
      await supabase
        .from("payment_transactions")
        .update({ status: "voided" })
        .eq("id", request.transactionId);

      return {
        success: true,
        transactionId: request.transactionId,
        message: response.GeneralResponse.Message,
        amount: originalTxn.amount,
        tipAmount: originalTxn.tip_amount || 0,
        totalAmount: originalTxn.total_amount,
      };
    } catch (error: any) {
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    return this.client.testConnection();
  }

  getConfig(): PaymentProcessor {
    return this.config;
  }

  /**
   * Map payment method to Dejavoo payment type
   */
  private mapPaymentMethodToDejavoo(method: string): any {
    const mapping: Record<string, string> = {
      credit: "Credit",
      debit: "Debit",
      ebt_food: "EBT_Food",
      ebt_cash: "EBT_Cash",
      gift_card: "Gift",
      cash: "Cash",
      check: "Check",
    };

    return mapping[method] || "Card";
  }
}

// ============================================================
// EXPORTS
// ============================================================

export {
  DejavooClient,
  getPaymentProcessor,
  getPaymentProcessorById,
  getPaymentProcessorForRegister,
};

export type {
  PaymentProcessor,
  ProcessPaymentRequest,
  ProcessRefundRequest,
  VoidTransactionRequest,
  PaymentResult,
  PaymentTransaction,
  IPaymentProcessor,
};
