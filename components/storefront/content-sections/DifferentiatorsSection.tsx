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
  const styles = {
    minimalist: {
      container: 'py-16 bg-[#0a0a0a]',
      headline: 'text-3xl md:text-4xl font-light text-white mb-12',
      grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8',
      item: 'space-y-2',
      title: 'text-white font-medium text-lg',
      description: 'text-white/50 text-sm leading-relaxed',
    },
    luxury: {
      container: 'py-24 bg-neutral-900',
      headline: 'text-4xl md:text-5xl font-serif font-light text-amber-100 mb-16 text-center',
      grid: 'grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto',
      item: 'p-8 bg-gradient-to-br from-amber-950/30 to-transparent border border-amber-500/10 rounded-lg',
      title: 'text-amber-100 font-serif text-2xl mb-4',
      description: 'text-amber-200/60 leading-relaxed',
    },
    bold: {
      container: 'py-20 bg-gradient-to-br from-purple-900 to-pink-900',
      headline: 'text-5xl md:text-6xl font-black text-white mb-16 text-center',
      grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6',
      item: 'p-6 bg-white/10 backdrop-blur border-2 border-white/20 rounded-2xl hover:scale-105 transition-transform',
      title: 'text-white font-black text-xl mb-3 uppercase',
      description: 'text-white/80 font-medium',
    },
    organic: {
      container: 'py-24 bg-emerald-950',
      headline: 'text-4xl md:text-5xl font-light text-green-100 mb-14 text-center',
      grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8',
      item: 'p-6 bg-green-900/20 rounded-3xl border border-green-500/10',
      title: 'text-green-100 font-medium text-lg mb-2',
      description: 'text-green-200/60 text-sm leading-relaxed',
    },
  };

  const style = styles[templateStyle];

  return (
    <div className={style.container}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <h2 className={style.headline}>{content.headline}</h2>
        <div className={style.grid}>
          {content.items.map((item, index) => (
            <div key={index} className={style.item}>
              <h3 className={style.title}>{item.title}</h3>
              <p className={style.description}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

