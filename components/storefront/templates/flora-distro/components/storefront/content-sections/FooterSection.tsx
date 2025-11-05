import Link from 'next/link';
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter } from 'lucide-react';

interface FooterSectionProps {
  content: {
    tagline?: string;
    show_social?: boolean;
    show_links?: boolean;
    custom_links?: Array<{
      text: string;
      url: string;
    }>;
    copyright_text?: string;
  };
  vendor?: any;
  basePath?: string;
}

export function FooterSection({ content, vendor, basePath = '/storefront' }: FooterSectionProps) {
  return (
    <footer className="bg-black border-t border-white/10 py-12 sm:py-16 relative">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 mb-8 sm:mb-12">
          {/* Brand Column */}
          <div>
            {vendor?.logo_url ? (
              <img 
                src={vendor.logo_url} 
                alt={vendor.store_name}
                className="h-10 sm:h-12 w-auto object-contain mb-4"
              />
            ) : (
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">{vendor?.store_name || 'Store'}</h3>
            )}
            {content.tagline && (
              <p className="text-sm sm:text-base text-neutral-400 font-light leading-relaxed">
                {content.tagline}
              </p>
            )}
          </div>

          {/* Quick Links */}
          {content.show_links !== false && (
            <div>
              <h4 className="text-white font-semibold text-sm sm:text-base mb-4 uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2 sm:space-y-3">
                <li>
                  <Link href={`${basePath}`} className="text-neutral-400 hover:text-white text-sm sm:text-base transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href={`${basePath}/shop`} className="text-neutral-400 hover:text-white text-sm sm:text-base transition-colors">
                    Shop
                  </Link>
                </li>
                <li>
                  <Link href={`${basePath}/about`} className="text-neutral-400 hover:text-white text-sm sm:text-base transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href={`${basePath}/contact`} className="text-neutral-400 hover:text-white text-sm sm:text-base transition-colors">
                    Contact
                  </Link>
                </li>
                {content.custom_links?.map((link, index) => (
                  <li key={index}>
                    <Link href={link.url} className="text-neutral-400 hover:text-white text-sm sm:text-base transition-colors">
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact & Social */}
          <div>
            <h4 className="text-white font-semibold text-sm sm:text-base mb-4 uppercase tracking-wider">Connect</h4>
            <div className="space-y-3 mb-6">
              {vendor?.social_links?.email && (
                <div className="flex items-center gap-2 text-neutral-400 text-sm sm:text-base">
                  <Mail size={16} className="flex-shrink-0" />
                  <a href={`mailto:${vendor.social_links.email}`} className="hover:text-white transition-colors break-all">
                    {vendor.social_links.email}
                  </a>
                </div>
              )}
            </div>
            
            {content.show_social !== false && vendor?.social_links && (
              <div className="flex items-center gap-3">
                {vendor.social_links.instagram && (
                  <a 
                    href={vendor.social_links.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 border border-white/20 hover:bg-white hover:border-white flex items-center justify-center transition-all hover:scale-110 group"
                  >
                    <Instagram className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-black transition-colors" />
                  </a>
                )}
                {vendor.social_links.facebook && (
                  <a 
                    href={vendor.social_links.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 border border-white/20 hover:bg-white hover:border-white flex items-center justify-center transition-all hover:scale-110 group"
                  >
                    <Facebook className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-black transition-colors" />
                  </a>
                )}
                {vendor.social_links.twitter && (
                  <a 
                    href={vendor.social_links.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 border border-white/20 hover:bg-white hover:border-white flex items-center justify-center transition-all hover:scale-110 group"
                  >
                    <Twitter className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-black transition-colors" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-6 sm:pt-8">
          <p className="text-neutral-500 text-xs sm:text-sm text-center">
            {content.copyright_text || `© ${new Date().getFullYear()} ${vendor?.store_name || 'Store'}. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  );
}
