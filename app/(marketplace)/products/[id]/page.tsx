import { getProduct } from "@/lib/supabase-api";
import ProductPageClientOptimized from "@/components/ProductPageClientOptimized";
import type { Metadata } from "next";

// Enable aggressive ISR - Revalidate every 60 seconds
export const revalidate = 60;

// Generate all product pages on-demand
export async function generateStaticParams() {
  return []; // Empty = all pages generated on first request
}

export const dynamicParams = true; // Allow dynamic params at runtime

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const response = await getProduct(id);
  const product = response?.product;

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const category = product.categories?.[0]?.name || product.primary_category?.name || "Products";
  const price = product.price ? `$${parseFloat(product.price).toFixed(0)}` : "";
  const description = product.short_description 
    ? product.short_description.replace(/<[^>]*>/g, '').substring(0, 155)
    : `Shop ${product.name} ${price ? `starting at ${price}` : ''} at Yacht Club. Premium cannabis products with fast shipping. In stock now.`;

  // Use product image
  const productImage = product.featured_image || product.images?.[0]?.src;
  const ogImageUrl = productImage || `/api/og-product?name=${encodeURIComponent(product.name)}&category=${encodeURIComponent(category)}&price=${encodeURIComponent(price)}`;

  return {
    title: `${product.name} | ${category}`,
    description,
    openGraph: {
      title: `${product.name} - ${category}`,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      type: "website",
      siteName: "Yacht Club",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} - ${category}`,
      description,
      images: [ogImageUrl],
      creator: "@floradistro",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Render client component immediately - it will fetch data instantly via SWR
  return <ProductPageClientOptimized productId={id} />;
}
