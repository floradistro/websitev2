/**
 * Animation Utilities
 * Modern animation presets for Wilson's Template
 * Using Framer Motion + GSAP
 */

import { Variants } from "framer-motion";

// ============================================================================
// FRAMER MOTION VARIANTS
// ============================================================================

// Fade In animations
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

// Scale animations (luxury product reveals)
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] },
  },
};

export const scaleInSpring: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

// Slide animations
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -100 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 100 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

// Stagger children (for lists/grids)
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 },
  },
};

// Text reveal animations (character by character)
export const textReveal: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// Luxury hover animations
export const hoverScale = {
  scale: 1.05,
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
};

export const hoverGlow = {
  boxShadow: "0 0 40px rgba(255, 255, 255, 0.2)",
  transition: { duration: 0.3 },
};

// Tap animations (mobile)
export const tapScale = {
  scale: 0.95,
  transition: { duration: 0.1 },
};

// ============================================================================
// SCROLL REVEAL CONFIGS
// ============================================================================

export const scrollRevealOptions = {
  triggerOnce: true,
  threshold: 0.1,
  rootMargin: "-50px",
};

export const scrollRevealLarge = {
  triggerOnce: true,
  threshold: 0.05,
  rootMargin: "-100px",
};

// ============================================================================
// PAGE TRANSITION VARIANTS
// ============================================================================

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// ============================================================================
// LUXURY PRODUCT CARD ANIMATIONS
// ============================================================================

export const productCardHover = {
  y: -8,
  boxShadow: "0 20px 60px rgba(255, 255, 255, 0.1)",
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
};

export const productImageZoom = {
  scale: 1.1,
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
};

// ============================================================================
// LOADING ANIMATIONS
// ============================================================================

export const pulseAnimation: Variants = {
  initial: { opacity: 0.5, scale: 1 },
  animate: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const spinAnimation: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// ============================================================================
// HERO ANIMATIONS (WhaleTools style)
// ============================================================================

export const heroLogoReveal: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const heroTextReveal: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: 0.3,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const heroDivider: Variants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: {
      duration: 0.8,
      delay: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const heroCTA: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      delay: 0.9,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

// ============================================================================
// GSAP HELPER FUNCTIONS
// ============================================================================

/**
 * GSAP fade in timeline
 * Usage: fadeInTimeline('.element', 0.2)
 */
export const fadeInTimeline = (selector: string, delay: number = 0) => {
  if (typeof window === "undefined") return;
  const gsap = require("gsap");

  return gsap.from(selector, {
    opacity: 0,
    y: 40,
    duration: 0.8,
    delay,
    ease: "power3.out",
  });
};

/**
 * GSAP stagger reveal
 * Usage: staggerReveal('.grid-item')
 */
export const staggerReveal = (selector: string) => {
  if (typeof window === "undefined") return;
  const gsap = require("gsap");

  return gsap.from(selector, {
    opacity: 0,
    y: 30,
    stagger: 0.1,
    duration: 0.6,
    ease: "power3.out",
  });
};

// ============================================================================
// EASING CURVES (Custom luxury easing)
// ============================================================================

export const easings = {
  luxury: [0.22, 1, 0.36, 1], // Smooth luxury ease
  snappy: [0.87, 0, 0.13, 1], // Quick snap
  elastic: [0.68, -0.55, 0.265, 1.55], // Elastic bounce
  smooth: [0.25, 0.46, 0.45, 0.94], // Smooth ease
};

// ============================================================================
// VIEWPORT DETECTION HOOK
// ============================================================================

export const useInViewport = () => {
  return {
    once: true,
    amount: 0.2,
    margin: "-50px",
  };
};
