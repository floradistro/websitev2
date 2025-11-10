"use client";

/**
 * Smart Component: SmartShipping
 * Shipping info and policies
 */

import React from "react";
import { motion } from "framer-motion";
import {
  SmartComponentWrapper,
  SmartComponentBaseProps,
  SmartTypography,
  SmartContainers,
  useScrollAnimation,
} from "@/lib/smart-component-base";
import { Truck, Clock, MapPin, Shield } from "lucide-react";
import Image from "next/image";

export interface SmartShippingProps extends SmartComponentBaseProps {
  headline?: string;
  subheadline?: string;
  animate?: boolean;
}

const shippingOptions = [
  {
    icon: Truck,
    title: "SAME-DAY DELIVERY",
    description:
      "Orders placed before 7pm qualify for same-day delivery to eligible areas. Fast, reliable, and discreet.",
    details: ["Available 7 days a week", "Tracking provided", "$10 flat rate"],
  },
  {
    icon: Clock,
    title: "STANDARD DELIVERY",
    description:
      "1-2 business day delivery for all other orders. Perfect for planning ahead.",
    details: [
      "Free on orders over $50",
      "Signature required",
      "Real-time tracking",
    ],
  },
  {
    icon: MapPin,
    title: "DELIVERY ZONES",
    description:
      "We currently serve the greater Bay Area with plans to expand soon.",
    details: ["San Francisco", "Oakland", "San Jose", "Surrounding areas"],
  },
  {
    icon: Shield,
    title: "DISCREET PACKAGING",
    description:
      "All orders ship in unmarked, odor-proof packaging for complete privacy.",
    details: [
      "No cannabis branding",
      "Tamper-evident seals",
      "Professional packaging",
    ],
  },
];

export function SmartShipping({
  vendorId,
  vendorName,
  vendorLogo,
  headline = "SHIPPING & DELIVERY",
  subheadline = "Fast, discreet, and reliable",
  animate = true,
  className = "",
}: SmartShippingProps) {
  const { ref, inView } = useScrollAnimation();

  return (
    <SmartComponentWrapper
      animate={false}
      componentName="Shipping"
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
                transition={{
                  duration: 0.8,
                  delay: 0.2,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="mb-12 flex justify-center"
              >
                <div className="relative w-24 h-24 md:w-32 md:h-32">
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-full blur-2xl animate-pulse"
                    style={{ animationDuration: "3s" }}
                  />
                  <Image
                    src={vendorLogo}
                    alt={vendorName || "Vendor"}
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

      {/* Shipping Options Grid */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 bg-black">
        <SmartContainers.MaxWidth>
          <div ref={ref} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shippingOptions.map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <SmartContainers.Card className="p-8 sm:p-10 h-full">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <option.icon
                        size={24}
                        className="text-white"
                        strokeWidth={2.5}
                      />
                    </div>
                    <div className="flex-1">
                      <h3
                        className="text-base sm:text-lg font-black uppercase tracking-tight text-white mb-3"
                        style={{ fontWeight: 900 }}
                      >
                        {option.title}
                      </h3>
                      <p className="text-sm text-white/60 leading-relaxed">
                        {option.description}
                      </p>
                    </div>
                  </div>

                  <div className="h-[1px] bg-white/5 mb-6" />

                  <ul className="space-y-2">
                    {option.details.map((detail, dIndex) => (
                      <li
                        key={dIndex}
                        className="text-xs text-white/40 flex items-center gap-2"
                      >
                        <div className="w-1 h-1 rounded-full bg-white/40" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </SmartContainers.Card>
              </motion.div>
            ))}
          </div>
        </SmartContainers.MaxWidth>
      </section>

      {/* Additional Info */}
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
                QUESTIONS ABOUT DELIVERY?
              </h3>
              <p className="text-sm sm:text-base text-white/60 mb-6">
                Our support team is here to help with any shipping questions or
                concerns.
              </p>
              <a
                href="/storefront/contact"
                className="inline-flex items-center gap-2 text-white font-black uppercase tracking-[0.12em] text-xs hover:text-white/70 transition-colors"
                style={{ fontWeight: 900 }}
              >
                CONTACT US
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>
            </SmartContainers.Card>
          </motion.div>
        </SmartContainers.MaxWidth>
      </section>
    </SmartComponentWrapper>
  );
}
