"use client";

import { X, Eye, EyeOff } from 'lucide-react';
import SectionHeader from '@/components/ui/SectionHeader';

interface DynamicField {
  name: string;
  slug?: string;
  type: string;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  suffix?: string;
  source?: string;
  groupName?: string;
  isRequired?: boolean;
  readonly?: boolean;
  inherited?: boolean; // Steve Jobs style: Mark inherited fields from parent
}

interface DynamicFieldsPanelProps {
  dynamicFields: DynamicField[];
  customFieldValues: Record<string, unknown>;
  onFieldChange: (fieldName: string, value: string | string[] | boolean | number) => void;
  fieldVisibility?: Record<string, boolean>;
  onFieldVisibilityChange?: (fieldName: string, visible: boolean) => void;
}

export default function DynamicFieldsPanel({
  dynamicFields,
  customFieldValues,
  onFieldChange,
  fieldVisibility = {},
  onFieldVisibilityChange
}: DynamicFieldsPanelProps) {
  if (!dynamicFields || dynamicFields.length === 0) {
    return null;
  }

  const labelClasses = "block text-white/40 text-[10px] uppercase tracking-[0.15em] mb-2 font-black";
  const inputClasses = "w-full bg-[#0a0a0a] border border-white/10 rounded-xl text-white placeholder-white/20 px-3 py-2.5 focus:outline-none focus:border-white/20 transition-all text-xs";
  const descClasses = "text-white/40 text-[10px] mt-1.5";

  // Steve Jobs style: Subtle indicator for inherited fields
  const renderLabel = (field: DynamicField, isRequired: boolean) => {
    const displayLabel = field.label || field.name || 'Field';
    const isVisible = fieldVisibility[field.name] !== false; // Default to visible

    return (
      <label className={labelClasses} style={{ fontWeight: 900 }}>
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span>
              {displayLabel} {isRequired && <span className="text-red-400">*</span>}
            </span>
            {field.inherited && (
              <span
                className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[8px] text-white/40 font-black uppercase tracking-[0.15em]"
                style={{ fontWeight: 900 }}
                title="Inherited from parent category"
              >
                Inherited
              </span>
            )}
          </span>
          {onFieldVisibilityChange && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onFieldVisibilityChange(field.name, !isVisible);
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-all ${
                isVisible
                  ? 'bg-white/10 border border-white/20 text-white/80 hover:bg-white/15'
                  : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10'
              }`}
              title={isVisible ? 'Visible on storefront' : 'Hidden on storefront'}
            >
              {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
              <span className="text-[8px] font-black uppercase tracking-[0.15em]">
                {isVisible ? 'Show' : 'Hide'}
              </span>
            </button>
          )}
        </span>
      </label>
    );
  };

  const renderField = (field: DynamicField, index: number) => {
    const fieldValue = customFieldValues[field.name] || '';
    const handleChange = (value: string | string[] | boolean | number) => {
      onFieldChange(field.name, value);
    };

    const isRequired = !!(field.required || field.isRequired);
    const displayLabel = field.label || field.name || 'Field';

    switch (field.type) {
      case 'text':
      case 'url':
        return (
          <div key={index}>
            {renderLabel(field, isRequired)}
            <input
              type={field.type}
              required={isRequired}
              value={fieldValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder}
              className={inputClasses}
            />
            {field.description && <p className={descClasses}>{field.description}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={index} className="lg:col-span-2">
            {renderLabel(field, isRequired)}
            <textarea
              required={isRequired}
              value={fieldValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder}
              rows={3}
              className={`${inputClasses} resize-none`}
            />
            {field.description && <p className={descClasses}>{field.description}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={index}>
            {renderLabel(field, isRequired)}
            <div className="relative">
              <input
                type="number"
                required={isRequired}
                value={fieldValue}
                onChange={(e) => handleChange(e.target.value)}
                placeholder={field.placeholder}
                min={field.min}
                max={field.max}
                step="0.1"
                className={inputClasses}
              />
              {field.suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-[10px] font-black uppercase tracking-[0.15em]" style={{ fontWeight: 900 }}>
                  {field.suffix}
                </span>
              )}
            </div>
            {field.description && <p className={descClasses}>{field.description}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={index}>
            {renderLabel(field, isRequired)}
            <select
              required={isRequired}
              value={fieldValue}
              onChange={(e) => handleChange(e.target.value)}
              className={`${inputClasses} cursor-pointer`}
            >
              <option value="">Select...</option>
              {field.options?.map((option, idx) => (
                <option key={idx} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {field.description && <p className={descClasses}>{field.description}</p>}
          </div>
        );

      case 'multiselect':
        return (
          <div key={index}>
            {renderLabel(field, isRequired)}
            <div className="space-y-2">
              {/* Selected items */}
              {fieldValue && Array.isArray(fieldValue) && fieldValue.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {fieldValue.map((item: string, idx: number) => (
                    <div key={idx} className="bg-white/10 border border-white/20 rounded px-2 py-1 flex items-center gap-1.5 text-[10px] text-white">
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newValue = fieldValue.filter((_: string, i: number) => i !== idx);
                          handleChange(newValue);
                        }}
                        className="text-white/60 hover:text-red-400 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Dropdown to add more */}
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    const currentValues = Array.isArray(fieldValue) ? fieldValue : [];
                    if (!currentValues.includes(e.target.value)) {
                      handleChange([...currentValues, e.target.value]);
                    }
                  }
                }}
                className={`${inputClasses} cursor-pointer`}
              >
                <option value="">Add {displayLabel}...</option>
                {field.options?.map((option, idx) => (
                  <option key={idx} value={option} disabled={Array.isArray(fieldValue) && fieldValue.includes(option)}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            {field.description && <p className={descClasses}>{field.description}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={index} className="lg:col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={fieldValue === true || fieldValue === 'true'}
                onChange={(e) => handleChange(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-[#0a0a0a]"
              />
              <div>
                <span className="text-white text-[10px] uppercase tracking-[0.15em] font-black" style={{ fontWeight: 900 }}>{displayLabel}</span>
                {field.description && <p className={descClasses}>{field.description}</p>}
              </div>
            </label>
          </div>
        );

      default:
        return (
          <div key={index}>
            <label className={labelClasses} style={{ fontWeight: 900 }}>
              {displayLabel} {isRequired && <span className="text-red-400">*</span>}
            </label>
            <input
              type="text"
              required={isRequired}
              value={fieldValue}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={field.placeholder}
              className={inputClasses}
            />
            {field.description && <p className={descClasses}>{field.description}</p>}
          </div>
        );
    }
  };

  // Group fields by groupName if available
  const grouped: Record<string, DynamicField[]> = {};
  const ungrouped: DynamicField[] = [];

  dynamicFields.forEach(field => {
    if (field.groupName) {
      if (!grouped[field.groupName]) {
        grouped[field.groupName] = [];
      }
      grouped[field.groupName].push(field);
    } else {
      ungrouped.push(field);
    }
  });

  return (
    <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
      <SectionHeader>Product Attributes</SectionHeader>

      <div className="space-y-6">
        {/* Grouped fields */}
        {Object.entries(grouped).map(([groupName, fields]) => (
          <div key={groupName}>
            <h3 className="text-[10px] uppercase tracking-[0.15em] text-white/60 mb-3 font-black border-b border-white/5 pb-2" style={{ fontWeight: 900 }}>
              {groupName}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {fields.map((field, index) => renderField(field, index))}
            </div>
          </div>
        ))}

        {/* Ungrouped fields */}
        {ungrouped.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {ungrouped.map((field, index) => renderField(field, index))}
          </div>
        )}
      </div>
    </div>
  );
}
