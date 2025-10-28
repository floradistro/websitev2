"use client";

/**
 * Storefront Builder - Refactored
 * AI-powered React component editor for WhaleTools
 * Reduced from 2,612 lines to ~350 lines with better architecture
 */

import { useState, useEffect, useCallback } from 'react';
import { parseSections, deleteSection as utilDeleteSection, moveSectionUp as utilMoveSectionUp, moveSectionDown as utilMoveSectionDown } from '@/lib/storefront-builder/utils';
import { Type, Database, Eye, Zap } from 'lucide-react';

// Components
import { TopBar } from './components/TopBar';
import { ToolsPanel } from './components/ToolsPanel';
import { AIPanel } from './components/AIPanel';
import { PreviewFrame } from './components/PreviewFrame';
import { StreamingPanel } from './components/StreamingPanel';
import { FontPicker } from './components/FontPicker';
import { ComponentBrowser } from './components/ComponentBrowser';
import { InlineEditor } from './components/InlineEditor';
import { AgentConfigPanel } from '@/components/admin/AgentConfigPanel';
import { ConversationHistory } from '@/components/admin/ConversationHistory';

// Hooks
import { useCodeEditor } from './hooks/useCodeEditor';
import { useVendorSelection } from './hooks/useVendorSelection';
import { useAIGeneration } from './hooks/useAIGeneration';
import { usePreview } from './hooks/usePreview';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useLiveEditor } from './hooks/useLiveEditor';

export default function StorefrontBuilder() {
  // UI State
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showComponentBrowser, setShowComponentBrowser] = useState(false);
  const [showAgentConfig, setShowAgentConfig] = useState(false);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());

  // Initialize code editor hook
  const codeEditor = useCodeEditor('', 'cd2e1122-d511-4edb-be5d-98ef274b4baf');

  // Initialize vendor selection hook
  const vendorSelection = useVendorSelection(
    (newCode) => codeEditor.setCode(newCode),
    () => preview.updatePreview()
  );

  // Initialize preview hook
  const preview = usePreview(
    codeEditor.code,
    vendorSelection.selectedVendor,
    vendorSelection.currentVendor
  );

  // Initialize AI generation hook
  const aiGeneration = useAIGeneration(
    codeEditor.code,
    codeEditor.setCode,
    vendorSelection.selectedVendor,
    vendorSelection.currentVendor
  );

  // Initialize live editor hook (Canva-style editing)
  const liveEditor = useLiveEditor(
    codeEditor.code,
    codeEditor.setCode,
    preview.previewRef
  );

  // Parse sections from code
  const sections = parseSections(codeEditor.code).map(section => ({
    ...section,
    icon: section.type === 'props' ? Type : section.type === 'data' ? Database : section.type === 'render' ? Eye : Zap
  }));

  // Section manipulation functions
  const deleteSection = useCallback((section: any) => {
    if (!confirm(`Delete "${section.name}" section? This cannot be undone.`)) return;

    codeEditor.saveToHistory(codeEditor.code);
    const newCode = utilDeleteSection(codeEditor.code, section);
    codeEditor.setCode(newCode);
    setSelectedSections(new Set());
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      newSet.delete(section.name);
      return newSet;
    });
  }, [codeEditor]);

  const moveSectionUp = useCallback((section: any) => {
    const newCode = utilMoveSectionUp(codeEditor.code, section, sections);
    codeEditor.setCode(newCode);
  }, [codeEditor, sections]);

  const moveSectionDown = useCallback((section: any) => {
    const newCode = utilMoveSectionDown(codeEditor.code, section, sections);
    codeEditor.setCode(newCode);
  }, [codeEditor, sections]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    undo: codeEditor.undo,
    redo: codeEditor.redo,
    sections,
    selectedSections,
    setSelectedSections,
    editingSection: null,
    deleteSection,
    moveSectionUp,
    moveSectionDown,
    setAiPrompt: aiGeneration.setAiPrompt,
    saveToHistory: codeEditor.saveToHistory,
    code: codeEditor.code,
  });

  // Handle vendor change
  useEffect(() => {
    const newCode = vendorSelection.handleVendorChange(vendorSelection.selectedVendor, codeEditor.code);
    if (newCode !== codeEditor.code) {
      codeEditor.setCode(newCode);
    }
  }, [vendorSelection.selectedVendor]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for clicks in preview iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      const { type, payload } = event.data;

      if (!type || !['ELEMENT_SELECTED', 'ELEMENT_CLICKED', 'SECTION_CLICKED'].includes(type)) {
        return;
      }

      if (type === 'ELEMENT_SELECTED' || type === 'ELEMENT_CLICKED') {
        const propsSection = sections.find(s => s.name === 'Props');
        if (propsSection) {
          setSelectedSections(new Set(['Props']));
          setExpandedSections(prev => new Set([...prev, 'Props']));
        }

        setTimeout(() => {
          const aiInput = document.querySelector('input[placeholder*="Select"]') as HTMLInputElement;
          if (aiInput) aiInput.focus();
        }, 100);
      }

      if (type === 'SECTION_CLICKED' && payload.section) {
        const foundSection = sections.find(s => s.name === payload.section);
        if (foundSection) {
          setSelectedSections(new Set([payload.section]));
        }

        setTimeout(() => {
          const aiInput = document.querySelector('input[placeholder*="Select"]') as HTMLInputElement;
          if (aiInput) aiInput.focus();
        }, 100);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sections]);

  // Handle component selection from browser
  const handleComponentSelection = useCallback((componentKey: string) => {
    const component = require('@/lib/storefront-builder/constants').SMART_COMPONENTS.find((c: any) => c.key === componentKey);
    if (!component) return;

    // Component insertion logic
    let newDataSection = '';
    let newRenderContent = '';

    if (componentKey === 'smart_product_grid' || componentKey === 'smart_product_showcase') {
      newDataSection = `products = fetch("/api/products?vendor_id=${vendorSelection.selectedVendor}&limit=6") @cache(5m)`;
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
    } else if (componentKey === 'smart_testimonials') {
      newDataSection = `testimonials = fetch("/api/testimonials?vendor_id=${vendorSelection.selectedVendor}") @cache(10m)`;
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

    // If code is empty or only has initial template, create new component
    if (!codeEditor.code.trim() || codeEditor.code.includes('Your Headline')) {
      const template = `component ${component.name.replace(/\s/g, '')} {
  props {
    headline: String = "${component.name}"
  }

  data {
    ${newDataSection}
  }

  render {
    ${newRenderContent}
  }
}`;
      codeEditor.setCode(template);
    } else {
      // Merge new content into existing component
      const lines = codeEditor.code.split('\n');

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
        const indentedContent = newRenderContent.split('\n').map(line => `    ${line}`).join('\n');
        lines.splice(renderEndIdx, 0, indentedContent);
      }

      codeEditor.setCode(lines.join('\n'));
    }
  }, [codeEditor, vendorSelection.selectedVendor]);

  return (
    <>
      {/* Main Layout */}
      <div className="min-h-screen bg-black flex flex-col">
        {/* Top Bar */}
        <TopBar
          vendors={vendorSelection.vendors}
          selectedVendor={vendorSelection.selectedVendor}
          onVendorChange={vendorSelection.setSelectedVendor}
          onShowConversationHistory={() => setShowConversationHistory(true)}
          onShowAgentConfig={() => setShowAgentConfig(true)}
        />

        {/* Main Content: Left Panel + Preview */}
        <div className="flex-1 flex">
          {/* Left Panel: Tools + AI */}
          <div className="w-80 bg-black border-r border-white/5 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <ToolsPanel
                tools={codeEditor.tools}
                currentVendor={vendorSelection.currentVendor}
                onShowFontPicker={() => setShowFontPicker(true)}
              />
            </div>

            <AIPanel
              aiPrompt={aiGeneration.aiPrompt}
              setAiPrompt={aiGeneration.setAiPrompt}
              isGenerating={aiGeneration.isGenerating}
              onGenerate={aiGeneration.handleAIGenerate}
            />

            {codeEditor.compileError && (
              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 m-4 mt-0">
                <div className="text-white text-xs font-black uppercase tracking-tight mb-2" style={{ fontWeight: 900 }}>
                  Error
                </div>
                <pre className="text-white/60 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                  {codeEditor.compileError.substring(0, 300)}
                </pre>
              </div>
            )}

            {(codeEditor.errorMessage || aiGeneration.errorMessage) && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 m-4">
                <div className="text-red-400 text-xs">
                  {codeEditor.errorMessage || aiGeneration.errorMessage}
                </div>
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <PreviewFrame
            previewHTML={preview.previewHTML}
            previewKey={preview.previewKey}
            previewRef={preview.previewRef}
            previewMode={preview.previewMode}
            quantumState={preview.quantumState}
            setQuantumState={preview.setQuantumState}
            compileError={codeEditor.compileError}
            compiledCode={codeEditor.compiledCode}
            code={codeEditor.code}
          />
        </div>
      </div>

      {/* Modals */}
      <StreamingPanel
        isVisible={aiGeneration.showStreamingPanel}
        status={aiGeneration.streamingStatus}
        thinking={aiGeneration.streamingThinking}
        displayedCode={aiGeneration.displayedCode}
        toolsExecuted={aiGeneration.toolsExecuted}
        screenshotPreview={aiGeneration.screenshotPreview}
      />

      <FontPicker
        isVisible={showFontPicker}
        onClose={() => setShowFontPicker(false)}
        onSelectFont={(fontName) => {
          codeEditor.tools.applyFont(fontName);
          setShowFontPicker(false);
        }}
      />

      <ComponentBrowser
        isVisible={showComponentBrowser}
        onClose={() => setShowComponentBrowser(false)}
        onSelectComponent={handleComponentSelection}
      />

      <AgentConfigPanel
        isOpen={showAgentConfig}
        onClose={() => setShowAgentConfig(false)}
      />

      <ConversationHistory
        isOpen={showConversationHistory}
        onClose={() => setShowConversationHistory(false)}
        onLoadConversation={(conversationId, messages) => {
          setShowConversationHistory(false);
        }}
      />

      {/* Live Inline Editor (Canva-style) */}
      {liveEditor.selectedElement && (
        <InlineEditor
          isVisible={liveEditor.isEditorVisible}
          position={liveEditor.selectedElement.position}
          elementType={liveEditor.selectedElement.type}
          currentValue={liveEditor.selectedElement.value}
          currentClasses={liveEditor.selectedElement.classes}
          autoEdit={liveEditor.selectedElement.autoEdit}
          onUpdate={liveEditor.applyLiveUpdate}
          onClose={liveEditor.closeEditor}
        />
      )}
    </>
  );
}
