"use client";

/**
 * CountUp Component
 * Animates numbers counting up
 * Perfect for stats sections
 */

import { motion, useSpring, useTransform } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';

interface CountUpProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  decimals?: number;
}

export function CountUp({
  value,
  duration = 2,
  suffix = '',
  prefix = '',
  className = '',
  decimals = 0
}: CountUpProps) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const spring = useSpring(0, {
    duration: duration * 1000,
    bounce: 0
  });

  const display = useTransform(spring, (current) =>
    `${prefix}${Math.floor(current).toLocaleString()}${suffix}`
  );

  useEffect(() => {
    if (inView) {
      spring.set(value);
    }
  }, [inView, spring, value]);

  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}

