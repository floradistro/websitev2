'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function HeroContent() {
  return (
    <div className="max-w-5xl mx-auto text-center relative">
      {/* Subtle gradient glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      {/* Logo with smooth fade in */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.21, 0.45, 0.27, 0.9] }}
        className="mb-8 sm:mb-12 flex justify-center relative z-10"
      >
        <div className="relative">
          <Image
            src="/yacht-club-logo.png"
            alt="Yacht Club"
            width={180}
            height={180}
            className="object-contain sm:w-[240px] sm:h-[240px] md:w-[280px] md:h-[280px]"
            priority
          />
          {/* Subtle glow */}
          <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl scale-75" />
        </div>
      </motion.div>

      {/* Title with staggered word animation */}
      <div className="relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.21, 0.45, 0.27, 0.9] }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-6 sm:mb-8 tracking-tight leading-[0.9] uppercase"
          style={{ fontWeight: 900 }}
        >
          <span className="inline-block">
            <span className="bg-gradient-to-b from-white to-white/90 bg-clip-text text-transparent">
              Cannabis
            </span>
          </span>
          <br />
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.21, 0.45, 0.27, 0.9] }}
            className="inline-block"
          >
            Commerce
          </motion.span>
          <br />
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.21, 0.45, 0.27, 0.9] }}
            className="inline-block text-white/60"
          >
            Platform
          </motion.span>
        </motion.h1>

        {/* Divider with grow animation */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 128 }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.21, 0.45, 0.27, 0.9] }}
          className="h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-12"
        />

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1, ease: [0.21, 0.45, 0.27, 0.9] }}
          className="text-base sm:text-lg md:text-xl text-white/60 font-normal leading-relaxed max-w-2xl mx-auto mb-12 sm:mb-16 px-4"
        >
          Complete operations platform for cannabis retailers, distributors, and brands. E-commerce, POS, inventory, wholesale, compliance—everything you need to run and scale your cannabis business.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2, ease: [0.21, 0.45, 0.27, 0.9] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/vendor/login"
            className="group inline-flex items-center justify-center gap-3 bg-white text-black px-8 py-4 rounded-2xl text-xs uppercase tracking-[0.08em] font-black transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.15)] w-full sm:w-auto relative overflow-hidden"
            style={{ fontWeight: 900 }}
          >
            <span className="relative z-10">Start Building</span>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform relative z-10" />
            {/* Subtle shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          </Link>
          <Link
            href="/api-status"
            className="inline-flex items-center justify-center gap-3 bg-transparent border border-white/10 text-white px-8 py-4 rounded-2xl text-xs uppercase tracking-[0.08em] hover:bg-white/5 hover:border-white/20 font-black transition-all hover:scale-105 w-full sm:w-auto"
            style={{ fontWeight: 900 }}
          >
            <span>View API</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
