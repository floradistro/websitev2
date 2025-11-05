// @ts-nocheck
"use client";

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface CTASectionProps {
  content: {
    headline: string;
    description?: string;
    button_text: string;
    button_link: string;
  };
  templateStyle?: 'minimalist' | 'luxury' | 'bold' | 'organic';
  basePath?: string;
}

export function CTASection({ content, templateStyle = 'minimalist', basePath = '' }: CTASectionProps) {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-black">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 sm:p-12 md:p-16">
          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mb-6 sm:mb-8 uppercase tracking-tight leading-tight" style={{ fontWeight: 900 }}>
            {content.headline}
          </h2>
          
          {/* Description */}
          {content.description && (
            <p className="text-base sm:text-lg text-white/60 mb-8 sm:mb-12 max-w-2xl mx-auto">
              {content.description}
            </p>
          )}
          
          {/* CTA Button */}
          <Link 
            href={`${basePath}${content.button_link}`} 
            className="group inline-flex items-center justify-center gap-3 bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-2xl text-xs uppercase tracking-[0.08em] hover:bg-white/90 font-black transition-all hover:scale-105"
            style={{ fontWeight: 900 }}
          >
            <span>{content.button_text}</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
