"use client";

import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isVendorPortal = pathname?.startsWith('/vendor');

  return (
    <>
      {!isVendorPortal && <Header />}
      <main className="flex-1">
        {children}
      </main>
      {!isVendorPortal && (
        <>
          <Footer />
          <ScrollToTop />
        </>
      )}
    </>
  );
}

