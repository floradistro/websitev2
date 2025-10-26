"use client";

/**
 * Smart Component: SmartHero
 * Auto-wired hero section with vendor logo, name, and tagline
 * Replaces atomic components (image, text, button) with intelligent component
 */

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { 
  SmartComponentWrapper, 
  SmartComponentBaseProps,
  SmartTypography,
  useScrollAnimation
} from '@/lib/smart-component-base';
import { motion } from 'framer-motion';

export interface SmartHeroProps extends SmartComponentBaseProps {
  headline?: string; // Optional override (defaults to vendor name)
  tagline?: string;
  ctaText?: string;
  ctaLink?: string;
  showLogo?: boolean;
  animate?: boolean;
  className?: string;
}

export function SmartHero({
  vendorId,
  vendorName,
  vendorLogo,
  headline,
  tagline = "Premium cannabis delivered fast and discreet",
  ctaText = "SHOP NOW",
  ctaLink = "/shop",
  showLogo = true,
  animate = true,
  className = ''
}: SmartHeroProps) {
  const { ref, inView } = useScrollAnimation();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const basePath = pathname?.startsWith('/storefront') ? '/storefront' : '';
  const vendorParam = searchParams?.get('vendor');
  
  const getHref = (path: string) => {
    const fullPath = path.startsWith('/') ? `${basePath}${path}` : path;
    if (vendorParam && fullPath.startsWith('/storefront')) {
      return `${fullPath}${fullPath.includes('?') ? '&' : '?'}vendor=${vendorParam}`;
    }
    return fullPath;
  };

  const displayHeadline = headline || vendorName?.toUpperCase() || 'WELCOME';

  return (
    <SmartComponentWrapper 
      animate={false} 
      componentName="Hero"
      className={className}
    >
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Vendor Logo */}
            {showLogo && vendorLogo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="mb-8 sm:mb-12 flex justify-center"
              >
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48">
                  {/* Animated glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-white/5 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                  <div className="absolute inset-0 bg-gradient-to-tl from-white/10 to-transparent rounded-full blur-2xl animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                  
                  {/* Logo */}
                  <Image 
                    src={vendorLogo} 
                    alt={vendorName || 'Vendor'}
                    fill
                    priority
                    className="relative object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </motion.div>
            )}

            {/* Headline (Vendor Name) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <SmartTypography.Headline className="mb-6">
                {displayHeadline}
              </SmartTypography.Headline>
            </motion.div>

            {/* Tagline */}
            {tagline && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-base sm:text-lg md:text-xl text-white/60 mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed"
              >
                {tagline}
              </motion.p>
            )}

            {/* CTA Button */}
            {ctaText && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  href={getHref(ctaLink)}
                  className="inline-block px-8 sm:px-10 py-3 sm:py-4 bg-white text-black rounded-2xl font-black uppercase tracking-[0.08em] text-xs sm:text-sm hover:bg-white/90 transition-all duration-300 hover:scale-105 shadow-xl"
                  style={{ fontWeight: 900 }}
                >
                  {ctaText}
                </Link>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>
    </SmartComponentWrapper>
  );
}

