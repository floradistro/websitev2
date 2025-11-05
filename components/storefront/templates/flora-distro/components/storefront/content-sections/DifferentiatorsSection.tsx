// @ts-nocheck
"use client";

interface DifferentiatorItem {
  title: string;
  description: string;
}

interface DifferentiatorsSectionProps {
  content: {
    headline: string;
    items: DifferentiatorItem[];
  };
  templateStyle?: 'minimalist' | 'luxury' | 'bold' | 'organic';
}

export function DifferentiatorsSection({ content, templateStyle = 'minimalist' }: DifferentiatorsSectionProps) {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-black">
      <div className="max-w-6xl mx-auto">
        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-12 sm:mb-16 text-center uppercase tracking-tight" style={{ fontWeight: 900 }}>
          {content.headline}
        </h2>
        
        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {content.items.map((item, index) => (
            <div
              key={index}
              className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all hover:-translate-y-1"
            >
              <h3 className="text-sm font-black uppercase tracking-[0.08em] text-white mb-2" style={{ fontWeight: 900 }}>
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
