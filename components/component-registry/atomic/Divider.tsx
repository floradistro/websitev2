/**
 * Atomic Component: Divider
 * Visual separator between content sections
 */

import React from 'react';

export interface DividerProps {
  direction?: 'horizontal' | 'vertical';
  thickness?: 'thin' | 'medium' | 'thick';
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export function Divider({
  direction = 'horizontal',
  thickness = 'thin',
  color,
  style = 'solid',
  spacing = 'md',
  className = '',
}: DividerProps) {
  
  const thicknessMap: Record<string, string> = {
    thin: direction === 'horizontal' ? 'h-px' : 'w-px',
    medium: direction === 'horizontal' ? 'h-0.5' : 'w-0.5',
    thick: direction === 'horizontal' ? 'h-1' : 'w-1',
  };
  
  const spacingMap: Record<string, string> = {
    none: '',
    sm: direction === 'horizontal' ? 'my-2' : 'mx-2',
    md: direction === 'horizontal' ? 'my-4' : 'mx-4',
    lg: direction === 'horizontal' ? 'my-8' : 'mx-8',
  };
  
  const styleMap: Record<string, string> = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  };
  
  const baseClasses = [
    direction === 'horizontal' ? 'w-full' : 'h-full',
    thicknessMap[thickness],
    spacingMap[spacing],
    color ? '' : 'bg-neutral-800',
    styleMap[style],
    className,
  ].filter(Boolean).join(' ');
  
  const inlineStyle = color ? { backgroundColor: color } : undefined;
  
  return <div className={baseClasses} style={inlineStyle} role="separator" />;
}

