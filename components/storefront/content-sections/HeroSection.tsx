// @ts-nocheck
"use client";

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';

const HeroAnimation = dynamic(() => import('@/components/storefront/HeroAnimation'), { ssr: false });

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
}

export function HeroSection({ content, templateStyle = 'minimalist', basePath = '' }: HeroSectionProps) {
  const showAnimation = content.background_type === 'animation';
  const backgroundColor = content.background_color || '#000000';
  const textColor = content.text_color || '#FFFFFF';
  const overlayOpacity = content.overlay_opacity !== undefined ? content.overlay_opacity : 0.6;

  // Template-specific styling
  const styles = {
    minimalist: {
      container: 'relative min-h-[80vh] flex items-center justify-center px-4 sm:px-6 py-20 overflow-hidden bg-black',
      content: 'relative z-10 max-w-5xl mx-auto text-center',
      headline: 'text-4xl sm:text-6xl md:text-8xl lg:text-[120px] font-bold text-white mb-6 sm:mb-8 leading-[0.95] tracking-[-0.04em] uppercase',
      subheadline: 'text-sm sm:text-lg md:text-xl text-neutral-400 leading-relaxed mb-8 sm:mb-12 max-w-xl mx-auto font-medium tracking-wide px-4',
      buttonPrimary: 'inline-flex items-center gap-2 sm:gap-3 bg-white text-black px-6 py-3 sm:px-10 sm:py-5 rounded-full text-sm sm:text-base font-bold uppercase tracking-wider hover:bg-neutral-100 transition-all duration-300 shadow-2xl shadow-white/20 hover:shadow-white/30',
      buttonSecondary: 'inline-flex items-center gap-2 sm:gap-2.5 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black px-6 py-3 sm:px-10 sm:py-5 rounded-full text-sm sm:text-base font-bold uppercase tracking-wider transition-all duration-300',
    },
    luxury: {
      container: 'relative bg-gradient-to-b from-black via-neutral-900 to-black py-32 md:py-40',
      content: 'relative z-10 max-w-5xl',
      headline: 'text-6xl md:text-8xl lg:text-9xl font-serif font-light text-white mb-8 leading-[0.85] tracking-tight',
      subheadline: 'text-xl md:text-2xl text-amber-200/80 mb-12 max-w-2xl font-light italic',
      buttonPrimary: 'inline-flex items-center gap-3 bg-gradient-to-r from-amber-600 to-amber-500 text-black px-10 py-5 text-sm uppercase tracking-widest hover:from-amber-500 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/20',
      buttonSecondary: 'inline-flex items-center gap-3 border-2 border-amber-500/50 text-amber-200 px-10 py-5 text-sm uppercase tracking-widest hover:border-amber-400 hover:bg-amber-500/10 transition-all',
    },
    bold: {
      container: 'relative bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 py-28 md:py-36',
      content: 'relative z-10 max-w-4xl',
      headline: 'text-6xl md:text-8xl lg:text-9xl font-black text-white mb-6 leading-[0.9] tracking-tighter',
      subheadline: 'text-2xl md:text-3xl text-white/90 mb-12 max-w-2xl font-bold',
      buttonPrimary: 'inline-flex items-center gap-3 bg-white text-black px-10 py-5 text-base font-black uppercase tracking-wider hover:scale-105 transition-transform shadow-2xl',
      buttonSecondary: 'inline-flex items-center gap-3 border-4 border-white text-white px-10 py-5 text-base font-black uppercase tracking-wider hover:bg-white hover:text-black transition-all',
    },
    organic: {
      container: 'relative bg-gradient-to-b from-green-950 via-emerald-900 to-teal-950 py-28 md:py-36',
      content: 'relative z-10 max-w-4xl',
      headline: 'text-5xl md:text-7xl lg:text-8xl font-light text-green-50 mb-6 leading-[0.95] tracking-wide',
      subheadline: 'text-lg md:text-xl text-green-200/80 mb-10 max-w-2xl',
      buttonPrimary: 'inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-full text-sm uppercase tracking-wider hover:bg-green-500 transition-all shadow-lg',
      buttonSecondary: 'inline-flex items-center gap-2 border-2 border-green-400/50 text-green-200 px-8 py-4 rounded-full text-sm uppercase tracking-wider hover:border-green-300 hover:bg-green-500/10 transition-all',
    },
  };

  const style = styles[templateStyle];

  return (
    <div className={style.container} style={{ backgroundColor }}>
      {showAnimation && <HeroAnimation />}
      
      <div 
        className="absolute inset-0 backdrop-blur-xl" 
        style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
      />
      
      <div className={style.content} style={{ color: textColor }}>
        {/* Render custom badge if vendor added it */}
        {content.promotional_badge && (
          <div className="absolute top-4 right-4 bg-white text-black px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider animate-pulse">
            {content.promotional_badge}
          </div>
        )}

        {/* Render custom video background if vendor added it */}
        {content.video_background && (
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover -z-10"
          >
            <source src={content.video_background} type="video/mp4" />
          </video>
        )}
        
        <h1 className={style.headline}>
          {typeof content.headline === 'string' ? content.headline : 'Welcome'}
        </h1>
        <p className={style.subheadline}>
          {typeof content.subheadline === 'string' ? content.subheadline : ''}
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto px-4 sm:px-0">
          {content.cta_primary && (
            <Link 
              href={`${basePath}${content.cta_primary.link}`}
              className={style.buttonPrimary}
            >
              <span>{content.cta_primary.text}</span>
              <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
          {content.cta_secondary && (
            <Link 
              href={`${basePath}${content.cta_secondary.link}`}
              className={style.buttonSecondary}
            >
              <span>{content.cta_secondary.text}</span>
            </Link>
          )}
        </div>

        {/* Render custom fields - only display-friendly values */}
        {Object.entries(content).map(([key, value]) => {
          // Skip known base fields and empty values
          const baseFields = ['headline', 'subheadline', 'cta_primary', 'cta_secondary', 'background_color', 'text_color', 'background_type', 'overlay_opacity', 'promotional_badge', 'video_background'];
          if (baseFields.includes(key) || !value) return null;
          
          // Skip array fields (category IDs, product IDs)
          if (Array.isArray(value)) return null;
          
          // Skip object fields
          if (typeof value === 'object' && value !== null) return null;
          
          // Skip UUID-like strings (they're IDs, not display content)
          if (typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
            return null;
          }
          
          // Skip if field key is just a number (likely auto-generated)
          if (/^\d+$/.test(key)) return null;
          
          // Skip if field KEY itself is a UUID
          if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key)) return null;
          
          // Only render simple custom fields with meaningful values
          return (
            <div key={key} className="mt-4 text-sm text-white/80 bg-white/10 backdrop-blur px-4 py-2 rounded">
              <span className="font-semibold">Custom: </span>
              {String(value)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

