import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from 'next/cache';
import axios from "axios";

const baseUrl = process.env.WORDPRESS_API_URL || "";
const consumerKey = process.env.WORDPRESS_CONSUMER_KEY || "";
const consumerSecret = process.env.WORDPRESS_CONSUMER_SECRET || "";
const authParams = `consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`;

// Ultra-fast cached single product fetch with ALL data
const getCachedProductComplete = unstable_cache(
  async (productId: string) => {
    // Fetch ALL data in parallel - single round trip
    const [productRes, inventoryRes, fieldsRes, locationsRes, pricingRes] = await Promise.all([
      axios.get(`${baseUrl}/wp-json/wc/v3/products/${productId}?${authParams}`),
      axios.get(`${baseUrl}/wp-json/flora-im/v1/inventory?product_id=${productId}&${authParams}`),
      axios.get(`${baseUrl}/wp-json/fd/v2/products/${productId}/fields?${authParams}`),
      axios.get(`${baseUrl}/wp-json/flora-im/v1/locations?per_page=100&${authParams}`),
      axios.get(`${baseUrl}/wp-json/fd/v2/pricing/rules?${authParams}`)
    ]);

    // Map location names to inventory
    const locations = locationsRes.data;
    const locationMap = locations.reduce((acc: any, loc: any) => {
      acc[loc.id] = loc.name;
      return acc;
    }, {});

    // Enrich inventory with location names
    const enrichedInventory = inventoryRes.data.map((inv: any) => ({
      ...inv,
      location_name: locationMap[inv.location_id] || null,
    }));

    // Calculate total stock
    const totalStock = enrichedInventory.reduce((sum: number, inv: any) => {
      return sum + parseFloat(inv.stock_quantity || inv.quantity || inv.stock || 0);
    }, 0);

    return {
      product: productRes.data,
      inventory: enrichedInventory,
      locations: locations,
      pricingRules: pricingRes.data,
      productFields: fieldsRes.data,
      total_stock: totalStock,
      meta: {
        cached: true,
        timestamp: new Date().toISOString(),
        load_time_ms: Date.now(),
      }
    };
  },
  ['product-complete'],
  { revalidate: 180, tags: ['product'] } // 3 minutes cache
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Product ID required" },
        { status: 400 }
      );
    }

    // Get complete product data from cache
    const data = await getCachedProductComplete(id);

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    // Check if product has stock
    const hasStock = data.total_stock > 0 || data.inventory.some((inv: any) => 
      (inv.stock || inv.quantity || 0) > 0
    );

    if (!hasStock) {
      return NextResponse.json(
        { success: false, error: "Product out of stock" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ...data,
    });

  } catch (error: any) {
    console.error("Product API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}

