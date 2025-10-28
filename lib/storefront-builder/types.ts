/**
 * Storefront Builder Type Definitions
 */

export interface Vendor {
  id: string;
  store_name: string;
  slug: string;
  logo_url?: string;
}

export interface Section {
  type: 'props' | 'data' | 'quantum_state' | 'render';
  name: string;
  icon: any;
  lineStart: number;
  lineEnd: number;
  code: string;
}

export interface SmartComponent {
  key: string;
  name: string;
  description: string;
  category: 'layout' | 'content' | 'commerce' | 'interactive';
}

export interface Font {
  name: string;
  category: 'Sans-serif' | 'Serif' | 'Display';
  weights: number[];
}

export interface ToolExecuted {
  tool: string;
  result: string;
  details: string;
}

export interface ScreenshotPreview {
  data: string;
  title: string;
}

export interface StreamingState {
  isGenerating: boolean;
  status: string;
  thinking: string;
  text: string;
  toolsExecuted: ToolExecuted[];
  screenshotPreview: ScreenshotPreview | null;
  phase: string;
  displayedCode: string;
  generatedCodeBackup: string;
}

export interface CodeEditorState {
  code: string;
  compiledCode: string;
  compileError: string | null;
  isCompiling: boolean;
  codeHistory: string[];
  historyIndex: number;
  errorMessage: string | null;
}

export interface PreviewState {
  mode: 'desktop' | 'tablet' | 'mobile';
  html: string;
  key: number;
  quantumState: 'auto' | 'first-visit' | 'returning';
}

export interface UIState {
  showCodePanel: boolean;
  showComponentBrowser: boolean;
  showFontPicker: boolean;
  showStreamingPanel: boolean;
  showAgentConfig: boolean;
  showConversationHistory: boolean;
  expandedSections: Set<string>;
  selectedSections: Set<string>;
  editingSection: string | null;
  sectionEdits: Record<string, string>;
  selectedFont: string;
  referenceUrl: string;
  isAnalyzingReference: boolean;
  referenceScreenshot: string;
  useStreaming: boolean;
  manualScreenshotMode: boolean;
  currentConversationId: string | null;
  selectedElement: {
    tagName: string;
    classList: string;
    textContent: string;
  } | null;
}

export interface AIGenerationOptions {
  prompt: string;
  fullCode: string;
  vendorId: string;
  vendorName?: string;
  industry: string;
  referenceUrl?: string;
  isEditingExisting: boolean;
  conversationId?: string | null;
  manualMode?: boolean;
}
