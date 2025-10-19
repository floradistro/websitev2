"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

function ShippingAnimationComponent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let p5Instance: any;

    const loadP5 = async () => {
      const p5 = (await import("p5")).default;

      const sketch = (p: any) => {
        let nodes: any[] = [];

        p.setup = () => {
          const canvas = p.createCanvas(600, 600);
          canvas.parent(containerRef.current);

          // Create network nodes
          for (let i = 0; i < 6; i++) {
            let angle = (p.TWO_PI / 6) * i;
            let radius = 150;
            nodes.push({
              x: p.width / 2 + p.cos(angle) * radius,
              y: p.height / 2 + p.sin(angle) * radius,
              pulse: p.random(p.TWO_PI),
            });
          }

          // Center node
          nodes.push({
            x: p.width / 2,
            y: p.height / 2,
            pulse: 0,
          });
        };

        p.draw = () => {
          p.clear();

          // Draw connections
          p.stroke(255, 255, 255, 10);
          p.strokeWeight(1);
          for (let i = 0; i < nodes.length - 1; i++) {
            p.line(nodes[i].x, nodes[i].y, nodes[nodes.length - 1].x, nodes[nodes.length - 1].y);
          }

          // Draw nodes
          p.noFill();
          for (let i = 0; i < nodes.length; i++) {
            let node = nodes[i];
            let isCenter = i === nodes.length - 1;
            let pulseSize = p.sin(p.frameCount * 0.02 + node.pulse) * 4;

            p.stroke(255, 255, 255, 20);
            p.strokeWeight(1);
            p.circle(node.x, node.y, (isCenter ? 40 : 30) + pulseSize);
            
            p.stroke(255, 255, 255, 10);
            p.circle(node.x, node.y, (isCenter ? 60 : 50) + pulseSize);
          }
        };

        p.windowResized = () => {
          if (containerRef.current) {
            const size = Math.min(containerRef.current.offsetWidth, 600);
            p.resizeCanvas(size, size);
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
      className="w-full h-full flex items-center justify-center opacity-[0.08]"
    />
  );
}

export default dynamic(() => Promise.resolve(ShippingAnimationComponent), {
  ssr: false,
});

