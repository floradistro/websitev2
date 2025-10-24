import { headers } from 'next/headers';
import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { getTemplateComponents } from '@/lib/storefront/template-loader';
import { StorefrontThemeProvider } from '@/components/storefront/ThemeProvider';
import { PreservePreviewMode } from '@/components/storefront/PreservePreviewMode';
import { LiveEditingProvider } from '@/components/storefront/LiveEditingProvider';
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import LoadingBar from "@/components/LoadingBar";
import NotificationToast from "@/components/NotificationToast";
import { notFound } from 'next/navigation';
import '@/app/globals.css';
import './storefront.css';

export const dynamic = 'force-dynamic';

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if template preview mode (blank slate)
  const headersList = await headers();
  const tenantType = headersList.get('x-tenant-type');
  
  // If template preview, render minimal blank template
  if (tenantType === 'template-preview') {
    return (
      <>
        <div className="storefront-container bg-[#1a1a1a] min-h-screen">
          <header className="sticky top-0 bg-black text-white z-50 border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-center">
              <span className="text-sm uppercase tracking-wider text-white/40">Blank Template</span>
            </div>
          </header>
          <main className="storefront-main">
            {children}
          </main>
          <footer className="bg-black border-t border-white/10 py-8">
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
    notFound();
  }

  // Load template components based on vendor's template_id
  const templateId = vendor.template_id || 'default';
  const { Header, Footer } = getTemplateComponents(templateId);

  // Fetch ALL content sections for live editing (across all pages)
  const { getVendorPageSections } = await import('@/lib/storefront/content-api');
  const allSections = await Promise.all([
    getVendorPageSections(vendorId, 'home'),
    getVendorPageSections(vendorId, 'about'),
    getVendorPageSections(vendorId, 'contact'),
    getVendorPageSections(vendorId, 'faq'),
    getVendorPageSections(vendorId, 'global'),
  ]).then(results => results.flat());

  // Render complete vendor storefront with database-driven customization
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <LiveEditingProvider initialSections={allSections} isPreviewMode={true}>
            <StorefrontThemeProvider vendor={vendor}>
              <PreservePreviewMode />
              <div className="storefront-container bg-black min-h-screen">
                <Header vendor={vendor} />
                <main className="storefront-main">
                  {children}
                </main>
              </div>
            </StorefrontThemeProvider>
          </LiveEditingProvider>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
