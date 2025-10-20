"use client";

import { useEffect, useState, useRef } from "react";
import { RotateCcw } from "lucide-react";

export default function PullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);

  useEffect(() => {
    let startY = 0;
    let currentY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        touchStartY.current = startY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && startY > 0) {
        currentY = e.touches[0].clientY;
        const distance = currentY - startY;
        
        if (distance > 0) {
          // Dampen the pull effect
          const dampened = Math.min(distance * 0.5, 120);
          setPullDistance(dampened);
        }
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance > 80) {
        // Trigger refresh
        setIsRefreshing(true);
        
        // Reload the page after animation
        setTimeout(() => {
          window.location.reload();
        }, 400);
      }
      
      setPullDistance(0);
      startY = 0;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance]);

  const opacity = Math.min(pullDistance / 80, 1);
  const rotation = pullDistance * 3;

  return (
    <div 
      className="fixed top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-[100]"
      style={{ 
        height: `${pullDistance}px`,
        opacity: opacity,
        transition: pullDistance === 0 ? 'all 0.3s ease-out' : 'none'
      }}
    >
      <div 
        className="relative"
        style={{ 
          transform: `translateY(${Math.min(pullDistance - 30, 40)}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none'
        }}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-white/10 rounded-full blur-xl" />
        
        {/* Icon */}
        <RotateCcw 
          size={24} 
          className="text-white relative z-10"
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none'
          }}
        />
        
        {/* Pulsing ring when ready */}
        {pullDistance > 80 && (
          <div className="absolute inset-0 -m-4">
            <div className="w-12 h-12 border-2 border-white/30 rounded-full animate-ping" />
          </div>
        )}
      </div>
    </div>
  );
}

