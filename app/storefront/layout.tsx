import { headers } from 'next/headers';
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { StorefrontThemeProvider } from '@/components/storefront/ThemeProvider';
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader';
import { StorefrontFooter } from '@/components/storefront/StorefrontFooter';
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import LoadingBar from "@/components/LoadingBar";
import NotificationToast from "@/components/NotificationToast";
import Providers from "@/app/providers";
import { notFound } from 'next/navigation';
import '@/app/globals.css';
import './storefront.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);

  if (!vendor) {
    notFound();
  }

  return (
    <html lang="en" data-scroll-behavior="smooth" className="overflow-x-hidden" suppressHydrationWarning>
      <head>
        <title>{vendor.store_name} - Premium Cannabis</title>
        <meta name="description" content={vendor.store_description || `Shop premium cannabis products from ${vendor.store_name}`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {vendor.logo_url && <link rel="apple-touch-icon" href={vendor.logo_url} />}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col overflow-x-hidden min-h-screen`}
        style={{ 
          backgroundColor: '#1a1a1a' 
        }}
        suppressHydrationWarning
      >
        <Providers>
          <LoadingBar />
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <StorefrontThemeProvider vendor={vendor}>
                  <div className="storefront-container bg-[#1a1a1a] min-h-screen">
                    <StorefrontHeader vendor={vendor} />
                    <main className="storefront-main">
                      {children}
                    </main>
                    <StorefrontFooter vendor={vendor} />
                  </div>
                  <NotificationToast />
                </StorefrontThemeProvider>
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}

