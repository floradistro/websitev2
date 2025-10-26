"use client";

/**
 * Smart Component: SmartContact
 * Luxury contact form with info cards
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  SmartComponentWrapper, 
  SmartComponentBaseProps,
  SmartTypography,
  SmartContainers,
  SmartButton,
  useScrollAnimation
} from '@/lib/smart-component-base';
import { Mail, MessageSquare, Clock, MapPin } from 'lucide-react';
import Image from 'next/image';

export interface SmartContactProps extends SmartComponentBaseProps {
  headline?: string;
  subheadline?: string;
  email?: string;
  phone?: string;
  hours?: string;
  location?: string;
  animate?: boolean;
}

export function SmartContact({
  vendorId,
  vendorName,
  vendorLogo,
  headline = "CONTACT US",
  subheadline = "Questions? We're here to help",
  email = "support@example.com",
  phone = "(555) 123-4567",
  hours = "Mon-Sun: 10am - 9pm",
  location = "San Francisco, CA",
  animate = true,
  className = ''
}: SmartContactProps) {
  const { ref, inView } = useScrollAnimation();
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement form submission
    console.log('Form submitted:', formState);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const contactInfo = [
    { icon: Mail, label: 'EMAIL', value: email },
    { icon: MessageSquare, label: 'PHONE', value: phone },
    { icon: Clock, label: 'HOURS', value: hours },
    { icon: MapPin, label: 'LOCATION', value: location }
  ];

  return (
    <SmartComponentWrapper 
      animate={false}
      componentName="Contact"
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

      {/* Contact Info Cards */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-black">
        <SmartContainers.MaxWidth>
          <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
            {contactInfo.map((info, index) => (
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
                <SmartContainers.Card className="p-6 text-center">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                    <info.icon size={20} className="text-white" strokeWidth={2.5} />
                  </div>
                  <SmartTypography.Label className="mb-2">
                    {info.label}
                  </SmartTypography.Label>
                  <p className="text-sm text-white/60">{info.value}</p>
                </SmartContainers.Card>
              </motion.div>
            ))}
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl mx-auto"
          >
            <SmartContainers.Card className="p-8 sm:p-12">
              <h3 
                className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mb-8"
                style={{ fontWeight: 900 }}
              >
                SEND US A MESSAGE
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-white/40 uppercase tracking-[0.15em] font-black text-xs mb-2">
                    NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-white/40 uppercase tracking-[0.15em] font-black text-xs mb-2">
                    EMAIL
                  </label>
                  <input
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-white/40 uppercase tracking-[0.15em] font-black text-xs mb-2">
                    SUBJECT
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.subject}
                    onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label className="block text-white/40 uppercase tracking-[0.15em] font-black text-xs mb-2">
                    MESSAGE
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/20 transition-colors resize-none"
                    placeholder="Your message..."
                  />
                </div>

                <SmartButton 
                  variant="primary" 
                  className="w-full"
                  type="submit"
                >
                  {submitted ? '✓ MESSAGE SENT' : 'SEND MESSAGE'}
                </SmartButton>
              </form>
            </SmartContainers.Card>
          </motion.div>
        </SmartContainers.MaxWidth>
      </section>
    </SmartComponentWrapper>
  );
}

