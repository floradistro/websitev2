import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalLayout from "@/components/ConditionalLayout";
import NotificationToast from "@/components/NotificationToast";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { LoyaltyProvider } from "@/context/LoyaltyContext";
// import { RecentlyViewedProvider } from "@/context/RecentlyViewedContext";

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
  themeColor: '#1a1a1a',
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: "Flora Distro | Premium Cannabis Distribution",
  description: "Shop premium cannabis products including flower, concentrates, edibles, vapes, and beverages. Direct from our facilities with next-day regional delivery. Farm Bill compliant.",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Flora Distro',
  },
  openGraph: {
    title: "Flora Distro | Premium Cannabis Distribution",
    description: "Premium cannabis products with fast shipping. Direct sourcing, volume pricing, always fresh.",
    type: "website",
    siteName: "Flora Distro",
    images: [
      {
        url: '/api/og-image',
        width: 1200,
        height: 630,
        alt: 'Flora Distro',
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flora Distro | Premium Cannabis Distribution",
    description: "Premium cannabis products with fast shipping.",
    images: ['/api/og-image'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logoprint.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.floradistro.com" />
        <link rel="dns-prefetch" href="https://api.floradistro.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <LoyaltyProvider>
            <WishlistProvider>
              <CartProvider>
                {/* <RecentlyViewedProvider> */}
                  <ConditionalLayout>
                    {children}
                  </ConditionalLayout>
                  <NotificationToast />
                {/* </RecentlyViewedProvider> */}
              </CartProvider>
            </WishlistProvider>
          </LoyaltyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
