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
  // Check if template preview mode (blank slate)
  const headersList = await headers();
  const tenantType = headersList.get('x-tenant-type');
  
  // If template preview, just pass children (no vendor required)
  if (tenantType === 'template-preview') {
    return <>{children}</>;
  }
  
  // For vendor mode, validate vendor exists
  const vendorId = await getVendorFromHeaders();

  if (!vendorId) {
    notFound();
  }

  const vendor = await getVendorStorefront(vendorId);

  if (!vendor) {
    notFound();
  }

  // Root layout handles vendor html/body rendering
  // This layout just passes through children
  return <>{children}</>;
}

