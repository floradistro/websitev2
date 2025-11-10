/**
 * Cursor-based Pagination Utility
 *
 * Replaces offset-based pagination (.range()) with cursor-based pagination
 * which is more efficient for large datasets and doesn't have consistency issues.
 *
 * @example
 * const { data, pagination } = await paginateQuery(
 *   supabase.from('products').select('*').eq('vendor_id', vendorId),
 *   { cursor: request.nextUrl.searchParams.get('cursor'), limit: 20 }
 * );
 */

import { PostgrestFilterBuilder } from "@supabase/postgrest-js";

export interface CursorPaginationOptions {
  /**
   * Cursor token from previous page (base64 encoded)
   */
  cursor?: string | null;

  /**
   * Number of items per page
   * @default 20
   */
  limit?: number;

  /**
   * Field to use for cursor (must be unique and indexed)
   * @default 'created_at'
   */
  cursorField?: string;

  /**
   * Sort direction
   * @default 'desc'
   */
  direction?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    prevCursor: string | null;
    hasMore: boolean;
    limit: number;
  };
}

/**
 * Encode cursor value to base64
 */
function encodeCursor(value: any): string {
  return Buffer.from(JSON.stringify(value)).toString("base64");
}

/**
 * Decode cursor value from base64
 */
function decodeCursor(cursor: string): any {
  try {
    return JSON.parse(Buffer.from(cursor, "base64").toString());
  } catch {
    return null;
  }
}

/**
 * Apply cursor-based pagination to a Supabase query
 *
 * @example
 * // Basic usage
 * const result = await paginateQuery(
 *   supabase.from('products').select('*'),
 *   { limit: 20, cursor: request.searchParams.get('cursor') }
 * );
 *
 * // Custom cursor field
 * const result = await paginateQuery(
 *   supabase.from('products').select('*'),
 *   { limit: 20, cursor: nextCursor, cursorField: 'id' }
 * );
 */
export async function paginateQuery<T extends Record<string, any>>(
  query: PostgrestFilterBuilder<any, any, any, any>,
  options: CursorPaginationOptions = {},
): Promise<PaginatedResponse<T>> {
  const { cursor, limit = 20, cursorField = "created_at", direction = "desc" } = options;

  // Decode cursor if provided
  const decodedCursor = cursor ? decodeCursor(cursor) : null;

  // Build query with cursor filter
  let paginatedQuery = query;

  if (decodedCursor) {
    // Apply cursor filter based on direction
    if (direction === "desc") {
      paginatedQuery = paginatedQuery.lt(cursorField, decodedCursor[cursorField]);
    } else {
      paginatedQuery = paginatedQuery.gt(cursorField, decodedCursor[cursorField]);
    }
  }

  // Fetch one extra item to determine if there's a next page
  const { data, error } = await paginatedQuery
    .order(cursorField, { ascending: direction === "asc" })
    .limit(limit + 1);

  if (error) throw error;

  // Check if there are more items
  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;

  // Generate next cursor from last item
  const nextCursor = hasMore && items.length > 0 ? encodeCursor(items[items.length - 1]) : null;

  // Generate prev cursor from first item (for bi-directional pagination)
  const prevCursor = items.length > 0 ? encodeCursor(items[0]) : null;

  return {
    data: items as T[],
    pagination: {
      nextCursor,
      prevCursor,
      hasMore,
      limit,
    },
  };
}

/**
 * Helper to extract pagination params from request
 */
export function getPaginationParams(searchParams: URLSearchParams): CursorPaginationOptions {
  return {
    cursor: searchParams.get("cursor"),
    limit: parseInt(searchParams.get("limit") || "20"),
    cursorField: searchParams.get("cursor_field") || "created_at",
    direction: (searchParams.get("direction") as "asc" | "desc") || "desc",
  };
}

/**
 * Format pagination response for API
 */
export function formatPaginationResponse<T>(result: PaginatedResponse<T>) {
  return {
    data: result.data,
    pagination: {
      next_cursor: result.pagination.nextCursor,
      prev_cursor: result.pagination.prevCursor,
      has_more: result.pagination.hasMore,
      limit: result.pagination.limit,
    },
  };
}
