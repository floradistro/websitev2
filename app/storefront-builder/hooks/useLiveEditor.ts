/**
 * Live Editor Hook
 * Enables Canva-style instant editing without reloads
 */

import { useState, useCallback, useEffect } from 'react';
import { applyPatch, CodePatch } from '@/lib/storefront-builder/liveCodePatcher';

interface SelectedElement {
  type: 'text' | 'heading' | 'image' | 'button' | 'container';
  value: string;
  classes: string[];
  position: { x: number; y: number; width: number; height: number };
  selector: string;
  tagName: string;
}

export function useLiveEditor(code: string, setCode: (code: string) => void, previewRef: React.RefObject<HTMLIFrameElement | null>) {
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [isEditorVisible, setIsEditorVisible] = useState(false);

  // Listen for element clicks in preview
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const { type, payload } = event.data;

      if (type === 'ELEMENT_CLICKED_LIVE') {
        const { tagName, classList, textContent, position, value } = payload;

        // Get iframe offset to adjust coordinates
        const iframe = previewRef.current;
        const iframeRect = iframe?.getBoundingClientRect();

        // Adjust position to account for iframe offset in parent window
        const adjustedPosition = {
          x: position.x + (iframeRect?.left || 0),
          y: position.y + (iframeRect?.top || 0),
          width: position.width,
          height: position.height,
        };

        // Determine element type
        let elementType: SelectedElement['type'] = 'container';
        if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
          elementType = 'heading';
        } else if (tagName === 'p' || tagName === 'span' || tagName === 'div') {
          elementType = 'text';
        } else if (tagName === 'img') {
          elementType = 'image';
        } else if (tagName === 'button' || tagName === 'a') {
          elementType = 'button';
        }

        setSelectedElement({
          type: elementType,
          value: value || textContent || '',
          classes: classList.split(' ').filter(Boolean),
          position: adjustedPosition,
          selector: `${tagName}.${classList.split(' ')[0]}`,
          tagName,
        });
        setIsEditorVisible(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [previewRef]);

  // Apply live updates
  const applyLiveUpdate = useCallback((changes: {
    text?: string;
    classes?: string[];
    styles?: Record<string, string>;
  }) => {
    if (!selectedElement) return;

    const patches: CodePatch[] = [];

    // Handle text changes
    if (changes.text && changes.text !== selectedElement.value) {
      patches.push({
        type: 'text',
        oldValue: selectedElement.value,
        newValue: changes.text,
      });

      // Update preview immediately (optimistic update)
      updatePreviewDOM({
        selector: selectedElement.selector,
        textContent: changes.text,
      });
    }

    // Handle class changes
    if (changes.classes) {
      const oldClasses = selectedElement.classes.join(' ');
      const newClasses = changes.classes.join(' ');

      if (oldClasses !== newClasses) {
        patches.push({
          type: 'class',
          oldValue: oldClasses,
          newValue: newClasses,
        });

        // Update preview immediately
        updatePreviewDOM({
          selector: selectedElement.selector,
          className: newClasses,
        });
      }
    }

    // Handle style changes
    if (changes.styles) {
      Object.entries(changes.styles).forEach(([property, value]) => {
        updatePreviewDOM({
          selector: selectedElement.selector,
          styles: { [property]: value },
        });
      });
    }

    // Apply patches to code
    if (patches.length > 0) {
      let patchedCode = code;
      for (const patch of patches) {
        patchedCode = applyPatch(patchedCode, patch);
      }
      setCode(patchedCode);

      // Update selected element state
      setSelectedElement({
        ...selectedElement,
        value: changes.text || selectedElement.value,
        classes: changes.classes || selectedElement.classes,
      });
    }
  }, [selectedElement, code, setCode]);

  // Update preview DOM directly (instant feedback)
  const updatePreviewDOM = useCallback((update: {
    selector: string;
    textContent?: string;
    className?: string;
    styles?: Record<string, string>;
  }) => {
    if (!previewRef.current) return;

    const iframe = previewRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Find element in iframe
    const elements = doc.querySelectorAll(update.selector);
    if (elements.length === 0) return;

    // Apply updates to all matching elements
    elements.forEach((element: any) => {
      if (update.textContent !== undefined) {
        element.textContent = update.textContent;
      }
      if (update.className !== undefined) {
        element.className = update.className;
      }
      if (update.styles) {
        Object.entries(update.styles).forEach(([property, value]) => {
          element.style[property] = value;
        });
      }
    });
  }, [previewRef]);

  // Close editor
  const closeEditor = useCallback(() => {
    setIsEditorVisible(false);
    setSelectedElement(null);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isEditorVisible) {
        closeEditor();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditorVisible, closeEditor]);

  return {
    selectedElement,
    isEditorVisible,
    applyLiveUpdate,
    closeEditor,
  };
}
