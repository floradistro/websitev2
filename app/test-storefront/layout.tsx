import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WishlistProvider } from "@/context/WishlistContext";
import LoadingBar from "@/components/LoadingBar";
import NotificationToast from "@/components/NotificationToast";
import Providers from "@/app/providers";
import '@/app/globals.css';
import '@/app/storefront/storefront.css';
import { StorefrontTestHeader } from "@/components/storefront/StorefrontTestHeader";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";
import { getServiceSupabase } from '@/lib/supabase/client';

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

export const dynamic = 'force-dynamic';

export default async function TestStorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = getServiceSupabase();
  
  // Get Flora Distro vendor for header/footer
  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('slug', 'flora-distro')
    .single();

  if (!vendor) {
    return (
      <html lang="en">
        <body>
          <div>Vendor not found</div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" data-scroll-behavior="smooth" className="overflow-x-hidden" suppressHydrationWarning>
      <head>
        <title>{vendor.store_name} - Premium Cannabis</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ backgroundColor: '#1a1a1a', minHeight: '100vh' }}
        suppressHydrationWarning
      >
        <Providers>
          <LoadingBar />
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <StorefrontTestHeader vendor={vendor} />
                {children}
                <StorefrontFooter vendor={vendor} />
                <NotificationToast />
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}

