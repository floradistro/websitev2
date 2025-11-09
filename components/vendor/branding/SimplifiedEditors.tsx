"use client";

import { useState } from 'react';
import { Clock, FileText, Code, Copy, Check, Eye, EyeOff } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { ds, cn } from '@/lib/design-system';
import type { BusinessHours, DayHours } from '@/types/branding';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BUSINESS HOURS EDITOR (Simplified)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export function SimpleBusinessHours({ value, onChange }: { value: BusinessHours; onChange: (v: BusinessHours) => void }) {
  const update = (day: string, hours: DayHours | undefined) => onChange({ ...value, [day]: hours });

  return (
    <div className="space-y-2">
      {DAYS.map(day => {
        const hours = value[day];
        const closed = hours?.closed;

        return (
          <div key={day} className={cn('border', ds.colors.border.default, 'rounded-lg p-3')}>
            <div className="flex items-center gap-3 mb-2">
              <Clock size={14} className={ds.colors.text.quaternary} />
              <span className={cn(ds.typography.size.sm, 'capitalize flex-1')}>{day}</span>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={closed}
                  onChange={() => update(day, closed ? { open: '09:00', close: '21:00', closed: false } : { open: '', close: '', closed: true })}
                  className="rounded"
                />
                Closed
              </label>
            </div>

            {!closed && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={hours?.open || '09:00'}
                  onChange={(e) => update(day, { ...hours, open: e.target.value, close: hours?.close || '21:00' })}
                  className={cn('px-3 py-2 rounded-lg', ds.colors.bg.input, 'border', ds.colors.border.default, ds.typography.size.sm)}
                />
                <input
                  type="time"
                  value={hours?.close || '21:00'}
                  onChange={(e) => update(day, { ...hours, open: hours?.open || '09:00', close: e.target.value })}
                  className={cn('px-3 py-2 rounded-lg', ds.colors.bg.input, 'border', ds.colors.border.default, ds.typography.size.sm)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POLICY EDITOR (Simplified)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface PolicyEditorProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  template?: string;
  maxLength?: number;
}

export function SimplePolicy({ label, value, onChange, template, maxLength = 2000 }: PolicyEditorProps) {
  const [showTemplate, setShowTemplate] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const count = value.length;
  const warn = count > maxLength * 0.9;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={cn(ds.typography.size.xs, ds.typography.transform.uppercase, 'flex items-center gap-2')}>
          <FileText size={14} />
          {label}
        </label>
        <div className="flex items-center gap-2">
          <span className={cn(ds.typography.size.micro, warn ? 'text-orange-400' : ds.colors.text.quaternary)}>
            {count}/{maxLength}
          </span>
          {value && (
            <button type="button" onClick={copy} className="p-1 hover:bg-white/5 rounded">
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          )}
          {template && (
            <button
              type="button"
              onClick={() => setShowTemplate(!showTemplate)}
              className={cn('px-2 py-1 text-xs border rounded', ds.colors.border.default)}
            >
              {showTemplate ? 'Hide' : 'Template'}
            </button>
          )}
        </div>
      </div>

      {showTemplate && template && (
        <div className={cn('p-3 border rounded-lg', ds.colors.border.default, 'space-y-2')}>
          <button
            type="button"
            onClick={() => { onChange(template); setShowTemplate(false); }}
            className="px-3 py-1 bg-white text-black rounded text-xs"
          >
            Use Template
          </button>
          <pre className={cn('p-2 bg-black/20 rounded text-xs overflow-auto max-h-40')}>{template}</pre>
        </div>
      )}

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        rows={12}
        className={cn('w-full p-4 rounded-lg resize-y', ds.colors.bg.input, 'border', ds.colors.border.default, ds.typography.size.sm)}
        placeholder={`Enter your ${label.toLowerCase()}...`}
      />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CSS EDITOR (Simplified)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function SimpleCssEditor({ value, onChange, maxLength = 10000 }: { value: string; onChange: (v: string) => void; maxLength?: number }) {
  const [preview, setPreview] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validate = (css: string) => {
    const errs: string[] = [];
    if (css.includes('javascript:')) errs.push('JavaScript URLs not allowed');
    if (css.includes('<script')) errs.push('Script tags not allowed');
    if ((css.match(/!important/g) || []).length > 10) errs.push('Too many !important (max 10)');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleChange = (v: string | undefined) => {
    if (!v) return;
    const trimmed = v.slice(0, maxLength);
    onChange(trimmed);
    validate(trimmed);
  };

  const count = value.length;
  const warn = count > maxLength * 0.9;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={cn(ds.typography.size.xs, ds.typography.transform.uppercase, 'flex items-center gap-2')}>
          <Code size={14} />
          Custom CSS
        </label>
        <div className="flex items-center gap-2">
          <span className={cn(ds.typography.size.micro, warn ? 'text-orange-400' : ds.colors.text.quaternary)}>
            {count}/{maxLength}
          </span>
          <button type="button" onClick={() => setPreview(!preview)} className="p-1 hover:bg-white/5 rounded">
            {preview ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
          {errors.map((e, i) => <div key={i}>• {e}</div>)}
        </div>
      )}

      <div className="border border-white/10 rounded-lg overflow-hidden">
        <Editor
          height="400px"
          language="css"
          theme="vs-dark"
          value={value}
          onChange={handleChange}
          options={{ minimap: { enabled: false }, fontSize: 13, lineNumbers: 'on' }}
        />
      </div>

      {preview && value && (
        <div className={cn('p-4 border rounded-lg', ds.colors.border.default)}>
          <style dangerouslySetInnerHTML={{ __html: value }} />
          <div className="space-y-3">
            <div className="p-4 bg-white/5 border border-white/10 rounded">
              <h3>Sample Element</h3>
            </div>
            <button className="px-4 py-2 bg-blue-500 rounded">Sample Button</button>
          </div>
        </div>
      )}
    </div>
  );
}
