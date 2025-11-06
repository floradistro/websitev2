/**
 * Default Template - Product Page Component
 * Simple product detail page
 */

"use client";

import { StorefrontProductDetail } from '@/components/storefront/templates/flora-distro/components/storefront/StorefrontProductDetail';

interface ProductPageProps {
  productSlug: string;
  vendorId: string;
}

export default function ProductPage({ productSlug, vendorId }: ProductPageProps) {
  // Use the existing product detail component
  return <StorefrontProductDetail productSlug={productSlug} vendorId={vendorId} />;
}

