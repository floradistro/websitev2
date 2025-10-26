"use client";

/**
 * Smart Component: SmartReturns
 * Return policy and process
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
import { RotateCcw, CheckCircle, Clock, Mail } from 'lucide-react';
import Image from 'next/image';

export interface SmartReturnsProps extends SmartComponentBaseProps {
  headline?: string;
  subheadline?: string;
  animate?: boolean;
}

const returnSteps = [
  {
    icon: Mail,
    title: 'CONTACT US',
    description: 'Reach out within 24 hours of delivery with your order number and reason for return.',
    timeframe: 'Within 24 hours'
  },
  {
    icon: CheckCircle,
    title: 'APPROVAL',
    description: 'Our team will review your request and respond within 2 business hours.',
    timeframe: '2 hours response'
  },
  {
    icon: RotateCcw,
    title: 'RETURN OR REPLACE',
    description: 'Choose between a full refund or product replacement based on availability.',
    timeframe: 'Your choice'
  },
  {
    icon: Clock,
    title: 'RESOLUTION',
    description: 'Refunds processed within 3-5 business days. Replacements shipped same day.',
    timeframe: '3-5 days'
  }
];

const policy = [
  {
    title: 'ELIGIBLE ITEMS',
    points: [
      'Unopened products in original packaging',
      'Damaged or defective items',
      'Incorrect items received',
      'Products not meeting quality standards'
    ]
  },
  {
    title: 'NOT ELIGIBLE',
    points: [
      'Opened or used products',
      'Items without original packaging',
      'Products purchased over 24 hours ago',
      'Special orders or custom items'
    ]
  },
  {
    title: 'OUR GUARANTEE',
    points: [
      '24-hour satisfaction guarantee',
      'Full refund or free replacement',
      'No questions asked policy',
      'Premium customer service'
    ]
  }
];

export function SmartReturns({
  vendorId,
  vendorName,
  vendorLogo,
  headline = "RETURNS & REFUNDS",
  subheadline = "Your satisfaction is our priority",
  animate = true,
  className = ''
}: SmartReturnsProps) {
  const { ref, inView } = useScrollAnimation();

  return (
    <SmartComponentWrapper 
      animate={false}
      componentName="Returns"
      className={className}
    >
      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6 bg-black">
        <SmartContainers.MaxWidth>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-3xl mx-auto"
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

      {/* Return Process */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-black">
        <SmartContainers.MaxWidth>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-center text-white mb-12"
            style={{ fontWeight: 900 }}
          >
            HOW IT WORKS
          </motion.h3>
          
          <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {returnSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1, 
                  ease: [0.22, 1, 0.36, 1] 
                }}
              >
                <SmartContainers.Card className="p-6 text-center h-full">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                    <step.icon size={20} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="text-xs text-white/40 uppercase tracking-[0.15em] mb-3">
                    Step {index + 1}
                  </div>
                  <h4 
                    className="text-sm font-black uppercase tracking-tight text-white mb-3"
                    style={{ fontWeight: 900 }}
                  >
                    {step.title}
                  </h4>
                  <p className="text-xs text-white/60 leading-relaxed mb-3">
                    {step.description}
                  </p>
                  <div className="inline-block px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-white/40 uppercase tracking-wider">
                    {step.timeframe}
                  </div>
                </SmartContainers.Card>
              </motion.div>
            ))}
          </div>
        </SmartContainers.MaxWidth>
      </section>

      {/* Policy Details */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-black">
        <SmartContainers.MaxWidth>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {policy.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ 
                  duration: 0.6, 
                  delay: 0.5 + index * 0.1, 
                  ease: [0.22, 1, 0.36, 1] 
                }}
              >
                <SmartContainers.Card className="p-8 h-full">
                  <h4 
                    className="text-base font-black uppercase tracking-tight text-white mb-6"
                    style={{ fontWeight: 900 }}
                  >
                    {section.title}
                  </h4>
                  <ul className="space-y-3">
                    {section.points.map((point, pIndex) => (
                      <li 
                        key={pIndex}
                        className="text-xs text-white/60 flex items-start gap-2"
                      >
                        <div className="flex-shrink-0 w-1 h-1 rounded-full bg-white/40 mt-1.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </SmartContainers.Card>
              </motion.div>
            ))}
          </div>
        </SmartContainers.MaxWidth>
      </section>

      {/* Contact CTA */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-black">
        <SmartContainers.MaxWidth>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto"
          >
            <SmartContainers.Card className="p-8 sm:p-12 text-center">
              <h3 
                className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-4"
                style={{ fontWeight: 900 }}
              >
                NEED TO START A RETURN?
              </h3>
              <p className="text-sm sm:text-base text-white/60 mb-6">
                Our support team is standing by to help process your return quickly and easily.
              </p>
              <a
                href="/storefront/contact"
                className="inline-flex items-center gap-2 text-white font-black uppercase tracking-[0.12em] text-xs hover:text-white/70 transition-colors"
                style={{ fontWeight: 900 }}
              >
                CONTACT SUPPORT
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </SmartContainers.Card>
          </motion.div>
        </SmartContainers.MaxWidth>
      </section>
    </SmartComponentWrapper>
  );
}

