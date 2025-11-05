import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { getServiceSupabase } from '@/lib/supabase/client';
import { notFound } from 'next/navigation';
import { getVendorSectionsWithInit } from '@/lib/storefront/init-vendor-content';
import { ComponentBasedPageRenderer } from '@/components/storefront/ComponentBasedPageRenderer';

export const dynamic = 'force-dynamic';

export default async function StorefrontLabResultsPage({ searchParams }: { searchParams: Promise<{ vendor?: string; preview?: string }> }) {
  const params = await searchParams;
  const isPreview = params.preview === 'true';
  
  const vendorId = await getVendorFromHeaders();
  
  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);
  
  if (!vendor) {
    notFound();
  }

  const sections = await getVendorSectionsWithInit(vendor.id, vendor.store_name || vendor.slug, 'lab-results');
  const supabase = getServiceSupabase();
  const sectionIds = sections.map((s: any) => s.id);
  
  // Fetch COA files from storage
  const { data: coaFiles } = await supabase
    .storage
    .from('vendor-coas')
    .list(`${vendorId}`, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    });
  
  const { data: componentInstances } = await supabase
    .from('vendor_component_instances')
    .select('*')
    .eq('vendor_id', vendor.id)
    .in('section_id', sectionIds)
    .order('position_order');

  // Inject COA files into SmartLabResults component props
  const enhancedInstances = (componentInstances || []).map((instance: any) => {
    if (instance.component_key === 'smart_lab_results') {
      return {
        ...instance,
        props: {
          ...instance.props,
          coaFiles: coaFiles || []
        }
      };
    }
    return instance;
  });

  return (
    <ComponentBasedPageRenderer
      vendor={vendor}
      pageType="lab-results"
      sections={sections}
      componentInstances={enhancedInstances}
      isPreview={isPreview}
    />
  );
}
