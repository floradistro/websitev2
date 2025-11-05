import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { getServiceSupabase } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import { getVendorSectionsWithInit } from '@/lib/storefront/init-vendor-content';
import { ComponentBasedPageRenderer } from '@/components/storefront/ComponentBasedPageRenderer';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ProductPage({ params, searchParams }: PageProps & { searchParams: Promise<{ vendor?: string; preview?: string }> }) {
  const { slug } = await params;
  const searchParamsResolved = await searchParams;
  const isPreview = searchParamsResolved.preview === 'true';
  
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);
  
  if (!vendor) {
    notFound();
  }

  const sections = await getVendorSectionsWithInit(vendor.id, vendor.store_name || vendor.slug, 'product');
  const supabase = getServiceSupabase();
  const sectionIds = sections.map((s: any) => s.id);
  
  const { data: componentInstances } = await supabase
    .from('vendor_component_instances')
    .select('*')
    .eq('vendor_id', vendor.id)
    .in('section_id', sectionIds)
    .order('position_order');

  return (
    <ComponentBasedPageRenderer
      vendor={vendor}
      pageType="product"
      sections={sections}
      componentInstances={componentInstances || []}
      isPreview={isPreview}
    />
  );
}

