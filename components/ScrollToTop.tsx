"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const rafIdRef = useRef<number | null>(null);
  const lastScrollRef = useRef(0);

  const updateScrollState = useCallback(() => {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const maxScroll = docHeight - windowHeight;
    
    // Calculate accurate scroll progress
    const progress = maxScroll > 0 ? Math.min((scrollY / maxScroll) * 100, 100) : 0;
    
    // Only update if values changed significantly to prevent unnecessary renders
    if (Math.abs(progress - scrollProgress) > 0.5 || (scrollY > 400) !== isVisible) {
      setScrollProgress(progress);
      setIsVisible(scrollY > 400);
    }
    
    lastScrollRef.current = scrollY;
    rafIdRef.current = null;
  }, [scrollProgress, isVisible]);

  useEffect(() => {
    const handleScroll = () => {
      // Use requestAnimationFrame for smooth 60fps updates
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(updateScrollState);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Initial calculation
    updateScrollState();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [updateScrollState]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // SVG circle calculations for progress ring
  const radius = 16;
  const strokeWidth = 1.5;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-50 w-9 h-9 transition-all duration-300 ease-out group ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
      aria-label="Scroll to top"
    >
      {/* Minimal background */}
      <div className="absolute inset-0 rounded-full bg-black/40 backdrop-blur-md border border-white/10 group-hover:bg-black/60 group-hover:border-white/20 transition-all duration-200" />
      
      {/* SVG Progress Ring */}
      <svg
        className="absolute inset-0 w-full h-full -rotate-90"
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
      >
        {/* Progress indicator */}
        <circle
          stroke="rgba(255, 255, 255, 0.5)"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ 
            strokeDashoffset,
            transition: 'stroke-dashoffset 0.1s linear'
          }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="group-hover:stroke-white/70 transition-colors duration-200"
        />
      </svg>

      {/* Arrow icon */}
      <div className="absolute inset-0 flex items-center justify-center text-white/70 group-hover:text-white transition-colors duration-200">
        <ArrowUp size={14} strokeWidth={2} />
      </div>
    </button>
  );
}

