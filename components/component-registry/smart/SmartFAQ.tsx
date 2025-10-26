"use client";

/**
 * Smart Component: SmartFAQ
 * Luxury animated FAQ accordion
 * iOS 26 rounded-2xl design
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Plus, Minus } from 'lucide-react';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

export interface SmartFAQProps {
  vendorId?: string;
  headline?: string;
  subheadline?: string;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  animate?: boolean;
  className?: string;
}

// Default FAQs for cannabis retail
const defaultFAQs = [
  {
    question: "What are your delivery hours?",
    answer: "We offer same-day delivery Monday through Sunday, 10am - 9pm. Orders placed before 7pm qualify for same-day delivery."
  },
  {
    question: "Do you offer lab testing results?",
    answer: "Yes! All our products come with third-party lab results showing cannabinoid profiles, terpene content, and safety testing for pesticides and contaminants."
  },
  {
    question: "What's your return policy?",
    answer: "We stand behind the quality of our products. If you're not satisfied, contact us within 24 hours of delivery for a full refund or replacement."
  },
  {
    question: "Do I need a medical card?",
    answer: "Requirements vary by location. Please check your local regulations. We serve both medical patients and recreational customers where permitted."
  },
  {
    question: "How is packaging discreet?",
    answer: "All orders ship in unmarked, odor-proof packaging with no cannabis-related branding. Your privacy is our priority."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept cash on delivery, debit cards, and digital payment options. Credit card availability varies by location."
  }
];

export function SmartFAQ({
  vendorId,
  headline = "FREQUENTLY ASKED QUESTIONS",
  subheadline,
  faqs = defaultFAQs,
  animate = true,
  className = '',
}: SmartFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '-50px'
  });

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={`py-16 sm:py-20 px-4 sm:px-6 ${className}`}>
      <div className="max-w-4xl mx-auto">
        {/* Headline */}
        {headline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-12 sm:mb-16"
          >
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

        {/* FAQ Items */}
        <motion.div
          ref={ref}
          variants={animate ? staggerContainer : undefined}
          initial={animate ? "hidden" : undefined}
          animate={animate && inView ? "visible" : undefined}
          className="space-y-3 sm:space-y-4"
        >
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            
            return (
              <motion.div
                key={index}
                variants={animate ? staggerItem : undefined}
                className="group"
              >
                <div className="bg-[#0a0a0a] border border-white/5 hover:border-white/10 rounded-2xl overflow-hidden transition-all duration-300">
                  {/* Question Button */}
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full text-left p-6 sm:p-8 flex items-center justify-between gap-4 hover:bg-[#141414] transition-colors"
                  >
                    <span 
                      className="text-sm sm:text-base font-black uppercase tracking-wide text-white flex-1"
                      style={{ fontWeight: 900 }}
                    >
                      {faq.question}
                    </span>
                    <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all">
                      {isOpen ? (
                        <Minus size={16} className="text-white" strokeWidth={3} />
                      ) : (
                        <Plus size={16} className="text-white" strokeWidth={3} />
                      )}
                    </div>
                  </button>

                  {/* Answer */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-0">
                          <div className="h-[1px] bg-white/5 mb-6" />
                          <p className="text-sm sm:text-base text-white/60 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mt-12 sm:mt-16"
        >
          <p className="text-sm text-white/40 mb-4">Still have questions?</p>
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
        </motion.div>
      </div>
    </div>
  );
}

