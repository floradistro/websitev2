"use client";

import { useRef, useEffect, ReactNode, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
}

export default function HorizontalScroll({ children, className = "" }: HorizontalScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const updateScrollButtons = () => {
    const container = scrollRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
    
    // Calculate scroll progress (0 to 100)
    const maxScroll = container.scrollWidth - container.clientWidth;
    const progress = maxScroll > 0 ? (container.scrollLeft / maxScroll) * 100 : 0;
    setScrollProgress(progress);
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    updateScrollButtons();

    const handleScroll = () => {
      updateScrollButtons();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollAmount = container.clientWidth * 0.8;
    const targetScroll = direction === 'left' 
      ? container.scrollLeft - scrollAmount 
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative group overflow-visible">
      {/* Left Arrow - Desktop Only */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100 rounded-full"
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} strokeWidth={1.5} />
        </button>
      )}

      {/* Scrollable Container */}
      <div ref={scrollRef} className={className}>
        {children}
      </div>

      {/* Right Arrow - Desktop Only */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100 rounded-full"
          aria-label="Scroll right"
        >
          <ChevronRight size={20} strokeWidth={1.5} />
        </button>
      )}
      
      {/* Scroll Progress Indicator */}
      <div className="relative w-full mt-6 px-4 sm:px-6">
        {/* Track */}
        <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
          {/* Progress Bar */}
          <div 
            className="h-full bg-gradient-to-r from-white/40 via-white/60 to-white/40 rounded-full transition-all duration-300 ease-out shadow-[0_0_8px_rgba(255,255,255,0.3)]"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
        
        {/* Scroll Hint - Only show when not at end */}
        {canScrollRight && (
          <div className="flex items-center justify-center gap-2 mt-3 animate-pulse">
            <div className="h-[1px] w-3 bg-white/20" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">
              Scroll
            </span>
            <div className="h-[1px] w-3 bg-white/20" />
          </div>
        )}
      </div>
    </div>
  );
}

