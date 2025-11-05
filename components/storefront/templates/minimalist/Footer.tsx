'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { VendorStorefront } from '@/lib/storefront/get-vendor';
import { Instagram, Facebook, Twitter, Mail } from 'lucide-react';

interface StorefrontFooterProps {
  vendor: VendorStorefront;
}

function StorefrontFooter({ vendor }: StorefrontFooterProps) {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Determine base path based on current path
  const basePath = pathname?.startsWith('/storefront') ? '/storefront' : '';
  
  // Preserve vendor query param for local testing
  const vendorParam = searchParams?.get('vendor');
  const getHref = (path: string) => {
    if (vendorParam && path.startsWith('/storefront')) {
      return `${path}${path.includes('?') ? '&' : '?'}vendor=${vendorParam}`;
    }
    return path;
  };

  return (
    <footer className="relative border-t border-white/10 bg-black/70 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Company */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-4 text-white/80">Company</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href={getHref(`${basePath}/about`)} className="text-neutral-400 hover:text-white transition-colors font-light">
                  About
                </Link>
              </li>
              <li>
                <Link href={getHref(`${basePath}/contact`)} className="text-neutral-400 hover:text-white transition-colors font-light">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-4 text-white/80">Shop</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href={getHref(`${basePath}/shop`)} className="text-neutral-400 hover:text-white transition-colors font-light">
                  All Products
                </Link>
              </li>
              <li>
                <Link href={vendorParam ? `${basePath}/shop?vendor=${vendorParam}&category=flower` : `${basePath}/shop?category=flower`} className="text-neutral-400 hover:text-white transition-colors font-light">
                  Flower
                </Link>
              </li>
              <li>
                <Link href={vendorParam ? `${basePath}/shop?vendor=${vendorParam}&category=concentrate` : `${basePath}/shop?category=concentrate`} className="text-neutral-400 hover:text-white transition-colors font-light">
                  Concentrate
                </Link>
              </li>
              <li>
                <Link href={vendorParam ? `${basePath}/shop?vendor=${vendorParam}&category=edibles` : `${basePath}/shop?category=edibles`} className="text-neutral-400 hover:text-white transition-colors font-light">
                  Edibles
                </Link>
              </li>
              <li>
                <Link href={vendorParam ? `${basePath}/shop?vendor=${vendorParam}&category=vape` : `${basePath}/shop?category=vape`} className="text-neutral-400 hover:text-white transition-colors font-light">
                  Vape
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-4 text-white/80">Support</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href={getHref(`${basePath}/shipping`)} className="text-neutral-400 hover:text-white transition-colors font-light">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href={getHref(`${basePath}/returns`)} className="text-neutral-400 hover:text-white transition-colors font-light">
                  Returns
                </Link>
              </li>
              <li>
                <Link href={getHref(`${basePath}/faq`)} className="text-neutral-400 hover:text-white transition-colors font-light">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href={getHref(`${basePath}/lab-results`)} className="text-neutral-400 hover:text-white transition-colors font-light">
                  Lab Results
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-4 text-white/80">Legal</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href={getHref(`${basePath}/privacy`)} className="text-neutral-400 hover:text-white transition-colors font-light">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href={getHref(`${basePath}/terms`)} className="text-neutral-400 hover:text-white transition-colors font-light">
                  Terms
                </Link>
              </li>
              <li>
                <Link href={getHref(`${basePath}/cookies`)} className="text-neutral-400 hover:text-white transition-colors font-light">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Compliance */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="space-y-3 max-w-5xl">
            <p className="text-xs text-white/40 leading-relaxed font-light">
              All products contain less than 0.3% hemp-derived Delta-9 THC in compliance with the 2018 Farm Bill.
            </p>
            <p className="text-xs text-white/40 leading-relaxed font-light">
              Products are not available for shipment to the following states: Arkansas, Hawaii, Idaho, Kansas, Louisiana, Oklahoma, Oregon, Rhode Island, Utah, Vermont.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/50 font-light">
            © {currentYear} {vendor.store_name}. All rights reserved.
          </p>
          
          {/* Social Links */}
          {vendor.social_links && (
            <div className="flex items-center gap-4">
              {vendor.social_links.instagram && (
                <a 
                  href={vendor.social_links.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-white transition-colors"
                >
                  <Instagram size={18} />
                </a>
              )}
              {vendor.social_links.facebook && (
                <a 
                  href={vendor.social_links.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-white transition-colors"
                >
                  <Facebook size={18} />
                </a>
              )}
              {vendor.social_links.twitter && (
                <a 
                  href={vendor.social_links.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/50 hover:text-white transition-colors"
                >
                  <Twitter size={18} />
                </a>
              )}
            </div>
          )}
          
          <p className="text-xs text-white/30 font-light tracking-wide">
            Powered by Yacht Club
          </p>
        </div>
      </div>
    </footer>
  );
}

export default StorefrontFooter;

