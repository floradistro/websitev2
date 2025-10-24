// @ts-nocheck
"use client";

import React from 'react';
import { Leaf, FlaskConical, Package, Truck, Shield, Store, Award, Users } from 'lucide-react';

const iconMap = {
  leaf: Leaf,
  flask: FlaskConical,
  package: Package,
  truck: Truck,
  shield: Shield,
  store: Store,
  award: Award,
  users: Users,
};

interface ProcessStep {
  icon: string;
  title: string;
  description: string;
}

interface ProcessSectionProps {
  content: {
    headline: string;
    subheadline: string;
    steps: ProcessStep[];
  };
  templateStyle?: 'minimalist' | 'luxury' | 'bold' | 'organic';
}

export function ProcessSection({ content, templateStyle = 'minimalist' }: ProcessSectionProps) {
  const backgroundColor = content?.background_color || '#0a0a0a';
  const textColor = content?.text_color || '#FFFFFF';
  
  // Ensure content exists
  if (!content || !content.steps || !Array.isArray(content.steps)) {
    return null;
  }

  const styles = {
    minimalist: {
      container: 'py-24 px-6 relative bg-black',
      headline: 'text-4xl md:text-6xl font-light text-white mb-3 text-center tracking-[-0.02em]',
      subheadline: 'text-xl text-neutral-500 mb-20 font-light text-center',
      stepsContainer: 'flex flex-wrap md:flex-nowrap items-center justify-center gap-3 max-w-6xl mx-auto',
      stepCard: 'flex-1 min-w-[140px] bg-transparent border-2 border-white rounded-full px-6 py-8 hover:bg-white hover:text-black transition-all duration-300 hover:scale-105 group flex flex-col items-center justify-center',
      icon: 'w-8 h-8 text-white group-hover:text-black mb-3 transition-colors',
      stepTitle: 'text-xs text-white group-hover:text-black font-bold uppercase tracking-wider transition-colors',
      stepDescription: 'hidden',
      arrow: 'hidden md:block w-5 h-5 text-white/30 flex-shrink-0',
    },
    luxury: {
      container: 'py-32 bg-gradient-to-b from-neutral-900 to-black',
      headline: 'text-5xl md:text-6xl font-serif font-light text-amber-100 mb-4 text-center',
      subheadline: 'text-amber-200/70 text-lg text-center mb-20 italic',
      stepsContainer: 'flex flex-col md:flex-row items-start justify-between max-w-6xl mx-auto gap-12',
      stepCard: 'flex-1 text-center p-8 bg-gradient-to-b from-amber-950/30 to-transparent border border-amber-500/10 rounded-lg',
      icon: 'w-16 h-16 mx-auto mb-6 text-amber-400',
      stepTitle: 'text-amber-100 font-serif text-xl mb-3',
      stepDescription: 'text-amber-200/60 text-sm leading-relaxed',
    },
    bold: {
      container: 'py-24 bg-gradient-to-r from-pink-900 via-purple-900 to-indigo-900',
      headline: 'text-6xl md:text-7xl font-black text-white mb-4 text-center tracking-tight',
      subheadline: 'text-white/90 text-2xl text-center mb-16 font-bold',
      stepsContainer: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto',
      stepCard: 'p-8 bg-white/10 backdrop-blur border-2 border-white/20 rounded-2xl hover:scale-105 transition-transform',
      icon: 'w-16 h-16 mx-auto mb-4 text-white',
      stepTitle: 'text-white font-black text-2xl mb-3 uppercase',
      stepDescription: 'text-white/80 text-base font-medium',
    },
    organic: {
      container: 'py-28 bg-gradient-to-b from-emerald-950 to-teal-950',
      headline: 'text-4xl md:text-5xl font-light text-green-100 mb-3 text-center',
      subheadline: 'text-green-200/70 text-center mb-16',
      stepsContainer: 'grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto',
      stepCard: 'text-center p-6 bg-green-900/20 rounded-3xl border border-green-500/10',
      icon: 'w-14 h-14 mx-auto mb-4 text-green-400',
      stepTitle: 'text-green-100 font-medium mb-2',
      stepDescription: 'text-green-200/60 text-sm',
    },
  };

  const style = styles[templateStyle];

  return (
    <div className={style.container} style={{ backgroundColor }}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-xl" />
      <div className="max-w-4xl mx-auto text-center relative z-10" style={{ color: textColor }}>
        <h2 className={style.headline}>
          {typeof content.headline === 'string' ? content.headline : 'How It Works'}
        </h2>
        <p className={style.subheadline}>
          {typeof content.subheadline === 'string' ? content.subheadline : ''}
        </p>
        
        <div className={style.stepsContainer}>
          {content.steps.map((step, index) => {
            const IconComponent = iconMap[step.icon as keyof typeof iconMap] || Package;
            // Ensure step.title is a string
            const stepTitle = typeof step.title === 'string' ? step.title : 'Step';
            return (
              <React.Fragment key={index}>
                <div className={style.stepCard}>
                  <IconComponent className={style.icon} strokeWidth={2.5} />
                  <div className={style.stepTitle}>{stepTitle}</div>
                </div>
                {index < content.steps.length - 1 && templateStyle === 'minimalist' && (
                  <svg className={style.arrow} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

