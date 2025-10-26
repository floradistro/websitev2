// @ts-nocheck
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
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-black">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 sm:p-12 md:p-16">
          {/* Headline */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-6 uppercase tracking-tight" style={{ fontWeight: 900 }}>
            {content.headline}
          </h2>
          
          {/* Story Paragraphs */}
          <div className="space-y-4 mb-8">
            {content.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto">
                {paragraph}
              </p>
            ))}
          </div>
          
          {/* CTA */}
          {content.cta_text && content.cta_link && (
            <a 
              href={`${basePath}${content.cta_link}`} 
              className="inline-flex items-center gap-2 text-white text-sm uppercase tracking-[0.12em] hover:text-white/70 transition-colors font-black"
              style={{ fontWeight: 900 }}
            >
              <span>{content.cta_text}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
