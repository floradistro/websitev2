'use client';

import { useEffect, useRef } from 'react';

export default function GrowRoomAnimation() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<any>(null);

  useEffect(() => {
    let p5: any;
    
    const loadP5 = async () => {
      const P5 = (await import('p5')).default;
      
      const sketch = (p: any) => {
        const flowers: any[] = [];
        const particles: any[] = [];
        let growCycle = 0;

        p.setup = () => {
          const canvas = p.createCanvas(p.windowWidth, 500);
          canvas.parent(canvasRef.current);
          p.frameRate(60);
          p.pixelDensity(1);

          // Create floral accents
          const numFlowers = 8;
          for (let i = 0; i < numFlowers; i++) {
            flowers.push({
              x: p.random(p.width),
              y: p.random(p.height * 0.3, p.height),
              size: p.random(15, 30),
              rotation: p.random(p.TWO_PI),
              rotationSpeed: p.random(-0.01, 0.01),
              opacity: p.random(60, 120),
            });
          }

          // Create glowing particles
          for (let i = 0; i < 40; i++) {
            particles.push({
              x: p.random(p.width),
              y: p.random(p.height),
              size: p.random(2, 5),
              speedY: p.random(-0.3, -0.8),
              opacity: p.random(100, 200),
            });
          }
        };

        p.draw = () => {
          p.clear();
          
          // Master grow cycle (0 to 1 loop every 6 seconds)
          growCycle = (p.sin(p.frameCount * 0.01) + 1) / 2;
          
          // Single large grow light centered
          const lightX = p.width / 2;
          const lightY = 50;
          const intensity = growCycle * 0.4 + 0.6;
          
          // Draw massive light cone
          const coneWidth = p.width * 0.4;
          const lightStartY = lightY + 15;
          
          // Main purple/pink light cone
          for (let i = 0; i < 8; i++) {
            const spread = p.map(i, 0, 8, 0, 1);
            const alpha = p.map(i, 0, 8, 160, 15) * intensity;
            
            const coneGradient = p.drawingContext.createLinearGradient(
              lightX, lightStartY,
              lightX, p.height
            );
            coneGradient.addColorStop(0, `rgba(255, 130, 255, ${alpha / 255})`);
            coneGradient.addColorStop(0.25, `rgba(230, 100, 240, ${alpha / 255 * 0.8})`);
            coneGradient.addColorStop(0.5, `rgba(200, 70, 220, ${alpha / 255 * 0.5})`);
            coneGradient.addColorStop(0.75, `rgba(170, 50, 200, ${alpha / 255 * 0.2})`);
            coneGradient.addColorStop(1, `rgba(150, 40, 180, 0)`);
            
            p.drawingContext.fillStyle = coneGradient;
            p.drawingContext.beginPath();
            p.drawingContext.moveTo(lightX - 60, lightStartY);
            p.drawingContext.lineTo(lightX + 60, lightStartY);
            p.drawingContext.lineTo(lightX + coneWidth * (1 + spread * 0.3), p.height);
            p.drawingContext.lineTo(lightX - coneWidth * (1 + spread * 0.3), p.height);
            p.drawingContext.closePath();
            p.drawingContext.fill();
          }
          
          // Volumetric light beams
          p.drawingContext.save();
          p.drawingContext.globalAlpha = intensity * 0.35;
          
          for (let b = -2; b <= 2; b++) {
            const beamAngle = b * 0.1;
            const beamGradient = p.drawingContext.createLinearGradient(
              lightX, lightStartY,
              lightX + p.sin(beamAngle) * p.height, p.height
            );
            beamGradient.addColorStop(0, 'rgba(255, 150, 255, 0.7)');
            beamGradient.addColorStop(0.4, 'rgba(220, 110, 230, 0.4)');
            beamGradient.addColorStop(0.7, 'rgba(190, 80, 210, 0.2)');
            beamGradient.addColorStop(1, 'rgba(160, 60, 190, 0)');
            
            p.drawingContext.fillStyle = beamGradient;
            p.drawingContext.beginPath();
            p.drawingContext.moveTo(lightX - 20, lightStartY);
            p.drawingContext.lineTo(lightX + 20, lightStartY);
            
            const endX = lightX + p.sin(beamAngle) * p.height;
            p.drawingContext.lineTo(endX + 80, p.height);
            p.drawingContext.lineTo(endX - 80, p.height);
            p.drawingContext.closePath();
            p.drawingContext.fill();
          }
          
          p.drawingContext.restore();
          
          // Large light fixture
          p.fill(255, 160, 255, 240);
          p.noStroke();
          p.rect(lightX - 80, lightY - 10, 160, 20, 5);
          p.fill(240, 130, 250, 200);
          p.rect(lightX - 70, lightY - 7, 140, 14, 4);
          
          // Light bulb glow
          p.fill(255, 180, 255, 200 * intensity);
          p.circle(lightX, lightY, 30);

          // Draw floating particles
          particles.forEach((particle: any) => {
            p.noStroke();
            p.fill(150, 255, 180, particle.opacity);
            p.circle(particle.x, particle.y, particle.size);
            
            particle.y += particle.speedY;
            if (particle.y < 0) {
              particle.y = p.height;
              particle.x = p.random(p.width);
            }
          });



          // Ultra-smooth blend at bottom - covers entire bottom half
          const fadeStart = p.height * 0.4;
          const bottomBlend = p.drawingContext.createLinearGradient(0, fadeStart, 0, p.height);
          bottomBlend.addColorStop(0, 'rgba(181, 181, 178, 0)');
          bottomBlend.addColorStop(0.15, 'rgba(181, 181, 178, 0.05)');
          bottomBlend.addColorStop(0.3, 'rgba(181, 181, 178, 0.15)');
          bottomBlend.addColorStop(0.45, 'rgba(181, 181, 178, 0.3)');
          bottomBlend.addColorStop(0.6, 'rgba(181, 181, 178, 0.5)');
          bottomBlend.addColorStop(0.75, 'rgba(181, 181, 178, 0.75)');
          bottomBlend.addColorStop(0.9, 'rgba(181, 181, 178, 0.95)');
          bottomBlend.addColorStop(1, 'rgba(181, 181, 178, 1)');
          
          p.drawingContext.fillStyle = bottomBlend;
          p.rect(0, fadeStart, p.width, p.height - fadeStart);

          // Draw floating particles
          particles.forEach((particle: any) => {
            p.noStroke();
            p.fill(150, 255, 180, particle.opacity);
            p.circle(particle.x, particle.y, particle.size);
            
            particle.y += particle.speedY;
            if (particle.y < 0) {
              particle.y = p.height;
              particle.x = p.random(p.width);
            }
          });


          // Draw floral elements
          flowers.forEach((flower: any) => {
            flower.rotation += flower.rotationSpeed;
            
            p.push();
            p.translate(flower.x, flower.y);
            p.rotate(flower.rotation);
            
            // Simple floral shape with green glow
            p.fill(100, 255, 150, flower.opacity);
            p.noStroke();
            for (let i = 0; i < 5; i++) {
              const angle = (p.TWO_PI / 5) * i;
              p.push();
              p.rotate(angle);
              p.ellipse(flower.size * 0.6, 0, flower.size * 0.8, flower.size * 0.4);
              p.pop();
            }
            
            // Center
            p.fill(150, 255, 180, flower.opacity * 1.2);
            p.circle(0, 0, flower.size * 0.3);
            
            p.pop();
          });
        };

        p.windowResized = () => {
          p.resizeCanvas(p.windowWidth, 500);
        };
      };

      if (canvasRef.current) {
        p5 = new P5(sketch);
        p5Instance.current = p5;
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
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ width: '100%', height: '100%', opacity: 0.9 }}
    />
  );
}

