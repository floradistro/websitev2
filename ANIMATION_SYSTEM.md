# 🎬 Animation System - Wilson's Template

## Libraries Installed

### ✅ Framer Motion
- **Best for:** React animations, page transitions, scroll reveals
- **Version:** Latest
- **Docs:** https://www.framer.com/motion/

### ✅ GSAP (already had it)
- **Best for:** Complex timelines, advanced animations
- **Version:** 3.13.0
- **Docs:** https://gsap.com/

### ✅ React Spring
- **Best for:** Physics-based animations, natural motion
- **Version:** Latest
- **Docs:** https://www.react-spring.dev/

### ✅ React Intersection Observer
- **Best for:** Scroll-triggered animations
- **Version:** Latest

### ✅ Lottie React
- **Best for:** After Effects animations, complex vector animations
- **Version:** Latest
- **Docs:** https://lottiefiles.com/

---

## Quick Start Guide

### 1. **Pre-built Animation Variants**

Import from `lib/animations.ts`:

```tsx
import { fadeInUp, scaleIn, staggerContainer } from '@/lib/animations';
import { motion } from 'framer-motion';

// Use in components
<motion.div
  initial="hidden"
  animate="visible"
  variants={fadeInUp}
>
  Content
</motion.div>
```

**Available variants:**
- `fadeIn`, `fadeInUp`, `fadeInDown`
- `scaleIn`, `scaleInSpring`
- `slideInLeft`, `slideInRight`
- `staggerContainer`, `staggerItem`
- `heroLogoReveal`, `heroTextReveal`, `heroCTA`
- `productCardHover`, `productImageZoom`

---

### 2. **AnimatedSection Component**

Easiest way to add scroll animations:

```tsx
import { AnimatedSection } from '@/components/animations/AnimatedSection';

<AnimatedSection animation="fadeInUp" delay={0.2}>
  <h2>WHY CHOOSE US</h2>
  <p>Premium quality delivered fast</p>
</AnimatedSection>
```

**Props:**
- `animation`: 'fadeIn' | 'fadeInUp' | 'scaleIn' | 'slideInLeft' | etc.
- `delay`: number (seconds)
- `threshold`: 0.1 (trigger when 10% visible)
- `triggerOnce`: true (animate once)

---

### 3. **AnimatedText Component**

Character-by-character reveal (luxury effect):

```tsx
import { AnimatedText } from '@/components/animations/AnimatedText';

<AnimatedText 
  text="FLORA DISTRO"
  className="text-8xl font-black"
  stagger={0.05}
  delay={0.2}
/>
```

---

### 4. **CountUp Component**

Animating numbers (stats sections):

```tsx
import { CountUp } from '@/components/animations/CountUp';

<CountUp 
  value={1000} 
  suffix="+" 
  duration={2}
  className="text-6xl font-black"
/>
```

---

## Examples for Wilson's Homepage

### Hero Logo Animation

```tsx
import { motion } from 'framer-motion';
import { heroLogoReveal } from '@/lib/animations';

<motion.div
  initial="hidden"
  animate="visible"
  variants={heroLogoReveal}
>
  <Image src={vendor.logo_url} alt="Logo" />
</motion.div>
```

### Hero Headline (Character reveal)

```tsx
import { AnimatedText } from '@/components/animations/AnimatedText';

<AnimatedText 
  text="FLORA DISTRO"
  className="text-8xl font-black uppercase"
  stagger={0.04}
/>
```

### Product Grid (Stagger)

```tsx
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';

<motion.div
  variants={staggerContainer}
  initial="hidden"
  animate="visible"
  className="grid grid-cols-4 gap-4"
>
  {products.map(product => (
    <motion.div key={product.id} variants={staggerItem}>
      <ProductCard product={product} />
    </motion.div>
  ))}
</motion.div>
```

### Stats Section (CountUp)

```tsx
<AnimatedSection animation="fadeIn">
  <div className="grid grid-cols-4">
    <div>
      <CountUp value={1000} suffix="+" className="text-6xl" />
      <p>Products</p>
    </div>
    <div>
      <CountUp value={50} suffix="K" className="text-6xl" />
      <p>Customers</p>
    </div>
  </div>
</AnimatedSection>
```

### Button Hover (Luxury)

```tsx
import { motion } from 'framer-motion';

<motion.button
  whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(255,255,255,0.2)' }}
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.3 }}
  className="bg-white text-black px-8 py-4 rounded-2xl"
>
  SHOP NOW
</motion.button>
```

---

## Advanced: GSAP Timeline

For complex multi-step animations:

```tsx
"use client";
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function ComplexAnimation() {
  const containerRef = useRef(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      
      tl.from('.hero-logo', {
        opacity: 0,
        scale: 0.8,
        duration: 1,
        ease: 'power3.out'
      })
      .from('.hero-text', {
        opacity: 0,
        y: 40,
        duration: 0.8,
        stagger: 0.2
      })
      .from('.hero-cta', {
        opacity: 0,
        y: 20,
        duration: 0.6
      });
    }, containerRef);
    
    return () => ctx.revert();
  }, []);
  
  return <div ref={containerRef}>...</div>;
}
```

---

## Performance Tips

1. **Use `triggerOnce: true`** for scroll animations
2. **Limit animations on mobile** - use `@media (prefers-reduced-motion)`
3. **Use `will-change` sparingly**
4. **Lazy load Lottie animations**
5. **Keep GSAP animations simple**

---

## Next Steps

Ready to use! Import any component:

```tsx
import { AnimatedSection } from '@/components/animations/AnimatedSection';
import { AnimatedText } from '@/components/animations/AnimatedText';
import { CountUp } from '@/components/animations/CountUp';
import { fadeInUp, scaleIn } from '@/lib/animations';
```

Start animating your Wilson's template! 🎬

