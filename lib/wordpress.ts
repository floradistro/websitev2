import axios, { AxiosInstance } from "axios";

// WooCommerce API configuration
const baseUrl = process.env.WORDPRESS_API_URL || process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://api.floradistro.com";
const consumerKey = process.env.WORDPRESS_CONSUMER_KEY || process.env.NEXT_PUBLIC_WORDPRESS_CONSUMER_KEY || "";
const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET || process.env.NEXT_PUBLIC_WORDPRESS_CONSUMER_SECRET || "";

// Validate configuration
if (!baseUrl || baseUrl === "") {
  console.error("⚠️ WORDPRESS_API_URL not configured - using fallback");
}

// Create WooCommerce API client with OAuth1 credentials
const wooApi: AxiosInstance = axios.create({
  baseURL: `${baseUrl}/wp-json/wc/v3`,
  params: {
    consumer_key: consumerKey,
    consumer_secret: consumerSecret,
  },
});

// Create WordPress REST API client
const wordpressApi: AxiosInstance = axios.create({
  baseURL: `${baseUrl}/wp-json/wp/v2`,
});

export { wooApi as api, wordpressApi };

export async function getProducts(params?: any) {
  const response = await wooApi.get("products", { params });
  return response.data;
}

export async function getAllProducts() {
  let allProducts: any[] = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await wooApi.get("products", {
      params: {
        per_page: 100,
        page: page,
      }
    });
    
    allProducts = [...allProducts, ...response.data];
    
    // Check if there are more pages
    const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1');
    hasMore = page < totalPages;
    page++;
  }
  
  // Deduplicate products by ID (in case API returns duplicates)
  const uniqueProducts = Array.from(
    new Map(allProducts.map(product => [product.id, product])).values()
  );
  
  return uniqueProducts;
}

// OPTIMIZED: Use bulk endpoint - returns products with inventory, fields, and meta data in ONE call
export async function getBulkProducts(params?: any) {
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-im/v1/products/bulk?${authParams}`,
    { params }
  );
  return response.data;
}

export async function getProduct(id: string | number) {
  try {
    const response = await wooApi.get(`products/${id}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null; // Product not found
    }
    throw error; // Re-throw other errors
  }
}

export async function updateProduct(id: string | number, data: any) {
  const response = await wooApi.put(`products/${id}`, data);
  return response.data;
}

export async function getProductsByCategory(categoryId: number, perPage = 8) {
  const response = await wooApi.get("products", {
    params: {
      category: categoryId,
      per_page: perPage,
    }
  });
  return response.data;
}

export async function getCategories(params?: any) {
  const response = await wooApi.get("products/categories", { params });
  return response.data;
}

export async function getPosts(params?: any) {
  const response = await wordpressApi.get("/posts", { params });
  return response.data;
}

export async function getPost(slug: string) {
  const response = await wordpressApi.get(`/posts?slug=${slug}`);
  return response.data[0];
}

export async function getPages(params?: any) {
  const response = await wordpressApi.get("/pages", { params });
  return response.data;
}

export async function getPage(slug: string) {
  const response = await wordpressApi.get(`/pages?slug=${slug}`);
  return response.data[0];
}

// Location & Inventory Management
const authParams = `consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;

export async function getLocations() {
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-im/v1/locations?per_page=100&${authParams}`
  );
  return response.data;
}

export async function deleteLocation(locationId: number) {
  const response = await axios.delete(
    `${baseUrl}/wp-json/flora-im/v1/locations/${locationId}?${authParams}`
  );
  return response.data;
}

export async function updateLocation(locationId: number, data: any) {
  const response = await axios.put(
    `${baseUrl}/wp-json/flora-im/v1/locations/${locationId}?${authParams}`,
    data
  );
  return response.data;
}

export async function createLocation(data: any) {
  const response = await axios.post(
    `${baseUrl}/wp-json/flora-im/v1/locations?${authParams}`,
    data
  );
  return response.data;
}

export async function getProductInventory(productId: string | number) {
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-im/v1/inventory?product_id=${productId}&${authParams}`
  );
  return response.data;
}

export async function getAllInventory() {
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-im/v1/inventory?${authParams}`
  );
  return response.data;
}

export async function getLocationInventory(locationId: number) {
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-im/v1/inventory?location_id=${locationId}&${authParams}`
  );
  return response.data;
}

export async function getProductInventoryByLocation(
  productId: string | number,
  locationId: number
) {
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-im/v1/inventory?product_id=${productId}&location_id=${locationId}&${authParams}`
  );
  return response.data[0] || null;
}

// V3 Native Fields System
export async function getProductFieldsV3(productId: string | number) {
  const response = await axios.get(
    `${baseUrl}/wp-json/fd/v3/products/${productId}/fields?${authParams}`
  );
  return response.data;
}

export async function getProductPricingV3(productId: string | number) {
  const response = await axios.get(
    `${baseUrl}/wp-json/fd/v3/products/${productId}/pricing?${authParams}`
  );
  return response.data;
}

// Get best-selling products based on order data
export async function getBestSellingProducts(params?: any) {
  const response = await wooApi.get("products", {
    params: {
      orderby: 'popularity',
      per_page: params?.per_page || 8,
      ...params,
    }
  });
  return response.data;
}

// OPTIMIZED: Single product bulk endpoint - returns product with all data
export async function getBulkProduct(productId: string | number) {
  try {
    const response = await axios.get(
      `${baseUrl}/wp-json/flora-im/v1/products/bulk?${authParams}&include=${productId}`
    );
    return response.data?.data?.[0] || null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

// Get orders to calculate best sellers
export async function getOrders(params?: any) {
  const response = await wooApi.get("orders", { params });
  return response.data;
}

// Product Reviews
export async function getProductReviews(productId: string | number) {
  try {
    const response = await wooApi.get("products/reviews", {
      params: {
        product: productId,
        per_page: 100,
        status: 'approved'
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

export async function getAllReviews(params?: any) {
  try {
    const response = await wooApi.get("products/reviews", {
      params: {
        per_page: 100,
        status: 'approved',
        ...params
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    return [];
  }
}

// ==========================================
// VENDOR MARKETPLACE API
// ==========================================

// Vendor API client
const vendorApi: AxiosInstance = axios.create({
  baseURL: `${baseUrl}/wp-json/flora-vendors/v1`,
});

// PUBLIC VENDOR ENDPOINTS (No auth required)

export async function getAllVendors() {
  try {
    const response = await vendorApi.get("/vendors");
    return response.data;
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return [];
  }
}

export async function getVendorBySlug(slug: string) {
  try {
    const response = await vendorApi.get(`/vendors/${slug}`);
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getVendorProducts(slug: string, params?: any) {
  try {
    // Get vendor's product list (returns basic data with product IDs)
    const vendorProductsResponse = await vendorApi.get(`/vendors/${slug}/products`, { params });
    
    if (!vendorProductsResponse.data || vendorProductsResponse.data.length === 0) {
      return [];
    }
    
    // Extract product IDs (the endpoint returns id field which is the product_id)
    const productIds = vendorProductsResponse.data.map((p: any) => p.id).join(',');
    
    if (!productIds) return [];
    
    // Get full product data from bulk API with stock and Flora fields
    const cacheBuster = `_t=${Date.now()}`;
    const bulkResponse = await axios.get(
      `${baseUrl}/wp-json/flora-im/v1/products/bulk?${authParams}&include=${productIds}&${cacheBuster}`
    );
    
    return bulkResponse.data?.data || [];
  } catch (error) {
    console.error("Error fetching vendor products:", error);
    return [];
  }
}

/**
 * ⚠️ CLIENT-SIDE ONLY - Uses localStorage
 * DO NOT call from Server Actions ("use server")
 * See: SERVER-ACTIONS-GUIDE.md
 */
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

// VENDOR DASHBOARD ENDPOINTS (Auth required)

export async function getVendorDashboard() {
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/dashboard`,
    {
      headers: getVendorAuthHeaders()
    }
  );
  return response.data;
}

export async function getVendorMyProducts(page = 1, per_page = 20, status?: string) {
  const params: any = { page, per_page };
  if (status) params.status = status;
  
  // Add cache buster to prevent SiteGround caching
  const cacheBuster = `_t=${Date.now()}`;
  const queryString = new URLSearchParams(params).toString();
  
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/products?${queryString}&${cacheBuster}`,
    {
      headers: getVendorAuthHeaders()
    }
  );
  return response.data;
}

export async function getVendorProduct(productId: number) {
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/products/${productId}`,
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

export async function createVendorProduct(productData: any) {
  const response = await axios.post(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/products`,
    productData,
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

export async function updateVendorProduct(productId: number, productData: any) {
  const response = await axios.put(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/products/${productId}`,
    productData,
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

export async function getVendorInventory() {
  const cacheBuster = `_t=${Date.now()}`;
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/inventory?${cacheBuster}`,
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

export async function createVendorChangeRequest(productId: number, changes: any) {
  const cacheBuster = `_t=${Date.now()}`;
  const response = await axios.post(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/products/${productId}/change-request?${cacheBuster}`,
    changes,
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

export async function getVendorChangeRequests() {
  const cacheBuster = `_t=${Date.now()}`;
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/change-requests?${cacheBuster}`,
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

export async function updateVendorInventory(productId: number, inventoryData: any) {
  const cacheBuster = `_t=${Date.now()}`;
  const response = await axios.put(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/inventory/${productId}?${cacheBuster}`,
    inventoryData,
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

export async function adjustVendorInventory(productId: number, operation: 'add' | 'subtract', amount: number, reason?: string) {
  const cacheBuster = `_t=${Date.now()}`;
  const response = await axios.post(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/inventory/${productId}/adjust?${cacheBuster}`,
    { operation, amount, reason },
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

export async function setVendorInventory(productId: number, quantity: number, reason?: string) {
  const cacheBuster = `_t=${Date.now()}`;
  const response = await axios.post(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/inventory/${productId}/set?${cacheBuster}`,
    { quantity, reason },
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

export async function getVendorOrders(page = 1, per_page = 20) {
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/orders?page=${page}&per_page=${per_page}`,
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

export async function getVendorOrder(orderId: number) {
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/orders/${orderId}`,
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

export async function getVendorPayouts() {
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/payouts`,
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

export async function getVendorPayout(payoutId: number) {
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/payouts/${payoutId}`,
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

export async function getVendorCOAs() {
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/coas`,
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

export async function deleteVendorCOA(coaId: number) {
  const response = await axios.delete(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/coas/${coaId}`,
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

export async function getVendorReviews() {
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/reviews`,
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

export async function respondToVendorReview(reviewId: number, responseText: string) {
  const responseData = await axios.post(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/reviews/${reviewId}/respond`,
    { response: responseText },
    { headers: getVendorAuthHeaders() }
  );
  return responseData.data;
}

export async function getVendorBranding() {
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/branding`,
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

/**
 * ⚠️ CLIENT-SIDE ONLY - Uses localStorage
 * DO NOT call from Server Actions ("use server")
 * See: SERVER-ACTIONS-GUIDE.md
 */
export async function updateVendorBranding(brandingData: any) {
  // Get vendor user_id from stored vendor data
  const vendorData = localStorage.getItem('vendor_data');
  const vendor = vendorData ? JSON.parse(vendorData) : null;
  
  if (!vendor || !vendor.user_id) {
    throw new Error('Vendor data not found');
  }
  
  // Use WooCommerce Customer API (works perfectly)
  const metaData = Object.keys(brandingData).map(key => ({
    key: `vendor_${key}`,
    value: brandingData[key]
  }));
  
  const response = await axios.put(
    `${baseUrl}/wp-json/wc/v3/customers/${vendor.user_id}`,
    { meta_data: metaData },
    {
      auth: {
        username: 'ck_bb8e5fe3d405e6ed6b8c079c93002d7d8b23a7d5',
        password: 'cs_38194e74c7ddc5d72b6c32c70485728e7e529678'
      }
    }
  );
  
  // Also update vendor table directly
  await axios.post(
    `${baseUrl}/wp-content/plugins/flora-inventory-matrix/save-branding.php`,
    brandingData,
    { headers: getVendorAuthHeaders() }
  ).catch(() => {
    // Fallback - at least meta_data saved
  });
  
  return { success: true, message: 'Branding updated' };
}

export async function getVendorSettings() {
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/settings`,
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

export async function updateVendorSettings(settingsData: any) {
  const response = await axios.put(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/settings`,
    settingsData,
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

export async function getVendorAnalytics(days = 30) {
  const response = await axios.get(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/analytics?days=${days}`,
    { headers: getVendorAuthHeaders() }
  );
  return response.data;
}

// ==========================================
// VENDOR MEDIA UPLOADS
// ==========================================

export async function uploadVendorImages(files: File[]) {
  const formData = new FormData();
  files.forEach((file, index) => {
    formData.append(`image_${index}`, file);
  });
  
  const cacheBuster = `_t=${Date.now()}`;
  const response = await axios.post(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/upload/images?${cacheBuster}`,
    formData,
    { 
      headers: {
        ...getVendorAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return response.data;
}

export async function uploadVendorCOA(file: File, metadata?: any) {
  const formData = new FormData();
  formData.append('coa', file);
  
  if (metadata) {
    Object.keys(metadata).forEach(key => {
      formData.append(key, metadata[key]);
    });
  }
  
  const cacheBuster = `_t=${Date.now()}`;
  const response = await axios.post(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/upload/coa?${cacheBuster}`,
    formData,
    {
      headers: {
        ...getVendorAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return response.data;
}

export async function uploadVendorLogo(file: File) {
  const formData = new FormData();
  formData.append('logo', file);
  
  const cacheBuster = `_t=${Date.now()}`;
  const response = await axios.post(
    `${baseUrl}/wp-json/flora-vendors/v1/vendors/me/upload/logo?${cacheBuster}`,
    formData,
    {
      headers: {
        ...getVendorAuthHeaders(),
        'Content-Type': 'multipart/form-data'
      }
    }
  );
  return response.data;
}


