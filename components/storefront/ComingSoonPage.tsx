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

  // Countdown timer
  useEffect(() => {
    if (!launchDate) return;

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
  }, [launchDate]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // TODO: Add to waitlist API
    setSubscribed(true);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center py-16 sm:py-20 px-4 sm:px-6">
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
            className="text-6xl sm:text-7xl md:text-8xl font-black uppercase tracking-tight text-white mb-8 leading-[0.9]"
            style={{ fontWeight: 900 }}
          >
            Coming Soon
          </motion.h1>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl sm:text-2xl text-white/60 mb-16 max-w-2xl mx-auto leading-relaxed"
          >
            {message}
          </motion.p>

          {/* Countdown Timer */}
          {launchDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mb-16"
            >
              <div className="flex items-center justify-center gap-3 mb-8">
                <Calendar size={18} className="text-white/40" />
                <span className="text-white/40 text-xs font-black uppercase tracking-[0.15em]">
                  Launching In
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto">
                {[
                  { label: 'Days', value: timeLeft.days },
                  { label: 'Hours', value: timeLeft.hours },
                  { label: 'Minutes', value: timeLeft.minutes },
                  { label: 'Seconds', value: timeLeft.seconds },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 sm:p-8"
                  >
                    <div className="text-4xl sm:text-6xl font-black text-white mb-3" style={{ fontWeight: 900 }}>
                      {item.value.toString().padStart(2, '0')}
                    </div>
                    <div className="text-white/40 text-xs font-black uppercase tracking-[0.15em]">
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
            className="max-w-lg mx-auto"
          >
            {!subscribed ? (
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl pl-16 pr-6 py-5 text-white placeholder:text-white/40 focus:outline-none focus:border-white/10 transition-colors"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-white hover:bg-white/90 text-black px-8 py-5 rounded-2xl font-black uppercase tracking-tight transition-all duration-300 hover:scale-[1.02]"
                  style={{ fontWeight: 900 }}
                >
                  Notify Me When We Launch
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white text-black rounded-2xl p-8"
              >
                <Bell className="mx-auto mb-4 text-black" size={32} />
                <p className="font-black uppercase tracking-tight text-lg" style={{ fontWeight: 900 }}>
                  You're on the list!
                </p>
                <p className="text-black/60 mt-2">
                  We'll notify you when we launch.
                </p>
              </motion.div>
            )}

            <p className="text-white/40 text-xs mt-6">
              We'll never share your email. Unsubscribe anytime.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

