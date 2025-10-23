import Link from 'next/link';
import { VendorStorefront } from '@/lib/storefront/get-vendor';
import { Instagram, Facebook, Twitter, Mail } from 'lucide-react';

interface StorefrontFooterProps {
  vendor: VendorStorefront;
}

export function StorefrontFooter({ vendor }: StorefrontFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-white/10">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white text-sm uppercase tracking-[0.2em] mb-4 font-normal">{vendor.store_name}</h3>
            <p className="text-white/50 text-xs font-light leading-relaxed">
              {vendor.store_tagline || 'Premium cannabis products'}
            </p>
            
            {/* Social Links */}
            {vendor.social_links && (
              <div className="mt-6 flex gap-4">
                {vendor.social_links.instagram && (
                  <a 
                    href={vendor.social_links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <Instagram size={18} />
                  </a>
                )}
                {vendor.social_links.facebook && (
                  <a 
                    href={vendor.social_links.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <Facebook size={18} />
                  </a>
                )}
                {vendor.social_links.twitter && (
                  <a 
                    href={vendor.social_links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <Twitter size={18} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-white text-sm uppercase tracking-[0.2em] mb-4 font-normal">Shop</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/shop" className="text-white/50 hover:text-white transition-colors font-light">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/shop?category=flower" className="text-white/50 hover:text-white transition-colors font-light">
                  Flower
                </Link>
              </li>
              <li>
                <Link href="/shop?category=concentrates" className="text-white/50 hover:text-white transition-colors font-light">
                  Concentrates
                </Link>
              </li>
              <li>
                <Link href="/shop?category=edibles" className="text-white/50 hover:text-white transition-colors font-light">
                  Edibles
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white text-sm uppercase tracking-[0.2em] mb-4 font-normal">Support</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/contact" className="text-white/50 hover:text-white transition-colors font-light">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-white/50 hover:text-white transition-colors font-light">
                  About Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white text-sm uppercase tracking-[0.2em] mb-4 font-normal">Legal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy" className="text-white/50 hover:text-white transition-colors font-light">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-white/50 hover:text-white transition-colors font-light">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-white/50 hover:text-white transition-colors font-light">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs font-light tracking-wider">
            © {currentYear} {vendor.store_name}. All rights reserved.
          </p>
          <p className="text-white/20 text-[10px] font-light uppercase tracking-[0.2em]">
            Powered by Yacht Club
          </p>
        </div>
      </div>
    </footer>
  );
}

