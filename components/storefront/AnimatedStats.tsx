"use client";

import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';

export default function AnimatedStats() {
  const [counts, setCounts] = useState({
    locations: 0,
    tested: 0
  });
  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(48);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  // Animate numbers when visible
  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setCounts({
        locations: Math.floor(5 * progress),
        tested: Math.floor(100 * progress)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setCounts({ locations: 5, tested: 100 });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isVisible]);

  // Animate clock countdown
  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const steps = 40;
    const interval = duration / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const currentTime = Math.floor(48 - (48 * progress * 0.2)); // Fluctuate slightly
      
      setTime(currentTime);

      if (currentStep >= steps) {
        clearInterval(timer);
        setTime(48);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [isVisible]);

  return (
    <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {/* Locations */}
      <div className="text-center">
        <div className="text-5xl md:text-6xl font-bold text-white mb-2 tabular-nums">
          {counts.locations}
        </div>
        <div className="text-sm text-neutral-400 uppercase tracking-wider">Retail Locations</div>
      </div>

      {/* Delivery Time with Clock */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock 
            className="w-8 h-8 md:w-10 md:h-10 text-white transition-transform duration-1000" 
            style={{ 
              transform: isVisible ? `rotate(${time * 7.5}deg)` : 'rotate(0deg)'
            }}
          />
          <div className="text-5xl md:text-6xl font-bold text-white tabular-nums">
            &lt;{time}
          </div>
        </div>
        <div className="text-sm text-neutral-400 uppercase tracking-wider">Hour Delivery</div>
      </div>

      {/* Lab Tested */}
      <div className="text-center">
        <div className="text-5xl md:text-6xl font-bold text-white mb-2 tabular-nums">
          {counts.tested}%
        </div>
        <div className="text-sm text-neutral-400 uppercase tracking-wider">Lab Tested</div>
      </div>

      {/* HQ */}
      <div className="text-center">
        <div className="text-5xl md:text-6xl font-bold text-white mb-2">NC</div>
        <div className="text-sm text-neutral-400 uppercase tracking-wider">Headquarters</div>
      </div>
    </div>
  );
}

