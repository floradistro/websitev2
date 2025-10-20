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

          // Create floating particles - spread out more
          for (let i = 0; i < 25; i++) {
            particles.push({
              x: p.random(p.width),
              y: p.random(p.height),
              vx: p.random(-0.1, 0.1),
              vy: p.random(-0.1, 0.1),
              size: p.random(4, 10),
              offset: p.random(p.TWO_PI),
            });
          }
        };

        p.draw = () => {
          p.clear();
          time += 0.002;

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

          // Draw connections between nearby particles (more visible)
          for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
              let d = p.dist(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
              if (d < 250) {
                let alpha = p.map(d, 0, 250, 20, 0);
                
                // Thick glow line
                p.stroke(255, 255, 255, alpha * 0.25);
                p.strokeWeight(4);
                p.line(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                
                // Medium glow
                p.stroke(255, 255, 255, alpha * 0.4);
                p.strokeWeight(2);
                p.line(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
                
                // Main line
                p.stroke(255, 255, 255, alpha);
                p.strokeWeight(1);
                p.line(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
              }
            }
          }

          // Draw particles with pulsing ring waves
          for (let particle of particles) {
            let pulse = p.sin(time * 0.5 + particle.offset) * 0.5 + 0.5;
            let ringPulse = (time * 0.5 + particle.offset) % (p.TWO_PI);
            
            // Expanding pulse ring
            let ringSize = p.map(p.sin(ringPulse), -1, 1, particle.size * 2, particle.size * 10);
            let ringAlpha = p.map(p.sin(ringPulse), -1, 1, 15, 0);
            
            p.noFill();
            p.stroke(255, 255, 255, ringAlpha);
            p.strokeWeight(2);
            p.circle(particle.x, particle.y, ringSize);
            
            p.strokeWeight(1);
            p.stroke(255, 255, 255, ringAlpha * 0.5);
            p.circle(particle.x, particle.y, ringSize * 1.3);
            
            // Hollow center ring
            p.noFill();
            p.stroke(255, 255, 255, 20 + pulse * 15);
            p.strokeWeight(1.5);
            p.circle(particle.x, particle.y, particle.size * 3);
            
            p.stroke(255, 255, 255, 15 + pulse * 10);
            p.strokeWeight(1);
            p.circle(particle.x, particle.y, particle.size * 5);
            
            // Core glow
            p.noStroke();
            p.fill(255, 255, 255, 8 + pulse * 8);
            p.circle(particle.x, particle.y, particle.size * 2);
            
            // Core dot
            p.fill(255, 255, 255, 40 + pulse * 30);
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

