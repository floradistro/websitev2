"use client";

interface AboutStorySectionProps {
  content: {
    headline: string;
    paragraphs: string[];
    cta_text?: string;
    cta_link?: string;
  };
  templateStyle?: 'minimalist' | 'luxury' | 'bold' | 'organic';
  basePath?: string;
}

export function AboutStorySection({ content, templateStyle = 'minimalist', basePath = '' }: AboutStorySectionProps) {
  const backgroundColor = content.background_color || '#000000';
  const textColor = content.text_color || '#FFFFFF';

  const styles = {
    minimalist: {
      container: 'py-20 bg-black relative',
      headline: 'text-4xl md:text-5xl lg:text-6xl font-light text-white mb-10 max-w-4xl text-center mx-auto',
      paragraphContainer: 'max-w-3xl mx-auto mb-10',
      paragraph: 'text-white/60 text-lg mb-6 leading-relaxed text-center',
      ctaContainer: 'text-center',
      cta: 'inline-flex items-center gap-2 text-white border-b border-white/30 hover:border-white transition-all pb-1 text-sm uppercase tracking-[0.2em]',
    },
    luxury: {
      container: 'py-32 bg-gradient-to-b from-black to-neutral-900',
      headline: 'text-5xl md:text-6xl font-serif font-light text-amber-100 mb-12 max-w-4xl',
      paragraph: 'text-amber-200/70 text-xl mb-8 leading-relaxed font-light',
      cta: 'inline-flex items-center gap-3 text-amber-400 border-b-2 border-amber-500/50 hover:border-amber-400 transition-all pb-2 text-base tracking-wide',
    },
    bold: {
      container: 'py-24 bg-gradient-to-r from-indigo-900 to-purple-900',
      headline: 'text-5xl md:text-7xl font-black text-white mb-10 max-w-4xl',
      paragraph: 'text-white/90 text-2xl mb-6 leading-relaxed font-semibold',
      cta: 'inline-flex items-center gap-3 bg-white text-black px-8 py-4 text-lg font-black uppercase tracking-wider hover:scale-105 transition-transform',
    },
    organic: {
      container: 'py-28 bg-gradient-to-b from-teal-950 to-green-950',
      headline: 'text-4xl md:text-6xl font-light text-green-100 mb-10 max-w-4xl',
      paragraph: 'text-green-200/70 text-lg mb-6 leading-relaxed',
      cta: 'inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-full text-sm uppercase tracking-wider hover:bg-green-500 transition-all',
    },
  };

  const style = styles[templateStyle];

  return (
    <div className={style.container} style={{ backgroundColor }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 relative z-10" style={{ color: textColor }}>
        <h2 className={style.headline}>
          {content.headline}
        </h2>
        
        <div className={style.paragraphContainer || 'max-w-3xl mx-auto'}>
          {content.paragraphs.map((paragraph, index) => (
            <p key={index} className={style.paragraph}>
              {paragraph}
            </p>
          ))}
        </div>
        
        {content.cta_text && content.cta_link && (
          <div className={style.ctaContainer || ''}>
            <a href={`${basePath}${content.cta_link}`} className={style.cta}>
              <span>{content.cta_text}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

