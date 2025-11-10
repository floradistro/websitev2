/**
 * Global API Error Handler
 * Wraps API routes with consistent error handling
 */

import { NextRequest, NextResponse } from "next/server";

import { logger } from "@/lib/logger";
export type ApiHandler = (request: NextRequest, context?: any) => Promise<NextResponse>;

interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
}

/**
 * Wraps an API handler with error handling and logging
 */
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      return await handler(request, context);
    } catch (error: any) {
      // Log error securely (no sensitive data)
      const errorMessage = error?.message || "Unknown error";
      const errorCode = error?.code || "INTERNAL_ERROR";

      // Log to monitoring service (not console in production)
      if (process.env.NODE_ENV === "production") {
        // TODO: Send to error monitoring service (Sentry, etc.)
        // await logError({ message: errorMessage, code: errorCode, stack: error?.stack });
      } else {
        if (process.env.NODE_ENV === "development") {
          if (process.env.NODE_ENV === "development") {
            logger.error("[API Error]", {
              message: errorMessage,
              code: errorCode,
              path: request.url,
            });
          }
        }
      }

      // Return user-friendly error
      const statusCode = getStatusCode(error);
      const response: ErrorResponse = {
        error: getUserMessage(error),
      };

      if (process.env.NODE_ENV === "development") {
        response.message = errorMessage;
        response.details = error?.details;
      }

      return NextResponse.json(response, { status: statusCode });
    }
  };
}

/**
 * Determine appropriate HTTP status code from error
 */
function getStatusCode(error: any): number {
  if (error?.status) return error.status;
  if (error?.code === "PGRST116") return 404; // Supabase not found
  if (error?.code === "23505") return 409; // Unique constraint
  if (error?.code === "42501") return 403; // Insufficient privilege
  if (error?.name === "ValidationError") return 400;
  if (error?.name === "UnauthorizedError") return 401;
  return 500;
}

/**
 * Get user-friendly error message
 */
function getUserMessage(error: any): string {
  const code = error?.code;

  // Database errors
  if (code === "PGRST116") return "Resource not found";
  if (code === "23505") return "This record already exists";
  if (code === "42501") return "You do not have permission to perform this action";
  if (code === "23503") return "Cannot delete: related records exist";

  // Common errors
  if (error?.name === "ValidationError") return "Invalid input data";
  if (error?.name === "UnauthorizedError") return "Authentication required";

  return "An error occurred processing your request";
}

/**
 * Validate required environment variables
 */
export function validateEnv(requiredVars: string[]): void {
  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

/**
 * Create a standardized success response
 */
export function successResponse<T = any>(data: T, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Create a standardized error response
 */
export function errorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}
