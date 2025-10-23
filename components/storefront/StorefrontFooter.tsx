import Link from 'next/link';
import { VendorStorefront } from '@/lib/storefront/get-vendor';
import { Instagram, Facebook, Twitter } from 'lucide-react';

interface StorefrontFooterProps {
  vendor: VendorStorefront;
}

export function StorefrontFooter({ vendor }: StorefrontFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="font-bold text-lg mb-4">{vendor.store_name}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              {vendor.store_tagline || 'Premium cannabis products delivered to your door.'}
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shop" className="text-gray-600 hover:text-gray-900">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/shop?category=flower" className="text-gray-600 hover:text-gray-900">
                  Flower
                </Link>
              </li>
              <li>
                <Link href="/shop?category=edibles" className="text-gray-600 hover:text-gray-900">
                  Edibles
                </Link>
              </li>
              <li>
                <Link href="/shop?category=concentrates" className="text-gray-600 hover:text-gray-900">
                  Concentrates
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-gray-900">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-gray-600 hover:text-gray-900">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link href="/returns" className="text-gray-600 hover:text-gray-900">
                  Returns Policy
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-gray-900">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-gray-900">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-gray-600 hover:text-gray-900">
                  Cookie Policy
                </Link>
              </li>
            </ul>

            {/* Social Links */}
            {vendor.social_links && (
              <div className="mt-6 flex gap-4">
                {vendor.social_links.instagram && (
                  <a 
                    href={vendor.social_links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Instagram size={20} />
                  </a>
                )}
                {vendor.social_links.facebook && (
                  <a 
                    href={vendor.social_links.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Facebook size={20} />
                  </a>
                )}
                {vendor.social_links.twitter && (
                  <a 
                    href={vendor.social_links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    <Twitter size={20} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">
            © {currentYear} {vendor.store_name}. All rights reserved.
          </p>
          <p className="text-gray-500 text-xs">
            Powered by Yacht Club
          </p>
        </div>
      </div>
    </footer>
  );
}

