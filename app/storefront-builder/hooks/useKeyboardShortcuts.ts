/**
 * Keyboard Shortcuts Hook
 * Handles all keyboard shortcuts for the storefront builder
 */

import { useEffect } from 'react';
import { Section } from '@/lib/storefront-builder/types';

interface KeyboardShortcutsOptions {
  undo: () => void;
  redo: () => void;
  sections: Section[];
  selectedSections: Set<string>;
  setSelectedSections: (sections: Set<string>) => void;
  editingSection: string | null;
  deleteSection: (section: Section) => void;
  moveSectionUp: (section: Section) => void;
  moveSectionDown: (section: Section) => void;
  setAiPrompt: (prompt: string) => void;
  saveToHistory: (code: string) => void;
  code: string;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  const {
    undo,
    redo,
    sections,
    selectedSections,
    setSelectedSections,
    editingSection,
    deleteSection,
    moveSectionUp,
    moveSectionDown,
    setAiPrompt,
    saveToHistory,
    code,
  } = options;

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
        saveToHistory(code);
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
  }, [
    undo,
    redo,
    sections,
    selectedSections,
    setSelectedSections,
    editingSection,
    deleteSection,
    moveSectionUp,
    moveSectionDown,
    setAiPrompt,
    saveToHistory,
    code,
  ]);
}
