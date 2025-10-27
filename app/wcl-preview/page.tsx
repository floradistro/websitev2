"use client";

/**
 * WCL Preview - Dynamic Component Renderer
 * Renders compiled WCL code on the fly (no file system needed)
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function WCLPreviewPage() {
  const searchParams = useSearchParams();
  const isClickable = searchParams?.get('clickable') === 'true';
  const quantumState = searchParams?.get('quantum') || 'auto';
  const [componentHTML, setComponentHTML] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for WCL updates from editor
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      const { type, payload } = event.data;
      
      if (type === 'UPDATE_PREVIEW') {
        console.log('📦 Received WCL update');
        setComponentHTML(payload.html);
        setIsLoading(false);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Tell parent we're ready
    if (window.parent !== window) {
      window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
    }

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Enable clickable mode
  useEffect(() => {
    if (!isClickable) return;

    const style = document.createElement('style');
    style.textContent = `
      * { cursor: pointer !important; }
      *:hover { outline: 2px solid rgba(168, 85, 247, 0.4) !important; outline-offset: 2px; }
    `;
    document.head.appendChild(style);

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      let elementType = 'unknown';
      if (target.tagName === 'H1' || target.tagName === 'H2') {
        elementType = 'heading';
      } else if (target.tagName === 'BUTTON') {
        elementType = 'button';
      } else if (target.tagName === 'P') {
        elementType = 'text';
      }

      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'ELEMENT_CLICKED',
          payload: { elementType, tagName: target.tagName }
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
  }, [isClickable, componentHTML]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/40 text-sm">Loading preview...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-black"
      dangerouslySetInnerHTML={{ __html: componentHTML }}
    />
  );
}

