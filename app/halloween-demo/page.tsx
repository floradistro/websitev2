"use client";

/**
 * Halloween Demo Page - Testing WCL Quantum Fix
 * Shows Flora Distro Halloween homepage with behavioral quantum states
 */

import { useEffect } from 'react';
import { FloraDistroHalloweenHomepage } from '@/components/component-registry/smart/FloraDistroHalloweenHomepage';
import { useSearchParams } from 'next/navigation';

export default function HalloweenDemoPage() {
  const searchParams = useSearchParams();
  const isClickable = searchParams?.get('clickable') === 'true';

  // Enable clickable elements in preview mode
  useEffect(() => {
    if (!isClickable) return;

    // Add hover effect to show elements are clickable
    const style = document.createElement('style');
    style.textContent = `
      * { cursor: pointer !important; }
      *:hover { outline: 2px solid rgba(168, 85, 247, 0.4) !important; outline-offset: 2px; }
    `;
    document.head.appendChild(style);

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Detect what was clicked
      let elementType = 'unknown';
      if (target.tagName === 'H1' || target.tagName === 'H2') {
        elementType = 'heading';
      } else if (target.tagName === 'BUTTON') {
        elementType = 'button';
      } else if (target.closest('.grid') || target.closest('[class*="grid-cols"]')) {
        elementType = 'grid';
      } else if (target.tagName === 'P') {
        elementType = 'text';
      } else if (target.tagName === 'DIV') {
        elementType = 'container';
      }

      console.log('Clicked:', elementType, target.tagName);

      // Send message to parent (WCL Editor)
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'ELEMENT_CLICKED',
          payload: { elementType, tagName: target.tagName, text: target.textContent?.substring(0, 50) }
        }, '*');
      }
      
      e.preventDefault();
      e.stopPropagation();
    };

    document.addEventListener('click', handleClick, true);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
      document.head.removeChild(style);
    };
  }, [isClickable]);

  return (
    <div className="bg-black min-h-screen">
      <FloraDistroHalloweenHomepage 
        vendorId="cd2e1122-d511-4edb-be5d-98ef274b4baf"
        vendorSlug="flora-distro"
        vendorName="Flora Distro"
        heroHeadline="SPIRITS & STRAINS"
        heroSubheadline="Hauntingly Good Cannabis This Halloween"
        featuredTitle="SPOOKY SPECIALS"
        ctaPrimary="TRICK OR TREAT"
        ctaSecondary="SHOP SPOOKY SPECIALS"
      />
    </div>
  );
}

