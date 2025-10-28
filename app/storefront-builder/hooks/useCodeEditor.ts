/**
 * Code Editor State Management Hook
 * Handles code, compilation, history, and undo/redo
 */

import { useState, useCallback, useEffect } from 'react';
import { CodeEditorState } from '@/lib/storefront-builder/types';
import { cleanCode, saveCodeBackup } from '@/lib/storefront-builder/utils';
import * as codeManipulation from '@/lib/storefront-builder/codeManipulation';

export function useCodeEditor(initialCode: string = '', selectedVendor: string) {
  const [code, setCode] = useState(initialCode);
  const [compiledCode, setCompiledCode] = useState('');
  const [compileError, setCompileError] = useState<string | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [codeHistory, setCodeHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Save to history before making changes
  const saveToHistory = useCallback((codeToSave: string) => {
    const newHistory = codeHistory.slice(0, historyIndex + 1);
    newHistory.push(codeToSave);
    setCodeHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [codeHistory, historyIndex]);

  // Undo function
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCode(codeHistory[historyIndex - 1]);
    }
  }, [historyIndex, codeHistory]);

  // Redo function
  const redo = useCallback(() => {
    if (historyIndex < codeHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCode(codeHistory[historyIndex + 1]);
    }
  }, [historyIndex, codeHistory]);

  // Compile React (validation only)
  const compileReact = useCallback(() => {
    setIsCompiling(true);
    try {
      const cleaned = cleanCode(code);
      if (cleaned) {
        setCompiledCode(cleaned);
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

  // Auto-compile on code change
  useEffect(() => {
    if (!code) return;

    const compileTimeout = setTimeout(() => {
      try {
        compileReact();
      } catch (error) {
        // Error is already captured in compileReact
      }
    }, 800);

    return () => clearTimeout(compileTimeout);
  }, [code, compileReact]);

  // Backup code to localStorage
  useEffect(() => {
    if (code) {
      saveCodeBackup(selectedVendor, code);
    }
  }, [code, selectedVendor]);

  // All code manipulation tools
  const tools = {
    hideDescription: () => {
      saveToHistory(code);
      setCode(codeManipulation.hideDescription(code));
    },
    showBlueprintFields: () => {
      saveToHistory(code);
      setCode(codeManipulation.showBlueprintFields(code));
    },
    changeGridColumns: (cols: number) => {
      saveToHistory(code);
      setCode(codeManipulation.changeGridColumns(code, cols));
    },
    adjustSpacing: (direction: 'more' | 'less') => {
      saveToHistory(code);
      setCode(codeManipulation.adjustSpacing(code, direction));
    },
    adjustImageSize: (size: 'bigger' | 'smaller') => {
      saveToHistory(code);
      setCode(codeManipulation.adjustImageSize(code, size));
    },
    hidePrice: () => {
      saveToHistory(code);
      setCode(codeManipulation.hidePrice(code));
    },
    showStockQuantity: () => {
      saveToHistory(code);
      setCode(codeManipulation.showStockQuantity(code));
    },
    adjustFontSize: (direction: 'increase' | 'decrease') => {
      saveToHistory(code);
      setCode(codeManipulation.adjustFontSize(code, direction));
    },
    adjustFontWeight: (direction: 'increase' | 'decrease') => {
      saveToHistory(code);
      setCode(codeManipulation.adjustFontWeight(code, direction));
    },
    setTextAlignment: (align: 'left' | 'center' | 'right') => {
      saveToHistory(code);
      setCode(codeManipulation.setTextAlignment(code, align));
    },
    toggleUppercase: () => {
      saveToHistory(code);
      setCode(codeManipulation.toggleUppercase(code));
    },
    adjustTextOpacity: (direction: 'increase' | 'decrease') => {
      saveToHistory(code);
      setCode(codeManipulation.adjustTextOpacity(code, direction));
    },
    applyFont: (fontName: string) => {
      saveToHistory(code);
      setCode(codeManipulation.applyFont(code, fontName));
    },
    addVendorBranding: (vendor: any) => {
      saveToHistory(code);
      const result = codeManipulation.addVendorBranding(code, vendor);
      if (result === code) {
        setErrorMessage('Could not find container to add branding. Try using AI custom prompt.');
        setTimeout(() => setErrorMessage(null), 5000);
      } else {
        setCode(result);
      }
    },
  };

  return {
    code,
    setCode,
    compiledCode,
    compileError,
    isCompiling,
    errorMessage,
    setErrorMessage,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < codeHistory.length - 1,
    saveToHistory,
    tools,
  };
}
