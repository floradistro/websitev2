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
        {content.footer_links && content.footer_links.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {content.footer_links.map((link: any, idx: number) => (
              <div key={idx}>
                <Link 
                  href={`${basePath}${link.url}`}
                  className="text-white/60 hover:text-white transition-colors text-sm"
                >
                  {link.title}
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Compliance Text */}
        {(content.compliance_text || content.restricted_states) && (
          <div className="mb-6 pb-6 border-b border-white/10">
            {content.compliance_text && (
              <p className="text-white/40 text-xs mb-2">{content.compliance_text}</p>
            )}
            {content.restricted_states && (
              <p className="text-white/40 text-xs">{content.restricted_states}</p>
            )}
          </div>
        )}

        {/* Copyright */}
        <div className="text-center">
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

