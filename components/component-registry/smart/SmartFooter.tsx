/**
 * Smart Footer Component
 * Fully editable footer with links, social media, and legal sections
 */

"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Instagram, Facebook, Twitter, Mail } from "lucide-react";

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface SmartFooterProps {
  vendorId: string;
  vendorSlug: string;
  vendorName: string;
  vendorLogo?: string;

  // Styling
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;

  // Footer Columns (editable)
  columns?: FooterColumn[];

  // Social Links
  instagramUrl?: string;
  facebookUrl?: string;
  twitterUrl?: string;

  // Legal Compliance Text
  showLegalCompliance?: boolean;
  legalText1?: string;
  legalText2?: string;

  // Bottom Bar
  showCopyright?: boolean;
  copyrightText?: string;
  showPoweredBy?: boolean;
  poweredByText?: string;
}

export function SmartFooter({
  vendorId,
  vendorSlug,
  vendorName,
  vendorLogo,
  backgroundColor = "bg-black",
  textColor = "text-white/60",
  borderColor = "border-white/5",
  columns = [
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Shop",
      links: [
        { label: "All Products", href: "/shop" },
        { label: "Flower", href: "/shop?category=flower" },
        { label: "Concentrate", href: "/shop?category=concentrate" },
        { label: "Edibles", href: "/shop?category=edibles" },
        { label: "Vape", href: "/shop?category=vape" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Shipping", href: "/shipping" },
        { label: "Returns", href: "/returns" },
        { label: "FAQ", href: "/faq" },
        { label: "Lab Results", href: "/lab-results" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
        { label: "Cookies", href: "/cookies" },
      ],
    },
  ],
  instagramUrl,
  facebookUrl,
  twitterUrl,
  showLegalCompliance = true,
  legalText1 = "All products contain less than 0.3% hemp-derived Delta-9 THC in compliance with the 2018 Farm Bill.",
  legalText2 = "Products are not available for shipment to the following states: Arkansas, Hawaii, Idaho, Kansas, Louisiana, Oklahoma, Oregon, Rhode Island, Utah, Vermont.",
  showCopyright = true,
  copyrightText,
  showPoweredBy = true,
  poweredByText = "Powered by Yacht Club",
}: SmartFooterProps) {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const basePath = pathname?.startsWith("/storefront") ? "/storefront" : "";
  const vendorParam = searchParams?.get("vendor");

  const getHref = (path: string) => {
    const fullPath = path.startsWith("/") ? `${basePath}${path}` : path;
    if (vendorParam && fullPath.startsWith("/storefront")) {
      return `${fullPath}${fullPath.includes("?") ? "&" : "?"}vendor=${vendorParam}`;
    }
    return fullPath;
  };

  const hasSocialLinks = instagramUrl || facebookUrl || twitterUrl;

  return (
    <footer className={`relative border-t ${borderColor} ${backgroundColor}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {/* Footer Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          {columns.map((column, colIndex) => (
            <div key={colIndex}>
              <h3
                className="text-[10px] sm:text-xs uppercase tracking-[0.15em] font-black mb-4 sm:mb-6 text-white/40"
                style={{ fontWeight: 900 }}
              >
                {column.title}
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={getHref(link.href)}
                      className="text-xs sm:text-sm text-white/60 hover:text-white transition-colors uppercase tracking-wide font-black"
                      style={{ fontWeight: 900 }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal Compliance */}
        {showLegalCompliance && (legalText1 || legalText2) && (
          <div className={`mt-12 pt-8 border-t ${borderColor}`}>
            <div className="flex items-start justify-between gap-8">
              <div className="max-w-5xl flex-1 bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 space-y-3">
                {legalText1 && (
                  <p className="text-[10px] sm:text-xs text-white/40 leading-relaxed uppercase tracking-wider">
                    {legalText1}
                  </p>
                )}
                {legalText2 && (
                  <p className="text-[10px] sm:text-xs text-white/40 leading-relaxed uppercase tracking-wider">
                    {legalText2}
                  </p>
                )}
              </div>
              {vendorLogo && (
                <div className="flex-shrink-0 hidden md:block">
                  <img
                    src={vendorLogo}
                    alt={vendorName}
                    className="w-24 h-24 object-contain opacity-40 hover:opacity-60 transition-opacity"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Bar */}
        <div
          className={`mt-8 pt-6 border-t ${borderColor} flex flex-col md:flex-row justify-between items-center gap-4`}
        >
          {showCopyright && (
            <p className="text-[10px] sm:text-xs text-white/40 uppercase tracking-[0.15em] font-black">
              {copyrightText ||
                `© ${currentYear} ${vendorName}. All rights reserved.`}
            </p>
          )}

          {/* Social Links */}
          {hasSocialLinks && (
            <div className="flex items-center gap-3">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl bg-[#0a0a0a] border border-white/5 text-white/60 hover:text-white hover:border-white/10 hover:bg-white/5 transition-all"
                  aria-label="Instagram"
                >
                  <Instagram size={16} strokeWidth={2.5} />
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl bg-[#0a0a0a] border border-white/5 text-white/60 hover:text-white hover:border-white/10 hover:bg-white/5 transition-all"
                  aria-label="Facebook"
                >
                  <Facebook size={16} strokeWidth={2.5} />
                </a>
              )}
              {twitterUrl && (
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-2xl bg-[#0a0a0a] border border-white/5 text-white/60 hover:text-white hover:border-white/10 hover:bg-white/5 transition-all"
                  aria-label="Twitter"
                >
                  <Twitter size={16} strokeWidth={2.5} />
                </a>
              )}
            </div>
          )}

          {showPoweredBy && poweredByText && (
            <p className="text-[10px] sm:text-xs text-white/40 uppercase tracking-[0.15em] font-black">
              {poweredByText}
            </p>
          )}
        </div>
      </div>
    </footer>
  );
}
