"use client";

import { useEffect, useRef } from "react";

function GlobalAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sketchRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const loadP5 = async () => {
      const p5 = (await import("p5")).default;

      const sketch = (p: any) => {
        let particles: any[] = [];
        let time = 0;

        p.setup = () => {
          const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
          canvas.parent(containerRef.current);

          // Adjust for mobile - extreme zoom, minimal particles
          const isMobile = p.windowWidth < 768;
          const particleCount = isMobile ? 3 : 25;
          const sizeRange = isMobile ? [80, 150] : [4, 10];

          // Create floating particles - spread out more
          for (let i = 0; i < particleCount; i++) {
            particles.push({
              x: p.random(p.width),
              y: p.random(p.height),
              vx: p.random(-0.1, 0.1),
              vy: p.random(-0.1, 0.1),
              size: p.random(sizeRange[0], sizeRange[1]),
              offset: p.random(p.TWO_PI),
            });
          }
        };

        p.draw = () => {
          p.clear();
          time += 0.002;
          
          const isMobile = p.windowWidth < 768;
          const connectionDistance = isMobile ? 1000 : 250;
          const minDistance = isMobile ? 250 : 100; // Minimum distance between particles

          // Update particle positions
          for (let particle of particles) {
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Wrap around edges
            if (particle.x < 0) particle.x = p.width;
            if (particle.x > p.width) particle.x = 0;
            if (particle.y < 0) particle.y = p.height;
            if (particle.y > p.height) particle.y = 0;
          }

          // Repel overlapping particles
          for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
              let dx = particles[j].x - particles[i].x;
              let dy = particles[j].y - particles[i].y;
              let distance = p.dist(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
              
              if (distance < minDistance && distance > 0) {
                // Push particles apart
                let force = (minDistance - distance) * 0.02;
                let angle = p.atan2(dy, dx);
                
                particles[i].x -= p.cos(angle) * force;
                particles[i].y -= p.sin(angle) * force;
                particles[j].x += p.cos(angle) * force;
                particles[j].y += p.sin(angle) * force;
              }
            }
          }

          // Draw connections between nearby particles (simplified)
          for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
              let d = p.dist(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
              if (d < connectionDistance) {
                let alpha = p.map(d, 0, connectionDistance, isMobile ? 8 : 15, 0);
                
                // Single line with glow
                p.stroke(255, 255, 255, alpha * (isMobile ? 0.15 : 0.3));
                p.strokeWeight(isMobile ? 4 : 2);
                p.line(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
              }
            }
          }

          // Draw particles - simplified with single halo
          for (let particle of particles) {
            let pulse = p.sin(time * 0.5 + particle.offset) * 0.5 + 0.5;
            
            // Single hollow halo ring
            p.noFill();
            p.stroke(255, 255, 255, (15 + pulse * 10) * (isMobile ? 0.5 : 1));
            p.strokeWeight(isMobile ? 3 : 2);
            p.circle(particle.x, particle.y, particle.size * 4);
            
            // Core glow
            p.noStroke();
            p.fill(255, 255, 255, (6 + pulse * 6) * (isMobile ? 0.5 : 1));
            p.circle(particle.x, particle.y, particle.size * 2);
            
            // Core dot
            p.fill(255, 255, 255, (30 + pulse * 20) * (isMobile ? 0.5 : 1));
            p.circle(particle.x, particle.y, particle.size);
          }
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight);
        };
      };

      sketchRef.current = new p5(sketch);
    };

    loadP5();

    return () => {
      if (sketchRef.current) {
        sketchRef.current.remove();
        sketchRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}

export default GlobalAnimation;

