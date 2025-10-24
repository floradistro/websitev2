"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface LiveEditingContextType {
  isLiveEditMode: boolean;
  sections: any[];
  updateSection: (sectionKey: string, field: string, value: any) => void;
}

const LiveEditingContext = createContext<LiveEditingContextType>({
  isLiveEditMode: false,
  sections: [],
  updateSection: () => {},
});

export function useLiveEditing() {
  return useContext(LiveEditingContext);
}

interface LiveEditingProviderProps {
  children: ReactNode;
  initialSections: any[];
  isPreviewMode?: boolean;
}

/**
 * Provides live editing capabilities to storefront
 * Listens for postMessage from parent editor window
 * Updates React state in real-time without page reload
 */
export function LiveEditingProvider({ children, initialSections, isPreviewMode = false }: LiveEditingProviderProps) {
  const [sections, setSections] = useState(initialSections);
  const [isLiveEditMode, setIsLiveEditMode] = useState(false);

  useEffect(() => {
    // Check if we're in an iframe (being edited)
    const inIframe = window.self !== window.top;
    const urlParams = new URLSearchParams(window.location.search);
    const previewParam = urlParams.get('preview');
    
    setIsLiveEditMode(inIframe && previewParam === 'true');

    if (inIframe && previewParam === 'true') {
      // Listen for messages from parent editor window
      const handleMessage = (event: MessageEvent) => {
        // Security: Verify message is from same origin
        if (event.origin !== window.location.origin) return;

        const { type, data } = event.data;

        switch (type) {
          case 'UPDATE_SECTION':
            updateSection(data.section_key, data.field, data.value);
            break;

          case 'UPDATE_SECTION_FULL':
            updateSectionFull(data.section_key, data.content_data);
            break;

          case 'TOGGLE_SECTION':
            toggleSectionVisibility(data.section_key, data.is_enabled);
            break;

          case 'RELOAD_SECTIONS':
            setSections(data.sections);
            break;

          default:
            break;
        }
      };

      window.addEventListener('message', handleMessage);

      // Notify parent that we're ready
      window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
      
      // Detect page navigation and notify parent
      let currentPage = '';
      const detectAndNotifyPageChange = () => {
        const path = window.location.pathname;
        let pageType = 'home';
        
        if (path.includes('/about')) pageType = 'about';
        else if (path.includes('/contact')) pageType = 'contact';
        else if (path.includes('/faq')) pageType = 'faq';
        else if (path.includes('/shop')) pageType = 'shop';
        
        if (pageType !== currentPage) {
          currentPage = pageType;
          window.parent.postMessage({ 
            type: 'PAGE_CHANGED', 
            page: pageType 
          }, '*');
        }
      };
      
      // Detect initial page
      detectAndNotifyPageChange();
      
      // Use multiple detection methods for Next.js
      // Method 1: URL changes
      const urlChangeInterval = setInterval(detectAndNotifyPageChange, 500);
      
      // Method 2: DOM mutations
      const observer = new MutationObserver(detectAndNotifyPageChange);
      observer.observe(document.body, { subtree: true, childList: true });

      return () => {
        window.removeEventListener('message', handleMessage);
        observer.disconnect();
        clearInterval(urlChangeInterval);
      };
    }
  }, []);

  function updateSection(sectionKey: string, field: string, value: any) {
    console.log('📡 LiveEditingProvider updateSection:', { sectionKey, field, value });
    setSections((prevSections) =>
      prevSections.map((section) => {
        if (section.section_key === sectionKey) {
          // Handle nested fields (e.g., 'cta_primary.text')
          if (field.includes('.')) {
            const keys = field.split('.');
            const newContentData = { ...section.content_data };
            let current = newContentData;
            
            for (let i = 0; i < keys.length - 1; i++) {
              if (!current[keys[i]]) current[keys[i]] = {};
              current = current[keys[i]];
            }
            
            current[keys[keys.length - 1]] = value;
            
            console.log('✅ Updated section (nested):', sectionKey, newContentData);
            return { ...section, content_data: newContentData };
          } else {
            const updated = {
              ...section,
              content_data: { ...section.content_data, [field]: value },
            };
            console.log('✅ Updated section:', sectionKey, updated.content_data);
            return updated;
          }
        }
        return section;
      })
    );
  }

  function updateSectionFull(sectionKey: string, contentData: any) {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.section_key === sectionKey
          ? { ...section, content_data: contentData }
          : section
      )
    );
  }

  function toggleSectionVisibility(sectionKey: string, isEnabled: boolean) {
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.section_key === sectionKey
          ? { ...section, is_enabled: isEnabled }
          : section
      )
    );
  }

  return (
    <LiveEditingContext.Provider value={{ isLiveEditMode, sections, updateSection }}>
      {children}
    </LiveEditingContext.Provider>
  );
}

