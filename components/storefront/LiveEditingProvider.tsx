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
      console.log('🎨 Live edit mode enabled - listening for updates');
      console.log('📊 Initial sections:', initialSections.length);

      // Listen for messages from parent editor window
      const handleMessage = (event: MessageEvent) => {
        // Security: Verify message is from same origin
        if (event.origin !== window.location.origin) return;

        const { type, data } = event.data;

        switch (type) {
          case 'UPDATE_SECTION':
            console.log('📝 Updating section:', data.section_key, data.field, '=', data.value);
            updateSection(data.section_key, data.field, data.value);
            break;

          case 'UPDATE_SECTION_FULL':
            console.log('📝 Full section update:', data.section_key);
            updateSectionFull(data.section_key, data.content_data);
            break;

          case 'TOGGLE_SECTION':
            console.log('👁️ Toggle section:', data.section_key);
            toggleSectionVisibility(data.section_key, data.is_enabled);
            break;

          case 'RELOAD_SECTIONS':
            console.log('🔄 Reloading all sections:', data.sections?.length);
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
      const detectPageChange = () => {
        const path = window.location.pathname;
        let pageType = 'home';
        
        if (path.includes('/about')) pageType = 'about';
        else if (path.includes('/contact')) pageType = 'contact';
        else if (path.includes('/faq')) pageType = 'faq';
        
        window.parent.postMessage({ 
          type: 'PAGE_CHANGED', 
          page: pageType 
        }, '*');
      };
      
      // Detect initial page
      detectPageChange();
      
      // Listen for navigation changes
      const observer = new MutationObserver(detectPageChange);
      observer.observe(document.body, { subtree: true, childList: true });

      return () => {
        window.removeEventListener('message', handleMessage);
        observer.disconnect();
      };
    }
  }, []);

  function updateSection(sectionKey: string, field: string, value: any) {
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
            
            return { ...section, content_data: newContentData };
          } else {
            return {
              ...section,
              content_data: { ...section.content_data, [field]: value },
            };
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

