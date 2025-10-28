/**
 * Preview Management Hook
 * Handles preview rendering, iframe, and device modes
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { PreviewState, Vendor } from '@/lib/storefront-builder/types';
import { cleanCode } from '@/lib/storefront-builder/utils';

export function usePreview(code: string, selectedVendor: string, currentVendor?: Vendor) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewHTML, setPreviewHTML] = useState('');
  const [previewKey, setPreviewKey] = useState(0);
  const [quantumState, setQuantumState] = useState<'auto' | 'first-visit' | 'returning'>('auto');
  const previewRef = useRef<HTMLIFrameElement>(null);

  // Update preview by rendering React on server
  const updatePreview = useCallback(async () => {
    if (!code) {
      return;
    }

    // Strip block comments before sending to API
    const cleanedCode = cleanCode(code);

    try {
      const response = await fetch('/api/react/render-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanedCode,
          props: {
            vendorId: selectedVendor,
            vendorName: currentVendor?.store_name || 'Store'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.html) {
        // Inject click handlers for sections
        const htmlWithClickHandlers = result.html.replace(
          '</body>',
          `
          <script>
            let selectedElement = null;

            function updateOutline(element, isSelected) {
              if (isSelected) {
                element.style.boxShadow = 'inset 0 0 0 2px rgba(255,255,255,0.9), inset 0 0 0 4px rgba(6,182,212,1), 0 0 0 2px rgba(255,255,255,0.9), 0 0 0 4px rgba(6,182,212,1)';
                element.style.position = 'relative';
                element.style.zIndex = '10';
              } else {
                element.style.boxShadow = '';
                element.style.position = '';
                element.style.zIndex = '';
              }
            }

            document.addEventListener('click', (e) => {
              e.stopPropagation();
              const target = e.target;

              if (selectedElement) {
                updateOutline(selectedElement, false);
              }

              selectedElement = target;
              updateOutline(selectedElement, true);

              const section = target.closest('[data-section]');
              const sectionId = section?.getAttribute('data-section') || 'unknown';
              const tagName = target.tagName.toLowerCase();
              const classList = Array.from(target.classList).join(' ');

              window.parent.postMessage({
                type: 'ELEMENT_SELECTED',
                payload: {
                  section: sectionId,
                  tagName: tagName,
                  classList: classList,
                  textContent: target.textContent?.substring(0, 100)
                }
              }, '*');
            }, true);

            document.body.addEventListener('mouseover', (e) => {
              const target = e.target;
              if (target !== selectedElement && target.tagName !== 'BODY' && target.tagName !== 'HTML') {
                target.style.boxShadow = 'inset 0 0 0 2px rgba(6, 182, 212, 0.6)';
              }
            }, true);

            document.body.addEventListener('mouseout', (e) => {
              const target = e.target;
              if (target !== selectedElement) {
                target.style.boxShadow = '';
              }
            }, true);
          </script>
          </body>`
        );

        setPreviewHTML(htmlWithClickHandlers);
        setPreviewKey(prev => prev + 1);
      }
    } catch (error: any) {
      // Preview update failed - silent fail to avoid blocking UI
    }
  }, [code, selectedVendor, currentVendor]);

  // Auto-update preview on code change
  useEffect(() => {
    if (!code) return;

    const updateTimeout = setTimeout(() => {
      updatePreview();
    }, 800);

    return () => clearTimeout(updateTimeout);
  }, [code, updatePreview]);

  return {
    previewMode,
    setPreviewMode,
    previewHTML,
    previewKey,
    previewRef,
    quantumState,
    setQuantumState,
    updatePreview,
  };
}
