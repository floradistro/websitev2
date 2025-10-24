/**
 * Default Template - Footer Component
 * Simple, clean footer design for vendors without a specific template
 */

'use client';

import Link from 'next/link';
import { VendorStorefront } from '@/lib/storefront/get-vendor';
import { usePathname, useSearchParams } from 'next/navigation';

interface FooterProps {
  vendor: VendorStorefront;
}

export default function Footer({ vendor }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const basePath = pathname?.startsWith('/storefront') ? '/storefront' : '';
  const vendorParam = searchParams?.get('vendor');
  
  const getHref = (path: string) => {
    if (vendorParam && path.startsWith('/storefront')) {
      return `${path}${path.includes('?') ? '&' : '?'}vendor=${vendorParam}`;
    }
    return path;
  };

  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href={getHref(`${basePath}/about`)} className="text-gray-600 hover:text-gray-900">
                  About
                </Link>
              </li>
              <li>
                <Link href={getHref(`${basePath}/contact`)} className="text-gray-600 hover:text-gray-900">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link href={getHref(`${basePath}/shop`)} className="text-gray-600 hover:text-gray-900">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href={getHref(`${basePath}/shipping`)} className="text-gray-600 hover:text-gray-900">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href={getHref(`${basePath}/returns`)} className="text-gray-600 hover:text-gray-900">
                  Returns
                </Link>
              </li>
              <li>
                <Link href={getHref(`${basePath}/faq`)} className="text-gray-600 hover:text-gray-900">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href={getHref(`${basePath}/privacy`)} className="text-gray-600 hover:text-gray-900">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href={getHref(`${basePath}/terms`)} className="text-gray-600 hover:text-gray-900">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            © {currentYear} {vendor.store_name}. All rights reserved. Powered by Yacht Club.
          </p>
        </div>
      </div>
    </footer>
  );
}

