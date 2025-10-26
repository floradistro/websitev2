// @ts-nocheck
"use client";

interface Stat {
  number: string;
  label: string;
}

interface StatsSectionProps {
  content: {
    stats: Stat[];
  };
  templateStyle?: 'minimalist' | 'luxury' | 'bold' | 'organic';
}

export function StatsSection({ content, templateStyle = 'minimalist' }: StatsSectionProps) {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-black border-y border-white/5">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {content.stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-2" style={{ fontWeight: 900 }}>
                {stat.number}
              </div>
              <div className="text-xs sm:text-sm text-white/40 uppercase tracking-[0.12em] font-black" style={{ fontWeight: 900 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
