import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import "./(storefront)/storefront.css";
import NotificationToast from "@/components/NotificationToast";
import LoadingBar from "@/components/LoadingBar";
import Providers from "./providers";

// Enable static optimization for better performance
export const dynamic = 'auto';

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
  title: "WhaleTools | Multi-Tenant Commerce Platform",
  description: "Enterprise-grade multi-tenant commerce platform. Build, manage, and scale unlimited vendor storefronts with visual builders, custom domains, and advanced analytics.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WhaleTools',
    startupImage: '/yacht-club-logo.png',
  },
  openGraph: {
    title: "WhaleTools | Multi-Tenant Commerce Platform",
    description: "Enterprise-grade multi-tenant commerce platform. Build, manage, and scale unlimited vendor storefronts.",
    type: "website",
    siteName: "WhaleTools",
    images: [
      {
        url: '/api/og-image',
        width: 1200,
        height: 630,
        alt: 'WhaleTools',
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WhaleTools | Multi-Tenant Commerce Platform",
    description: "Enterprise-grade platform for unlimited vendor storefronts.",
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
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="WhaleTools" />
        <link rel="apple-touch-icon" href="/yacht-club-logo.png" />
        <link rel="apple-touch-startup-image" href="/yacht-club-logo.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col overflow-x-hidden min-h-screen`}
        style={{ 
          backgroundColor: '#000000' 
        }}
        suppressHydrationWarning
      >
        <Providers>
          <Suspense fallback={null}>
            <LoadingBar />
          </Suspense>
          {children}
          <NotificationToast />
        </Providers>
      </body>
    </html>
  );
}
