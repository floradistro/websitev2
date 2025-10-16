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
    <section className="relative min-h-screen flex items-center justify-center bg-[#1a1a1a] text-white px-4 overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main gradient orb 1 */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl animate-float"
          style={{
            background: "radial-gradient(circle, rgba(88, 88, 88, 0.4) 0%, transparent 70%)",
            top: "10%",
            left: "10%",
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />
        
        {/* Main gradient orb 2 */}
        <div 
          className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-3xl animate-float-delayed"
          style={{
            background: "radial-gradient(circle, rgba(120, 120, 120, 0.3) 0%, transparent 70%)",
            bottom: "15%",
            right: "15%",
            transform: `translate(${-mousePosition.x * 0.015}px, ${-mousePosition.y * 0.015}px)`,
            transition: "transform 0.3s ease-out",
          }}
        />

        {/* Accent orb 3 */}
        <div 
          className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-2xl animate-float-slow"
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
      <div className="relative z-20 text-center max-w-6xl mx-auto">
        {/* Small accent line above */}
        <div className="flex items-center justify-center mb-8 animate-fadeInDown" style={{ animationDelay: "0.2s", animationFillMode: "forwards", opacity: 0 }}>
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
        </div>

        {/* Main heading */}
        <h1 
          className="logo-font text-8xl md:text-9xl lg:text-[14rem] font-normal uppercase tracking-tight mb-8 leading-none premium-text animate-fadeInUp"
          style={{ animationDelay: "0.4s", animationFillMode: "forwards", opacity: 0 }}
        >
          Flora Distro
        </h1>
        
        {/* Divider */}
        <div 
          className="h-[1px] w-32 bg-gradient-to-r from-transparent via-white/30 to-transparent mx-auto mb-8 animate-scaleIn"
          style={{ animationDelay: "0.6s", animationFillMode: "forwards", opacity: 0 }}
        />
        
        {/* Subtitle */}
        <p 
          className="text-lg md:text-xl font-light text-white/50 mb-12 tracking-[0.15em] max-w-2xl mx-auto animate-fadeInUp"
          style={{ animationDelay: "0.8s", animationFillMode: "forwards", opacity: 0 }}
        >
          Quality at every scale
        </p>

        {/* CTA Button */}
        <div 
          className="animate-fadeInUp"
          style={{ animationDelay: "1s", animationFillMode: "forwards", opacity: 0 }}
        >
          <Link
            href="/products"
            className="group inline-flex items-center space-x-3 bg-black text-white px-12 py-5 text-xs uppercase tracking-[0.3em] hover:bg-black/70 transition-all duration-500 font-medium border border-white/20 hover:border-white/40 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] relative overflow-hidden"
          >
            {/* Button shine effect */}
            <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="relative z-10">Explore Products</span>
            <ArrowRight size={14} className="relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div 
        className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-fadeIn z-30"
        style={{ animationDelay: "1.4s", animationFillMode: "forwards", opacity: 0 }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">Scroll</span>
          <div className="w-[1px] h-16 bg-gradient-to-b from-white/20 via-white/40 to-transparent animate-pulse" />
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#2a2a2a] to-transparent pointer-events-none" />
    </section>
  );
}

