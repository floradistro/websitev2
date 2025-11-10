/**
 * Payment Processor Type Definitions
 * Shared types across all payment processors
 */

// ============================================================
// DATABASE TYPES
// ============================================================

export type ProcessorType = "dejavoo" | "authorize_net" | "stripe" | "square" | "clover";
export type PaymentEnvironment = "production" | "sandbox";
export type PaymentMethodType =
  | "cash"
  | "credit"
  | "debit"
  | "ebt_food"
  | "ebt_cash"
  | "gift_card"
  | "check"
  | "ach"
  | "mobile_wallet";

export type TransactionStatus =
  | "pending"
  | "approved"
  | "declined"
  | "error"
  | "voided"
  | "refunded";

export interface PaymentProcessor {
  id: string;
  vendor_id: string;
  location_id: string | null;
  processor_type: ProcessorType;
  processor_name: string;
  is_active: boolean;
  is_default: boolean;
  environment: PaymentEnvironment;

  // Dejavoo fields
  dejavoo_authkey?: string;
  dejavoo_tpn?: string;
  dejavoo_merchant_id?: string;
  dejavoo_store_number?: string;
  dejavoo_v_number?: string;
  dejavoo_register_id?: string;

  // Authorize.Net fields
  authorizenet_api_login_id?: string;
  authorizenet_transaction_key?: string;
  authorizenet_public_client_key?: string;

  // Stripe fields
  stripe_publishable_key?: string;
  stripe_secret_key?: string;
  stripe_webhook_secret?: string;

  // Square fields
  square_application_id?: string;
  square_access_token?: string;
  square_location_id?: string;

  // Clover fields
  clover_merchant_id?: string;
  clover_api_token?: string;

  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
  last_tested_at?: string;
  last_test_status?: "success" | "failed";
  last_test_error?: string;
}

export interface DejavooTerminalConfig {
  id: string;
  location_id: string;
  payment_processor_id?: string;

  // VAR Sheet Identifiers
  v_number: string;
  merchant_id: string;
  store_number: string;
  hc_pos_id: string;

  // Terminal Identification
  terminal_number: string;
  location_number: string;
  tpn?: string;

  // Network Configuration
  mcc?: string;
  agent?: string;
  chain?: string;
  bin?: string;
  merchant_aba?: string;

  // Settlement Configuration
  settlement_agent?: string;
  reimbursement_attribute?: string;

  // Authentication & Security
  authentication_code: string;

  // Entitlements
  entitlements?: string[];

  // Terminal Hardware
  manufacturer?: string;
  model?: string;
  software_version?: string;

  // Time Zone
  time_zone?: string;

  // EBT Configuration
  ebt_fcs_id?: string;

  settings?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentTransaction {
  id: string;
  vendor_id: string;
  location_id?: string;
  payment_processor_id?: string;
  pos_register_id?: string;
  pos_transaction_id?: string;
  order_id?: string;
  user_id?: string;

  processor_type: ProcessorType;
  transaction_type: "sale" | "return" | "void" | "auth" | "capture" | "refund";
  payment_method: PaymentMethodType;

  amount: number;
  tip_amount?: number;
  total_amount: number;

  status: TransactionStatus;

  processor_transaction_id?: string;
  processor_reference_id?: string;
  authorization_code?: string;
  result_code?: string;
  status_code?: string;
  message?: string;
  detailed_message?: string;

  request_data?: Record<string, any>;
  response_data?: Record<string, any>;

  card_type?: string;
  card_last_four?: string;
  card_bin?: string;
  cardholder_name?: string;

  receipt_data?: Record<string, any>;
  receipt_number?: string;

  processed_at: string;
  error_message?: string;
  retry_count: number;

  created_at: string;
  updated_at: string;
}

export interface LocationPaymentMethod {
  id: string;
  location_id: string;
  method_type: PaymentMethodType;
  method_name: string;
  is_enabled: boolean;
  requires_processor: boolean;
  default_processor_id?: string;

  min_amount?: number;
  max_amount?: number;
  processing_fee_percent?: number;
  processing_fee_fixed?: number;

  allow_tips: boolean;
  allow_partial_payments: boolean;
  requires_signature: boolean;
  requires_manager_approval: boolean;

  settings?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================================
// TRANSACTION REQUEST/RESPONSE TYPES
// ============================================================

export interface ProcessPaymentRequest {
  amount: number;
  tipAmount?: number;
  paymentMethod: PaymentMethodType;
  locationId: string;
  registerId?: string;
  orderId?: string;
  userId?: string;
  referenceId?: string;
  invoiceNumber?: string;
  customerId?: string;
  metadata?: Record<string, any>;
}

export interface ProcessRefundRequest {
  originalTransactionId: string;
  amount?: number; // Partial refund if provided, full refund if omitted
  reason?: string;
  userId?: string;
}

export interface VoidTransactionRequest {
  transactionId: string;
  userId?: string;
  reason?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  authorizationCode?: string;
  message: string;
  cardType?: string;
  cardLast4?: string;
  amount: number;
  tipAmount?: number;
  totalAmount: number;
  receiptData?: string;
  metadata?: Record<string, any>;
}

export interface PaymentError {
  code: string;
  message: string;
  details?: string;
  isDeclined?: boolean;
  isTerminalError?: boolean;
  isTimeout?: boolean;
}

// ============================================================
// PROCESSOR INTERFACE
// ============================================================

export interface IPaymentProcessor {
  /**
   * Process a sale transaction
   */
  processSale(request: ProcessPaymentRequest): Promise<PaymentResult>;

  /**
   * Process a refund/return
   */
  processRefund(request: ProcessRefundRequest): Promise<PaymentResult>;

  /**
   * Void a transaction
   */
  voidTransaction(request: VoidTransactionRequest): Promise<PaymentResult>;

  /**
   * Test processor connection
   */
  testConnection(): Promise<boolean>;

  /**
   * Get processor configuration
   */
  getConfig(): PaymentProcessor;
}

// ============================================================
// UTILITY TYPES
// ============================================================

export interface TerminalOverview {
  register_id: string;
  register_number: string;
  register_name: string;
  device_name?: string;
  hardware_model?: string;
  register_status: string;
  location_id: string;
  location_name: string;
  vendor_id: string;
  vendor_name: string;
  processor_id?: string;
  processor_type?: ProcessorType;
  processor_name?: string;
  processor_active?: boolean;
  v_number?: string;
  merchant_id?: string;
  store_number?: string;
  hc_pos_id?: string;
  last_active_at?: string;
}

export interface PaymentTransactionDetail {
  id: string;
  processor_type: ProcessorType;
  transaction_type: string;
  payment_method: PaymentMethodType;
  amount: number;
  tip_amount?: number;
  total_amount: number;
  status: TransactionStatus;
  authorization_code?: string;
  card_type?: string;
  card_last_four?: string;
  processed_at: string;
  vendor_name: string;
  location_name?: string;
  register_name?: string;
  staff_name?: string;
  order_number?: string;
}
