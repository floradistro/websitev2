// @ts-nocheck
"use client";

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface HeroSectionProps {
  content: {
    headline: string;
    subheadline: string;
    cta_primary?: { text: string; link: string };
    cta_secondary?: { text: string; link: string };
    background_type?: 'animation' | 'image' | 'video' | 'none';
    background_image?: string;
  };
  templateStyle?: 'minimalist' | 'luxury' | 'bold' | 'organic';
  basePath?: string;
  vendor?: any;
}

export function HeroSection({ content, templateStyle = 'minimalist', basePath = '', vendor }: HeroSectionProps) {
  return (
    <section className="pt-32 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6 bg-black">
      <div className="max-w-5xl mx-auto text-center">
        {/* Logo */}
        {vendor?.logo_url && (
          <div className="mb-8 sm:mb-12 flex justify-center">
            <div className="w-40 h-40 sm:w-64 sm:h-64 md:w-80 md:h-80 relative opacity-80">
              <Image 
                src={vendor.logo_url} 
                alt={vendor.store_name || 'Store'}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        )}
        
        {/* Headline */}
        <h1 
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black mb-6 sm:mb-8 tracking-tight leading-[0.9] uppercase"
          style={{ fontWeight: 900 }}
        >
          {content.headline.split(' ').map((word, i, arr) => (
            <span key={i}>
              {word}
              {i < arr.length - 1 && <br className="hidden sm:block" />}
              {i < arr.length - 1 && ' '}
            </span>
          ))}
        </h1>
        
        {/* Divider */}
        <div className="h-[1px] w-20 sm:w-32 bg-white/10 mx-auto mb-8 sm:mb-12" />
        
        {/* Subheadline */}
        <p className="text-lg sm:text-xl md:text-2xl text-white/60 font-normal leading-relaxed max-w-2xl mx-auto mb-12 sm:mb-16 px-4">
          {content.subheadline}
        </p>
        
        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          {content.cta_primary && (
            <Link 
              href={`${basePath}${content.cta_primary.link}`}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-xs uppercase tracking-[0.08em] hover:bg-white/90 font-black transition-all hover:scale-105"
              style={{ fontWeight: 900 }}
            >
              <span>{content.cta_primary.text}</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
          {content.cta_secondary && (
            <Link 
              href={`${basePath}${content.cta_secondary.link}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-transparent border border-white/10 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-xs uppercase tracking-[0.08em] hover:bg-white/5 hover:border-white/20 font-black transition-all hover:scale-105"
              style={{ fontWeight: 900 }}
            >
              <span>{content.cta_secondary.text}</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
