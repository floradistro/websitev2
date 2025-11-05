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
  // Ensure content exists
  if (!content || !content.steps || !Array.isArray(content.steps)) {
    return null;
  }

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 bg-black">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 sm:p-12 md:p-16">
          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6 tracking-tight uppercase text-center" style={{ fontWeight: 900 }}>
            {content.headline}
          </h2>
          
          {/* Subheadline */}
          {content.subheadline && (
            <p className="text-base sm:text-lg text-white/60 mb-10 sm:mb-12 text-center max-w-2xl mx-auto">
              {content.subheadline}
            </p>
          )}
          
          {/* Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {content.steps.map((step, index) => {
              const IconComponent = iconMap[step.icon as keyof typeof iconMap] || Package;
              const stepTitle = typeof step.title === 'string' ? step.title : 'Step';
              const stepDesc = typeof step.description === 'string' ? step.description : '';
              
              return (
                <div
                  key={index}
                  className="text-center"
                >
                  {/* Icon */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-white" strokeWidth={2} />
                  </div>
                  
                  {/* Title */}
                  <div className="text-xs sm:text-sm uppercase tracking-[0.12em] font-black text-white mb-2" style={{ fontWeight: 900 }}>
                    {stepTitle}
                  </div>
                  
                  {/* Description */}
                  {stepDesc && (
                    <div className="text-xs sm:text-sm text-white/60">
                      {stepDesc}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
