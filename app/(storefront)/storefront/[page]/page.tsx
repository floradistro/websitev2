import { headers } from 'next/headers';
import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { getServiceSupabase } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import { getVendorSectionsWithInit } from '@/lib/storefront/init-vendor-content';
import { ComponentBasedPageRenderer } from '@/components/storefront/ComponentBasedPageRenderer';

export default async function StorefrontDynamicPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ page: string }>;
  searchParams: Promise<{ vendor?: string; preview?: string }>;
}) {
  const { page } = await params;
  const queryParams = await searchParams;
  const isPreview = queryParams.preview === 'true';
  
  const vendorId = await getVendorFromHeaders();
  
  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);
  
  if (!vendor) {
    notFound();
  }

  // Map URL to page type
  const pageType = page || 'home';

  // Get sections for this page
  const sections = await getVendorSectionsWithInit(vendor.id, vendor.store_name || vendor.slug, pageType);
  const supabase = getServiceSupabase();
  const sectionIds = sections.map((s: any) => s.id);
  
  // Get component instances
  const { data: dbComponentInstances } = await supabase
    .from('vendor_component_instances')
    .select('*')
    .eq('vendor_id', vendor.id)
    .in('section_id', sectionIds)
    .order('position_order');

  const componentInstances = dbComponentInstances || [];

  return (
    <ComponentBasedPageRenderer
      vendor={vendor}
      pageType={pageType}
      sections={sections}
      componentInstances={componentInstances}
      isPreview={isPreview}
    />
  );
}

