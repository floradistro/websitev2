/**
 * Standardized API Error Handler
 * Use this to wrap all API route handlers for consistent error handling
 */

import { NextRequest, NextResponse } from 'next/server';

export type ApiError = {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
};

export type ApiSuccess<T = unknown> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

/**
 * Wraps an API route handler with standardized error handling
 *
 * @example
 * export const GET = apiHandler(async (request: NextRequest) => {
 *   const data = await fetchSomeData();
 *   return NextResponse.json({ success: true, data });
 * });
 */
export function apiHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('[API Error]', {
        path: request.nextUrl.pathname,
        method: request.method,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Determine status code based on error type
      let status = 500;
      let errorMessage = 'Internal server error';

      if (error instanceof Error) {
        errorMessage = error.message;

        // Handle common error types
        if (error.message.includes('not found')) status = 404;
        if (error.message.includes('unauthorized') || error.message.includes('authentication')) status = 401;
        if (error.message.includes('forbidden') || error.message.includes('permission')) status = 403;
        if (error.message.includes('invalid') || error.message.includes('validation')) status = 400;
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          ...(process.env.NODE_ENV === 'development' && {
            details: error instanceof Error ? error.stack : undefined,
          }),
        } as ApiError,
        { status }
      );
    }
  };
}

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({
    success: true,
    data,
    ...(meta && { meta }),
  });
}

/**
 * Create an error API response
 */
export function errorResponse(
  error: string,
  status: number = 400,
  code?: string
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(code && { code }),
    },
    { status }
  );
}

/**
 * Validation error helper
 */
export function validationError(message: string): NextResponse<ApiError> {
  return errorResponse(message, 400, 'VALIDATION_ERROR');
}

/**
 * Not found error helper
 */
export function notFoundError(resource: string = 'Resource'): NextResponse<ApiError> {
  return errorResponse(`${resource} not found`, 404, 'NOT_FOUND');
}

/**
 * Unauthorized error helper
 */
export function unauthorizedError(message: string = 'Unauthorized'): NextResponse<ApiError> {
  return errorResponse(message, 401, 'UNAUTHORIZED');
}

/**
 * Forbidden error helper
 */
export function forbiddenError(message: string = 'Forbidden'): NextResponse<ApiError> {
  return errorResponse(message, 403, 'FORBIDDEN');
}

/**
 * Internal server error helper
 */
export function serverError(message: string = 'Internal server error'): NextResponse<ApiError> {
  return errorResponse(message, 500, 'SERVER_ERROR');
}
