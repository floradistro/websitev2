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
    <footer className="bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href={getHref(`${basePath}/about`)} className="text-white/60 hover:text-white transition-colors text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link href={getHref(`${basePath}/contact`)} className="text-white/60 hover:text-white transition-colors text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Shop</h3>
            <ul className="space-y-3">
              <li>
                <Link href={getHref(`${basePath}/shop`)} className="text-white/60 hover:text-white transition-colors text-sm">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href={getHref(`${basePath}/shipping`)} className="text-white/60 hover:text-white transition-colors text-sm">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href={getHref(`${basePath}/returns`)} className="text-white/60 hover:text-white transition-colors text-sm">
                  Returns
                </Link>
              </li>
              <li>
                <Link href={getHref(`${basePath}/faq`)} className="text-white/60 hover:text-white transition-colors text-sm">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href={getHref(`${basePath}/privacy`)} className="text-white/60 hover:text-white transition-colors text-sm">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href={getHref(`${basePath}/terms`)} className="text-white/60 hover:text-white transition-colors text-sm">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-sm text-white/40 text-center font-light">
            © {currentYear} {vendor.store_name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

