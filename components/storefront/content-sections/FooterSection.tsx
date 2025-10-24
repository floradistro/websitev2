// @ts-nocheck
"use client";

import Link from 'next/link';

interface FooterSectionProps {
  content: {
    compliance_text?: string;
    restricted_states?: string;
    show_powered_by?: boolean;
    custom_footer_text?: string;
    footer_links?: Array<{ title: string; url: string }>;
  };
  vendor?: any;
  basePath?: string;
}

export function FooterSection({ content, vendor, basePath = '' }: FooterSectionProps) {
  const currentYear = new Date().getFullYear();
  const footerText = content.custom_footer_text?.replace('[Store Name]', vendor?.store_name || 'Store') 
    || `© ${currentYear} ${vendor?.store_name || 'Store'}. All rights reserved.`;

  return (
    <footer className="bg-black border-t border-white/10 relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Footer Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Company */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link href={`${basePath}/about`} className="text-white/60 hover:text-white transition-colors text-sm">
                  About
                </Link>
              </li>
              <li>
                <Link href={`${basePath}/contact`} className="text-white/60 hover:text-white transition-colors text-sm">
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
                <Link href={`${basePath}/shop`} className="text-white/60 hover:text-white transition-colors text-sm">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-3">
              {content.footer_links?.map((link: any, idx: number) => (
                <li key={idx}>
                  <Link 
                    href={`${basePath}${link.url}`}
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href={`${basePath}/privacy`} className="text-white/60 hover:text-white transition-colors text-sm">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href={`${basePath}/terms`} className="text-white/60 hover:text-white transition-colors text-sm">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Compliance Text */}
        {(content.compliance_text || content.restricted_states) && (
          <div className="mb-6 pb-6 border-t border-white/10 pt-6">
            {content.compliance_text && (
              <p className="text-white/40 text-xs mb-2">{content.compliance_text}</p>
            )}
            {content.restricted_states && (
              <p className="text-white/40 text-xs">{content.restricted_states}</p>
            )}
          </div>
        )}

        {/* Copyright */}
        <div className="text-center border-t border-white/10 pt-6">
          <p className="text-sm text-white/40 font-light">
            {footerText}
          </p>
          {content.show_powered_by && (
            <p className="text-xs text-white/30 mt-2">
              Powered by Yacht Club
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}

