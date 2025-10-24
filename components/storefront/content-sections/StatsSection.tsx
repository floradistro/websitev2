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
  const styles = {
    minimalist: {
      container: 'py-16 bg-black border-y border-white/10',
      grid: 'grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto',
      statNumber: 'text-5xl md:text-6xl font-light text-white mb-2',
      statLabel: 'text-white/40 text-sm uppercase tracking-wider',
    },
    luxury: {
      container: 'py-24 bg-gradient-to-r from-amber-950/50 via-black to-amber-950/50',
      grid: 'grid grid-cols-2 md:grid-cols-4 gap-12 max-w-6xl mx-auto',
      statNumber: 'text-6xl md:text-7xl font-serif font-light text-amber-400 mb-3',
      statLabel: 'text-amber-200/60 text-sm uppercase tracking-widest',
    },
    bold: {
      container: 'py-20 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600',
      grid: 'grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto',
      statNumber: 'text-6xl md:text-8xl font-black text-white mb-2',
      statLabel: 'text-white/90 text-base uppercase tracking-wider font-bold',
    },
    organic: {
      container: 'py-20 bg-green-900/20',
      grid: 'grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto',
      statNumber: 'text-5xl md:text-6xl font-light text-green-400 mb-2',
      statLabel: 'text-green-200/60 text-sm uppercase tracking-wide',
    },
  };

  const style = styles[templateStyle];

  return (
    <div className={style.container}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className={style.grid}>
          {content.stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={style.statNumber}>{stat.number}</div>
              <div className={style.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

