"use client";

import { useRef, useEffect, ReactNode, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
}

export default function HorizontalScroll({ children, className = "" }: HorizontalScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const scrollLeft = useRef(0);
  const hasMoved = useRef(false);
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

    const isDesktop = window.innerWidth >= 768;
    const DRAG_THRESHOLD = 5; // pixels of movement before it's considered a drag

    // Touch start handler
    const handleTouchStart = (e: TouchEvent) => {
      if (isDesktop) return;
      const touch = e.touches[0];
      startX.current = touch.pageX;
      startY.current = touch.pageY;
      scrollLeft.current = container.scrollLeft;
      hasMoved.current = false;
    };

    // Touch move handler
    const handleTouchMove = (e: TouchEvent) => {
      if (isDesktop || !e.touches[0]) return;
      
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.pageX - startX.current);
      const deltaY = Math.abs(touch.pageY - startY.current);
      
      // Only prevent default if horizontal scroll is dominant
      if (deltaX > deltaY && deltaX > DRAG_THRESHOLD) {
        e.preventDefault();
        hasMoved.current = true;
        const x = touch.pageX;
        const walk = (startX.current - x) * 1.5;
        container.scrollLeft = scrollLeft.current + walk;
      }
    };

    // Touch end handler
    const handleTouchEnd = () => {
      hasMoved.current = false;
    };

    // Mouse wheel horizontal scroll - disabled on desktop
    const handleWheel = (e: WheelEvent) => {
      if (!isDesktop && Math.abs(e.deltaY) > 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    // Drag to scroll with mouse - disabled on desktop
    const handleMouseDown = (e: MouseEvent) => {
      if (isDesktop) return;
      
      // Don't interfere with clicks on interactive elements
      const target = e.target as HTMLElement;
      if (target.closest('a') || target.closest('button') || target.closest('select')) {
        return;
      }
      
      isDragging.current = true;
      hasMoved.current = false;
      startX.current = e.pageX;
      startY.current = e.pageY;
      scrollLeft.current = container.scrollLeft;
      container.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      
      const deltaX = Math.abs(e.pageX - startX.current);
      const deltaY = Math.abs(e.pageY - startY.current);
      
      // Only start dragging if moved beyond threshold
      if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
        hasMoved.current = true;
      }
      
      if (hasMoved.current && deltaX > deltaY) {
        e.preventDefault();
        const x = e.pageX;
        const walk = (startX.current - x) * 1.5;
        container.scrollLeft = scrollLeft.current + walk;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      // If we didn't move much, it's a click - let it through
      if (!hasMoved.current) {
        const target = e.target as HTMLElement;
        const clickableElement = target.closest('a') || target.closest('button');
        if (clickableElement) {
          (clickableElement as HTMLElement).click();
        }
      }
      
      isDragging.current = false;
      hasMoved.current = false;
      container.style.cursor = isDesktop ? 'default' : 'grab';
    };

    const handleMouseLeave = () => {
      isDragging.current = false;
      hasMoved.current = false;
      container.style.cursor = isDesktop ? 'default' : 'grab';
    };

    const handleScroll = () => {
      updateScrollButtons();
    };

    // Add touch event listeners for mobile
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    if (!isDesktop) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('mousedown', handleMouseDown);
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('mouseleave', handleMouseLeave);
    }
    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseLeave);
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
    <div className="relative group">
      {/* Left Arrow - Desktop Only */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100"
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
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white transition-all duration-200 opacity-0 group-hover:opacity-100"
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

