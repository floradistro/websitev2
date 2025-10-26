"use client";

/**
 * Smart Component: SmartFeatures
 * Why Choose Us / Trust Badges / Features Section
 * Luxury animated cards with icons + vendor logo
 */

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  Shield, 
  Truck, 
  Award, 
  Sparkles,
  FlaskConical,
  Lock,
  Leaf,
  Star,
  Clock,
  Package,
  CheckCircle2,
  Heart
} from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/animations';

export interface SmartFeaturesProps {
  vendorId: string;
  vendorName?: string;
  vendorLogo?: string;
  headline?: string;
  subheadline?: string;
  features?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  layout?: 'grid' | 'carousel';
  columns?: 2 | 3 | 4;
  animate?: boolean;
  className?: string;
}

// Icon mapping
const iconMap: Record<string, React.ComponentType<any>> = {
  shield: Shield,
  'shield-check': Shield,
  truck: Truck,
  award: Award,
  sparkles: Sparkles,
  flask: FlaskConical,
  'flask-conical': FlaskConical,
  lock: Lock,
  leaf: Leaf,
  star: Star,
  clock: Clock,
  package: Package,
  'check-circle': CheckCircle2,
  check: CheckCircle2,
  heart: Heart,
};

// Default features for cannabis/retail
const defaultFeatures = [
  {
    icon: 'flask-conical',
    title: 'LAB TESTED',
    description: 'Third-party tested for purity and potency'
  },
  {
    icon: 'truck',
    title: 'FAST DELIVERY',
    description: 'Same-day delivery available'
  },
  {
    icon: 'shield',
    title: 'DISCREET',
    description: 'Unmarked, odor-proof packaging'
  },
  {
    icon: 'award',
    title: 'PREMIUM',
    description: 'Curated selection of top-shelf products'
  }
];

export function SmartFeatures({
  vendorId,
  vendorName,
  vendorLogo,
  headline = 'WHY CHOOSE US',
  subheadline,
  features = defaultFeatures,
  layout = 'grid',
  columns = 4,
  animate = true,
  className = '',
}: SmartFeaturesProps) {
  const [isClient, setIsClient] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '-50px'
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  // SSR placeholder
  if (!isClient) {
    return <div className={className} style={{ minHeight: '400px' }} />;
  }

  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`py-16 sm:py-20 px-4 sm:px-6 ${className}`}>
      <div className="max-w-6xl mx-auto">
        {/* Vendor Logo & Headline */}
        {headline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-12 sm:mb-16"
          >
            {/* Animated Vendor Logo */}
            {vendorLogo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="mb-8 flex justify-center"
              >
                <div className="relative w-20 h-20 md:w-24 md:h-24">
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
            
            <h2 
              className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white mb-4"
              style={{ fontWeight: 900 }}
            >
              {headline}
            </h2>
            {subheadline && (
              <p className="text-base sm:text-lg text-white/60 max-w-2xl mx-auto">
                {subheadline}
              </p>
            )}
          </motion.div>
        )}

        {/* Features Grid */}
        <motion.div
          ref={ref}
          variants={animate ? staggerContainer : undefined}
          initial={animate ? "hidden" : undefined}
          animate={animate && inView ? "visible" : undefined}
          className={`grid ${gridCols[columns]} gap-4 sm:gap-6`}
        >
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon.toLowerCase()] || Award;
            
            return (
              <motion.div
                key={index}
                variants={animate ? staggerItem : undefined}
                whileHover={{ 
                  y: -4,
                  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
                }}
                className="group relative bg-[#0a0a0a] border border-white/5 hover:border-white/10 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:bg-[#141414] cursor-default"
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-500" />
                
                <div className="relative z-10">
                  {/* Icon */}
                  <div className="mb-4 sm:mb-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-white/20 group-hover:bg-white/10 transition-all duration-300">
                      <IconComponent 
                        className="w-6 h-6 sm:w-7 sm:h-7 text-white" 
                        strokeWidth={2}
                      />
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 
                    className="text-sm sm:text-base font-black uppercase tracking-[0.15em] text-white mb-2"
                    style={{ fontWeight: 900 }}
                  >
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

