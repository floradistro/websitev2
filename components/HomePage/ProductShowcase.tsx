'use client';

import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export function ProductShowcase() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const products = [
    {
      name: "POS System",
      description: "Complete point-of-sale",
      color: "from-blue-500/20 to-cyan-500/20",
      delay: 0
    },
    {
      name: "E-Commerce",
      description: "Online menu & ordering",
      color: "from-purple-500/20 to-pink-500/20",
      delay: 0.1
    },
    {
      name: "Inventory",
      description: "Multi-location tracking",
      color: "from-green-500/20 to-emerald-500/20",
      delay: 0.2
    },
    {
      name: "Wholesale",
      description: "B2B distribution",
      color: "from-orange-500/20 to-yellow-500/20",
      delay: 0.3
    },
    {
      name: "Compliance",
      description: "Lab results & COAs",
      color: "from-red-500/20 to-rose-500/20",
      delay: 0.4
    },
    {
      name: "Analytics",
      description: "Sales insights",
      color: "from-indigo-500/20 to-violet-500/20",
      delay: 0.5
    }
  ];

  return (
    <div ref={ref} className="relative py-20 sm:py-32 px-4 sm:px-6 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, ease: [0.21, 0.45, 0.27, 0.9] }}
          className="text-center mb-16 sm:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight mb-4" style={{ fontWeight: 900 }}>
            <span className="bg-gradient-to-b from-white to-white/80 bg-clip-text text-transparent">
              Complete Platform
            </span>
          </h2>
          <p className="text-white/60 text-sm sm:text-base max-w-2xl mx-auto">
            Everything cannabis businesses need to operate, all in one place
          </p>
        </motion.div>

        {/* Floating Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {products.map((product, index) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 40, rotateX: -10 }}
              animate={isInView ? {
                opacity: 1,
                y: 0,
                rotateX: 0,
              } : { opacity: 0, y: 40, rotateX: -10 }}
              transition={{
                duration: 0.8,
                delay: product.delay,
                ease: [0.21, 0.45, 0.27, 0.9]
              }}
              whileHover={{
                scale: 1.05,
                rotateY: 5,
                transition: { duration: 0.3 }
              }}
              className="group relative"
              style={{ perspective: "1000px" }}
            >
              <div className="relative bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-all duration-500 overflow-hidden">
                {/* Animated gradient background */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${product.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 90, 0],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />

                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut"
                  }}
                />

                {/* Content */}
                <div className="relative z-10">
                  <motion.div
                    className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <div className="w-6 h-6 rounded-lg bg-white/10" />
                  </motion.div>

                  <h3 className="text-xl font-black uppercase tracking-tight mb-2" style={{ fontWeight: 900 }}>
                    {product.name}
                  </h3>
                  <p className="text-sm text-white/60">
                    {product.description}
                  </p>
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-gradient-to-b ${product.color} blur-2xl`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Central Connection Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.21, 0.45, 0.27, 0.9] }}
          className="mt-16 sm:mt-20 text-center"
        >
          <div className="inline-flex items-center gap-3 bg-[#0a0a0a] border border-white/5 rounded-full px-6 py-3 group hover:border-white/10 transition-colors cursor-default">
            <motion.div
              className="w-2 h-2 bg-white rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <span className="text-xs uppercase tracking-[0.12em] font-black text-white/60 group-hover:text-white/80 transition-colors" style={{ fontWeight: 900 }}>
              All Connected. Real-Time.
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
