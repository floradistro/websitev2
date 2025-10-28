"use client";

/**
 * Storefront Builder
 * AI-powered React component editor for WhaleTools
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Eye, Sparkles, RefreshCw, AlertCircle, CheckCircle,
  Monitor, Smartphone, Maximize2, Send, ArrowLeft, 
  ChevronDown, Type, Database, Zap, Edit2, Save, Plus, Trash2,
  Command, Palette, Layout, Grid, Move, Wand2, AlignLeft, AlignCenter,
  AlignRight, Bold, Italic, Underline, MinusCircle, PlusCircle, Settings,
  MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { AgentConfigPanel } from '@/components/admin/AgentConfigPanel';
import { ConversationHistory } from '@/components/admin/ConversationHistory';

// Simple JSX/React syntax highlighter
const highlightCode = (code: string): string => {
  return code
    // Keywords (purple)
    .replace(/\b(export|default|function|const|let|var|return|if|else|map|filter|fetch)\b/g, '<span class="text-purple-400">$1</span>')
    // React hooks (cyan)
    .replace(/\b(useState|useEffect|useCallback|useRef)\b/g, '<span class="text-cyan-400">$1</span>')
    // Strings (green)
    .replace(/"([^"]*)"/g, '<span class="text-emerald-300">"$1"</span>')
    .replace(/'([^']*)'/g, '<span class="text-emerald-300">\'$1\'</span>')
    .replace(/`([^`]*)`/g, '<span class="text-emerald-300">`$1`</span>')
    // className attributes (purple)
    .replace(/className=/g, '<span class="text-purple-300">className</span>=')
    // Functions/components (white)
    .replace(/\b([A-Z]\w+)\b/g, '<span class="text-white/90">$1</span>')
    // Base text
    .replace(/^(.*)$/gm, '<span class="text-white/50">$1</span>');
};

interface Section {
  type: 'props' | 'data' | 'quantum_state' | 'render';
  name: string;
  icon: any;
  lineStart: number;
  lineEnd: number;
  code: string;
}

const getInitialCode = (vendorLogoUrl?: string) => `export default function Component({ vendorId, vendorName }) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center">
        ${vendorLogoUrl ? `<img src="${vendorLogoUrl}" alt="Logo" className="h-24 w-auto mx-auto mb-12 object-contain opacity-20" />` : ''}
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black uppercase tracking-tight text-white/10 mb-6 leading-[0.9]">
          {vendorName || "Your Store"}
        </h1>
        <p className="text-xl sm:text-2xl text-white/10 leading-relaxed">
          AI-powered storefront builder
        </p>
      </div>
    </div>
  );
}

/* 
EXAMPLES - Copy one of these to get started:

1. PRODUCT GRID WITH REAL DATA:
component ProductShowcase {
  props {
    headline: String = "Featured Products"
  }
  
  data {
    products = fetch("/api/products?vendor_id=cd2e1122-d511-4edb-be5d-98ef274b4baf&limit=6") @cache(5m)
  }
  
  render {
    <div className="bg-black py-16 px-4">
      <h2 className="text-5xl font-black uppercase text-white mb-12 text-center">{headline}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {products.map(p => (
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
            <img src={p.featured_image_storage} className="w-full aspect-square object-cover rounded-xl mb-4" />
            <h3 className="text-white font-black uppercase">{p.name}</h3>
            <p className="text-white/60 text-sm">\${p.price}</p>
          </div>
        ))}
      </div>
    </div>
  }
}

2. TESTIMONIALS WITH QUANTUM STATES:
component SmartTestimonials {
  data {
    reviews = fetch("/api/testimonials") @cache(10m)
  }
  
  render {
    quantum {
      state Mobile when user.device == "mobile" {
        <div className="py-12 px-4">
          {reviews.slice(0,3).map(r => <ReviewCard {...r} />)}
        </div>
      }
      
      state Desktop when user.device == "desktop" {
        <div className="py-20 px-8">
          <div className="grid grid-cols-3 gap-8">
            {reviews.map(r => <ReviewCard {...r} />)}
          </div>
        </div>
      }
    }
  }
}
*/`;

interface SmartComponent {
  key: string;
  name: string;
  description: string;
  category: 'layout' | 'content' | 'commerce' | 'interactive';
}

const SMART_COMPONENTS: SmartComponent[] = [
  { key: 'smart_hero', name: 'Hero Section', description: 'Full-width hero with headline and CTA', category: 'layout' },
  { key: 'smart_product_grid', name: 'Product Grid', description: 'Responsive product grid with real vendor data', category: 'commerce' },
  { key: 'smart_product_showcase', name: 'Product Showcase', description: 'Featured product carousel with real data', category: 'commerce' },
  { key: 'smart_testimonials', name: 'Testimonials', description: 'Customer reviews and ratings with real data', category: 'content' },
  { key: 'smart_features', name: 'Features Grid', description: 'Feature highlights with icons', category: 'content' },
  { key: 'smart_stats_counter', name: 'Stats Counter', description: 'Animated statistics display', category: 'interactive' },
  { key: 'smart_faq', name: 'FAQ Accordion', description: 'Expandable Q&A section', category: 'content' },
  { key: 'smart_contact', name: 'Contact Form', description: 'Contact form with validation', category: 'interactive' },
];

interface Vendor {
  id: string;
  store_name: string;
  slug: string;
  logo_url?: string;
}

export default function StorefrontBuilder() {
  const [code, setCode] = useState('');
  const [compiledCode, setCompiledCode] = useState('');
  const [compileError, setCompileError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [quantumState, setQuantumState] = useState<'auto' | 'first-visit' | 'returning'>('auto');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [sectionEdits, setSectionEdits] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showComponentBrowser, setShowComponentBrowser] = useState(false);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<string>('cd2e1122-d511-4edb-be5d-98ef274b4baf'); // Flora Distro default
  const prevVendorRef = useRef<string>('');
  const previewRef = useRef<HTMLIFrameElement>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [previewHTML, setPreviewHTML] = useState('');
  const [codeHistory, setCodeHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCodePanel, setShowCodePanel] = useState(false); // Hidden by default
  const [selectedElement, setSelectedElement] = useState<{
    tagName: string;
    classList: string;
    textContent: string;
  } | null>(null);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [selectedFont, setSelectedFont] = useState<string>('');
  const [referenceUrl, setReferenceUrl] = useState<string>('');
  const [isAnalyzingReference, setIsAnalyzingReference] = useState(false);
  const [referenceScreenshot, setReferenceScreenshot] = useState<string>('');
  const [streamingText, setStreamingText] = useState<string>('');
  const [streamPhase, setStreamPhase] = useState<string>('');
  const [useStreaming, setUseStreaming] = useState(true);
  const [showStreamingPanel, setShowStreamingPanel] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState<string>('');
  const [streamingThinking, setStreamingThinking] = useState<string>('');
  const [toolsExecuted, setToolsExecuted] = useState<Array<{tool: string, result: string, details: string}>>([]);
  const [generatedCodeBackup, setGeneratedCodeBackup] = useState<string>('');
  const [displayedCode, setDisplayedCode] = useState<string>('');
  const [showAgentConfig, setShowAgentConfig] = useState(false);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<{data: string, title: string} | null>(null);
  const [manualScreenshotMode, setManualScreenshotMode] = useState(false);

  // Google Fonts library
  const FONT_LIBRARY = [
    { name: 'Inter', category: 'Sans-serif', weights: [400, 500, 600, 700, 800, 900] },
    { name: 'Roboto', category: 'Sans-serif', weights: [300, 400, 500, 700, 900] },
    { name: 'Playfair Display', category: 'Serif', weights: [400, 500, 600, 700, 800, 900] },
    { name: 'Montserrat', category: 'Sans-serif', weights: [400, 500, 600, 700, 800, 900] },
    { name: 'Bebas Neue', category: 'Display', weights: [400] },
    { name: 'Oswald', category: 'Sans-serif', weights: [400, 500, 600, 700] },
    { name: 'Raleway', category: 'Sans-serif', weights: [400, 500, 600, 700, 800, 900] },
    { name: 'Poppins', category: 'Sans-serif', weights: [400, 500, 600, 700, 800, 900] },
    { name: 'DM Sans', category: 'Sans-serif', weights: [400, 500, 700] },
    { name: 'Space Grotesk', category: 'Sans-serif', weights: [400, 500, 600, 700] },
  ];


  // Fetch vendors on mount
  useEffect(() => {
    fetch('/api/admin/vendors')
      .then(res => res.json())
      .then(data => {
        if (data.vendors) {
          setVendors(data.vendors);
          // Set initial code with Flora Distro logo
          const floraDistro = data.vendors.find((v: Vendor) => v.id === 'cd2e1122-d511-4edb-be5d-98ef274b4baf');
          setCode(getInitialCode(floraDistro?.logo_url));
          // Set initial vendor ref
          prevVendorRef.current = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
          console.log('✅ Vendors loaded:', data.vendors.length, 'Initial vendor:', floraDistro?.store_name);
        }
      })
      .catch(err => console.error('Failed to fetch vendors:', err));
  }, []);

  // Update code when vendor changes - replace vendor_id and logo references
  useEffect(() => {
    if (!selectedVendor || vendors.length === 0) return;
    
    // Skip if vendor hasn't actually changed
    if (prevVendorRef.current === selectedVendor) return;
    
    const currentVendor = vendors.find(v => v.id === selectedVendor);
    const prevVendor = vendors.find(v => v.id === prevVendorRef.current);
    if (!currentVendor) return;
    
    console.log('🔄 Vendor switch:', {
      from: prevVendor?.store_name || 'None',
      to: currentVendor.store_name,
      fromId: prevVendorRef.current,
      toId: selectedVendor
    });
    
    // Update all vendor-specific references in code
    setCode(prevCode => {
      if (!prevCode) return prevCode;
      
      let updatedCode = prevCode;
      
      // Replace ALL vendor_id references (more aggressive pattern)
      const vendorIdPattern = /vendor_id=[a-zA-Z0-9-]+/gi;
      const matches = updatedCode.match(vendorIdPattern);
      console.log('Found vendor_id matches:', matches);
      
      updatedCode = updatedCode.replace(
        vendorIdPattern,
        `vendor_id=${selectedVendor}`
      );
      
      // Replace logo URLs - handle multiple URL formats
      if (currentVendor.logo_url && prevVendor?.logo_url) {
        // Replace old vendor's logo with new one
        updatedCode = updatedCode.replace(
          new RegExp(prevVendor.logo_url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          currentVendor.logo_url
        );
      } else if (currentVendor.logo_url) {
        // Replace any Supabase logo URL
        updatedCode = updatedCode.replace(
          /https:\/\/[^"'\s]+vendor-logos\/[^"'\s]+/g,
          currentVendor.logo_url
        );
      }
      
      console.log('Code updated, vendor_id count after:', (updatedCode.match(vendorIdPattern) || []).length);
      
      if (updatedCode !== prevCode) {
        console.log('✅ code updated for vendor switch');
      } else {
        console.warn('⚠️ code unchanged after vendor switch');
      }
      
      return updatedCode;
    });
    
    // Update ref to track current vendor
    prevVendorRef.current = selectedVendor;
    
    // Force refresh preview after vendor change
    setTimeout(() => {
      console.log('🔄 Refreshing preview for new vendor');
      updatePreview();
    }, 500);
  }, [selectedVendor, vendors]); // eslint-disable-line react-hooks/exhaustive-deps

  // SAFETY: Save generated code to localStorage (prevent loss on crash/refresh)
  useEffect(() => {
    if (generatedCodeBackup) {
      try {
        localStorage.setItem(`code_backup_${selectedVendor}`, generatedCodeBackup);
        localStorage.setItem('code_backup_timestamp', new Date().toISOString());
        console.log('💾 Code backed up to localStorage:', generatedCodeBackup.length, 'chars');
      } catch (e) {
        console.warn('⚠️ LocalStorage backup failed');
      }
    }
  }, [generatedCodeBackup, selectedVendor]);

  // Typewriter effect for streaming code (character-by-character)
  useEffect(() => {
    if (!streamingText || !showStreamingPanel) {
      setDisplayedCode('');
      return;
    }
    
    let currentIndex = displayedCode.length;
    
    if (currentIndex < streamingText.length) {
      const timer = setInterval(() => {
        if (currentIndex < streamingText.length) {
          setDisplayedCode(streamingText.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(timer);
        }
      }, 10); // 10ms per character = smooth typewriter effect
      
      return () => clearInterval(timer);
    }
  }, [streamingText, showStreamingPanel]);

  // Auto-compile and preview on code change (with backup protection)
  useEffect(() => {
    if (!code) return;
    
    const compileTimeout = setTimeout(() => {
      try {
        compileReact();
        updatePreview();
      } catch (error) {
        console.error('❌ Compile/preview failed, code is safe in backup');
        // Code is still in code and generatedCodeBackup
      }
    }, 800);
    
    return () => clearTimeout(compileTimeout);
  }, [code]);

  // Update preview by rendering React on server
  const updatePreview = async () => {
    if (!code) {
      console.warn('⚠️ No code to render');
      return;
    }
    
    console.log('🔄 Rendering preview from React...');
    console.log('📝 Code length:', code.length);
    
    // Strip block comments (/* ... */) before sending to API
    const cleanedCode = code.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    console.log('🧹 Cleaned length:', cleanedCode.length);
    
    try {
      const response = await fetch('/api/react/render-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: cleanedCode,
          props: {
            vendorId: selectedVendor,
            vendorName: vendors.find(v => v.id === selectedVendor)?.store_name || 'Store'
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error:', response.status, errorText);
        throw new Error(`API error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📦 API Response:', result.success ? '✅ Success' : '❌ Failed');
      console.log('📄 HTML length:', result.html?.length || 0);
      
      if (result.success && result.html) {
        console.log('✅ Injecting click handlers into HTML');
        
        // Inject click handlers for sections
        const htmlWithClickHandlers = result.html.replace(
          '</body>',
          `
          <script>
            let selectedElement = null;
            
            // Update outline for selected element
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
              
              // Clear previous selection
              if (selectedElement) {
                updateOutline(selectedElement, false);
              }
              
              // Select new element
              selectedElement = target;
              updateOutline(selectedElement, true);
              
              // Get section and element info
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
            
            // Add hover effects to all elements
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
      } else {
        console.error('❌ No HTML in response:', result);
      }
    } catch (error: any) {
      console.error('❌ Preview update failed:', error.message, error);
    }
  };

  const compileReact = useCallback(() => {
    setIsCompiling(true);
    try {
      // No compilation needed for React - just validate it's not empty
      const cleanedCode = code.replace(/\/\*[\s\S]*?\*\//g, '').trim();
      if (cleanedCode) {
        setCompiledCode(cleanedCode);
        setCompileError(null);
      } else {
        setCompileError('Code is empty');
      }
    } catch (error: any) {
      setCompileError(error.toString());
    } finally {
      setIsCompiling(false);
    }
  }, [code]);

  const parseSections = useCallback((): Section[] => {
    const sections: Section[] = [];
    const lines = code.split('\n');
    
    const propsStart = lines.findIndex(l => l.trim().startsWith('props {'));
    if (propsStart !== -1) {
      let braceCount = 0, propsEnd = propsStart;
      for (let i = propsStart; i < lines.length; i++) {
        braceCount += (lines[i].match(/{/g) || []).length;
        braceCount -= (lines[i].match(/}/g) || []).length;
        if (braceCount === 0 && i > propsStart) { propsEnd = i; break; }
      }
      sections.push({ type: 'props', name: 'Props', icon: Type, lineStart: propsStart + 1, lineEnd: propsEnd + 1, code: lines.slice(propsStart, propsEnd + 1).join('\n') });
    }

    const dataStart = lines.findIndex(l => l.trim().startsWith('data {'));
    if (dataStart !== -1) {
      let braceCount = 0, dataEnd = dataStart;
      for (let i = dataStart; i < lines.length; i++) {
        braceCount += (lines[i].match(/{/g) || []).length;
        braceCount -= (lines[i].match(/}/g) || []).length;
        if (braceCount === 0 && i > dataStart) { dataEnd = i; break; }
      }
      sections.push({ type: 'data', name: 'Data Fetching', icon: Database, lineStart: dataStart + 1, lineEnd: dataEnd + 1, code: lines.slice(dataStart, dataEnd + 1).join('\n') });
    }

    const renderStart = lines.findIndex(l => l.trim().startsWith('render {'));
    if (renderStart !== -1) {
      let braceCount = 0, renderEnd = renderStart;
      for (let i = renderStart; i < lines.length; i++) {
        braceCount += (lines[i].match(/{/g) || []).length;
        braceCount -= (lines[i].match(/}/g) || []).length;
        if (braceCount === 0 && i > renderStart) { renderEnd = i; break; }
      }
      sections.push({ type: 'render', name: 'Design & Layout', icon: Eye, lineStart: renderStart + 1, lineEnd: renderEnd + 1, code: lines.slice(renderStart, renderEnd + 1).join('\n') });
    }

    lines.forEach((line, idx) => {
      const match = line.trim().match(/^state\s+(\w+)\s+when/);
      if (match) {
        let braceCount = 0, stateEnd = idx;
        for (let i = idx; i < lines.length; i++) {
          braceCount += (lines[i].match(/{/g) || []).length;
          braceCount -= (lines[i].match(/}/g) || []).length;
          if (braceCount === 0 && i > idx) { stateEnd = i; break; }
        }
        sections.push({ type: 'quantum_state', name: `State: ${match[1]}`, icon: Zap, lineStart: idx + 1, lineEnd: stateEnd + 1, code: lines.slice(idx, stateEnd + 1).join('\n') });
      }
    });

    return sections;
  }, [code]);

  const sections = parseSections();

  const toggleSection = (name: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(name)) newExpanded.delete(name);
    else newExpanded.add(name);
    setExpandedSections(newExpanded);
  };

  const startEditing = (section: Section) => {
    setEditingSection(section.name);
    setSectionEdits({ ...sectionEdits, [section.name]: section.code });
  };

  const saveEdit = (sectionName: string) => {
    const section = sections.find(s => s.name === sectionName);
    if (!section) return;
    const newCode = sectionEdits[sectionName];
    const lines = code.split('\n');
    lines.splice(section.lineStart - 1, section.lineEnd - section.lineStart + 1, ...newCode.split('\n'));
    setCode(lines.join('\n'));
    setEditingSection(null);
  };

  const deleteSection = (section: Section) => {
    if (!confirm(`Delete "${section.name}" section? This cannot be undone.`)) {
      return;
    }

    const lines = code.split('\n');
    
    // Remove the section lines (including the closing brace)
    lines.splice(
      section.lineStart - 1,
      section.lineEnd - section.lineStart + 1
    );
    
    const newReactCode = lines.join('\n');
    console.log('🗑️  Deleted section:', section.name);
    setCode(newReactCode);
    setSelectedSections(new Set());
    setEditingSection(null);
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(section.name);
      return newSet;
    });
  };

  const moveSectionUp = (section: Section) => {
    const lines = code.split('\n');
    const sectionLines = lines.slice(section.lineStart - 1, section.lineEnd);
    
    // Remove the section from its current position
    lines.splice(section.lineStart - 1, section.lineEnd - section.lineStart + 1);
    
    // Find the previous section to insert before it
    const currentSections = parseSections();
    const currentIndex = currentSections.findIndex(s => s.name === section.name);
    
    if (currentIndex > 0) {
      const prevSection = currentSections[currentIndex - 1];
      const insertPosition = prevSection.lineStart - 1;
      
      // Insert the section before the previous section
      lines.splice(insertPosition, 0, ...sectionLines);
      
      console.log('⬆️ Moved section up:', section.name);
      setCode(lines.join('\n'));
    }
  };

  const moveSectionDown = (section: Section) => {
    const lines = code.split('\n');
    const sectionLines = lines.slice(section.lineStart - 1, section.lineEnd);
    
    // Remove the section from its current position
    lines.splice(section.lineStart - 1, section.lineEnd - section.lineStart + 1);
    
    // Find the next section to insert after it
    const currentSections = parseSections();
    const currentIndex = currentSections.findIndex(s => s.name === section.name);
    
    if (currentIndex < currentSections.length - 1) {
      const nextSection = currentSections[currentIndex + 1];
      // Calculate new position after removal
      const insertPosition = nextSection.lineStart - 1 - (section.lineEnd - section.lineStart + 1);
      
      // Insert the section after the next section
      lines.splice(insertPosition + (nextSection.lineEnd - nextSection.lineStart + 1), 0, ...sectionLines);
      
      console.log('⬇️ Moved section down:', section.name);
      setCode(lines.join('\n'));
    }
  };

  const moveSectionToTop = (section: Section) => {
    const lines = code.split('\n');
    const sectionLines = lines.slice(section.lineStart - 1, section.lineEnd);
    
    // Remove the section from its current position
    lines.splice(section.lineStart - 1, section.lineEnd - section.lineStart + 1);
    
    // Find the first section (props, data, or render)
    const currentSections = parseSections();
    const firstSection = currentSections[0];
    
    if (firstSection && firstSection.name !== section.name) {
      // Insert before the first section
      const insertPosition = firstSection.lineStart - 1;
      lines.splice(insertPosition, 0, ...sectionLines);
      
      console.log('⬆️⬆️ Moved section to top:', section.name);
      setCode(lines.join('\n'));
    }
  };

  const moveSectionToBottom = (section: Section) => {
    const lines = code.split('\n');
    const sectionLines = lines.slice(section.lineStart - 1, section.lineEnd);
    
    // Remove the section from its current position
    lines.splice(section.lineStart - 1, section.lineEnd - section.lineStart + 1);
    
    // Find the last section (props, data, or render)
    const currentSections = parseSections();
    const lastSection = currentSections[currentSections.length - 1];
    
    if (lastSection && lastSection.name !== section.name) {
      // Insert after the last section
      // Calculate position after removal
      const insertPosition = lastSection.lineStart - 1 - (section.lineEnd - section.lineStart + 1);
      lines.splice(insertPosition + (lastSection.lineEnd - lastSection.lineStart + 1), 0, ...sectionLines);
      
      console.log('⬇️⬇️ Moved section to bottom:', section.name);
      setCode(lines.join('\n'));
    }
  };

  // ===== DIRECT CODE MANIPULATION TOOLS (No AI) =====
  
  const hideDescription = () => {
    saveToHistory(code);
    const updated = code.replace(/<p[^>]*>{p\.description}<\/p>/g, '');
    setCode(updated);
    console.log('✅ Description hidden directly');
  };

  const showBlueprintFields = () => {
    saveToHistory(code);
    // Find the product card div and add blueprint fields before closing
    const blueprintCode = `
            {p.blueprint_fields && (
              <div className="space-y-2 border-t border-white/5 pt-4 mt-4">
                {p.blueprint_fields.map(field => (
                  <div key={field.label} className="flex gap-3">
                    <span className="text-white/40 text-xs uppercase min-w-[100px]">{field.label}</span>
                    <span className="text-white text-sm">{field.value}</span>
                  </div>
                ))}
              </div>
            )}`;
    
    // Find where to insert (before closing div of product card)
    const pattern = /(<div key={p\.id}[^>]*>[\s\S]*?)(<\/div>\s*\)\)}\s*<\/div>)/;
    const updated = code.replace(pattern, `$1${blueprintCode}$2`);
    setCode(updated);
    console.log('✅ Blueprint fields added directly');
  };

  const changeGridColumns = (cols: number) => {
    saveToHistory(code);
    const updated = code.replace(/grid-cols-\d+/g, `grid-cols-${cols}`);
    setCode(updated);
    console.log(`✅ Changed to ${cols} column grid directly`);
  };

  const adjustSpacing = (direction: 'more' | 'less') => {
    saveToHistory(code);
    let updated = code;
    
    if (direction === 'more') {
      updated = updated.replace(/gap-4/g, 'gap-6');
      updated = updated.replace(/gap-6/g, 'gap-8');
      updated = updated.replace(/space-y-2/g, 'space-y-4');
      updated = updated.replace(/mb-4/g, 'mb-6');
    } else {
      updated = updated.replace(/gap-8/g, 'gap-4');
      updated = updated.replace(/gap-6/g, 'gap-4');
      updated = updated.replace(/space-y-4/g, 'space-y-2');
      updated = updated.replace(/mb-6/g, 'mb-4');
    }
    
    setCode(updated);
    console.log(`✅ Spacing adjusted (${direction}) directly`);
  };

  const adjustImageSize = (size: 'bigger' | 'smaller') => {
    saveToHistory(code);
    let updated = code;
    
    if (size === 'bigger') {
      updated = updated.replace(/aspect-square/g, 'aspect-[4/3]');
    } else {
      updated = updated.replace(/aspect-\[4\/3\]/g, 'aspect-square');
      updated = updated.replace(/aspect-square/g, 'aspect-video');
    }
    
    setCode(updated);
    console.log(`✅ Image size adjusted (${size}) directly`);
  };

  const hidePrice = () => {
    saveToHistory(code);
    const updated = code.replace(/<span[^>]*>\${p\.price}<\/span>/g, '');
    setCode(updated);
    console.log('✅ Price hidden directly');
  };

  const showStockQuantity = () => {
    saveToHistory(code);
    // Add stock display after price if not exists
    if (!code.includes('stock_quantity')) {
      const updated = code.replace(
        /(<span[^>]*>\${p\.price}<\/span>)/,
        '$1\n              <span className="text-white/40 text-xs">{p.stock_quantity} in stock</span>'
      );
      setCode(updated);
      console.log('✅ Stock quantity added directly');
    }
  };

  // ===== TYPOGRAPHY TOOLS =====
  
  const adjustFontSize = (direction: 'increase' | 'decrease') => {
    saveToHistory(code);
    let updated = code;
    
    const sizeMap: Record<string, string> = {
      'text-xs': 'text-sm',
      'text-sm': 'text-base',
      'text-base': 'text-lg',
      'text-lg': 'text-xl',
      'text-xl': 'text-2xl',
      'text-2xl': 'text-3xl',
      'text-3xl': 'text-4xl',
      'text-4xl': 'text-5xl'
    };
    
    if (direction === 'increase') {
      Object.entries(sizeMap).forEach(([from, to]) => {
        updated = updated.replace(new RegExp(from, 'g'), to);
      });
    } else {
      Object.entries(sizeMap).forEach(([to, from]) => {
        updated = updated.replace(new RegExp(from, 'g'), to);
      });
    }
    
    setCode(updated);
    console.log(`✅ Font size ${direction}d`);
  };

  const adjustFontWeight = (direction: 'increase' | 'decrease') => {
    saveToHistory(code);
    let updated = code;
    
    if (direction === 'increase') {
      updated = updated.replace(/font-normal/g, 'font-bold');
      updated = updated.replace(/font-medium/g, 'font-bold');
      updated = updated.replace(/font-bold/g, 'font-black');
    } else {
      updated = updated.replace(/font-black/g, 'font-bold');
      updated = updated.replace(/font-bold/g, 'font-medium');
      updated = updated.replace(/font-medium/g, 'font-normal');
    }
    
    setCode(updated);
    console.log(`✅ Font weight ${direction}d`);
  };

  const setTextAlignment = (align: 'left' | 'center' | 'right') => {
    saveToHistory(code);
    let updated = code.replace(/text-(left|center|right)/g, `text-${align}`);
    
    // If no alignment exists, add it to headings
    if (!updated.includes('text-left') && !updated.includes('text-center') && !updated.includes('text-right')) {
      updated = updated.replace(/(<h[1-6][^>]*className=")/g, `$1text-${align} `);
    }
    
    setCode(updated);
    console.log(`✅ Text aligned ${align}`);
  };

  const toggleUppercase = () => {
    saveToHistory(code);
    let updated = code;
    
    if (updated.includes('uppercase')) {
      updated = updated.replace(/uppercase/g, 'normal-case');
      console.log('✅ Uppercase removed');
    } else {
      updated = updated.replace(/normal-case/g, 'uppercase');
      // Add uppercase to headings if not present
      updated = updated.replace(/(<h[1-6][^>]*className="[^"]*?)"/g, '$1 uppercase"');
      console.log('✅ Uppercase added');
    }
    
    setCode(updated);
  };

  const adjustTextOpacity = (direction: 'increase' | 'decrease') => {
    saveToHistory(code);
    let updated = code;
    
    const opacityMap: Record<string, string> = {
      'text-white/20': 'text-white/40',
      'text-white/40': 'text-white/60',
      'text-white/60': 'text-white/80',
      'text-white/80': 'text-white'
    };
    
    if (direction === 'increase') {
      Object.entries(opacityMap).forEach(([from, to]) => {
        updated = updated.replace(new RegExp(from, 'g'), to);
      });
    } else {
      Object.entries(opacityMap).forEach(([to, from]) => {
        updated = updated.replace(new RegExp(from, 'g'), to);
      });
    }
    
    setCode(updated);
    console.log(`✅ Text opacity ${direction}d`);
  };

  // Save current state to history
  const saveToHistory = (code: string) => {
    const newHistory = codeHistory.slice(0, historyIndex + 1);
    newHistory.push(code);
    setCodeHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const applyFont = (fontName: string) => {
    saveToHistory(code);
    
    // Apply font to all text elements
    let updated = code.replace(/font-\['[^']+'\]/g, `font-['${fontName}']`);
    
    // If no font class exists, add to main container
    if (!updated.includes(`font-['`)) {
      updated = updated.replace(/(<div className="[^"]*bg-black[^"]*)/g, `$1 font-['${fontName}']`);
    }
    
    setCode(updated);
    setSelectedFont(fontName);
    setShowFontPicker(false);
    console.log(`✅ Font changed to ${fontName}`);
  };

  const addVendorBranding = () => {
    saveToHistory(code);
    const currentVendor = vendors.find(v => v.id === selectedVendor);
    
    if (!currentVendor) {
      setErrorMessage('No vendor selected');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    
    // Add logo and company name at the top of render section
    const brandingCode = `
      <div className="flex items-center gap-4 mb-8">
        ${currentVendor.logo_url ? `<img src="${currentVendor.logo_url}" alt="${currentVendor.store_name}" className="h-12 w-auto object-contain" />` : ''}
        <h1 className="text-3xl font-black uppercase text-white tracking-tight" style={{ fontWeight: 900 }}>${currentVendor.store_name}</h1>
      </div>`;
    
    // Insert after the opening div of max-w container
    const pattern = /(<div className="max-w-[^>]*>)/;
    if (code.match(pattern)) {
      const updated = code.replace(pattern, `$1${brandingCode}`);
      setCode(updated);
      console.log('✅ Vendor branding added directly');
    } else {
      setErrorMessage('Could not find container to add branding. Try using AI custom prompt.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  // Undo function
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCode(codeHistory[historyIndex - 1]);
    }
  };

  // Redo function
  const redo = () => {
    if (historyIndex < codeHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCode(codeHistory[historyIndex + 1]);
    }
  };

  const handleAIGenerate = async (section?: Section) => {
    if (!aiPrompt.trim()) return;
    
    // Save current state before AI modification
    saveToHistory(code);
    
    const currentVendor = vendors.find(v => v.id === selectedVendor);
    
    // If no section selected, AI analyzes entire component and picks the right section
    const useSmartMode = !section;
    
    // Detect if editing existing component or generating new
    const hasSubstantialContent = code.length > 500 && 
                                  !code.includes('Your Headline') &&
                                  !code.includes('BlankCanvas');
    
    const isEditingExisting = hasSubstantialContent && (
      aiPrompt.toLowerCase().includes('optimize') ||
      aiPrompt.toLowerCase().includes('improve') ||
      aiPrompt.toLowerCase().includes('add') ||
      aiPrompt.toLowerCase().includes('change') ||
      aiPrompt.toLowerCase().includes('update') ||
      aiPrompt.toLowerCase().includes('make') ||
      aiPrompt.toLowerCase().includes('better')
    );
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🤖 AI V2 REQUEST', useSmartMode ? '(SMART MODE - Auto-detect section)' : '');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User Prompt:', `"${aiPrompt}"`);
    console.log('Mode:', isEditingExisting ? '🔄 EDITING (preserve existing sections)' : '🆕 GENERATING (create new)');
    if (section) {
      console.log('Section:', section.name, `(${section.type})`);
    } else {
      console.log('Section: AUTO-DETECT from full component');
    }
    console.log('Vendor:', currentVendor?.store_name, `(${selectedVendor})`);
    console.log('Reference URL:', referenceUrl || 'None');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    setIsGenerating(true);
    
    // Use streaming API if enabled
    if (useStreaming) {
      // Reset all streaming state
      setShowStreamingPanel(true);
      setStreamingStatus('Initializing Claude Sonnet 4.5...');
      setStreamingText('');
      setDisplayedCode('');
      setStreamingThinking('');
      setToolsExecuted([]);
      setGeneratedCodeBackup('');
      setScreenshotPreview(null);
      
      try {
        console.log('🌊 Starting streaming request...');
        console.log('   Endpoint: /api/ai/code-generate-stream');
        console.log('   Prompt:', aiPrompt);
        console.log('   Reference URL:', referenceUrl || 'None');
        
        // Add timeout controller (3 minutes max for entire request)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.error('❌ Request timeout after 3 minutes');
          controller.abort();
        }, 180000); // 3 minutes
        
        const response = await fetch('/api/ai/storefront-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          fullCode: code,
          vendorId: selectedVendor,
          vendorName: currentVendor?.store_name,
          industry: 'cannabis',
          referenceUrl: referenceUrl || undefined,
          isEditingExisting: isEditingExisting,
          conversationId: currentConversationId,
          manualMode: manualScreenshotMode // Send manual mode flag
        }),
          signal: controller.signal
        }).finally(() => clearTimeout(timeoutId));
        
        console.log('✅ Response received, status:', response.status);
        console.log('   Has body:', !!response.body);
        console.log('   Content-Type:', response.headers.get('Content-Type'));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Response not OK:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        if (!response.body) {
          throw new Error('No response body - streaming not supported');
        }
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullCode = '';
        
        console.log('📖 Starting to read stream...');
        let chunkCount = 0;
        let lastChunkTime = Date.now();
        
        // Inactivity timeout - if no data for 120s (2 minutes), assume connection died
        // Increased from 60s to allow for manual mode (30s) + scraping time
        const inactivityCheck = setInterval(() => {
          const timeSinceLastChunk = Date.now() - lastChunkTime;
          if (timeSinceLastChunk > 120000) {
            console.error('❌ Stream inactive for 120s - connection likely dead');
            clearInterval(inactivityCheck);
            reader.cancel();
            throw new Error('Stream timeout - no data received for 120 seconds');
          }
        }, 5000); // Check every 5s
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            lastChunkTime = Date.now(); // Update last activity time
            
            if (done) {
              console.log('✅ Stream complete, total chunks:', chunkCount);
              clearInterval(inactivityCheck);
              break;
            }
          
          chunkCount++;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n\n');
          
          console.log(`📦 Chunk ${chunkCount}:`, lines.length, 'lines');
          
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            
            try {
              const event = JSON.parse(line.slice(6));
              console.log('📨 Event:', event.event, event);
              
              switch (event.event) {
                case 'status':
                  console.log('   Status update:', event.message);
                  setStreamingStatus(event.message || '');
                  break;
                case 'tool_start':
                  console.log('   🔧 Tool started:', event.tool);
                  setStreamingStatus(`🔧 Using tool: ${event.tool}...`);
                  break;
                case 'tool_result':
                  console.log('   ✅ Tool result:', event.tool, event.result);
                  setToolsExecuted(prev => [...prev, {
                    tool: event.tool || '',
                    result: event.result || '',
                    details: event.details || ''
                  }]);
                  break;
                case 'screenshot':
                  console.log('   📸 Screenshot received:', event.title);
                  setScreenshotPreview({
                    data: event.data,
                    title: event.title || 'Screenshot'
                  });
                  break;
                case 'thinking':
                  console.log('   🧠 Thinking chunk:', event.text?.substring(0, 50) + '...');
                  setStreamingThinking(prev => prev + (event.text || ''));
                  break;
                case 'code_chunk':
                  console.log('   💻 Code chunk:', event.text?.substring(0, 30) + '...');
                  // CRITICAL: Save to backup immediately to prevent loss
                  const newChunk = event.text || '';
                  setStreamingText(prev => {
                    const updated = prev + newChunk;
                    setGeneratedCodeBackup(updated); // Backup every chunk!
                    return updated;
                  });
                  break;
                case 'complete':
                  fullCode = event.code || generatedCodeBackup || streamingText;
                  
                  // Save conversation ID for history
                  if (event.conversationId) {
                    setCurrentConversationId(event.conversationId);
                    console.log('💬 Conversation saved:', event.conversationId);
                  }
                  
                  // CRITICAL: Save to backup before any rendering
                  setGeneratedCodeBackup(fullCode);
                  console.log('✅ Code backed up:', fullCode.length, 'chars');
                  
                  // Apply to editor (with error handling)
                  try {
                    setCode(fullCode);
                    console.log('✅ Code applied to editor');
                  } catch (error) {
                    console.error('❌ Failed to apply code, using backup');
                    setCode(generatedCodeBackup);
                  }
                  
                  setStreamingStatus('✅ Complete!');
                  setTimeout(() => {
                    setShowStreamingPanel(false);
                    setIsGenerating(false);
                    setAiPrompt('');
                    setSelectedSections(new Set());
                  }, 2000);
                  return;
                case 'error':
                  clearInterval(inactivityCheck);
                  // Parse Claude API errors for better user messaging
                  let errorMessage = event.message || 'Unknown error';
                  
                  if (errorMessage.includes('dimensions exceed') || errorMessage.includes('8000 pixels')) {
                    errorMessage = '⚠️ Screenshot was too large (> 8000px). This should be automatically fixed - please try again.';
                  } else if (errorMessage.includes('media type') || (errorMessage.includes('400') && errorMessage.includes('Image does not match'))) {
                    errorMessage = '⚠️ Screenshot format error. The image type was corrected - please try again.';
                  } else if (errorMessage.includes('400') && errorMessage.includes('invalid_request')) {
                    errorMessage = '⚠️ Screenshot too large for AI. Try a simpler site or remove the reference URL.';
                  } else if (errorMessage.includes('timeout')) {
                    errorMessage = '⏱️ Request timed out. Site too complex - try again without reference URL.';
                  } else if (errorMessage.includes('rate_limit')) {
                    errorMessage = '🚦 AI rate limit reached. Wait 30 seconds and try again.';
                  }
                  
                  throw new Error(errorMessage);
              }
            } catch (parseError) {
              // Skip invalid JSON
            }
          }
        }
        } catch (readError) {
          clearInterval(inactivityCheck);
          throw readError;
        }
      } catch (error: any) {
        console.error('❌ Streaming error:', error);
        
        // Parse error message for user-friendly display
        let displayError = error.message || 'AI generation failed';
        
        // CRITICAL: Try to recover any code we got before error
        if (generatedCodeBackup) {
          console.log('🔄 Recovering code from backup:', generatedCodeBackup.length, 'chars');
          setCode(generatedCodeBackup);
          setErrorMessage(`⚠️ ${displayError} - But partial code was saved! (${generatedCodeBackup.length} chars)`);
        } else if (streamingText) {
          console.log('🔄 Recovering code from stream:', streamingText.length, 'chars');
          setCode(streamingText);
          setErrorMessage(`⚠️ ${displayError} - But partial code was saved! (${streamingText.length} chars)`);
        } else {
          setErrorMessage(displayError);
        }
        
        // Clear error after 10 seconds
        setTimeout(() => setErrorMessage(null), 10000);
        
        setShowStreamingPanel(false);
        setIsGenerating(false);
        return; // Exit early on streaming error
      } finally {
        // Always clean up
        setShowStreamingPanel(false);
        setIsGenerating(false);
      }
      return; // Exit after streaming completes
    }
    
    // Non-streaming fallback (only used if streaming is disabled)
    // Note: This should never be reached since useStreaming is always true now
    console.warn('⚠️ Non-streaming fallback reached - this should not happen');
    setErrorMessage('Streaming is required for AI generation. Please try again.');
    setIsGenerating(false);
    return;
    
    /* DEPRECATED - Non-streaming code removed
    try {
      const response = await fetch('/api/ai/storefront-generate', { // Fixed endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          vendorId: selectedVendor,
          vendorName: currentVendor?.store_name,
          industry: 'cannabis',
          referenceUrl: referenceUrl || undefined,
          isEditingExisting: isEditingExisting
        })
      }).catch(fetchError => {
        console.error('❌ Network error:', fetchError);
        throw new Error('Network error: Could not reach AI service. Check your connection.');
      });
      */
      
      /* Removed non-streaming code - not needed anymore
      if (!response) {
        throw new Error('No response from server');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API error response:', errorText);
        throw new Error(`API error (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.modifiedSection) {
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ AI V2 RESPONSE - SUCCESS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Code Length:', result.modifiedSection.length, 'chars');
        console.log('Contains "description":', result.modifiedSection.includes('description'));
        console.log('Contains "blueprint_fields":', result.modifiedSection.includes('blueprint_fields'));
        if (result.detectedSection) {
          console.log('AI Detected Section:', result.detectedSection);
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        const modifiedCode = result.modifiedSection;
        
        // Check if AI returned a full component (starts with "component")
        if (modifiedCode.trim().startsWith('component ') || result.isFullComponent) {
          console.log('🎉 AI generated FULL COMPONENT - replacing entire React');
          setCode(modifiedCode);
          setAiPrompt('');
          setSelectedSections(new Set());
          console.log('✅ Full component replaced! Preview will refresh.');
          return;
        }
        
        // For smart mode, find the section to replace based on detection
        let targetSection = section;
        if (useSmartMode && result.detectedSection) {
          targetSection = sections.find(s => s.type === result.detectedSection) || sections.find(s => s.type === 'render')!;
          console.log('🎯 Smart mode targeting:', targetSection.name, `(${targetSection.type})`);
        }
        
        if (!targetSection) {
          throw new Error('Could not determine target section');
        }
        
        // Check if AI added multiple sections (data + render)
        const hasMultipleSections = (modifiedCode.match(/\b(props|data|render)\s*\{/g) || []).length > 1;
        
        if (hasMultipleSections && targetSection.type === 'render') {
          // AI added both data + render sections
          console.log('📦 AI added multiple sections (data + render)');
          
          const lines = code.split('\n');
          const renderStart = targetSection.lineStart - 1;
          
          // Replace the render section with both data + render
          const modifiedLines = modifiedCode.split('\n');
          lines.splice(renderStart, targetSection.lineEnd - targetSection.lineStart + 1, ...modifiedLines);
          
          const newReactCode = lines.join('\n');
          console.log('✅ Inserted multiple sections successfully');
          setCode(newReactCode);
        } else {
          // Normal single section replacement
          const lines = code.split('\n');
          const newSectionLines = modifiedCode.split('\n');
          
          lines.splice(
            targetSection.lineStart - 1, 
            targetSection.lineEnd - targetSection.lineStart + 1,
            ...newSectionLines
          );
          
          const newReactCode = lines.join('\n');
          console.log('✅ Replaced section successfully');
          setCode(newReactCode);
        }
        
        setAiPrompt('');
        setSelectedSections(new Set());
        
        console.log('✅ Code updated! Preview will refresh automatically');
      } else if (result.error) {
        // API returned error (validation failed)
        console.error('❌ AI returned error:', result.error);
        setErrorMessage(result.error);
        setTimeout(() => setErrorMessage(null), 10000);
      } else {
        console.error('❌ Unexpected response format');
        setErrorMessage('AI failed to modify section - unexpected response format');
        setTimeout(() => setErrorMessage(null), 8000);
      }
    } catch (error: any) {
      console.error('❌ AI error:', error);
      const errorMsg = error.message || 'Unknown error occurred';
      setErrorMessage(errorMsg);
      
      // Auto-dismiss error after 8 seconds
      setTimeout(() => setErrorMessage(null), 8000);
    } finally {
      setIsGenerating(false);
    }
    */
  };

  // Listen for clicks in preview
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      const { type, payload } = event.data;
      
        // Only log relevant React editor messages (ignore React DevTools noise)
        if (type && ['ELEMENT_SELECTED', 'ELEMENT_CLICKED', 'SECTION_CLICKED'].includes(type)) {
          console.log('[Storefront Builder] Message:', type, payload);
        }
      
      if (type === 'ELEMENT_SELECTED') {
        const { section, tagName, classList, textContent } = payload;
        
        console.log('[Editor] Element selected:', { section, tagName, classList, textContent });
        
        // Select the Props section
        const propsSection = sections.find(s => s.name === 'Props');
        if (propsSection) {
          setSelectedSections(new Set(['Props']));
          setExpandedSections(prev => new Set([...prev, 'Props']));
        }
        
        // Focus the AI input at bottom
        setTimeout(() => {
          const aiInput = document.querySelector('input[placeholder*="Select"]') as HTMLInputElement;
          if (aiInput) aiInput.focus();
        }, 100);
      }
      
      // Legacy handlers
      if (type === 'ELEMENT_CLICKED') {
        const { elementType } = payload;
        
        console.log('Element clicked in preview:', elementType);
        
        if (elementType === 'heading' || elementType === 'button' || elementType === 'text') {
          const propsSection = sections.find(s => s.name === 'Props');
          if (propsSection) {
            console.log('Selecting Props section');
            setSelectedSections(new Set(['Props']));
            setExpandedSections(prev => new Set([...prev, 'Props']));
          }
        }
      }
      
      if (type === 'SECTION_CLICKED') {
        const { section } = payload;
        console.log('[Editor] Section clicked in preview:', section);
        
        // Select the section
        const foundSection = sections.find(s => s.name === section);
        if (foundSection) {
          setSelectedSections(new Set([section]));
        }
        
        // Focus the AI input at bottom
        setTimeout(() => {
          const aiInput = document.querySelector('input[placeholder*="Select"]') as HTMLInputElement;
          if (aiInput) aiInput.focus();
        }, 100);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sections]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Z - Undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      // Cmd/Ctrl + Shift + Z - Redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }
      // Delete key - delete selected sections
      if (e.key === 'Delete' && selectedSections.size > 0 && !editingSection) {
        e.preventDefault();
        saveToHistory(code); // Save before deletion
        selectedSections.forEach(name => {
          const section = sections.find(s => s.name === name);
          if (section) deleteSection(section);
        });
      }
      // Escape key - deselect all
      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedSections(new Set());
        setAiPrompt('');
      }
      // Cmd/Ctrl + A - select all sections
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && !e.shiftKey) {
        e.preventDefault();
        setSelectedSections(new Set(sections.map(s => s.name)));
      }
      // Cmd/Ctrl + Up - move selected section up
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowUp' && selectedSections.size === 1 && !editingSection) {
        e.preventDefault();
        const sectionName = Array.from(selectedSections)[0];
        const section = sections.find(s => s.name === sectionName);
        if (section) {
          saveToHistory(code);
          moveSectionUp(section);
        }
      }
      // Cmd/Ctrl + Down - move selected section down
      if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowDown' && selectedSections.size === 1 && !editingSection) {
        e.preventDefault();
        const sectionName = Array.from(selectedSections)[0];
        const section = sections.find(s => s.name === sectionName);
        if (section) {
          saveToHistory(code);
          moveSectionDown(section);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSections, editingSection, sections, code, historyIndex, codeHistory]);

  // Deploy component to production
  const deployComponent = async () => {
    const componentName = prompt('Enter component name (PascalCase, e.g., LuxuryHero):');
    if (!componentName) return;
    
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(componentName)) {
      alert('Component name must be PascalCase (e.g., LuxuryHero)');
      return;
    }

    const currentVendor = vendors.find(v => v.id === selectedVendor);
    
    setIsSaving(true);
    try {
      console.log('🚀 Deploying component:', componentName, 'for vendor:', currentVendor?.store_name);
      
      const response = await fetch('/api/code/deploy-component', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          componentName,
          vendorId: selectedVendor
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Component deployed successfully!\n\nFile: ${result.filePath}\nKey: ${result.componentKey}\nVendor: ${currentVendor?.store_name}\n\n${result.nextSteps.join('\n')}`);
      } else {
        alert(`Deployment failed: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Deploy error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Streaming Progress - Modern AI Chat Style */}
      {showStreamingPanel && (
        <div className="fixed inset-0 bg-black/98 z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                </div>
                <div className="text-white font-black uppercase text-sm tracking-tight" style={{ fontWeight: 900 }}>
                  AI GENERATING
                </div>
              </div>
              <div className="text-white/40 text-xs font-mono">{streamingStatus}</div>
            </div>
            
            {/* Scrollable Content Area - Modern Chat Style */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              
              {/* Tools - Clean List */}
              {toolsExecuted.map((item, i) => (
                <div key={i} className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-start gap-3">
                    <div className="text-white/40 text-xs font-mono mt-1">{String(i + 1).padStart(2, '0')}</div>
                    <div className="flex-1">
                      <div className="text-white/60 text-xs uppercase tracking-wider mb-1.5">Tool</div>
                      <div className="text-white text-sm font-black uppercase mb-2" style={{ fontWeight: 900 }}>
                        {item.tool}
                      </div>
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-lg p-3">
                        <div className="text-white/80 text-xs mb-1">{item.result}</div>
                        {item.details && (
                          <div className="text-white/40 text-[10px] mt-1">{item.details}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Screenshot Preview (like Cursor AI) */}
              {screenshotPreview && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-start gap-3">
                    <div className="text-white/40 text-xs font-mono mt-1">{String(toolsExecuted.length + 1).padStart(2, '0')}</div>
                    <div className="flex-1">
                      <div className="text-white/60 text-xs uppercase tracking-wider mb-2">Screenshot</div>
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden">
                        <div className="p-3 border-b border-white/5">
                          <div className="text-white/80 text-xs font-mono">{screenshotPreview.title}</div>
                        </div>
                        <img 
                          src={screenshotPreview.data} 
                          alt="Website screenshot"
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Thinking - Animated */}
              {streamingThinking && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-start gap-3">
                    <div className="text-white/40 text-xs font-mono mt-1">{String(toolsExecuted.length + 1).padStart(2, '0')}</div>
                    <div className="flex-1">
                      <div className="text-white/60 text-xs uppercase tracking-wider mb-2">Extended Thinking</div>
                      <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4">
                        <pre className="text-white/60 text-xs font-mono leading-relaxed whitespace-pre-wrap">
{streamingThinking}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Code - VSCode Style with Typewriter */}
              {(streamingText || isGenerating) && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-start gap-3">
                    <div className="text-white/40 text-xs font-mono mt-1">{String(toolsExecuted.length + (streamingThinking ? 2 : 1)).padStart(2, '0')}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-white/60 text-xs uppercase tracking-wider">Generating Code</div>
                        <div className="text-white/40 text-[10px] font-mono">
                          {displayedCode.length} / {streamingText.length} chars
                        </div>
                      </div>
                      
                      {/* VSCode-Style Code Block */}
                      <div className="bg-[#1e1e1e] border border-white/10 rounded-lg overflow-hidden">
                        {/* Code Block Header */}
                        <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between bg-black/50">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                            <span className="text-white/40 text-[10px] font-mono ml-3">component.code</span>
                          </div>
                          <span className="text-white/30 text-[10px] font-mono">React</span>
                        </div>
                        
                        {/* Code Content - Scrollable */}
                        <div className="p-4 max-h-[400px] overflow-auto">
                          <pre className="text-xs font-mono leading-relaxed">
<code className="text-white/90">
{displayedCode || streamingText}<span className="inline-block w-[2px] h-[14px] bg-white/90 animate-pulse ml-0.5 align-middle"></span>
</code>
                          </pre>
                        </div>
                      </div>
                      
                      {/* Generation Status */}
                      {streamingText && displayedCode.length < streamingText.length && (
                        <div className="mt-2 flex items-center gap-2 text-white/40 text-[10px]">
                          <div className="flex gap-1">
                            <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1 h-1 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                          <span>Typing...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Fallback if nothing is showing but generating */}
              {!streamingText && !streamingThinking && toolsExecuted.length === 0 && isGenerating && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="flex gap-2 mb-4">
                    <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-3 h-3 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <div className="text-white/60 text-sm">Connecting to AI...</div>
                  <div className="text-white/40 text-xs mt-2">This may take 5-10 seconds</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Google Fonts Preload */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {FONT_LIBRARY.map(font => (
        <link 
          key={font.name}
          href={`https://fonts.googleapis.com/css2?family=${font.name.replace(/\s+/g, '+')}:wght@${font.weights.join(';')}&display=swap`} 
          rel="stylesheet" 
        />
      ))}
      
      <div className="fixed inset-0 bg-black flex flex-col">
        {/* Top Bar - VSCode Luxury Theme */}
        <div className="h-12 bg-black border-b border-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-white/40 hover:text-white/60 transition-colors">
            <ArrowLeft size={14} strokeWidth={2} />
          </Link>
          
          {/* Undo/Redo */}
          <div className="flex items-center gap-0.5 border-l border-white/5 pl-3 ml-1">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/5 text-white/40 hover:text-white"
              title="Undo (Cmd+Z)"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7h8M3 7l3-3M3 7l3 3" />
              </svg>
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= codeHistory.length - 1}
              className="p-1.5 rounded transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/5 text-white/40 hover:text-white"
              title="Redo (Cmd+Shift+Z)"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 7H3m8 0l-3-3m3 3l-3 3" />
              </svg>
            </button>
          </div>
          
          <div className="border-l border-white/5 pl-3 ml-1 flex items-center gap-2">
            {isCompiling && <RefreshCw size={12} className="animate-spin text-white/30" strokeWidth={2} />}
            {!isCompiling && !compileError && compiledCode && <CheckCircle size={12} className="text-white/40" strokeWidth={2} />}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select 
            value={selectedVendor} 
            onChange={(e) => setSelectedVendor(e.target.value)} 
            className="bg-black border border-white/5 hover:border-white/10 rounded-lg px-3 py-1.5 text-white text-xs font-black uppercase tracking-tight focus:outline-none focus:border-white/20 transition-all" 
            style={{ fontWeight: 900 }}
          >
            {vendors.length === 0 ? (
              <option value="cd2e1122-d511-4edb-be5d-98ef274b4baf">Flora Distro</option>
            ) : (
              vendors.map(vendor => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.store_name}
                </option>
              ))
            )}
          </select>
          <div className="w-px h-4 bg-white/5" />
          <div className="flex gap-0.5 bg-black border border-white/5 rounded-lg p-0.5">
            <button 
              onClick={() => setPreviewMode('desktop')} 
              className={`p-1.5 rounded transition-all ${previewMode === 'desktop' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'}`}
            >
              <Monitor size={12} strokeWidth={2} />
            </button>
            <button 
              onClick={() => setPreviewMode('tablet')} 
              className={`p-1.5 rounded transition-all ${previewMode === 'tablet' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'}`}
            >
              <Maximize2 size={12} strokeWidth={2} />
            </button>
            <button 
              onClick={() => setPreviewMode('mobile')} 
              className={`p-1.5 rounded transition-all ${previewMode === 'mobile' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'}`}
            >
              <Smartphone size={12} strokeWidth={2} />
            </button>
          </div>
          <button
            onClick={() => {
              console.log('ADD clicked');
              setShowComponentBrowser(true);
            }}
            className="bg-black border border-white/5 hover:border-white/10 hover:bg-white/5 text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-tight transition-all flex items-center gap-1.5"
            style={{ fontWeight: 900 }}
          >
            <Plus size={12} strokeWidth={2} />
            Add
          </button>
          <button
            onClick={deployComponent}
            disabled={isSaving || !compiledCode || !!compileError}
            className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-tight transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
            style={{ fontWeight: 900 }}
          >
            {isSaving ? 'Deploying...' : 'Deploy'}
          </button>
          <button
            onClick={() => setShowConversationHistory(true)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"
            title="Conversation History"
          >
            <MessageSquare size={16} strokeWidth={2} />
          </button>
          <button
            onClick={() => setShowAgentConfig(true)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-all"
            title="Agent Configuration"
          >
            <Settings size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Error Notification */}
      {errorMessage && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-200">
          <div className="bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl px-6 py-4 shadow-2xl shadow-black/50 max-w-2xl">
            <div className="flex items-start gap-3">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div className="flex-1">
                <div className="text-red-500 text-sm font-black uppercase tracking-tight mb-1" style={{ fontWeight: 900 }}>
                  Error
                </div>
                <div className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
                  {errorMessage}
                </div>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Visual Tools Only */}
        <div className="w-80 bg-black border-r border-white/5 flex flex-col">
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
            <div className="text-white/60 text-xs font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>
              Editor Tools
            </div>
            <button
              onClick={() => setShowCodePanel(!showCodePanel)}
              className="text-white/40 hover:text-white/60 text-[9px] uppercase tracking-wider transition-all"
              title="Toggle code view"
            >
              {showCodePanel ? 'Hide Code' : 'View Code'}
            </button>
          </div>

          {/* Code Sections - Collapsible */}
          {showCodePanel && (
            <div className="border-b border-white/5 bg-[#0a0a0a] p-4">
              <div className="space-y-2">
                {sections
                  .filter(section => section.type !== 'quantum_state')
                  .map((section, idx) => {
                  const isExpanded = expandedSections.has(section.name);
                  const isEditing = editingSection === section.name;
                  
                  const displayName = section.name
                    .replace('Design & Layout', 'Layout')
                    .replace('Data Fetching', 'Data');
                  
                  return (
                    <div 
                      key={idx}
                      className="bg-[#0a0a0a] border border-white/5 rounded-lg overflow-hidden"
                    >
                      <div 
                        className="px-3 py-2 flex items-center gap-2 cursor-pointer hover:bg-white/5 transition-all"
                        onClick={() => toggleSection(section.name)}
                      >
                        <section.icon size={11} className="text-white/40" strokeWidth={2} />
                        <div className="flex-1 text-[10px] font-black uppercase tracking-tight text-white/60" style={{ fontWeight: 900 }}>
                          {displayName}
                        </div>
                        <ChevronDown size={10} className={`text-white/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} strokeWidth={2} />
                      </div>

                      {isExpanded && (
                        <div className="border-t border-white/5 p-3 bg-black">
                          {isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                value={sectionEdits[section.name] || section.code}
                                onChange={(e) => setSectionEdits({ ...sectionEdits, [section.name]: e.target.value })}
                                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-white text-[10px] font-mono leading-relaxed focus:outline-none focus:border-white/20 resize-none"
                                rows={Math.min(section.code.split('\n').length, 15)}
                                spellCheck={false}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    saveEdit(section.name);
                                    setEditingSection(null);
                                  }} 
                                  className="flex-1 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all" 
                                  style={{ fontWeight: 900 }}
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={() => setEditingSection(null)} 
                                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all" 
                                  style={{ fontWeight: 900 }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <button
                                onClick={() => startEditing(section)}
                                className="w-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all mb-2"
                                style={{ fontWeight: 900 }}
                              >
                                Edit Code
                              </button>
                              <pre 
                                className="text-[9px] font-mono leading-relaxed max-h-48 overflow-auto text-white/40"
                                dangerouslySetInnerHTML={{ 
                                  __html: highlightCode(
                                    section.code
                                      .replace(/</g, '&lt;')
                                      .replace(/>/g, '&gt;')
                                  )
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Visual Tools Panel */}
          <div className="flex-1 overflow-auto bg-[#0a0a0a]">
            <div className="p-4">
                    
              {/* Branding Tool */}
              <div className="mb-4">
                <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3 font-black" style={{ fontWeight: 900 }}>Branding</div>
                <button
                  onClick={addVendorBranding}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-4 rounded-xl text-xs font-black uppercase tracking-tight transition-all flex items-center justify-center gap-2"
                  style={{ fontWeight: 900 }}
                >
                  <Sparkles size={14} strokeWidth={2} />
                  <span>Add Logo & Name</span>
                </button>
              </div>
              
              {/* Content Tools */}
              <div className="mb-4">
                <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3 font-black" style={{ fontWeight: 900 }}>Content</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={showBlueprintFields}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1.5"
                    style={{ fontWeight: 900 }}
                  >
                    <Database size={16} strokeWidth={2} />
                    <span>Blueprint</span>
                  </button>
                  <button
                    onClick={hideDescription}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1.5"
                    style={{ fontWeight: 900 }}
                  >
                    <Eye size={16} strokeWidth={2} />
                    <span>Hide Desc</span>
                  </button>
                  <button
                    onClick={hidePrice}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1.5"
                    style={{ fontWeight: 900 }}
                  >
                    <Eye size={16} strokeWidth={2} />
                    <span>Hide Price</span>
                  </button>
                  <button
                    onClick={showStockQuantity}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1.5"
                    style={{ fontWeight: 900 }}
                  >
                    <Database size={16} strokeWidth={2} />
                    <span>Show Stock</span>
                  </button>
                </div>
              </div>
              
              {/* Layout Tools */}
              <div className="mb-4">
                <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3 font-black" style={{ fontWeight: 900 }}>Grid Layout</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => changeGridColumns(2)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1.5"
                    style={{ fontWeight: 900 }}
                  >
                    <Grid size={16} strokeWidth={2} />
                    <span>2 Col</span>
                  </button>
                  <button
                    onClick={() => changeGridColumns(3)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1.5"
                    style={{ fontWeight: 900 }}
                  >
                    <Grid size={16} strokeWidth={2} />
                    <span>3 Col</span>
                  </button>
                  <button
                    onClick={() => changeGridColumns(4)}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1.5"
                    style={{ fontWeight: 900 }}
                  >
                    <Grid size={16} strokeWidth={2} />
                    <span>4 Col</span>
                  </button>
                </div>
              </div>
              
              {/* Spacing Tools */}
              <div className="mb-4">
                <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3 font-black" style={{ fontWeight: 900 }}>Spacing</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => adjustSpacing('more')}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1.5"
                    style={{ fontWeight: 900 }}
                  >
                    <Move size={16} strokeWidth={2} />
                    <span>More Space</span>
                  </button>
                  <button
                    onClick={() => adjustSpacing('less')}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1.5"
                    style={{ fontWeight: 900 }}
                  >
                    <Move size={16} strokeWidth={2} />
                    <span>Less Space</span>
                  </button>
                </div>
              </div>
              
              {/* Image Tools */}
              <div className="mb-4">
                <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3 font-black" style={{ fontWeight: 900 }}>Images</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => adjustImageSize('bigger')}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1.5"
                    style={{ fontWeight: 900 }}
                  >
                    <Maximize2 size={16} strokeWidth={2} />
                    <span>Bigger</span>
                  </button>
                  <button
                    onClick={() => adjustImageSize('smaller')}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1.5"
                    style={{ fontWeight: 900 }}
                  >
                    <Maximize2 size={16} strokeWidth={2} className="rotate-180" />
                    <span>Smaller</span>
                  </button>
                </div>
              </div>
              
              {/* Typography Tools */}
              <div className="mb-4">
                <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3 font-black" style={{ fontWeight: 900 }}>Typography</div>
                
                {/* Font Picker */}
                <button
                  onClick={() => setShowFontPicker(true)}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all flex items-center justify-center gap-2 mb-2"
                  style={{ fontWeight: 900 }}
                >
                  <Type size={14} strokeWidth={2} />
                  <span>{selectedFont || 'Choose Font'}</span>
                </button>
                
                {/* Font Size */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    onClick={() => adjustFontSize('increase')}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1.5"
                    style={{ fontWeight: 900 }}
                  >
                    <PlusCircle size={16} strokeWidth={2} />
                    <span>Bigger Text</span>
                  </button>
                  <button
                    onClick={() => adjustFontSize('decrease')}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1.5"
                    style={{ fontWeight: 900 }}
                  >
                    <MinusCircle size={16} strokeWidth={2} />
                    <span>Smaller Text</span>
                  </button>
                </div>
                
                {/* Font Weight */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <button
                    onClick={() => adjustFontWeight('increase')}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1.5"
                    style={{ fontWeight: 900 }}
                  >
                    <Bold size={16} strokeWidth={2} />
                    <span>Bolder</span>
                  </button>
                  <button
                    onClick={() => adjustFontWeight('decrease')}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1.5"
                    style={{ fontWeight: 900 }}
                  >
                    <Bold size={16} strokeWidth={2} className="opacity-50" />
                    <span>Lighter</span>
                  </button>
                </div>
                
                {/* Text Alignment */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <button
                    onClick={() => setTextAlignment('left')}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-3 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1"
                    style={{ fontWeight: 900 }}
                  >
                    <AlignLeft size={14} strokeWidth={2} />
                    <span className="text-[9px]">Left</span>
                  </button>
                  <button
                    onClick={() => setTextAlignment('center')}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-3 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1"
                    style={{ fontWeight: 900 }}
                  >
                    <AlignCenter size={14} strokeWidth={2} />
                    <span className="text-[9px]">Center</span>
                  </button>
                  <button
                    onClick={() => setTextAlignment('right')}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-3 py-3 rounded-xl text-[11px] font-black uppercase tracking-tight transition-all flex flex-col items-center justify-center gap-1"
                    style={{ fontWeight: 900 }}
                  >
                    <AlignRight size={14} strokeWidth={2} />
                    <span className="text-[9px]">Right</span>
                  </button>
                </div>
                
                {/* Text Transform & Opacity */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={toggleUppercase}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all"
                    style={{ fontWeight: 900 }}
                  >
                    Toggle Uppercase
                  </button>
                  <button
                    onClick={() => adjustTextOpacity('increase')}
                    className="bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all"
                    style={{ fontWeight: 900 }}
                  >
                    Brighter Text
                  </button>
                </div>
              </div>
            </div>
            
            {/* Reference URL - Visual Inspiration */}
            <div className="p-4 border-t border-white/5">
              <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3 font-black flex items-center gap-2" style={{ fontWeight: 900 }}>
                <Eye size={10} strokeWidth={2} />
                Reference Site (Optional)
              </div>
              <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3 mb-2">
                <input
                  type="url"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="https://example.com (AI will analyze this site)"
                  className="w-full bg-transparent text-white text-xs placeholder-white/30 focus:outline-none"
                />
              </div>
              {referenceUrl && (
                <>
                  <div className="text-white/40 text-[9px] leading-relaxed mb-3">
                    💡 AI will take a screenshot and analyze: colors, layout, typography, spacing, components
                  </div>
                  
                  {/* Manual Screenshot Mode Toggle */}
                  <div className="flex items-center gap-2 p-3 bg-[#0a0a0a] border border-white/10 rounded-xl hover:border-white/20 transition-colors cursor-pointer"
                    onClick={() => setManualScreenshotMode(!manualScreenshotMode)}>
                    <input 
                      type="checkbox"
                      checked={manualScreenshotMode}
                      onChange={(e) => setManualScreenshotMode(e.target.checked)}
                      className="w-3 h-3 rounded bg-white/10 border-white/20"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="text-white text-[10px] font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>
                        👁️ Manual Mode
                      </div>
                      <div className="text-white/40 text-[9px] leading-relaxed">
                        Opens browser visibly - YOU dismiss age gates & choose what to screenshot
                      </div>
                    </div>
                  </div>
                </>
              )}
              {referenceScreenshot && (
                <div className="mt-2">
                  <img src={referenceScreenshot} alt="Reference" className="w-full rounded-lg border border-white/10" />
                </div>
              )}
            </div>
            
            {/* AI Custom - For Advanced Modifications */}
            <div className="p-4 border-t border-white/5">
              <div className="text-white/40 text-[10px] uppercase tracking-wider mb-3 font-black" style={{ fontWeight: 900 }}>
                AI Custom
              </div>
              <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-3">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isGenerating && aiPrompt.trim()) {
                      handleAIGenerate(); // Smart mode - AI decides section
                    }
                  }}
                  placeholder="Type custom modification..."
                  className="w-full bg-transparent text-white text-sm placeholder-white/30 focus:outline-none"
                  disabled={isGenerating}
                />
                {aiPrompt.trim() && (
                  <>
                    {manualScreenshotMode && referenceUrl && (
                      <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                        <div className="flex items-center gap-2 text-yellow-400 text-[10px] font-black uppercase" style={{ fontWeight: 900 }}>
                          <span className="animate-pulse">👁️</span>
                          MANUAL MODE ACTIVE
                        </div>
                        <div className="text-yellow-400/60 text-[9px] mt-1 leading-relaxed">
                          Browser will open visibly for 30 seconds - YOU control it!
                        </div>
                      </div>
                    )}
                    <button
                      onClick={() => handleAIGenerate()}
                      disabled={isGenerating}
                      className="w-full mt-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-30 font-black uppercase text-[10px] tracking-tight flex items-center justify-center gap-2"
                      style={{ fontWeight: 900 }}
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" strokeWidth={2} />
                          <span>{manualScreenshotMode ? 'Opening Browser...' : 'Processing...'}</span>
                        </>
                      ) : (
                        <>
                          <Wand2 size={12} strokeWidth={2} />
                          <span>Apply AI</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {compileError && (
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 mt-3">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle size={16} className="text-white/40 flex-shrink-0 mt-0.5" strokeWidth={2} />
                <div className="text-white text-xs font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>Error</div>
              </div>
              <pre className="text-white/60 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                {compileError.substring(0, 300)}
              </pre>
            </div>
          )}
        </div>

        {/* Right: Preview (Full) */}
        <div className="flex-1 flex flex-col bg-black">
          <div className="bg-black border-b border-white/5 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye size={11} className="text-white/30" strokeWidth={1.5} />
              <span className="text-white/40 text-[10px] font-light tracking-[0.15em] uppercase">Preview</span>
              
              {/* Quantum State Pills (only if component uses quantum) */}
              {code.includes('quantum') && (
                <>
                  <div className="w-px h-3 bg-white/5" />
                  <div className="flex items-center gap-0.5 bg-black border border-white/5 rounded-lg p-0.5">
                    <button
                      onClick={() => setQuantumState('first-visit')}
                      className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tight transition-all ${
                        quantumState === 'first-visit' 
                          ? 'bg-white/10 text-white' 
                          : 'text-white/30 hover:text-white/50'
                      }`}
                      style={{ fontWeight: 900 }}
                    >
                      First Visit
                    </button>
                    <button
                      onClick={() => setQuantumState('returning')}
                      className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tight transition-all ${
                        quantumState === 'returning' 
                          ? 'bg-white/10 text-white' 
                          : 'text-white/30 hover:text-white/50'
                      }`}
                      style={{ fontWeight: 900 }}
                    >
                      Returning
                    </button>
                    <button
                      onClick={() => setQuantumState('auto')}
                      className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tight transition-all ${
                        quantumState === 'auto' 
                          ? 'bg-white/10 text-white' 
                          : 'text-white/30 hover:text-white/50'
                      }`}
                      style={{ fontWeight: 900 }}
                    >
                      Auto
                    </button>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3"></div>
          </div>

          <div className="flex-1 overflow-auto relative">
            <div className={`mx-auto h-full ${previewMode === 'mobile' ? 'max-w-[375px]' : previewMode === 'tablet' ? 'max-w-[768px]' : ''}`}>
              {!compileError && compiledCode && previewHTML ? (
                <>
                  <iframe 
                    key={previewKey}
                    ref={previewRef}
                    srcDoc={previewHTML}
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full h-full border-0"
                  />
                  
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-white/20 text-xs font-light tracking-wide">
                    {compileError ? 'FIX ERRORS' : 'PREVIEW LOADING...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Font Picker Modal */}
      {showFontPicker && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowFontPicker(false)}>
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl w-[800px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Type size={16} className="text-white/60" strokeWidth={2} />
                <div className="text-white text-base font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>Font Library</div>
              </div>
              <button onClick={() => setShowFontPicker(false)} className="text-white/40 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Font List with Previews */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4">
                {FONT_LIBRARY.map(font => (
                  <button
                    key={font.name}
                    onClick={() => applyFont(font.name)}
                    className="bg-[#0a0a0a] border border-white/5 hover:border-white/20 rounded-xl p-4 transition-all text-left group"
                  >
                    <link href={`https://fonts.googleapis.com/css2?family=${font.name.replace(/\s+/g, '+')}:wght@${font.weights.join(';')}&display=swap`} rel="stylesheet" />
                    <div className="mb-3 pb-3 border-b border-white/5">
                      <div className="text-white font-black uppercase text-xs mb-1" style={{ fontWeight: 900 }}>
                        {font.name}
                      </div>
                      <div className="text-white/40 text-[10px] uppercase tracking-wider">
                        {font.category}
                      </div>
                    </div>
                    <div 
                      className="text-white text-2xl mb-2 transition-all group-hover:text-white" 
                      style={{ fontFamily: `'${font.name}', sans-serif`, fontWeight: 900 }}
                    >
                      The Quick Brown Fox
                    </div>
                    <div 
                      className="text-white/60 text-sm leading-relaxed" 
                      style={{ fontFamily: `'${font.name}', sans-serif` }}
                    >
                      Jumps over the lazy dog. 1234567890
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Component Browser Modal - WhaleTools Theme */}
      {showComponentBrowser && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50" onClick={() => setShowComponentBrowser(false)}>
          <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl w-[700px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="text-white text-base font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>Smart Components</div>
              <button onClick={() => setShowComponentBrowser(false)} className="text-white/40 hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Categories */}
            <div className="flex-1 overflow-y-auto">
              {['layout', 'commerce', 'content', 'interactive'].map(category => {
                const components = SMART_COMPONENTS.filter(c => c.category === category);
                if (components.length === 0) return null;
                
                return (
                  <div key={category} className="border-b border-white/5 last:border-0">
                    <div className="px-6 py-3 bg-white/[0.02]">
                      <div className="text-white/40 text-xs font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>{category}</div>
                    </div>
                    <div className="divide-y divide-white/5">
                      {components.map(comp => (
                        <button
                          key={comp.key}
                          onClick={() => {
                            console.log('Component selected:', comp.name);
                            
                            // Generate new section content based on component type
                            let newDataSection = '';
                            let newRenderContent = '';
                            
                            if (comp.key === 'smart_product_grid' || comp.key === 'smart_product_showcase') {
                              newDataSection = `products = fetch("/api/products?vendor_id=${selectedVendor}&limit=6") @cache(5m)`;
                              newRenderContent = `<div className="bg-black py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-black uppercase text-white mb-8">{headline}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map(p => (
            <div key={p.id} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
              <img src={p.featured_image_storage} alt={p.name} className="w-full aspect-square object-cover rounded-xl mb-4" />
              <h3 className="text-white font-black uppercase text-lg mb-2">{p.name}</h3>
              <p className="text-white/60 text-sm mb-4">{p.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-white font-black text-2xl">\${p.price}</span>
                <span className="text-white/40 text-xs">{p.stock_quantity} in stock</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>`;
                            } else if (comp.key === 'smart_testimonials') {
                              newDataSection = `testimonials = fetch("/api/testimonials?vendor_id=${selectedVendor}") @cache(10m)`;
                              newRenderContent = `<div className="bg-black py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-black uppercase text-white mb-8">{headline}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map(t => (
            <div key={t.id} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-black">
                  {t.customer_name?.charAt(0)}
                </div>
                <div>
                  <div className="text-white font-black uppercase text-sm">{t.customer_name}</div>
                  <div className="text-white/40 text-xs">{'★'.repeat(t.rating)}</div>
                </div>
              </div>
              <p className="text-white/60 leading-relaxed">{t.review_text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>`;
                            } else {
                              newRenderContent = `<div className="bg-black py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-black uppercase text-white mb-8">{headline}</h2>
        <p className="text-white/60">Component content goes here...</p>
      </div>
    </div>`;
                            }
                            
                            // If React is empty or only has initial template, create new component
                            if (!code.trim() || code.includes('Your Headline')) {
                              const template = `component ${comp.name.replace(/\s/g, '')} {
  props {
    headline: String = "${comp.name}"
  }
  
  data {
    ${newDataSection}
  }
  
  render {
    ${newRenderContent}
  }
}`;
                              setCode(template);
                            } else {
                              // Merge new content into existing component
                              const lines = code.split('\n');
                              
                              // Find data section
                              const dataStartIdx = lines.findIndex(l => l.trim().startsWith('data {'));
                              if (dataStartIdx !== -1 && newDataSection) {
                                // Find closing brace of data section
                                let braceCount = 0;
                                let dataEndIdx = dataStartIdx;
                                for (let i = dataStartIdx; i < lines.length; i++) {
                                  braceCount += (lines[i].match(/{/g) || []).length;
                                  braceCount -= (lines[i].match(/}/g) || []).length;
                                  if (braceCount === 0 && i > dataStartIdx) {
                                    dataEndIdx = i;
                                    break;
                                  }
                                }
                                // Insert new data fetch before closing brace
                                lines.splice(dataEndIdx, 0, `    ${newDataSection}`);
                              } else if (newDataSection) {
                                // No data section exists, add one before render
                                const renderStartIdx = lines.findIndex(l => l.trim().startsWith('render {'));
                                if (renderStartIdx !== -1) {
                                  lines.splice(renderStartIdx, 0, `  data {`, `    ${newDataSection}`, `  }`, ``);
                                }
                              }
                              
                              // Find render section and append new content
                              const renderStartIdx = lines.findIndex(l => l.trim().startsWith('render {'));
                              if (renderStartIdx !== -1) {
                                // Find closing brace of render section
                                let braceCount = 0;
                                let renderEndIdx = renderStartIdx;
                                for (let i = renderStartIdx; i < lines.length; i++) {
                                  braceCount += (lines[i].match(/{/g) || []).length;
                                  braceCount -= (lines[i].match(/}/g) || []).length;
                                  if (braceCount === 0 && i > renderStartIdx) {
                                    renderEndIdx = i;
                                    break;
                                  }
                                }
                                // Insert new render content before closing brace
                                const indentedContent = newRenderContent.split('\n').map(line => `    ${line}`).join('\n');
                                lines.splice(renderEndIdx, 0, indentedContent);
                              }
                              
                              setCode(lines.join('\n'));
                            }
                            
                            setShowComponentBrowser(false);
                          }}
                          className="w-full px-6 py-4 hover:bg-white/[0.03] transition-colors text-left group"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-2 h-2 rounded-full bg-white/20 mt-2 group-hover:bg-white transition-colors"></div>
                            <div className="flex-1">
                              <div className="text-white text-base font-black uppercase tracking-tight mb-1 group-hover:text-white transition-colors" style={{ fontWeight: 900 }}>{comp.name}</div>
                              <div className="text-white/60 text-sm leading-relaxed">{comp.description}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Agent Configuration Panel */}
      <AgentConfigPanel
        isOpen={showAgentConfig}
        onClose={() => setShowAgentConfig(false)}
      />

      {/* Conversation History Panel */}
      <ConversationHistory
        isOpen={showConversationHistory}
        onClose={() => setShowConversationHistory(false)}
        onLoadConversation={(conversationId, messages) => {
          setCurrentConversationId(conversationId);
          setShowConversationHistory(false);
          console.log('Loaded conversation:', conversationId, 'with', messages.length, 'messages');
        }}
      />
    </>
  );
}
