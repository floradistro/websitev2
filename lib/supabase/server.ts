import { getServiceSupabase } from "./client";

/**
 * DEPRECATED: This function now returns the singleton service client.
 * All new code should directly import getServiceSupabase from './client'
 *
 * This wrapper is kept for backwards compatibility only.
 */
export async function createClient() {
  // Return singleton instance instead of creating new client
  return getServiceSupabase();
}
