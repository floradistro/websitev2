"use client";

import { useEffect, useRef } from 'react';

export default function HeroAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Floating orbs config
    const orbs: Array<{
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      radius: number;
      color: string;
      opacity: number;
      speed: number;
      angle: number;
      blur: number;
    }> = [];

    // Create subtle floating orbs
    const colors = [
      'rgba(255, 255, 255, 0.03)',
      'rgba(255, 255, 255, 0.02)',
      'rgba(255, 255, 255, 0.025)',
    ];

    for (let i = 0; i < 5; i++) {
      const baseX = Math.random() * canvas.width;
      const baseY = Math.random() * canvas.height * 0.7; // Keep in upper 70%
      
      orbs.push({
        x: baseX,
        y: baseY,
        baseX,
        baseY,
        radius: Math.random() * 150 + 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.4 + 0.2,
        speed: Math.random() * 0.0003 + 0.0001,
        angle: Math.random() * Math.PI * 2,
        blur: Math.random() * 40 + 60
      });
    }

    let time = 0;

    const animate = () => {
      time += 1;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw orbs with smooth movement
      orbs.forEach((orb) => {
        // Smooth floating motion (figure-8 pattern)
        orb.x = orb.baseX + Math.sin(orb.angle + time * orb.speed) * 100;
        orb.y = orb.baseY + Math.cos(orb.angle + time * orb.speed * 0.7) * 60;

        // Create gradient for each orb
        const gradient = ctx.createRadialGradient(
          orb.x, orb.y, 0,
          orb.x, orb.y, orb.radius
        );
        
        gradient.addColorStop(0, orb.color);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        // Apply blur effect
        ctx.filter = `blur(${orb.blur}px)`;
        ctx.globalAlpha = orb.opacity;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Reset filter
        ctx.filter = 'none';
        ctx.globalAlpha = 1;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        mixBlendMode: 'screen',
        opacity: 0.4
      }}
    />
  );
}

