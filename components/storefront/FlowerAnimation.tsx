"use client";

import { useEffect, useRef } from 'react';

export default function FlowerAnimation() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<any>(null);

  useEffect(() => {
    let p5: any;

    const loadP5 = async () => {
      // Dynamically import p5.js
      const P5 = (await import('p5')).default;

      const sketch = (p: any) => {
        let flowers: any[] = [];
        const maxFlowers = 6;
        const flowerColors = [
          { hue: 0, sat: 75, bri: 90 },     // Red
          { hue: 220, sat: 80, bri: 85 },   // Blue
          { hue: 50, sat: 65, bri: 80 }     // Yellow - less intense
        ];

        class Flower {
          x: number;
          y: number;
          size: number;
          growth: number;
          maxGrowth: number;
          growthSpeed: number;
          petals: number;
          rotation: number;
          rotationSpeed: number;
          stemHeight: number;
          stemGrowth: number;
          color: { hue: number; sat: number; bri: number };

          constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
            this.size = p.random(20, 35);
            this.growth = 0;
            this.maxGrowth = 1;
            this.growthSpeed = p.random(0.004, 0.01);
            this.petals = p.floor(p.random(6, 9));
            this.rotation = p.random(p.TWO_PI);
            this.rotationSpeed = p.random(-0.0003, 0.0003);
            this.stemHeight = p.random(60, 100);
            this.stemGrowth = 0;
            // Random color from our palette (red, blue, yellow)
            this.color = p.random(flowerColors);
          }

          update() {
            if (this.stemGrowth < 1) {
              this.stemGrowth += this.growthSpeed * 1.5;
            } else if (this.growth < this.maxGrowth) {
              this.growth += this.growthSpeed;
            }
            this.rotation += this.rotationSpeed;
          }

          display() {
            p.push();
            p.translate(this.x, this.y);

            // Stem - more defined and darker
            if (this.stemGrowth > 0) {
              p.stroke(140, 140, 140, 150);
              p.strokeWeight(3);
              p.noFill();
              const currentStemHeight = this.stemHeight * this.stemGrowth;
              p.beginShape();
              for (let i = 0; i <= 15; i++) {
                const yPos = -i * (currentStemHeight / 15);
                const xOffset = p.sin(i * 0.4 + p.frameCount * 0.01) * 4;
                p.vertex(xOffset, yPos);
              }
              p.endShape();
              
              // Add subtle leaves
              if (this.stemGrowth > 0.5) {
                p.fill(120, 120, 120, 100);
                p.noStroke();
                const midPoint = -currentStemHeight * 0.4;
                p.ellipse(5, midPoint, 8, 15);
                p.ellipse(-5, midPoint - 10, 8, 15);
              }
            }

            // Flower (only draw when stem is grown)
            if (this.stemGrowth >= 1 && this.growth > 0) {
              p.translate(0, -this.stemHeight);
              p.rotate(this.rotation);

              // Petals - Hollow with colored borders
              for (let i = 0; i < this.petals; i++) {
                p.push();
                p.rotate((p.TWO_PI / this.petals) * i);
                
                const petalSize = this.size * this.growth;
                const petalLength = petalSize * 1.3;
                
                // Hollow petal - only stroke (border)
                p.noFill();
                p.stroke(this.color.hue, this.color.sat, this.color.bri, 220 * this.growth);
                p.strokeWeight(2.5);
                
                // Petal shape
                p.ellipse(petalLength * 0.5, 0, petalLength, petalSize * 0.8);
                
                p.pop();
              }

              // Center - hollow circle with colored border
              p.noFill();
              p.stroke(this.color.hue, this.color.sat, this.color.bri, 240 * this.growth);
              p.strokeWeight(2);
              p.circle(0, 0, this.size * 0.6 * this.growth);
            }

            p.pop();
          }
        }

        p.setup = () => {
          const canvas = p.createCanvas(p.windowWidth, 300);
          canvas.parent(canvasRef.current!);
          p.colorMode(p.HSB, 360, 100, 100, 255);
          p.frameRate(30);

          // Create flowers with completely random spacing
          const positions: number[] = [];
          
          for (let i = 0; i < maxFlowers; i++) {
            let x, tooClose;
            let attempts = 0;
            
            // Keep trying until we find a position with good spacing
            do {
              x = p.random(100, p.width - 100);
              tooClose = positions.some(pos => Math.abs(pos - x) < 120);
              attempts++;
            } while (tooClose && attempts < 50);
            
            positions.push(x);
            const y = p.random(p.height - 60, p.height - 10);
            flowers.push(new Flower(x, y));
          }
        };

        p.draw = () => {
          p.clear();
          
          // Update and display flowers
          for (let flower of flowers) {
            flower.update();
            flower.display();
          }

          // Occasionally add new flowers with good spacing
          if (p.frameCount % 400 === 0 && flowers.length < maxFlowers + 2) {
            let x;
            let tooClose = true;
            let attempts = 0;
            
            while (tooClose && attempts < 50) {
              x = p.random(100, p.width - 100);
              tooClose = flowers.some(f => Math.abs(f.x - x) < 120);
              attempts++;
            }
            
            if (!tooClose) {
              const y = p.random(p.height - 60, p.height - 10);
              flowers.push(new Flower(x, y));
              
              // Remove oldest if too many
              if (flowers.length > maxFlowers + 2) {
                flowers.shift();
              }
            }
          }
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, 300);
        };
      };

      p5 = new P5(sketch);
      p5InstanceRef.current = p5;
    };

    loadP5();

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
      }
    };
  }, []);

  return (
    <div 
      ref={canvasRef} 
      className="w-full h-[300px] relative"
      style={{ 
        opacity: 0.6,
        mixBlendMode: 'screen'
      }}
    />
  );
}

