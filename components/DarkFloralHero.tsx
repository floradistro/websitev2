'use client';

import { useEffect, useRef } from 'react';

export default function DarkFloralHero() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<any>(null);

  useEffect(() => {
    let p5: any;
    
    const loadP5 = async () => {
      const P5 = (await import('p5')).default;
      
      const sketch = (p: any) => {
        const flowers: any[] = [];
        const particles: any[] = [];

        p.setup = () => {
          const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
          canvas.parent(canvasRef.current);
          p.frameRate(60);
          p.pixelDensity(1); // Lower pixel density for better performance
          console.log('p5.js canvas created:', p.width, 'x', p.height);
          
          // Create multiple flowers growing from bottom - reduced count
          const numFlowers = 5;
          for (let i = 0; i < numFlowers; i++) {
            flowers.push({
              x: p.map(i, 0, numFlowers - 1, p.width * 0.15, p.width * 0.85),
              baseY: p.height,
              growth: 0,
              maxGrowth: p.random(p.height * 0.45, p.height * 0.65),
              speed: p.random(1, 2),
              angle: p.random(-0.3, 0.3),
              petalSize: p.random(25, 45),
              petalCount: p.floor(p.random(5, 7)),
              hue: p.random(0, 360),
              opacity: 220,
              rotation: p.random(0, p.TWO_PI),
              rotationSpeed: p.random(-0.015, 0.015),
            });
          }

          // Create floating particles - reduced count
          for (let i = 0; i < 30; i++) {
            particles.push({
              x: p.random(p.width),
              y: p.random(p.height),
              size: p.random(1.5, 3),
              speedY: p.random(-0.8, -0.2),
              opacity: p.random(150, 220),
            });
          }
        };

        p.draw = () => {
          // Transparent background
          p.clear();

          // Draw floating particles - bright white for visibility
          particles.forEach((particle: any) => {
            p.noStroke();
            p.fill(255, 255, 255, 200);
            p.circle(particle.x, particle.y, particle.size * 2);
            
            particle.y += particle.speedY;
            if (particle.y < 0) {
              particle.y = p.height;
              particle.x = p.random(p.width);
            }
          });

          // Draw growing flowers - bright for visibility
          flowers.forEach((flower: any) => {
            if (flower.growth < flower.maxGrowth) {
              flower.growth += flower.speed;
            }

            flower.rotation += flower.rotationSpeed;

            p.push();
            p.translate(flower.x, flower.baseY);
            
            // Draw stem - simplified for performance
            p.stroke(255, 255, 255, 200);
            p.strokeWeight(3);
            p.noFill();
            for (let i = 0; i < flower.growth - 10; i += 10) {
              const x1 = p.sin(i * 0.02 + flower.angle) * 15;
              const y1 = -i;
              const x2 = p.sin((i + 10) * 0.02 + flower.angle) * 15;
              const y2 = -(i + 10);
              p.line(x1, y1, x2, y2);
            }

            // Draw flower head at top of stem
            if (flower.growth >= flower.maxGrowth * 0.7) {
              const stemX = p.sin(flower.growth * 0.02 + flower.angle) * 15;
              const stemY = -flower.growth;
              
              p.translate(stemX, stemY);
              p.rotate(flower.rotation);

              // Draw petals - bright and visible
              p.colorMode(p.HSB);
              for (let i = 0; i < flower.petalCount; i++) {
                const angle = (p.TWO_PI / flower.petalCount) * i;
                const petalGrowth = p.constrain((flower.growth - flower.maxGrowth * 0.7) / (flower.maxGrowth * 0.3), 0, 1);
                
                p.push();
                p.rotate(angle);
                p.noStroke();
                p.fill(flower.hue, 50, 100, 220 * petalGrowth);
                p.ellipse(flower.petalSize * petalGrowth, 0, flower.petalSize * 1.8 * petalGrowth, flower.petalSize * 1 * petalGrowth);
                p.pop();
              }

              // Draw center - bright
              p.fill(flower.hue, 60, 80, 230);
              p.circle(0, 0, flower.petalSize * 0.5);
              p.colorMode(p.RGB);
            }

            p.pop();
          });
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, p.windowHeight);
        };
      };

      if (canvasRef.current) {
        p5 = new P5(sketch);
        p5Instance.current = p5;
        console.log('p5.js instance created');
      }
    };

    loadP5();

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove();
      }
    };
  }, []);

  return (
    <div 
      ref={canvasRef} 
      className="absolute inset-0 z-10 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

