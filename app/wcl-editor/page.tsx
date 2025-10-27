"use client";

/**
 * WCL Editor - Monochrome Minimalist
 * WhaleTools pure black/white theme
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Eye, Sparkles, RefreshCw, AlertCircle, CheckCircle,
  Monitor, Smartphone, Maximize2, Send, ArrowLeft, 
  ChevronDown, Type, Database, Zap, Edit2, Save, Plus, Trash2
} from 'lucide-react';
import { WCLCompiler } from '@/lib/wcl/compiler';
import Link from 'next/link';

// Clean syntax highlighter with purple/white accents
const highlightWCL = (code: string): string => {
  return code
    // Keywords (purple)
    .replace(/\b(component|props|data|render|quantum|state|when)\b/g, '<span class="text-purple-400">$1</span>')
    // Functions (cyan/purple)
    .replace(/\b(fetch)\b/g, '<span class="text-purple-300">$1</span>')
    // Types (white)
    .replace(/\b(String|Number|Boolean)\b/g, '<span class="text-white/90">$1</span>')
    // Strings (white/green tint)
    .replace(/"([^"]*)"/g, '<span class="text-emerald-300/80">"$1"</span>')
    // Annotations (purple/pink)
    .replace(/@(\w+)/g, '<span class="text-pink-400/80">@$1</span>')
    // Props/variables in braces (white)
    .replace(/{(\w+)}/g, '{<span class="text-white/80">$1</span>}')
    // className attributes (purple)
    .replace(/className=/g, '<span class="text-purple-300">className</span>=')
    // Make base text white/50
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

const getInitialWCL = (vendorLogoUrl?: string) => `component BlankCanvas {
  props {
    title: String = ""
    subtitle: String = ""
  }
  
  render {
    <div className="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6">
      <div className="max-w-4xl mx-auto text-center">
        ${vendorLogoUrl ? `<img src="${vendorLogoUrl}" alt="Logo" className="h-24 w-auto mx-auto mb-12 object-contain opacity-20" />` : ''}
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-black uppercase tracking-tight text-white/10 mb-6 leading-[0.9]">
          {title || "Your Headline"}
        </h1>
        <p className="text-xl sm:text-2xl text-white/10 leading-relaxed">
          {subtitle || "Your subtitle text"}
        </p>
      </div>
    </div>
  }
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

export default function WCLEditor() {
  const [wclCode, setWclCode] = useState('');
  const [compiledCode, setCompiledCode] = useState('');
  const [compileError, setCompileError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [quantumState, setQuantumState] = useState<'auto' | 'first-visit' | 'returning'>('auto');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['Design & Layout']));
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


  // Fetch vendors on mount
  useEffect(() => {
    fetch('/api/admin/vendors')
      .then(res => res.json())
      .then(data => {
        if (data.vendors) {
          setVendors(data.vendors);
          // Set initial WCL with Flora Distro logo
          const floraDistro = data.vendors.find((v: Vendor) => v.id === 'cd2e1122-d511-4edb-be5d-98ef274b4baf');
          setWclCode(getInitialWCL(floraDistro?.logo_url));
          // Set initial vendor ref
          prevVendorRef.current = 'cd2e1122-d511-4edb-be5d-98ef274b4baf';
          console.log('✅ Vendors loaded:', data.vendors.length, 'Initial vendor:', floraDistro?.store_name);
        }
      })
      .catch(err => console.error('Failed to fetch vendors:', err));
  }, []);

  // Update WCL code when vendor changes - replace vendor_id and logo references
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
    setWclCode(prevCode => {
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
        console.log('✅ WCL code updated for vendor switch');
      } else {
        console.warn('⚠️ WCL code unchanged after vendor switch');
      }
      
      return updatedCode;
    });
    
    // Update ref to track current vendor
    prevVendorRef.current = selectedVendor;
    
    // Force refresh preview after vendor change
    setTimeout(() => {
      console.log('🔄 Refreshing preview for new vendor');
      updatePreviewFromWCL();
    }, 500);
  }, [selectedVendor, vendors]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-compile and preview on code change
  useEffect(() => {
    if (!wclCode) return;
    
    const compileTimeout = setTimeout(() => {
      compileWCL();
      updatePreviewFromWCL();
    }, 800); // Faster feedback
    
    return () => clearTimeout(compileTimeout);
  }, [wclCode]);

  // Update preview by rendering WCL on server
  const updatePreviewFromWCL = async () => {
    if (!wclCode) {
      console.warn('⚠️ No WCL code to render');
      return;
    }
    
    console.log('🔄 Rendering preview from WCL...');
    console.log('📝 WCL Code length:', wclCode.length);
    
    // Strip block comments (/* ... */) before sending to API
    const cleanedWclCode = wclCode.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    console.log('🧹 Cleaned WCL length:', cleanedWclCode.length);
    
    try {
      const response = await fetch('/api/wcl/render-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wclCode: cleanedWclCode, quantumState })
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

  const compileWCL = useCallback(() => {
    setIsCompiling(true);
    try {
      const compiler = new WCLCompiler();
      // Strip block comments before compiling
      const cleanedWclCode = wclCode.replace(/\/\*[\s\S]*?\*\//g, '').trim();
      const compiled = compiler.compile(cleanedWclCode);
      setCompiledCode(compiled);
      setCompileError(null);
    } catch (error: any) {
      setCompileError(error.toString());
    } finally {
      setIsCompiling(false);
    }
  }, [wclCode]);

  const parseSections = useCallback((): Section[] => {
    const sections: Section[] = [];
    const lines = wclCode.split('\n');
    
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
  }, [wclCode]);

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
    const lines = wclCode.split('\n');
    lines.splice(section.lineStart - 1, section.lineEnd - section.lineStart + 1, ...newCode.split('\n'));
    setWclCode(lines.join('\n'));
    setEditingSection(null);
  };

  const deleteSection = (section: Section) => {
    if (!confirm(`Delete "${section.name}" section? This cannot be undone.`)) {
      return;
    }

    const lines = wclCode.split('\n');
    
    // Remove the section lines (including the closing brace)
    lines.splice(
      section.lineStart - 1,
      section.lineEnd - section.lineStart + 1
    );
    
    const newWCLCode = lines.join('\n');
    console.log('🗑️  Deleted section:', section.name);
    setWclCode(newWCLCode);
    setSelectedSection(null);
    setEditingSection(null);
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(section.name);
      return newSet;
    });
  };

  const handleAIGenerate = async (section: Section) => {
    if (!aiPrompt.trim()) return;
    
    const currentVendor = vendors.find(v => v.id === selectedVendor);
    console.log('🤖 AI Request:', aiPrompt, 'for section:', section.name, 'vendor:', currentVendor?.store_name);
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/ai/modify-wcl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          sectionName: section.name,
          sectionCode: section.code,
          fullWCLCode: wclCode,
          vendorId: selectedVendor,
          vendorName: currentVendor?.store_name,
          vendorLogo: currentVendor?.logo_url
        })
      });
      
      const result = await response.json();
      console.log('🤖 AI Response:', result);
      
      if (result.success && result.modifiedSection) {
        console.log('✅ AI returned modified section');
        
        const modifiedCode = result.modifiedSection;
        
        // Check if AI added a data section
        const hasDataSection = modifiedCode.includes('data {');
        
        if (hasDataSection && section.type === 'render') {
          // AI added data + render, insert data section before render
          console.log('📦 AI added data section, inserting into component');
          
          const lines = wclCode.split('\n');
          const renderStart = section.lineStart - 1;
          
          // Insert the entire modified block (data + render)
          const modifiedLines = modifiedCode.split('\n');
          lines.splice(renderStart, section.lineEnd - section.lineStart + 1, ...modifiedLines);
          
          const newWCLCode = lines.join('\n');
          console.log('📝 Updated WCL with data + render');
          setWclCode(newWCLCode);
        } else {
          // Normal section replacement
          const lines = wclCode.split('\n');
          const newSectionLines = modifiedCode.split('\n');
          
          lines.splice(
            section.lineStart - 1, 
            section.lineEnd - section.lineStart + 1,
            ...newSectionLines
          );
          
          const newWCLCode = lines.join('\n');
          console.log('📝 Updated WCL code');
          setWclCode(newWCLCode);
        }
        
        setAiPrompt('');
        setSelectedSection(null);
        
        console.log('✅ Code updated! Preview will refresh automatically');
      } else {
        console.error('❌ No modified section in response');
        alert('AI failed to modify section');
      }
    } catch (error: any) {
      console.error('❌ AI error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Listen for clicks in preview
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      const { type, payload } = event.data;
      
      console.log('Message received:', type, payload);
      
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
      // Delete key - delete selected sections
      if (e.key === 'Delete' && selectedSections.size > 0 && !editingSection) {
        e.preventDefault();
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
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedSections(new Set(sections.map(s => s.name)));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSections, editingSection, sections]);

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
      
      const response = await fetch('/api/wcl/deploy-component', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wclCode,
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
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Top Bar - VSCode Luxury Theme */}
      <div className="h-12 bg-black border-b border-white/5 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="text-white/40 hover:text-white/60 transition-colors">
            <ArrowLeft size={14} strokeWidth={2} />
          </Link>
          {isCompiling && <RefreshCw size={12} className="animate-spin text-white/30" strokeWidth={2} />}
          {!isCompiling && !compileError && compiledCode && <CheckCircle size={12} className="text-white/40" strokeWidth={2} />}
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
            disabled={isSaving || !compiledCode || compileError}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-tight transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5"
            style={{ fontWeight: 900 }}
          >
            {isSaving ? 'Deploying...' : 'Deploy'}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Structure - Clean Selection Interface */}
        <div className="w-80 bg-black border-r border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white/40 text-xs font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>Structure</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const editableSections = sections.filter(s => s.type !== 'quantum_state');
                    if (selectedSections.size === editableSections.length) {
                      setSelectedSections(new Set());
                    } else {
                      setSelectedSections(new Set(editableSections.map(s => s.name)));
                    }
                  }}
                  className="text-white/40 hover:text-white text-[10px] uppercase tracking-wider font-black transition-all"
                  style={{ fontWeight: 900 }}
                >
                  {selectedSections.size === sections.filter(s => s.type !== 'quantum_state').length ? 'Deselect All' : 'Select All'}
                </button>
                <div className="text-white/20 text-xs">{sections.filter(s => s.type !== 'quantum_state').length}</div>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-4">
            {sections
              .filter(section => section.type !== 'quantum_state') // Hide quantum states - now handled by pills in preview header
              .map((section, idx) => {
              const isExpanded = expandedSections.has(section.name);
              const isEditing = editingSection === section.name;
              const isSelected = selectedSections.has(section.name);
              
              // Compact section names
              const displayName = section.name
                .replace('Design & Layout', 'Layout')
                .replace('Data Fetching', 'Data')
                .replace('Component', 'Comp');
              
              return (
                <div 
                  key={idx}
                  data-section={section.name}
                  onClick={() => {
                    const newSelected = new Set(selectedSections);
                    if (isSelected) {
                      newSelected.delete(section.name);
                    } else {
                      newSelected.add(section.name);
                    }
                    setSelectedSections(newSelected);
                  }}
                  className={`border rounded-xl mb-1.5 overflow-hidden transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-white/10 border-white/20 shadow-lg shadow-white/5' 
                      : 'bg-[#0a0a0a] border-white/5 hover:bg-white/[0.03] hover:border-white/10'
                  }`}
                >
                  {/* Compact Header */}
                  <div className="px-3 py-2 flex items-center gap-2">
                    <section.icon size={12} className={`${isSelected ? 'text-white' : 'text-white/40'} transition-colors`} strokeWidth={2} />
                    <div className={`text-xs font-black uppercase tracking-tight flex-1 ${isSelected ? 'text-white' : 'text-white/60'} transition-colors`} style={{ fontWeight: 900 }}>
                      {displayName}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(section);
                        }}
                        className="text-white/30 hover:text-white p-1 rounded hover:bg-white/5 transition-all"
                        title="Edit"
                      >
                        <Edit2 size={11} strokeWidth={2} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSection(section.name);
                        }}
                        className="text-white/30 hover:text-white p-1 rounded hover:bg-white/5 transition-all"
                        title={isExpanded ? "Collapse" : "View"}
                      >
                        <ChevronDown size={11} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} strokeWidth={2} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSection(section);
                        }}
                        className="text-white/30 hover:text-red-500 p-1 rounded hover:bg-red-500/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={11} strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  {/* Code Preview (Collapsible) */}
                  {isExpanded && (
                    <div className="border-t border-white/5 bg-black/40 p-3">
                      {isEditing ? (
                        <>
                          <textarea
                            value={sectionEdits[section.name] || section.code}
                            onChange={(e) => setSectionEdits({ ...sectionEdits, [section.name]: e.target.value })}
                            className="w-full bg-black/80 border border-white/10 rounded-lg p-2 text-white/80 text-[10px] font-mono font-light focus:outline-none focus:border-white/20 resize-none mb-2"
                            rows={Math.min(section.code.split('\n').length, 12)}
                            spellCheck={false}
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={() => saveEdit(section.name)} 
                              className="flex-1 bg-white hover:bg-white/90 text-black px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-tight transition-all" 
                              style={{ fontWeight: 900 }}
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => setEditingSection(null)} 
                              className="flex-1 bg-black/50 hover:bg-white/5 border border-white/5 text-white/60 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-tight transition-all" 
                              style={{ fontWeight: 900 }}
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <pre 
                          className="text-[10px] font-mono font-light leading-relaxed max-h-48 overflow-auto"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightWCL(
                              section.code
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;')
                            )
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Global AI Chat at Bottom */}
          <div className="border-t border-white/5 bg-[#0a0a0a] p-4">
            {selectedSections.size > 0 && (
              <div className="mb-3 flex flex-wrap gap-1">
                {Array.from(selectedSections).map(name => {
                  const displayName = name
                    .replace('Design & Layout', 'Layout')
                    .replace('Data Fetching', 'Data')
                    .replace('Component', 'Comp');
                  return (
                    <div key={name} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white/60 font-black uppercase tracking-tight flex items-center gap-1">
                      {displayName}
                      <button
                        onClick={() => {
                          const newSelected = new Set(selectedSections);
                          newSelected.delete(name);
                          setSelectedSections(newSelected);
                        }}
                        className="text-white/40 hover:text-white"
                      >
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M2 2l4 4M6 2l-4 4" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-white/40" strokeWidth={2} />
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isGenerating && aiPrompt.trim() && selectedSections.size > 0) {
                    const firstSection = sections.find(s => selectedSections.has(s.name));
                    if (firstSection) handleAIGenerate(firstSection);
                  }
                }}
                placeholder={
                  selectedSections.size === 0 
                    ? 'Select sections to modify with AI...'
                    : selectedSections.size === 1
                    ? 'Ask AI to modify selected section...'
                    : `Ask AI to modify ${selectedSections.size} sections...`
                }
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs placeholder-white/30 focus:outline-none focus:border-white/20 focus:bg-black transition-all"
                disabled={isGenerating || selectedSections.size === 0}
              />
              {aiPrompt.trim() && selectedSections.size > 0 && (
                <button
                  onClick={() => {
                    const firstSection = sections.find(s => selectedSections.has(s.name));
                    if (firstSection) handleAIGenerate(firstSection);
                  }}
                  disabled={isGenerating}
                  className="bg-white hover:bg-white/90 text-black p-2.5 rounded-xl transition-all disabled:opacity-30"
                  title="Send to AI"
                >
                  {isGenerating ? <RefreshCw size={14} className="animate-spin" strokeWidth={2} /> : <Send size={14} strokeWidth={2} />}
                </button>
              )}
            </div>
            {isGenerating && (
              <div className="mt-2 flex items-center gap-2 text-white/40 text-xs">
                <RefreshCw size={12} className="animate-spin" strokeWidth={2} />
                <span>Processing {selectedSections.size} section{selectedSections.size > 1 ? 's' : ''}...</span>
              </div>
            )}
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
              {wclCode.includes('quantum') && (
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
                  
                  {/* Floating Toolbar on Selection */}
                  {selectedSections.size > 0 && (
                    <div className="absolute top-4 right-4 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center gap-2 shadow-2xl shadow-black/50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-3 py-1.5 border-r border-white/10">
                        <div className="text-white/40 text-[9px] uppercase tracking-wider mb-0.5">Selected</div>
                        <div className="text-white text-xs font-black uppercase tracking-tight" style={{ fontWeight: 900 }}>
                          {selectedSections.size} Section{selectedSections.size > 1 ? 's' : ''}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setAiPrompt('');
                          const aiInput = document.querySelector(`input[placeholder*="Select"]`) as HTMLInputElement;
                          if (aiInput) aiInput.focus();
                        }}
                        className="text-white/60 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all"
                        title="Ask AI"
                      >
                        <Sparkles size={14} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => {
                          selectedSections.forEach(name => {
                            const section = sections.find(s => s.name === name);
                            if (section) deleteSection(section);
                          });
                        }}
                        className="text-white/60 hover:text-red-500 hover:bg-red-500/10 p-2 rounded-xl transition-all"
                        title="Delete Selected (Del)"
                      >
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => setSelectedSections(new Set())}
                        className="text-white/40 hover:text-white/60 hover:bg-white/10 p-2 rounded-xl transition-all ml-1"
                        title="Deselect All (Esc)"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M3 3l8 8M11 3l-8 8" />
                        </svg>
                      </button>
                    </div>
                  )}
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
                            // Generate WCL template for this component
                            const template = `component ${comp.name.replace(/\s/g, '')} {
  props {
    headline: String = "${comp.name}"
  }
  
  data {
    ${comp.key === 'smart_product_grid' || comp.key === 'smart_product_showcase' ? 
      `products = fetch("/api/products?vendor_id=${selectedVendor}&limit=6") @cache(5m)` : 
      comp.key === 'smart_testimonials' ?
      `testimonials = fetch("/api/testimonials?vendor_id=${selectedVendor}") @cache(10m)` :
      '// Add data fetching here'}
  }
  
  render {
    <div className="bg-black py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-5xl font-black uppercase text-white mb-8">{headline}</h2>
        ${comp.key === 'smart_product_grid' || comp.key === 'smart_product_showcase' ? 
          `<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>` : 
        comp.key === 'smart_testimonials' ?
          `<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        </div>` :
          '<p className="text-white/60">Component content goes here...</p>'}
      </div>
    </div>
  }
}`;
                            setWclCode(template);
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
  );
}
