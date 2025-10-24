/**
 * Schema-Driven Dynamic Field Renderer
 * 
 * Renders ANY field type based on schema definition
 * Makes sections infinitely customizable without code changes
 */

import { useState } from 'react';
import Image from 'next/image';
import { ProductPickerField } from '@/components/fields/ProductPickerField';
import { CategoryPickerField } from '@/components/fields/CategoryPickerField';
import { PricingDisplayField } from '@/components/fields/PricingDisplayField';
import { LocationPickerField } from '@/components/fields/LocationPickerField';
import { CodeEditorField } from '@/components/fields/CodeEditorField';

export interface FieldSchema {
  id: string;
  type: 'text' | 'textarea' | 'rich_text' | 'number' | 'color' | 'select' | 'boolean' | 'image' | 'url' | 'icon_picker' | 'array' | 'product_picker' | 'category_picker';
  label: string;
  placeholder?: string;
  default?: any;
  required?: boolean;
  min?: number;
  max?: number;
  min_items?: number;
  max_items?: number;
  max_length?: number;
  options?: string[] | { value: string; label: string }[];
  depends_on?: Record<string, any>; // Conditional visibility
  item_schema?: Record<string, any>; // For array fields
}

interface FieldRendererProps {
  field: FieldSchema;
  value: any;
  onChange: (value: any) => void;
  allValues?: Record<string, any>; // For checking dependencies
}

/**
 * Renders a single field based on its schema
 */
export function FieldRenderer({ field, value, onChange, allValues = {} }: FieldRendererProps) {
  // Check if field should be visible (conditional fields)
  if (field.depends_on) {
    const shouldShow = Object.entries(field.depends_on).every(
      ([key, expectedValue]) => allValues[key] === expectedValue
    );
    if (!shouldShow) return null;
  }

  const currentValue = value ?? field.default;

  switch (field.type) {
    case 'text':
      return (
        <div className="mb-4">
          <label className="block text-white/80 text-sm mb-2">{field.label}</label>
          <input
            type="text"
            value={currentValue || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.max_length}
            required={field.required}
            className="w-full bg-black/50 border border-white/20 rounded px-4 py-2 text-white"
          />
        </div>
      );

    case 'textarea':
      return (
        <div className="mb-4">
          <label className="block text-white/80 text-sm mb-2">{field.label}</label>
          <textarea
            value={currentValue || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.max_length}
            rows={4}
            className="w-full bg-black/50 border border-white/20 rounded px-4 py-2 text-white"
          />
        </div>
      );

    case 'rich_text':
      // Could integrate TipTap or similar
      return (
        <div className="mb-4">
          <label className="block text-white/80 text-sm mb-2">{field.label}</label>
          <textarea
            value={currentValue || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={6}
            className="w-full bg-black/50 border border-white/20 rounded px-4 py-2 text-white font-mono text-sm"
          />
          <p className="text-white/40 text-xs mt-1">Supports markdown</p>
        </div>
      );

    case 'number':
      return (
        <div className="mb-4">
          <label className="block text-white/80 text-sm mb-2">{field.label}</label>
          <input
            type="number"
            value={currentValue || field.default || 0}
            onChange={(e) => onChange(parseInt(e.target.value))}
            min={field.min}
            max={field.max}
            className="w-full bg-black/50 border border-white/20 rounded px-4 py-2 text-white"
          />
        </div>
      );

    case 'color':
      return (
        <div className="mb-4">
          <label className="block text-white/80 text-sm mb-2">{field.label}</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={currentValue || field.default || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              className="w-16 h-10 bg-black border border-white/20 rounded cursor-pointer"
            />
            <input
              type="text"
              value={currentValue || field.default || '#000000'}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#000000"
              className="flex-1 bg-black/50 border border-white/20 rounded px-4 py-2 text-white font-mono"
            />
          </div>
        </div>
      );

    case 'select':
      return (
        <div className="mb-4">
          <label className="block text-white/80 text-sm mb-2">{field.label}</label>
          <select
            value={currentValue || field.default}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-black/50 border border-white/20 rounded px-4 py-2 text-white"
          >
            {field.options?.map((opt) => {
              const option = typeof opt === 'string' ? { value: opt, label: opt } : opt;
              return (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              );
            })}
          </select>
        </div>
      );

    case 'boolean':
      return (
        <div className="mb-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={currentValue ?? field.default ?? false}
            onChange={(e) => onChange(e.target.checked)}
            className="w-5 h-5 bg-black border border-white/20 rounded"
          />
          <label className="text-white/80 text-sm">{field.label}</label>
        </div>
      );

    case 'image':
      return (
        <div className="mb-4">
          <label className="block text-white/80 text-sm mb-2">{field.label}</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={currentValue || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="https://..."
              className="flex-1 bg-black/50 border border-white/20 rounded px-4 py-2 text-white"
            />
            <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded text-white text-sm">
              Upload
            </button>
          </div>
          {currentValue && (
            <div className="mt-2 relative w-full h-32 rounded border border-white/20 overflow-hidden">
              <Image src={currentValue} alt="Preview" fill className="object-cover" />
            </div>
          )}
        </div>
      );

    case 'url':
      return (
        <div className="mb-4">
          <label className="block text-white/80 text-sm mb-2">{field.label}</label>
          <input
            type="url"
            value={currentValue || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className="w-full bg-black/50 border border-white/20 rounded px-4 py-2 text-white"
          />
        </div>
      );

    case 'array':
      return (
        <ArrayFieldRenderer 
          field={field} 
          value={currentValue || []} 
          onChange={onChange} 
        />
      );

    case 'product_picker':
      return (
        <ProductPickerField
          value={currentValue || []}
          onChange={onChange}
          vendorId={allValues.vendor_id || ''}
          maxSelections={field.max_items}
          filter={field.filter}
          label={field.label}
        />
      );

    case 'category_picker':
      return (
        <CategoryPickerField
          value={currentValue || []}
          onChange={onChange}
          multiSelect={field.multi_select !== false}
          showProductCount={field.show_product_count !== false}
          label={field.label}
        />
      );

    case 'pricing_display':
      return (
        <PricingDisplayField
          value={currentValue || {}}
          onChange={onChange}
          vendorId={allValues.vendor_id || ''}
          label={field.label}
        />
      );

    case 'location_picker':
      return (
        <LocationPickerField
          value={currentValue || []}
          onChange={onChange}
          vendorId={allValues.vendor_id || ''}
          filterType={field.filter_type}
          multiSelect={field.multi_select !== false}
          label={field.label}
        />
      );

    case 'code':
      return (
        <CodeEditorField
          value={currentValue || ''}
          onChange={onChange}
          language={field.language || 'html'}
          maxLength={field.max_length}
          label={field.label}
        />
      );

    default:
      return (
        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded">
          <p className="text-yellow-500 text-sm">
            Field type "{field.type}" not yet implemented
          </p>
        </div>
      );
  }
}

/**
 * Renders an array field (repeatable items)
 */
function ArrayFieldRenderer({ field, value, onChange }: { field: FieldSchema; value: any[]; onChange: (value: any[]) => void }) {
  const items = value || [];
  
  const addItem = () => {
    const newItem: any = {};
    // Initialize with defaults from item_schema
    if (field.item_schema) {
      Object.entries(field.item_schema).forEach(([key, schema]: [string, any]) => {
        newItem[key] = schema.default || '';
      });
    }
    onChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, itemKey: string, itemValue: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [itemKey]: itemValue };
    onChange(updated);
  };

  return (
    <div className="mb-4">
      <label className="block text-white/80 text-sm mb-2">{field.label}</label>
      
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="bg-white/5 border border-white/10 rounded p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/60 text-xs">Item {index + 1}</span>
              <button
                onClick={() => removeItem(index)}
                className="text-red-400 hover:text-red-300 text-xs"
              >
                Remove
              </button>
            </div>
            
            {/* Render fields for this array item */}
            {field.item_schema && Object.entries(field.item_schema).map(([key, schema]: [string, any]) => (
              <div key={key} className="mb-2">
                <label className="block text-white/60 text-xs mb-1">{schema.label || key}</label>
                <input
                  type={schema.type === 'number' ? 'number' : 'text'}
                  value={item[key] || ''}
                  onChange={(e) => updateItem(index, key, e.target.value)}
                  placeholder={schema.placeholder}
                  className="w-full bg-black/50 border border-white/20 rounded px-3 py-1.5 text-white text-sm"
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {(!field.max_items || items.length < field.max_items) && (
        <button
          onClick={addItem}
          className="mt-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded text-white text-sm"
        >
          + Add {field.label}
        </button>
      )}
    </div>
  );
}

/**
 * Renders all fields for a section based on its schema
 */
export function SchemaBasedSectionEditor({ 
  schema, 
  values, 
  onChange 
}: { 
  schema: { fields: FieldSchema[] }; 
  values: Record<string, any>; 
  onChange: (values: Record<string, any>) => void 
}) {
  const handleFieldChange = (fieldId: string, value: any) => {
    onChange({ ...values, [fieldId]: value });
  };

  return (
    <div>
      {schema.fields.map((field) => (
        <FieldRenderer
          key={field.id}
          field={field}
          value={values[field.id]}
          onChange={(value) => handleFieldChange(field.id, value)}
          allValues={values}
        />
      ))}
    </div>
  );
}

/**
 * Apply a style preset to section values
 */
export function applyStylePreset(
  sectionValues: Record<string, any>,
  preset: {
    color_palette: Record<string, string>;
    typography: any;
    spacing_scale: number[];
    effects: any;
  }
): Record<string, any> {
  const updated = { ...sectionValues };

  // Apply color palette
  if (preset.color_palette) {
    if (updated.background_color === undefined) {
      updated.background_color = preset.color_palette.background;
    }
    if (updated.text_color === undefined) {
      updated.text_color = preset.color_palette.text;
    }
  }

  // Apply typography
  if (preset.typography && updated.headline) {
    updated.headline_size = preset.typography.headline?.size;
    updated.headline_weight = preset.typography.headline?.weight;
  }

  // Apply effects
  if (preset.effects) {
    updated.animation = preset.effects.animations?.[0];
    updated.transition = preset.effects.transitions;
  }

  return updated;
}

