/**
 * Atomic Component: Text
 * Renders headlines, paragraphs, labels, and all text content
 */

"use client";

import React, { useRef, useEffect } from 'react';

export interface TextProps {
  content?: string; // Old prop name
  text?: string; // New prop name (AI uses this)
  variant?: 'headline' | 'subheadline' | 'paragraph' | 'label' | 'caption' | 'quote';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'xlarge' | '2xl' | '3xl' | '4xl' | 'small' | 'medium' | 'large';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  font_weight?: string; // AI uses this (300, 400, 500, 600)
  color?: string;
  align?: 'left' | 'center' | 'right';
  alignment?: 'left' | 'center' | 'right'; // AI uses this
  letter_spacing?: string; // AI uses this (0.05em, 0.1em, etc)
  className?: string;
  maxLines?: number; // Clamp text to N lines
  animate?: boolean;
  isPreviewMode?: boolean;
  isSelected?: boolean;
  onInlineEdit?: (updates: Record<string, any>) => void;
}

export function Text({
  content: contentProp,
  text: textProp,
  variant = 'paragraph',
  size: sizeProp,
  weight: weightProp,
  font_weight,
  color,
  align: alignProp,
  alignment,
  letter_spacing,
  className = '',
  maxLines,
  animate = false,
  isPreviewMode = false,
  isSelected = false,
  onInlineEdit,
}: TextProps) {
  // Support both prop names
  const content = contentProp || textProp || '';
  const align = alignProp || alignment || 'left';
  
  // Map font_weight from AI (300, 400, 500, 600) to weight
  const weight = weightProp || (font_weight === '300' ? 'light' : 
                                  font_weight === '400' ? 'normal' :
                                  font_weight === '500' ? 'medium' :
                                  font_weight === '600' ? 'semibold' : 'normal');
  
  // Map AI size names to actual sizes
  const sizeMap: Record<string, string> = {
    'small': 'sm',
    'medium': 'md',
    'large': 'lg',
    'xlarge': '3xl',
  };
  const size = sizeMap[sizeProp || ''] || sizeProp;
  const editableRef = useRef<HTMLDivElement>(null);
  
  // Default sizes per variant
  const defaultSizes: Record<string, string> = {
    headline: '4xl',
    subheadline: '2xl',
    paragraph: 'md',
    label: 'sm',
    caption: 'xs',
    quote: 'lg',
  };
  
  const actualSize = size || defaultSizes[variant] || 'md';
  
  // Size classes
  const sizeClasses: Record<string, string> = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl md:text-5xl lg:text-6xl',
  };
  
  // Weight classes
  const weightClasses: Record<string, string> = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };
  
  // Variant-specific classes
  const variantClasses: Record<string, string> = {
    headline: 'font-bold tracking-tight',
    subheadline: 'font-medium',
    paragraph: 'leading-relaxed',
    label: 'uppercase tracking-wide',
    caption: 'text-neutral-500',
    quote: 'italic font-light',
  };
  
  const combinedClasses = [
    sizeClasses[actualSize],
    weightClasses[weight],
    variantClasses[variant],
    `text-${align}`,
    color ? '' : 'text-current',
    maxLines ? `line-clamp-${maxLines}` : '',
    animate ? 'animate-fade-in-up' : '',
    className,
  ].filter(Boolean).join(' ');
  
  const style = color || letter_spacing ? { 
    color: color || undefined, 
    letterSpacing: letter_spacing || undefined 
  } : undefined;
  
  // Choose HTML element based on variant
  const Element = variant === 'headline' ? 'h1'
    : variant === 'subheadline' ? 'h2'
    : variant === 'label' ? 'label'
    : variant === 'quote' ? 'blockquote'
    : 'p';
  
  // Handle inline editing
  const isEditingRef = useRef(false);
  const contentRef = useRef(content);
  
  useEffect(() => {
    contentRef.current = content;
  }, [content]);
  
  useEffect(() => {
    if (isPreviewMode && isSelected && editableRef.current) {
      // Only set content if we're not actively editing
      if (!isEditingRef.current) {
        editableRef.current.textContent = content;
        
        // Focus and select all text when component becomes selected
        setTimeout(() => {
          if (editableRef.current) {
            editableRef.current.focus();
            const range = document.createRange();
            range.selectNodeContents(editableRef.current);
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        }, 50);
      }
    }
  }, [isSelected, isPreviewMode]);
  
  const handleFocus = () => {
    isEditingRef.current = true;
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    isEditingRef.current = false;
    if (onInlineEdit && isPreviewMode) {
      const newContent = e.currentTarget.textContent || '';
      if (newContent !== contentRef.current) {
        onInlineEdit({ content: newContent });
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape') {
      e.currentTarget.blur();
    }
  };
  
  // If in preview mode and selected, make it editable inline
  if (isPreviewMode && isSelected) {
    return (
      <Element
        ref={editableRef as any}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`${combinedClasses} outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black rounded-sm px-2 py-1 transition-all cursor-text`}
        style={style}
      >
        {content}
      </Element>
    );
  }
  
  return (
    <Element className={combinedClasses} style={style}>
      {content}
    </Element>
  );
}

