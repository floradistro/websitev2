"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

/**
 * Preserves preview=true parameter on all navigation
 * Ensures live editing stays active when clicking links
 */
export function PreservePreviewMode() {
  const searchParams = useSearchParams();
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
          
          // Prevent default and navigate with all params
          e.preventDefault();
          window.location.href = url.toString();
          
          console.log('🔗 Navigating to:', url.toString());
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [isPreview, searchParams]);

  // Visual indicator for preview mode
  if (isPreview) {
    return (
      <div className="fixed top-0 left-0 right-0 bg-purple-600 text-white text-center py-1 text-xs z-[9999] pointer-events-none">
        🎨 Preview Mode - You're viewing a draft
      </div>
    );
  }

  return null;
}

