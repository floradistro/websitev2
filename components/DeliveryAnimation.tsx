"use client";

import { useEffect, useRef } from "react";

interface Package {
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
  delay: number;
}

export default function DeliveryAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Pause animation when tab is hidden (prevents memory leak)
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    updateSize();
    window.addEventListener("resize", updateSize);

    // Create packages
    const packages: Package[] = [];
    for (let i = 0; i < 8; i++) {
      packages.push({
        x: -50,
        y: (canvas.height / 9) * (i + 1),
        speed: 1 + Math.random() * 1.5,
        size: 15 + Math.random() * 10,
        opacity: 0.1 + Math.random() * 0.3,
        delay: i * 30,
      });
    }

    let frame = 0;

    const animate = () => {
      // Don't animate if tab is hidden or component unmounted
      if (!isMountedRef.current || !isVisibleRef.current) {
        if (isMountedRef.current) {
          animationIdRef.current = requestAnimationFrame(animate);
        }
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      packages.forEach((pkg) => {
        if (frame > pkg.delay) {
          // Move package
          pkg.x += pkg.speed;

          // Reset if off screen
          if (pkg.x > canvas.width + 50) {
            pkg.x = -50;
            pkg.y = Math.random() * canvas.height;
          }

          // Draw package with smooth trail
          ctx.save();
          
          // Trail effect
          const gradient = ctx.createLinearGradient(
            pkg.x - pkg.size * 2,
            pkg.y,
            pkg.x,
            pkg.y
          );
          gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
          gradient.addColorStop(1, `rgba(255, 255, 255, ${pkg.opacity})`);
          
          ctx.fillStyle = gradient;
          ctx.fillRect(pkg.x - pkg.size * 2, pkg.y - 2, pkg.size * 2, 4);

          // Package box
          ctx.fillStyle = `rgba(255, 255, 255, ${pkg.opacity + 0.2})`;
          ctx.fillRect(
            pkg.x - pkg.size / 2,
            pkg.y - pkg.size / 2,
            pkg.size,
            pkg.size
          );

          // Box outline
          ctx.strokeStyle = `rgba(255, 255, 255, ${pkg.opacity + 0.3})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(
            pkg.x - pkg.size / 2,
            pkg.y - pkg.size / 2,
            pkg.size,
            pkg.size
          );

          // Draw cross on box for detail
          ctx.beginPath();
          ctx.moveTo(pkg.x, pkg.y - pkg.size / 2);
          ctx.lineTo(pkg.x, pkg.y + pkg.size / 2);
          ctx.moveTo(pkg.x - pkg.size / 2, pkg.y);
          ctx.lineTo(pkg.x + pkg.size / 2, pkg.y);
          ctx.stroke();

          ctx.restore();
        }
      });

      frame++;
      
      // Only continue animation if component is still mounted
      if (isMountedRef.current) {
        animationIdRef.current = requestAnimationFrame(animate);
      }
    };

    animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("resize", updateSize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.4 }}
    />
  );
}

