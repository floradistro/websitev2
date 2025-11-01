/**
 * Dejavoo SPIN REST API Client
 * Documentation: https://app.theneo.io/dejavoo/spin/spin-rest-api-methods
 */

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type DejavooEnvironment = 'production' | 'sandbox';

export type DejavooPaymentType =
  | 'Credit'
  | 'Debit'
  | 'EBT_Food'
  | 'EBT_Cash'
  | 'Card'
  | 'Cash'
  | 'Check'
  | 'Gift';

export type DejavooTransactionType =
  | 'Sale'
  | 'Return'
  | 'Void'
  | 'Auth'
  | 'Capture';

export type DejavooResultCode = 'Ok' | 'TerminalError' | 'ApiError';

export interface DejavooConfig {
  authkey: string;
  tpn: string; // Terminal Profile Number
  environment: DejavooEnvironment;
  timeout?: number; // in minutes (1-720)
}

export interface DejavooSaleRequest {
  amount: number;
  tipAmount?: number;
  paymentType: DejavooPaymentType;
  referenceId: string; // Must be unique within one batch
  invoiceNumber?: string;
  printReceipt?: 'Yes' | 'No';
  getReceipt?: 'Yes' | 'No';
  getExtendedData?: boolean;
  timeout?: number; // SPInProxyTimeout in minutes
}

export interface DejavooReturnRequest {
  amount: number;
  paymentType: DejavooPaymentType;
  referenceId: string;
  invoiceNumber?: string;
  printReceipt?: 'Yes' | 'No';
  getReceipt?: 'Yes' | 'No';
  getExtendedData?: boolean;
}

export interface DejavooVoidRequest {
  referenceId: string; // Reference ID of transaction to void
  printReceipt?: 'Yes' | 'No';
  getReceipt?: 'Yes' | 'No';
}

export interface DejavooAuthRequest {
  amount: number;
  paymentType: DejavooPaymentType;
  referenceId: string;
  invoiceNumber?: string;
  printReceipt?: 'Yes' | 'No';
  getReceipt?: 'Yes' | 'No';
  getExtendedData?: boolean;
}

export interface DejavooGeneralResponse {
  ResultCode: string; // "0" for success
  StatusCode: string; // "0000" for approved
  Message: string;
  DetailedMessage?: string;
}

export interface DejavooTransactionResponse {
  GeneralResponse: DejavooGeneralResponse;
  AuthCode?: string;
  ReferenceId?: string;
  PaymentType?: string;
  TransactionType?: string;
  Amount?: number;
  TipAmount?: number;
  CardType?: string; // Visa, Mastercard, Amex, Discover
  CardLast4?: string;
  CardBin?: string; // First 6 digits
  CardholderName?: string;
  ReceiptData?: string; // Receipt text if getReceipt = 'Yes'
  ExtendedData?: any; // Extended transaction data if getExtendedData = true
}

export interface DejavooErrorResponse {
  GeneralResponse: DejavooGeneralResponse;
  error?: string;
}

// ============================================================
// DEJAVOO API CLIENT
// ============================================================

export class DejavooClient {
  private readonly baseUrl: string;
  private readonly authkey: string;
  private readonly tpn: string;
  private readonly defaultTimeout: number;

  constructor(config: DejavooConfig) {
    this.authkey = config.authkey;
    this.tpn = config.tpn;
    this.defaultTimeout = config.timeout || 120; // 2 minutes default

    // Set base URL based on environment
    this.baseUrl = config.environment === 'production'
      ? 'https://api.spinpos.net'
      : 'https://test.spinpos.net/spin';
  }

  /**
   * Process a sale transaction
   */
  async sale(request: DejavooSaleRequest): Promise<DejavooTransactionResponse> {
    const payload = {
      Amount: request.amount,
      TipAmount: request.tipAmount || 0,
      PaymentType: request.paymentType,
      ReferenceId: request.referenceId,
      InvoiceNumber: request.invoiceNumber,
      PrintReceipt: request.printReceipt || 'No',
      GetReceipt: request.getReceipt || 'Yes',
      GetExtendedData: request.getExtendedData !== false,
      Tpn: this.tpn,
      Authkey: this.authkey,
      SPInProxyTimeout: request.timeout || this.defaultTimeout,
    };

    return this.makeRequest<DejavooTransactionResponse>('v2/Payment/Sale', payload);
  }

  /**
   * Process a return/refund transaction
   */
  async return(request: DejavooReturnRequest): Promise<DejavooTransactionResponse> {
    const payload = {
      Amount: request.amount,
      PaymentType: request.paymentType,
      ReferenceId: request.referenceId,
      InvoiceNumber: request.invoiceNumber,
      PrintReceipt: request.printReceipt || 'No',
      GetReceipt: request.getReceipt || 'Yes',
      GetExtendedData: request.getExtendedData !== false,
      Tpn: this.tpn,
      Authkey: this.authkey,
    };

    return this.makeRequest<DejavooTransactionResponse>('v2/Payment/Return', payload);
  }

  /**
   * Void a transaction
   */
  async void(request: DejavooVoidRequest): Promise<DejavooTransactionResponse> {
    const payload = {
      ReferenceId: request.referenceId,
      PrintReceipt: request.printReceipt || 'No',
      GetReceipt: request.getReceipt || 'Yes',
      Tpn: this.tpn,
      Authkey: this.authkey,
    };

    return this.makeRequest<DejavooTransactionResponse>('v2/Payment/Void', payload);
  }

  /**
   * Authorize a transaction (without capture)
   */
  async auth(request: DejavooAuthRequest): Promise<DejavooTransactionResponse> {
    const payload = {
      Amount: request.amount,
      PaymentType: request.paymentType,
      ReferenceId: request.referenceId,
      InvoiceNumber: request.invoiceNumber,
      PrintReceipt: request.printReceipt || 'No',
      GetReceipt: request.getReceipt || 'Yes',
      GetExtendedData: request.getExtendedData !== false,
      Tpn: this.tpn,
      Authkey: this.authkey,
    };

    return this.makeRequest<DejavooTransactionResponse>('v2/Payment/Auth', payload);
  }

  /**
   * Make HTTP request to Dejavoo API
   */
  private async makeRequest<T>(
    endpoint: string,
    payload: any
  ): Promise<T> {
    const url = `${this.baseUrl}/${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Check for HTTP errors
      if (!response.ok) {
        throw new DejavooApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status.toString(),
          response.statusText
        );
      }

      const data = await response.json();

      // Check for Dejavoo API errors
      if (data.GeneralResponse) {
        const { ResultCode, StatusCode, Message, DetailedMessage } = data.GeneralResponse;

        // ResultCode "0" or StatusCode "0000" indicates success
        if (ResultCode !== '0' && StatusCode !== '0000') {
          throw new DejavooApiError(
            DetailedMessage || Message || 'Transaction failed',
            StatusCode,
            ResultCode
          );
        }
      }

      return data as T;
    } catch (error) {
      if (error instanceof DejavooApiError) {
        throw error;
      }

      // Network or parsing errors
      throw new DejavooApiError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        'NETWORK_ERROR',
        'ApiError'
      );
    }
  }

  /**
   * Test connection to Dejavoo API
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try a small auth transaction to test connectivity
      // Note: This won't actually charge anything
      const testRef = `TEST-${Date.now()}`;

      await this.auth({
        amount: 1.00,
        paymentType: 'Credit',
        referenceId: testRef,
        getExtendedData: false,
      });

      return true;
    } catch (error) {
      console.error('Dejavoo connection test failed:', error);
      return false;
    }
  }
}

// ============================================================
// ERROR HANDLING
// ============================================================

export class DejavooApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: string,
    public readonly resultCode: string
  ) {
    super(message);
    this.name = 'DejavooApiError';
  }

  /**
   * Check if error is due to declined transaction
   */
  isDeclined(): boolean {
    return this.statusCode !== '0000' && this.resultCode === '0';
  }

  /**
   * Check if error is due to terminal error
   */
  isTerminalError(): boolean {
    return this.resultCode === 'TerminalError';
  }

  /**
   * Check if error is due to API error
   */
  isApiError(): boolean {
    return this.resultCode === 'ApiError';
  }

  /**
   * Check if error is due to timeout
   */
  isTimeout(): boolean {
    return this.statusCode === '2007' || this.message.includes('timeout');
  }

  /**
   * Check if terminal is unavailable
   */
  isTerminalUnavailable(): boolean {
    return this.statusCode === '2011';
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Generate a unique reference ID for Dejavoo transactions
 */
export function generateReferenceId(prefix = 'TXN'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${timestamp}-${random}`.substring(0, 50); // Max 50 chars
}

/**
 * Format amount for Dejavoo (must be positive number with max 2 decimals)
 */
export function formatAmount(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Parse Dejavoo card type to standard format
 */
export function parseCardType(cardType?: string): string | null {
  if (!cardType) return null;

  const normalized = cardType.toLowerCase();

  if (normalized.includes('visa')) return 'Visa';
  if (normalized.includes('mastercard') || normalized.includes('master')) return 'Mastercard';
  if (normalized.includes('amex') || normalized.includes('american')) return 'American Express';
  if (normalized.includes('discover')) return 'Discover';
  if (normalized.includes('jcb')) return 'JCB';

  return cardType;
}

/**
 * Convert status code to human-readable message
 */
export function getStatusMessage(statusCode: string): string {
  const statusMessages: Record<string, string> = {
    '0000': 'Approved',
    '2007': 'Transaction timeout',
    '2011': 'Terminal not available',
    '2301': 'Invalid request',
  };

  return statusMessages[statusCode] || `Unknown status: ${statusCode}`;
}

export default DejavooClient;
