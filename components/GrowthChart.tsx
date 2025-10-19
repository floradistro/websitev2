"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

function GrowthChartComponent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let p5Instance: any;

    const loadP5 = async () => {
      const p5 = (await import("p5")).default;

      const sketch = (p: any) => {
        let dataPoints: number[] = [];
        let smoothPoints: any[] = [];

        p.setup = () => {
          const canvas = p.createCanvas(500, 400);
          canvas.parent(containerRef.current);

          // Generate growth data
          for (let i = 0; i < 12; i++) {
            dataPoints.push(30 + p.pow(i * 0.7, 1.6) * 6);
          }

          // Create smooth curve points
          for (let i = 0; i < dataPoints.length; i++) {
            let x = p.map(i, 0, dataPoints.length - 1, 60, p.width - 60);
            let y = p.map(dataPoints[i], 0, 100, p.height - 60, 60);
            smoothPoints.push({ x, y });
          }
        };

        p.draw = () => {
          p.clear();

          // Draw grid
          p.stroke(255, 255, 255, 8);
          p.strokeWeight(1);
          for (let i = 0; i < 5; i++) {
            let y = p.map(i, 0, 4, p.height - 60, 60);
            p.line(60, y, p.width - 60, y);
          }

          // Draw smooth curve
          p.noFill();
          p.stroke(255, 255, 255, 25);
          p.strokeWeight(2);
          p.beginShape();
          p.curveVertex(smoothPoints[0].x, smoothPoints[0].y);
          for (let point of smoothPoints) {
            p.curveVertex(point.x, point.y);
          }
          let lastPoint = smoothPoints[smoothPoints.length - 1];
          p.curveVertex(lastPoint.x, lastPoint.y);
          p.endShape();

          // Draw nodes
          for (let i = 0; i < smoothPoints.length; i++) {
            let point = smoothPoints[i];
            
            p.noFill();
            p.stroke(255, 255, 255, 15);
            p.strokeWeight(1);
            p.circle(point.x, point.y, 10);
          }
        };

        p.windowResized = () => {
          if (containerRef.current) {
            p.resizeCanvas(containerRef.current.offsetWidth, 400);
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
      className="w-full h-[400px] opacity-[0.08]"
    />
  );
}

export default dynamic(() => Promise.resolve(GrowthChartComponent), {
  ssr: false,
});

