import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";
import axios from "axios";

const api = new WooCommerceRestApi({
  url: process.env.WORDPRESS_API_URL || "",
  consumerKey: process.env.WORDPRESS_CONSUMER_KEY || "",
  consumerSecret: process.env.WORDPRESS_CONSUMER_SECRET || "",
  version: "wc/v3",
});

const wordpressApi = axios.create({
  baseURL: `${process.env.WORDPRESS_API_URL}/wp-json/wp/v2`,
});

export { api, wordpressApi };

export async function getProducts(params?: any) {
  const response = await api.get("products", params);
  return response.data;
}

export async function getProduct(id: string | number) {
  const response = await api.get(`products/${id}`);
  return response.data;
}

export async function updateProduct(id: string | number, data: any) {
  const response = await api.put(`products/${id}`, data);
  return response.data;
}

export async function getProductsByCategory(categoryId: number, perPage = 8) {
  const response = await api.get("products", {
    category: categoryId,
    per_page: perPage,
  });
  return response.data;
}

export async function getCategories(params?: any) {
  const response = await api.get("products/categories", params);
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
const baseUrl = process.env.WORDPRESS_API_URL || "";
const authParams = `consumer_key=${process.env.WORDPRESS_CONSUMER_KEY}&consumer_secret=${process.env.WORDPRESS_CONSUMER_SECRET}`;

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
  const response = await api.get("products", {
    orderby: 'popularity',
    per_page: params?.per_page || 8,
    ...params,
  });
  return response.data;
}

// Get orders to calculate best sellers
export async function getOrders(params?: any) {
  const response = await api.get("orders", params);
  return response.data;
}

// Product Reviews
export async function getProductReviews(productId: string | number) {
  try {
    const response = await api.get("products/reviews", {
      product: productId,
      per_page: 100,
      status: 'approved'
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

export async function getAllReviews(params?: any) {
  try {
    const response = await api.get("products/reviews", {
      per_page: 100,
      status: 'approved',
      ...params
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    return [];
  }
}

