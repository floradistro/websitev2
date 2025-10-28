/**
 * Inline Editor - Canva-style live editing overlay
 * Appears on element click for instant editing
 */

import { useState, useEffect, useRef } from 'react';
import { Type, Palette, Image, AlignLeft, AlignCenter, AlignRight, Bold, Italic, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InlineEditorProps {
  isVisible: boolean;
  position: { x: number; y: number; width: number; height: number };
  elementType: 'text' | 'heading' | 'image' | 'button' | 'container';
  currentValue: string;
  currentClasses: string[];
  autoEdit?: boolean; // Auto-enter edit mode on mount (double-click)
  onUpdate: (changes: {
    text?: string;
    classes?: string[];
    styles?: Record<string, string>;
  }) => void;
  onClose: () => void;
}

export function InlineEditor({
  isVisible,
  position,
  elementType,
  currentValue,
  currentClasses,
  autoEdit = false,
  onUpdate,
  onClose,
}: InlineEditorProps) {
  const [editValue, setEditValue] = useState(currentValue);
  const [isEditingText, setIsEditingText] = useState(autoEdit);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(currentValue);
  }, [currentValue]);

  // Auto-enter edit mode on double-click
  useEffect(() => {
    if (autoEdit && (elementType === 'text' || elementType === 'heading' || elementType === 'button')) {
      setIsEditingText(true);
    }
  }, [autoEdit, elementType]);

  useEffect(() => {
    if (isEditingText && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingText]);

  if (!isVisible) return null;

  // Calculate toolbar position (above element)
  const toolbarY = position.y - 60;
  const toolbarX = Math.max(20, Math.min(position.x, window.innerWidth - 320));

  // Text editing tools
  const handleFontSizeChange = (direction: 'increase' | 'decrease') => {
    const sizeMap: Record<string, string> = {
      'text-xs': 'text-sm',
      'text-sm': 'text-base',
      'text-base': 'text-lg',
      'text-lg': 'text-xl',
      'text-xl': 'text-2xl',
      'text-2xl': 'text-3xl',
      'text-3xl': 'text-4xl',
    };

    const currentSize = currentClasses.find(c => c.startsWith('text-'));
    if (!currentSize) return;

    const newSize = direction === 'increase' ? sizeMap[currentSize] :
      Object.entries(sizeMap).find(([_, v]) => v === currentSize)?.[0];

    if (newSize) {
      const newClasses = currentClasses.map(c =>
        c.startsWith('text-') && c.includes('-') && !c.includes('text-white') ? newSize : c
      );
      onUpdate({ classes: newClasses });
    }
  };

  const handleAlignmentChange = (align: 'left' | 'center' | 'right') => {
    const newClasses = currentClasses.filter(c => !c.startsWith('text-left') && !c.startsWith('text-center') && !c.startsWith('text-right'));
    newClasses.push(`text-${align}`);
    onUpdate({ classes: newClasses });
  };

  const handleBoldToggle = () => {
    const hasBold = currentClasses.some(c => c.includes('font-bold') || c.includes('font-black'));
    let newClasses = currentClasses;

    if (hasBold) {
      newClasses = currentClasses.filter(c => !c.includes('font-bold') && !c.includes('font-black'));
      newClasses.push('font-normal');
    } else {
      newClasses = currentClasses.filter(c => !c.includes('font-normal') && !c.includes('font-medium'));
      newClasses.push('font-bold');
    }

    onUpdate({ classes: newClasses });
  };

  const handleTextUpdate = () => {
    if (editValue !== currentValue) {
      onUpdate({ text: editValue });
    }
    setIsEditingText(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="inline-editor-toolbar"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="fixed z-[100]"
        style={{
          left: `${toolbarX}px`,
          top: `${Math.max(20, toolbarY)}px`,
        }}
      >
        {/* Floating Toolbar */}
        <div className="bg-black/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-1 p-2">
            {/* Text Content Editor */}
            {(elementType === 'text' || elementType === 'heading' || elementType === 'button') && (
              <>
                {!isEditingText ? (
                  <button
                    onClick={() => setIsEditingText(true)}
                    className="px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white text-sm font-medium truncate max-w-[200px]"
                    title="Click to edit text"
                  >
                    {currentValue || 'Edit text'}
                  </button>
                ) : (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={handleTextUpdate}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTextUpdate();
                      if (e.key === 'Escape') {
                        setEditValue(currentValue);
                        setIsEditingText(false);
                      }
                    }}
                    className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 min-w-[200px]"
                    placeholder="Enter text"
                  />
                )}

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Font Size */}
                <button
                  onClick={() => handleFontSizeChange('decrease')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                  title="Decrease font size"
                >
                  <span className="text-xs font-bold">A-</span>
                </button>
                <button
                  onClick={() => handleFontSizeChange('increase')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                  title="Increase font size"
                >
                  <span className="text-sm font-bold">A+</span>
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Text Alignment */}
                <button
                  onClick={() => handleAlignmentChange('left')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                  title="Align left"
                >
                  <AlignLeft size={16} strokeWidth={2} />
                </button>
                <button
                  onClick={() => handleAlignmentChange('center')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                  title="Align center"
                >
                  <AlignCenter size={16} strokeWidth={2} />
                </button>
                <button
                  onClick={() => handleAlignmentChange('right')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                  title="Align right"
                >
                  <AlignRight size={16} strokeWidth={2} />
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                {/* Bold */}
                <button
                  onClick={handleBoldToggle}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                  title="Toggle bold"
                >
                  <Bold size={16} strokeWidth={2} />
                </button>
              </>
            )}

            {/* Image Tools */}
            {elementType === 'image' && (
              <>
                <button className="px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white text-sm flex items-center gap-2">
                  <Image size={16} strokeWidth={2} />
                  Replace Image
                </button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button className="px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white text-sm flex items-center gap-2">
                  <Palette size={16} strokeWidth={2} />
                  Filters
                </button>
              </>
            )}

            {/* Close Button */}
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white/80"
              title="Close editor (ESC)"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Connection line to element */}
        <svg
          className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ top: '100%' }}
          width="2"
          height="20"
        >
          <line
            x1="1"
            y1="0"
            x2="1"
            y2="20"
            stroke="rgba(6, 182, 212, 0.5)"
            strokeWidth="2"
            strokeDasharray="4 4"
          />
        </svg>
      </motion.div>

      {/* Element Highlight */}
      <motion.div
        key="inline-editor-highlight"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed pointer-events-none z-[99]"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${position.width}px`,
          height: `${position.height}px`,
        }}
      >
        <div className="w-full h-full rounded-lg border-2 border-cyan-500 shadow-[0_0_0_4px_rgba(6,182,212,0.1)] animate-pulse" />
      </motion.div>
    </AnimatePresence>
  );
}
