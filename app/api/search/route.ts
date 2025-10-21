import { NextRequest, NextResponse } from "next/server";

// Get base URL for internal API calls
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ products: [] });
    }

    // Search using Supabase full-text search
    const searchResponse = await fetch(
      `${getBaseUrl()}/api/supabase/products?search=${encodeURIComponent(query)}&per_page=15&status=published`
    );
    
    const data = await searchResponse.json();
    const products = data.products || [];

    // Map to search result format
    const results = products.map((product: any) => {
      // Get pricing from tiers if available
      let priceDisplay = product.price || "0";
      
      if (product.meta_data?._product_price_tiers && Array.isArray(product.meta_data._product_price_tiers)) {
        const tiers = product.meta_data._product_price_tiers;
        if (tiers.length > 0) {
          const prices = tiers.map((t: any) => 
            typeof t.price === "string" ? parseFloat(t.price) : t.price
          );
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          
          if (minPrice === maxPrice) {
            priceDisplay = `${minPrice}`;
          } else {
            priceDisplay = `${minPrice}-${maxPrice}`;
          }
        }
      }

      return {
        id: product.id,
        name: product.name,
        price: priceDisplay,
        images: product.featured_image ? [{ src: product.featured_image }] : [],
        categories: product.categories || [],
      };
    });

    return NextResponse.json({ products: results });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}

