/**
 * Atomic Component: Spacer
 * Adds vertical or horizontal spacing
 */

import React from 'react';

export interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  direction?: 'vertical' | 'horizontal';
  className?: string;
}

export function Spacer({
  size = 'md',
  direction = 'vertical',
  className = '',
}: SpacerProps) {
  
  const verticalSizes: Record<string, string> = {
    xs: 'h-2',
    sm: 'h-4',
    md: 'h-8',
    lg: 'h-12',
    xl: 'h-16',
    '2xl': 'h-24',
    '3xl': 'h-32',
  };
  
  const horizontalSizes: Record<string, string> = {
    xs: 'w-2',
    sm: 'w-4',
    md: 'w-8',
    lg: 'w-12',
    xl: 'w-16',
    '2xl': 'w-24',
    '3xl': 'w-32',
  };
  
  const sizeClass = direction === 'vertical' ? verticalSizes[size] : horizontalSizes[size];
  
  return <div className={`${sizeClass} ${className}`} aria-hidden="true" />;
}

