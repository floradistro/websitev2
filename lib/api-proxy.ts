/**
 * API Proxy Helper
 * Routes vendor API calls through Next.js proxy to avoid CORS
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const baseUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://api.floradistro.com";

/**
 * Makes API request - routes vendor endpoints through proxy
 */
export async function apiRequest<T = any>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  // Check if this is a vendor endpoint
  const isVendorEndpoint = endpoint.includes('flora-vendors/v1');
  
  if (isVendorEndpoint && typeof window !== 'undefined') {
    // Client-side vendor request - use proxy
    const cleanEndpoint = endpoint.replace(`${baseUrl}/wp-json/`, '');
    
    return axios({
      ...config,
      url: `/api/vendor-proxy?endpoint=${encodeURIComponent(cleanEndpoint)}`,
      method: config?.method || 'GET',
    });
  } else {
    // Direct request (server-side or non-vendor)
    return axios({
      ...config,
      url: endpoint,
    });
  }
}
