"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export default function LuxuryHero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="relative h-auto sm:min-h-[100svh] flex items-center justify-center bg-[#1a1a1a] text-white px-4 sm:px-6 overflow-hidden py-20 sm:py-0">
      {/* Animated gradient orbs - Responsive sizes */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main gradient orb 1 */}
        <div 
          className="absolute w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] lg:w-[600px] lg:h-[600px] rounded-full opacity-20 blur-3xl animate-float"
          style={{
            background: "radial-gradient(circle, rgba(88, 88, 88, 0.4) 0%, transparent 70%)",
            top: "10%",
            left: "5%",
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />
        
        {/* Main gradient orb 2 */}
        <div 
          className="absolute w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] lg:w-[500px] lg:h-[500px] rounded-full opacity-15 blur-3xl animate-float-delayed"
          style={{
            background: "radial-gradient(circle, rgba(120, 120, 120, 0.3) 0%, transparent 70%)",
            bottom: "15%",
            right: "5%",
            transform: `translate(${-mousePosition.x * 0.015}px, ${-mousePosition.y * 0.015}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />

        {/* Accent orb 3 */}
        <div 
          className="absolute w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] lg:w-[400px] lg:h-[400px] rounded-full opacity-10 blur-2xl animate-float-slow"
          style={{
            background: "radial-gradient(circle, rgba(100, 100, 100, 0.35) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />
      </div>

      {/* Animated grid lines */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }} />
      </div>

      {/* Subtle scan line effect */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-transparent h-[200px] animate-scan" />
      </div>

      {/* Main content */}
      <div className="relative z-20 text-center max-w-6xl mx-auto px-4 w-full">
        {/* Small accent line above - Hidden on mobile for space */}
        <div className="hidden sm:flex items-center justify-center mb-8 animate-fadeInDown" style={{ animationDelay: "0.2s", animationFillMode: "forwards", opacity: 0 }}>
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
        </div>

        {/* Main heading - Mobile optimized with tighter spacing */}
        <h1 
          className="logo-font text-5xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[14rem] font-normal uppercase tracking-tight mb-4 sm:mb-8 leading-none premium-text animate-fadeInUp"
          style={{ animationDelay: "0.4s", animationFillMode: "forwards", opacity: 0 }}
        >
          Flora Distro
        </h1>
        
        {/* Divider - Smaller on mobile */}
        <div 
          className="h-[1px] w-20 sm:w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-4 sm:mb-8 animate-scaleIn"
          style={{ animationDelay: "0.6s", animationFillMode: "forwards", opacity: 0 }}
        />
        
        {/* Subtitle - Mobile optimized with tighter spacing */}
        <p 
          className="text-sm sm:text-base md:text-lg lg:text-xl font-light text-white/50 mb-8 sm:mb-12 tracking-[0.12em] sm:tracking-[0.15em] max-w-2xl mx-auto animate-fadeInUp px-2"
          style={{ animationDelay: "0.8s", animationFillMode: "forwards", opacity: 0 }}
        >
          Quality at every scale
        </p>

        {/* CTA Button - Mobile optimized */}
        <div 
          className="animate-fadeInUp mb-20 sm:mb-0"
          style={{ animationDelay: "1s", animationFillMode: "forwards", opacity: 0 }}
        >
          <Link
            href="/products"
            className="group inline-flex items-center gap-2 sm:gap-3 bg-black text-white px-8 sm:px-10 md:px-12 py-3.5 sm:py-4 md:py-5 text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.3em] hover:bg-black/70 transition-all duration-500 font-medium border border-white/20 hover:border-white/40 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] relative overflow-hidden"
          >
            {/* Button shine effect */}
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="relative z-10">Explore Products</span>
            <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </div>

      {/* Scroll indicator - Mobile optimized */}
      <div 
        className="absolute bottom-6 sm:bottom-12 left-1/2 -translate-x-1/2 animate-fadeIn z-30"
        style={{ animationDelay: "1.4s", animationFillMode: "forwards", opacity: 0 }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-white/30">Scroll</span>
          <div className="w-[1px] h-10 sm:h-16 bg-gradient-to-b from-white/20 via-white/40 to-transparent animate-pulse" />
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#2a2a2a] to-transparent pointer-events-none" />
    </section>
  );
}

