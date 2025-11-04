"use client";

import { useState } from 'react';
import { Palette } from 'lucide-react';
import { ds, cn } from '@/lib/design-system';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  hint?: string;
}

/**
 * 🎨 Color Picker Component
 *
 * Combined color input with hex text field
 */
export function ColorPicker({
  label,
  value,
  onChange,
  hint
}: ColorPickerProps) {
  const [error, setError] = useState('');

  const validateHex = (hex: string): boolean => {
    return /^#[0-9A-F]{6}$/i.test(hex);
  };

  const handleTextChange = (newValue: string) => {
    // Allow typing # and hex characters
    if (newValue === '' || /^#?[0-9A-Fa-f]{0,6}$/.test(newValue)) {
      // Ensure it starts with #
      const formatted = newValue.startsWith('#') ? newValue : `#${newValue}`;
      onChange(formatted);

      // Validate when complete
      if (formatted.length === 7) {
        if (validateHex(formatted)) {
          setError('');
        } else {
          setError('Invalid color format');
        }
      } else if (formatted.length > 1) {
        setError('');
      }
    }
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className={cn(
        ds.typography.size.xs,
        ds.typography.weight.medium,
        ds.typography.transform.uppercase,
        ds.typography.tracking.wide,
        ds.colors.text.tertiary
      )}>
        {label}
      </label>

      {/* Color input + Text input */}
      <div className="flex gap-2">
        {/* Visual color picker */}
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setError('');
            }}
            className={cn(
              'w-12 h-10 cursor-pointer',
              'bg-transparent border-0',
              'rounded-lg overflow-hidden',
              ds.effects.transition.normal
            )}
            style={{
              // Remove default styling
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              padding: 0
            }}
          />
          <div className={cn(
            'absolute inset-0 pointer-events-none',
            'border',
            ds.colors.border.default,
            ds.effects.radius.lg
          )} />
        </div>

        {/* Hex text input */}
        <div className="flex-1 relative">
          <div className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2',
            ds.colors.text.quaternary
          )}>
            <Palette size={14} strokeWidth={1.5} />
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="#000000"
            maxLength={7}
            className={cn(
              'w-full h-10',
              'pl-9 pr-3',
              ds.colors.bg.input,
              'border',
              error ? 'border-red-500/50' : ds.colors.border.default,
              ds.colors.text.secondary,
              ds.effects.radius.lg,
              ds.effects.transition.normal,
              ds.typography.size.sm,
              'font-mono',
              'focus:outline-none',
              error ? 'focus:border-red-500/70' : 'focus:border-white/20'
            )}
          />
        </div>
      </div>

      {/* Hint or error */}
      {(hint || error) && (
        <div className={cn(
          ds.typography.size.micro,
          error ? ds.colors.status.error : ds.colors.text.quaternary
        )}>
          {error || hint}
        </div>
      )}
    </div>
  );
}

/**
 * 🎨 Color Grid - Quick color selection
 */
export function ColorGrid({
  onSelect,
  colors = DEFAULT_COLOR_PALETTE
}: {
  onSelect: (color: string) => void;
  colors?: string[];
}) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onSelect(color)}
          className={cn(
            'w-8 h-8',
            ds.effects.radius.md,
            'border',
            ds.colors.border.default,
            'hover:border-white/20',
            ds.effects.transition.fast,
            'hover:scale-110',
            'focus:outline-none focus:ring-2 focus:ring-white/20'
          )}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  );
}

// Default color palette
export const DEFAULT_COLOR_PALETTE = [
  // Grays
  '#000000', '#1A1A1A', '#333333', '#666666',
  '#999999', '#CCCCCC', '#E5E5E5', '#FFFFFF',

  // Primary colors
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',

  // Cannabis greens
  '#10B981', '#059669', '#047857', '#065F46',
  '#064E3B', '#6EE7B7', '#34D399', '#10B981',

  // Earth tones
  '#8B7355', '#A8956B', '#D4A373', '#C19A6B',
  '#B08968', '#7F5539', '#9C6644', '#A0826D',

  // Luxury
  '#D4AF37', '#FFD700', '#C5B358', '#AA9A5D',
  '#918151', '#786D4F', '#5F5339', '#4A3F31'
];
