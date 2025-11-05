/**
 * Component-Based Storefront Test Page
 * Tests the new Component Registry rendering system with Flora Distro
 */

import { getServiceSupabase } from '@/lib/supabase/client';
import { ComponentBasedPageRenderer } from '@/components/storefront/ComponentBasedPageRenderer';
import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ vendor?: string }>;
}

export default async function ComponentTestPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const vendorSlug = params.vendor || 'flora-distro';
  
  const supabase = getServiceSupabase();
  
  // Get vendor
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('*')
    .eq('slug', vendorSlug)
    .single();
  
  if (vendorError || !vendor) {
    redirect('/');
  }
  
  // Get sections for home page
  const { data: sections, error: sectionsError } = await supabase
    .from('vendor_storefront_sections')
    .select('id, section_key, section_order, is_enabled')
    .eq('vendor_id', vendor.id)
    .eq('page_type', 'home')
    .order('section_order');
  
  if (sectionsError || !sections) {
    return <div className="p-8 text-white">Failed to load sections</div>;
  }
  
  // Get component instances for these sections
  const sectionIds = sections.map(s => s.id);
  
  const { data: componentInstances, error: instancesError } = await supabase
    .from('vendor_component_instances')
    .select('*')
    .eq('vendor_id', vendor.id)
    .in('section_id', sectionIds)
    .order('position_order');
  
  if (instancesError) {
    console.error('Failed to load component instances:', instancesError);
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black border-b border-neutral-800 py-4 px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">{vendor.store_name || vendor.slug}</h1>
          <nav className="flex gap-6">
            <a href={`/storefront/component-test?vendor=${vendorSlug}`} className="hover:text-neutral-300">Home</a>
            <a href={`/storefront/shop?vendor=${vendorSlug}`} className="hover:text-neutral-300">Shop</a>
            <a href={`/storefront/about?vendor=${vendorSlug}`} className="hover:text-neutral-300">About</a>
          </nav>
        </div>
      </header>
      
      {/* Component-Based Content */}
      <ComponentBasedPageRenderer
        vendor={vendor}
        pageType="home"
        sections={sections}
        componentInstances={componentInstances || []}
      />
      
      {/* Debug Info */}
      <div className="bg-neutral-900 border-t border-neutral-800 p-8 mt-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-bold mb-4">🎨 Component Registry Debug</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-neutral-400">Vendor:</p>
              <p className="font-mono">{vendor.slug}</p>
            </div>
            <div>
              <p className="text-neutral-400">Sections:</p>
              <p className="font-mono">{sections.length}</p>
            </div>
            <div>
              <p className="text-neutral-400">Components:</p>
              <p className="font-mono">{componentInstances?.length || 0}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-green-400">✅ Rendering with Component Registry System</p>
            <p className="text-neutral-500 text-xs mt-1">No legacy hardcoded sections!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

