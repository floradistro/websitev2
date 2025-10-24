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
  const styles = {
    minimalist: {
      container: 'py-20 bg-black border-t border-white/10',
      inner: 'max-w-4xl mx-auto text-center',
      headline: 'text-4xl md:text-5xl font-light text-white mb-4',
      description: 'text-white/60 text-lg mb-8',
      button: 'inline-flex items-center gap-2 bg-white text-black px-8 py-4 text-sm uppercase tracking-[0.2em] hover:bg-white/90 transition-all',
    },
    luxury: {
      container: 'py-32 bg-gradient-to-b from-neutral-900 to-black',
      inner: 'max-w-5xl mx-auto text-center',
      headline: 'text-5xl md:text-7xl font-serif font-light text-amber-100 mb-6',
      description: 'text-amber-200/70 text-xl mb-10 font-light',
      button: 'inline-flex items-center gap-3 bg-gradient-to-r from-amber-600 to-amber-500 text-black px-12 py-5 text-base uppercase tracking-widest hover:from-amber-500 hover:to-amber-400 transition-all shadow-lg shadow-amber-500/20',
    },
    bold: {
      container: 'py-24 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600',
      inner: 'max-w-4xl mx-auto text-center',
      headline: 'text-6xl md:text-8xl font-black text-white mb-6',
      description: 'text-white/90 text-2xl mb-10 font-bold',
      button: 'inline-flex items-center gap-3 bg-white text-black px-12 py-6 text-xl font-black uppercase tracking-wider hover:scale-105 transition-transform shadow-2xl',
    },
    organic: {
      container: 'py-28 bg-gradient-to-b from-green-950 to-teal-950',
      inner: 'max-w-4xl mx-auto text-center',
      headline: 'text-5xl md:text-6xl font-light text-green-100 mb-4',
      description: 'text-green-200/70 text-lg mb-8',
      button: 'inline-flex items-center gap-2 bg-green-600 text-white px-10 py-4 rounded-full text-sm uppercase tracking-wider hover:bg-green-500 transition-all shadow-lg',
    },
  };

  const style = styles[templateStyle];

  return (
    <div className={style.container}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className={style.inner}>
          <h2 className={style.headline}>{content.headline}</h2>
          {content.description && (
            <p className={style.description}>{content.description}</p>
          )}
          <Link href={`${basePath}${content.button_link}`} className={style.button}>
            <span>{content.button_text}</span>
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}

