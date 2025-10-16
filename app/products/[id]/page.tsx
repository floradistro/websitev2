import { getProduct, getProducts, getLocations, getProductInventory, getPricingRules, getProductFields, getProductReviews } from "@/lib/wordpress";
import ProductPageClient from "@/components/ProductPageClient";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const { type: orderType } = await searchParams;
  
  // Get product first and check if it exists
  const product = await getProduct(id);
  
  if (!product) {
    notFound(); // Show 404 page
  }

  // Get rest of the data
  const [locations, inventory, pricingRules, productFields, reviews] = await Promise.all([
    getLocations(),
    getProductInventory(id),
    getPricingRules(),
    getProductFields(id),
    getProductReviews(id),
  ]);

  // Extract blueprint name from product fields
  const blueprintName = productFields?.fields?.[0]?.name || null;

  // Get related products from same category
  const categoryId = product.categories?.[0]?.id;
  const relatedProducts = categoryId 
    ? await getProducts({ category: categoryId, per_page: 10 }).then(products => 
        products.filter((p: any) => p.id !== product.id).slice(0, 6)
      )
    : await getProducts({ per_page: 10 }).then(products => 
        products.filter((p: any) => p.id !== product.id).slice(0, 6)
      );

  return (
    <ProductPageClient
      product={product}
      locations={locations}
      inventory={inventory}
      pricingRules={pricingRules}
      blueprintName={blueprintName}
      orderType={orderType}
      relatedProducts={relatedProducts}
      reviews={reviews}
    />
  );
}
