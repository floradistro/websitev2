import { getVendorFromHeaders } from '@/lib/storefront/get-vendor';
import { StorefrontProductDetail } from '@/components/storefront/StorefrontProductDetail';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductPage({ params, searchParams }: PageProps & { searchParams: Promise<{ vendor?: string; preview?: string }> }) {
  const { slug } = await params;
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  // Load product page config
  const { getVendorPageSections } = await import('@/lib/storefront/content-api');
  const productSections = await getVendorPageSections(vendorId, 'product');
  const productConfigSection = productSections.find(s => s.section_key === 'product_detail_config');

  // Check if in preview mode
  const urlParams = await searchParams;
  if (urlParams.preview === 'true') {
    const { LiveEditingProvider } = await import('@/components/storefront/LiveEditingProvider');
    const { StorefrontProductDetailWrapper } = await import('@/components/storefront/StorefrontProductDetailWrapper');
    
    return (
      <LiveEditingProvider initialSections={productSections} isPreviewMode={true}>
        <StorefrontProductDetailWrapper 
          productSlug={slug} 
          vendorId={vendorId} 
        />
      </LiveEditingProvider>
    );
  }

  // Pass slug to client component - it will fetch via API like Yacht Club
  return (
    <StorefrontProductDetail 
      productSlug={slug} 
      vendorId={vendorId}
      config={productConfigSection?.content_data}
    />
  );
}

