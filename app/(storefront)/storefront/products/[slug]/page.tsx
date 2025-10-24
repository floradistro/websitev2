import { getVendorFromHeaders } from '@/lib/storefront/get-vendor';
import { StorefrontProductDetail } from '@/components/storefront/StorefrontProductDetail';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  // Pass slug to client component - it will fetch via API like Yacht Club
  return <StorefrontProductDetail productSlug={slug} vendorId={vendorId} />;
}

