"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HeroContent() {
  return (
    <div className="max-w-6xl mx-auto text-center relative">
      {/* Subtle gradient glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />

      {/* Logo with smooth fade in */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.21, 0.45, 0.27, 0.9] }}
        className="mb-8 sm:mb-10 flex justify-center relative z-10"
      >
        <div className="relative">
          <Image
            src="/yacht-club-logo.png"
            alt="WhaleTools"
            width={140}
            height={140}
            className="object-contain sm:w-[160px] sm:h-[160px] md:w-[180px] md:h-[180px]"
            priority
          />
          {/* Subtle glow */}
          <div className="absolute inset-0 bg-white/5 rounded-full blur-2xl scale-75" />
        </div>
      </motion.div>

      {/* Simplified, powerful headline */}
      <div className="relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 0.2,
            ease: [0.21, 0.45, 0.27, 0.9],
          }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-6 sm:mb-8 tracking-tighter leading-[0.85] uppercase"
          style={{ fontWeight: 900 }}
        >
          <span className="inline-block">
            <span className="bg-gradient-to-b from-white via-white to-white/80 bg-clip-text text-transparent">
              One Platform.
            </span>
          </span>
          <br />
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.4,
              ease: [0.21, 0.45, 0.27, 0.9],
            }}
            className="inline-block text-white/60"
          >
            Your Entire
          </motion.span>
          <br />
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.6,
              ease: [0.21, 0.45, 0.27, 0.9],
            }}
            className="inline-block text-white/60"
          >
            Business.
          </motion.span>
        </motion.h1>

        {/* Divider with grow animation */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: 96 }}
          transition={{
            duration: 0.8,
            delay: 0.8,
            ease: [0.21, 0.45, 0.27, 0.9],
          }}
          className="h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-10 sm:mb-12"
        />

        {/* Powerful, simple value prop - Jobs style */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 1,
            ease: [0.21, 0.45, 0.27, 0.9],
          }}
          className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white/80 font-medium leading-relaxed max-w-4xl mx-auto mb-12 sm:mb-16 px-4"
        >
          Replace your entire software stack.
          <br />
          <span className="text-white/50">
            POS. eCommerce. Inventory. Analytics.
          </span>
          <br />
          <span className="text-white/50">Everything. Everywhere.</span>
        </motion.p>

        {/* Social proof - simple, powerful */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.8,
            delay: 1.2,
            ease: [0.21, 0.45, 0.27, 0.9],
          }}
          className="mb-12 sm:mb-16"
        >
          <p className="text-xs sm:text-sm uppercase tracking-[0.15em] text-white/40 font-black">
            Stop paying $3,600/month for 5 different tools
          </p>
        </motion.div>

        {/* CTA Buttons - cleaner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: 1.4,
            ease: [0.21, 0.45, 0.27, 0.9],
          }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
        >
          <Link
            href="/vendor/login"
            className="group inline-flex items-center justify-center gap-3 bg-white text-black px-10 py-5 rounded-2xl text-sm uppercase tracking-[0.1em] font-black transition-all hover:scale-[1.02] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] w-full sm:w-auto relative overflow-hidden"
            style={{ fontWeight: 900 }}
          >
            <span className="relative z-10">Start Free Trial</span>
            <ArrowRight
              size={18}
              className="group-hover:translate-x-1 transition-transform relative z-10"
            />
            {/* Subtle shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center justify-center gap-3 bg-transparent border-2 border-white/20 text-white px-10 py-5 rounded-2xl text-sm uppercase tracking-[0.1em] hover:bg-white/5 hover:border-white/30 font-black transition-all hover:scale-[1.02] w-full sm:w-auto"
            style={{ fontWeight: 900 }}
          >
            <span>See How It Works</span>
          </Link>
        </motion.div>

        {/* Pricing tease - Jobs style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.8,
            delay: 1.6,
            ease: [0.21, 0.45, 0.27, 0.9],
          }}
          className="mt-8 sm:mt-10"
        >
          <p className="text-sm sm:text-base text-white/50 font-normal">
            Starting at <span className="text-white font-bold">$299/month</span>
            <span className="mx-3 text-white/30">·</span>
            <span className="text-white/60">No setup fees</span>
            <span className="mx-3 text-white/30">·</span>
            <span className="text-white/60">Cancel anytime</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
