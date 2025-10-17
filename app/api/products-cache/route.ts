import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from 'next/cache';
import axios from "axios";

const baseUrl = process.env.WORDPRESS_API_URL || "";
const consumerKey = process.env.WORDPRESS_CONSUMER_KEY || "";
const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET || "";
const authParams = `consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;

// Cache all products with inventory
const getCachedAllProducts = unstable_cache(
  async () => {
    const [bulkRes, categoriesRes, locationsRes, pricingRes] = await Promise.all([
      axios.get(`${baseUrl}/wp-json/flora-im/v1/products/bulk?${authParams}&per_page=1000`),
      axios.get(`${baseUrl}/wp-json/wc/v3/products/categories?${authParams}&per_page=100`),
      axios.get(`${baseUrl}/wp-json/flora-im/v1/locations?per_page=100&${authParams}`),
      axios.get(`${baseUrl}/wp-json/fd/v2/pricing/rules?${authParams}`)
    ]);

    const bulkProducts = bulkRes.data?.data || [];
    
    // Map to consistent format
    const products = bulkProducts.map((bp: any) => ({
      id: parseInt(bp.id),
      name: bp.name,
      type: bp.type,
      status: bp.status,
      price: bp.regular_price,
      regular_price: bp.regular_price,
      sale_price: bp.sale_price,
      images: bp.image ? [{ src: bp.image, id: 0, name: bp.name }] : [],
      categories: (bp.categories || []).map((cat: any) => ({
        id: parseInt(cat.id),
        name: cat.name,
        slug: cat.slug
      })),
      meta_data: bp.meta_data || [],
      stock_status: bp.total_stock > 0 ? 'instock' : 'outofstock',
      total_stock: bp.total_stock,
      inventory: bp.inventory || [],
    }));

    // Filter to only in-stock products
    const inStockProducts = products.filter((p: any) => p.total_stock > 0);

    return {
      products: inStockProducts,
      allProducts: products,
      categories: categoriesRes.data,
      locations: locationsRes.data,
      pricingRules: pricingRes.data,
      meta: {
        total: inStockProducts.length,
        all_total: products.length,
        cached: true,
        timestamp: new Date().toISOString(),
      }
    };
  },
  ['products-cache'],
  { revalidate: 180, tags: ['products'] } // 3 minutes cache
);

export async function GET(request: NextRequest) {
  try {
    const data = await getCachedAllProducts();

    return NextResponse.json({
      success: true,
      ...data,
    });

  } catch (error: any) {
    console.error("Products cache API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}

