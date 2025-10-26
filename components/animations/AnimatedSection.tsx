"use client";

/**
 * Animated Section Component
 * Wraps content with scroll-triggered animations
 * Usage: <AnimatedSection animation="fadeInUp">...</AnimatedSection>
 */

import { motion, Variants } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  fadeIn, 
  fadeInUp, 
  fadeInDown, 
  scaleIn,
  slideInLeft,
  slideInRight,
  staggerContainer
} from '@/lib/animations';

interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: 'fadeIn' | 'fadeInUp' | 'fadeInDown' | 'scaleIn' | 'slideInLeft' | 'slideInRight' | 'stagger';
  delay?: number;
  className?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

const animations: Record<string, Variants> = {
  fadeIn,
  fadeInUp,
  fadeInDown,
  scaleIn,
  slideInLeft,
  slideInRight,
  stagger: staggerContainer
};

export function AnimatedSection({
  children,
  animation = 'fadeInUp',
  delay = 0,
  className = '',
  threshold = 0.1,
  triggerOnce = true
}: AnimatedSectionProps) {
  const { ref, inView } = useInView({
    triggerOnce,
    threshold,
    rootMargin: '-50px'
  });

  const selectedAnimation = animations[animation];

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        ...selectedAnimation,
        visible: {
          ...selectedAnimation.visible,
          transition: {
            ...(selectedAnimation.visible as any).transition,
            delay
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

