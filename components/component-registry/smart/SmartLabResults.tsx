"use client";

/**
 * Smart Component: SmartLabResults
 * Lab results page with COA bucket integration
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
import { FlaskConical, Download, FileCheck, Calendar, CheckCircle, Shield } from 'lucide-react';
import Image from 'next/image';

export interface SmartLabResultsProps extends SmartComponentBaseProps {
  headline?: string;
  subheadline?: string;
  coaFiles?: any[];
  animate?: boolean;
}

const testingFeatures = [
  {
    icon: CheckCircle,
    title: 'CANNABINOID PROFILE',
    description: 'THC, CBD, and minor cannabinoid percentages'
  },
  {
    icon: CheckCircle,
    title: 'TERPENE ANALYSIS',
    description: 'Complete terpene breakdown'
  },
  {
    icon: CheckCircle,
    title: 'PESTICIDE SCREENING',
    description: 'Zero pesticide contamination'
  },
  {
    icon: CheckCircle,
    title: 'HEAVY METALS',
    description: 'Lead, arsenic, mercury screening'
  },
  {
    icon: CheckCircle,
    title: 'MICROBIAL TESTING',
    description: 'Bacteria and mold analysis'
  },
  {
    icon: CheckCircle,
    title: 'RESIDUAL SOLVENTS',
    description: 'For concentrate products'
  }
];

export function SmartLabResults({
  vendorId,
  vendorName,
  vendorLogo,
  headline = "LAB RESULTS",
  subheadline = "Third-party tested. Full transparency.",
  coaFiles = [],
  animate = true,
  className = ''
}: SmartLabResultsProps) {
  const { ref, inView } = useScrollAnimation();
  const loading = false; // Data passed as props from server

  return (
    <SmartComponentWrapper 
      animate={false}
      loading={loading}
      componentName="Lab Results"
      className={className}
    >
      {/* Hero Section with Logo */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-20 px-4 sm:px-6 bg-black">
        <SmartContainers.MaxWidth>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Animated Vendor Logo */}
            {vendorLogo && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="mb-12 flex justify-center"
              >
                <div className="relative w-32 h-32 md:w-40 md:h-40">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-blue-500/20 to-green-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '3s' }} />
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

      {/* Testing Commitment */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-black">
        <SmartContainers.MaxWidth>
          <div ref={ref} className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <SmartContainers.Card className="p-8 sm:p-12">
                <h3 
                  className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-6"
                  style={{ fontWeight: 900 }}
                >
                  OUR TESTING COMMITMENT
                </h3>
                <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-8">
                  Every product sold by {vendorName} undergoes rigorous third-party laboratory testing. 
                  We don't just meet industry standards—we exceed them.
                </p>
                
                <div className="h-[1px] bg-white/5 my-8" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {testingFeatures.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={inView ? { opacity: 1, x: 0 } : {}}
                      transition={{ 
                        duration: 0.6, 
                        delay: 0.1 + index * 0.05, 
                        ease: [0.22, 1, 0.36, 1] 
                      }}
                      className="flex items-start gap-3"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mt-0.5">
                        <feature.icon size={14} className="text-white" strokeWidth={3} />
                      </div>
                      <div>
                        <h4 
                          className="text-sm font-black uppercase tracking-tight text-white mb-1"
                          style={{ fontWeight: 900 }}
                        >
                          {feature.title}
                        </h4>
                        <p className="text-xs text-white/60">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </SmartContainers.Card>
            </motion.div>
          </div>
        </SmartContainers.MaxWidth>
      </section>

      {/* COA Files Grid */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-black">
        <SmartContainers.MaxWidth>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-center text-white mb-12"
            style={{ fontWeight: 900 }}
          >
            CERTIFICATES OF ANALYSIS
          </motion.h3>

          {coaFiles && coaFiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coaFiles.map((file: any, index: number) => {
                const displayName = file.name
                  ?.replace(/\.[^/.]+$/, '') 
                  ?.replace(/_/g, ' ') 
                  ?.replace(/^\d+[-_]/, '') || 'Lab Result';
                
                const fileDate = file.created_at 
                  ? new Date(file.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })
                  : 'N/A';

                const fileUrl = file.url || `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vendor-coas/${vendorId}/${file.name}`;

                return (
                  <motion.a
                    key={index}
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={inView ? { opacity: 1, y: 0 } : {}}
                    transition={{ 
                      duration: 0.6, 
                      delay: index * 0.05, 
                      ease: [0.22, 1, 0.36, 1] 
                    }}
                    className="group"
                  >
                    <SmartContainers.Card className="p-6 h-full hover:-translate-y-1 transition-all">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-all">
                          <FileCheck size={20} className="text-white" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 
                            className="text-sm font-black uppercase tracking-tight text-white mb-2 truncate group-hover:text-white/90 transition-colors"
                            style={{ fontWeight: 900 }}
                          >
                            {displayName}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[10px] text-white/40 uppercase tracking-wider">
                            <Calendar size={10} />
                            <span>{fileDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-white/60 group-hover:text-white group-hover:gap-3 transition-all">
                        <Download size={14} strokeWidth={2.5} />
                        <span className="font-black uppercase tracking-wide">DOWNLOAD PDF</span>
                      </div>
                    </SmartContainers.Card>
                  </motion.a>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <SmartContainers.Card className="p-12 text-center">
                <FlaskConical className="w-16 h-16 text-white/40 mx-auto mb-6" strokeWidth={1.5} />
                <h3 
                  className="text-xl font-black uppercase tracking-tight text-white mb-3"
                  style={{ fontWeight: 900 }}
                >
                  LAB RESULTS COMING SOON
                </h3>
                <p className="text-sm text-white/60">
                  We're currently uploading our complete library of lab test results. Check back soon.
                </p>
              </SmartContainers.Card>
            </motion.div>
          )}
        </SmartContainers.MaxWidth>
      </section>

      {/* Compliance Badge */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-black">
        <SmartContainers.MaxWidth>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto"
          >
            <SmartContainers.Card className="p-8 sm:p-10 border-white/20">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Shield size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3 
                    className="text-xl font-black uppercase tracking-tight text-white mb-3"
                    style={{ fontWeight: 900 }}
                  >
                    100% COMPLIANT
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed mb-4">
                    All products contain less than 0.3% Delta-9 THC and comply with the 2018 Farm Bill. 
                    Lab results are updated regularly and available for every product we sell.
                  </p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">
                    Testing performed by ISO-certified third-party laboratories
                  </p>
                </div>
              </div>
            </SmartContainers.Card>
          </motion.div>
        </SmartContainers.MaxWidth>
      </section>

      {/* Contact CTA */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-black">
        <SmartContainers.MaxWidth>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto"
          >
            <SmartContainers.Card className="p-8 sm:p-12 text-center">
              <h3 
                className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-4"
                style={{ fontWeight: 900 }}
              >
                QUESTIONS ABOUT OUR TESTING?
              </h3>
              <p className="text-sm sm:text-base text-white/60 mb-6">
                We're happy to provide detailed lab results for any product.
              </p>
              <a
                href="/storefront/contact"
                className="inline-flex items-center gap-2 text-white font-black uppercase tracking-[0.12em] text-xs hover:text-white/70 transition-colors"
                style={{ fontWeight: 900 }}
              >
                CONTACT US
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

