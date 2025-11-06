import { headers } from 'next/headers';
import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { StorefrontThemeProvider } from '@/components/storefront/templates/flora-distro/components/storefront/ThemeProvider';
import { PreservePreviewMode } from '@/components/storefront/templates/flora-distro/components/storefront/PreservePreviewMode';
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import LoadingBar from "@/components/LoadingBar";
import NotificationToast from "@/components/NotificationToast";
import { notFound } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase/client';
import { ComponentBasedPageRenderer } from '@/components/storefront/templates/flora-distro/components/storefront/ComponentBasedPageRenderer';
import '@/app/globals.css';
import './storefront.css';
import Script from 'next/script';

export const dynamic = 'force-dynamic';

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if template preview mode (blank slate)
  const headersList = await headers();
  const tenantType = headersList.get('x-tenant-type');
  const comingSoonHeader = headersList.get('x-coming-soon');
  
  console.log('[Storefront Layout] Headers:', {
    tenantType,
    comingSoonHeader,
    vendorId: headersList.get('x-vendor-id'),
  });
  
  // If template preview, render minimal blank template
  if (tenantType === 'template-preview') {
    return (
      <>
        <div className="storefront-container bg-[#1a1a1a] min-h-screen">
          <header className="sticky bg-black text-white z-50 border-b border-white/10" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-center">
              <span className="text-sm uppercase tracking-wider text-white/40">Blank Template</span>
            </div>
          </header>
          <main className="storefront-main" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            {children}
          </main>
          <footer className="bg-black border-t border-white/10 py-8" style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 0px))' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p className="text-white/30 text-xs">Template Preview</p>
            </div>
          </footer>
        </div>
      </>
    );
  }
  
  // For vendor mode, validate vendor exists
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);

  if (!vendor) {
    console.log('[Storefront Layout] Vendor not found:', vendorId);
    notFound();
  }

  console.log('[Storefront Layout] Vendor:', {
    id: vendor.id,
    name: vendor.store_name,
    coming_soon: vendor.coming_soon,
    comingSoonHeader,
  });

  // Check if coming soon mode is enabled (blocks ENTIRE site except preview)
  if (comingSoonHeader === 'true') {
    console.log('[Storefront Layout] Rendering coming soon page for:', vendor.store_name);
    const { ComingSoonPage } = await import('@/components/storefront/ComingSoonPage');
    return (
      <ComingSoonPage
        vendorName={vendor.store_name || vendor.slug}
        vendorLogo={vendor.logo_url || undefined}
        message={vendor.coming_soon_message || undefined}
        launchDate={vendor.launch_date || undefined}
      />
    );
  }
  
  console.log('[Storefront Layout] Rendering normal storefront for:', vendor.store_name);

  // Fetch header and footer sections from component registry
  const supabase = getServiceSupabase();
  
  // Get header section
  const { data: headerSections } = await supabase
    .from('vendor_storefront_sections')
    .select('*')
    .eq('vendor_id', vendor.id)
    .eq('section_key', 'header')
    .eq('page_type', 'all')
    .eq('is_enabled', true);
  
  // Get footer section
  const { data: footerSections } = await supabase
    .from('vendor_storefront_sections')
    .select('*')
    .eq('vendor_id', vendor.id)
    .eq('section_key', 'footer')
    .eq('page_type', 'all')
    .eq('is_enabled', true);
  
  // Get header component instances
  const headerSectionIds = headerSections?.map(s => s.id) || [];
  const { data: headerInstances } = headerSectionIds.length > 0 ? await supabase
    .from('vendor_component_instances')
    .select('*')
    .eq('vendor_id', vendor.id)
    .in('section_id', headerSectionIds)
    .eq('is_enabled', true)
    .order('position_order') : { data: [] };
  
  // Get footer component instances
  const footerSectionIds = footerSections?.map(s => s.id) || [];
  const { data: footerInstances } = footerSectionIds.length > 0 ? await supabase
    .from('vendor_component_instances')
    .select('*')
    .eq('vendor_id', vendor.id)
    .in('section_id', footerSectionIds)
    .eq('is_enabled', true)
    .order('position_order') : { data: [] };

  // Component Registry Architecture - All pages use ComponentBasedPageRenderer
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <StorefrontThemeProvider vendor={vendor}>
            <PreservePreviewMode />
            <LoadingBar />
            <NotificationToast />
            <div className="storefront-container bg-black min-h-screen">
              {/* Header from Component Registry */}
              {headerSections && headerSections.length > 0 && (
                <ComponentBasedPageRenderer
                  vendor={vendor}
                  pageType="all"
                  sections={headerSections}
                  componentInstances={headerInstances || []}
                  isPreview={false}
                />
              )}

              <main className="storefront-main" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                {children}
              </main>

              {/* Footer from Component Registry */}
              {footerSections && footerSections.length > 0 && (
                <div style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                  <ComponentBasedPageRenderer
                    vendor={vendor}
                    pageType="all"
                    sections={footerSections}
                    componentInstances={footerInstances || []}
                    isPreview={false}
                  />
                </div>
              )}
            </div>
          </StorefrontThemeProvider>
        </CartProvider>
      </WishlistProvider>
      <Script src="/visual-editor.js" strategy="afterInteractive" />
    </AuthProvider>
  );
}
