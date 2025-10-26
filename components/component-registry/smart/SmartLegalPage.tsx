"use client";

/**
 * Smart Component: SmartLegalPage
 * Reusable legal page for Privacy, Terms, Cookies
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
import Image from 'next/image';

export interface LegalSection {
  title: string;
  content: string[];
}

export interface SmartLegalPageProps extends SmartComponentBaseProps {
  headline?: string;
  subheadline?: string;
  lastUpdated?: string;
  sections?: LegalSection[];
  animate?: boolean;
}

export function SmartLegalPage({
  vendorId,
  vendorName,
  vendorLogo,
  headline = "LEGAL POLICY",
  subheadline = "Please read carefully",
  lastUpdated = "January 2024",
  sections = [],
  animate = true,
  className = ''
}: SmartLegalPageProps) {
  const { ref, inView } = useScrollAnimation();

  return (
    <SmartComponentWrapper 
      animate={false}
      componentName="Legal Page"
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
            
            <SmartTypography.Headline className="mb-6">
              {headline}
            </SmartTypography.Headline>
            <p className="text-lg text-white/60 uppercase tracking-wide mb-4">
              {subheadline}
            </p>
            <p className="text-xs text-white/40 uppercase tracking-wider">
              Last Updated: {lastUpdated}
            </p>
          </motion.div>
        </SmartContainers.MaxWidth>
      </section>

      {/* Content Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-black">
        <SmartContainers.MaxWidth>
          <div ref={ref} className="max-w-4xl mx-auto">
            <SmartContainers.Card className="p-8 sm:p-12">
              <div className="space-y-12">
                {sections.map((section, index) => (
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
                    <h3 
                      className="text-lg sm:text-xl font-black uppercase tracking-tight text-white mb-6"
                      style={{ fontWeight: 900 }}
                    >
                      {section.title}
                    </h3>
                    <div className="space-y-4">
                      {section.content.map((paragraph, pIndex) => (
                        <p 
                          key={pIndex}
                          className="text-sm sm:text-base text-white/60 leading-relaxed"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                    {index < sections.length - 1 && (
                      <div className="h-[1px] bg-white/5 mt-12" />
                    )}
                  </motion.div>
                ))}
              </div>
            </SmartContainers.Card>
          </div>
        </SmartContainers.MaxWidth>
      </section>
    </SmartComponentWrapper>
  );
}

