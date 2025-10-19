"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

function FireAnimationComponent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let p5Instance: any;

    const loadP5 = async () => {
      const p5 = (await import("p5")).default;

      const sketch = (p: any) => {
        let lines: any[] = [];

        p.setup = () => {
          const canvas = p.createCanvas(800, 600);
          canvas.parent(containerRef.current);
          
          // Create flowing vertical lines
          for (let i = 0; i < 15; i++) {
            lines.push({
              x: (p.width / 16) * (i + 1),
              offset: p.random(p.TWO_PI),
              speed: p.random(0.005, 0.015),
            });
          }
        };

        p.draw = () => {
          p.clear();
          
          p.stroke(255, 255, 255, 8);
          p.strokeWeight(1);
          p.noFill();

          // Draw flowing sine waves vertically
          for (let line of lines) {
            p.beginShape();
            for (let y = 0; y < p.height; y += 5) {
              let wave = p.sin(y * 0.02 + p.frameCount * line.speed + line.offset) * 30;
              p.vertex(line.x + wave, y);
            }
            p.endShape();
          }
        };

        p.windowResized = () => {
          if (containerRef.current) {
            p.resizeCanvas(containerRef.current.offsetWidth, 600);
          }
        };
      };

      p5Instance = new p5(sketch);
    };

    loadP5();

    return () => {
      if (p5Instance) {
        p5Instance.remove();
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full opacity-10"
    />
  );
}

export default dynamic(() => Promise.resolve(FireAnimationComponent), {
  ssr: false,
});

