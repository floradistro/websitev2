import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
