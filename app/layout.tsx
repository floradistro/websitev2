import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import "./(storefront)/storefront.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import NotificationToast from "@/components/NotificationToast";
import PullToRefresh from "@/components/PullToRefresh";
import LoadingBar from "@/components/LoadingBar";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { VendorAuthProvider } from "@/context/VendorAuthContext";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { LoyaltyProvider } from "@/context/LoyaltyContext";
import Providers from "./providers";
// import { RecentlyViewedProvider } from "@/context/RecentlyViewedContext";

// Prevent static generation errors
export const dynamic = 'force-dynamic';

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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: "Yacht Club | Premium Marketplace",
  description: "Shop premium cannabis products including flower, concentrates, edibles, vapes, and beverages. Direct from our facilities with next-day regional delivery. Farm Bill compliant.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Yacht Club',
    startupImage: '/yacht-club-logo.png',
  },
  openGraph: {
    title: "Yacht Club | Premium Marketplace",
    description: "Premium cannabis products with fast shipping. Direct sourcing, volume pricing, always fresh.",
    type: "website",
    siteName: "Yacht Club",
    images: [
      {
        url: '/api/og-image',
        width: 1200,
        height: 630,
        alt: 'Yacht Club',
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Yacht Club | Premium Marketplace",
    description: "Premium cannabis products with fast shipping.",
    images: ['/api/og-image'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/yacht-club-logo.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // INDUSTRY STANDARD: Detect tenant from middleware headers
  const headersList = await headers();
  const tenantType = headersList.get('x-tenant-type');
  const vendorId = headersList.get('x-vendor-id');
  
  // If VENDOR tenant OR template preview, render vendor layout
  if ((tenantType === 'vendor' || tenantType === 'template-preview') && vendorId) {
    const { getVendorStorefront } = await import('@/lib/storefront/get-vendor');
    const { getTemplateComponents } = await import('@/lib/storefront/template-loader');
    const { StorefrontThemeProvider } = await import('@/components/storefront/ThemeProvider');
    
    const vendor = await getVendorStorefront(vendorId);
    
    if (!vendor && tenantType === 'vendor') {
      return (
        <html lang="en">
          <body>
            <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a] text-white">
              <p>Vendor not found</p>
            </div>
          </body>
        </html>
      );
    }
    
    // Template preview mode (no vendor selected)
    if (!vendor && tenantType === 'template-preview') {
      // Render minimal blank template layout
      return (
        <html lang="en" data-scroll-behavior="smooth" className="overflow-x-hidden" suppressHydrationWarning>
          <head>
            <title>Vendor Storefront Template</title>
          </head>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col overflow-x-hidden min-h-screen`}
            style={{ backgroundColor: '#1a1a1a' }}
            suppressHydrationWarning
          >
            <Providers>
              <LoadingBar />
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
              <NotificationToast />
            </Providers>
          </body>
        </html>
      );
    }
    
    // Render COMPLETE vendor layout - NO Yacht Club wrapper!
    if (vendor) {
      // Load template components based on vendor's template_id
      const templateId = vendor.template_id || 'default';
      const { Header, Footer } = getTemplateComponents(templateId);
      
      return (
        <html lang="en" data-scroll-behavior="smooth" className="overflow-x-hidden" suppressHydrationWarning>
          <head>
            <title>{vendor.store_name} - Premium Cannabis</title>
            <meta name="description" content={vendor.store_description || `Shop premium cannabis products from ${vendor.store_name}`} />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col overflow-x-hidden min-h-screen`}
          style={{ backgroundColor: '#1a1a1a' }}
          suppressHydrationWarning
        >
          <Providers>
            <LoadingBar />
            <AuthProvider>
              <WishlistProvider>
                <CartProvider>
                  <StorefrontThemeProvider vendor={vendor}>
                    <div className="storefront-container bg-[#1a1a1a] min-h-screen">
                      <Header vendor={vendor} />
                      <main className="storefront-main">
                        {children}
                      </main>
                      <Footer vendor={vendor} />
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
  }
  
  // Render Yacht Club marketplace layout
  return (
    <html lang="en" data-scroll-behavior="smooth" className="overflow-x-hidden" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === 'development' && (
          <script src="/sw-killer.js" />
        )}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Yacht Club" />
        <link rel="apple-touch-icon" href="/yacht-club-logo.png" />
        <link rel="apple-touch-startup-image" href="/yacht-club-logo.png" />
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
            <VendorAuthProvider>
              <AdminAuthProvider>
                <LoyaltyProvider>
                  <WishlistProvider>
                    <CartProvider>
                      {/* <RecentlyViewedProvider> */}
                        <PullToRefresh />
                        <ConditionalLayout>
                          {children}
                        </ConditionalLayout>
                        <NotificationToast />
                      {/* </RecentlyViewedProvider> */}
                    </CartProvider>
                  </WishlistProvider>
                </LoyaltyProvider>
              </AdminAuthProvider>
            </VendorAuthProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}

