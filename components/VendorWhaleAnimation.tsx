"use client";

import { useEffect, useRef } from "react";

function VendorWhaleAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sketchRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    let isVisible = true;

    // Pause animation when tab is hidden to prevent memory leaks
    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (sketchRef.current) {
        if (isVisible) {
          sketchRef.current.loop();
        } else {
          sketchRef.current.noLoop();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const loadP5 = async () => {
      const p5 = (await import("p5")).default;

      const sketch = (p: any) => {
        let bubbles: any[] = [];
        let time = 0;

        p.setup = () => {
          const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
          canvas.parent(containerRef.current);
          p.frameRate(30); // Limit to 30fps to reduce CPU usage

          // Adjust for mobile - extreme zoom, minimal bubbles
          const isMobile = p.windowWidth < 768;
          const bubbleCount = isMobile ? 4 : 40;
          const sizeRange = isMobile ? [100, 180] : [10, 50];

          // Create floating bubbles
          for (let i = 0; i < bubbleCount; i++) {
            bubbles.push({
              x: p.random(p.width),
              y: p.random(p.height),
              vx: p.random(-0.1, 0.1),
              vy: p.random(-0.3, -0.1), // Float upward
              size: p.random(sizeRange[0], sizeRange[1]),
              wobble: p.random(p.TWO_PI),
              wobbleSpeed: p.random(0.01, 0.03),
              offset: p.random(p.TWO_PI),
            });
          }
        };

        p.draw = () => {
          p.clear();
          time += 0.003;
          
          const isMobile = p.windowWidth < 768;
          const connectionDistance = isMobile ? 800 : 200;

          // Update bubble positions
          for (let bubble of bubbles) {
            // Wobble side to side
            bubble.wobble += bubble.wobbleSpeed;
            bubble.x += bubble.vx + p.sin(bubble.wobble) * 0.3;
            bubble.y += bubble.vy;

            // Wrap around edges
            if (bubble.x < -50) bubble.x = p.width + 50;
            if (bubble.x > p.width + 50) bubble.x = -50;
            if (bubble.y < -100) {
              bubble.y = p.height + 100;
              bubble.x = p.random(p.width);
            }
          }

          // Draw bubbles
          
          for (let bubble of bubbles) {
            let pulse = p.sin(time * 2 + bubble.offset) * 0.5 + 0.5;
            
            // Outer glow layers
            p.noStroke();
            p.fill(255, 255, 255, (2 + pulse * 2) * (isMobile ? 0.3 : 1));
            p.circle(bubble.x, bubble.y, bubble.size * 2.5);
            
            p.fill(255, 255, 255, (4 + pulse * 4) * (isMobile ? 0.3 : 1));
            p.circle(bubble.x, bubble.y, bubble.size * 1.8);

            // Main bubble
            p.fill(255, 255, 255, (8 + pulse * 6) * (isMobile ? 0.3 : 1));
            p.circle(bubble.x, bubble.y, bubble.size);

            // Bubble outline
            p.noFill();
            p.stroke(255, 255, 255, (20 + pulse * 15) * (isMobile ? 0.3 : 1));
            p.strokeWeight(isMobile ? 4 : 1.5);
            p.circle(bubble.x, bubble.y, bubble.size);

            // Inner highlight (makes it look like glass)
            p.stroke(255, 255, 255, (25 + pulse * 20) * (isMobile ? 0.3 : 1));
            p.strokeWeight(isMobile ? 3 : 1);
            p.arc(
              bubble.x - bubble.size * 0.15, 
              bubble.y - bubble.size * 0.15, 
              bubble.size * 0.4, 
              bubble.size * 0.4, 
              p.PI, 
              p.PI + p.HALF_PI
            );

            // Tiny reflection dot
            p.noStroke();
            p.fill(255, 255, 255, 40 + pulse * 30);
            p.circle(bubble.x - bubble.size * 0.2, bubble.y - bubble.size * 0.2, bubble.size * 0.15);
          }

          // Draw wavy connections between nearby bubbles
          for (let i = 0; i < bubbles.length; i++) {
            for (let j = i + 1; j < bubbles.length; j++) {
              let d = p.dist(bubbles[i].x, bubbles[i].y, bubbles[j].x, bubbles[j].y);
              if (d < connectionDistance) {
                let alpha = p.map(d, 0, connectionDistance, isMobile ? 3 : 6, 0);
                p.stroke(255, 255, 255, alpha * (isMobile ? 0.2 : 1));
                p.strokeWeight(isMobile ? 3 : 0.5);
                p.noFill();
                
                // Gentle wavy line
                p.beginShape();
                for (let t = 0; t <= 1; t += 0.1) {
                  let x = p.lerp(bubbles[i].x, bubbles[j].x, t);
                  let y = p.lerp(bubbles[i].y, bubbles[j].y, t);
                  let wave = p.sin(t * p.PI * 3 + time * 2) * (isMobile ? 8 : 5);
                  p.vertex(x + wave, y);
                }
                p.endShape();
              }
            }
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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (sketchRef.current) {
        sketchRef.current.noLoop();
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

export default VendorWhaleAnimation;

