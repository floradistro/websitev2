"use client";

/**
 * Smart Component: SmartAbout
 * Luxury about page with mission, story, values
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  SmartComponentWrapper, 
  SmartComponentBaseProps,
  SmartTypography,
  SmartContainers,
  useScrollAnimation
} from '@/lib/smart-component-base';
import { Leaf, Award, Heart, Shield } from 'lucide-react';
import Image from 'next/image';

export interface SmartAboutProps extends SmartComponentBaseProps {
  headline?: string;
  subheadline?: string;
  story?: string;
  mission?: string;
  values?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  animate?: boolean;
}

const defaultValues = [
  {
    icon: 'leaf',
    title: 'PREMIUM QUALITY',
    description: 'Hand-selected strains, organic growing practices, and rigorous lab testing ensure only the finest products reach you.'
  },
  {
    icon: 'shield',
    title: 'TRUST & SAFETY',
    description: 'Full transparency with third-party lab results, secure packaging, and compliance with all regulations.'
  },
  {
    icon: 'heart',
    title: 'COMMUNITY FIRST',
    description: 'We prioritize education, wellness, and building lasting relationships with our customers.'
  },
  {
    icon: 'award',
    title: 'EXCELLENCE',
    description: 'Award-winning products, exceptional service, and a commitment to pushing industry standards higher.'
  }
];

const iconMap: Record<string, any> = {
  leaf: Leaf,
  shield: Shield,
  heart: Heart,
  award: Award
};

export function SmartAbout({
  vendorId,
  vendorName,
  vendorLogo,
  headline = "ABOUT US",
  subheadline = "Premium Cannabis, Delivered with Care",
  story = "Founded with a passion for premium cannabis and exceptional service, we've built a reputation for quality, transparency, and community. Every product is carefully selected and tested to ensure you receive nothing but the best.",
  mission = "Our mission is simple: provide access to the highest quality cannabis products with complete transparency, fast delivery, and unmatched customer service. We believe in education, wellness, and elevating the industry standard.",
  values = defaultValues,
  animate = true,
  className = ''
}: SmartAboutProps) {
  const { ref, inView } = useScrollAnimation();

  return (
    <SmartComponentWrapper 
      animate={false}
      componentName="About"
      className={className}
    >
      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6 bg-black">
        <SmartContainers.MaxWidth>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Vendor Logo */}
            {vendorLogo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="mb-12 flex justify-center"
              >
                <div className="relative w-24 h-24 md:w-32 md:h-32">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '3s' }} />
                  <Image 
                    src={vendorLogo} 
                    alt={vendorName || 'Vendor'}
                    fill
                    className="relative object-contain drop-shadow-2xl hover:scale-110 transition-transform duration-500"
                  />
                </div>
              </motion.div>
            )}
            
            <SmartTypography.Headline className="mb-6">
              {headline}
            </SmartTypography.Headline>
            <p className="text-xl sm:text-2xl text-white/60 uppercase tracking-wide">
              {subheadline}
            </p>
          </motion.div>
        </SmartContainers.MaxWidth>
      </section>

      {/* Story Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-black">
        <SmartContainers.MaxWidth>
          <div ref={ref} className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 sm:p-12"
            >
              <h3 
                className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-6"
                style={{ fontWeight: 900 }}
              >
                OUR STORY
              </h3>
              <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-8">
                {story}
              </p>
              
              <div className="h-[1px] bg-white/5 my-8" />
              
              <h3 
                className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-6"
                style={{ fontWeight: 900 }}
              >
                OUR MISSION
              </h3>
              <p className="text-base sm:text-lg text-white/60 leading-relaxed">
                {mission}
              </p>
            </motion.div>
          </div>
        </SmartContainers.MaxWidth>
      </section>

      {/* Values Grid */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-black">
        <SmartContainers.MaxWidth>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-center text-white mb-12"
            style={{ fontWeight: 900 }}
          >
            OUR VALUES
          </motion.h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {values.map((value, index) => {
              const Icon = iconMap[value.icon] || Leaf;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ 
                    duration: 0.6, 
                    delay: 0.1 + index * 0.1, 
                    ease: [0.22, 1, 0.36, 1] 
                  }}
                >
                  <SmartContainers.Card className="p-8 sm:p-10 h-full">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Icon size={24} className="text-white" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1">
                        <h4 
                          className="text-sm sm:text-base font-black uppercase tracking-[0.08em] text-white mb-3"
                          style={{ fontWeight: 900 }}
                        >
                          {value.title}
                        </h4>
                        <p className="text-sm text-white/60 leading-relaxed">
                          {value.description}
                        </p>
                      </div>
                    </div>
                  </SmartContainers.Card>
                </motion.div>
              );
            })}
          </div>
        </SmartContainers.MaxWidth>
      </section>
    </SmartComponentWrapper>
  );
}

