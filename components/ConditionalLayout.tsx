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
  const hideNavigation = isVendorPortal || isAdminPortal || isStorefront;

  // Debug log
  if (typeof window !== 'undefined' && isStorefront) {
    console.log('🚫 ConditionalLayout: Hiding Yacht Club header (storefront detected)');
  }

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

