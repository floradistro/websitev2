/**
 * Vendor API Proxy Functions
 * These functions route through Next.js API to avoid CORS
 */

import axios from 'axios';

// Helper to get vendor auth headers
function getVendorAuthHeaders() {
  if (typeof window === 'undefined') return {};
  
  const vendorAuth = localStorage.getItem('vendor_auth');
  
  if (!vendorAuth) {
    throw new Error('Not authenticated');
  }
  
  return {
    'Authorization': `Basic ${vendorAuth}`
  };
}

// Proxy request helper
async function vendorProxyRequest(endpoint: string, method: string = 'GET', data?: any) {
  const headers = getVendorAuthHeaders();
  
  const response = await axios({
    url: `/api/vendor-proxy?endpoint=${encodeURIComponent(endpoint)}`,
    method,
    headers,
    data,
  });
  
  return response;
}

// Public vendor endpoints
export async function getAllVendorsProxy() {
  try {
    const response = await axios.get('/api/vendor-proxy?endpoint=flora-vendors/v1/vendors');
    return response.data;
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
}

export async function getVendorBySlugProxy(slug: string) {
  try {
    const response = await axios.get(`/api/vendor-proxy?endpoint=flora-vendors/v1/vendors/${slug}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

// Authenticated vendor endpoints
export async function getVendorDashboardProxy() {
  const response = await vendorProxyRequest('flora-vendors/v1/vendors/me/dashboard');
  return response.data;
}

export async function getVendorMyProductsProxy(page = 1, per_page = 20, status?: string) {
  const params: any = { page, per_page };
  if (status) params.status = status;
  
  const cacheBuster = `_t=${Date.now()}`;
  const queryString = new URLSearchParams(params).toString();
  
  const response = await vendorProxyRequest(
    `flora-vendors/v1/vendors/me/products?${queryString}&${cacheBuster}`
  );
  return response.data;
}

export async function getVendorInventoryProxy() {
  const cacheBuster = `_t=${Date.now()}`;
  const response = await vendorProxyRequest(
    `flora-vendors/v1/vendors/me/inventory?${cacheBuster}`
  );
  return response.data;
}

export async function getVendorBrandingProxy() {
  const response = await vendorProxyRequest('flora-vendors/v1/vendors/me/branding');
  return response.data;
}

export async function getVendorSettingsProxy() {
  const response = await vendorProxyRequest('flora-vendors/v1/vendors/me/settings');
  return response.data;
}

export async function adjustVendorInventoryProxy(productId: number, operation: 'add' | 'subtract', amount: number, reason?: string) {
  const cacheBuster = `_t=${Date.now()}`;
  const response = await vendorProxyRequest(
    `flora-vendors/v1/vendors/me/inventory/${productId}/adjust?${cacheBuster}`,
    'POST',
    { operation, amount, reason }
  );
  return response.data;
}

export async function setVendorInventoryProxy(productId: number, quantity: number, reason?: string) {
  const cacheBuster = `_t=${Date.now()}`;
  const response = await vendorProxyRequest(
    `flora-vendors/v1/vendors/me/inventory/${productId}/set?${cacheBuster}`,
    'POST',
    { quantity, reason }
  );
  return response.data;
}

export async function createVendorChangeRequestProxy(productId: number, changes: any) {
  const cacheBuster = `_t=${Date.now()}`;
  const response = await vendorProxyRequest(
    `flora-vendors/v1/vendors/me/products/${productId}/change-request?${cacheBuster}`,
    'POST',
    changes
  );
  return response.data;
}
