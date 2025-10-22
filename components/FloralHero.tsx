'use client';

import { useEffect, useRef } from 'react';

export default function FloralHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const loadP5 = async () => {
      const p5Module = await import('p5');
      const p5 = p5Module.default;

      const sketch = (p: any) => {
        let petals: Petal[] = [];
        let particles: FlowParticle[] = [];
        let logo: any;
        let canvasWidth: number;
        let canvasHeight: number;
        let time = 0;

        class Petal {
          x: number;
          y: number;
          size: number;
          rotation: number;
          rotationSpeed: number;
          speed: number;
          alpha: number;
          hue: number;
          noiseOffsetX: number;
          noiseOffsetY: number;

          constructor() {
            this.x = p.random(p.width);
            this.y = p.random(-100, -50);
            this.size = p.random(15, 35);
            this.rotation = p.random(p.TWO_PI);
            this.rotationSpeed = p.random(-0.02, 0.02);
            this.speed = p.random(0.5, 1.5);
            this.alpha = p.random(150, 255);
            this.hue = p.random([340, 350, 10, 20, 180, 190, 45, 55]);
            this.noiseOffsetX = p.random(1000);
            this.noiseOffsetY = p.random(1000);
          }

          update() {
            const noiseX = p.noise(this.noiseOffsetX + time * 0.001) * 4 - 2;
            const noiseY = p.noise(this.noiseOffsetY + time * 0.001) * 2 - 1;
            
            this.x += noiseX;
            this.y += this.speed + noiseY;
            this.rotation += this.rotationSpeed;

            if (this.y > p.height + 50) {
              this.y = p.random(-100, -50);
              this.x = p.random(p.width);
            }

            if (this.x < -50) this.x = p.width + 50;
            if (this.x > p.width + 50) this.x = -50;
          }

          display() {
            p.push();
            p.translate(this.x, this.y);
            p.rotate(this.rotation);
            p.noStroke();
            
            for (let i = 0; i < 5; i++) {
              p.fill(this.hue, 70, 90, this.alpha * 0.3);
              p.ellipse(0, 0, this.size, this.size * 1.8);
              p.rotate(p.TWO_PI / 5);
            }
            
            p.fill(this.hue + 20, 80, 95, this.alpha * 0.5);
            p.circle(0, 0, this.size * 0.4);
            p.pop();
          }
        }

        class FlowParticle {
          x: number;
          y: number;
          vx: number;
          vy: number;
          size: number;
          alpha: number;
          hue: number;
          lifespan: number;
          maxLifespan: number;

          constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
            const angle = p.random(p.TWO_PI);
            const speed = p.random(0.5, 2);
            this.vx = p.cos(angle) * speed;
            this.vy = p.sin(angle) * speed;
            this.size = p.random(2, 8);
            this.hue = p.random([340, 350, 10, 20, 180, 190, 45, 55]);
            this.maxLifespan = p.random(100, 200);
            this.lifespan = this.maxLifespan;
            this.alpha = 255;
          }

          update() {
            const noise = p.noise(this.x * 0.005, this.y * 0.005, time * 0.001);
            const angle = noise * p.TWO_PI * 2;
            
            this.vx += p.cos(angle) * 0.05;
            this.vy += p.sin(angle) * 0.05;
            
            this.vx *= 0.98;
            this.vy *= 0.98;
            
            this.x += this.vx;
            this.y += this.vy;
            this.lifespan--;
            this.alpha = p.map(this.lifespan, 0, this.maxLifespan, 0, 255);
          }

          display() {
            p.noStroke();
            p.fill(this.hue, 80, 95, this.alpha * 0.6);
            p.circle(this.x, this.y, this.size);
          }

          isDead() {
            return this.lifespan <= 0;
          }
        }

        p.setup = async () => {
          canvasWidth = containerRef.current?.clientWidth || p.windowWidth;
          canvasHeight = containerRef.current?.clientHeight || p.windowHeight;
          
          const canvas = p.createCanvas(canvasWidth, canvasHeight);
          canvas.parent(containerRef.current!);
          p.colorMode(p.HSB, 360, 100, 100, 255);
          
          logo = await p.loadImage('/yacht-club-logo.png');
          
          for (let i = 0; i < 30; i++) {
            petals.push(new Petal());
          }
        };

        p.draw = () => {
          p.background(0, 0, 85, 255);
          
          time++;
          
          // Flowing gradient overlay
          for (let i = 0; i < p.height; i += 20) {
            const alpha = p.map(i, 0, p.height, 5, 20);
            const hue = p.map(p.sin(time * 0.005 + i * 0.01), -1, 1, 340, 190);
            p.noStroke();
            p.fill(hue, 30, 90, alpha);
            p.rect(0, i, p.width, 20);
          }
          
          // Update and display petals
          for (const petal of petals) {
            petal.update();
            petal.display();
          }
          
          // Add new particles on mouse move
          if (p.frameCount % 3 === 0 && p.mouseX > 0 && p.mouseX < p.width) {
            particles.push(new FlowParticle(p.mouseX, p.mouseY));
          }
          
          // Add random ambient particles
          if (p.frameCount % 20 === 0) {
            const x = p.random(p.width);
            const y = p.random(p.height);
            particles.push(new FlowParticle(x, y));
          }
          
          // Update and display flow particles
          for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].display();
            if (particles[i].isDead()) {
              particles.splice(i, 1);
            }
          }
          
          // Vignette
          p.noStroke();
          for (let i = 0; i < 100; i += 10) {
            p.fill(0, 0, 0, i * 0.3);
            p.rect(0, 0, p.width, p.height);
          }
          
          // Display logo with subtle glow - render last so it's on top
          if (logo) {
            p.push();
            p.translate(p.width / 2, p.height / 2);
            
            const pulse = p.sin(time * 0.02) * 0.03;
            const scale = 0.35 + pulse;
            
            // Add subtle glow effect
            p.drawingContext.shadowBlur = 30;
            p.drawingContext.shadowColor = 'rgba(255, 255, 255, 0.3)';
            
            p.tint(360, 0, 100, 255);
            p.imageMode(p.CENTER);
            p.image(logo, 0, 0, logo.width * scale, logo.height * scale);
            
            p.drawingContext.shadowBlur = 0;
            p.pop();
          }
        };

        p.windowResized = () => {
          try {
            if (!containerRef.current) return;
            const newWidth = containerRef.current.clientWidth;
            const newHeight = containerRef.current.clientHeight;
            
            // Only resize if we have valid dimensions
            if (typeof newWidth === 'number' && typeof newHeight === 'number' &&
                newWidth > 0 && newHeight > 0 && 
                Number.isFinite(newWidth) && Number.isFinite(newHeight)) {
              canvasWidth = newWidth;
              canvasHeight = newHeight;
              p.resizeCanvas(canvasWidth, canvasHeight);
            }
          } catch (e) {
            // Ignore resize errors
          }
        };
      };

      p5Instance.current = new p5(sketch);
    };

    loadP5();

    return () => {
      p5Instance.current?.remove();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
}

