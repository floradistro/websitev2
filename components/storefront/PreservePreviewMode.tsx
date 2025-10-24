"use client";

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

/**
 * Preserves preview=true parameter on all navigation
 * Ensures live editing stays active when clicking links
 * Uses Next.js router for smooth client-side navigation
 */
export function PreservePreviewMode() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isPreview = searchParams?.get('preview') === 'true';

  useEffect(() => {
    if (!isPreview) return;

    console.log('🔗 Preview mode: Intercepting all navigation to preserve parameters');

    // Get current vendor from URL
    const currentVendor = searchParams?.get('vendor');

    // Intercept all link clicks
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href) {
        const url = new URL(link.href);
        
        // Only modify internal links
        if (url.origin === window.location.origin) {
          // Add preview=true if not present
          if (!url.searchParams.has('preview')) {
            url.searchParams.set('preview', 'true');
          }
          
          // Add vendor parameter if not present
          if (currentVendor && !url.searchParams.has('vendor')) {
            url.searchParams.set('vendor', currentVendor);
          }
          
          // Prevent default and use Next.js router for client-side navigation
          e.preventDefault();
          
          const newPath = url.pathname + url.search;
          console.log('🔗 Navigating to:', newPath);
          
          // Use router.push for smooth client-side navigation
          router.push(newPath);
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [isPreview, searchParams, router]);

  // No visual indicator - preview mode works silently
  return null;
}

