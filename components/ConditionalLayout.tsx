"use client";

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isVendorPortal = pathname?.startsWith('/vendor');
  const isAdminPortal = pathname?.startsWith('/admin');
  const isStorefront = pathname?.startsWith('/storefront');
  
  // CRITICAL: Also check if we're on a custom domain (server-side detection)
  // This prevents Yacht Club header from showing on vendor storefronts
  const isCustomDomain = typeof window !== 'undefined' && 
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('yachtclub') &&
    !window.location.hostname.includes('vercel.app');
  
  const hideNavigation = isVendorPortal || isAdminPortal || isStorefront || isCustomDomain;

  return (
    <>
      {!hideNavigation && <Header />}
      <main className="flex-1">
        {children}
      </main>
      {!hideNavigation && (
        <>
          <Footer />
          <ScrollToTop />
        </>
      )}
    </>
  );
}

