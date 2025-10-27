'use client';

import { useState, useEffect } from "react";
import { motion } from 'framer-motion';
import Image from "next/image";

export function HomeCountdown() {
  const [countdown, setCountdown] = useState(20);

  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 20 : prev - 1));
    }, 1000);
    
    return () => clearInterval(countdownTimer);
  }, []);

  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-32 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-8 sm:p-12 md:p-16 lg:p-24"
        >
          <div className="mb-6 sm:mb-8">
            <Image 
              src="/yacht-club-logo.png" 
              alt="Yacht Club" 
              width={80} 
              height={80}
              className="object-contain mx-auto opacity-20 sm:w-[100px] sm:h-[100px] md:w-[120px] md:h-[120px]"
            />
          </div>
          <motion.div 
            key={countdown}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-4 sm:mb-6"
            style={{ fontWeight: 900 }}
          >
            {countdown}
          </motion.div>
          <div className="text-xs uppercase tracking-[0.12em] text-white/60 font-black mb-8 sm:mb-12" style={{ fontWeight: 900 }}>
            Seconds
          </div>
          <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black mb-4 sm:mb-6 uppercase tracking-tight" style={{ fontWeight: 900 }}>
            From Idea To Deployed
          </h3>
          <p className="text-xs sm:text-sm uppercase tracking-[0.12em] text-white/40 font-black" style={{ fontWeight: 900 }}>
            No Designer. No Developer.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

