"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Mail, Bell } from 'lucide-react';

interface ComingSoonPageProps {
  vendorName: string;
  vendorLogo?: string;
  message?: string;
  launchDate?: string;
}

export function ComingSoonPage({
  vendorName,
  vendorLogo,
  message = "We're launching soon! Stay tuned for something amazing.",
  launchDate,
}: ComingSoonPageProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!launchDate || !mounted) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const launch = new Date(launchDate).getTime();
      const distance = launch - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [launchDate, mounted]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // TODO: Add to waitlist API
    setSubscribed(true);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center py-16 sm:py-20 px-4 sm:px-6">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-radial from-white/5 via-transparent to-transparent opacity-20" />
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Logo */}
          {vendorLogo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-12 sm:mb-16"
            >
              <img
                src={vendorLogo}
                alt={vendorName}
                className="h-24 sm:h-32 w-auto mx-auto object-contain"
              />
            </motion.div>
          )}

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight text-white mb-6 sm:mb-8 leading-[0.9]"
            style={{ fontWeight: 900 }}
          >
            Coming Soon
          </motion.h1>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-lg sm:text-xl md:text-2xl text-white/60 mb-12 sm:mb-16 max-w-2xl mx-auto leading-relaxed px-4"
          >
            {message}
          </motion.p>

          {/* Countdown Timer */}
          {launchDate && mounted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mb-12 sm:mb-16"
            >
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
                <Calendar size={16} className="text-white/40 sm:w-[18px] sm:h-[18px]" />
                <span className="text-white/40 text-xs font-black uppercase tracking-[0.15em]">
                  Launching In
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-3xl mx-auto">
                {[
                  { label: 'Days', value: timeLeft.days },
                  { label: 'Hours', value: timeLeft.hours },
                  { label: 'Minutes', value: timeLeft.minutes },
                  { label: 'Seconds', value: timeLeft.seconds },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 sm:p-6 md:p-8"
                  >
                    <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 sm:mb-3" style={{ fontWeight: 900 }}>
                      {item.value.toString().padStart(2, '0')}
                    </div>
                    <div className="text-white/40 text-[10px] sm:text-xs font-black uppercase tracking-[0.15em]">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Email Signup */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="max-w-lg mx-auto px-4"
          >
            {!subscribed ? (
              <form onSubmit={handleSubscribe} className="space-y-3 sm:space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl pl-12 sm:pl-16 pr-4 sm:pr-6 py-4 sm:py-5 text-sm sm:text-base text-white placeholder:text-white/40 focus:outline-none focus:border-white/10 transition-colors"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-white hover:bg-white/90 text-black px-6 sm:px-8 py-4 sm:py-5 rounded-2xl font-black uppercase tracking-tight transition-all duration-300 hover:scale-[1.02] text-sm sm:text-base"
                  style={{ fontWeight: 900 }}
                >
                  Notify Me When We Launch
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white text-black rounded-2xl p-6 sm:p-8"
              >
                <Bell className="mx-auto mb-3 sm:mb-4 text-black" size={28} />
                <p className="font-black uppercase tracking-tight text-base sm:text-lg" style={{ fontWeight: 900 }}>
                  You're on the list!
                </p>
                <p className="text-black/60 mt-2 text-sm sm:text-base">
                  We'll notify you when we launch.
                </p>
              </motion.div>
            )}

            <p className="text-white/40 text-xs mt-4 sm:mt-6 text-center">
              We'll never share your email. Unsubscribe anytime.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

