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
  title: "Flora Distro | Premium Cannabis Distribution",
  description: "Shop premium cannabis products including flower, concentrates, edibles, vapes, and beverages. Direct from our facilities with next-day regional delivery. Farm Bill compliant.",
  openGraph: {
    title: "Flora Distro | Premium Cannabis Distribution",
    description: "Premium cannabis products with fast shipping. Direct sourcing, volume pricing, always fresh.",
    type: "website",
    siteName: "Flora Distro",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flora Distro | Premium Cannabis Distribution",
    description: "Premium cannabis products with fast shipping.",
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
