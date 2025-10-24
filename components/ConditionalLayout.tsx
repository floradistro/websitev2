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

  // For storefront routes, render NOTHING - they have their own complete layout
  if (isStorefront) {
    return <>{children}</>;
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

