"use client";

import { useEffect, useRef } from "react";

function ProductGridAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sketchRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    const loadP5 = async () => {
      const p5 = (await import("p5")).default;

      const sketch = (p: any) => {
        let gridItems: any[] = [];
        let time = 0;

        p.setup = () => {
          const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
          canvas.parent(containerRef.current);

          // Adjust for mobile - extreme zoom, minimal cards
          const isMobile = p.windowWidth < 768;
          const itemCount = isMobile ? 2 : 20;
          const sizeRange = isMobile 
            ? { w: [280, 400], h: [360, 500] }
            : { w: [60, 120], h: [80, 140] };

          // Create floating grid rectangles (like product cards)
          for (let i = 0; i < itemCount; i++) {
            gridItems.push({
              x: p.random(p.width),
              y: p.random(p.height),
              vx: p.random(-0.15, 0.15),
              vy: p.random(-0.15, 0.15),
              w: p.random(sizeRange.w[0], sizeRange.w[1]),
              h: p.random(sizeRange.h[0], sizeRange.h[1]),
              rotation: p.random(-0.1, 0.1),
              rotationSpeed: p.random(-0.001, 0.001),
              offset: p.random(p.TWO_PI),
            });
          }
        };

        p.draw = () => {
          p.clear();
          time += 0.002;
          
          const isMobile = p.windowWidth < 768;
          const connectionDistance = isMobile ? 0 : 200;

          // Update positions and rotation
          for (let item of gridItems) {
            item.x += item.vx;
            item.y += item.vy;
            item.rotation += item.rotationSpeed;

            // Wrap around edges
            if (item.x < -item.w) item.x = p.width + item.w;
            if (item.x > p.width + item.w) item.x = -item.w;
            if (item.y < -item.h) item.y = p.height + item.h;
            if (item.y > p.height + item.h) item.y = -item.h;
          }

          // Draw connections between nearby items
          
          for (let i = 0; i < gridItems.length; i++) {
            for (let j = i + 1; j < gridItems.length; j++) {
              let d = p.dist(gridItems[i].x, gridItems[i].y, gridItems[j].x, gridItems[j].y);
              if (d < connectionDistance) {
                let alpha = p.map(d, 0, connectionDistance, isMobile ? 6 : 10, 0);
                
                p.stroke(255, 255, 255, alpha * (isMobile ? 0.3 : 0.5));
                p.strokeWeight(isMobile ? 3 : 1);
                p.line(gridItems[i].x, gridItems[i].y, gridItems[j].x, gridItems[j].y);
              }
            }
          }

          // Draw grid items
          for (let item of gridItems) {
            let pulse = p.sin(time + item.offset) * 0.5 + 0.5;
            
            p.push();
            p.translate(item.x, item.y);
            p.rotate(item.rotation);

            // Outer glow
            p.noStroke();
            p.fill(255, 255, 255, (3 + pulse * 3) * (isMobile ? 0.3 : 1));
            p.rect(-item.w/2 - 4, -item.h/2 - 4, item.w + 8, item.h + 8, 4);
            
            // Main rectangle (hollow)
            p.noFill();
            p.stroke(255, 255, 255, (15 + pulse * 10) * (isMobile ? 0.4 : 1));
            p.strokeWeight(isMobile ? 4 : 1.5);
            p.rect(-item.w/2, -item.h/2, item.w, item.h, 2);
            
            // Inner border
            p.stroke(255, 255, 255, (8 + pulse * 5) * (isMobile ? 0.3 : 1));
            p.strokeWeight(isMobile ? 3 : 1);
            p.rect(-item.w/2 + 3, -item.h/2 + 3, item.w - 6, item.h - 6, 1);

            p.pop();
          }
        };

        p.windowResized = () => {
          const newWidth = p.windowWidth;
          const newHeight = p.windowHeight;
          if (newWidth !== p.width || newHeight !== p.height) {
            p.resizeCanvas(newWidth, newHeight);
          }
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
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ 
        zIndex: 0, 
        width: '100vw', 
        height: '100vh',
        willChange: 'transform',
        transform: 'translateZ(0)'
      }}
    />
  );
}

export default ProductGridAnimation;

