"use client";

/**
 * Atomic Component: Button
 * Renders buttons with variants, sizes, and states
 */

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export interface ButtonProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  isPreviewMode?: boolean;
  isSelected?: boolean;
  onInlineEdit?: (updates: Record<string, any>) => void;
}

export function Button({
  text,
  variant = 'primary',
  size = 'md',
  href,
  onClick,
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  isPreviewMode = false,
  isSelected = false,
  onInlineEdit,
}: ButtonProps) {
  const editableRef = React.useRef<HTMLSpanElement>(null);
  const isEditingRef = React.useRef(false);
  const textRef = React.useRef(text);
  
  React.useEffect(() => {
    textRef.current = text;
  }, [text]);
  
  // Handle inline editing
  React.useEffect(() => {
    if (isPreviewMode && isSelected && editableRef.current) {
      // Only set content if we're not actively editing
      if (!isEditingRef.current) {
        editableRef.current.textContent = text;
        
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
  
  const handleBlur = (e: React.FocusEvent<HTMLSpanElement>) => {
    isEditingRef.current = false;
    if (onInlineEdit && isPreviewMode) {
      const newText = e.currentTarget.textContent || '';
      if (newText !== textRef.current) {
        onInlineEdit({ text: newText });
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };
  
  // Size classes
  const sizeClasses: Record<string, string> = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  };
  
  // Variant classes
  const variantClasses: Record<string, string> = {
    primary: 'bg-white text-black hover:bg-white/90 active:bg-white/80 border-transparent',
    secondary: 'bg-transparent text-white hover:bg-white/5 active:bg-white/10 border-white/5',
    ghost: 'bg-transparent text-white hover:bg-white/5 active:bg-white/10 border-transparent',
    outline: 'bg-transparent text-white hover:bg-white hover:text-black active:bg-white/90 border-white/10',
    danger: 'bg-red-600/10 text-red-400 hover:bg-red-600/20 border-red-600/20',
    success: 'bg-green-600/10 text-green-400 hover:bg-green-600/20 border-green-600/20',
  };
  
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-black uppercase tracking-[0.08em]',
    'rounded-2xl',
    'border-2',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    sizeClasses[size],
    variantClasses[variant],
    fullWidth ? 'w-full' : '',
    className,
  ].filter(Boolean).join(' ');
  
  // If in preview mode and selected, make text editable
  const content = isPreviewMode && isSelected ? (
    <>
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      <span
        ref={editableRef}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="outline-none cursor-text"
      >
        {text}
      </span>
      {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </>
  ) : (
    <>
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
      {text}
      {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
    </>
  );
  
  if (href && !disabled) {
    // Preserve vendor and preview params in links
    let finalHref = href;
    
    try {
      const searchParams = useSearchParams();
      const vendor = searchParams?.get('vendor');
      const preview = searchParams?.get('preview');
      
      if (vendor) {
        const separator = href.includes('?') ? '&' : '?';
        finalHref += `${separator}vendor=${vendor}`;
        if (preview) {
          finalHref += `&preview=${preview}`;
        }
      }
    } catch (e) {
      // If useSearchParams fails, just use href as-is
    }
    
    return (
      <Link href={finalHref} className={baseClasses}>
        {content}
      </Link>
    );
  }
  
  return (
    <button
      type={type}
      className={baseClasses}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {content}
    </button>
  );
}

