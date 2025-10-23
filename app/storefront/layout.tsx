import { headers } from 'next/headers';
import { getVendorFromHeaders, getVendorStorefront } from '@/lib/storefront/get-vendor';
import { StorefrontThemeProvider } from '@/components/storefront/ThemeProvider';
import { StorefrontHeader } from '@/components/storefront/StorefrontHeader';
import { StorefrontFooter } from '@/components/storefront/StorefrontFooter';
import { notFound } from 'next/navigation';
import '@/app/globals.css';
import './storefront.css';

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
    <html lang="en">
      <head>
        <title>{vendor.store_name} - Premium Cannabis Marketplace</title>
        <meta name="description" content={vendor.store_description || `Shop premium cannabis products from ${vendor.store_name}`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="storefront-body">
        <StorefrontThemeProvider vendor={vendor}>
          <div className="storefront-container">
            <StorefrontHeader vendor={vendor} />
            <main className="storefront-main">
              {children}
            </main>
            <StorefrontFooter vendor={vendor} />
          </div>
        </StorefrontThemeProvider>
      </body>
    </html>
  );
}

