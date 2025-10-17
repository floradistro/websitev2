import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import { CartProvider } from "@/context/CartContext";
// import { RecentlyViewedProvider } from "@/context/RecentlyViewedContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: "Flora Distro | Premium Cannabis Distribution",
  description: "Shop premium cannabis products including flower, concentrates, edibles, vapes, and beverages. Direct from our facilities with next-day regional delivery. Farm Bill compliant.",
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
        {/* Preconnect to WordPress API for faster requests */}
        <link rel="preconnect" href="https://api.floradistro.com" />
        <link rel="dns-prefetch" href="https://api.floradistro.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        suppressHydrationWarning
      >
        <CartProvider>
          {/* <RecentlyViewedProvider> */}
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
            <ScrollToTop />
          {/* </RecentlyViewedProvider> */}
        </CartProvider>
      </body>
    </html>
  );
}
