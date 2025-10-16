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
  metadataBase: new URL('https://floradistro.com'),
  title: {
    default: "Flora Distro | Premium Cannabis Distribution",
    template: "%s | Flora Distro",
  },
  description: "Shop premium cannabis products including flower, concentrates, edibles, vapes, and beverages. Direct from our facilities with next-day regional delivery. Farm Bill compliant.",
  applicationName: "Flora Distro",
  authors: [{ name: "Flora Distro" }],
  generator: "Next.js",
  keywords: ["cannabis", "hemp", "Delta-9 THC", "flower", "concentrates", "edibles", "vapes", "CBD", "North Carolina", "Tennessee", "Blowing Rock", "Charlotte", "Salisbury", "Elizabethton"],
  referrer: "origin-when-cross-origin",
  creator: "Flora Distro",
  publisher: "Flora Distro",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://floradistro.com",
    siteName: "Flora Distro",
    title: "Flora Distro | Premium Cannabis Distribution",
    description: "Premium cannabis products with fast shipping. Direct sourcing, volume pricing, always fresh. 5 locations across NC and TN.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flora Distro | Premium Cannabis Distribution",
    description: "Premium cannabis products with fast shipping. Direct sourcing, volume pricing, always fresh.",
    creator: "@floradistro",
    site: "@floradistro",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon?<generated>', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-icon?<generated>', type: 'image/png', sizes: '180x180' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
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
