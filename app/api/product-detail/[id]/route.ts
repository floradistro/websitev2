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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const baseUrl = getBaseUrl();
    
    // Fetch product from Supabase with all related data
    const productResponse = await fetch(`${baseUrl}/api/supabase/products/${id}`);
    const productData = await productResponse.json();
    
    if (!productData.success || !productData.product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    const product = productData.product;
    
    // Get inventory for this product
    const inventoryResponse = await fetch(
      `${baseUrl}/api/supabase/inventory?product_id=${id}`
    );
    const inventoryData = await inventoryResponse.json();
    
    // Get locations
    const locationsResponse = await fetch(`${baseUrl}/api/supabase/locations`);
    const locationsData = await locationsResponse.json();
    
    // Get reviews
    const reviewsResponse = await fetch(
      `${baseUrl}/api/supabase/reviews?product_id=${id}&status=approved`
    );
    const reviewsData = await reviewsResponse.json();
    
    // Format response to match expected structure
    const response = {
      success: true,
      product: {
        ...product,
        images: product.featured_image ? [{ src: product.featured_image, alt: product.name }] : [],
        gallery: product.image_gallery || [],
        categories: product.categories || [],
        tags: product.tags || [],
        variations: product.variations || [],
        reviews: reviewsData.reviews || [],
        rating_count: product.rating_count || 0,
        average_rating: product.average_rating || 0
      },
      inventory: inventoryData.inventory || [],
      locations: locationsData.locations || [],
      pricingTiers: product.meta_data?._product_price_tiers || [],
      fields: product.blueprint_fields || []
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('Product detail error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch product' 
    }, { status: 500 });
  }
}

