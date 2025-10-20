import { getProduct, getProducts } from "@/lib/wordpress";
import ProductPageClientOptimized from "@/components/ProductPageClientOptimized";
import type { Metadata } from "next";

// Enable aggressive ISR - Revalidate every 60 seconds
export const revalidate = 60;

// Generate static paths for top products at build time
export async function generateStaticParams() {
  try {
    // Limit to 10 most popular products for static generation (faster Vercel builds)
    // Other products will be generated on-demand
    const products = await Promise.race([
      getProducts({ per_page: 10, orderby: 'popularity' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
    ]);
    return (products as any[]).map((product: any) => ({
      id: product.id.toString(),
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    // Return empty array to make all pages dynamic (prevents Vercel build hangs)
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const category = product.categories?.[0]?.name || "Products";
  const price = product.price ? `$${parseFloat(product.price).toFixed(0)}` : "";
  const description = product.short_description 
    ? product.short_description.replace(/<[^>]*>/g, '').substring(0, 155)
    : `Shop ${product.name} ${price ? `starting at ${price}` : ''} at Flora Distro. Premium cannabis products with fast shipping. In stock now.`;

  // Use product image if available, otherwise use generated OG image
  const productImage = product.images?.[0]?.src;
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
      siteName: "Flora Distro",
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
