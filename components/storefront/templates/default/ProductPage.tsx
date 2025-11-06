/**
 * Default Template - Product Page Component
 * Simple product detail page
 */

"use client";

interface ProductPageProps {
  productSlug: string;
  vendorId: string;
}

export default function ProductPage({ productSlug, vendorId }: ProductPageProps) {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Product: {productSlug}</h1>
        <p className="text-white/60">Product details will be loaded here.</p>
      </div>
    </div>
  );
}

