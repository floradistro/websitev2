"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface LivePreviewWrapperProps {
  children: React.ReactNode;
  vendorId: string;
  pageType: string;
}

/**
 * Wrapper that checks for draft content in preview mode
 * Allows live editor to show changes before saving
 */
export function LivePreviewWrapper({ children, vendorId, pageType }: LivePreviewWrapperProps) {
  const searchParams = useSearchParams();
  const isPreviewMode = searchParams?.get('preview_mode') === 'true';
  const [draftContent, setDraftContent] = useState<any>(null);

  useEffect(() => {
    if (isPreviewMode && typeof window !== 'undefined') {
      // Check for draft sections in localStorage
      const draftSections = localStorage.getItem('draft_sections');
      
      if (draftSections) {
        try {
          const parsed = JSON.parse(draftSections);
          // Filter for current page
          const pageSections = parsed.filter((s: any) => s.page_type === pageType);
          setDraftContent(pageSections);
          console.log('✨ Preview mode: Loaded draft sections', pageSections.length);
        } catch (error) {
          console.error('Failed to parse draft sections:', error);
        }
      }

      // Listen for updates from parent (live editor)
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'UPDATE_DRAFT') {
          localStorage.setItem('draft_sections', JSON.stringify(event.data.sections));
          setDraftContent(event.data.sections.filter((s: any) => s.page_type === pageType));
        }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [isPreviewMode, pageType]);

  // If in preview mode with draft content, you could inject it here
  // For now, just render children (draft content is handled by re-fetching)
  return <>{children}</>;
}

