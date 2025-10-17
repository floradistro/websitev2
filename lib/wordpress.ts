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

// Pricing & Fields System
export async function getPricingRules() {
  const response = await axios.get(
    `${baseUrl}/wp-json/fd/v2/pricing/rules?${authParams}`
  );
  return response.data;
}

export async function getProductFields(productId: string | number) {
  const response = await axios.get(
    `${baseUrl}/wp-json/fd/v2/products/${productId}/fields?${authParams}`
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

