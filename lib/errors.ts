/**
 * Type-safe error handling utilities
 * Replaces 'catch (error: any)' with proper typing
 */

/**
 * Type guard to check if value is an Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Convert unknown error to Error instance
 */
export function toError(error: unknown): Error {
  if (isError(error)) {
    return error;
  }

  if (typeof error === "string") {
    return new Error(error);
  }

  if (error && typeof error === "object" && "message" in error) {
    return new Error(String(error.message));
  }

  return new Error("Unknown error occurred");
}

/**
 * Get error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  return toError(error).message;
}

/**
 * Safe error handler for API routes
 * Usage: catch (error) { return handleAPIError(error); }
 */
export function handleAPIError(error: unknown, context?: string): Response {
  const err = toError(error);

  if (process.env.NODE_ENV === "development") {
    console.error(context ? `${context}:` : "API Error:", err);
  }

  return Response.json(
    {
      error: err.message || "An unexpected error occurred",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    },
    { status: 500 }
  );
}

/**
 * Type guard for Axios errors
 */
export interface AxiosError extends Error {
  response?: {
    status: number;
    data?: any;
  };
}

export function isAxiosError(error: unknown): error is AxiosError {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as any).response === "object"
  );
}

/**
 * Type guard for payment processor errors (Dejavoo)
 */
export interface PaymentError extends Error {
  isDeclined?: () => boolean;
  isTerminalError?: () => boolean;
  isTimeout?: () => boolean;
  statusCode?: string;
}

export function isPaymentError(error: unknown): error is PaymentError {
  return (
    typeof error === "object" &&
    error !== null &&
    ("isDeclined" in error || "isTerminalError" in error || "statusCode" in error)
  );
}
